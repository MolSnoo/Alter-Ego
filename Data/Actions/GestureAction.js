import { default as Action, ActionType } from "../Action.js";
import Gesture from "../Gesture.js";

/** @typedef {import("../Exit.js").default} Exit */
/** @typedef {import("../Fixture.js").default} Fixture */
/** @typedef {import("../InventoryItem.js").default} InventoryItem */
/** @typedef {import("../Player.js").default} Player */
/** @typedef {import("../RoomItem.js").default} RoomItem */

/**
 * @class GestureAction
 * @classdesc Represents a gesture action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/gesture-action.html
 */
export default class GestureAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Gesture;

	/**
	 * Performs a gesture action.
	 * @param {Gesture} gesture - The gesture to perform.
	 * @param {string} targetType - The type of entity to target.
	 * @param {Exit|Fixture|RoomItem|Player|InventoryItem|null} target - The entity to target.
	 */
	performGesture(gesture, targetType, target) {
		if (this.performed) return;
		super.perform();
		let newGesture = new Gesture(gesture.id, [...gesture.requires], [...gesture.disabledStatusesStrings], gesture.description, gesture.narration, gesture.row, this.getGame());
		newGesture.targetType = targetType;
		newGesture.target = target;
		this.getGame().narrationHandler.narrateGesture(this, newGesture, this.player);
		this.getGame().logHandler.logGesture(gesture, target, this.player, this.forced);
	}
}