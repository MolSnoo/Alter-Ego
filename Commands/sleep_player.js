import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "sleep_player",
    description: "Puts you to sleep.",
    details: "Puts you to sleep by inflicting you with the **asleep** status effect. "
        + "This should be used at the end of the day before the game pauses to ensure you wake up feeling well-rested.",
    usableBy: "Player",
    aliases: ["sleep"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}sleep`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable sleep");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    player.inflict("asleep", true, true, true);
    player.setOffline();

    return;
}
