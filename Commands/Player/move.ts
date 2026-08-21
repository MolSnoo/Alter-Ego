// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InvalidInvocation, ValidatedInvocation, type MatchedInvocation, type ValidationResult } from "../../Classes/Command/Invocation.ts";
import { Pattern, Glob } from "../../Classes/Command/Pattern.ts";
import PlayerCommand from "../../Classes/Command/PlayerCommand.ts";
import type PlayerContext from "../../Classes/Command/PlayerContext.ts";
import type GameSettings from "../../Classes/GameSettings.js";
import QueueMoveAction from "../../Data/Actions/QueueMoveAction.ts";

const command = new PlayerCommand({
    config: {
        name: "move_player",
        description: "Moves you to another room.",
        details: `Moves you to another room. You must specify an exit in the room you're currently in, or the name of the desired room, if you know it. `
            + `Unless you have the free movement role, you can only move to a room directly connected to the one you're currently in. `
            + `It will take time for you to move to your destination. How much time it takes depends on its distance from your current position, and your speed. `
            + `While you are moving, you will use stamina. If you are close to running out of stamina, you will receive a warning. If you run out of stamina entirely, `
            + `you will become **weary**, and you will be unable to move for some time. You can recover lost stamina by staying in one place for a while.\n\n`
            + `Once you reach the destination, you will be removed from your current room channel and put into the channel corresponding to the room you specify, `
            + `as long as the exit leading to it isn't locked.\n\n`
            + `When you enter a new room, its description will be sent to you via DMs. `
            + `However, it is recommended that you open the new channel immediately so that you can start seeing messages as soon as you're added.\n\n`
            + `You can also create a queue of movements to perform such that upon entering one room, you will immediately `
            + `start moving to the next one. To do this, separate each destination with \`>\`.\n\n`
            + `Note that if you are carrying any large items in your hands (for example, a sword), they will be mentioned when you exit or enter a room.`,
        usableBy: "Player",
        aliases: ["move", "go", "exit", "enter", "walk", "m"],
        requiresGame: true
    },

    usage: (settings: GameSettings) => {
        return `${settings.commandPrefix}move DOOR 1\n`
            + `${settings.commandPrefix}enter Kitchen\n`
            + `${settings.commandPrefix}go locker-room\n`
            + `${settings.commandPrefix}exit DOOR\n`
            + `${settings.commandPrefix}move DOOR 1>DOOR 1>DOOR 1\n`
            + `${settings.commandPrefix}walk HALL 1 > HALL 2 > HALL 3 > HALL 4\n`
            + `${settings.commandPrefix}m Lobby>Path 3>Path 1>Park>Path 7>Botanical garden`;
    },

    patterns: [new Pattern([new Glob()])],

    validate: async (ctx: PlayerContext, inv: MatchedInvocation): Promise<ValidationResult<ValidatedInvocation>> => {
        if (inv.glob.length === 0)
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateSpecifyErrorWithUsage("a room or exit", command.usage)]);

        const status = ctx.player.getBehaviorAttributeStatusEffects("disable move");
        if (status.length > 0)
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateCommandDisabledError(status[0])]);
        if (ctx.player.speed <= 0)
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateCannotMoveWithNoSpeedError(ctx.player, "Player")]);
        if (ctx.player.party && !ctx.player.party.canMove(false))
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generatePartyCannotMoveError(ctx.player, false, "Player")]);

        if (ctx.player.isMoving)
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateAlreadyMovingError()]);
        if (ctx.player.followedPlayer)
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateCannotMoveAlreadyFollowingPlayerError(ctx.player)]);

        return new ValidatedInvocation({ glob: inv.glob });
    },

    execute: async (ctx: PlayerContext, inv: ValidatedInvocation) => {
        ctx.player.moveQueue = inv.glob.join(" ").split(">");
        const action = new QueueMoveAction(ctx.game, ctx.message, ctx.player, ctx.player.location, false);
        await action.performQueueMove(false, ctx.player.moveQueue[0]);
    }
});

export default command;
