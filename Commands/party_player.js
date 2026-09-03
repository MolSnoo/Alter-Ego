// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as disbandPlayerCommand from './disband_player.js';
import * as dismissPlayerCommand from './dismiss_player.js';
import * as leadPlayerCommand from './lead_player.js';
import ViewPartyAction from '../Data/Actions/ViewPartyAction.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "party_player",
    description: "Displays your party.",
    details: `Displays your current party. A party is a group of two or more players that are traveling together. `
        + `A party is comprised of one leader and one or more followers. The leader decides where the party will go. `
        + `When the leader begins moving, everyone will move together at the lowest speed of any member in the `
        + `party. When a party is formed, a whisper channel is created for all party members to talk amongst `
        + `themselves as they move from room to room.\n\n`
        + `To form a party as the leader, another player must first start following you with the \`follow\` command. `
        + `Then, you can form a party with that player by leading them with the \`lead\` command. The \`party\` `
        + `command will tell you if you are the leader or a follower, and it will list any other followers in `
        + `the party. It will also tell you if you are following anyone, even if they aren't leading you in return.\n\n`
        + `If you are the leader of a party, you can remove one or more players from your party with the \`dismiss\` `
        + `command. You can also disband the party entirely with the \`disband\` command. If you are following another `
        + `player, you can stop doing so with the \`stop\` command, even if you aren't in a party with them.`,
    usableBy: "Player",
    aliases: ["party"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}party`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Player} player - The player who issued the command.
 */
export async function execute(game, message, command, args, player) {
    if (command === "party") {
        if (args[0] === "disband" || args[0] === "dissolve") command = "disband";
        else if (args[0] === "dismiss" || args[0] === "kick" || args[0] === "remove") command = "dismiss";
        else if (args[0] === "lead" || args[0] === "invite" || args[0] === "add") command = "lead";
        else command = "view";
        if (args[0] === "disband" || args[0] === "dissolve" || args[0] === "dismiss" || args[0] === "kick" ||
        args[0] === "remove" || args[0] === "lead" || args[0] === "invite" || args[0] === "add" || args[0] === "view")
            args.splice(0, 1);
    }
    // If the player wants to do something other than view their party, route their command appropriately.
    if (command === "disband") return await disbandPlayerCommand.execute(game, message, command, args, player);
    if (command === "dismiss") return await dismissPlayerCommand.execute(game, message, command, args, player);
    if (command === "lead") return await leadPlayerCommand.execute(game, message, command, args, player);

    const status = player.getBehaviorAttributeStatusEffects("disable party");
    if (status.length > 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCommandDisabledError(status[0]));

    const action = new ViewPartyAction(game, message, player, player.location, false);
    action.performViewParty();
}
