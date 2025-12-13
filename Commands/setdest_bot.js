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

    let input = args.join(" ");
    let parsedInput = input.replace(/ /g, "-").toLowerCase();

    // First, find the room.
    let room;
    for (let i = args.length - 1; i >= 0; i--) {
        let searchString = args.slice(0, i).join(" ");
        room = game.entityFinder.getRoom(searchString);
        if (room) {
            parsedInput = parsedInput.substring(room.id.length).replace(/-/g, " ").toUpperCase().trim();
            input = input.substring(input.toUpperCase().indexOf(parsedInput));
            args = args.slice(i);
            break;
        }
    }
    if (room === undefined) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${input}".`);
    else if (args.length === 0) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". No exit was given.`);

    // Now that the room has been found, find the exit.
    let exit = null;
    for (let i = 0; i < room.exit.length; i++) {
        if (parsedInput.startsWith(room.exit[i].name + ' ')) {
            exit = room.exit[i];
            parsedInput = parsedInput.substring(exit.name.length).toLowerCase().trim().replace(/ /g, "-");
            input = input.substring(input.replace(/ /g, "-").toLowerCase().indexOf(parsedInput)).trim();
            break;
        }
        else if (parsedInput === room.exit[i].name) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Another room and another exit for ${room.exit[i].name} of ${room.name} to lead to must be specified.`);
    }
    if (exit === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find exit "${input}" in ${room.name}.`);

    // Now find the destination room.
    let destRoom = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.startsWith(game.rooms[i].name + '-')) {
            destRoom = game.rooms[i];
            parsedInput = parsedInput.substring(destRoom.name.length).replace(/-/g, " ").toUpperCase().trim();
            input = input.substring(input.toUpperCase().indexOf(parsedInput)).trim();
            break;
        }
        else if (parsedInput === game.rooms[i].name) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". An exit in ${game.rooms[i].name} for ${exit.name} of ${room.name} to lead to must be specified.`);
    }
    if (destRoom === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${input}".`);

    // Now that the destination room has been found, find the destination exit.
    let destExit = null;
    for (let i = 0; i < destRoom.exit.length; i++) {
        if (destRoom.exit[i].name === parsedInput) {
            destExit = destRoom.exit[i];
            parsedInput = parsedInput.substring(destExit.name.length).toLowerCase().trim().replace(/ /g, "-");
            input = input.substring(input.replace(/ /g, "-").toLowerCase().indexOf(parsedInput)).trim();
            break;
        }
    }
    if (destExit === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find exit "${input}" in ${destRoom.name}.`);

    exit.dest = destRoom;
    exit.link = destExit.name;
    destExit.dest = room;
    destExit.link = exit.name;

    return;
}
