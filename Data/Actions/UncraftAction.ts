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
 * Represents an uncraft action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#uncraft-action
 */
export default class UncraftAction extends Action {
    /**
     * Crafts two ingredients into one or two products according to a recipe.
     *
     * @param item - The product to uncraft.
     * @param recipe - The recipe that describes how this product is crafted.
     */
    performUncraft(item: InventoryItem, recipe: Recipe): void {
        if (this.performed) return;
        super.perform();
        const originalItemDiscreet = item.prefab.discreet;
        const originalItemSingleContainingPhrase = item.singleContainingPhrase;
        const itemId = item.getIdentifier();
        const uncraftingResult = this.player.uncraft(item, recipe);
        const uncraftedDescription = recipe.uncraftedDescription.parseFor(this.player, this.player);
        const interactables = this.#getInteractables([uncraftingResult.ingredient1, uncraftingResult.ingredient2].filter(ingredient => ingredient !== null));
        this.player.sendDescription(uncraftedDescription, this.player, recipe.uncraftedDescription.messageDisplayType ?? MessageDisplayType.STANDARD, interactables);
        this.getGame().narrationHandler.narrateUncraft(this, recipe, originalItemDiscreet, originalItemSingleContainingPhrase, item, uncraftingResult, this.player);
        this.getGame().logHandler.logUncraft(itemId, uncraftingResult, this.player, this.forced);
        this.player.clearProcess();
        this.successMessage = `Successfully uncrafted ${itemId} for ${this.player.name}.`;
    }

    #getInteractables(createdItems: InventoryItem[]): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        interactables = interactables.concat(interactableManager.createInspectActionInteractable(createdItems, this.player, this.user))
        interactables = interactables.concat(interactableManager.getCraftInteractables(this.player, this.user));
        interactables = interactables.concat(interactableManager.getUseInteractables(this.player, this.user));
        interactables = interactables.concat(interactableManager.getInventoryInteractables(this.player, this.user));
        return interactables;
    }

    /**
     * Finds the required inventory item and recipe to call performUncraft.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [InventoryItem, Recipe] {
        const hand = this.getGame().entityFinder.getPlayerHandHoldingItem(this.player, args[0], args[4]);
        const recipes = this.getGame().entityFinder.getRecipes(args[1], "", args[2], args[3]);
        return [hand?.equippedItem, recipes[0] ?? undefined];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performUncraft.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [InventoryItem, Recipe]): [InventoryItem, Recipe] | [] {
        if (args.length !== 2) return [];
        if (!args[0] || !(args[0] instanceof InventoryItem)) return [];
        const item = args[0];
        if (!args[1] || !(args[1] instanceof Recipe)) return [];
        if (!args[1].uncraftable || args[1].products.length !== 1 || args[1].products[0].prefab.id !== args[0].prefab.id) return [];
        const recipe = args[1];
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("uncraft");
        if (disabledStatusEffects.length > 0) return [];
        const freeHand = this.getGame().entityFinder.getPlayerFreeHand(this.player);
        if (!freeHand || freeHand.id === item.equipmentSlot) return [];
        return [item, recipe];
    }
}
