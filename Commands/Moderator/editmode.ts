// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InvalidInvocation, ValidatedInvocation, type MatchedInvocation } from "../../Classes/Command/Invocation.ts";
import { Pattern, Option } from "../../Classes/Command/Pattern.ts";
import type GameSettings from "../../Classes/GameSettings.ts";
import ModeratorCommand from "../../Classes/Command/ModeratorCommand.ts";
import type ModeratorContext from "../../Classes/Command/ModeratorContext.ts";

const command = new ModeratorCommand({
    config: {
        name: "editmode_moderator",
        description: "Toggles edit mode for editing the spreadsheet.",
        details: "Toggles edit mode on or off, allowing you to make edits to the spreadsheet. When edit mode is turned on, "
            + "Alter Ego will no longer save the game to the spreadsheet automatically. Additionally, all player activity, "
            + "aside from speaking in room channels or in whispers, will be disabled. Players who don't have the "
            + "`unconscious` behavior attribute will be notified when edit mode is enabled, so use it sparingly. Data will "
            + "be saved to the spreadsheet before edit mode is enabled, so you must wait until the confirmation message "
            + "has been sent before making any edits, or your edits will be overwritten. When you are finished making "
            + "edits, be sure to load the updated spreadsheet data before disabling edit mode.",
        usableBy: "Moderator",
        aliases: ["editmode", "em"],
        requiresGame: true
    },

    usage: (settings: GameSettings) => {
        return `${settings.commandPrefix}editmode\n`
            + `${settings.commandPrefix}em\n`
            + `${settings.commandPrefix}editmode on\n`
            + `${settings.commandPrefix}em on\n`
            + `${settings.commandPrefix}editmode off\n`
            + `${settings.commandPrefix}em off`;
    },

    patterns: [
        new Pattern([
            new Option("toggle", ["on", "off"])
        ]),
        new Pattern([]),
    ],

    validate: async (ctx: ModeratorContext, inv: MatchedInvocation) => {
        if (inv.getOpt("toggle", "on") && ctx.game.editMode === true)
            return new InvalidInvocation(["Edit mode is already enabled."])
        else if (inv.getOpt("toggle", "off") && ctx.game.editMode === false)
            return new InvalidInvocation(["Edit mode is already disabled."])
        else return new ValidatedInvocation({ opts: inv.opts });
    },

    execute: async (ctx: ModeratorContext, inv: ValidatedInvocation) => {
        if (inv.getOpt("toggle", "on") || ctx.game.editMode === false) {
            try {
                await ctx.game.entitySaver.saveGame();
                ctx.game.editMode = true;
                ctx.game.livingPlayers.forEach(player => {
                    player.stopMoving();
                    if (player.isConscious())
                        ctx.game.communicationHandler.sendMessageToPlayer(player, "A moderator has enabled edit mode. While the spreadsheet is being edited, you cannot do anything but speak. This should only take a few minutes.", false);
                });
                ctx.game.communicationHandler.sendToCommandChannel("Edit mode has been enabled.");
            }
            catch (err) {
                console.log(err);
                return ctx.game.communicationHandler.sendToCommandChannel("There was an error saving data to the spreadsheet. Error:\n```" + err + "```");
            }
        } else if (inv.getOpt("toggle", "off") || ctx.game.editMode === true) {
            if (ctx.game.loadedEntitiesWithErrors.size !== 0)
                return ctx.game.communicationHandler.reply(ctx.message, `Edit mode can't be disabled while there are errors on the sheet. Fix the errors found by the load command and then try again.`);
            ctx.game.editMode = false;
            ctx.game.livingPlayers.forEach(player => {
                if (player.isConscious())
                    ctx.game.communicationHandler.sendMessageToPlayer(player, "Edit mode has been disabled. You are free to resume normal gameplay.", false);
            });
            ctx.game.communicationHandler.sendToCommandChannel("Edit mode has been disabled.");
        }
    },
});

export default command;
