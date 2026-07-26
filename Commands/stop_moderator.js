// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import StopAction from '../Data/Actions/StopAction.ts';

/** @import Moderator from '../Data/Moderator.ts'; */
/** @import GameSettings from '../Classes/GameSettings.ts'; */
/** @import Game from '../Data/Game.ts'; */

/** @type {CommandConfig} */
export const config = {
    name: "stop_moderator",
    description: "Stops a player's movement.",
    details: `Stops a player's current movement. Their current position will be preserved, so if they decide to start `
        + `moving to the same destination again, it will not take as long. This command will also cancel any queued `
        + `movements. If the player is following another player, this command will make them stop following them.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["stop", "st"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}stop Jackie\n`
        + `${settings.commandPrefix}st Fable`;
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
    if (!sentMessageInLatchChannel && args.length === 0)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("a player", usage));

    let player = game.entityFinder.getLivingPlayer(args[0]?.replace(/'s/g, ""));
    if (player && !moderator.latchedPlayerHasName(args[0]))
        args.splice(0, 1);
    if (!player && sentMessageInLatchChannel)
        player = moderator.getLatch();
    if (!player) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotFoundError([args[0]]));

    if (!player.followedPlayer && !player.isMoving)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayerNotMovingOrFollowingError(player, "Moderator"));

    const action = new StopAction(game, message, player, player.location, true);
    await action.performStop();
    action.sendSuccessMessageToCommandChannel();
}
