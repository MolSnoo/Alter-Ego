import { default as Action, ActionType } from "../Action.js";

/** @typedef {import("../Exit.js").default} Exit */
/** @typedef {import("../Room.js").default} Room */

/**
 * @class EnterAction
 * @classdesc Represents an enter action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/enter-action.html
 */
export default class EnterAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Enter;

	/**
	 * Performs an enter action.
	 * @param {Room} destinationRoom - The room the player will be moved to.
	 * @param {Exit} entrance - The exit the player will enter the destination room from.
	 */
	performEnter(destinationRoom, entrance) {
		if (this.performed) return;
		super.perform();
		destinationRoom.addPlayer(this.player, entrance);
		this.getGame().narrationHandler.narrateEnter(this, destinationRoom, entrance, this.player);
	}
}