import { default as Action, ActionType } from "../Action.js";

/** @typedef {import("../Dialog.js").default} Dialog */

/**
 * @class AnnounceAction
 * @classdesc Represents an announce action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/announce-action.html
 */
export default class AnnounceAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Announce;

	/**
	 * Performs an announce action.
	 * @param {Dialog} announcement - The announcement that was made.
	 */
	performAnnounce(announcement) {
		if (this.performed) return;
		super.perform();
		for (const livingPlayer of this.getGame().livingPlayersCollection.values())
			this.getGame().communicationHandler.mirrorDialogInSpectateChannel(livingPlayer, this, announcement);
	}
}