import GameSettings from '../Classes/GameSettings.js';
import KnockAction from '../Data/Actions/KnockAction.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import { addReply } from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "knock_player",
    description: "Knocks on a door.",
    details: "Knocks on a door in the room you're in.",
    usableBy: "Player",
    aliases: ["knock"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}knock door 1`;
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
        return addReply(game, message, `You need to specify an exit. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable knock");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    const input = args.join(" ");
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check that the input given is an exit in the player's current room.
    const exit = game.entityFinder.getExit(player.location, parsedInput);
    if (exit === undefined) return addReply(game, message, `Couldn't find exit "${parsedInput}" in the room.`);

    const action = new KnockAction(game, message, player, player.location, false);
    action.performKnock(exit);
}
