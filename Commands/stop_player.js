import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";
import Narration from '../Data/Narration.js';

/** @type {CommandConfig} */
export const config = {
    name: "stop_player",
    description: "Stops your movement.",
    details: "Stops you in your tracks while moving to another room. Your distance to that room will be preserved, "
        + "so if you decide to move to that room again, it will not take as long. This command will also cancel any "
        + "queued movements.",
    usableBy: "Player",
    aliases: ["stop"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}stop`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} player 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable stop");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    if (!player.isMoving) return messageHandler.addReply(game, message, `You cannot do that because you are not moving.`);

    // Stop the player's movement.
    clearInterval(player.moveTimer);
    player.isMoving = false;
    player.moveQueue.length = 0;
    // Narrate that the player stopped.
    new Narration(game, player, player.location, `${player.displayName} stops moving.`).send();

    return;
}
