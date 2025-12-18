import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
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
 * @param {AEMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    var input = command + " " + args.join(" ");
    if (command === "exit" || command === "room") {
        if (args[0] === "lock") command = "lock";
        else if (args[0] === "unlock") command = "unlock";
        args = input.substring(input.indexOf(args[1])).split(" ");
    }

    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to input a room and an exit. Usage:\n${usage(game.settings)}`);

    input = args.join(" ");
    var parsedInput = input.replace(/ /g, "-").toLowerCase();

    // First, find the room.
    var room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.startsWith(game.rooms[i].name + '-')) {
            room = game.rooms[i];
            parsedInput = parsedInput.substring(room.name.length).replace(/-/g, " ").toUpperCase().trim();
            input = input.substring(input.toUpperCase().indexOf(parsedInput));
            break;
        }
        else if (parsedInput === game.rooms[i].name) return messageHandler.addReply(game, message, `You need to specify an exit to ${command}.`);
    }
    if (room === null) return messageHandler.addReply(game, message, `Couldn't find room "${input}".`);

    // Now that the room has been found, find the exit and its corresponding entrance.
    var exitIndex = -1;
    var exit = null;
    var entranceIndex = -1;
    var entrance = null;
    for (let i = 0; i < room.exit.length; i++) {
        if (room.exit[i].name === parsedInput) {
            exitIndex = i;
            exit = room.exit[i];
            for (let j = 0; j < exit.dest.exit.length; j++) {
                if (exit.dest.exit[j].name === exit.link) {
                    entranceIndex = j;
                    entrance = exit.dest.exit[j];
                    break;
                }
            }
            break;
        }
    }
    if (exit === null) return messageHandler.addReply(game, message, `Couldn't find exit "${input}" in ${room.name}.`);
    if (entrance === null) return messageHandler.addReply(game, message, `Found exit ${exit.name} in ${room.name}, but it doesn't have a corresponding entrance in ${exit.dest.name}.`);
    if (command === "unlock" && exit.unlocked && entrance.unlocked) return messageHandler.addReply(game, message, `${exit.name} in ${room.name} and ${entrance.name} in ${exit.dest.name} are already unlocked.`);
    if (command === "lock" && !exit.unlocked && !entrance.unlocked) return messageHandler.addReply(game, message, `${exit.name} in ${room.name} and ${entrance.name} in ${exit.dest.name} are already locked.`);

    // Now lock or unlock the exit.
    if (command === "lock") {
        room.lock(exitIndex);
        exit.dest.lock(entranceIndex);
    }
    else if (command === "unlock") {
        room.unlock(exitIndex);
        exit.dest.unlock(entranceIndex);
    }

    return;
}
