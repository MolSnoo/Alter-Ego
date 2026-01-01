import { default as Action, ActionType } from "../Action.js";
import AttemptAction from "./AttemptAction.js";
import InventorySlot from "../InventorySlot.js";
import Puzzle from "../Puzzle.js";
import DropAction from "./DropAction.js";
import { getSortedItemsString } from "../../Modules/helpers.js";

/** @typedef {import("../Fixture.js").default} Fixture */
/** @typedef {import("../InventoryItem.js").default} InventoryItem */
/** @typedef {import("../RoomItem.js").default} RoomItem */

/**
 * @class UndressAction
 * @classdesc Represents an undress action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/undress-action.html
 */
export default class UndressAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Undress;

	/**
	 * Performs an undress action.
	 * @param {Puzzle|Fixture|RoomItem} container - The container to put the items in.
	 * @param {InventorySlot<RoomItem>} inventorySlot - The inventory slot to put the items in, if applicable.
	 */
	performUndress(container, inventorySlot) {
		if (this.performed) return;
		super.perform();
		// First, drop the items in the player's hands.
		const rightHand = this.player.inventoryCollection.get("RIGHT HAND");
		const leftHand = this.player.inventoryCollection.get("LEFT HAND");
		if (rightHand && rightHand.equippedItem !== null) {
			const rightHandDropAction = new DropAction(this.getGame(), undefined, this.player, this.location, this.forced);
			rightHandDropAction.performDrop(rightHand.equippedItem, rightHand, container, inventorySlot, true);
		}
		if (leftHand && leftHand.equippedItem !== null) {
			const leftHandDropAction = new DropAction(this.getGame(), undefined, this.player, this.location, this.forced);
			leftHandDropAction.performDrop(leftHand.equippedItem, leftHand, container, inventorySlot, true);
		}
		/** @type {InventoryItem[]} */
		const droppedItems = [];
		for (const equipmentSlot of this.player.inventoryCollection.values()) {
			if (equipmentSlot.equippedItem !== null && equipmentSlot.equippedItem.prefab.equippable) {
				droppedItems.push(equipmentSlot.equippedItem)
				this.player.unequip(equipmentSlot.equippedItem, equipmentSlot, rightHand);
				this.player.drop(rightHand.equippedItem, rightHand, container, inventorySlot);
			}
		}
		this.getGame().narrationHandler.narrateUndress(droppedItems, container, this.player);
		this.getGame().logHandler.logUndress(droppedItems, this.player, container, inventorySlot, this.forced);
		// Container is a weight puzzle.
		if (container instanceof Puzzle && container.type === "weight") {
			const containerItems = this.getGame().roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
			const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
			const attemptAction = new AttemptAction(this.getGame(), undefined, this.player, this.location, this.forced);
			attemptAction.performAttempt(container, undefined, String(weight), "drop", "");
		}
		// Container is a container puzzle.
		else if (container instanceof Puzzle && container.type === "container") {
			const containerItems = this.getGame().roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
			const containerItemsString = getSortedItemsString(containerItems);
			const attemptAction = new AttemptAction(this.getGame(), undefined, this.player, this.location, this.forced);
			attemptAction.performAttempt(container, undefined, containerItemsString, "drop", "");
		}
	}
}