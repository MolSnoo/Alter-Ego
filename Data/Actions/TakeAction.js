import { default as Action, ActionType } from "../Action.js";
import InventorySlot from "../InventorySlot.js";
import Puzzle from "../Puzzle.js";
import { getSortedItemsString } from "../../Modules/helpers.js";

/** @typedef {import("../EquipmentSlot.js").default} EquipmentSlot */
/** @typedef {import("../Fixture.js").default} Fixture */
/** @typedef {import("../RoomItem.js").default} RoomItem */

/**
 * @class TakeAction
 * @classdesc Represents a take action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/take-action.html
 */
export default class TakeAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Take;

	/**
	 * Performs a take action.
	 * @param {RoomItem} item - The room item to take. 
	 * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the item in.
     * @param {Puzzle|Fixture|RoomItem} container - The item's current container.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} the item is currently in.
     * @param {boolean} [notify] - Whether or not to notify the player that they took the item. Defaults to true.
	 */
	performTake(item, handEquipmentSlot, container, inventorySlot, notify = true) {
		if (this.performed) return;
		super.perform();
		const successful = this.forced || this.player.carryWeight + item.weight <= this.player.carryWeight;
		this.getGame().narrationHandler.narrateTake(item, this.player, notify);
		this.getGame().logHandler.logTake(item, this.player, container, inventorySlot, successful, this.forced);
		if (!successful) return;
		this.player.take(item, handEquipmentSlot, container, inventorySlot);
		// Container is a weight puzzle.
		if (container instanceof Puzzle && container.type === "weight") {
			const containerItems = this.getGame().roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
			const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
			this.player.attemptPuzzle(container, item, weight.toString(), "take", "");
		}
		// Container is a container puzzle.
		else if (container instanceof Puzzle && container.type === "container") {
			const containerItems = this.getGame().roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
			const containerItemsString = getSortedItemsString(containerItems);
			this.player.attemptPuzzle(container, item, containerItemsString, "take", "");
		}
	}
}