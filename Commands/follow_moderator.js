// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import FollowAction from '../Data/Actions/FollowAction.ts';

/** @import Moderator from '../Data/Moderator.ts'; */
/** @import GameSettings from '../Classes/GameSettings.ts'; */
/** @import Game from '../Data/Game.ts'; */

/** @type {CommandConfig} */
export const config = {
    name: "follow_moderator",
    description: "Makes the given player follow another player.",
    // TODO: Write help details.
    details: ``,
    usableBy: "Moderator",
    aliases: ["follow"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    // TODO: Write examples.
    return `${settings.commandPrefix}`;
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
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("two players", usage));
    if (sentMessageInLatchChannel && args.length < 1)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("a player to follow", usage));

    // First, find the player to follow.
    let followedPlayer = game.entityFinder.getLivingPlayer(args[1]?.replace(/'s/g, ""));
    if (followedPlayer) args.splice(1, 1);
    if (!followedPlayer && sentMessageInLatchChannel) {
        followedPlayer = game.entityFinder.getLivingPlayer(args[0]?.replace(/'s/g, ""));
        if (followedPlayer) args.splice(0, 1);
    }

    // Next, find the follower.
    let player = game.entityFinder.getLivingPlayer(args[0]?.replace(/'s/g, ""));
    if (player)
        args.splice(0, 1);
    if (!player && sentMessageInLatchChannel)
        player = moderator.getLatch();
    if (player === undefined) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotFoundError([args[0]]));
    if (followedPlayer === undefined) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotFoundError([args[0]]));
    if (args.length > 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotFoundError(args));

    if (player.speed <= 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotMoveWithNoSpeedError(player, "Moderator"));

    if (player.name === followedPlayer.name) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotSelectSelfError(player, "Moderator", "follow"));
    if (player.location.id !== followedPlayer.location.id) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotInSameRoomError([player, followedPlayer]));
    if (player.isFollowing(followedPlayer)) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateAlreadyFollowingPlayerError(player, "Moderator"));
    // Prevent following loops.
    let nextFollowedPlayer = followedPlayer;
    while (nextFollowedPlayer) {
        if (nextFollowedPlayer.isFollowing(player))
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateFollowingWouldCauseInfiniteLoopError(player, "Moderator", followedPlayer));
        nextFollowedPlayer = nextFollowedPlayer.followedPlayer;
    }

    const action = new FollowAction(game, message, player, player.location, true);
    await action.performFollow(followedPlayer);
    action.sendSuccessMessageToCommandChannel();
}
