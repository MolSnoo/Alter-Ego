const settings = include("Configs/settings.json");
const constants = include("Configs/constants.json");
const serverconfig = include("Configs/serverconfig.json");
const { discord, TextDisplayBuilder, MessageFlags} = require("discord.js");
const PriorityQueue = include(`${constants.dataDir}/PriorityQueue.js`);

module.exports.queue = new PriorityQueue();
module.exports.cache = [];
module.exports.clientID = null;

module.exports.addNarration = async (room, messageText, addSpectate = true, speaker = null) => {
    if (messageText !== "") {
        module.exports.queue.enqueue(
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
                    module.exports.queue.enqueue(
                        {
                            fire: async () => await player.spectateChannel.send(messageText),
                        },
                        "spectator"
                    );
                }
            });
        }
    }
};

module.exports.addNarrationToWhisper = async (whisper, messageText, addSpectate = true) => {
    if (messageText !== "") {
        module.exports.queue.enqueue(
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
                    module.exports.queue.enqueue(
                        {
                            fire: async () => await player.spectateChannel.send(spectateMessageText),
                        },
                        "spectator"
                    );
                }
            });
        }
    }
};

module.exports.addDirectNarration = async (player, messageText, addSpectate = true) => {
    if (player.talent !== "NPC") {
        module.exports.queue.enqueue(
            {
                fire: async () => await player.member.send(messageText),
            },
            "tell"
        );
    }
    if (addSpectate && player.spectateChannel !== null) {
        module.exports.queue.enqueue(
            {
                fire: async () => await player.spectateChannel.send(messageText),
            },
            "spectator"
        );
    }
};

module.exports.addDirectNarrationWithAttachments = async (player, messageText, attachments, addSpectate = true) => {
    const files = attachments.map((attachment) => attachment.url);

    if (player.talent !== "NPC") {
        module.exports.queue.enqueue(
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
        module.exports.queue.enqueue(
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
};

module.exports.addRoomDescription = async (game, player, location, descriptionText, defaultDropObjectText, addSpectate = true) => {
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
        
        const embed = new discord.EmbedBuilder()
        .setThumbnail(
            location.iconURL !== ""
                ? location.iconURL
                : settings.defaultRoomIconURL !== ""
                ? settings.defaultRoomIconURL
                : game.guild.iconURL()
        )
        .setTitle(location.name)
        .setColor(settings.embedColor)
        .setDescription(descriptionText)
        .addFields([
            { name: "Occupants", value: constructedString },
            {
                name: `${
                    settings.defaultDropObject.charAt(0) + settings.defaultDropObject.substring(1).toLowerCase()
                }`,
                value: defaultDropObjectText === "" ? "You don't see any items." : defaultDropObjectText,
            },
        ]);

        if (player.talent !== "NPC") {
            module.exports.queue.enqueue(
                {
                    fire: async () =>
                        await player.member.send({
                            embeds: [embed],
                        }),
                },
                "tell"
            );
        }
        if (addSpectate && player.spectateChannel !== null) {
            module.exports.queue.enqueue(
                {
                    fire: async () =>
                        await player.spectateChannel.send({
                            embeds: [embed],
                        }),
                },
                "spectator"
            );
        }
    }
};

module.exports.addLogMessage = async (logChannel, messageText) => {
    module.exports.queue.enqueue(
        {
            fire: async () => await logChannel.send(messageText),
        },
        "log"
    );
};

module.exports.addGameMechanicMessage = (channel, messageText) => {
    module.exports.queue.enqueue(
        {
            fire: async () => await channel.send(messageText),
        },
        channel.parent !== undefined && channel.id === serverconfig.commandChannel ? "mod" : "mechanic"
    );
};

module.exports.addReply = async (message, messageText) => {
    module.exports.queue.enqueue(
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
};

module.exports.addSpectatedPlayerMessage = async (player, speaker, message, whisper = null, displayName = null) => {
    if (player.spectateChannel !== null) {
        const messageText =
            whisper && whisper.players.length > 1
                ? `*(Whispered to ${whisper.makePlayersSentenceGroupExcluding(speaker.displayName)}):*\n${message.content || ""}`
                : whisper
                ? `*(Whispered):*\n${message.content || ""}`
                : message.content || "";

        const webhooks = await player.spectateChannel.fetchWebhooks();
        let webhook = webhooks.find((wh) => wh.owner.id === module.exports.clientID);
        if ((webhook === null) | (webhook === undefined))
            webhook = await player.spectateChannel.createWebhook({ name: player.spectateChannel.name });

        const files = message.attachments.map((attachment) => attachment.url);

        module.exports.queue.enqueue(
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
                    const cachedMessage = module.exports.cache.find((entry) => entry.id === message.id);
                    if (cachedMessage) cachedMessage.related.push({ message: msg.id, webhook: webhook.id });
                },
            },
            "spectator"
        );
    }
};

module.exports.editSpectatorMessage = async (messageOld, messageNew) => {
    const cachedMessage = module.exports.cache.find((entry) => entry.id === messageOld.id);
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
};

module.exports.sendQueuedMessages = async () => {
    while (module.exports.queue.size() > 0) {
        const message = module.exports.queue.dequeue();
        try {
            await message.fire();
        } catch (error) {
            console.error("Messange Handler encountered exception sending message:", error);
        }
    }
};

module.exports.clearQueue = async () => {
    module.exports.queue = new PriorityQueue();
};
