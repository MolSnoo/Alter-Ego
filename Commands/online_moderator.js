import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "online_moderator",
    description: "Lists all online players.",
    details: "Lists all players who are currently online.",
    usableBy: "Moderator",
    aliases: ["online"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}online`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    var players = [];
    for (let i = 0; i < game.players_alive.length; i++) {
		if (game.players_alive[i].online)
			players.push(game.players_alive[i].name);
	}
	players.sort();
	const playerList = players.join(", ");
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Players online:\n${playerList}`);

    return;
}
