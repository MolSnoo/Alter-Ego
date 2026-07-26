// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import MoveAction from '../Data/Actions/MoveAction.ts';
import QueueMoveAction from '../Data/Actions/QueueMoveAction.ts';
import StopFollowingAction from '../Data/Actions/StopFollowingAction.ts';

/** @import Moderator from '../Data/Moderator.ts'; */
/** @import GameSettings from '../Classes/GameSettings.ts'; */
/** @import Game from '../Data/Game.ts'; */
/** @import Exit from '../Data/Exit.ts'; */
/** @import Player from '../Data/Player.ts'; */
/** @import Room from '../Data/Room.ts'; */

/** @type {CommandConfig} */
export const config = {
    name: "move_moderator",
    description: "Moves the given player to the specified room or exit.",
    details: `Forcibly moves the given players to the specified room or exit. When a player is moved, they will be `
        + `removed from the room channel they were already in and added to the destination room channel.\n\n`
        + `If a single player and the name of an exit in the room they're in are given, they will begin moving to that `
        + `exit, using stamina along the way. You can also queue their movements this way by separating each `
        + `destination with \`>\`. However, if you wish to move them through an exit immediately and bypass locks and `
        + `inaccessibility, you can use the \`teleport\` or \`tp\` alias.\n\n`
        + `If multiple players are listed, or the name of a room is given, the listed players will move to the given `
        + `destination immediately, without consuming any stamina, and with no regard for `
        + `whether the room is adjacent to their current room or the exit leading to it is locked.\n\n`
        + `You can select multiple players by separating their names with a space. If instead of providing the names of `
        + `players, you enter "living" or "all", all living players will be moved to the specified room, except for `
        + `players who are already in that room, NPCs, and players with the Free Movement role.\n\n`
        + `When this command is used to move a player to a room that is not adjacent to their current room, `
        + `the narration in the destination room will not specify which exit they entered from. Additionally, all players `
        + `who were following someone will stop following them. This will disband the parties of all moved players.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["move", "go", "enter", "walk", "m", "teleport", "tp"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}move Kiki DOOR 2\n`
        + `${settings.commandPrefix}m Lingling PATH 3 > PATH 5 > PATH 2\n`
        + `${settings.commandPrefix}teleport Maple BLAST DOOR\n`
        + `${settings.commandPrefix}enter Kiki Lingling Maple Wally biosphere-garden\n`
        + `${settings.commandPrefix}go living Dining Hall\n`
        + `${settings.commandPrefix}tp all ELEVATOR`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    const sentMessageInLatchChannel = moderator?.sentMessageInLatchChannel(message) ?? false;
    if (!sentMessageInLatchChannel && args.length < 2)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("at least one player and a room or exit", usage));
    else if (sentMessageInLatchChannel && args.length < 1)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("a room or exit", usage));
    const teleport = command === "teleport" || command === "tp";

    // Get all listed players first.
    let singlePlayerSelected = false;
    /** @type {Player[]} */
    const players = [];
    if (args[0] === "all" || args[0] === "living") {
        game.entityFinder.getLivingPlayers(null, false).map((player) => {
            if (!player.canMoveFreely())
                players.push(player);
        });
        args.splice(0, 1);
    }
    else {
        for (let i = args.length - 1; i >= 0; i--) {
            const fetchedPlayer = game.entityFinder.getLivingPlayer(args[i]);
            if (fetchedPlayer) {
                players.push(fetchedPlayer);
                args.splice(i, 1);
            }
        }
        if (players.length === 0 && sentMessageInLatchChannel) players.push(moderator.getLatch());
        if (players.length === 1) singlePlayerSelected = true;
    }

    // If we only want to move a single player and the teleport alias wasn't used, perform a QueueMoveAction.
    if (singlePlayerSelected && !teleport) {
        const player = players[0];
        if (player.speed <= 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotMoveWithNoSpeedError(player, "Moderator"));
        player.stopMoving();
        if (player.followedPlayer) {
            const stopFollowingAction = new StopFollowingAction(game, message, player, player.location, true);
            await stopFollowingAction.performStopFollowing(false);
        }
        player.moveQueue = args.join(" ").split(">");
        const action = new QueueMoveAction(game, message, player, player.location, true);
        await action.performQueueMove(false, player.moveQueue[0]);
        return action.sendSuccessMessageToCommandChannel();
    }

    // Args at this point should only include the room/exit name, as well as any players that weren't found.
    // Check to see that the last argument is the name of a room.
    let input = args.join(" ").replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
    /** @type {Room} */
    let desiredRoom = null;
    for (let i = 0; i < args.length; i++) {
        const searchString = args.slice(i).join(" ").replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
        desiredRoom = game.entityFinder.getRoom(searchString);
        if (desiredRoom) {
            input = input.substring(0, input.indexOf(desiredRoom.id));
            args = input.split("-");
            break;
        }
    }
    // Now, if the room couldn't be found, try looking for the name of an exit.
    // All given players must be in the same room for this to work.
    let isExit = false;
    /** @type {Exit} */
    let exit = null;
    /** @type {Exit} */
    let entrance = null;
    if (!desiredRoom && players.length !== 0) {
        const currentRoom = players[0].location;
        for (let i = 1; i < players.length; i++) {
            if (players[i].location !== currentRoom) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotUseExitOnPlayersInDifferentRoomsError());
        }
        input = args.join(" ").toUpperCase();
        for (let i = 0; i <= args.length; i++) {
            const searchString = args.slice(i).join(" ")
            exit = game.entityFinder.getExit(currentRoom, searchString);
            if (exit) {
                isExit = true;
                desiredRoom = exit.dest;
                entrance = game.entityFinder.getExit(desiredRoom, exit.link);
                input = input.substring(0, input.indexOf(exit.name));
                args = input.split(" ")
                break;
            }
        }
    }
    // Remove any blank entries in args.
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '') {
            args.splice(i, 1);
            i--;
        }
    }
    if (args.length > 0) {
        if (!desiredRoom && !exit) {
            const roomName = args.join(" ");
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateEntityNotFoundError("room or exit", roomName));
        }
        else {
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotFoundError(args));
        }
    }
    if (players.length === 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyError("at least one player"));

    for (let i = 0; i < players.length; i++) {
        // Skip over players who are already in the specified room.
        if (players[i].location !== desiredRoom) {
            const currentRoom = players[i].location;
            // If an exit name was used, don't try and find it again.
            if (!isExit) {
                // Check to see if the given room is adjacent to the current player's room.
                exit = null;
                entrance = null;
                for (const iterExit of currentRoom.exits.values()) {
                    if (iterExit.dest.id === desiredRoom.id) {
                        exit = iterExit;
                        entrance = game.entityFinder.getExit(desiredRoom, exit.link);
                        break;
                    }
                }
            }

            // Clear the player's movement timer first.
            players[i].stopMoving();
            // If the player is following anyone, make them stop following.
            if (players[i].followedPlayer) {
                const stopFollowingAction = new StopFollowingAction(game, message, players[i], players[i].location, true);
                await stopFollowingAction.performStopFollowing(false);
            }
            // If anyone if following the player, they have lost track of them and should stop following them.
            const followers = new Set(players[i].location.occupants.filter(occupant => occupant.isFollowing(players[i])));
            if (followers.size > 0) {
                const [firstFollower] = followers;
                const stopFollowingAction = new StopFollowingAction(game, message, firstFollower, firstFollower.location, true);
                await stopFollowingAction.performStopFollowing(false, followers);
            }
            // Move the player.
            const action = new MoveAction(game, message, players[i], players[i].location, true);
            await action.performMove(false, currentRoom, desiredRoom, exit, entrance);
        }
    }

    game.communicationHandler.sendToCommandChannel(`The listed players have been moved to ${desiredRoom.channel}.`);
}
