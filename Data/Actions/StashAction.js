import Action from "../Action.js";
import EquipmentSlot from "../EquipmentSlot.js";
import InventoryItem from "../InventoryItem.js";
import InventorySlot from "../InventorySlot.js";

/**
 * @class StashAction
 * @classdesc Represents a stash action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/stash-action.html
 */
export default class StashAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Stash;

	/**
	 * Performs a stash action.
	 * @param {InventoryItem} item - The inventory item to stash. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {InventoryItem} container - The container to stash the inventory item in.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} to stash the inventory item in.
	 */
	performStash(item, handEquipmentSlot, container, inventorySlot) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateStash(item, container, inventorySlot, this.player);
		this.getGame().logHandler.logStash(item, this.player, container, inventorySlot, this.forced);
		this.player.stash(item, handEquipmentSlot, container, inventorySlot);
	}
}