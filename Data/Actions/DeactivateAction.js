import Action from "../Action.js";

/** @typedef {import("../Fixture.js").default} Fixture */

/**
 * @class DeactivateAction
 * @classdesc Represents a deactivate action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/deactivate-action.html
 */
export default class DeactivateAction extends Action {
	/**
	 * Performs a deactivate action.
	 * @param {Fixture} fixture - The fixture to deactivate.
	 * @param {boolean} narrate - Whether or not to narrate the fixture's deactivation.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	performDeactivate(fixture, narrate, customNarration) {
		if (this.performed) return;
		super.perform();
		if (narrate)
			this.getGame().narrationHandler.narrateDeactivate(this, fixture, this.player, customNarration);
		this.getGame().logHandler.logDeactivate(fixture, this.player, this.forced);
		fixture.deactivate();
	}
}
