import Action from "../Action.js";
import InventorySlot from "../InventorySlot.js";
import Puzzle from "../Puzzle.js";
import { getSortedItemsString } from "../../Modules/helpers.js";

/** @typedef {import("../EquipmentSlot.js").default} EquipmentSlot */
/** @typedef {import("../Fixture.js").default} Fixture */
/** @typedef {import("../InventoryItem.js").default} InventoryItem */
/** @typedef {import("../RoomItem.js").default} RoomItem */

/**
 * @class DressAction
 * @classdesc Represents a dress action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/dress-action.html
 */
export default class DressAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Dress;

	/**
	 * Performs a dress action.
	 * @param {RoomItem[]} items - All of the equippable items in the given container.
	 * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to use to take items.
	 * @param {Puzzle|Fixture|RoomItem} container - The container to dress from.
	 * @param {InventorySlot<RoomItem>} inventorySlot - The inventory slot to dress from, if applicable.
	 */
	performDress(items, handEquipmentSlot, container, inventorySlot) {
		if (this.performed) return;
		super.perform();
		/** @type {InventoryItem[]} */
		const equippedItems = [];
		for (const item of items) {
			// Player shouldn't be able to take items that they're not strong enough to carry.
			if (!this.forced && this.player.carryWeight + item.weight > this.player.maxCarryWeight) continue;
			for (const slotId of item.prefab.equipmentSlots) {
				if (this.player.inventoryCollection.has(slotId) && this.player.inventoryCollection.get(slotId).equippedItem === null) {
					this.player.take(item, handEquipmentSlot, container, inventorySlot);
					this.player.equip(handEquipmentSlot.equippedItem, this.player.inventoryCollection.get(slotId), handEquipmentSlot);
					equippedItems.push(this.player.inventoryCollection.get(slotId).equippedItem);
					break;
				}
			}
		}
		this.getGame().narrationHandler.narrateDress(equippedItems, container, this.player);
		this.getGame().logHandler.logDress(equippedItems, this.player, container, inventorySlot, this.forced);
		// Container is a weight puzzle.
		if (container instanceof Puzzle && container.type === "weight") {
			const containerItems = this.getGame().roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
			const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
			this.player.attemptPuzzle(container, null, weight.toString(), "take", "");
		}
		// Container is a container puzzle.
		else if (container instanceof Puzzle && container.type === "container") {
			const containerItems = this.getGame().roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
			const containerItemsString = getSortedItemsString(containerItems);
			this.player.attemptPuzzle(container, null, containerItemsString, "take", "");
		}
	}
}