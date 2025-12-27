import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "status_player",
    description: "Shows your status.",
    details: "Shows you what status effects you're currently afflicted with.",
    usableBy: "Player",
    aliases: ["status"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}status`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute(game, message, command, args, player) {
    const status = player.getBehaviorAttributeStatusEffects("disable status");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    const statusMessage = `You are currently:\n${player.getStatusList(false, false)}`;
    messageHandler.addDirectNarration(player, statusMessage, false);
}
