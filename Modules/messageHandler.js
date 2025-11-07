const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');
const serverconfig = include('Configs/serverconfig.json');
const discord = require('discord.js');
const QueuedMessage = include(`${constants.dataDir}/QueuedMessage.js`);

module.exports.queue = [];
module.exports.cache = [];
module.exports.clientID = null;

const messagePriority = {
    modChannel: 4,
    tellPlayer: 3,
    tellRoom: 3,
    gameMechanicMessage: 2,
    logMessage: 1,
    spectatorMessage: 0
};

// Narrate something to a room
module.exports.addNarration = async (room, messageText, addSpectate = true, speaker = null) => {
    addMessageToQueue(room.channel, messageText, messagePriority.tellRoom);
    if (addSpectate) {
        // Create a queued message for each of the occupants' spectate channels
        room.occupants.forEach(player => {
            if ((speaker === null || speaker.name !== player.name) && (!player.hasAttribute("no channel") || player.hasAttribute("see room")) && !player.hasAttribute("no sight") && !player.hasAttribute("unconscious") && player.spectateChannel !== null)
                addMessageToQueue(player.spectateChannel, messageText, messagePriority.spectatorMessage);
        });
    }
};

// Narrate something in a whisper
module.exports.addNarrationToWhisper = async (whisper, messageText, addSpectate = true) => {
    addMessageToQueue(whisper.channel, messageText, messagePriority.tellRoom);
    if (addSpectate) {
        // Create a queued message for each of the occupants' spectate channels, and specify it's in a whisper channel
        let whisperMessageText = `*(In a whisper with ${whisper.makePlayersSentenceGroup()}):*\n` + messageText;
        whisper.players.forEach(player => {
            if (!player.hasAttribute("no sight") && !player.hasAttribute("unconscious") && player.spectateChannel !== null)
                addMessageToQueue(player.spectateChannel, whisperMessageText, messagePriority.spectatorMessage);
        });
    }
};

// Narrate something directly to a player
module.exports.addDirectNarration = async (player, messageText, addSpectate = true) => {
    if (player.talent !== "NPC") addMessageToQueue(player.member, messageText, messagePriority.tellPlayer);
    if (addSpectate && player.spectateChannel !== null)
        addMessageToQueue(player.spectateChannel, messageText, messagePriority.spectatorMessage);
};

// Narrate something directly to a player with attachments
module.exports.addDirectNarrationWithAttachments = async (player, messageText, attachments, addSpectate = true) => {
    var files = [];
    [...attachments.values()].forEach(attachment => files.push(attachment.url));

    if (player.talent !== "NPC") addMessageWithAttachmentsToQueue(player.member, {
        content: messageText,
        files: files
    }, messagePriority.tellPlayer);
    if (addSpectate && player.spectateChannel !== null)
        addMessageWithAttachmentsToQueue(player.spectateChannel, {
            content: messageText,
            files: files
        }, messagePriority.spectatorMessage);
};

// Narrate a room description to a player
module.exports.addRoomDescription = async (game, player, location, descriptionText, defaultDropObjectText, addSpectate = true) => {
    // Create the list of occupants
    let occupantsString = location.generate_occupantsString(location.occupants.filter(occupant => !occupant.hasAttribute("hidden") && occupant.name !== player.name));
    occupantsString = occupantsString === "" ? "You don't see anyone here." : location.occupantsString.length <= 1000 ? `You see ${occupantsString} in this room.` : `Too many players in this room.`;
    let sleepingPlayersString = location.generate_occupantsString(location.occupants.filter(occupant => occupant.hasAttribute("unconscious") && !occupant.hasAttribute("hidden")));
    if (sleepingPlayersString !== "") {
        occupantsString += `\n${sleepingPlayersString} ` + (sleepingPlayersString.includes(" and ") ? "are" : "is") + " asleep.";
    }

    const thumbnail = location.iconURL !== "" ? location.iconURL : settings.defaultRoomIconURL !== "" ? settings.defaultRoomIconURL : game.guild.iconURL();
    let embed = new discord.EmbedBuilder()
        .setThumbnail(thumbnail)
        .setTitle(location.name)
        .setColor('1F8B4C')
        .setDescription(descriptionText)
        .addFields([
            {name: "Occupants", value: occupantsString},
            {
                name: `${settings.defaultDropObject.charAt(0) + settings.defaultDropObject.substring(1).toLowerCase()}`,
                value: defaultDropObjectText === "" ? "You don't see any items." : defaultDropObjectText
            }
        ]);

    if (player.talent !== "NPC") addEmbedToQueue(player.member, embed, messagePriority.tellPlayer);
    if (addSpectate && player.spectateChannel !== null)
        addEmbedToQueue(player.spectateChannel, embed, messagePriority.spectatorMessage);
};

// Add a log message
module.exports.addLogMessage = async (logChannel, messageText) => {
    addMessageToQueue(logChannel, messageText, messagePriority.logMessage);
};

// Add a game mechanic message that does not add to narration (e.g. incorrect syntax message, or the reason an action was prevented)
module.exports.addGameMechanicMessage = (channel, messageText) => {
    // Give a higher priority if this is sent in the mod channel
    let priority = channel.parent !== undefined && channel.id === serverconfig.commandChannel ? messagePriority.modChannel : messagePriority.gameMechanicMessage;
    addMessageToQueue(channel, messageText, priority);
};

// Add a reply to a message
module.exports.addReply = async (message, messageText) => {
    // Give a higher priority if this is sent in the mod channel
    let priority = message.channel.id === serverconfig.commandChannel ? messagePriority.modChannel : messagePriority.gameMechanicMessage;
    addReplyToQueue(message, messageText, priority);
};

// Take a message sent in a room/whisper by a player and add it to the spectate channels of other players in the room
module.exports.addSpectatedPlayerMessage = async (player, speaker, message, whisper = null, displayName = null) => {
    if (player.spectateChannel !== null) {
        var messageText = message.content || '';
        // If this is a whisper, specify that the following message comes from the whisper
        if (whisper && whisper.players.length > 1)
            messageText = `*(Whispered to ${whisper.makePlayersSentenceGroupExcluding(speaker.displayName)}):*\n` + messageText;
        else if (whisper)
            messageText = `*(Whispered):*\n` + messageText;

        // Create a webhook for this spectate channel if necessary, or grab the existing one
        let webHooks = await player.spectateChannel.fetchWebhooks();
        let webHook = webHooks.find(webhook => webhook.owner.id === this.clientID);
        if (webHook === null || webHook === undefined)
            webHook = await player.spectateChannel.createWebhook({name: player.spectateChannel.name});

        var files = [];
        [...message.attachments.values()].forEach(attachment => files.push(attachment.url));

        // Send through the webhook with the original author's username and avatar, and the original message's contents
        addWebhookMessageToQueue(webHook,
            {
                content: messageText,
                username: displayName ? displayName : speaker.displayName,
                avatarURL: speaker.displayIcon ? speaker.displayIcon : speaker.member ? speaker.member.displayAvatarURL() : message.author.avatarURL() || message.author.defaultAvatarURL,
                embeds: message.embeds,
                files: files
            },
            messagePriority.spectatorMessage, message.id
        );
    }
};

module.exports.editSpectatorMessage = async (messageOld, messageNew) => {
    const cachedMessage = module.exports.cache.find(entry => entry.id === messageOld.id);
    if (!cachedMessage) return;
    cachedMessage.related.forEach(async related => {
        const webHook = await messageOld.client.fetchWebhook(related.webHook);
        if (webHook) {
            let messageText = messageNew.content;
            if (messageOld.channel.parentId === serverconfig.whisperCategory) {
                const relatedMessage = await webHook.fetchMessage(related.message);
                const regexGroups = relatedMessage.content.match(new RegExp(/(\*\(Whispered(?:.*)\):\*\n)(.*)/m));
                if (regexGroups) messageText = regexGroups[1] + messageNew.content;
            }
            webHook.editMessage(related.message, {content: messageText});
        }
    });
}

module.exports.sendQueuedMessages = async () => {
    let queue = module.exports.queue;
    // Send the first message and remove it, until there are no messages left
    while (queue.length > 0) {
        queue[0].sendAction();
        queue.splice(0, 1);
    }
};

module.exports.clearQueue = async () => {
    module.exports.queue = [];
};


function addMessageToQueue(channel, messageText, priority) {
    if (messageText !== "") {
        let sendAction = () => channel.send(messageText);
        addToQueue(sendAction, priority);
    }
}

function addMessageWithAttachmentsToQueue(channel, attachments, priority) {
    let sendAction = () => channel.send(attachments);
    addToQueue(sendAction, priority);
}

function addWebhookMessageToQueue(webHook, webHookContents, priority, originId) {
    let sendAction = () => webHook.send(webHookContents).then(message => {
        const cachedMessage = module.exports.cache.find(entry => entry.id === originId);
        if (cachedMessage) cachedMessage.related.push({message: message.id, webHook: webHook.id});
    }).catch(console.error);
    addToQueue(sendAction, priority);
}

function addReplyToQueue(message, messageText, priority) {
    let sendAction = priority === messagePriority.modChannel ? () => message.reply(messageText) : () => message.author.send(messageText);
    addToQueue(sendAction, priority);
}

function addEmbedToQueue(channel, embed, priority) {
    let sendAction = () => channel.send({embeds: [embed]});
    addToQueue(sendAction, priority);
}

function addToQueue(sendAction, priority) {
    let queuedMessage = new QueuedMessage(sendAction, priority);

    let queue = module.exports.queue;
    let i = 0;
    while (i < queue.length - 1 && queue[i].priority >= queuedMessage.priority) {
        i++;
    }
    queue.splice(i, 0, queuedMessage);
}
