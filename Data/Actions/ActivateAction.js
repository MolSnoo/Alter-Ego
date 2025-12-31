import { default as Action, ActionType } from "../Action.js";

/** @typedef {import("../Fixture.js").default} Fixture */

/**
 * @class ActivateAction
 * @classdesc Represents an activate action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/activate-action.html
 */
export default class ActivateAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Activate;

	/**
	 * Performs an activate action.
	 * @param {Fixture} fixture - The fixture to activate.
	 * @param {boolean} narrate - Whether or not to narrate the fixture's activation.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	performActivate(fixture, narrate, customNarration) {
		if (this.performed) return;
		super.perform();
		if (narrate)
			this.getGame().narrationHandler.narrateActivate(fixture, this.player, customNarration);
		this.getGame().logHandler.logActivate(fixture, this.player, this.forced);
		fixture.activate(this.player);
	}
}