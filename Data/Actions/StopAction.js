import Action from "../Action.js";

/** @typedef {import("../Exit.js").default} Exit */

/**
 * @class StopAction
 * @classdesc Represents a stop action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/stop-action.html
 */
export default class StopAction extends Action {
	/**
	 * Performs a stop action.
	 * @param {boolean} [exitLocked] - Whether or not the action was initiated because the destination exit was locked. Defaults to false.
	 * @param {Exit} [exit] - The exit the player tried to move to, if applicable.
	 */
	performStop(exitLocked = false, exit) {
		if (this.performed) return;
		super.perform();
		this.player.stopMoving();
		this.getGame().narrationHandler.narrateStop(this, this.player, exitLocked, exit);
	}
}