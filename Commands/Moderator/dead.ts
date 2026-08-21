// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ValidatedInvocation } from "../../Classes/Command/Invocation.ts";
import { Pattern, Glob } from "../../Classes/Command/Pattern.ts";
import type GameSettings from "../../Classes/GameSettings.ts";
import ModeratorCommand from "../../Classes/Command/ModeratorCommand.ts";
import type ModeratorContext from "../../Classes/Command/ModeratorContext.ts";

const command = new ModeratorCommand({
    config: {
        name: "dead_moderator",
        description: "Lists all dead players.",
        details: "Lists all dead players.",
        usableBy: "Moderator",
        aliases: ["dead", "died"],
        requiresGame: true
    },

    usage: (settings: GameSettings) => {
        return `${settings.commandPrefix}dead\n`
            + `${settings.commandPrefix}died`;
    },

    patterns: [
        new Pattern([new Glob()]),
    ],

    validate: async (): Promise<ValidatedInvocation> => new ValidatedInvocation(),

    execute: async (ctx: ModeratorContext) => {
        let playerList = `Dead players:\n${ctx.game.entityFinder.getDeadPlayers().map(player => player.name).join(" ")}`;
        ctx.game.communicationHandler.sendToCommandChannel(playerList);
    },
});

export default command;
