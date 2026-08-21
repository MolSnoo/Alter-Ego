// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InvalidInvocation, ValidatedInvocation, type MatchedInvocation, type ValidationResult } from "../../Classes/Command/Invocation.ts";
import { Pattern, Glob } from "../../Classes/Command/Pattern.ts";
import type GameSettings from "../../Classes/GameSettings.ts";
import ModeratorCommand from "../../Classes/Command/ModeratorCommand.ts";
import type ModeratorContext from "../../Classes/Command/ModeratorContext.ts";
import Player from "../../Data/Player.ts";
import { Collection, type GuildMember } from "discord.js";
import Room from "../../Data/Room.ts";
import { loadPlayerDefaults } from "../../Modules/settingsLoader.ts";
import Game from "../../Data/Game.ts";
import { appendRowsToSheet } from "../../Modules/sheets.js";

const command = new ModeratorCommand({
    config: {
        name: "clean_moderator",
        description: "Cleans the room items and inventory items sheets.",
        details: "Combs through all room items and inventory items and deletes any whose quantity is 0. All game data will then "
            + "be saved to the spreadsheet, not just room items and inventory items. This process will effectively clean the "
            + "spreadsheet of room items and inventory items that no longer exist, reducing the size of both sheets. Note that "
            + "edit mode must be turned on in order to use this command. The room items and inventory items sheets must be "
            + "loaded after this command finishes executing, otherwise data may be overwritten on the sheet during gameplay.",
        usableBy: "Moderator",
        aliases: ["clean", "autoclean"],
        requiresGame: true
    },

    usage: (settings: GameSettings) => {
        return `${settings.commandPrefix}clean\n`
            + `${settings.commandPrefix}autoclean`;
    },

    patterns: [
        new Pattern([new Glob()]),
    ],

    validate: async (ctx: ModeratorContext, inv: MatchedInvocation): Promise<ValidationResult<ValidatedInvocation>> => {
        if (!ctx.game.editMode)
            return new InvalidInvocation([`You cannot clean the room items and inventory items sheet while edit mode is disabled. Please turn edit mode on before using this command.`]);

        return new ValidatedInvocation();
    },

    execute: async (ctx: ModeratorContext) => {
        let deletedItemsCount = 0;
        let deletedInventoryItemsCount = 0;
        // Iterate through the lists backwards because the act of splicing ruins the order of iteration going forwards.
        for (let i = ctx.game.roomItems.length - 1; i >= 0; i--) {
            if (ctx.game.roomItems[i].quantity === 0) {
                ctx.game.roomItems.splice(i, 1);
                deletedItemsCount++;
            }
        }
        for (let i = ctx.game.inventoryItems.length - 1; i >= 0; i--) {
            if (ctx.game.inventoryItems[i].quantity === 0) {
                ctx.game.inventoryItems.splice(i, 1);
                deletedInventoryItemsCount++;
            }
        }
    
        try {
            // Pass deletedItemsCount and deletedInventoryItemsCount so the saver knows how many blank rows to append at the end.
            await ctx.game.entitySaver.saveGame(deletedItemsCount, deletedInventoryItemsCount);
            ctx.game.communicationHandler.sendToCommandChannel("Successfully cleaned room items and inventory items. Successfully saved game data to the spreadsheet. Be sure to load room items and inventory items before disabling edit mode.");
            ctx.game.loadedEntitiesWithErrors.add("RoomItems");
            ctx.game.loadedEntitiesWithErrors.add("InventoryItems");
        }
        catch (err) {
            console.log(err);
            ctx.game.communicationHandler.sendToCommandChannel("Successfully cleaned room items and inventory items, but there was an error saving data to the spreadsheet. Proceeding without manually saving and loading may cause additional errors. Error:\n```" + err + "```");
        }
    },
});

export default command;
