// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "discord.js";
import { InvalidInvocation, ValidatedInvocation, type MatchedInvocation } from "../../Classes/Command/Invocation.ts";
import { Pattern, Slot, Multiconstant } from "../../Classes/Command/Pattern.ts";
import PlayerCommand from "../../Classes/Command/PlayerCommand.ts";
import type PlayerContext from "../../Classes/Command/PlayerContext.ts";
import type GameSettings from "../../Classes/GameSettings.js";
import InventoryItem from "../../Data/InventoryItem.ts";
import type GameEntity from "../../Data/GameEntity.ts";
import type Recipe from "../../Data/Recipe.ts";
import CraftAction from "../../Data/Actions/CraftAction.ts";

const command = new PlayerCommand({
    config: {
        name: "craft_player",
        description: "Crafts two items in your inventory together.",
        details:
            `Creates a new item using the two items in your hands. The names of the items must be separated by "with" or "and". ` +
            `If no recipe for those two items exists, the items cannot be crafted together. ` +
            `If any of the resulting items is particularly large, this will be narrated in the room, so other players will see you craft them.\n\n` +
            `You can view a list of all recipes that you can craft with the items in your inventory using the \`recipes\` command. Some crafting recipes ` +
            `can be reversed once performed using the \`uncraft\` command. For more information on both of these commands, use the \`help\` command.`,
        usableBy: "Player",
        aliases: ["craft", "combine", "mix", "c"],
        requiresGame: true,
    },

    usage: (settings: GameSettings) => {
        return (
            `${settings.commandPrefix}craft DRAIN CLEANER and PLASTIC BOTTLE\n` +
            `${settings.commandPrefix}combine BREAD and CHEESE\n` +
            `${settings.commandPrefix}mix RED VIAL with BLUE VIAL\n` +
            `${settings.commandPrefix}craft SOAP with KNIFE`
        );
    },

    patterns: [
        new Pattern([
            new Slot(InventoryItem, "item 1"),
            new Multiconstant(["and", "with"]),
            new Slot(InventoryItem, "item 2"),
        ]),
    ],

    validate: async (ctx: PlayerContext, inv: MatchedInvocation) => {
        const status = ctx.player.getBehaviorAttributeStatusEffects("disable craft");
        if (status.length > 0)
            return new InvalidInvocation([`You cannot do that because you are **${status[0].id}**.`]);

        const item1 = inv.getInventoryItems("item 1").find(item => ctx.heldItems.has(item));
        const item2 = inv.getInventoryItems("item 2").find(item => ctx.heldItems.has(item));

        if (item1 === undefined && item2 === undefined)
            return new InvalidInvocation([`Couldn't find items "${inv.getInventoryItems("item 1")[0].name}" and "${inv.getInventoryItems("item 2")[0].name}" in either of your hands.`]);
        else if (item1 === undefined)
            return new InvalidInvocation([`Couldn't find item "${inv.getInventoryItems("item 1")[0].name}" in either of your hands.`]);
        else if (item2 === undefined)
            return new InvalidInvocation([`Couldn't find item "${inv.getInventoryItems("item 2")[0].name}" in either of your hands.`]);

        const items = [item1, item2];
        items.sort((a, b) => a.prefab.id.localeCompare(b.prefab.id));

        const recipes = ctx.game.entityFinder.getRecipes("crafting");
        let recipe: Recipe | null = null;
        for (let i = 0; i < recipes.length; i++) {
            if (ctx.player.canCraft(recipes[i], [items[0], items[1]])) {
                recipe = recipes[i];
                break;
            }
        }
        if (recipe === null)
            return new InvalidInvocation([`Couldn't find recipe requiring ${items[0].name} and ${items[1].name}. Contact a moderator if you think there should be one.`]);

        const args: Collection<string, ArrayNonEmpty<InstantiatedGameEntity>> = new Collection();
        args.set("item 1", [items[0]]);
        args.set("item 2", [items[1]]);
        args.set("recipe", [recipe]);

        return new ValidatedInvocation({ args: args });
    },

    execute: async (ctx: PlayerContext, inv: ValidatedInvocation) => {
        const action = new CraftAction(ctx.game, ctx.message, ctx.player, ctx.player.location, false);
        action.performCraft(inv.getInventoryItem("item 1"), inv.getInventoryItem("item 2"), inv.getRecipe("recipe"));
    }
});

export default command;
