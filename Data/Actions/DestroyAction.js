import { default as Action, ActionType } from "../Action.js";
import { destroyRoomItem, destroyInventoryItem } from "../../Modules/itemManager.js";
import ItemInstance from "../ItemInstance.js";

/** @typedef {import("../InventoryItem.js").default} InventoryItem */
/** @typedef {import("../RoomItem.js").default} RoomItem */

/**
 * @class DestroyAction
 * @classdesc Represents a destroy action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/destroy-action.html
 */
export default class DestroyAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Destroy;

	/**
	 * Performs a destroy action for a room item.
	 * @param {RoomItem} item - The item to destroy. 
	 * @param {number} quantity - How many of this item to destroy.
	 * @param {boolean} destroyChildren - Whether or not to recursively destroy all of the items it contains as well.
	 */
	performDestroyRoomItem(item, quantity, destroyChildren) {
		if (this.performed) return;
		super.perform();
		const inventorySlot = item.container instanceof ItemInstance ? item.container.inventoryCollection.get(item.slot) : undefined;
		this.getGame().logHandler.logDestroyRoomItem(item, quantity, item.container, inventorySlot);
		destroyRoomItem(item, quantity, destroyChildren);
	}

	/**
	 * Performs a destroy action for an inventory item.
	 * @param {InventoryItem} item - The item to destroy. 
	 * @param {number} quantity - How many of this item to destroy.
	 * @param {boolean} destroyChildren - Whether or not to recursively destroy all of the items it contains as well.
	 * @param {boolean} [notify] - Whether or not to notify the player that the item was removed from their inventory. Defaults to true. 
	 */
	performDestroyInventoryItem(item, quantity, destroyChildren, notify = true) {
		if (this.performed) return;
		super.perform();
		const equipmentSlot = this.player.inventoryCollection.get(item.equipmentSlot);
		const inventorySlot = item.container instanceof ItemInstance ? item.container.inventoryCollection.get(item.slot) : undefined;
		if (!item.container) {
			if (notify) this.getGame().narrationHandler.narrateDestroyEquippedInventoryItem(this, item, this.player);
			this.getGame().logHandler.logDestroyEquippedInventoryItem(item, this.player, equipmentSlot);
		}
		else
			this.getGame().logHandler.logDestroyStashedInventoryItem(item, quantity, this.player, item.container, inventorySlot);
		destroyInventoryItem(item, quantity, destroyChildren);
	}
}