import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "inventory_moderator",
    description: "Lists a given player's inventory.",
    details: "Lists the given player's inventory.",
    usableBy: "Moderator",
    aliases: ["inventory", "i"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}inventory nero`;
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

    const inventoryString = player.viewInventory(`${player.name}'s`, true);
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, inventoryString);

    return;
}
