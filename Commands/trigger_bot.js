import GameSettings from "../Classes/GameSettings.js";
import Game from "../Data/Game.js";
import Player from "../Data/Player.js";
import Event from "../Data/Event.js";
import Flag from "../Data/Flag.js";
import InventoryItem from "../Data/InventoryItem.js";
import Puzzle from "../Data/Puzzle.js";
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "trigger_bot",
    description: "Triggers an event.",
    details: "Triggers the specified event. The event must not already be ongoing. If it is, nothing will happen. "
        + "If the event has any triggered commands, they will not be run if they were passed by another event. "
        + "They will be run if they were passed by anything else, however.",
    usableBy: "Bot",
    aliases: ["trigger"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `trigger rain\n`
        + `trigger explosion`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Event|Flag|InventoryItem|Puzzle} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (args.length === 0) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". No event was given.`);
        return;
    }

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var event = null;
    for (let i = 0; i < game.events.length; i++) {
        if (game.events[i].id === parsedInput) {
            event = game.events[i];
            break;
        }
    }
    if (event === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find event "${input}".`);
    if (event.ongoing) return;

    var doTriggeredCommands = false;
    if (callee && !(callee instanceof Event)) doTriggeredCommands = true;

    await event.trigger(doTriggeredCommands);

    return;
}
