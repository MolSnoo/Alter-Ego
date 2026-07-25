// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import QueueMoveAction from '../Data/Actions/QueueMoveAction.ts';
import StopFollowingAction from '../Data/Actions/StopFollowingAction.ts';

/** @import Moderator from '../Data/Moderator.ts'; */
/** @import GameSettings from '../Classes/GameSettings.ts'; */
/** @import Game from '../Data/Game.ts'; */

/** @type {CommandConfig} */
export const config = {
    name: "run_moderator",
    description: "Makes the given player run to the specified exit.",
    details: `Forcibly makes the given player run to the specified exit. This functions identically to the `
        + `\`move\` command when specifying a single player and the name of an exit, but the given player will move `
        + `twice as quickly, and consume stamina at three times the normal rate. You can queue their movements by `
        + `separating each destination with \`>\`.\n\n`
        + `Unlike the \`move\` command, it is not possible to move more than one player at the same time. `
        + `Additionally, the destination must be adjacent to the room the selected player is currently in, and the `
        + `exit leading to it must be unlocked and accessible to them for them to successfully move through it.\n\n`
        + `If the name of a room is given, they will move to it immediately instead of running. If this happens, `
        + `the narration in the destination room will not specify which exit they entered from.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["run"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}run Ai DOOR 2\n`
        + `${settings.commandPrefix}run Aisha PATH 3 > PATH 5 > PATH 2\n`
        + `${settings.commandPrefix}run Aisha biosphere-garden`;
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
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("a player and an exit", usage));
    else if (sentMessageInLatchChannel && args.length < 1)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("an exit", usage));

    let player = game.entityFinder.getLivingPlayer(args[0]?.replace(/'s/g, ""));
    if (player && !moderator.latchedPlayerHasName(args[0]))
        args.splice(0, 1);
    if (!player && sentMessageInLatchChannel)
        player = moderator.getLatch();
    if (player === undefined) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotFoundError([args[0]]));

    if (player.speed <= 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotMoveWithNoSpeedError(player, "Moderator"));

    player.stopMoving();
    if (player.followedPlayer) {
        const stopFollowingAction = new StopFollowingAction(game, message, player, player.location, true);
        await stopFollowingAction.performStopFollowing(false);
    }
    player.moveQueue = args.join(" ").split(">");
    const action = new QueueMoveAction(game, message, player, player.location, true);
    await action.performQueueMove(true, player.moveQueue[0]);
    return action.sendSuccessMessageToCommandChannel();
}


