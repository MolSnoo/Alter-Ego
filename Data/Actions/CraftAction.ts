// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Interactable from "../../Classes/Interactables/Interactable.ts";
import { MessageDisplayType } from "../../Modules/enums.ts";
import Action from "../Action.ts";
import InventoryItem from "../InventoryItem.ts";
import Recipe from "../Recipe.ts";

/**
 * Represents a craft action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#craft-action
 */
export default class CraftAction extends Action {
    /**
     * Crafts two ingredients into one or two products according to a recipe.
     *
     * @param item1 - The first ingredient.
     * @param item2 - The second ingredient.
     * @param recipe - The recipe that describes how these ingredients are crafted.
     */
    performCraft(item1: InventoryItem, item2: InventoryItem, recipe: Recipe): void {
        if (this.performed) return;
        super.perform();
        const item1Id = item1.getIdentifier();
        const item2Id = item2.getIdentifier();
        const craftingResult = this.player.craft(recipe);
        const completedDescription = recipe.completedDescription.parseFor(this.player, this.player);
        const createdItems = [craftingResult.product1, craftingResult.product2].filter(item => item !== null);
        const interactables = this.#getInteractables(createdItems);
        this.player.sendDescription(completedDescription, this.player, recipe.completedDescription.messageDisplayType ?? MessageDisplayType.STANDARD, interactables);
        this.getGame().narrationHandler.narrateCraft(this, craftingResult, this.player);
        this.getGame().logHandler.logCraft(item1Id, item2Id, craftingResult, this.player, this.forced);
        this.player.clearProcess();
        this.successMessage = `Successfully crafted ${item1Id} and ${item2Id} for ${this.player.name}.`;
    }

    #getInteractables(createdItems: InventoryItem[]): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        interactables = interactables.concat(interactableManager.createInspectActionInteractable(createdItems, this.player, this.user))
        interactables = interactables.concat(interactableManager.getCraftInteractables(this.player, this.user));
        interactables = interactables.concat(interactableManager.getUncraftInteractables(this.player, this.user));
        interactables = interactables.concat(interactableManager.getUseInteractables(this.player, this.user));
        interactables = interactables.concat(interactableManager.getInventoryInteractables(this.player, this.user));
        return interactables;
    }

    /**
     * Finds the required inventory items and recipe to call performCraft.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [InventoryItem, InventoryItem, Recipe] {
        const hand1 = this.getGame().entityFinder.getPlayerHandHoldingItem(this.player, args[0], args[5]);
        const hand2 = this.getGame().entityFinder.getPlayerHandHoldingItem(this.player, args[1], args[6], hand1?.row);
        const recipes = this.getGame().entityFinder.getRecipes(args[2], "", args[3], args[4]);
        return [hand1?.equippedItem, hand2?.equippedItem, recipes[0] ?? undefined];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performCraft.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [InventoryItem, InventoryItem, Recipe]): [InventoryItem, InventoryItem, Recipe] | [] {
        if (args.length !== 3) return [];
        if (!args[0] || !(args[0] instanceof InventoryItem)) return [];
        if (!args[1] || !(args[1] instanceof InventoryItem)) return [];
        if (!args[2] || !(args[2] instanceof Recipe)) return [];
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("craft");
        if (disabledStatusEffects.length > 0) return [];
        const item1 = args[0];
        const item2 = args[1];
        const recipe = args[2];
        if (!this.player.canCraft(recipe, [item1, item2])) return [];
        return [item1, item2, recipe];
    }
}
