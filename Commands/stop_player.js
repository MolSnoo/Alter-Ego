// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import StopAction from '../Data/Actions/StopAction.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "stop_player",
    description: "Stops your movement.",
    details: `Stops you in your tracks while moving to another room. Your distance to that room will be preserved, `
        + `so if you decide to move to that room again, it will not take as long. This command will also cancel any `
        + `queued movements. If you are following another player, you can stop following them with this command.`,
    usableBy: "Player",
    aliases: ["stop", "st"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}stop\n`
        + `${settings.commandPrefix}st`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Player} player - The player who issued the command.
 */
export async function execute(game, message, command, args, player) {
    const status = player.getBehaviorAttributeStatusEffects("disable stop");
    if (status.length > 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCommandDisabledError(status[0]));

    if (!player.followedPlayer && !player.isMoving) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayerNotMovingOrFollowingError(player, "Player"));

    const action = new StopAction(game, message, player, player.location, false);
    action.performStop();
}
