import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "dead_moderator",
    description: "Lists all dead players.",
    details: "Lists all dead players.",
    usableBy: "Moderator",
    aliases: ["dead", "died"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}dead\n`
        + `${settings.commandPrefix}died`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    let playerList = "Dead players:\n";
    if (game.players_dead.length > 0)
        playerList += game.players_dead[0].name;
    for (let i = 1; i < game.players_dead.length; i++)
        playerList += `, ${game.players_dead[i].name}`;
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, playerList);

    return;
}
