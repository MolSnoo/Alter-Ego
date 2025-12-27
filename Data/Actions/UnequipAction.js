import Action from "../Action.js";

/** @typedef {import("../EquipmentSlot.js").default} EquipmentSlot */
/** @typedef {import("../InventoryItem.js").default} InventoryItem */

/**
 * @class UnequipAction
 * @classdesc Represents an unequip action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/unequip-action.html
 */
export default class UnequipAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Unequip;

	/**
     * Performs an unequip action.
     * @param {InventoryItem} item - The inventory item to unequip.
     * @param {EquipmentSlot} equipmentSlot - The equipment slot the inventory item is currently equipped to. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param {boolean} [notify=true] - Whether or not to notify the player that they unequipped the inventory item. Defaults to true.
     */
	performUnequip(item, equipmentSlot, handEquipmentSlot, notify = true) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateUnequip(item, this.player, notify);
		this.getGame().logHandler.logUnequip(item, this.player, equipmentSlot, this.forced);
		this.player.unequip(item, equipmentSlot, handEquipmentSlot);
	}
}