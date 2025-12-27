import Action from "../Action.js";

/**
 * @class StopAction
 * @classdesc Represents a stop action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/stop-action.html
 */
export default class StopAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Stop;

	/**
	 * Performs a stop action.
	 */
	performStop() {
		if (this.performed) return;
		super.perform();
		this.player.stopMoving();
		this.getGame().narrationHandler.narrateStop(this.player);
	}
}