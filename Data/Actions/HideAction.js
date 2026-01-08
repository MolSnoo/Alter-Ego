import { default as Action, ActionType } from "../Action.js";
import InflictAction from "./InflictAction.js";

/** @typedef {import("../HidingSpot.js").default} HidingSpot */

/**
 * @class HideAction
 * @classdesc Represents a hide action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/hide-action.html
 */
export default class HideAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Hide;

	/**
	 * Performs a hide action.
	 * @param {HidingSpot} hidingSpot - The hiding spot to hide in. 
	 */
	performHide(hidingSpot) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateHide(this, hidingSpot, this.player);
		let successful = false;
		if (hidingSpot.occupants.length + 1 <= hidingSpot.capacity) {
			hidingSpot.addPlayer(this.player);
			const hiddenStatus = this.getGame().entityFinder.getStatusEffect("hidden");
			const hiddenStatusAction = new InflictAction(this.getGame(), undefined, this.player, this.player.location, false);
			hiddenStatusAction.performInflict(hiddenStatus, true, false, true);
			this.location.occupantsString = this.location.generateOccupantsString(this.location.occupants.filter(occupant => !occupant.isHidden() && occupant.name !== this.player.name));
			successful = true;
		}
		this.getGame().logHandler.logHide(hidingSpot, this.player, successful, this.forced);
	}
}