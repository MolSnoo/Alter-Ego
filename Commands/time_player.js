import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "time_player",
    description: "Shows the current in-game time.",
    details: "Shows the current in-game time and date. This will show you the time in the timezone "
        + "that the bot is currently operating in. This may differ from your local time.",
    usableBy: "Player",
    aliases: ["time"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}time`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable time");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    const timeMessage = `It is currently **${new Date().toLocaleTimeString()}** on **${new Date().toDateString()}**.`;
    messageHandler.addDirectNarration(player, timeMessage, false);

    return;
}
