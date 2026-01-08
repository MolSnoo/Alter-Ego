import Action from "../Action.js";

/** @typedef {import("../Exit.js").default} Exit */

/**
 * @class KnockAction
 * @classdesc Represents a knock action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/knock-action.html
 */
export default class KnockAction extends Action {
	/**
	 * Performs a knock action.
	 * @param {Exit} exit - The exit to knock on.
	 */
	performKnock(exit) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateKnock(this, exit, this.player);
		this.getGame().logHandler.logKnock(exit, this.player, this.forced);
	}
}