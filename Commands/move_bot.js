import Event from "../Data/Event.js";
import { addGameMechanicMessage, addLogMessage } from "../Modules/messageHandler.js";

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "move_bot",
    description: "Moves the given player(s) to the specified room.",
    details: 'Forcibly moves the specified player to the specified room. If you use "all" in place of the player, '
        + 'it will move all living players to the specified room (skipping over players who are already in that room as well as players with the Headmaster role). '
        + 'If you use "player" in place of the player, then the player who triggered the command will be moved. If you use "room" instead, all players in the room will be moved. '
        + 'All of the same things that happen when a player moves to a room of their own volition apply, however you can move players to non-adjacent rooms this way. '
        + 'The bot will not announce which exit the player leaves through or which entrance they enter from when a player is moved to a non-adjacent room.',
    usableBy: "Bot",
    aliases: ["move"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `move susie main-office\n`
        + `move player general-managers-office\n`
        + `move player cafeteria\n`
        + `move room trial-grounds\n`
        + `move all elevator`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute(game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (args.length === 0) {
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    // Get all listed players first.
    let players = [];
    if (args[0].toLowerCase() === "player" && player !== null) {
        players.push(player);
        args.splice(0, 1);
    }
    else if (args[0].toLowerCase() === "room" && callee !== null && callee instanceof Event) {
        // Command was triggered by an Event. Get occupants of all rooms affected by it.
        game.entityFinder.getRooms(null, callee.roomTag, true).map((room) => {
            players = players.concat(room.occupants);
        });
        args.splice(0, 1);
    }
    else if (args[0].toLowerCase() === "room" && player !== null) {
        for (let i = 0; i < player.location.occupants.length; i++)
            players.push(player.location.occupants[i]);
        args.splice(0, 1);
    }
    else if (args[0].toLowerCase() === "all") {
        game.entityFinder.getLivingPlayers(null, false).map((player) => {
            if (!player.member.roles.cache.find((role) => role.id === game.guildContext.freeMovementRole.id))
                players.push(player);
        });
        args.splice(0, 1);
    }
    else {
        player = game.entityFinder.getLivingPlayer(args[0]);
        if (player === undefined) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find player "${args[0]}".`);
        players.push(player);
        args.splice(0, 1);
    }
    // Args at this point should only include the room name.
    // Check to see that the last argument is the name of a room.
    let input = args.join(" ").replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
    const desiredRoom = game.entityFinder.getRoom(input);
    if (desiredRoom === undefined) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${input}".`);
    input = input.substring(0, input.indexOf(desiredRoom.id));
    args = input.split("-");

    for (let i = 0; i < players.length; i++) {
        // Skip over players who are already in the specified room.
        if (players[i].location !== desiredRoom) {
            const currentRoom = players[i].location;
            // Check to see if the given room is adjacent to the current player's room.
            let exit;
            let exitPuzzle;
            let entrance;
            for (const targetExit of currentRoom.exitCollection.values()) {
                if (targetExit.dest.id === desiredRoom.id) {
                    exit = targetExit;
                    exitPuzzle = game.entityFinder.getPuzzles(exit.name, currentRoom.id, "restricted exit")[0];
                    entrance = game.entityFinder.getExit(desiredRoom, exit.link);
                    break;
                }
            }

            const appendString = players[i].createMoveAppendString();
            let exitMessage;
            if (exit) exitMessage = `${players[i].displayName} exits into ${exit.name}${appendString}`;
            else exitMessage = `${players[i].displayName} exits${appendString}`;
            let entranceMessage;
            if (entrance) entranceMessage = `${players[i].displayName} enters from ${entrance.name}${appendString}`;
            else entranceMessage = `${players[i].displayName} enters${appendString}`;
            // Clear the player's movement timer first.
            players[i].stopMoving();
            // Solve the exit puzzle, if applicable.
            if (exitPuzzle && exitPuzzle.accessible && exitPuzzle.solutions.includes(players[i].name))
                exitPuzzle.solve(players[i], "", players[i].name, true);
            // Move the player.
            currentRoom.removePlayer(players[i], exit, exitMessage);
            desiredRoom.addPlayer(players[i], entrance, entranceMessage, true);
        }
    }

    // Create a list of players moved for the log message.
    let playerList = players[0].name;
    if (players.length === 2) playerList += ` and ${players[1].name}`;
    else if (players.length >= 3) {
        for (let i = 1; i < players.length; i++) {
            if (i === players.length - 1) playerList += `, and ${players[i].name}`;
            else playerList += `, ${players[i].name}`;
        }
    }

    // Post log message.
    const time = new Date().toLocaleTimeString();
    addLogMessage(game, `${time} - ${playerList} forcibly moved to ${desiredRoom.channel}`);
}
