// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import DisbandPartyAction from '../Data/Actions/DisbandPartyAction.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "disband_player",
    description: "Disbands your party.",
    details: `Disbands your current party. You must be the leader of the party to use this command. `
        + `You will stop leading all of your party members, and your party's whisper channel will be deleted. `
        + `Your former party members will be notified that you are no longer leading them, but they will still be `
        + `following you unless they choose to stop, or you outrun them.\n\n`
        + `If you wish to only remove specific members from your party without disbanding it, use the \`dismiss\` `
        + `command. To view the current members of your party, use the \`party\` command.`,
    usableBy: "Player",
    aliases: ["disband", "dissolve"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}disband\n`
        + `${settings.commandPrefix}dissolve`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Player} player - The player who issued the command.
 */
export async function execute(game, message, command, args, player) {
    const status = player.getBehaviorAttributeStatusEffects("disable disband");
    if (status.length > 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCommandDisabledError(status[0]));
    if (!player.party) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateNotInPartyError(player, "Player"));
    if (!player.party.hasLeader(player)) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateNotPartyLeaderError(player, "Player", true));

    const action = new DisbandPartyAction(game, message, player, player.location, false);
    await action.performDisbandParty(false);
}
