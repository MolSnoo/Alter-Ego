import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

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
export function usage (settings) {
    return `${settings.commandPrefix}status`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} player 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable status");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[0].name}**.`);

    const statusMessage = `You are currently:\n${player.generate_statusList(false, false)}`;
    messageHandler.addGameMechanicMessage(player.member, statusMessage);

    return;
}
