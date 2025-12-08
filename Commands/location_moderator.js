import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "location_moderator",
    description: "Tells you a player's location.",
    details: "Tells you the given player's location, with a link to the channel.",
    usableBy: "Moderator",
    aliases: ["location"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}location faye`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            break;
        }
    }
    if (player === null) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `${player.name} is currently in ${player.location.channel}.`);

    return;
}
