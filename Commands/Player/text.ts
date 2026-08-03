// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "discord.js";
import { InvalidInvocation, ValidatedInvocation, type MatchedInvocation } from "../../Classes/Command/Invocation.ts";
import { Pattern, Glob, Slot } from "../../Classes/Command/Pattern.ts";
import PlayerCommand from "../../Classes/Command/PlayerCommand.ts";
import type PlayerContext from "../../Classes/Command/PlayerContext.ts";
import type GameSettings from "../../Classes/GameSettings.js";
import TextAction from "../../Data/Actions/TextAction.ts";
import type GameEntity from "../../Data/GameEntity.ts";
import Player from "../../Data/Player.ts";

const command = new PlayerCommand({
    config: {
        name: "text_player",
        description: "Sends a text message to another player.",
        details:
            `Sends a text message to the player you specify. If an image is attached, it will be sent as well. This command works best ` +
            `when sent via direct message, rather than in a room channel. This command is only available to players with certain status effects. ` +
            `Additionally, even if you have a status effect that enables the use of the command, if the recipient you choose does not, you will ` +
            `not be able to send text messages to them.`,
        usableBy: "Player",
        aliases: ["text"],
        requiresGame: true,
        playerNameStyle: 1,
        whitespaceSensitive: true
    },

    usage: (settings: GameSettings) => {
        return (
            `${settings.commandPrefix}text Elijah Hello. I understand that you have come into possession of some illicit substances, and I would like to partake.\n` +
            `${settings.commandPrefix}text Astrid i often paint cityscapes, urban scenes, and portraits of people - but today i decided to experiment with something a bit more abstract. (attached image)\n` +
            `${settings.commandPrefix}text Vivian (attached image)`
        );
    },

    patterns: [new Pattern([new Slot(Player, "recipient"), new Glob()])],

    validate: async (ctx: PlayerContext, inv: MatchedInvocation) => {
        const status = ctx.player.getBehaviorAttributeStatusEffects("disable text");
        if (status.length > 0)
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateCommandDisabledError(status[0])]);
        if (!ctx.player.hasBehaviorAttribute("send text"))
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateCannotSendTextError()]);

        // If it ever becomes possible to specify more than one recipient, we will want to change this...
        const recipient = inv.getPlayers("recipient")[0];
        if (recipient.name === ctx.player.name)
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateCannotTextSelfError()]);
        if (!recipient.hasBehaviorAttribute("receive text"))
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateCannotReceiveTextError(recipient)]);

        if (inv.glob.length === 0 && ctx.message.attachments.size === 0)
            return new InvalidInvocation([ctx.game.errorMessageGenerator.generateCannotEmptyTextError()]);

        const args: Collection<string, ArrayNonEmpty<GameEntity>> = new Collection();
        args.set("recipient", [recipient]);
        return new ValidatedInvocation({ glob: inv.glob, args: args });
    },

    execute: async (ctx: PlayerContext, inv: ValidatedInvocation) => {
        const action = new TextAction(ctx.game, ctx.message, ctx.player, ctx.room, false);
        action.performText(inv.getPlayer("recipient"), inv.glob.join(" "));
    },
});

export default command;
