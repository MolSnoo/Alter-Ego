import QueueMoveAction from '../Data/Actions/QueueMoveAction.js';
import { addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "move_player",
    description: "Moves you to another room.",
    details: 'Moves you to another room. You will be removed from the current channel and put into the channel corresponding to the room you specify. '
        + 'You can specify either an exit of the current room or the name of the desired room, if you know it. Note that you can only move to adjacent rooms. '
        + 'It is recommended that you open the new channel immediately so that you can start seeing messages as soon as you\'re added. '
        + 'The room description will be sent to you via DMs. You can create a queue of movements to perform such that upon entering one room, you will immediately '
        + 'start moving to the next one. To do this, separate each destination with `>`.',
    usableBy: "Player",
    aliases: ["move", "go", "exit", "enter", "walk", "m"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}move door 1\n`
        + `${settings.commandPrefix}enter door 1\n`
        + `${settings.commandPrefix}go locker room\n`
        + `${settings.commandPrefix}move door 1>door 1>door 1\n`
        + `${settings.commandPrefix}walk hall 1 > hall 2 > hall 3 > hall 4\n`
        + `${settings.commandPrefix}m lobby>path 3>path 1>park>path 7>botanical garden`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify a room. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable move");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    if (player.isMoving) return addReply(game, message, `You cannot do that because you are already moving.`);

    player.moveQueue = args.join(" ").split(">");
    const action = new QueueMoveAction(game, message, player, player.location, false);
    action.performQueueMove(false, player.moveQueue[0]);
}
