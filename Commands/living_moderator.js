import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "living_moderator",
    description: "Lists all living players.",
    details: "Lists all living players.",
    usableBy: "Moderator",
    aliases: ["living", "alive"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}living\n`
        + `${settings.commandPrefix}alive`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    var playerList = "Living players:\n";
    if (game.players_alive.length > 0)
        playerList += game.players_alive[0].name;
    for (let i = 1; i < game.players_alive.length; i++)
        playerList += `, ${game.players_alive[i].name}`;
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, playerList);

    return;
}
