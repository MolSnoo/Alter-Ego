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
    name: "exit_bot",
    description: "Locks or unlocks an exit.",
    details: "Locks or unlocks an exit in the specified room. The corresponding entrance in the room the exit leads to "
        + "will also be locked, so that it goes both ways. When an exit is locked, players will be unable to enter the room "
        + "that exit leads to, and will be unable to enter through the exit from another room.",
    usableBy: "Bot",
    aliases: ["exit", "room", "lock", "unlock"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `exit lock carousel door\n`
        + `exit unlock headmasters quarters door\n`
        + `lock warehouse door 3\n`
        + `unlock trial grounds elevator`;
}

/**
 * @param {Game} game 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} [player] 
 * @param {Event|Flag|InventoryItem|Puzzle} [callee] 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    var input = cmdString;
    if (command === "exit" || command === "room") {
        if (args[0] === "lock") command = "lock";
        else if (args[0] === "unlock") command = "unlock";
        args = input.substring(input.indexOf(args[1])).split(" ");
    }

    if (args.length === 0) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

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
        else if (parsedInput === game.rooms[i].name) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". No exit was given.`);
    }
    if (room === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${input}".`);

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
    if (exit === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find exit "${input}" in ${room.name}.`);
    if (entrance === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Found exit ${exit.name} in ${room.name}, but it doesn't have a corresponding entrance in ${exit.dest.name}.`);
    if (command === "unlock" && exit.unlocked && entrance.unlocked) return;
    if (command === "lock" && !exit.unlocked && !entrance.unlocked) return;

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
