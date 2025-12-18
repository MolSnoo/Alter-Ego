import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "wake_player",
    description: "Wakes you up.",
    details: "Wakes you up when you're asleep.",
    usableBy: "Player",
    aliases: ["wake", "awaken", "wakeup"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}wake\n`
        + `${settings.commandPrefix}awaken\n`
        + `${settings.commandPrefix}wakeup`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {AEMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable wake");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    if (!player.statusString.includes("asleep")) return messageHandler.addReply(game, message, "You are not currently asleep.");
    player.cure("asleep", true, true, true);

    return;
}
