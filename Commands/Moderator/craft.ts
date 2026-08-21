// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "discord.js";
import { InvalidInvocation, ValidatedInvocation, type MatchedInvocation } from "../../Classes/Command/Invocation.ts";
import { Pattern, Slot, Multiconstant, type ErrorFactory } from "../../Classes/Command/Pattern.ts";
import type GameSettings from "../../Classes/GameSettings.js";
import InventoryItem from "../../Data/InventoryItem.ts";
import type Recipe from "../../Data/Recipe.ts";
import CraftAction from "../../Data/Actions/CraftAction.ts";
import ModeratorCommand from "../../Classes/Command/ModeratorCommand.ts";
import type ModeratorContext from "../../Classes/Command/ModeratorContext.ts";
import Player from "../../Data/Player.ts";
import type Game from "../../Data/Game.ts";

const errorUnlatched: ErrorFactory = (game: Game) => {
    return game.errorMessageGenerator.generateSpecifyErrorWithUsage("a player and two items separated by \"with\" or \"and\".", command.usage);
}

const errorLatched: ErrorFactory = (game: Game) => {
    return game.errorMessageGenerator.generateSpecifyErrorWithUsage("two items separated by \"with\" or \"and\".", command.usage);
}

const command = new ModeratorCommand({
    config: {
        name: "craft_moderator",
        description:"Crafts two items in a player's inventory together.",
        details:`Creates a new item using the two items in the given player\'s hands. The prefab IDs or container identifiers of the `
        + `items must be separated by "with" or "and". If no recipe for those two items exists, the items cannot be crafted together. `
        + `If any of the resulting items is non-discreet, this will be narrated in the room, so other players will see the player craft them.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
        usableBy: "Moderator",
        aliases: ["craft", "combine", "mix", "c"],
        requiresGame: true,
        possessivePlayer: true,
    },

    usage: (settings: GameSettings) => {
        return `${settings.commandPrefix}craft Kris DRAIN CLEANER and PLASTIC BOTTLE\n`
            + `${settings.commandPrefix}combine Colette's SLICE OF BREAD and SLICE OF CHEESE\n`
            + `${settings.commandPrefix}mix Flint RED VIAL with BLUE VIAL\n`
            + `${settings.commandPrefix}c Sid's BAR OF SOAP with CARVING KNIFE`;
    },

    patterns: [
        new Pattern([
            new Slot(InventoryItem, "item 1", errorLatched),
            new Multiconstant(["and", "with"], errorLatched),
            new Slot(InventoryItem, "item 2", errorLatched),
        ], { latch: true }),
        new Pattern([
            new Slot(Player, "player", errorUnlatched),
            new Slot(InventoryItem, "item 1", errorUnlatched),
            new Multiconstant(["and", "with"], errorUnlatched),
            new Slot(InventoryItem, "item 2", errorUnlatched),
        ]),
    ],

    validate: async (ctx: ModeratorContext, inv: MatchedInvocation) => {
        const latch = ctx.moderator.getLatch();
        if (latch && !inv.args.has("player"))
            inv.args.set("player", [latch]);

        const candidates = inv.getPlayers("player");

        for (const candidate of candidates) {
            const heldItems = new Set(ctx.game.entityFinder.getPlayerHands(candidate).map(hand => hand.equippedItem).filter(item => item !== undefined));

            const item1 = inv.getInventoryItems("item 1").find(item => heldItems.has(item));
            const item2 = inv.getInventoryItems("item 2").find(item => heldItems.has(item));

            if (item1 === undefined && item2 === undefined)
                return new InvalidInvocation([`Couldn't find items "${inv.getInventoryItems("item 1")[0].name}" and "${inv.getInventoryItems("item 2")[0].name}" in either of ${candidate.name}'s hands.`]);
            else if (item1 === undefined)
                return new InvalidInvocation([`Couldn't find item "${inv.getInventoryItems("item 1")[0].name}" in either of ${candidate.name}'s hands.`]);
            else if (item2 === undefined)
                return new InvalidInvocation([`Couldn't find item "${inv.getInventoryItems("item 2")[0].name} in either of your ${candidate.name}'s hands.`]);

            const items = [item1, item2];
            items.sort((a, b) => a.prefab.id.localeCompare(b.prefab.id));

            const recipes = ctx.game.entityFinder.getRecipes("crafting");
            let recipe: Recipe | null = null;
            for (let i = 0; i < recipes.length; i++) {
                if (candidate.canCraft(recipes[i], [items[0], items[1]])) {
                    recipe = recipes[i];
                    break;
                }
            }
            if (recipe === null)
                return new InvalidInvocation([
                    `Couldn't find recipe requiring ${items[0].name} and ${items[1].name}.`,
                ]);

            const args: Collection<string, ArrayNonEmpty<InstantiatedGameEntity>> = new Collection();

            args.set("item 1", [items[0]]);
            args.set("item 2", [items[1]]);
            args.set("recipe", [recipe]);
            args.set("player", [candidate]);
    
            return new ValidatedInvocation({ args: args });
        }
    },

    execute: async (ctx: ModeratorContext, inv: ValidatedInvocation) => {
        const player = inv.getPlayer("player");
        const action = new CraftAction(ctx.game, ctx.message, player, player.location, true);
        action.performCraft(inv.getInventoryItem("item 1"), inv.getInventoryItem("item 2"), inv.getRecipe("recipe"));
    },
});

export default command;
