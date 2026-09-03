// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import FollowAction from '../Data/Actions/FollowAction.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "follow_player",
    description: "Follows another player.",
    details: `Follows another player in the room with you. When you begin following them, you will no longer be able `
        + `to move of your own volition. Instead, when they start moving, you will automatically start moving in the `
        + `same direction. You will move at your speed or the speed of the player you're following—whichever is lower.\n\n`
        + `The player you follow will be notified that you've begun following them. If you aren't fast enough to keep `
        + `up with them, you will stop following them. This will happen if they reach their destination before you do, `
        + `and you don't see them in the room by the time you reach it.\n\n`
        + `If the player you follow wants to travel together with you, they can use the \`lead\` command to form a `
        + `party with you. If they lead you, you will travel together at the lowest speed of all players in your `
        + `party, ensuring no one gets left behind.\n\n`
        + `You can check if you are following anyone using the \`party\` command. `
        + `To stop following a player, use the \`stop\` command.`,
    usableBy: "Player",
    aliases: ["follow"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}follow Luna\n`
        + `${settings.commandPrefix}follow an individual wearing an ONNA MASK`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Player} player - The player who issued the command.
 */
export async function execute(game, message, command, args, player) {
    if (args.length === 0)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("a player to follow", usage));

    const status = player.getBehaviorAttributeStatusEffects("disable follow");
    if (status.length > 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCommandDisabledError(status[0]));
    if (player.speed <= 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotMoveWithNoSpeedError(player, "Player"));
    if (player.isMoving) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateAlreadyMovingError());
    if (player.followedPlayer) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotFollowWhenAlreadyFollowingError(player, "Player"));

    // This will be checked multiple times, so get it now.
    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");

    const input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    // First, find the player to follow.
    /** @type {Player} */
    let followedPlayer = null;
    for (let i = 0; i < player.location.occupants.length; i++) {
        const occupant = player.location.occupants[i];
        if (parsedInput === occupant.displayName.toUpperCase() && (hiddenStatus.length === 0 && !occupant.isHidden() || occupant.hidingSpot === player.hidingSpot)) {
            // Player cannot follow themself.
            if (occupant.name === player.name) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotSelectSelfError(player, "Player", "follow"));

            followedPlayer = occupant;
            break;
        }
        else if (parsedInput === occupant.displayName.toUpperCase() && hiddenStatus.length > 0 && !occupant.isHidden())
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCommandDisabledError(hiddenStatus[0]));
    }
    if (!followedPlayer) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayerNotFoundInRoomError(args[0]));
    if (player.isFollowing(followedPlayer)) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateAlreadyFollowingPlayerError(player, "Player"));
    if (followedPlayer.isFollowing(player))
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotFollowFollowerError(player, "Player", followedPlayer));
    // Prevent following loops.
    let nextFollowedPlayer = followedPlayer.followedPlayer;
    while (nextFollowedPlayer) {
        if (nextFollowedPlayer.name === player.name)
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateFollowingWouldCauseInfiniteLoopError(player, "Player", followedPlayer));
        nextFollowedPlayer = nextFollowedPlayer.followedPlayer;
    }

    const action = new FollowAction(game, message, player, player.location, false);
    await action.performFollow(followedPlayer);
}
