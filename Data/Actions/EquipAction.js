import Action from "../Action.js";

/** @typedef {import("../EquipmentSlot.js").default} EquipmentSlot */
/** @typedef {import("../InventoryItem.js").default} InventoryItem */

/**
 * @class EquipAction
 * @classdesc Represents an equip action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/equip-action.html
 */
export default class EquipAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Equip;

	/**
     * Performs an equip action.
     * @param {InventoryItem} item - The inventory item to equip.
     * @param {EquipmentSlot} equipmentSlot - The equipment slot to equip the inventory item to. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {boolean} [notify=true] - Whether or not to notify the player that they equipped the inventory item. Defaults to true.
     */
	performEquip(item, equipmentSlot, handEquipmentSlot, notify = true) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateEquip(item, this.player, notify);
		this.getGame().logHandler.logEquip(item, this.player, equipmentSlot, this.forced);
		this.player.equip(item, equipmentSlot, handEquipmentSlot);
	}
}