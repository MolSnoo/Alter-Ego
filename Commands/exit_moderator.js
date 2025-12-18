import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "exit_moderator",
    description: "Locks or unlocks an exit.",
    details: "Locks or unlocks an exit in the specified room. The corresponding entrance in the room the exit leads to "
        + "will also be locked, so that it goes both ways. When an exit is locked, players will be unable to enter the room "
        + "that exit leads to, and will be unable to enter through the exit from another room. If the exit can also be locked "
        + "or unlocked via a puzzle, you should NOT lock/unlock it with this command. Instead, use the puzzle command to "
        + "solve/unsolve it.",
    usableBy: "Moderator",
    aliases: ["exit", "room", "lock", "unlock"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}exit lock carousel door\n`
        + `${settings.commandPrefix}exit unlock headmasters quarters door\n`
        + `${settings.commandPrefix}lock warehouse door 3\n`
        + `${settings.commandPrefix}unlock trial grounds elevator`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    let input = command + " " + args.join(" ");
    if (command === "exit" || command === "room") {
        if (args[0] === "lock") command = "lock";
        else if (args[0] === "unlock") command = "unlock";
        args = input.substring(input.indexOf(args[1])).split(" ");
    }

    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to input a room and an exit. Usage:\n${usage(game.settings)}`);

    input = args.join(" ");
    let parsedInput = input.replace(/ /g, "-").toLowerCase();

    // First, find the room.
    let room;
    for (let i = args.length - 1; i >= 0; i--) {
        const searchString = args.slice(0, i).join(" ");
        room = game.entityFinder.getRoom(searchString);
        if (room) {
            parsedInput = parsedInput.substring(room.id.length).replace(/-/g, " ").toUpperCase().trim();
            input = input.substring(input.toUpperCase().indexOf(parsedInput));
            args = args.slice(i);
            break;
        }
    }
    if (room === undefined) return messageHandler.addReply(game, message, `Couldn't find room "${input}".`);
    else if (args.length === 0) return messageHandler.addReply(game, message, `You need to specify an exit to ${room.id}.`);

    // Now that the room has been found, find the exit and its corresponding entrance.
    const exit = game.entityFinder.getExit(room, parsedInput);
    const entrance = game.entityFinder.getExit(exit.dest, exit.link);
    if (exit === undefined) return messageHandler.addReply(game, message, `Couldn't find exit "${input}" in ${room.id}.`);
    if (entrance === undefined) return messageHandler.addReply(game, message, `Found exit ${exit.name} in ${room.id}, but it doesn't have a corresponding entrance in ${exit.dest.id}.`);
    if (command === "unlock" && exit.unlocked && entrance.unlocked) return messageHandler.addReply(game, message, `${exit.name} in ${room.id} and ${entrance.name} in ${exit.dest.id} are already unlocked.`);
    if (command === "lock" && !exit.unlocked && !entrance.unlocked) return messageHandler.addReply(game, message, `${exit.name} in ${room.id} and ${entrance.name} in ${exit.dest.id} are already locked.`);

    // Now lock or unlock the exit.
    if (command === "lock") {
        room.lockExit(exit.name);
        exit.dest.lockExit(entrance.name);
    }
    else if (command === "unlock") {
        room.unlockExit(exit.name);
        exit.dest.unlockExit(entrance.name);
    }

    return;
}
