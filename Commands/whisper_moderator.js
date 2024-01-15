const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');
const dialogHandler = include(`${constants.modulesDir}/dialogHandler.js`);

const Whisper = include(`${constants.dataDir}/Whisper.js`);

module.exports.config = {
    name: "whisper_moderator",
    description: "Initiates a whisper with the given players.",
    details: "Creates a channel for the given players to speak in. Only the selected players will be able to read messages "
        + "posted in the new channel, but everyone in the room will be notified that they've begun whispering to each other. "
        + "You can select as many players as you want as long as they're all in the same room. When a player in the whisper "
        + "leaves the room, they will be removed from the channel. If everyone leaves the room, the whisper channel will be "
        + (settings.autoDeleteWhisperChannels ? "deleted" : "archived") + ". If one of the players listed has the talent "
        + "\"NPC\", the remaining string after the list of players will be sent in the whisper channel. Once the channel is "
        + "created, NPC players can only speak in the whisper using this command and the list of players in the whisper.",
    usage: `${settings.commandPrefix}whisper nestor jun\n`
        + `${settings.commandPrefix}whisper sadie elijah flint\n`
        + `${settings.commandPrefix}whisper amy hibiki Clean it up.\n`
        + `${settings.commandPrefix}whisper amy hibiki The mess you made. Clean it up now.`,
    usableBy: "Moderator",
    aliases: ["whisper"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to choose at least two players. Usage:\n${exports.config.usage}`);

    // Get all players mentioned.
    var recipients = new Array();
    var npc = null;
    for (let i = 0; i < args.length; i++) {
        let playerExists = false;
        for (let j = 0; j < game.players_alive.length; j++) {
            let player = game.players_alive[j];
            // Player cannot be included multiple times.
            if (player.name.toLowerCase() === args[i].toLowerCase()) {
                for (let k = 0; k < recipients.length; k++) {
                    if (recipients[k].name === player.name)
                        return game.messageHandler.addReply(message, `Can't include the same player multiple times.`);
                    if (recipients[k].location.name !== player.location.name)
                        return game.messageHandler.addReply(message, `The selected players aren't all in the same room.`);
                }
                // Check attributes that would prohibit the player from whispering to someone in the room.
                let status = player.getAttributeStatusEffects("disable whisper");
                if (status.length > 0) return game.messageHandler.addReply(message, `${player.name} can't whisper because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? `are` : `is`) + ` **${status[0].name}**.`);
                status = player.getAttributeStatusEffects("no hearing");
                if (status.length > 0) return game.messageHandler.addReply(message, `${player.name} can't whisper because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? `are` : `is`) + ` **${status[0].name}**.`);
                status = player.getAttributeStatusEffects("unconscious");
                if (status.length > 0) return game.messageHandler.addReply(message, `${player.name} can't whisper because ${player.originalPronouns.sbj} ` + (player.originalPronouns.plural ? `are` : `is`) + ` **${status[0].name}**.`);
                // If there are no attributes that prevent whispering, add them to the array.
                playerExists = true;
                if (player.talent === "NPC") npc = player;
                recipients.push(player);
                break;
            }
        }
        if (!playerExists) {
            if (npc !== null) {
                args.splice(0, i);
                break;
            }
            else return game.messageHandler.addReply(message, `Couldn't find player "${args[i]}". Make sure you spelled it right.`);
        }
    }
    if (recipients.length < 2) return game.messageHandler.addReply(message, `Can't start a whisper with fewer than 2 players.`);

    var string = args.join(' ');

    // Check if whisper already exists.
    for (let i = 0; i < game.whispers.length; i++) {
        // No need to compare the members of the current whisper if they have different numbers of people.
        if (game.whispers[i].players.length === recipients.length) {
            let matchedUsers = 0;
            for (let j = 0; j < recipients.length; j++) {
                for (let k = 0; k < game.whispers[i].players.length; k++) {
                    if (recipients[j].name === game.whispers[i].players[k].name) {
                        matchedUsers++;
                        break;
                    }
                }
            }
            if (matchedUsers === recipients.length) {
                if (npc !== null) {
                    await sendMessage(bot, game, message, string, npc, game.whispers[i]);
                    return;
                }
                else return game.messageHandler.addReply(message, "Whisper group already exists.");
            }
        }
    }

    // Whisper does not exist, so create it.
    var whisper = new Whisper(recipients, recipients[0].location);
    await whisper.init(game);
    game.whispers.push(whisper);

    if (npc !== null)
        await sendMessage(bot, game, message, string, npc, whisper);

    return;
};

async function sendMessage (bot, game, message, string, player, whisper) {
    // Create a webhook for this channel if necessary, or grab the existing one.
    let webHooks = await whisper.channel.fetchWebhooks();
    let webHook = webHooks.find(webhook => webhook.owner.id === bot.user.id);
    if (webHook === null || webHook === undefined)
        webHook = await whisper.channel.createWebhook({ name: whisper.channelName });

    var files = [];
    [...message.attachments.values()].forEach(attachment => files.push(attachment.url));

    webHook.send({
        content: string,
        username: player.displayName,
        avatarURL: player.id,
        embeds: message.embeds,
        files: files
    }).then(message => {
        dialogHandler.execute(bot, game, message, true, player);
    });
}
