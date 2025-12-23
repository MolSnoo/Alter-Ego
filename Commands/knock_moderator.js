import GameSettings from '../Classes/GameSettings.js';
import Action from '../Data/Action.js';
import Game from '../Data/Game.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "knock_moderator",
    description: "Knocks on a door for a player.",
    details: "Knocks on a door for the given player",
    usableBy: "Moderator",
    aliases: ["knock"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}knock kanda door 1`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return addReply(game, message, `You need to specify a player and an exit. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].toLowerCase());
    if (player === undefined) return addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    const input = args.join(" ");
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check that the input given is an exit in the player's current room.
    const exit = game.entityFinder.getExit(player.location, parsedInput);
    if (exit === undefined) return addReply(game, message, `Couldn't find exit "${parsedInput}" in the room.`);

    const action = new Action(game, ActionType.Knock, message, player, player.location, true);
    action.performKnock(exit);
    addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully knocked on ${exit.name} for ${player.name}.`);
}
