const settings = include('settings.json');
const discord = require('discord.js');
const QueuedMessage = include(`${settings.dataDir}/QueuedMessage.js`);

module.exports.queue = [];

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
            if ((speaker === null || speaker.id !== player.id) && (!player.hasAttribute("no channel") || player.hasAttribute("see room")))
                addMessageToQueue(player.spectateChannel, messageText, messagePriority.spectatorMessage);
        });
    }
};

// Narrate something in a whisper
module.exports.addNarrationToWhisper = async (whisper, messageText, addSpectate = true) => {
    addMessageToQueue(whisper.channel, messageText, messagePriority.tellRoom);
    if (addSpectate) {
        // Create a queued message for each of the occupants' spectate channels, and specify it's in a whisper channel
        let whisperMessageText = `**In a whisper with ${whisper.makePlayersSentenceGroup()}:** ${messageText}`;
        whisper.location.occupants.forEach(player => {
            addMessageToQueue(player.spectateChannel, whisperMessageText, messagePriority.spectatorMessage);
        });
    }
};

// Narrate something directly to a player
module.exports.addDirectNarration = async (player, messageText, addSpectate = true) => {
    addMessageToQueue(player.member, messageText, messagePriority.tellPlayer);
    if (addSpectate)
        addMessageToQueue(player.spectateChannel, messageText, messagePriority.spectatorMessage);
};

// Narrate something directly to a player with attachments
module.exports.addDirectNarrationWithAttachments = async (player, messageText, attachments, addSpectate = true) => {
    var files = [];
    attachments.array().forEach(attachment => files.push(attachment.url));

    addMessageWithAttachmentsToQueue(player.member, messageText, { files: files }, messagePriority.tellPlayer);
    if (addSpectate)
        addMessageWithAttachmentsToQueue(player.spectateChannel, messageText, { files: files }, messagePriority.spectatorMessage);
};

// Narrate a room description to a player
module.exports.addRoomDescription = async (game, player, location, descriptionText, defaultDropObjectText, addSpectate = true) => {
    // Create the list of occupants
    let occupantsString = `You see ${location.occupantsString} in this room.`;
    let sleepingPlayersString = location.generate_occupantsString(location.occupants.filter(occupant => occupant.hasAttribute("unconscious") && !occupant.hasAttribute("hidden")));
    if (sleepingPlayersString !== "") {
        occupantsString += `\n${sleepingPlayersString} ` + (sleepingPlayersString.includes(" and ") ? "are" : "is") + " asleep.";
    }

    const thumbnail = location.iconURL !== "" ? location.iconURL : settings.defaultRoomIconURL !== "" ? settings.defaultRoomIconURL : game.guild.iconURL;
    let embed = new discord.RichEmbed()
        .setThumbnail(thumbnail)
        .setTitle(location.name)
        .setColor('1F8B4C')
        .setDescription(descriptionText)
        .addField("Occupants", location.occupantsString === "" ? "You don't see anyone here." : occupantsString)
        .addField(`${settings.defaultDropObject.charAt(0) + settings.defaultDropObject.substring(1).toLowerCase()}`, defaultDropObjectText === "" ? "You don't see any items." : defaultDropObjectText);

    addEmbedToQueue(player.member, embed, messagePriority.tellPlayer);
    if (addSpectate)
        addEmbedToQueue(player.spectateChannel, embed, messagePriority.spectatorMessage);
};

// Add a log message
module.exports.addLogMessage = async (logChannel, messageText) => {
    addMessageToQueue(logChannel, messageText, messagePriority.logMessage);
};

// Add a game mechanic message that does not add to narration (e.g. incorrect syntax message, or the reason an action was prevented)
module.exports.addGameMechanicMessage = (channel, messageText) => {
    // Give a higher priority if this is sent in the mod channel
    let priority = channel.parent !== undefined && channel.id === settings.commandChannel ? messagePriority.modChannel : messagePriority.gameMechanicMessage;
    addMessageToQueue(channel, messageText, priority);
};

// Add a reply to a message
module.exports.addReply = async (message, messageText) => {
    // Give a higher priority if this is sent in the mod channel
    let priority = message.channel.id === settings.commandChannel ? messagePriority.modChannel : messagePriority.gameMechanicMessage;
    addReplyToQueue(message, messageText, priority);
};

// Take a message sent in a room/whisper by a player and add it to the spectate channels of other players in the room
module.exports.addSpectatedPlayerMessage = async (player, speakerName, message, whisper = null) => {
    var messageText = message.content || '';
    // If this is a whisper, specify that the following message comes from the whisper
    if (whisper)
        messageText = `*(Whispered to ${whisper.makePlayersSentenceGroupExcluding(message.author)}):*\n` + messageText;

    // Create a webhook for this spectate channel if necessary, or grab the existing one
    let webHooks = await player.spectateChannel.fetchWebhooks();
    let webHook;
    if (webHooks.size === 0)
        webHook = await player.spectateChannel.createWebhook(player.spectateChannel.name);
    else
        webHook = webHooks.first();

    var files = [];
    message.attachments.array().forEach(attachment => files.push(attachment.url));

    // Send through the webhook with the original author's username and avatar, and the original message's contents
    addWebhookMessageToQueue(webHook, messageText,
        { username: speakerName,
            avatarURL: message.author.avatarURL || message.author.defaultAvatarURL,
            embeds: message.embeds,
            files: files },
        messagePriority.spectatorMessage);
};

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
    let sendAction = () => channel.send(messageText);
    addToQueue(sendAction, priority);
}

function addMessageWithAttachmentsToQueue(channel, messageText, attachments, priority) {
    let sendAction = () => channel.send(messageText, attachments);
    addToQueue(sendAction, priority);
}

function addWebhookMessageToQueue(webHook, messageText, webHookContents, priority) {
    let sendAction = () => webHook.send(messageText, webHookContents);
    addToQueue(sendAction, priority);
}

function addReplyToQueue(message, messageText, priority) {
    let sendAction = () => message.reply(messageText);
    addToQueue(sendAction, priority);
}

function addEmbedToQueue(channel, embed, priority) {
    let sendAction = () => channel.send({ embed: embed });
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