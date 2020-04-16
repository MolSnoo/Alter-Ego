const settings = include('settings.json');
const QueuedMessage = include(`${settings.dataDir}/QueuedMessage.js`);
const discord = require('discord.js');

module.exports.queue = [];
module.exports.spectateChannels = new discord.Collection();

module.exports.setSpectateChannel = async (player) => {
    spectateChannels.set(player.id, player.spectateId);
};

module.exports.addBotMessage = async (channel, messageText, priority, addSpectate) => {
    // Add the message to the queue
    let sendAction = () => channel.send(messageText);
    let queuedMessage = new QueuedMessage(sendAction, priority);
    addToQueue(queuedMessage);

    if (addSpectate) {
        // Get members of the channel (i.e. can see the channel) who are also players
        let listeningPlayers = channel.members.array().filter(member => 
            member.roles.find(role => role.id === settings.playerRole)
        );
        // Create a queued message for each of these players' spectate channels
        listeningPlayers.forEach(player => {
            let spectateChannel = spectateChannels.get(player.id);
            let sendAction = () => spectateChannel.send(messageText);
            let queuedMessage = new QueuedMessage(sendAction, settings.priority.spectatorMessage);
            addToQueue(queuedMessage);
        });
    }
};

module.exports.addBotReply = async (message, messageText, priority) => {
    let sendAction = () => message.reply(messageText);
    let queuedMessage = new QueuedMessage(sendAction, priority);
    addToQueue(queuedMessage);
};

module.exports.addSpectatedPlayerMessage = async (message) => {
    // Get members of the channel (i.e. can see the channel) who are also players
    let listeningPlayers = channel.members.array().filter(member =>
        member.roles.find(role => role.id === settings.playerRole)
    );

    // Decide how to display the player's message depending on if it's whispered
    let messageSaysText;
    if (settings.roomCategories.includes(message.channel.parentID)) {
        messageSaysText = "says";
    }
    else if (message.channel.parentID === settings.whisperCategory) {
        messageSaysText = "whispers to";
        let otherPlayers = listeningPlayers.filter(player => player.id != message.member.id);
        if (otherPlayers.length == 1)
            messageSaysText = otherPlayers[0].displayName;
        else {
            for (let i = 0; i < otherPlayers.length - 1; i++) {
                messageSaysText += ` ${otherPlayers[i].displayName},`;
            }
            messageSaysText += ` and ${otherPlayers[otherPlayers.length - 1].displayName}`;
        }
    }
    // Shouldn't happen? but just in case
    else {
        messageSaysText = "says";
    }

    // Create a queued message for each of these players' spectate channels
    listeningPlayers.forEach(player => {
        let spectateChannel = spectateChannels.get(player.id);

        let messageText = `**${member.displayName} ${messageSaysText}:** ${message.content}`;
        
        let sendAction = () => spectateChannel.send(messageText);
        let queuedMessage = new QueuedMessage(sendAction, settings.priority.spectatorMessage);
        addToQueue(queuedMessage);
    });
};

module.exports.sendQueuedMessages = async () => {
    // Send the first message and remove it, until there are no messages left
    while (queue.length > 0) {
        queue[0].sendAction();
        queue.splice(0, 1);
    }
};


function addToQueue(queuedMessage) {
    let i = 0;
    while (i < queue.length - 1 && queue[i].priority >= queuedMessage.priority) {
        i++;
    }
    queue.splice(i, 0, queuedMessage);
};