import { addGameMechanicMessage } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

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
} ;

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
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    let input = cmdString;
    if (command === "exit" || command === "room") {
        if (args[0] === "lock") command = "lock";
        else if (args[0] === "unlock") command = "unlock";
        args = input.substring(input.indexOf(args[1])).split(" ");
    }

    if (args.length === 0) {
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

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
    if (room === undefined) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${input}".`);
    else if (args.length === 0) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". No exit was given.`);

    // Now that the room has been found, find the exit and its corresponding entrance.
    const exit = game.entityFinder.getExit(room, parsedInput);
    const entrance = game.entityFinder.getExit(exit.dest, exit.link);
    if (exit === undefined) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find exit "${input}" in ${room.id}.`);
    if (entrance === undefined) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Found exit ${exit.name} in ${room.id}, but it doesn't have a corresponding entrance in ${exit.dest.id}.`);
    if (command === "unlock" && exit.unlocked && entrance.unlocked) return;
    if (command === "lock" && !exit.unlocked && !entrance.unlocked) return;

    // Now lock or unlock the exit.
    if (command === "lock") {
        room.lockExit(exit.name);
        exit.dest.lockExit(entrance.name);
    }
    else if (command === "unlock") {
        room.unlockExit(exit.name);
        exit.dest.unlockExit(entrance.name);
    }
}
