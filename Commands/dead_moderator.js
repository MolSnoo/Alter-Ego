import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
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
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    var playerList = "Dead players:\n";
    if (game.players_dead.length > 0)
        playerList += game.players_dead[0].name;
    for (let i = 1; i < game.players_dead.length; i++)
        playerList += `, ${game.players_dead[i].name}`;
    messageHandler.addGameMechanicMessage(message.channel, playerList);

    return;
}
