import Action from "../Action.js";
import Puzzle from "../Puzzle.js";

/** @typedef {import("../Event.js").default} Event */
/** @typedef {import("../Flag.js").default} Flag */
/** @typedef {import("../InventoryItem.js").default} InventoryItem */
/** @typedef {import("../ItemInstance.js").default} ItemInstance */
/** @typedef {import("../Player.js").default} Player */

/**
 * @class SolveAction
 * @classdesc Represents a solve action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/solve-action.html
 */
export default class SolveAction extends Action {
	/**
	 * Performs a solve action.
	 * @param {Puzzle} puzzle - The puzzle to solve.
	 * @param {string} password - The password the player entered to solve the puzzle.
	 * @param {Player} [targetPlayer] - The player who will be treated as the initiating player in subsequent bot command executions called by the puzzle's solved commands, if applicable.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 * @param {Event|Flag|InventoryItem|Puzzle} [callee] - The in-game entity that caused the command to be executed, if applicable.
	 */
	performSolve(puzzle, password, targetPlayer, customNarration, callee) {
		if (this.performed) return;
		super.perform();
		/** 
		 * We don't care about whether or not the requirements are actually met, because this action bypasses the check.
		 * However, puzzle.checkRequirementsMet will insert the required item instances into requiredItems, so run it anyway.
		 * @type {ItemInstance[]}
		 */
		let requiredItems = [];
		puzzle.checkRequirementsMet(this.player, undefined, requiredItems);
		const doSolvedCommands = !callee || !(callee instanceof Puzzle);
		puzzle.solve(this.player, password, requiredItems, targetPlayer, doSolvedCommands);
		this.getGame().narrationHandler.narrateSolve(this, puzzle, password, this.player, undefined, customNarration);
		this.getGame().logHandler.logSolve(puzzle, this.player, this.forced);
	}
}