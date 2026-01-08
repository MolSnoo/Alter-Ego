import Dialog from '../Data/Dialog.js';
import Player from '../Data/Player.js';
import AnnounceAction from '../Data/Actions/AnnounceAction.js';
import { TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ChannelType, Attachment, Collection, GuildMember } from 'discord.js';

/** @typedef {import('../Data/Game.js').default} Game */
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
        const dialog = new Dialog(game, message, player, location, isInAnnouncementChannel, whisper);
        if (dialog.isAnnouncement) {
            const announceAction = new AnnounceAction(game, message, dialog.speaker, dialog.location, false, dialog.whisper);
            announceAction.performAnnounce(dialog);
        }
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
                let spectateMessageText = `*(In a whisper with ${whisper.generatePlayerListString()}):*\n${messageText}`;
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

        const webhooks = await player.spectateChannel.fetchWebhooks();
        let webhook = webhooks.find((wh) => wh.owner.id === message.client.user.id);
        if ((webhook === null) || (webhook === undefined))
            webhook = await player.spectateChannel.createWebhook({ name: player.spectateChannel.name });

        const files = message.attachments.map((attachment) => attachment.url);

        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    const webhookMessage = await webhook.send({
                        content: messageText,
                        username: displayName ? displayName : speaker.displayName,
                        avatarURL: !(speaker instanceof GuildMember) && speaker.displayIcon
                            ? speaker.displayIcon
                            : speaker instanceof Player && speaker.member
                                ? speaker.member.displayAvatarURL()
                                : message.author.avatarURL() || message.author.defaultAvatarURL,
                        embeds: message.embeds,
                        files: files,
                    });
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
 */
export async function sendDialogSpectateMessage(player, dialog, webhookUsername) {
    if (player.spectateChannel !== null) {
        const messageText =
            dialog.whisper && dialog.whisper.playersCollection.size > 1
                ? `*(Whispered to ${dialog.whisper.generatePlayerListStringExcluding(dialog.speaker)}):*\n${dialog.content || ""}`
                : dialog.whisper
                    ? `*(Whispered):*\n${dialog.content || ""}`
                    : dialog.content || "";

        const webhooks = await player.spectateChannel.fetchWebhooks();
        let webhook = webhooks.find((wh) => wh.owner.id === player.getGame().botContext.client.user.id);
        if ((webhook === null) || (webhook === undefined))
            webhook = await player.spectateChannel.createWebhook({ name: player.spectateChannel.name });

        player.getGame().messageQueue.enqueue(
            {
                fire: async () => {
                    const webhookMessage = await webhook.send({
                        content: messageText,
                        username: webhookUsername ? webhookUsername : dialog.speakerDisplayName,
                        avatarURL: dialog.speakerDisplayIcon,
                        embeds: dialog.embeds,
                        files: dialog.attachments.map((attachment) => attachment.url),
                    });
                    player.getGame().communicationHandler.cacheSpectateMirrorForDialog(dialog.message, webhookMessage.id, webhook.id);
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
