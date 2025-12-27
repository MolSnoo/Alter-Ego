import Action from "../Action.js";
import Exit from "../Exit.js";
import Fixture from "../Fixture.js";
import Gesture from "../Gesture.js";
import InventoryItem from "../InventoryItem.js";
import Player from "../Player.js";
import RoomItem from "../RoomItem.js";

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
		this.getGame().narrationHandler.narrateGesture(newGesture, this.player);
		this.getGame().logHandler.logGesture(gesture, target, this.player, this.forced);
	}
}