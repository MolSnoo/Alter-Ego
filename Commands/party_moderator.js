// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as disbandModeratorCommand from './disband_moderator.js';
import * as dismissModeratorCommand from './dismiss_moderator.js';
import * as leadModeratorCommand from './lead_moderator.js';
import ViewPartyAction from '../Data/Actions/ViewPartyAction.ts';
import FormPartyAction from '../Data/Actions/FormPartyAction.ts';

/** @import Moderator from '../Data/Moderator.ts'; */
/** @import GameSettings from '../Classes/GameSettings.ts'; */
/** @import Game from '../Data/Game.ts'; */
/** @import Player from '../Data/Player.ts'; */

/** @type {CommandConfig} */
export const config = {
    name: "party_moderator",
    description: "Forms or displays a player's party.",
    // TODO: Write help details.
    details: ``,
    usableBy: "Moderator",
    aliases: ["party", "form"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    // TODO: Write examples.
    return `${settings.commandPrefix}party`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    if (command === "party") {
        if (args[0] === "disband" || args[0] === "dissolve") command = "disband";
        else if (args[0] === "dismiss" || args[0] === "kick" || args[0] === "remove") command = "dismiss";
        else if (args[0] === "lead" || args[0] === "invite" || args[0] === "add") command = "lead";
        else if (args[0] === "form" || args[0] === "create") command = "form";
        else command = "view";
        if (args[0] === "disband" || args[0] === "dissolve" || args[0] === "dismiss" || args[0] === "kick" ||
        args[0] === "remove" || args[0] === "lead" || args[0] === "invite" || args[0] === "add" ||
        args[0] === "form" || args[0] === "create" || args[0] === "view")
            args.splice(0, 1);
    }
    // If the user wants to do something other than form or view a party, route their command appropriately.
    if (command === "disband") return await disbandModeratorCommand.execute(game, message, command, args, moderator);
    if (command === "dismiss") return await dismissModeratorCommand.execute(game, message, command, args, moderator);
    if (command === "lead") return await leadModeratorCommand.execute(game, message, command, args, moderator);

    const sentMessageInLatchChannel = moderator?.sentMessageInLatchChannel(message) ?? false;
    if (command === "form" && args.length < 2)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("a leader and at least one follower", usage));
    if (command === "view" && !sentMessageInLatchChannel && args.length < 1)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage("a player", usage));

    // First, find all players.
    /** @type {Player[]} */
    let players = [];
    /** @type {string[]} */
    let invalidPlayers = [];
    for (let i = 0; i < args.length; i++) {
        const foundPlayer = game.entityFinder.getLivingPlayer(args[i].replace(/'s/g, ""));
        if (foundPlayer) players.push(foundPlayer);
        else invalidPlayers.push(args[i]);
    }
    if (invalidPlayers.length !== 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotFoundError(invalidPlayers));

    /** @type {Player} */
    let player;
    if (command === "view" && sentMessageInLatchChannel)
        player = moderator.getLatch();
    if (!player || players.length !== 0 && !moderator.latchedPlayerHasName(players[0].name)) {
        player = players[0];
        players.splice(0, 1);
    }

    if (command === "view") {
        if (player && players.length !== 0)
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotDisplayMoreThanOnePlayerPropertyError("party"));
        const action = new ViewPartyAction(game, message, player, player.location, true);
        action.performViewParty();
    }
    if (command === "form") {
        const leader = player;
        /**
         * The new players who will led by the player performing the command.
         * @type {Set<Player>}
         */
        const newLedPlayers = new Set();
        /**
         * The players who are already being led.
         * @type {Set<Player>}
         */
        const alreadyLedPlayers = new Set();
        for (const follower of players) {
            // Leader cannot lead themself.
            if (follower.name === leader.name) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotSelectSelfError(leader, "Moderator", "lead"));
            if (leader.location.id !== follower.location.id) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotInSameRoomError([leader, follower]));
            if (follower.ledPlayers.length !== 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotLeadLeaderError(leader, follower, "Moderator"));

            if (leader.ledPlayers.includes(follower)) alreadyLedPlayers.add(follower);
            else newLedPlayers.add(follower);
        }
        if (newLedPlayers.size === 0 && alreadyLedPlayers.size !== 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateNoNewLedPlayersError(leader, "Moderator"));
        else if (newLedPlayers.size === 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePlayersNotFoundError(args));

        const action = new FormPartyAction(game, message, leader, leader.location, true);
        await action.performFormParty(newLedPlayers);
        action.sendSuccessMessageToCommandChannel();
    }
}
