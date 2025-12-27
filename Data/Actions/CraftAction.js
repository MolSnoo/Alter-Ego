import Action from "../Action.js";

/** @typedef {import("../InventoryItem.js").default} InventoryItem */
/** @typedef {import("../Recipe.js").default} Recipe */

/**
 * @class CraftAction
 * @classdesc Represents a craft action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/craft-action.html
 */
export default class CraftAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Craft;

	/**
     * Crafts two ingredients into one or two products according to a recipe.
     * @param {InventoryItem} item1 - The first ingredient.
     * @param {InventoryItem} item2 - The second ingredient.
     * @param {Recipe} recipe - The recipe that describes how these ingredients are crafted.
     */
	performCraft(item1, item2, recipe) {
		if (this.performed) return;
		super.perform();
		const item1Id = item1.getIdentifier();
    	const item2Id = item2.getIdentifier();
		const craftingResult = this.player.craft(item1, item2, recipe);
		this.player.sendDescription(recipe.completedDescription, recipe);
		this.getGame().narrationHandler.narrateCraft(craftingResult, this.player);
		this.getGame().logHandler.logCraft(item1Id, item2Id, craftingResult, this.player, this.forced);
	}
}