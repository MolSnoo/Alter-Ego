import GameSettings from '../Classes/GameSettings.js';
import Action from '../Data/Action.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import { addReply } from '../Modules/messageHandler.js';

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
export function usage(settings) {
    return `${settings.commandPrefix}stop`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute(game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable stop");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    if (!player.isMoving) return addReply(game, message, `You cannot do that because you are not moving.`);

    const action = new Action(game, ActionType.Stop, message, player, player.location, false);
    action.performStop();
}
