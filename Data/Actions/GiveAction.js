import Action from "../Action.js";

/** @typedef {import("../EquipmentSlot.js").default} EquipmentSlot */
/** @typedef {import("../InventoryItem.js").default} InventoryItem */
/** @typedef {import("../Player.js").default} Player */

/**
 * @class GiveAction
 * @classdesc Represents a give action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/give-action.html
 */
export default class GiveAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Give;

	/**
	 * Performs a give action.
	 * @param {InventoryItem} item - The inventory item to give.
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {Player} recipient - The player to give the inventory item to.
     * @param {EquipmentSlot} recipientHandEquipmentSlot - The hand equipment slot of the recipient to put the item in.
	 */
	performGive(item, handEquipmentSlot, recipient, recipientHandEquipmentSlot) {
		if (this.performed) return;
		super.perform();
		const successful = this.forced || recipient.carryWeight + item.weight <= recipient.maxCarryWeight;
		this.getGame().narrationHandler.narrateGive(item, this.player, recipient);
		this.getGame().logHandler.logGive(item, this.player, recipient, successful, this.forced);
		if (successful) this.player.give(item, handEquipmentSlot, recipient, recipientHandEquipmentSlot);
	}
}