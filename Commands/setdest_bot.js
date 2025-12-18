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
    name: "setdest_bot",
    description: "Updates an exit's destination.",
    details: "Replaces the destination for the specified room's exit. Given the following initial room setup:\n```"
        + "Room Name|Exits |Leads To|From\n"
        + "---------------------------------\n"
        + "room-1   |EXIT A|room-2  | EXIT B\n"
        + "---------------------------------\n"
        + "room-2   |EXIT B|room-1  | EXIT A\n"
        + "         |EXIT C|room-3  | EXIT D\n"
        + "---------------------------------\n"
        + "room-3   |EXIT D|room-2  | EXIT C```\n"
        + "If the destination for room-1's EXIT A is set to room-3's EXIT D, players passing through EXIT A would emerge from EXIT D from that point onward. "
        + "The Rooms sheet will be updated to reflect the updated destination, like so:\n```"
        + "room-1   |EXIT A|room-3  | EXIT D\n"
        + "---------------------------------\n"
        + "...\n"
        + "---------------------------------\n"
        + "room-3   |EXIT D|room-1  | EXIT A```\n"
        + "Note that this will leave room-2's EXIT B and EXIT C without exits that lead back to them, which will result in errors next time rooms are loaded. "
        + "To prevent this, this command should be used sparingly, and all affected exits should have their destinations reassigned.",
    usableBy: "Bot",
    aliases: ["setdest"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `setdest corolla DOOR wharf VEHICLE\n`
        + `setdest motor boat PORT docks BOAT\n`
        + `setdest wharf MOTOR BOAT wharf MOTOR BOAT`;
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

    if (args.length < 4)
        return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);

    // First, find the room.
    let room;
    for (let i = args.length - 1; i >= 0; i--) {
        const searchString = args.slice(0, i).join(" ");
        room = game.entityFinder.getRoom(searchString);
        if (room) {
            args = args.slice(i);
            break;
        }
    }
    if (room === undefined) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${args.join(" ")}".`);
    else if (args.length === 0) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". No exit was given.`);

    // Now that the room has been found, find the exit.
    let exit;
    for (let i = args.length - 1; i >= 0; i--) {
        const searchString = args.slice(0, i).join(" ");
        exit = game.entityFinder.getExit(room, searchString);
        if (exit) {
            args = args.slice(i);
            break;
        }
    }
    if (exit === undefined) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find exit "${args.join(" ")}" in ${room.id}.`);
    else if (args.length === 0) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Another room and another exit for ${exit.name} of ${room.id} to lead to must be specified.`);

    // Now find the destination room.
    let destRoom;
    for (let i = args.length - 1; i >= 0; i--) {
        const searchString = args.slice(0, i).join(" ");
        destRoom = game.entityFinder.getRoom(searchString);
        if (destRoom) {
            args = args.slice(i);
            break;
        }
    }
    if (destRoom === undefined) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${args.join(" ")}".`);
    else if (args.length === 0) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". An exit in ${destRoom.id} for ${exit.name} of ${room.id} to lead to must be specified.`);

    // Now that the destination room has been found, find the destination exit.
    let destExit;
    for (let i = args.length - 1; i >= 0; i--) {
        const searchString = args.slice(0, i).join(" ");
        destExit = game.entityFinder.getExit(destRoom, searchString);
        if (destExit) {
            break;
        }
    }
    if (destExit === undefined) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find exit "${args.join(" ")}" in ${destRoom.id}.`);

    exit.dest = destRoom;
    exit.link = destExit.name;
    destExit.dest = room;
    destExit.link = exit.name;

    return;
}
