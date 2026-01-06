import { default as Action, ActionType } from "../Action.js";
import Puzzle from "../Puzzle.js";

/** @typedef {import("../Event.js").default} Event */
/** @typedef {import("../Flag.js").default} Flag */
/** @typedef {import("../InventoryItem.js").default} InventoryItem */

/**
 * @class UnsolveAction
 * @classdesc Represents an unsolve action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/unsolve-action.html
 */
export default class UnsolveAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Unsolve;

	/**
	 * Performs an unsolve action.
	 * @param {Puzzle} puzzle - The puzzle to unsolve.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 * @param {Event|Flag|InventoryItem|Puzzle} [callee] - The in-game entity that caused the command to be executed, if applicable.
	 */
	performUnsolve(puzzle, customNarration, callee) {
		if (this.performed) return;
		super.perform();
		const doUnsolvedCommands = !callee || !(callee instanceof Puzzle);
		puzzle.unsolve(this.player, doUnsolvedCommands);
		this.getGame().narrationHandler.narrateUnsolve(this, puzzle, this.player, customNarration);
		this.getGame().logHandler.logUnsolve(puzzle, this.player, this.forced);
	}
}