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
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    let player = game.entityFinder.getLivingPlayer(args[0]);
    if (player === undefined) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `${player.name} is currently in ${player.location.channel}.`);

    return;
}
