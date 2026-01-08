import Action from "../Action.js";

/** @typedef {import("../InventoryItem.js").default} InventoryItem */
/** @typedef {import("../Recipe.js").default} Recipe */

/**
 * @class UncraftAction
 * @classdesc Represents an uncraft action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/uncraft-action.html
 */
export default class UncraftAction extends Action {
	/**
	 * Crafts two ingredients into one or two products according to a recipe.
	 * @param {InventoryItem} item - The product to uncraft.
     * @param {Recipe} recipe - The recipe that describes how this product is crafted.
	 */
	performUncraft(item, recipe) {
		if (this.performed) return;
		super.perform();
		const originalItemPrefab = item.prefab;
		const itemId = item.getIdentifier();
		const uncraftingResult = this.player.uncraft(item, recipe);
		this.player.sendDescription(recipe.uncraftedDescription, recipe);
		this.getGame().narrationHandler.narrateUncraft(this, recipe, originalItemPrefab, item, uncraftingResult, this.player);
		this.getGame().logHandler.logUncraft(itemId, uncraftingResult, this.player, this.forced);
	}
}