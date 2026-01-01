import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "setdest_moderator",
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
    usableBy: "Moderator",
    aliases: ["setdest"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}setdest corolla DOOR wharf VEHICLE\n`
        + `${settings.commandPrefix}setdest motor boat PORT docks BOAT\n`
        + `${settings.commandPrefix}setdest wharf MOTOR BOAT wharf MOTOR BOAT`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 4)
        return addReply(game, message, `You need to specify a room, an exit, another room, and another exit. Usage:\n${usage(game.settings)}`);

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
    if (room === undefined) return addReply(game, message, `Couldn't find room "${args.join(" ")}".`);
    else if (args.length === 0) return addReply(game, message, `You need to specify an exit in ${room.id}, another room, and another exit.`);

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
    if (exit === null) return addReply(game, message, `Couldn't find exit "${args.join(" ")}" in ${room.id}.`);
    else if (args.length === 0) return addReply(game, message, `You need to specify another room and another exit for ${exit.name} of ${room.id} to lead to.`);

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
    if (destRoom === null) return addReply(game, message, `Couldn't find room "${args.join(" ")}".`);
    else if (args.length === 0) return addReply(game, message, `You need to specify an exit in ${destRoom.id} for ${exit.name} of ${room.id} to lead to.`);

    // Now that the destination room has been found, find the destination exit.
    let destExit;
    for (let i = args.length - 1; i >= 0; i--) {
        const searchString = args.slice(0, i).join(" ");
        destExit = game.entityFinder.getExit(destRoom, searchString);
        if (destExit) {
            break;
        }
    }
    if (destExit === undefined) return addReply(game, message, `Couldn't find exit "${args.join(" ")}" in ${destRoom.id}.`);

    exit.dest = destRoom;
    exit.link = destExit.name;
    destExit.dest = room;
    destExit.link = exit.name;

    addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully updated destination of ${exit.name} in ${room.id}.`);
}
