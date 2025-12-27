import Event from "../Data/Event.js";
import * as messageHandler from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "end_bot",
    description: "Ends an event.",
    details: "Ends the specified event. The event must be ongoing. If it isn't, nothing will happen. "
        + "If the event has any ended commands, they will not be run if they were passed by another event. "
        + "They will be run if they were passed by anything else, however.",
    usableBy: "Bot",
    aliases: ["end"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `end rain\n`
        + `end explosion`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (args.length === 0) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". No event was given.`);
        return;
    }

    const input = args.join(" ");
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    const event = game.entityFinder.getEvent(parsedInput);
    if (event === undefined) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find event "${input}".`);
    if (!event.ongoing) return;

    let doEndedCommands = false;
    if (callee && !(callee instanceof Event)) doEndedCommands = true;

    await event.end(doEndedCommands);

    return;
}
