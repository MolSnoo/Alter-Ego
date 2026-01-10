import Dialog from '../Data/Dialog.js';
import Player from '../Data/Player.js';
import AnnounceAction from '../Data/Actions/AnnounceAction.js';
import NarrateAction from '../Data/Actions/NarrateAction.js';
import SayAction from '../Data/Actions/SayAction.js';
import { TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ChannelType, Attachment, Collection, GuildMember, TextChannel, Embed, Webhook } from 'discord.js';

/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Narration.js').default} Narration */
/** @typedef {import('../Data/Room.js').default} Room */
/** @typedef {import('../Data/Whisper.js').default} Whisper */

/**
 * Processes a message sent in a guild during a game and directs it to the relevant handlers.
 * @param {Game} game - The game the message is intended for.
 * @param {UserMessage} message - The message to process.
 */
export async function processIncomingMessage(game, message) {
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
    if (player) {
        player.setOnline();
        const playerNoSpeechStatusEffects = player.getBehaviorAttributeStatusEffects("no speech");
        if (playerNoSpeechStatusEffects.length > 0) {
            player.notify(game.notificationGenerator.generatePlayerNoSpeechNotification(playerNoSpeechStatusEffects[0].id), false);
            message.delete().catch();
            return;
        }
        const location = isInAnnouncementChannel ? player.location : room;
        const dialog = new Dialog(game, message, player, location, message.cleanContent, isInAnnouncementChannel, whisper);
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
        const location = whisper ? whisper.location : room;
        const narrateAction = new NarrateAction(game, message, undefined, location, false, whisper);
        game.narrationHandler.sendNarration(narrateAction, message.content, message.member);
    }
}

/**
 * Narrates a message to a room.
 * @param {Room} room - The room to send the message to.
 * @param {string} messageText - The message to send.
 * @param {boolean} [addSpectate] - Whether or not to mirror the message in spectate channels. Defaults to true.
 * @param {Player} [speaker] - The player who originally spoke the dialog, if applicable.
 */
export async function addNarration(room, messageText, addSpectate = true, speaker = null) {
    if (messageText !== "") {
        room.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    await room.channel.send(messageText);
                },
            },
            "tell"
        );
        if (addSpectate) {
            room.occupants.forEach((player) => {
                if (
                    (speaker === null || speaker.name !== player.name) &&
                    (!player.hasBehaviorAttribute("no channel") || player.hasBehaviorAttribute("see room")) &&
                    player.canSee() &&
                    player.isConscious() &&
                    player.spectateChannel !== null
                ) {
                    room.getGame().messageQueue.enqueue(
                        {
                            fire: async () => {
                                await player.spectateChannel.send(messageText);
                            },
                        },
                        "spectator"
                    );
                }
            });
        }
    }
}

/**
 * Narrates a message to a whisper.
 * @param {Whisper} whisper - The whisper to send the message to. 
 * @param {string} messageText - The message to send. 
 * @param {boolean} [addSpectate] - Whether or not to mirror the message in spectate channels. Defaults to true.
 */
export async function addNarrationToWhisper(whisper, messageText, addSpectate = true) {
    if (messageText !== "") {
        whisper.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    await whisper.channel.send(messageText);
                },
            },
            "tell"
        );
        if (addSpectate) {
            whisper.playersCollection.forEach((player) => {
                const hidingSpot = whisper.getGame().entityFinder.getFixture(whisper.hidingSpotName, player.location.id);
                const preposition = hidingSpot ? hidingSpot.getPreposition().charAt(0).toLocaleUpperCase() + hidingSpot.getPreposition().substring(1) : "In";
                let spectateMessageText = `*(${preposition} ${hidingSpot ? hidingSpot.getContainingPhrase() : `a whisper`} with ${whisper.generatePlayerListString()}):*\n${messageText}`;
                if (
                    player.canSee() &&
                    player.isConscious() &&
                    player.spectateChannel !== null
                ) {
                    whisper.getGame().messageQueue.enqueue(
                        {
                            fire: async () => {
                                await player.spectateChannel.send(spectateMessageText);
                            },
                        },
                        "spectator"
                    );
                }
            });
        }
    }
}

/**
 * Narrates a message directly to a player.
 * @param {Player} player - The player to send the message to.
 * @param {string} messageText - The message to send.
 * @param {boolean} [addSpectate] - Whether or not to mirror the message in spectate channels. Defaults to true.
 */
export async function addDirectNarration(player, messageText, addSpectate = true) {
    if (!player.isNPC) {
        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    await player.notificationChannel.send(messageText);
                },
            },
            "tell"
        );
    }
    if (addSpectate && player.spectateChannel !== null) {
        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    await player.spectateChannel.send(messageText);
                },
            },
            "spectator"
        );
    }
}

/**
 * Narrates a message directly to a player with attached files.
 * @param {Player} player - The player to send the message to.
 * @param {string} messageText - The message to send.
 * @param {Collection<string, Attachment>} attachments - The attachments to send.
 * @param {boolean} [addSpectate] - Whether or not to mirror the message in spectate channels. Defaults to true.
 */
export async function addDirectNarrationWithAttachments(player, messageText, attachments, addSpectate = true) {
    const files = attachments.map((attachment) => attachment.url);

    if (!player.isNPC) {
        player.getGame().messageQueue.enqueue(
            {
                fire: async () =>
                    {
                        await player.notificationChannel.send({
                            content: messageText,
                            files: files,
                        });
                    },
            },
            "tell"
        );
    }
    if (addSpectate && player.spectateChannel !== null) {
        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    await player.spectateChannel.send({
                        content: messageText,
                        files: files,
                    });
                },
            },
            "spectator"
        );
    }
}

/**
 * Sends the room description to a player as an array of Discord Components.
 * @param {Player} player - The player to send the message to.
 * @param {Room} location - The room whose description is being sent. 
 * @param {string} descriptionText - The description of the room to send. 
 * @param {string} defaultDropFixtureText - The description of the default drop fixture in this room. 
 * @param {boolean} [addSpectate] - Whether or not to mirror the message in spectate channels. Defaults to true.
 */
export async function addRoomDescription(player, location, descriptionText, defaultDropFixtureText, addSpectate = true) {
    if (!player.isNPC || (addSpectate && player.spectateChannel !== null)) {
        let constructedString = "";
        const generatedString = location.generateOccupantsString(
            location.occupants.filter((occupant) => !occupant.isHidden() && occupant.name !== player.name)
        );
        const generatedSleepingString = location.generateOccupantsString(
            location.occupants.filter(
                (occupant) => !occupant.isConscious() && !occupant.isHidden()
            )
        );

        if (generatedString === "") constructedString = "You don't see anyone here.";
        else if (generatedString.length <= 1000) constructedString = `You see ${generatedString} in this room.`;
        else constructedString = "Too many players in this room.";

        if (generatedSleepingString !== "") {
            constructedString += `\n${generatedSleepingString} ${generatedSleepingString.includes(" and ") ? "are" : "is"
                } asleep.`;
        }

        const game = location.getGame();
        const components = [
            new ContainerBuilder()
                .setAccentColor(Number(`0x${game.settings.embedColor}`))
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder()
                                .setURL(
                                    location.iconURL !== ""
                                        ? location.iconURL
                                        : game.settings.defaultRoomIconURL !== ""
                                            ? game.settings.defaultRoomIconURL
                                            : location.getGame().guildContext.guild.iconURL()
                                )
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("_ _"),
                            new TextDisplayBuilder().setContent(`**${location.displayName}**`),
                            new TextDisplayBuilder().setContent("_ _")
                        )
                ),
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false),
            new TextDisplayBuilder().setContent(descriptionText),
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false),
            new TextDisplayBuilder().setContent("**Occupants**"),
            new TextDisplayBuilder().setContent(constructedString),
            new TextDisplayBuilder().setContent(`**${game.settings.defaultDropFixture.charAt(0) + game.settings.defaultDropFixture.substring(1).toLowerCase()}**`),
            new TextDisplayBuilder().setContent(defaultDropFixtureText === "" ? "You don't see any items." : defaultDropFixtureText),
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        ];

        if (!player.isNPC) {
            location.getGame().messageQueue.enqueue(
                {
                    fire: async () => {
                        await player.notificationChannel.send({
                            components: components,
                            flags: MessageFlags.IsComponentsV2,
                        });
                    },
                },
                "tell"
            );
        }
        if (addSpectate && player.spectateChannel !== null) {
            location.getGame().messageQueue.enqueue(
                {
                    fire: async () => {
                        await player.spectateChannel.send({
                            components: components,
                            flags: MessageFlags.IsComponentsV2,
                        });
                    },
                },
                "spectator"
            );
        }
    }
}

/**
 * Sends the help menu for a command as an array of Discord Components.
 * @param {Game} game - The game context in which this help menu is being sent.
 * @param {Messageable} channel - The channel to send the help menu to.
 * @param {Command} command - The command to display the help menu for.
 */
export async function addCommandHelp(game, channel, command) {
    const commandName = command.config.name.charAt(0).toUpperCase() + command.config.name.substring(1, command.config.name.indexOf('_'));
    const title = `**${commandName} Command Help**`;
    let aliasString = "";
    for (const alias of command.config.aliases)
        aliasString += `\`${game.settings.commandPrefix}${alias}\` `;

    const components = [
        new ContainerBuilder()
            .setAccentColor(Number(`0x${game.settings.embedColor}`))
            .addSectionComponents(
                new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(
                            game.guildContext.guild.members.me.avatarURL()
                            || game.guildContext.guild.members.me.user.avatarURL()
                        )
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(title),
                        new TextDisplayBuilder().setContent(command.config.description)
                    )
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("**Aliases**")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(aliasString)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("**Examples**")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(command.usage(game.settings))
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("**Description**")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(command.config.details)
            )
    ];

    game.messageQueue.enqueue(
        {
            fire: async () =>
                {
                    await channel.send({
                        components: components,
                        flags: MessageFlags.IsComponentsV2,
                    });
                }
        },
        channel.id === game.guildContext.commandChannel.id ? "mod" : "mechanic"
    );
}

/**
 * Sends a message to the game's log channel.
 * @param {Game} game - The game in which to send a log message.
 * @param {string} messageText - The message to send.
 */
export async function addLogMessage(game, messageText) {
    game.messageQueue.enqueue(
        {
            fire: async () => {
                await game.guildContext.logChannel.send(messageText);
            },
        },
        "log"
    );
}

/**
 * Sends a standard message indicating the outcome of a game mechanic in the specified channel.
 * @param {Game} game - The game in which this mechanic is occurring.
 * @param {Messageable} channel - The channel to send the message to.
 * @param {string} messageText - The message to send.
 */
export function addGameMechanicMessage(game, channel, messageText) {
    game.messageQueue.enqueue(
        {
            fire: async () => {
                await channel.send(messageText);
            },
        },
        channel.id === game.guildContext.commandChannel.id ? "mod" : "mechanic"
    );
}

/**
 * Replies to a message. This is usually done when a user has sent a message with an error.
 * @param {Game} game - The game this message was sent in.
 * @param {UserMessage} message - The message to reply to.
 * @param {string} messageText - The text to send in response.
 */
export async function addReply(game, message, messageText) {
    game.messageQueue.enqueue(
        {
            fire: async () => {
                if (message.channel.type === ChannelType.GuildText && message.channel.id === game.guildContext.commandChannel.id) {
                    await message.reply(messageText);
                } else {
                    await message.author.send(messageText);
                }
            },
        },
        message.channel.type === ChannelType.GuildText && message.channel.id === game.guildContext.commandChannel.id ? "mod" : "mechanic"
    );
}

/**
 * Mirrors a dialog message in a spectate channel.
 * @param {Player} player - The player whose spectate channel this message is being sent to.
 * @param {Player|PseudoPlayer|GuildMember} speaker - The player who originally sent the dialog message.
 * @param {UserMessage} message - The message in which this dialog originated.
 * @param {Whisper} [whisper] - The whisper the dialog was sent in, if applicable.
 * @param {string} [displayName] - The displayName to use for the mirrored webhook message. If none is specified, the speaker's current displayName will be used.
 */
export async function addSpectatedPlayerMessage(player, speaker, message, whisper = null, displayName = null) {
    if (player.spectateChannel !== null) {
        const messageText =
            whisper && whisper.playersCollection.size > 1
                ? `*(Whispered to ${whisper.generatePlayerListStringExcludingDisplayName(speaker.displayName)}):*\n${message.content || ""}`
                : whisper
                    ? `*(Whispered):*\n${message.content || ""}`
                    : message.content || "";

        const webhook = await getOrCreateWebhook(player.spectateChannel);
        const files = message.attachments.map((attachment) => attachment.url);

        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    const webhookMessage = await sendWebhookMessage(
                        webhook,
                        messageText,
                        displayName ? displayName : speaker.displayName,
                        !(speaker instanceof GuildMember) && speaker.displayIcon
                            ? speaker.displayIcon
                            : speaker instanceof Player && speaker.member
                                ? speaker.member.displayAvatarURL()
                                : message.author.avatarURL() || message.author.defaultAvatarURL,
                        message.embeds,
                        files,
                    );
                    player.getGame().communicationHandler.cacheSpectateMirrorForDialog(message, webhookMessage.id, webhook.id);
                },
            },
            "spectator"
        );
    }
}

/**
 * Mirrors a dialog message in a spectate channel.
 * @param {Player} player - The player whose spectate channel this message is being sent to.
 * @param {Dialog} dialog - The dialog to mirror.
 * @param {string} [webhookUsername] - The username to use for the mirrored webhook message. If none is specified, the speaker's current displayName will be used.
 * @param {string} [webhookAvatarURL] - The avatar URL to use for the mirrored webhook message. If none is specified, the speaker's current displayIcon will be used.
 */
export async function sendDialogSpectateMessage(player, dialog, webhookUsername, webhookAvatarURL) {
    if (player.spectateChannel !== null) {
        const messageText =
            dialog.whisper && dialog.whisper.playersCollection.size > 1
                ? `*(Whispered to ${dialog.whisper.generatePlayerListStringExcluding(dialog.speaker)}):*\n${dialog.content || ""}`
                : dialog.whisper
                    ? `*(Whispered):*\n${dialog.content || ""}`
                    : dialog.content || "";

        const webhook = await getOrCreateWebhook(player.spectateChannel);
        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    const webhookMessage = await sendWebhookMessage(
                        webhook,
                        messageText,
                        webhookUsername ? webhookUsername : dialog.speakerDisplayName,
                        webhookAvatarURL ? webhookAvatarURL : dialog.speakerDisplayIcon,
                        dialog.embeds,
                        dialog.attachments.map((attachment) => attachment.url)
                    );
                    player.getGame().communicationHandler.cacheSpectateMirrorForDialog(dialog.message, webhookMessage.id, webhook.id);
                },
            },
            "spectator"
        );
    }
}

/**
 * Mirrors a dialog message in a spectate channel.
 * @param {Player} player - The player whose spectate channel this message is being sent to.
 * @param {Narration} narration - The narration to mirror.
 * @param {string} webhookUsername - The username to use for the mirrored webhook message.
 * @param {string} webhookAvatarURL - The avatar URL to use for the mirrored webhook message.
 * @param {string} [messageText] - The custom text of the narration to send. Optional.
 */
export async function sendNarrationSpectateMessage(player, narration, webhookUsername, webhookAvatarURL, messageText = narration.content) {
    if (player.spectateChannel !== null) {
        const hidingSpot = narration.whisper?.getGame().entityFinder.getFixture(narration.whisper.hidingSpotName, player.location.id);
        const preposition = hidingSpot ? hidingSpot.getPreposition().charAt(0).toLocaleUpperCase() + hidingSpot.getPreposition().substring(1) : "In";
        if (narration.whisper) messageText = `*(${preposition} ${hidingSpot ? hidingSpot.getContainingPhrase() : `a whisper`} with ${narration.whisper.generatePlayerListString()}):*\n${messageText}`;
        const webhook = await getOrCreateWebhook(player.spectateChannel);
        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    const webhookMessage = await sendWebhookMessage(
                        webhook,
                        messageText,
                        webhookUsername,
                        webhookAvatarURL,
                        narration.message.embeds,
                        narration.message.attachments.map((attachment) => attachment.url)
                    );
                    player.getGame().communicationHandler.cacheSpectateMirrorForDialog(narration.message, webhookMessage.id, webhook.id);
                },
            },
            "spectator"
        );
    }
}

/**
 * Edits spectate messages when the dialog they mirror is edited.
 * @param {Game} game - The game this dialog belongs to.
 * @param {UserMessage|import('discord.js').PartialMessage} messageOld - The original message being edited.
 * @param {UserMessage} messageNew - The new message after being edited.
 */
export async function editSpectatorMessage(game, messageOld, messageNew) {
    const spectateMirrors = game.communicationHandler.getDialogSpectateMirrors(messageOld);
    if (!spectateMirrors) return;
    spectateMirrors.forEach(async (mirror) => {
        const webhook = await messageOld.client.fetchWebhook(mirror.webhookId);
        if (webhook) {
            let messageText = messageNew.content;
            if (messageOld.channel.type === ChannelType.GuildText && messageOld.channel.parentId === game.guildContext.whisperCategoryId) {
                const relatedMessage = await webhook.fetchMessage(mirror.messageId);
                const regexGroups = relatedMessage.content.match(new RegExp(/(\*\(Whispered(?:.*)\):\*\n)(.*)/m));
                if (regexGroups) messageText = regexGroups[1] + messageNew.content;
            }
            webhook.editMessage(mirror.messageId, { content: messageText });
        }
    });
}

/**
 * Gets the client's webhook for the given channel, or creates one if it doesn't exist already.
 * @param {TextChannel} channel - The channel to get or create a webhook for. 
 */
export async function getOrCreateWebhook(channel) {
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(webhook => webhook.owner.id === channel.client.user.id);
    if (webhook === undefined)
        webhook = await channel.createWebhook({ name: channel.name });
    return webhook;
}

/**
 * Sends a webhook message in the specified channel.
 * @param {Webhook} webhook - The channel to send the webhook message to.
 * @param {string} content - The content of the message to send. 
 * @param {string} username - The username of the webhook message. 
 * @param {string} avatarURL - The URL of the icon to use for the webhook message. 
 * @param {Embed[]} embeds - An array of embeds to send in the message. Optional. 
 * @param {string[]} files - An array of URLs to send as attachments. Optional.
 */
export async function sendWebhookMessage(webhook, content, username, avatarURL, embeds = [], files = []) {
    const createdMessage = await webhook.send({
        content: content,
        username: username,
        avatarURL: avatarURL,
        embeds: embeds,
        files: files
    });
    return createdMessage;
}

/**
 * @param {Game} game - The game whose message queue should have its messages sent.
 */
export async function sendQueuedMessages(game) {
    while (game.messageQueue.size() > 0) {
        const message = game.messageQueue.dequeue();
        try {
            await message.fire();
        } catch (error) {
            console.error("Message Handler encountered exception sending message:", error);
        }
    }
}

/**
 * @param {Game} game - The game whose message queue should be emptied. 
 */
export async function clearQueue(game) {
    game.messageQueue.clear();
}
