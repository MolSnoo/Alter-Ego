import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "restore_moderator",
    description: "Restores a player's stamina.",
    details: "Sets the given player's stamina to its maximum value. Note that this does not automatically cure the weary status effect.",
    usableBy: "Moderator",
    aliases: ["restore"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}restore flint`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            break;
        }
    }
    if (player === null) return messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    player.stamina = player.maxStamina;
    messageHandler.addGameMechanicMessage(message.channel, `Fully restored ${player.name}'s stamina.`);

    return;
}
