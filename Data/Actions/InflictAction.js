import { default as Action, ActionType } from "../Action.js";
import CureAction from "./CureAction.js";
/** @typedef {import("../InventoryItem.js").default} InventoryItem */
/** @typedef {import("../Status.js").default} Status */

/**
 * @class InflictAction
 * @classdesc Represents an inflict action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/inflict-action.html
 */
export default class InflictAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Inflict;

	/**
	 * Performs an inflict action.
	 * @param {Status} status - The status to inflict.
	 * @param {boolean} [notify=true] - Whether or not to send the player the status's inflictedDescription. Defaults to true.
     * @param {boolean} [doCures=true] - Whether or not the status's cures should actually be cured. Defaults to true.
     * @param {boolean} [narrate=true] - Whether or not to send any narrations caused by the status being inflicted. Defaults to true.
     * @param {InventoryItem} [item] - The inventory item that caused the status to be inflicted, if applicable.
	 * @param {import('luxon').Duration} [duration] - A custom duration that overrides the status's default duration.
	 * @returns Whether or not the bot should send a followup message.
	 */
	performInflict(status, notify = true, doCures = true, narrate = true, item, duration = null) {
		if (this.performed) return false;
		super.perform();
		const playerStatusIds = this.player.statusCollection.map(statusEffect => statusEffect.id);
		for (const overrider of status.overriders) {
			if (playerStatusIds.includes(overrider.id)) {
				if (this.message) this.message.reply(`Couldn't inflict status effect "${status.id}" because ${this.player.name} is already ${overrider.id}.`);
				return false;
			}
		}
		if (playerStatusIds.includes(status.id)) {
			if (status.duplicatedStatus !== null) {
				const cureAction = new CureAction(this.getGame(), undefined, this.player, this.player.location, true);
				cureAction.performCure(status, false, false, false);
				const duplicatedStatusAction = new InflictAction(this.getGame(), undefined, this.player, this.player.location, true);
				duplicatedStatusAction.performInflict(status.duplicatedStatus, true, false, true);
				if (this.message) this.message.reply(`Status was duplicated, so inflicted ${status.duplicatedStatus.id} instead.`);
				return false;
			}
			else {
				if (this.message) this.message.reply(`Specified player already has that status effect.`);
				return false;
			}
		}
		if (status.cures.length > 0 && doCures) {
			for (const cure of status.cures) {
				const cureAction = new CureAction(this.getGame(), undefined, this.player, this.player.location, true);
				cureAction.performCure(cure, false, false, false);
			}
		}
		
		// Apply the effects of behavior attributes.
		if (status.id === "heated")
			this.getGame().heated = true;
		if (status.behaviorAttributes.has("no channel")) {
			this.location.leaveChannel(this.player);
			const narration = this.getGame().notificationGenerator.generateNoChannelLeaveWhisperNotification(this.player, status.id);
			this.player.removeFromWhispers(narration, this);
		}
		if (status.behaviorAttributes.has("no hearing")) {
			const narration = this.getGame().notificationGenerator.generateNoHearingLeaveWhisperNotification(this.player.displayName);
			this.player.removeFromWhispers(narration, this);
		}
		if (status.behaviorAttributes.has("concealed")) {
			const maskName = item ? item.singleContainingPhrase : "a MASK";
			this.displayName = `An individual wearing ${maskName}`;
			this.displayIcon = "https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png";
			this.player.setPronouns(this.player.pronouns, "neutral");
			this.location.occupantsString = this.location.generateOccupantsString(this.location.occupants.filter(occupant => !occupant.isHidden()));
		}
		if (status.behaviorAttributes.has("disable all") || status.behaviorAttributes.has("disable move") || status.behaviorAttributes.has("disable run"))
			this.player.stopMoving();

		this.player.inflict(status, duration);
		if (notify) this.player.sendDescription(status.inflictedDescription, status);
		if (narrate) this.getGame().narrationHandler.narrateInflict(this, status, this.player);
		this.getGame().logHandler.logInflict(status, this.player);
		return true;
	}
}