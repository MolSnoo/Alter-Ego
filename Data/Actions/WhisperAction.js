import { default as Action, ActionType } from "../Action.js";

/** @typedef {import("../Player.js").default} Player */

/**
 * @class WhisperAction
 * @classdesc Represents a whisper action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/whisper-action.html
 */
export default class WhisperAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Whisper;

	/**
	 * Performs a whisper action.
	 * @param {Player[]} players - The players to add to the whisper.
	 * @returns The created whisper.
	 */
	async performWhisper(players) {
		if (this.performed) return;
		super.perform();
		const whisper = await this.getGame().entityLoader.createWhisper(players);
		this.getGame().narrationHandler.narrateWhisper(this, whisper, this.player);
		this.getGame().logHandler.logWhisper(whisper, this.player, this.forced);
		return whisper;
	}
}