const settings = include('settings.json');
const discord = require('discord.js');
const QueuedMessage = include(`${settings.dataDir}/QueuedMessage.js`);

module.exports.queue = [];

// Narrate something to a room
module.exports.addNarration = async (room, messageText, addSpectate = true, speaker = null) => {
    addMessageToQueue(room.channel, messageText, settings.priority.tellRoom);
    if (addSpectate) {
        // Create a queued message for each of the occupants' spectate channels
        room.occupants.forEach(player => {
            if (speaker === null || speaker.id !== player.id)
                addMessageToQueue(player.spectateChannel, messageText, settings.priority.spectatorMessage);
        });
    }
};

// Narrate something in a whisper
module.exports.addNarrationToWhisper = async (whisper, messageText, addSpectate = true) => {
    addMessageToQueue(whisper.channel, messageText, settings.priority.tellRoom);
    if (addSpectate) {
        // Create a queued message for each of the occupants' spectate channels, and specify it's in a whisper channel
        let whisperMessageText = `**In a whisper with ${whisper.makePlayersSentenceGroup()}:** ${messageText}`;
        whisper.location.occupants.forEach(player => {
            addMessageToQueue(player.spectateChannel, whisperMessageText, settings.priority.spectatorMessage);
        });
    }
};

// Narrate something directly to a player
module.exports.addDirectNarration = async (player, messageText, addSpectate = true) => {
    addMessageToQueue(player.member, messageText, settings.priority.tellPlayer);
    if (addSpectate)
        addMessageToQueue(player.spectateChannel, messageText, settings.priority.spectatorMessage);
};

// Add a log message
module.exports.addLogMessage = async (logChannel, messageText) => {
    addMessageToQueue(logChannel, messageText, settings.priority.logMessage);
};

// Add a game mechanic message that does not add to narration (e.g. incorrect syntax message, or the reason an action was prevented)
module.exports.addGameMechanicMessage = (channel, messageText) => {
    // Give a higher priority if this is sent in the mod channel
    let priority = channel.parent !== undefined && channel.id === settings.commandChannel ? settings.priority.modChannel : settings.priority.gameMechanicMessage;
    addMessageToQueue(channel, messageText, priority);
};

// Add a reply to a message
module.exports.addReply = async (message, messageText) => {
    // Give a higher priority if this is sent in the mod channel
    let priority = message.channel.id === settings.commandChannel ? settings.priority.modChannel : settings.priority.gameMechanicMessage;
    addReplyToQueue(message, messageText, priority);
};

// Take a message sent in a room/whisper by a player and add it to the spectate channels of other players in the room
module.exports.addSpectatedPlayerMessage = async (player, speakerName, message, whisper = null) => {
    var messageText = message.content || '';
    // If this is a whisper, specify that the following message comes from the whisper
    if (whisper)
        //addMessageToQueue(player.spectateChannel, `**In a whisper with ${whisper.makePlayersSentenceGroup()}, ${speakerName} says:**`, settings.priority.spectatorMessage);
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
        settings.priority.spectatorMessage);
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

function addWebhookMessageToQueue(webHook, messageText, webHookContents, priority) {
    let sendAction = () => webHook.send(messageText, webHookContents);
    addToQueue(sendAction, priority);
}

function addReplyToQueue(message, messageText, priority) {
    let sendAction = () => message.reply(messageText);
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