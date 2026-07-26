// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Event from "../Data/Event.ts";
import MoveAction from "../Data/Actions/MoveAction.ts";
import StopFollowingAction from "../Data/Actions/StopFollowingAction.ts";

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */
/** @import Exit from '../Data/Exit.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "move_bot",
    description: "Moves the given player to the specified room.",
    details: `Forcibly moves the given players to the specified room. When a player is moved, they will be `
        + `removed from the room channel they were already in and added to the destination room channel. `
        + `They will move to the given destination immediately, without consuming any stamina, and with no regard for `
        + `whether the room is adjacent to their current room or the exit leading to it is locked.\n\n`
        + `You can select multiple players by separating their names with a space. If instead of providing the names of `
        + `players, you enter "all", all living players will be moved to the specified room, except for players `
        + `who are already in that room, NPCs, and players with the Free Movement role. However, if you instead `
        + `use "player", the player who caused this command to be executed will be moved to the given destination. `
        + `If "room" is used instead, then all players in the room with the initiating player will be moved, including `
        + `NPCs and players with the Free Movement role. However, if the command was issued by an event and the "room" `
        + `argument is used, all players in all rooms that have the event's room tag will be moved.\n\n`
        + `When this command is used to move a player to a room that is not adjacent to their current room, `
        + `the narration in the destination room will not specify which exit they entered from.\n\n`
        + `This command will always make players stop following anyone they may have been following. `
        + `This will disband the parties of all moved players.`,
    usableBy: "Bot",
    aliases: ["move", "go", "enter", "walk", "m", "teleport", "tp"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `move Flint Chancellor's Office\n`
        + `enter player general-managers-office\n`
        + `go player Dining Hall\n`
        + `move room ultimate-conference-hall\n`
        + `m all Elevator`;
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
    if (args.length < 2) {
        game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    // Get all listed players first.
    /** @type {Player[]} */
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
            if (!player.canMoveFreely())
                players.push(player);
        });
        args.splice(0, 1);
    }
    else {
        player = game.entityFinder.getLivingPlayer(args[0]);
        if (player === undefined) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find player "${args[0]}".`);
        players.push(player);
        args.splice(0, 1);
    }
    // Args at this point should only include the room name.
    // Check to see that the last argument is the name of a room.
    let input = args.join(" ").replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
    const desiredRoom = game.entityFinder.getRoom(input);
    if (desiredRoom === undefined) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find room "${input}".`);
    input = input.substring(0, input.indexOf(desiredRoom.id));
    args = input.split("-");

    for (let i = 0; i < players.length; i++) {
        // Skip over players who are already in the specified room.
        if (players[i].location !== desiredRoom) {
            const currentRoom = players[i].location;
            // Check to see if the given room is adjacent to the current player's room.
            /** @type {Exit} */
            let exit;
            /** @type {Exit} */
            let entrance;
            for (const targetExit of currentRoom.exits.values()) {
                if (targetExit.dest.id === desiredRoom.id) {
                    exit = targetExit;
                    entrance = game.entityFinder.getExit(desiredRoom, exit.link);
                    break;
                }
            }

            // Clear the player's movement timer first.
            players[i].stopMoving();
            // If the player is following anyone, make them stop following.
            if (players[i].followedPlayer) {
                const stopFollowingAction = new StopFollowingAction(game, undefined, players[i], players[i].location, true);
                await stopFollowingAction.performStopFollowing(false);
            }
            // If anyone if following the player, they have lost track of them and should stop following them.
            const followers = new Set(players[i].location.occupants.filter(occupant => occupant.isFollowing(players[i])));
            if (followers.size > 0) {
                const [firstFollower] = followers;
                const stopFollowingAction = new StopFollowingAction(game, undefined, firstFollower, firstFollower.location, true);
                await stopFollowingAction.performStopFollowing(false, followers);
            }
            // Move the player.
            const action = new MoveAction(game, undefined, players[i], players[i].location, true);
            await action.performMove(false, currentRoom, desiredRoom, exit, entrance);
        }
    }
}
