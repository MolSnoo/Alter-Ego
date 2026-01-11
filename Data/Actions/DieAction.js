import Action from "../Action.js";

/**
 * @class DieAction
 * @classdesc Represents a die action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/die-action.html
 */
export default class DieAction extends Action {
	/**
	 * Performs a die action.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	performDie(customNarration) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateDie(this, this.player, customNarration);
		this.getGame().logHandler.logDie(this.player);
		this.player.die(this);
	}
}