import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import Whisper from '../Data/Whisper.js';

/** @type {CommandConfig} */
export const config = {
    name: "whisper_player",
    description: "Allows you to speak privately with the selected player(s).",
    details: "Creates a channel for you to whisper to the selected recipients. Only you and the people you select "
        + "will be able to read messages posted in the new channel, but everyone in the room will be notified "
        + "that you've begun whispering to each other. You can select as many players as you want as long as they're "
        + "in the same room as you. When one of you leaves the room, they will be removed from the channel. "
        + "If everyone leaves the room, the whisper channel will be deleted. You are required to use this when "
        + "discussing the game with other players. Do not use DMs.",
    usableBy: "Player",
    aliases: ["whisper"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}whisper tim\n`
        + `${settings.commandPrefix}whisper katie susie tim`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to choose at least one player. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable whisper");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // Get all players mentioned.
    const recipients = new Array();
    recipients.push(player);
    for (let i = 0; i < args.length; i++) {
        // Player cannot whisper to themselves.
        if (args[i].toLowerCase() === player.name.toLowerCase()) return messageHandler.addReply(game, message, "You can't include yourself as a whisper recipient.");
        // Player cannot whisper to dead players.
        const deadFetch = game.entityFinder.getDeadPlayer(args[i])
        if (deadFetch)
            return messageHandler.addReply(game, message, `You can't whisper to ${deadFetch.name} because ${deadFetch.originalPronouns.sbj} ` + (deadFetch.originalPronouns.plural ? `aren't` : `isn't`) + ` in the room with you.`);
        // Check if player exists and is in the same room.
        const livingFetch = game.entityFinder.getLivingPlayer(args[i])
        if (livingFetch) {
            if (livingFetch.location.id === player.location.id) {
                // Check attributes that would prohibit the player from whispering to someone in the room.
                if (livingFetch.hasBehaviorAttribute("hidden"))
                    return messageHandler.addReply(game, message, `You can't whisper to ${livingFetch.displayName} because ${livingFetch.pronouns.sbj} ` + (livingFetch.pronouns.plural ? `aren't` : `isn't`) + ` in the room with you.`);
                if (livingFetch.hasBehaviorAttribute("concealed"))
                    return messageHandler.addReply(game, message, `You can't whisper to ${livingFetch.displayName} because it would reveal their identity.`);
                if (livingFetch.hasBehaviorAttribute("no hearing"))
                    return messageHandler.addReply(game, message, `You can't whisper to ${livingFetch.displayName} because ${livingFetch.pronouns.sbj} can't hear you.`);
                if (livingFetch.hasBehaviorAttribute("unconscious"))
                    return messageHandler.addReply(game, message, `You can't whisper to ${livingFetch.displayName} because ${livingFetch.pronouns.sbj} ` + (livingFetch.pronouns.plural ? `are` : `is`) + ` not awake.`);
                recipients.push(livingFetch);
            } else if (livingFetch.name.toLowerCase() === args[i].toLowerCase())
                return messageHandler.addReply(game, message, `You can't whisper to ${livingFetch.name} because ${livingFetch.originalPronouns.sbj} ` + (livingFetch.originalPronouns.plural ? `aren't` : `isn't`) + ` in the room with you.`);
        } else
            return messageHandler.addReply(game, message, `Couldn't find player "${args[i]}". Make sure you spelled it right.`);
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
            if (matchedUsers === recipients.length) return messageHandler.addReply(game, message, "Whisper group already exists.");
        }
    }

    // Whisper does not exist, so create it.
    const whisper = new Whisper(game, recipients, player.location.id, player.location);
    await whisper.init();
    game.whispers.push(whisper);

    return;
}
