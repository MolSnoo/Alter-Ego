import { default as Action, ActionType } from "../Action.js";
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
	 */
	performInflict(status, notify = true, doCures = true, narrate = true, item, duration = null) {
		if (this.performed) return;
		super.perform();
		const playerStatusIds = this.player.status.map(statusEffect => statusEffect.id);
		for (const overrider of status.overriders) {
			if (playerStatusIds.includes(overrider.id)) {
				if (this.message) this.message.reply(`Couldn't inflict status effect "${status.id}" because ${this.player.name} is already ${overrider.id}.`);
				return;
			}
		}
		if (playerStatusIds.includes(status.id)) {
			if (status.duplicatedStatus !== null) {
				this.player.cure(status.id, false, false, false);
				const duplicatedStatusAction = new InflictAction(this.getGame(), undefined, this.player, this.player.location, true);
				duplicatedStatusAction.performInflict(status.duplicatedStatus, true, false, true);
				if (this.message) this.message.reply(`Status was duplicated, so inflicted ${status.duplicatedStatus.id} instead.`);
				return;
			}
			else {
				if (this.message) this.message.reply(`Specified player already has that status effect.`);
				return;
			}
		}
		if (status.cures.length > 0 && doCures) {
			for (const cure of status.cures)
				this.player.cure(cure.id, false, false, false);
		}
		
		// Apply the effects of behavior attributes.
		if (status.id === "heated")
			this.getGame().heated = true;
		if (status.behaviorAttributes.includes("no channel")) {
			this.location.leaveChannel(this.player);
			const narration = this.getGame().notificationGenerator.generateNoChannelLeaveWhisperNotification(this.player, status.id);
			this.player.removeFromWhispers(narration);
		}
		if (status.behaviorAttributes.includes("no hearing")) {
			const narration = this.getGame().notificationGenerator.generateNoHearingLeaveWhisperNotification(this.player.displayName);
			this.player.removeFromWhispers(narration);
		}
		if (status.behaviorAttributes.includes("concealed")) {
			const maskName = item ? item.singleContainingPhrase : "a MASK";
			this.displayName = `An individual wearing ${maskName}`;
			this.displayIcon = "https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png";
			this.player.setPronouns(this.player.pronouns, "neutral");
			this.location.occupantsString = this.location.generateOccupantsString(this.location.occupants.filter(occupant => !occupant.hasBehaviorAttribute("hidden")));
		}
		if (status.behaviorAttributes.includes("disable all") || status.behaviorAttributes.includes("disable move") || status.behaviorAttributes.includes("disable run"))
			this.player.stopMoving();

		this.player.inflict(status, duration);
		if (notify) this.player.sendDescription(status.inflictedDescription, status);
		if (narrate) this.getGame().narrationHandler.narrateInflict(status, this.player);
		this.getGame().logHandler.logInflict(status, this.player);
	}
}