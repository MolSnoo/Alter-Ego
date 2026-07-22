// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Dialog from '../Data/Dialog.ts';
import AnnounceAction from '../Data/Actions/AnnounceAction.ts';
import NarrateAction from '../Data/Actions/NarrateAction.ts';
import SayAction from '../Data/Actions/SayAction.ts';
import * as discordUtils from './discordUtils.ts';
import { MessageDisplayType } from './enums.ts';
import { capitalizeFirstLetter } from './helpers.ts';
import {
    type Message,
    MessageFlags,
    ChannelType,
    type Attachment,
    Collection,
    type TextChannel,
    type Embed,
    type Webhook,
    ComponentType,
    type EmbedBuilder,
    type WebhookMessageCreateOptions,
    type MessageCreateOptions,
    type PartialMessage
} from 'discord.js';
import type Game from '../Data/Game.ts';
import type Room from '../Data/Room.ts';
import type Narration from '../Data/Narration.ts';
import type Player from '../Data/Player.ts';
import type Whisper from '../Data/Whisper.ts';
import type Interactable from '../Classes/Interactables/Interactable.ts';
import type Command from '../Classes/Command.ts';

/**
 * Processes a message sent in a guild during a game and directs it to the relevant handlers.
 * @param game - The game the message is intended for.
 * @param message - The message to process.
 */
export function processIncomingMessage(game: Game, message: UserMessage): void {
    if (message.channel.type !== ChannelType.GuildText) return;
    const isInWhisperChannel = message.channel.parentId === game.guildContext.whisperCategoryId;
    const isInAnnouncementChannel = message.channel.id === game.guildContext.announcementChannel.id;
    const isInRoomChannel = game.guildContext.roomCategories.includes(message.channel.parentId);
    if (!isInWhisperChannel && !isInAnnouncementChannel && !isInRoomChannel) return;

    game.communicationHandler.cacheDialog(message);

    const isModerator = message.member && message.member.roles.cache.has(game.guildContext.moderatorRole.id);
    const room = game.entityFinder.getRoom(message.channel.name);
    const whisper = game.entityFinder.getWhisperByChannelId(message.channel.id);
    const player = game.entityFinder.getLivingPlayerById(message.author.id);

    // Forwarded messages should be deleted.
    if (message.flags.has(MessageFlags.HasSnapshot)) {
        const errorMessage = `You cannot forward messages to game channels.`;
        game.communicationHandler.reply(message, errorMessage);
        message.delete().catch();
        return;
    }

    if (player) {
        player.setOnline();
        const playerNoSpeechStatusEffects = player.getBehaviorAttributeStatusEffects("no speech");
        if (playerNoSpeechStatusEffects.length > 0) {
            game.communicationHandler.sendMessageToPlayer(player, game.notificationGenerator.generatePlayerNoSpeechNotification(playerNoSpeechStatusEffects[0].id), false, MessageDisplayType.ALERT);
            message.delete().catch();
            return;
        }
        const location = isInAnnouncementChannel || isInWhisperChannel ? player.location : room;
        const dialog = new Dialog(game, message, player, location, message.content, isInAnnouncementChannel, whisper, message.cleanContent);
        if (dialog.isAnnouncement) {
            const announceAction = new AnnounceAction(game, message, dialog.speaker, dialog.location, false, dialog.whisper);
            announceAction.performAnnounce(dialog);
        }
        else {
            const sayAction = new SayAction(game, message, dialog.speaker, dialog.location, false, dialog.whisper);
            sayAction.performSay(dialog);
        }
    }
    else if (isModerator && (room || whisper)) {
        const moderator = game.entityLoader.getOrCreateModerator(message.member);
        if (moderator.sentMessageInLatchChannel(message) && !message.content.startsWith("(")) {
            const npc = moderator.getLatch();
            const dialog = new Dialog(game, message, npc, npc.location, message.content, false, whisper, message.cleanContent);
            const channel = whisper ? whisper.channel : npc.location.channel;
            game.communicationHandler.sendDialogAsWebhook(channel, dialog, dialog.getDisplayNameForWebhook(!!whisper), dialog.getDisplayIconForWebhook(!!whisper)).then(dialogMessage => {
                dialog.setMessage(dialogMessage);
                const sayAction = new SayAction(game, dialogMessage, npc, npc.location, true, whisper);
                sayAction.performSay(dialog);
                message.delete().catch();
            });
        }
        else {
            const location = whisper ? whisper.location : room;
            const narrateAction = new NarrateAction(game, message, undefined, location, false, whisper);
            game.narrationHandler.sendNarrateAction(MessageDisplayType.PLAIN_TEXT, narrateAction, message.content, moderator);
        }
    }
}

/**
 * Narrates a message to a room.
 * @param room - The room to send the message to.
 * @param narration - The narration being sent.
 * @param messageText - The message to send.
 * @param messageDisplayType - The display type of the message to send.
 * @param addSpectate - Whether or not to mirror the message in spectate channels. Defaults to true.
 * @param player - The player whose action the narration is about, if applicable.
 * @param webhookUsername - The username to use for the narrated webhook message, if applicable.
 */
export function sendNarrationToRoom(
    room: Room,
    narration: Narration,
    messageText: string,
    messageDisplayType: typeof MessageDisplayType[keyof typeof MessageDisplayType],
    addSpectate: boolean = true,
    player: Player = null,
    webhookUsername: string = narration.narratorDisplayName
): void {
    if (messageText !== "") {
        const files = narration.attachments.map(attachment => attachment.url);
        const sendWebhookMessage = messageDisplayType === MessageDisplayType.PLAYER || narration.isModeratorNarration();
        let messageCreateOptions: MessageCreateOptions | WebhookMessageCreateOptions;
        if (sendWebhookMessage)
            messageCreateOptions = discordUtils.generateWebhookMessageDisplayCreateOptions(messageDisplayType, room.getGame(), messageText, webhookUsername, narration.narratorDisplayIcon, narration.embeds, files, player);
        else messageCreateOptions = discordUtils.generateMessageDisplayCreateOptions(messageDisplayType, room.getGame(), messageText, player);

        room.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    if (sendWebhookMessage) {
                        const webhook = await getOrCreateWebhook(room.channel);
                        const webhookMessage = await webhook.send(messageCreateOptions);
                        if (narration.message && webhookMessage) room.getGame().communicationHandler.cacheSpectateMirrorForDialog(narration.message, webhookMessage.id, webhook.id);
                    }
                    else await room.channel.send(messageCreateOptions);
                },
                destination: room.channel.id
            },
            "tell"
        );
        if (addSpectate) {
            room.occupants.forEach(occupant => {
                if (doMirrorInSpectateChannel(occupant, player)) {
                    sendNarrationSpectateMessage(occupant, messageText, messageDisplayType, files, messageCreateOptions);
                }
            });
        }
    }
}

/**
 * Narrates a message to a whisper.
 * @param whisper - The whisper to send the message to.
 * @param narration - The narration being sent.
 * @param messageText - The message to send.
 * @param messageTextWithSpectatePrefix - The message to send with a prefix for spectate channels indicating which whisper the narration occurred in.
 * @param messageDisplayType - The display type of the message to send.
 * @param addSpectate - Whether or not to mirror the message in spectate channels. Defaults to true.
 * @param player - The player whose action the narration is about, if applicable.
 */
export function sendNarrationToWhisper(
    whisper: Whisper,
    narration: Narration,
    messageText: string,
    messageTextWithSpectatePrefix: string,
    messageDisplayType: typeof MessageDisplayType[keyof typeof MessageDisplayType],
    addSpectate: boolean = true,
    player: Player = null
): void {
    if (messageText !== "") {
        const files = narration.attachments.map(attachment => attachment.url);
        const sendWebhookMessage = messageDisplayType === MessageDisplayType.PLAYER;

        whisper.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    if (whisper.deleted) return;
                    let messageCreateOptions: MessageCreateOptions | WebhookMessageCreateOptions;
                    if (sendWebhookMessage) {
                        messageCreateOptions = discordUtils.generateWebhookMessageDisplayCreateOptions(messageDisplayType, whisper.getGame(), messageText, narration.narratorDisplayName, narration.narratorDisplayIcon, narration.embeds, files, player);
                        const webhook = await getOrCreateWebhook(whisper.channel);
                        webhook.send(messageCreateOptions);
                    }
                    else {
                        messageCreateOptions = discordUtils.generateMessageDisplayCreateOptions(messageDisplayType, whisper.getGame(), messageText, player);
                        await whisper.channel.send(messageCreateOptions);
                    }
                },
                destination: whisper.channel.id
            },
            "tell"
        );
        if (addSpectate) {
            whisper.players.forEach(player => {
                if (player.canSee() && player.isConscious() && player.spectateChannel !== null) {
                    let messageCreateOptions: MessageCreateOptions | WebhookMessageCreateOptions;
                    if (sendWebhookMessage)
                        messageCreateOptions = discordUtils.generateWebhookMessageDisplayCreateOptions(messageDisplayType, whisper.getGame(), messageTextWithSpectatePrefix, narration.narratorDisplayName, narration.narratorDisplayIcon, [], [], player);
                    else messageCreateOptions = discordUtils.generateMessageDisplayCreateOptions(messageDisplayType, whisper.getGame(), messageTextWithSpectatePrefix);
                    sendNarrationSpectateMessage(player, messageText, messageDisplayType, files, messageCreateOptions);
                }
            });
        }
    }
}

/**
 * Sends a notification message to a player.
 * @param player - The player to send the message to.
 * @param messageText - The message to send.
 * @param messageDisplayType - The display type of the message to send.
 * @param addSpectate - Whether or not to mirror the message in spectate channels. Defaults to true.
 * @param attachments - A collection of attachments to send, if any.
 * @param interactables - An array of interactables.
 */
export function sendNotification(
    player: Player,
    messageText: string,
    messageDisplayType: typeof MessageDisplayType[keyof typeof MessageDisplayType],
    addSpectate: boolean = true,
    attachments: Collection<string, Attachment> = new Collection(),
    interactables: Interactable[] = []
): void {
    const files = attachments.map(attachment => attachment.url);

    if (!player.isNPC) {
        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    const message = await player.notificationChannel.send(
                        discordUtils.generateMessageDisplayCreateOptions(messageDisplayType, player.getGame(), messageText, player, files, interactables),
                    );
                    if (message && interactables.length > 0)
                        player.getGame().clientContext.interactableManager.addInteractableMessage(player.notificationChannel.id, message.id, interactables.map(interactable => interactable.customId));
                },
                destination: player.notificationChannel.id
            },
            "tell"
        );
    }
    if (addSpectate && player.spectateChannel !== null) {
        sendNarrationSpectateMessage(player, messageText, messageDisplayType, files, discordUtils.generateMessageDisplayCreateOptions(messageDisplayType, player.getGame(), messageText, player, files));
    }
}

/**
 * Sends the room description to a player as an array of Discord Components.
 * @param player - The player to send the message to.
 * @param location - The room whose description is being sent.
 * @param descriptionText - The description of the room to send.
 * @param occupantsString - The list of occupants in the room.
 * @param defaultDropFixtureText - The description of the default drop fixture in this room.
 * @param addSpectate - Whether or not to mirror the message in spectate channels. Defaults to true.
 * @param interactables - An array of interactables.
 */
export function sendRoomDescription(
    player: Player,
    location: Room,
    descriptionText: string,
    occupantsString: string,
    defaultDropFixtureText: string,
    addSpectate: boolean = true,
    interactables: Interactable[] = []
): void {
    if (!player.isNPC || (addSpectate && player.spectateChannel !== null)) {
        if (!player.isNPC) {
            location.getGame().messageQueue.enqueue(
                {
                    fire: async () => {
                        const message = await player.notificationChannel.send({
                            components: discordUtils.createRoomDescriptionComponents(location, descriptionText, occupantsString, defaultDropFixtureText, location.getGame().settings.embedAccentColor, interactables),
                            flags: MessageFlags.IsComponentsV2,
                        });
                        if (message && interactables.length > 0)
                            player.getGame().clientContext.interactableManager.addInteractableMessage(player.notificationChannel.id, message.id, interactables.map(interactable => interactable.customId));
                    },
                    destination: player.notificationChannel.id
                },
                "tell"
            );
        }
        if (addSpectate && player.spectateChannel !== null) {
            location.getGame().messageQueue.enqueue(
                {
                    fire: async () => {
                        await player.spectateChannel.send({
                            components: discordUtils.createRoomDescriptionComponents(location, descriptionText, occupantsString, defaultDropFixtureText, location.getGame().settings.embedAccentColor),
                            flags: MessageFlags.IsComponentsV2,
                        });
                    },
                    destination: player.spectateChannel.id
                },
                "spectator"
            );
        }
    }
}

/**
 * Edits the given message to remove its interactable components.
 * @param message - The message to remove interactable components from.
 */
export function removeInteractablesFromMessage(message: Message): void {
    message.edit({ components: message.components.filter(component => component.type !== ComponentType.ActionRow) });
}

/**
 * Sends the help menu for a command as an array of Discord Components.
 * @param game - The game context in which this help menu is being sent.
 * @param channel - The channel to send the help menu to.
 * @param command - The command to display the help menu for.
 */
export function sendCommandHelp(game: Game, channel: Messageable, command: Command): void {
    const commandName = capitalizeFirstLetter(command.config.name.substring(0, command.config.name.indexOf('_')));
    const title = `**${commandName} Command Help**`;
    const description = command.config.description;
    let aliasString = "";
    for (const alias of command.config.aliases) aliasString += `\`${game.settings.commandPrefix}${alias}\` `;
    const usage = command.usage(game.settings);
    const details = command.config.details;
    const thumbnailURL = game.guildContext.guild.members.me.avatarURL() || game.guildContext.guild.members.me.user.avatarURL();
    const color = game.settings.embedAccentColor;

    game.messageQueue.enqueue(
        {
            fire: async () => {
                await channel.send({
                    components: discordUtils.createCommandHelpComponents(title, description, aliasString, usage, details, thumbnailURL, color),
                    flags: MessageFlags.IsComponentsV2,
                });
            },
            destination: channel.id
        },
        channel.id === game.guildContext.commandChannel.id ? "mod" : "mechanic"
    );
}

/**
 * Sends the view of a game entity as an array of Discord components.
 * @param game - The game context in which this help menu is being sent.
 * @param channel - The channel to send the view to.
 * @param entityType - The type of entity this view is for.
 * @param entityRow - The row number of this entity.
 * @param fields - An array of view fields to convert into components.
 * @param interactables - An array of interactables.
 */
export function sendEntityView(
    game: Game,
    channel: Messageable,
    entityType: PersistentGameEntityName,
    entityRow: number,
    fields: ViewField[],
    interactables: Interactable[] = []
): void {
    const color = game.settings.embedAccentColor;
    game.messageQueue.enqueue(
        {
            fire: async () => {
                const message = await channel.send({
                    components: discordUtils.createEntityViewComponents(entityType, entityRow, fields, color, interactables),
                    flags: MessageFlags.IsComponentsV2
                });
                if (message && interactables.length > 0)
                    game.clientContext.interactableManager.addInteractableMessage(channel.id, message.id, interactables.map(interactable => interactable.customId));
            },
            destination: channel.id
        },
        channel.id === game.guildContext.commandChannel.id ? "mod" : "mechanic"
    )
}

/**
 * Sends a message to the game's log channel.
 * @param game - The game in which to send a log message.
 * @param messageText - The message to send.
 */
export function sendLogMessage(game: Game, messageText: string): void {
    game.messageQueue.enqueue(
        {
            fire: async () => {
                await game.guildContext.logChannel.send(messageText);
            },
            destination: game.guildContext.logChannel.id
        },
        "log"
    );
}

/**
 * Sends a standard message indicating the outcome of a game mechanic in the specified channel.
 * @param game - The game in which this mechanic is occurring.
 * @param channel - The channel to send the message to.
 * @param messageText - The message to send.
 * @param interactables - An array of interactables.
 * @param embeds - The embeds to send.
 */
export function sendGameMechanicMessage(
    game: Game,
    channel: Messageable,
    messageText: string,
    interactables: Interactable[] = [],
    embeds: (Embed|EmbedBuilder)[] = []
): void {
    const messageCreateOptions = interactables.length > 0 ? discordUtils.generateMessageDisplayCreateOptions(MessageDisplayType.PLAIN_TEXT, game, messageText, undefined, undefined, interactables, embeds) : messageText;
    game.messageQueue.enqueue(
        {
            fire: async () => {
                const message = await channel.send(messageCreateOptions);
                if (message && interactables.length > 0)
                    game.clientContext.interactableManager.addInteractableMessage(channel.id, message.id, interactables.map(interactable => interactable.customId));
            },
            destination: channel.id
        },
        channel.id === game.guildContext.commandChannel.id ? "mod" : "mechanic"
    );
}

/**
 * Replies to a message. This is usually done when a user has sent a message with an error.
 * @param game - The game this message was sent in.
 * @param message - The message to reply to.
 * @param messageText - The text to send in response.
 */
export function sendReply(game: Game, message: UserMessage, messageText: string): void {
    game.messageQueue.enqueue(
        {
            fire: async () => {
                if (message.channel.type === ChannelType.GuildText && message.channel.id === game.guildContext.commandChannel.id) {
                    await message.reply(messageText);
                }
                else {
                    await message.author.send(messageText);
                }
            },
            destination: message.channel.id
        },
        message.channel.type === ChannelType.GuildText && message.channel.id === game.guildContext.commandChannel.id ? "mod" : "mechanic"
    );
}

/**
 * Mirrors a narration in a spectate channel.
 * @param player - The player whose spectate channel this message is being sent to.
 * @param messageText - The text of the message to send.
 * @param messageDisplayType - The type of message to send.
 * @param files - A collection of attachments to send, if any.
 * @param messageCreateOptions - The message create options to send. Optional.
 */
export function sendNarrationSpectateMessage(
    player: Player,
    messageText: string,
    messageDisplayType: typeof MessageDisplayType[keyof typeof MessageDisplayType],
    files: string[] = [],
    messageCreateOptions: MessageCreateOptions | WebhookMessageCreateOptions = discordUtils.generateMessageDisplayCreateOptions(messageDisplayType, player.getGame(), messageText, player, files)
): void {
    player.getGame().messageQueue.enqueue(
        {
            fire: async () => {
                const sendWebhookMessage = messageDisplayType === MessageDisplayType.PLAYER;
                if (sendWebhookMessage) {
                    const webhook = await getOrCreateWebhook(player.spectateChannel);
                    await webhook.send(messageCreateOptions);
                }
                else await player.spectateChannel.send(messageCreateOptions);
            },
            destination: player.spectateChannel.id
        },
        "spectator"
    );
}

/**
 * Mirrors a message in a spectate channel as a webhook.
 * @param player - The player whose spectate channel this message is being sent to.
 * @param messageText - The text of the message to send.
 * @param webhookUsername - The username to use for the mirrored webhook message.
 * @param webhookAvatarURL - The avatar URL to use for the mirrored webhook message.
 * @param embeds - An array of embeds to send in the message. Optional.
 * @param files - An array of URLs to send as attachments. Optional.
 * @param message - The message being mirrored. Optional.
 * @param messageDisplayType - The type of message to send. Defaults to PLAIN_TEXT.
 * @param speaker - The player who initiated the webhook message. Optional.
 */
export function sendWebhookSpectateMessage(
    player: Player,
    messageText: string,
    webhookUsername: string,
    webhookAvatarURL: string,
    embeds: Embed[] = [],
    files: string[] = [],
    message?: UserMessage,
    messageDisplayType: typeof MessageDisplayType[keyof typeof MessageDisplayType] = MessageDisplayType.PLAIN_TEXT,
    speaker?: Player
): void {
    if (player.spectateChannel !== null) {
        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    const webhook = await getOrCreateWebhook(player.spectateChannel);
                    const webhookMessage = await sendWebhookMessage(webhook, messageText, webhookUsername, webhookAvatarURL, embeds, files, player.getGame(), messageDisplayType, speaker);
                    if (message) player.getGame().communicationHandler.cacheSpectateMirrorForDialog(message, webhookMessage.id, webhook.id);
                },
                destination: player.spectateChannel.id
            },
            "spectator"
        );
    }
}

/**
 * Edits spectate messages when the dialog they mirror is edited.
 * @param game - The game this dialog belongs to.
 * @param messageOld - The original message being edited.
 * @param messageNew - The new message after being edited.
 */
export function editSpectatorMessage(game: Game, messageOld: UserMessage | PartialMessage, messageNew: UserMessage): void {
    const spectateMirrors = game.communicationHandler.getDialogSpectateMirrors(messageOld);
    if (!spectateMirrors) return;
    spectateMirrors.forEach(async mirror => {
        const webhook = await messageOld.client.fetchWebhook(mirror.webhookId);
        if (webhook) {
            let messageText = messageNew.content;
            if (messageOld.channel.type === ChannelType.GuildText && messageOld.channel.parentId === game.guildContext.whisperCategoryId) {
                const relatedMessage = await webhook.fetchMessage(mirror.messageId);
                const regexGroups = relatedMessage.content.match(new RegExp(/((?:-# )?\*\(Whispered(?:.*)\):\*\n)(.*)/m));
                if (regexGroups) messageText = regexGroups[1] + messageNew.content;
            }
            /**
             * @privateRemarks
             * for review by VM: here, we utilize the webhook ID as the destination, rather than the message channel ID.
             * typically for editing messages, you should always utilize the message channel ID, unless it is a webhook,
             * in which case it is safe to use the webhook ID, as chronology of editing messages is not as important as
             * the chronology of sending messages.
             * - AC
             */
            game.editQueue.enqueue({
                fire: async () => { await webhook.editMessage(mirror.messageId, { content: messageText }); },
                destination: webhook.id
            }, "standard");
            
        }
    });
}

/**
 * Deletes spectate messages when the dialog they mirror is deleted.
 * @param game - The game this dialog belongs to.
 * @param message - The message being deleted.
 */
export function deleteSpectatorMessage(game: Game, message: UserMessage | PartialMessage): void {
    const spectateMirrors = game.communicationHandler.getDialogSpectateMirrors(message);
    if (!spectateMirrors) return;
    spectateMirrors.forEach(async mirror => {
        const webhook = await message.client.fetchWebhook(mirror.webhookId);
        webhook.deleteMessage(mirror.messageId);
    });
}

/**
 * Gets the client's webhook for the given channel, or creates one if it doesn't exist already.
 * @param channel - The channel to get or create a webhook for.
 */
export async function getOrCreateWebhook(channel: TextChannel): Promise<Webhook> {
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(webhook => webhook.owner.id === channel.client.user.id);
    if (webhook === undefined) webhook = await channel.createWebhook({ name: channel.name });
    return webhook;
}

/**
 * Sends a webhook message in the specified channel.
 * @param webhook - The channel to send the webhook message to.
 * @param content - The content of the message to send.
 * @param username - The username of the webhook message.
 * @param avatarURL - The URL of the icon to use for the webhook message.
 * @param embeds - An array of embeds to send in the message. Optional.
 * @param files - An array of URLs to send as attachments. Optional.
 * @param game - The game the message is for. Optional.
 * @param messageDisplayType - The type of message to send. Defaults to PLAIN_TEXT.
 * @param player - The player who initiated the webhook message. Optional.
 */
export async function sendWebhookMessage(
    webhook: Webhook,
    content: string,
    username: string,
    avatarURL: string,
    embeds: Embed[] = [],
    files: string[] = [],
    game?: Game,
    messageDisplayType: typeof MessageDisplayType[keyof typeof MessageDisplayType] = MessageDisplayType.PLAIN_TEXT,
    player?: Player
): Promise<Message<true>> {
    const createdMessage = await webhook.send(discordUtils.generateWebhookMessageDisplayCreateOptions(messageDisplayType, game, content, username, avatarURL, embeds, files, player));
    return createdMessage;
}

/**
 * @param game - The game whose message queue should have its messages sent.
 */
export async function sendQueuedMessages(game: Game): Promise<void> {
    await game.messageQueue.process();
}

/**
 * @param game - The game whose message queue should be emptied.
 */
export function clearQueue(game: Game): void {
    game.messageQueue.clear();
}

/**
 * Returns true if the message should be mirrored in the given player's spectate channel.
 * @param player - The player whose spectate channel the message would be mirrored in.
 * @param performer - The player who performed the action.
 */
function doMirrorInSpectateChannel(player: Player, performer: Player): boolean {
    return (
        (performer === null || performer.name !== player.name)
        && (!player.hasBehaviorAttribute("no channel") || player.hasBehaviorAttribute("see room"))
        && player.canSee()
        && player.isConscious()
        && player.spectateChannel !== null
    );
}
