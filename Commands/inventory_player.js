import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "inventory_player",
    description: "Lists the items in your inventory.",
    details: "Shows you what items you currently have. Your inventory will be sent to you via DMs.",
    usableBy: "Player",
    aliases: ["inventory", "i"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}inventory`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} player 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable inventory");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[0].name}**.`);

    const inventoryString = player.viewInventory("Your", false);
    player.notify(inventoryString);

    return;
}
