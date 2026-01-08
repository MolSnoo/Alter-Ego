import { default as Action, ActionType } from "../Action.js";
import InventorySlot from "../InventorySlot.js";

/** @typedef {import("../EquipmentSlot.js").default} EquipmentSlot */
/** @typedef {import("../InventoryItem.js").default} InventoryItem */

/**
 * @class UnstashAction
 * @classdesc Represents an unstash action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/unstash-action.html
 */
export default class UnstashAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Unstash;

	/**
     * Performs an unstash action.
     * @param {InventoryItem} item - The inventory item to unstash. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param {InventoryItem} container - The inventory item's current container.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} the inventory item is currently in.
     */
	performUnstash(item, handEquipmentSlot, container, inventorySlot) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateUnstash(this, item, container, inventorySlot, this.player);
		this.getGame().logHandler.logUnstash(item, this.player, container, inventorySlot, this.forced);
		this.player.unstash(item, handEquipmentSlot, container, inventorySlot);
	}
}