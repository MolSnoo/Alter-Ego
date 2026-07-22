// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Interactable from "./Interactables/Interactable.ts";
import type Action from "../Data/Action.ts";
import type Command from "./Command.ts";
import type Dialog from "../Data/Dialog.ts";
import type Game from "../Data/Game.ts";
import type GameEntity from "../Data/GameEntity.ts";
import type Narration from "../Data/Narration.ts";
import type Notification from "../Data/Notification.ts";
import type Player from "../Data/Player.ts";
import type Room from "../Data/Room.ts";
import { MessageDisplayType } from "../Modules/enums.ts";
import * as messageHandler from "../Modules/messageHandler.ts";
import { capitalizeFirstLetter } from "../Modules/helpers.ts";
import { ChannelType, Collection } from "discord.js";
import type { Attachment, Embed, EmbedBuilder, Snowflake, TextChannel } from "discord.js";

/**
 * A dialog message that has been mirrored in a spectate channel.
 */
interface DialogSpectateMirror {
    /** The ID of the mirrored dialog message. */
    messageId: Snowflake;
    /** The ID of the webhook used to send the mirrored message to the spectate channel. */
    webhookId: Snowflake;
}

/**
 * An interface for the message handler. Contains a number of functions that ensure actions won't be communicated multiple times in the same channel.
 */
export default class GameCommunicationHandler {
    /**
     * The game this belongs to.
     */
    readonly #game: Game;
    /**
     * A cache of recently-performed actions. This is used to ensure that actions are communicated only once in any given channel.
     */
    readonly #actionCache: Collection<string, Action>;
    /**
     * The maximum size of the actionCache.
     */
    readonly #actionCacheSizeLimit = 20;
    /**
     * A collection of mirrored dialog messages to allow edits to dialog messages to be reflected in spectate channels.
     * The key is the ID of the original message that's being mirrored.
     */
    readonly #dialogSpectateMirrorCache: Collection<string, DialogSpectateMirror[]>;
    /**
     * The maximum size of the dialogSpectateMirrorCache.
     */
    readonly #dialogSpectateMirrorCacheSizeLimit = 50;

    /**
     * @param game - The game this belongs to.
     */
    constructor(game: Game) {
        this.#game = game;
        this.#actionCache = new Collection();
        this.#dialogSpectateMirrorCache = new Collection();
    }

    /**
     * Returns the actionCache.
     */
    getActionCache() {
        return this.#actionCache;
    }

    /**
     * Adds an action to the cache. If the cache is at maximum capacity, removes the oldest one.
     * @param action - The action to cache.
     */
    #addActionToCache(action: Action) {
        if (this.#actionCache.size >= this.#actionCacheSizeLimit)
            this.#actionCache.delete(this.#actionCache.firstKey());
        this.#actionCache.set(action.id, action);
    }

    /**
     * Caches a channel for a given action.
     * @param action - The action to cache a channel for.
     * @param channelId - The channel to cache.
     */
    #cacheChannelFor(action: Action, channelId: string) {
        if (this.#actionCache.has(action.id))
            this.#actionCache.get(action.id).addToMirrors(channelId);
        else {
            action.addToMirrors(channelId);
            this.#addActionToCache(action);
        }
    }

    /**
     * Returns true if the action has already been communicated in the given channel.
     * Also returns true if the channel does not exist (e.g. for a player with no spectate channel).
     * @param channel - The channel to check for.
     * @param action - The action to check for.
     */
    #actionHasBeenCommunicatedInChannel(channel: Messageable, action: Action) {
        if (!channel) return true;
        return action.hasBeenCommunicatedIn(channel.id);
    }

    /**
     * Adds the message to the dialog cache.
     * @param message - The message that initiated the dialog.
     */
    cacheDialog(message: UserMessage) {
        if (this.#dialogSpectateMirrorCache.size >= this.#dialogSpectateMirrorCacheSizeLimit)
            this.#dialogSpectateMirrorCache.delete(this.#dialogSpectateMirrorCache.firstKey());
        this.#dialogSpectateMirrorCache.set(message.id, []);
    }

    /**
     * Adds a spectate mirror to the dialog cache for the given message.
     * @param message - The message being mirrored.
     * @param mirrorMessageId - The message ID of the spectate mirror.
     * @param mirrorWebhookId - The ID of the webhook that sent the spectate mirror.
     */
    cacheSpectateMirrorForDialog(message: UserMessage, mirrorMessageId: Snowflake, mirrorWebhookId: Snowflake) {
        const spectateMirrors = this.getDialogSpectateMirrors(message);
        if (spectateMirrors) spectateMirrors.push({ messageId: mirrorMessageId, webhookId: mirrorWebhookId });
    }

    /**
     * Returns the list of spectate mirrors for the given dialog message.
     * If the given dialog message isn't cached, returns undefined.
     * @param message - The message that was mirrored.
     */
    getDialogSpectateMirrors(message: UserMessage | import('discord.js').PartialMessage) {
        return this.#dialogSpectateMirrorCache.get(message.id);
    }

    /**
     * Returns true if the given message was sent in a room channel.
     * @param message
     */
    wasSentInRoomChannel(message: UserMessage) {
        if (message.channel.type !== ChannelType.GuildText) return false;
        return this.#game.guildContext.roomCategories.includes(message.channel.parentId);
    }

    /**
     * Returns true if the given message was sent in a room channel.
     * @param message
     */
    wasSentInWhisperChannel(message: UserMessage) {
        if (message.channel.type !== ChannelType.GuildText) return false;
        return message.channel.parentId === this.#game.guildContext.whisperCategoryId;
    }

    /**
     * Returns true if the given message was sent in a room channel.
     * @param message
     */
    wasSentInAnnouncementChannel(message: UserMessage) {
        if (message.channel.type !== ChannelType.GuildText) return false;
        return message.channel.id === this.#game.guildContext.announcementChannel.id;
    }

    /**
     * Replies to a message. This is usually done when a user has sent a message with an error.
     * @param message - The message to reply to.
     * @param messageText - The text of the message to send in response.
     */
    reply(message: UserMessage, messageText: string) {
        let member = this.#game.guildContext.guild.members.resolve(message.author.id);
        if (member && member.roles.cache.has(this.#game.guildContext.moderatorRole.id) && message.channel.id !== this.#game.guildContext.commandChannel.id && message.channel.type !== ChannelType.DM) {
            messageHandler.sendGameMechanicMessage(this.#game, this.#game.guildContext.commandChannel, `<@${message.author.id}>, ${messageText}`);
        } else {
            messageHandler.sendReply(this.#game, message, messageText);
        }
    }

    /**
     * Sends a message to the command channel.
     * @param messageText - The text of the message to send.
     * @param interactables - An array of interactables.
     */
    sendToCommandChannel(messageText: string, interactables: Interactable[] = []) {
        messageHandler.sendGameMechanicMessage(this.#game, this.#game.guildContext.commandChannel, messageText, interactables);
    }

    /**
     * Sends a message to a player without any checks.
     * @param player - The player to send the message to.
     * @param messageText - The text of the message to send.
     * @param mirrorInSpectateChannel - Whether or not to mirror the notification in their spectate channel. Defaults to true.
     * @param messageType - The type of message to send. Defaults to PLAIN_TEXT.
     * @param attachments - The attachments to send. Optional.
     * @param interactables - An array of interactables.
     */
    sendMessageToPlayer(player: Player, messageText: string, mirrorInSpectateChannel: boolean = true, messageType: MessageDisplayType = MessageDisplayType.PLAIN_TEXT, attachments?: Collection<string, Attachment>, interactables: Interactable[] = []) {
        if (messageText !== "")
            messageHandler.sendNotification(player, messageText, messageType, mirrorInSpectateChannel, attachments, interactables)
    }

    /**
     * Sends a description to a player without any checks.
     * @param player - The player to send the notification to.
     * @param descriptionString - The already parsed description.
     * @param container - The game entity the description belongs to.
     * @param messageDisplayType - The display type of the message to send. Defaults to PLAIN_TEXT. Does nothing when sending a room description.
     * @param mirrorInSpectateChannel - Whether or not to mirror the room description in their spectate channel. Defaults to true.
     * @param interactables[] - An array of interactables to send with the message.
     */
    sendDescriptionToPlayer(player: Player, descriptionString: string, container: GameEntity, messageDisplayType: MessageDisplayType = MessageDisplayType.PLAIN_TEXT, mirrorInSpectateChannel: boolean = true, interactables: Interactable[] = []) {
        this.sendMessageToPlayer(player, descriptionString, mirrorInSpectateChannel, messageDisplayType, new Collection(), interactables);
    }

    /**
     * Sends an already-parsed room description to the player.
     * @param player - The player to send the description to.
     * @param room - The room the description belongs to.
     * @param roomDescriptionString - The already parsed room description.
     * @param occupantsString - A list of occupants in the room.
     * @param defaultDropFixtureString - A string to describe the default drop fixture in this room.
     * @param interactables - An array of interactables to send with the message.
     */
    sendRoomDescriptionToPlayer(player: Player, room: Room, roomDescriptionString: string, occupantsString: string, defaultDropFixtureString: string, interactables: Interactable[] = []) {
        messageHandler.sendRoomDescription(player, room, roomDescriptionString, occupantsString, defaultDropFixtureString, true, interactables);
    }

    /**
     * Sends a move progress indicator to the given players.
     * @param players - The players to send the move progress indicator to.
     * @param progressIndicator - The content of the move progress indicator.
     */
    sendMoveProgressIndicatorToPlayers(players: Set<Player>, progressIndicator: string) {
        if (progressIndicator === "") return;
        for (const player of players)
            messageHandler.sendMoveProgressIndicatorMessage(player, progressIndicator);
    }

    /**
     * Sends a notification to a player.
     * @param notification - The text of the notification to send.
     */
    notifyPlayer(notification: Notification) {
        if (!this.#actionHasBeenCommunicatedInChannel(notification.player.notificationChannel, notification.action)) {
            this.#cacheChannelFor(notification.action, notification.player.notificationChannel.id);
            this.sendMessageToPlayer(notification.player, notification.content, false, notification.messageDisplayType, notification.attachments, notification.interactables);
            if (notification.mirrorInSpectateChannel)
                this.mirrorNarrationInSpectateChannel(notification.player, notification.action, notification.messageDisplayType, notification.content, notification.attachments.map(attachment => attachment.url));
        }
    }

    /**
     * Mirrors dialog in a player's spectate channel.
     * @param player - The player whose spectate channel this dialog will be mirrored in.
     * @param action - The action associated with the dialog.
     * @param dialog - The dialog that was spoken.
     * @param webhookUsername - The username to use for the mirrored webhook message. Defaults to the dialog speaker's display name.
     * @param webhookAvatarURL - The avatar URL to use for the mirrored webhook message. Defaults to the dialog speaker's display icon.
     * @param messageText - The text of the message to send. Defaults to the content of the dialog.
     * @param notification - A custom notification that will be sent to the player afterwards. Optional. This notification will not be mirrored in the spectate channel.
     */
    mirrorDialogInSpectateChannel(player: Player, action: Action, dialog: Dialog, webhookUsername: string = capitalizeFirstLetter(dialog.speakerDisplayName), webhookAvatarURL: string = dialog.speakerDisplayIcon, messageText: string = dialog.content, notification?: string) {
        if (!this.#actionHasBeenCommunicatedInChannel(player.spectateChannel, action)) {
            this.#cacheChannelFor(action, player.spectateChannel.id);
            if (!dialog.isOOCMessage) messageHandler.sendWebhookSpectateMessage(player, messageText, webhookUsername, webhookAvatarURL, dialog.embeds, dialog.attachments.map(attachment => attachment.url), dialog.message);
            if (notification) this.#game.narrationHandler.sendNotification(player, action, notification, MessageDisplayType.PLAIN_TEXT, false);
        }
    }

    /**
     * Mirrors a message in a player's spectate channel.
     * @param player - The player whose spectate channel this message is being sent to.
     * @param action - The action associated with the message.
     * @param webhookUsername - The username to use for the mirrored webhook message.
     * @param webhookAvatarURL - The avatar URL to use for the mirrored webhook message.
     * @param messageText - The text of the message to send.
     * @param messageDisplayType - The type of message to send.
     * @param embeds - An array of embeds to send in the message. Optional.
     * @param files - An array of URLs to send as attachments. Optional.
     * @param message - The message being mirrored. Optional.
     */
    mirrorWebhookMessageInSpectateChannel(player: Player, action: Action, webhookUsername: string, webhookAvatarURL: string, messageText: string, messageDisplayType: MessageDisplayType, embeds?: Embed[], files?: string[], message?: UserMessage) {
        if (!this.#actionHasBeenCommunicatedInChannel(player.spectateChannel, action)) {
            this.#cacheChannelFor(action, player.spectateChannel.id);
            messageHandler.sendWebhookSpectateMessage(player, messageText, webhookUsername, webhookAvatarURL, embeds, files, message, messageDisplayType);
        }
    }

    /**
     * Mirrors a narration in a player's spectate channel.
     * @param player - The player whose spectate channel this narration will be mirrored in.
     * @param action - The action associated with the narration.
     * @param messageDisplayType - The display type of the message to send.
     * @param narrationText - The text of the narration to send.
     * @param files - An array of URLs to send as attachments. Optional.
     */
    mirrorNarrationInSpectateChannel(player: Player, action: Action, messageDisplayType: MessageDisplayType, narrationText: string, files?: string[]) {
        if (!this.#actionHasBeenCommunicatedInChannel(player.spectateChannel, action)) {
            this.#cacheChannelFor(action, player.spectateChannel.id);
            messageHandler.sendNarrationSpectateMessage(player, narrationText, messageDisplayType, files);
        }
    }

    /**
     * Mirrors a narration in a player's spectate channel as a webhook message.
     * @param player - The player whose spectate channel this narration will be mirrored in.
     * @param action - The action associated with the narration.
     * @param narration - The narration that was written.
     * @param webhookUsername - A custom username to use for the webhook that will send the spectate message.
     * @param webhookAvatarURL - A custom avatar URL to use for the webhook that will send the spectate message.
     * @param narrationText - The custom text of the narration to send. Optional.
     */
    mirrorWebhookNarrationInSpectateChannel(player: Player, action: Action, narration: Narration, webhookUsername: string, webhookAvatarURL: string, narrationText: string = narration.content) {
        if (narration.isOOCMessage) return;
        this.mirrorWebhookMessageInSpectateChannel(player, action, webhookUsername, webhookAvatarURL, narrationText, narration.messageDisplayType, narration.embeds, narration.attachments.map(attachment => attachment.url), narration.message);
    }

    /**
     * Sends a narration to a room channel and mirrors it in the spectate channels of all of the room's occupants.
     * @param narration - The narration to send.
     * @param narrationText - The custom text of the narration to send. Optional.
     * @param mirrorInSpectateChannel - Whether or not to mirror the notification in spectate channels. Defaults to true.
     * @param room - The room to send the narration to. Defaults to the location of the narration.
     * @param webhookUsername - The username to use for the narrated webhook message, if applicable.
     */
    narrateInRoom(narration: Narration, narrationText: string = narration.content, mirrorInSpectateChannel: boolean = true, room: Room = narration.location, webhookUsername?: string) {
        if (!narration.action || !this.#actionHasBeenCommunicatedInChannel(room.channel, narration.action)) {
            if (narration.action) this.#cacheChannelFor(narration.action, room.channel.id);
            messageHandler.sendNarrationToRoom(room, narration, narrationText, narration.messageDisplayType, mirrorInSpectateChannel, narration.player, webhookUsername);
        }
    }

    /**
     * Sends a narration to a whisper channel and mirrors it in the spectate channels of all the whisper's players.
     * @param narration - The narration to send.
     * @param narrationText - The custom text of the narration to send. Optional.
     * @param mirrorInSpectateChannel - Whether or not to mirror the notification in spectate channels. Defaults to true.
     */
    narrateInWhisper(narration: Narration, narrationText: string = narration.content, mirrorInSpectateChannel: boolean = true) {
        if (!narration.action || !this.#actionHasBeenCommunicatedInChannel(narration.whisper.channel, narration.action)) {
            if (narration.action) this.#cacheChannelFor(narration.action, narration.whisper.channel.id);
            messageHandler.sendNarrationToWhisper(narration.whisper, narration, narrationText, narration.getWhisperPrefixString(), narration.messageDisplayType, mirrorInSpectateChannel);
        }
    }

    /**
     * Sends the help menu for a command.
     * @param channel - The channel to send the help menu to.
     * @param command - The command to send the help menu for.
     */
    sendCommandHelp(channel: Messageable, command: Command) {
        messageHandler.sendCommandHelp(this.#game, channel, command);
    }

    /**
     * Sends the view of a game entity as an array of Discord components.
     * @param entityType - The type of entity this view is for.
     * @param entityRow - The row number of this entity.
     * @param fields - An array of view fields to convert into components.
     * @param interactables - An array of interactables.
     */
    sendEntityView(entityType: PersistentGameEntityName, entityRow: number, fields: ViewField[], interactables: Interactable[] = []) {
        messageHandler.sendEntityView(this.#game, this.#game.guildContext.commandChannel, entityType, entityRow, fields, interactables);
    }

    /**
     * Sends a message to the given channel as a game mechanic message.
     * @param channel - The channel to send the message to.
     * @param messageText - The text of the message to send.
     * @param embeds - The embeds to send.
     * @param interactables - An array of interactables.
     */
    sendToChannel(channel: Messageable, messageText: string = "", embeds: (Embed | EmbedBuilder)[] = [], interactables: Interactable[] = []) {
        messageHandler.sendGameMechanicMessage(this.#game, channel, messageText, interactables, embeds);
    }

    /**
     * Sends a message to the log channel.
     * @param logText - The message of the text to send.
     */
    sendLogMessage(logText: string) {
        messageHandler.sendLogMessage(this.#game, logText);
    }

    /**
     * Sends dialog as a webhook message to the specified channel.
     * @param dialog - The dialog to send.
     * @param channel - The channel to send the webhook message to.
     * @param webhookUsername - A custom username to use for the webhook that will send the spectate message. Optional.
     * @param webhookAvatarURL - A custom avatar URL to use for the webhook that will send the spectate message. Optional.
     * @param isDialogMirror - Whether the sent webhook message is mirroring the given dialog message. Defaults to false.
     * @returns The created webhook message.
     */
    async sendDialogAsWebhook(channel: TextChannel, dialog: Dialog, webhookUsername: string = dialog.speakerDisplayName, webhookAvatarURL: string = dialog.speakerDisplayIcon, isDialogMirror = false) {
        const webhook = await messageHandler.getOrCreateWebhook(channel);
        const webhookMessage = await messageHandler.sendWebhookMessage(
            webhook,
            dialog.content,
            webhookUsername,
            webhookAvatarURL,
            dialog.embeds,
            dialog.attachments.map(attachment => attachment.url),
            dialog.getGame(),
            MessageDisplayType.PLAIN_TEXT,
            dialog.speaker
        );
        if (isDialogMirror && dialog.message) this.cacheSpectateMirrorForDialog(dialog.message, webhookMessage.id, webhook.id);
        return webhookMessage;
    }
}
