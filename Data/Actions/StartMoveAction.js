import { default as Action, ActionType } from "../Action.js";

/** @typedef {import("../Exit.js").default} Exit */
/** @typedef {import("../Room.js").default} Room */

/**
 * @class StartMoveAction
 * @classdesc Represents a start move action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/start-move-action.html
 */
export default class StartMoveAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.StartMove;

	/**
	 * Performs a start move action.
	 * @param {boolean} isRunning - Whether the player is running.
     * @param {Room} currentRoom - The room the player is currently in.
     * @param {Room} destinationRoom - The room the player will be moved to.
     * @param {Exit} exit - The exit the player will leave their current room through.
     * @param {Exit} entrance - The exit the player will enter the destination room from.
	 */
	performStartMove(isRunning, currentRoom, destinationRoom, exit, entrance) {
		if (this.performed) return;
		super.perform();
		const time = this.player.calculateMoveTime(exit, isRunning);
		if (time > 1000) this.getGame().narrationHandler.narrateStartMove(this, isRunning, exit, this.player);
		this.player.move(isRunning, currentRoom, destinationRoom, exit, entrance, time, this.forced);
	}
}