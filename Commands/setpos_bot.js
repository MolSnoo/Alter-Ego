import Puzzle from "../Data/Puzzle.js";
import { addGameMechanicMessage } from "../Modules/messageHandler.js";

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
^    name: "setpos_bot",
^    description: "Sets a player's position.",
^    details: `Sets the specified player's position. If the "player" argument is used in place of a name, `
^        + `then the player who triggered the command will have their position updated. If the "room" argument `
^        + `is used instead, then all players in the same room as the player who triggered the command will have their `
^        + `positions updated. Lastly, if the "all" argument is used, then all players will have their positions updated. `
^        + `You can set individual coordinates with the "x", "y", or "z" arguments and the value to set it to. Otherwise, `
^        + `a space-separated list of coordinates in the order **x y z** must be given.`,
    usableBy: "Bot",
    aliases: ["setpos"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `setpos player 200 5 350\n`
        + `setpos room 400 -10 420\n`
        + `setpos vivian x 350\n`
        + `setpos player y 10\n`
        + `setpos all z 250\n`;
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
^
^    if (args.length < 2) {
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
^        return;
^    }
^
^    // Determine which player(s) are having their positions updated.
    let players = [];
^    if (args[0].toLowerCase() === "player" && player !== null)
^        players.push(player);
^    else if (args[0].toLowerCase() === "room" && player !== null)
^        players = player.location.occupants;
    else if (args[0].toLowerCase() === "room" && callee !== null && callee instanceof Puzzle)
        players = callee.location.occupants;
^    else if (args[0].toLowerCase() === "all") {
        players.concat(game.entityFinder.getLivingPlayers());
^    }
^    else {
        player = game.entityFinder.getLivingPlayer(args[0]);
        if (player === undefined) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find player "${args[0]}".`);
^        players.push(player);
^    }
^
^    if (args[1] === "x" && args[2]) {
        const x = parseInt(args[2]);
        if (isNaN(x)) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". "${args[2]}" is not a valid X-coordinate.`);
^
^        for (let i = 0; i < players.length; i++)
^            players[i].pos.x = x;
^    }
^    else if (args[1] === "y" && args[2]) {
        const y = parseInt(args[2]);
        if (isNaN(y)) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". "${args[2]}" is not a valid Y-coordinate.`);
^
^        for (let i = 0; i < players.length; i++)
^            players[i].pos.y = y;
^    }
^    else if (args[1] === "z" && args[2]) {
        const z = parseInt(args[2]);
        if (isNaN(z)) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". "${args[2]}" is not a valid Z-coordinate.`);
^
^        for (let i = 0; i < players.length; i++)
^            players[i].pos.z = z;
^    }
^    else if ((args[1] === "x" || args[1] === "y" || args[1] === "z") && !args[2])
        return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". An individual coordinate was specified, but no number was given.`);
^    else {
        const coordinates = args.slice(1);
        if (coordinates.length !== 3) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Invalid coordinates given.`);
^        for (let i = 0; i < coordinates.length; i++) {
            if (isNaN(parseInt(coordinates[i]))) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Invalid coordinates given.`);
^        }
^
^        for (let i = 0; i < players.length; i++) {
^            players[i].pos.x = parseInt(coordinates[0]);
^            players[i].pos.y = parseInt(coordinates[1]);
^            players[i].pos.z = parseInt(coordinates[2]);
^        }
^    }
}
