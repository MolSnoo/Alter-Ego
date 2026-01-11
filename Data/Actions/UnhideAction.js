import Action from "../Action.js";
import CureAction from "./CureAction.js";

/** @typedef {import("../HidingSpot.js").default} HidingSpot */

/**
 * @class UnhideAction
 * @classdesc Represents an unhide action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/unhide-action.html
 */
export default class UnhideAction extends Action {
	/**
	 * Performs an unhide action.
	 * @param {HidingSpot} [hidingSpot] - The hiding spot to unhide from. If one is not specified, it will be searched for.
	 */
	performUnhide(hidingSpot) {
		if (this.performed) return;
		super.perform();
		if (!hidingSpot) {
			const hidingSpotFixture = this.getGame().entityFinder.getFixture(this.player.hidingSpot, this.player.location.id);
			if (hidingSpotFixture) hidingSpot = hidingSpotFixture.hidingSpot;
		}
		this.getGame().narrationHandler.narrateUnhide(this, hidingSpot, this.player);
		if (hidingSpot) hidingSpot.removePlayer(this.player, this);
		else {
			const whisperNarration = this.getGame().notificationGenerator.generateUnhideNotification(this.player, false, "hiding");
			this.player.removeFromWhispers(whisperNarration, this);
			this.player.hidingSpot = "";
		}
		const hiddenStatus = this.getGame().entityFinder.getStatusEffect("hidden");
		const cureAction = new CureAction(this.getGame(), undefined, this.player, this.player.location, true);
		cureAction.performCure(hiddenStatus, true, false, true);
		this.getGame().logHandler.logUnhide(hidingSpot, this.player, this.forced);
	}
}