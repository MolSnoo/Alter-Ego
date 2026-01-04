import AttemptAction from "../Data/Actions/AttemptAction.js";
import SolveAction from "../Data/Actions/SolveAction.js";
import UnsolveAction from "../Data/Actions/UnsolveAction.js";
import Puzzle from "../Data/Puzzle.js";
import { addGameMechanicMessage } from "../Modules/messageHandler.js";

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
^    name: "puzzle_bot",
^    description: "Solves or unsolves a puzzle.",
    details: 'Solves or unsolves a puzzle. You may specify an outcome, if the puzzle has more than one solution. '
        + 'You may specify a player to solve the puzzle. If you do, players in the room '
        + 'will be notified, so you should generally give a string for the bot to use, '
^        + 'otherwise the bot will say "[player] uses the [puzzle]." which may not sound right. '
^        + "If you specify a player, only puzzles in the room that player is in can be solved/unsolved. "
        + 'Additionally, if you specify a player, you can make them attempt to solve a puzzle. '
^        + 'If you use "player" in place of the player, then the player who triggered the command will be '
^        + 'the one to solve/unsolve the puzzle. It will also do the same in the string, if one is specified. '
^        + 'You can also use a room name instead of a player name. In that case, only puzzles in the room '
^        + 'you specify can be solved/unsolved. This is useful if you have multiple puzzles with the same name '
^        + 'spread across the map.',
    usableBy: "Bot",
    aliases: ["puzzle", "solve", "unsolve", "attempt"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `puzzle solve button\n`
        + `puzzle unsolve keypad\n`
        + `solve binder taylor\n`
        + `unsolve lever colin\n`
        + `solve computer PASSWORD1\n`
        + `solve computer PASSWORD2\n`
        + `puzzle solve keypad tool shed\n`
        + `puzzle unsolve lock men's locker room\n`
        + `solve paintings player "player removes the PAINTINGS from the wall."\n`
        + `unsolve lock men's locker room "The LOCK on LOCKER 1 locks itself"\n`
        + `puzzle attempt cyptex lock 05-25-99 player`;
}
^
/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
^    const cmdString = command + " " + args.join(" ");
    let input = cmdString;
^    if (command === "puzzle") {
^        if (args[0] === "solve") command = "solve";
^        else if (args[0] === "unsolve") command = "unsolve";
        else if (args[0] === "attempt") command = "attempt";
^        input = input.substring(input.indexOf(args[1]));
^        args = input.split(" ");
^    }
^    else input = args.join(" ");
^
^    if (args.length === 0) {
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
^        return;
^    }
^
^    // The message, if it exists, is the easiest to find at the beginning. Look for that first.
    let announcement = "";
    let index = input.indexOf('"');
^    if (index === -1) index = input.indexOf('“');
^    if (index !== -1) {
^        announcement = input.substring(index + 1);
^        // Remove the announcement from the list of arguments.
^        input = input.substring(0, index - 1);
^        args = input.split(" ");
^        // Now clean up the announcement text.
^        if (announcement.endsWith('"') || announcement.endsWith('”'))
^            announcement = announcement.substring(0, announcement.length - 1);
^        if (!announcement.endsWith('.') && !announcement.endsWith('!'))
^            announcement += '.';
^    }
^
^    // Find the prospective list of puzzles.
    const puzzles = game.puzzles.filter(puzzle => input.toUpperCase().startsWith(puzzle.name + ' ') || input.toUpperCase() === puzzle.name);
^    if (puzzles.length > 0) {
^        input = input.substring(puzzles[0].name.length).trim();
^        args = input.split(" ");
^    }
^
^    // Now find the player, who should be the last argument.
^    if (args[args.length - 1] === "player" && player !== null) {
^        args.splice(args.length - 1, 1);
^        input = args.join(" ");
^        announcement = announcement.replace(/player/g, player.displayName);
^    }
^    else {
        player = game.entityFinder.getLivingPlayer(args[args.length - 1]);
        if (player) {
            args.splice(args.length - 1, 1);
            input = args.join(" ");
        } else
            player = null;
^    }
^
^    // If a player wasn't specified, check if a room name was.
    let room = null;
^    if (player === null) {
^        const parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
        for (let i = args.length - 1; i >= 0; i--) {
            room = game.entityFinder.getRoom(args.splice(i).join(" "));
            if (room) {
                input = input.substring(0, parsedInput.indexOf(room.id) - 1);
^                break;
^            }
^        }
        if (!room) room = null;
^    }
^
^    // Finally, find the puzzle.
    let puzzle = null;
^    for (let i = 0; i < puzzles.length; i++) {
        if ((player !== null && puzzles[i].location.id === player.location.id)
            || (room !== null && puzzles[i].location.id === room.id)) {
^            puzzle = puzzles[i];
^            break;
^        }
^    }
^    if (puzzle === null && player === null && room === null && puzzles.length > 0) puzzle = puzzles[0];
    if (puzzle === null) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find puzzle "${input}".`);
^
    let outcome = "";
    let targetPlayer = null;
    if (player !== null && puzzle.type === "room player") {
        targetPlayer = game.entityFinder.getLivingPlayers(null, null, player.location.id).filter((player) => {
            player.displayName.toLowerCase() === input.toLowerCase() ||
                player.name.toLowerCase() === input.toLowerCase();
        })[0];
        if (!targetPlayer) targetPlayer === null;
    }
    for (let i = 0; i < puzzle.solutions.length; i++) {
        if (targetPlayer && puzzle.solutions[i].toLowerCase() === targetPlayer.displayName.toLowerCase() ||
            puzzle.type !== "room player" && puzzle.solutions[i].toLowerCase() === input.toLowerCase()) {
            outcome = puzzle.solutions[i];
            break;
        }
    }

^    if (command === "solve") {
        if (puzzle.solutions.length > 1 && input !== "" && outcome === "") return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". "${input}" is not a valid solution.`);
        const solveAction = new SolveAction(game, undefined, player, puzzle.location, true);
        solveAction.performSolve(puzzle, outcome, targetPlayer, announcement, callee);
^    }
^    else if (command === "unsolve") {
        const unsolveAction = new UnsolveAction(game, undefined, player, puzzle.location, true);
        unsolveAction.performUnsolve(puzzle, announcement, callee);
^    }
    else if (command === "attempt") {
        if (player === null) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Cannot attempt a puzzle without a player.`);
        const attemptAction = new AttemptAction(game, undefined, player, puzzle.location, true);
        attemptAction.performAttempt(puzzle, undefined, input, command, input, targetPlayer);
    }
}
