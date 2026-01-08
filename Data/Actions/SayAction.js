import { default as Action, ActionType } from "../Action.js";

/** @typedef {import("../Dialog.js").default} Dialog */
/** @typedef {import("../Player.js").default} Player */

/**
 * @class SayAction
 * @classdesc Represents a say action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/say-action.html
 */
export default class SayAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Say;

	/**
	 * Performs a say action.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	performSay(dialog) {
		if (this.performed) return;
		super.perform();
		this.#communicateWhisperedDialog(dialog);
		this.#communicateDialogToRoomOccupants(dialog);
	}

	/**
	 * Mirrors the player's own dialog in their spectate channel.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	#mirrorPlayersOwnDialog(dialog) {
		const webhookUsername = dialog.speaker.displayName !== dialog.speaker.name ? `${dialog.speaker.displayName} (${dialog.speaker.name})` : undefined;
		this.getGame().communicationHandler.mirrorDialogInSpectateChannel(dialog.speaker, this, dialog, webhookUsername);
	}

	/**
	 * Returns true if the given player is unable to receive communications.
	 * @param {Player} player 
	 */
	#playerCannotReceiveCommunications(player) {
		return player.isNPC || player.hasBehaviorAttribute("no hearing") || player.hasBehaviorAttribute("unconscious");
	}

	/**
	 * Returns true if the player notification should be sent to the spectate channel instead of a webhook.
	 * @param {boolean} playerIsBeingMimicked - Whether or not the speaker is mimicking the player.
	 * @param {boolean} playerCanSee - Whether or not the player can see.
	 * @param {boolean} playerCanSeeSpeaker - Whether or not the player can see the speaker.
	 * @param {boolean} playerRecognizesSpeaker - Whether or not the player recognizes the speaker's voice.
	 */
	#playerNotificationTakesPriority(playerIsBeingMimicked, playerCanSee, playerCanSeeSpeaker, playerRecognizesSpeaker) {
		return playerIsBeingMimicked || !playerCanSee || !playerCanSeeSpeaker && !playerRecognizesSpeaker;
	}

	/**
	 * Returns a custom username to use for the webhook that will mirror dialog. If no custom username should be set, returns undefined.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 * @param {boolean} playerCanSee - Whether or not the player can see.
	 * @param {boolean} playerCanSeeSpeaker - Whether or not the player can see the speaker.
	 * @param {boolean} playerRecognizesSpeaker - Whether or not the player recognizes the speaker's voice.
	 * @param {boolean} speakerDisplayNameIsDifferent - Whether or not the speaker's display name is different from their name.
	 */
	#generateWebhookUsername(dialog, playerCanSee, playerCanSeeSpeaker, playerRecognizesSpeaker, speakerDisplayNameIsDifferent) {
		if (playerRecognizesSpeaker && playerCanSeeSpeaker && speakerDisplayNameIsDifferent)
			return `${dialog.speakerDisplayName} (${dialog.speakerRecognitionName})`;
		else if (playerRecognizesSpeaker && !playerCanSeeSpeaker)
			return `${dialog.speakerRecognitionName}`;
		else if (playerCanSee && !playerRecognizesSpeaker && !playerCanSeeSpeaker)
			return `${dialog.speakerDisplayName}`;
		return undefined;
	}

	/**
	 * Communicates whispered dialog to players in the whisper.
	 * @param {Dialog} dialog - The dialog that was spoken. 
	 */
	#communicateWhisperedDialog(dialog) {
		for (const player of dialog.whisper.playersCollection.values()) {
			if (dialog.speaker.name === player.name) {
				this.#mirrorPlayersOwnDialog(dialog);
				continue;
			}
			if (this.#playerCannotReceiveCommunications(player)) continue;

			const playerIsBeingMimicked = dialog.speakerRecognitionName === player.name;
			const playerRecognizesSpeaker = player.hasBehaviorAttribute(`knows ${dialog.speakerRecognitionName}`);
			const playerCanSee = !player.hasBehaviorAttribute("no sight");
			const playerCanSeeSpeaker = playerCanSee && player.member.permissionsIn(dialog.whisper.channel).has('ViewChannel');
			const speakerDisplayNameIsDifferent = dialog.speakerDisplayName !== dialog.speakerRecognitionName;

			let webhookUsername = this.#generateWebhookUsername(dialog, playerCanSee, playerCanSeeSpeaker, playerRecognizesSpeaker, speakerDisplayNameIsDifferent);
			const notification = this.getGame().notificationGenerator.generateHearWhisperNotification(player, dialog);
			if (this.#playerNotificationTakesPriority(playerIsBeingMimicked, playerCanSee, playerCanSeeSpeaker, playerRecognizesSpeaker)) {
				this.getGame().communicationHandler.notifyPlayer(player, this, notification);
				continue;
			}
			if (webhookUsername)
				this.getGame().communicationHandler.mirrorDialogInSpectateChannel(player, this, dialog, webhookUsername, notification);
			else this.getGame().communicationHandler.mirrorDialogInSpectateChannel(player, this, dialog);
		}
	}

	/**
	 * Communicates whispered dialog to players in the room.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	#communicateDialogToRoomOccupants(dialog) {
		for (const player of dialog.location.occupants) {
			if (dialog.speaker.name === player.name) {
				this.#mirrorPlayersOwnDialog(dialog);
				continue;
			}
			if (this.#playerCannotReceiveCommunications(player)) continue;

			const playerIsBeingMimicked = dialog.speakerRecognitionName === player.name;
			const playerRecognizesSpeaker = player.hasBehaviorAttribute(`knows ${dialog.speakerRecognitionName}`);
			const playerCanSee = !player.hasBehaviorAttribute("no sight");
			const playerAndSpeakerAreHidingTogether = dialog.speaker.hasBehaviorAttribute("hidden") && player.hasBehaviorAttribute("hidden") && dialog.speaker.hidingSpot === player.hidingSpot;
			const playerCanSeeSpeaker = playerCanSee && (!dialog.speaker.hasBehaviorAttribute(`hidden`) || playerAndSpeakerAreHidingTogether);
			const speakerDisplayNameIsDifferent = dialog.speakerDisplayName !== dialog.speakerRecognitionName;

			const webhookUsername = this.#generateWebhookUsername(dialog, playerCanSee, playerCanSeeSpeaker, playerRecognizesSpeaker, speakerDisplayNameIsDifferent);
			// Players with the acute hearing attribute should overhear other whispers.
			if (dialog.whisper) {
				if (player.hasBehaviorAttribute("acute hearing") && !dialog.whisper.playersCollection.has(player.name)) {
					const notification = this.getGame().notificationGenerator.generateAcuteHearingPlayerOverhearWhisperNotification(player, dialog);
					if (this.#playerNotificationTakesPriority(playerIsBeingMimicked, playerCanSee, playerCanSeeSpeaker, playerRecognizesSpeaker)) {
						this.getGame().communicationHandler.notifyPlayer(player, this, notification);
						continue;
					}
					this.getGame().communicationHandler.mirrorDialogInSpectateChannel(player, this, dialog, webhookUsername, notification);
				}
				continue;
			}

			const notification = this.getGame().notificationGenerator.generateHearDialogNotification(player, dialog);
			if (this.#playerNotificationTakesPriority(playerIsBeingMimicked, playerCanSee, playerCanSeeSpeaker, playerRecognizesSpeaker)) {
				this.getGame().communicationHandler.notifyPlayer(player, this, notification);
				continue;
			}
			if (webhookUsername || player.hasBehaviorAttribute("hear room"))
				this.getGame().communicationHandler.mirrorDialogInSpectateChannel(player, this, dialog, webhookUsername, notification);
			else this.getGame().communicationHandler.mirrorDialogInSpectateChannel(player, this, dialog);
		}
	}
}