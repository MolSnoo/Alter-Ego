const settings = require('../Configs/settings.json');
const constants = require('../Configs/constants.json');

const Whisper = require('../Data/Whisper.js');

module.exports.config = {
    name: "whisper_player",
    description: "Allows you to speak privately with the selected player(s).",
    details: "Creates a channel for you to whisper to the selected recipients. Only you and the people you select "
        + "will be able to read messages posted in the new channel, but everyone in the room will be notified "
        + "that you've begun whispering to each other. You can select as many players as you want as long as they're "
        + "in the same room as you. When one of you leaves the room, they will be removed from the channel. "
        + "If everyone leaves the room, the whisper channel will be deleted. You are required to use this when "
        + "discussing the game with other players. Do not use DMs.",
    usage: `${settings.commandPrefix}whisper tim\n`
        + `${settings.commandPrefix}whisper katie susie tim`,
    usableBy: "Player",
    aliases: ["whisper"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to choose at least one player. Usage:\n${exports.config.usage}`);

    const status = player.getAttributeStatusEffects("disable whisper");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    // Get all players mentioned.
    var recipients = new Array();
    recipients.push(player);
    for (let i = 0; i < args.length; i++) {
        var playerExists = false;
        // Player cannot whisper to themselves.
        if (args[i].toLowerCase() === player.name.toLowerCase()) return game.messageHandler.addReply(message, "You can't include yourself as a whisper recipient.");
        // Player cannot whisper to dead players.
        for (let j = 0; j < game.players_dead.length; j++) {
            if (game.players_dead[j].name.toLowerCase() === args[i].toLowerCase()) return game.messageHandler.addReply(message, `You can't whisper to ${game.players_dead[j].name} because ${game.players_dead[j].originalPronouns.sbj} ` + (game.players_dead[j].originalPronouns.plural ? `aren't` : `isn't`) + ` in the room with you.`);
        }
        for (let j = 0; j < game.players_alive.length; j++) {
            let other = game.players_alive[j];
            // Check if player exists and is in the same room.
            if (other.displayName.toLowerCase() === args[i].toLowerCase() && other.location.name === player.location.name) {
                // Check attributes that would prohibit the player from whispering to someone in the room.
                if (other.hasAttribute("hidden"))
                    return game.messageHandler.addReply(message, `You can't whisper to ${other.displayName} because ${other.pronouns.sbj} ` + (other.pronouns.plural ? `aren't` : `isn't`) + ` in the room with you.`);
                if (other.hasAttribute("concealed"))
                    return game.messageHandler.addReply(message, `You can't whisper to ${other.displayName} because it would reveal their identity.`);
                if (other.hasAttribute("no hearing"))
                    return game.messageHandler.addReply(message, `You can't whisper to ${other.displayName} because ${other.pronouns.sbj} can't hear you.`);
                if (other.hasAttribute("unconscious"))
                    return game.messageHandler.addReply(message, `You can't whisper to ${other.displayName} because ${other.pronouns.sbj} ` + (other.pronouns.plural ? `are` : `is`) + ` not awake.`);
                // If there are no attributes that prevent whispering, add them to the array.
                playerExists = true;
                recipients.push(other);
                break;
            }
            // If the player exists but is not in the same room, return error.
            else if (other.name.toLowerCase() === args[i].toLowerCase()) return game.messageHandler.addReply(message, `You can't whisper to ${other.name} because ${other.originalPronouns.sbj} ` + (other.originalPronouns.plural ? `aren't` : `isn't`) + ` in the room with you.`);
        }
        if (!playerExists) return game.messageHandler.addReply(message, `Couldn't find player "${args[i]}". Make sure you spelled it right.`);
    }

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
            if (matchedUsers === recipients.length) return game.messageHandler.addReply(message, "Whisper group already exists.");
        }
    }

    // Whisper does not exist, so create it.
    var whisper = new Whisper(recipients, player.location);
    await whisper.init(game);
    game.whispers.push(whisper);

    return;
};
