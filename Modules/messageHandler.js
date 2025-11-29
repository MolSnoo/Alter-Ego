import settings from '../Configs/settings.json' with { type: 'json' };
import serverconfig from '../Configs/serverconfig.json' with { type: 'json' };
import { TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } from 'discord.js';
import PriorityQueue from '../Data/PriorityQueue.js';

export let queue = new PriorityQueue();
export let cache = [];

export async function addNarration (room, messageText, addSpectate = true, speaker = null) {
    if (messageText !== "") {
        queue.enqueue(
            {
                fire: async () => await room.channel.send(messageText),
            },
            "tell"
        );
        if (addSpectate) {
            room.occupants.forEach((player) => {
                if (
                    (speaker === null || speaker.name !== player.name) &&
                    (!player.hasAttribute("no channel") || player.hasAttribute("see room")) &&
                    !player.hasAttribute("no sight") &&
                    !player.hasAttribute("unconscious") &&
                    player.spectateChannel !== null
                ) {
                    queue.enqueue(
                        {
                            fire: async () => await player.spectateChannel.send(messageText),
                        },
                        "spectator"
                    );
                }
            });
        }
    }
}

export async function addNarrationToWhisper (whisper, messageText, addSpectate = true) {
    if (messageText !== "") {
        queue.enqueue(
            {
                fire: async () => await whisper.channel.send(messageText),
            },
            "tell"
        );
        if (addSpectate) {
            whisper.players.forEach((player) => {
                let spectateMessageText = `*(In a whisper with ${whisper.makePlayersSentenceGroup()}):*\n${messageText}`;
                if (
                    !player.hasAttribute("no sight") &&
                    !player.hasAttribute("unconscious") &&
                    player.spectateChannel !== null
                ) {
                    queue.enqueue(
                        {
                            fire: async () => await player.spectateChannel.send(spectateMessageText),
                        },
                        "spectator"
                    );
                }
            });
        }
    }
}

export async function addDirectNarration (player, messageText, addSpectate = true) {
    if (player.talent !== "NPC") {
        queue.enqueue(
            {
                fire: async () => await player.member.send(messageText),
            },
            "tell"
        );
    }
    if (addSpectate && player.spectateChannel !== null) {
        queue.enqueue(
            {
                fire: async () => await player.spectateChannel.send(messageText),
            },
            "spectator"
        );
    }
}

export async function addDirectNarrationWithAttachments (player, messageText, attachments, addSpectate = true) {
    const files = attachments.map((attachment) => attachment.url);

    if (player.talent !== "NPC") {
        queue.enqueue(
            {
                fire: async () =>
                    await player.member.send({
                        content: messageText,
                        files: files,
                    }),
            },
            "tell"
        );
    }
    if (addSpectate && player.spectateChannel !== null) {
        queue.enqueue(
            {
                fire: async () =>
                    await player.spectateChannel.send({
                        content: messageText,
                        files: files,
                    }),
            },
            "spectator"
        );
    }
}

export async function addRoomDescription (game, player, location, descriptionText, defaultDropObjectText, addSpectate = true) {
    if (player.talent !== "NPC" || (addSpectate && player.spectateChannel !== null)) {
        let constructedString;
        const generatedString = location.generate_occupantsString(
            location.occupants.filter((occupant) => !occupant.hasAttribute("hidden") && occupant.name !== player.name)
        );
        const generatedSleepingString = location.generate_occupantsString(
            location.occupants.filter(
                (occupant) => occupant.hasAttribute("unconscious") && !occupant.hasAttribute("hidden")
            )
        );

        if (generatedString === "") constructedString = "You don't see anyone here.";
        else if (generatedString.length <= 1000) constructedString = `You see ${generatedString} in this room.`;
        else constructedString = "Too many players in this room.";

        if (generatedSleepingString !== "") {
            constructedString += `\n${generatedSleepingString} ${
                generatedSleepingString.includes(" and ") ? "are" : "is"
            } asleep.`;
        }
        
        const components = [
            new ContainerBuilder()
            .setAccentColor(Number(`0x${settings.embedColor}`))
            .addSectionComponents(
                new SectionBuilder()
                .setThumbnailAccessory(
                    new ThumbnailBuilder()
                    .setURL(
                        location.iconURL !== ""
                        ? location.iconURL
                        : settings.defaultRoomIconURL !== ""
                        ? settings.defaultRoomIconURL
                        : game.guild.iconURL()
                    )
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent("_ _"),
                    new TextDisplayBuilder().setContent(`**${location.name}**`),
                    new TextDisplayBuilder().setContent("_ _")
                )
            ),
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false),
            new TextDisplayBuilder().setContent(descriptionText),
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false),
            new TextDisplayBuilder().setContent("**Occupants**"),
            new TextDisplayBuilder().setContent(constructedString),
            new TextDisplayBuilder().setContent(`**${settings.defaultDropObject.charAt(0) + settings.defaultDropObject.substring(1).toLowerCase()}**`),
            new TextDisplayBuilder().setContent(defaultDropObjectText === "" ? "You don't see any items." : defaultDropObjectText),
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        ];

        if (player.talent !== "NPC") {
            queue.enqueue(
                {
                    fire: async () =>
                        await player.member.send({
                            components: components,
                            flags: MessageFlags.IsComponentsV2
                        }),
                },
                "tell"
            );
        }
        if (addSpectate && player.spectateChannel !== null) {
            queue.enqueue(
                {
                    fire: async () =>
                        await player.spectateChannel.send({
                            components: components,
                            flags: MessageFlags.IsComponentsV2
                        }),
                },
                "spectator"
            );
        }
    }
}

export async function addCommandHelp (channel, command, thumbnailURL) {
    const commandName = command.name.charAt(0).toUpperCase() + command.name.substring(1, command.name.indexOf('_'));
    const title = `**${commandName} Command Help**`;
    let aliasString = "";
    for (const alias of command.aliases)
        aliasString += `\`${settings.commandPrefix}${alias}\` `;

    const components = [
        new ContainerBuilder()
        .setAccentColor(Number(`0x${settings.embedColor}`))
        .addSectionComponents(
            new SectionBuilder()
            .setThumbnailAccessory(
                new ThumbnailBuilder().setURL(thumbnailURL)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(title),
                new TextDisplayBuilder().setContent(command.description)
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
            new TextDisplayBuilder().setContent(command.usage)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("**Description**")
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(command.details)
        )
    ];

    queue.enqueue(
        {
            fire: async () =>
                await channel.send({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                })
        },
        channel.parent !== undefined && channel.id === serverconfig.commandChannel ? "mod" : "mechanic"
    );
}

export async function addLogMessage (logChannel, messageText) {
    queue.enqueue(
        {
            fire: async () => await logChannel.send(messageText),
        },
        "log"
    );
}

export function addGameMechanicMessage (channel, messageText) {
    queue.enqueue(
        {
            fire: async () => await channel.send(messageText),
        },
        channel.parent !== undefined && channel.id === serverconfig.commandChannel ? "mod" : "mechanic"
    );
}

export async function addReply (message, messageText) {
    queue.enqueue(
        {
            fire: async () => {
                if (message.channel.parent !== undefined && message.channel.id === serverconfig.commandChannel) {
                    await message.reply(messageText);
                } else {
                    await message.author.send(messageText);
                }
            },
        },
        message.channel.parent !== undefined && message.channel.id === serverconfig.commandChannel ? "mod" : "mechanic"
    );
}

export async function addSpectatedPlayerMessage (player, speaker, message, whisper = null, displayName = null) {
    if (player.spectateChannel !== null) {
        const messageText =
            whisper && whisper.players.length > 1
                ? `*(Whispered to ${whisper.makePlayersSentenceGroupExcluding(speaker.displayName)}):*\n${message.content || ""}`
                : whisper
                ? `*(Whispered):*\n${message.content || ""}`
                : message.content || "";

        const webhooks = await player.spectateChannel.fetchWebhooks();
        let webhook = webhooks.find((wh) => wh.owner.id === message.client.user.id);
        if ((webhook === null) | (webhook === undefined))
            webhook = await player.spectateChannel.createWebhook({ name: player.spectateChannel.name });

        const files = message.attachments.map((attachment) => attachment.url);

        queue.enqueue(
            {
                fire: async () => {
                    let msg = await webhook.send({
                        content: messageText,
                        username: displayName ? displayName : speaker.displayName,
                        avatarURL: speaker.displayIcon
                            ? speaker.displayIcon
                            : speaker.member
                            ? speaker.member.displayAvatarURL()
                            : message.author.avatarURL() || message.author.defaultAvatarURL,
                        embeds: message.embeds,
                        files: files,
                    });
                    const cachedMessage = cache.find((entry) => entry.id === message.id);
                    if (cachedMessage) cachedMessage.related.push({ message: msg.id, webhook: webhook.id });
                },
            },
            "spectator"
        );
    }
}

export async function editSpectatorMessage (messageOld, messageNew) {
    const cachedMessage = cache.find((entry) => entry.id === messageOld.id);
    if (!cachedMessage) return;
    cachedMessage.related.forEach(async (related) => {
        const webHook = await messageOld.client.fetchWebhook(related.webHook);
        if (webHook) {
            let messageText = messageNew.content;
            if (messageOld.channel.parentId === serverconfig.whisperCategory) {
                const relatedMessage = await webHook.fetchMessage(related.message);
                const regexGroups = relatedMessage.content.match(new RegExp(/(\*\(Whispered(?:.*)\):\*\n)(.*)/m));
                if (regexGroups) messageText = regexGroups[1] + messageNew.content;
            }
            webHook.editMessage(related.message, { content: messageText });
        }
    });
}

export async function sendQueuedMessages () {
    while (queue.size() > 0) {
        const message = queue.dequeue();
        try {
            await message.fire();
        } catch (error) {
            console.error("Messange Handler encountered exception sending message:", error);
        }
    }
}

export async function clearQueue () {
    queue = new PriorityQueue();
}
