import { default as Action, ActionType } from "../Action.js";
import InventoryItem from "../InventoryItem.js";
import Player from "../Player.js";

/**
 * @class UseAction
 * @classdesc Represents a use action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/use-action.html
 */
export default class UseAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Use;

	/**
	 * Performs a use action.
	 * @param {InventoryItem} item - The inventory item to use.
	 * @param {Player} [target] - The target the player should use the inventory item on. Defaults to themself.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	performUse(item, target = this.player, customNarration) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateUse(item, this.player, target, customNarration);
		this.getGame().logHandler.logUse(item, this.player, target, this.forced);
		this.player.use(item, target);
	}
}