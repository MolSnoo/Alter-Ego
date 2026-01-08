import Action from "../Action.js";
import SolveAction from "./SolveAction.js";

/** @typedef {import("../Dialog.js").default} Dialog */
/** @typedef {import("../Player.js").default} Player */
/** @typedef {import("../Puzzle.js").default} Puzzle */
/** @typedef {import("../Room.js").default} Room */

/**
 * @class SayAction
 * @classdesc Represents a say action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/say-action.html
 */
export default class SayAction extends Action {
	/**
	 * An array of all voice-type puzzles in the game. This will be accessed several times, so it's stored here to avoid iterating through the full list of puzzles repeatedly.
	 * @type {Puzzle[]}
	 */
	#voicePuzzles;

	/**
	 * Performs a say action.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	performSay(dialog) {
		if (this.performed) return;
		super.perform();
		this.#voicePuzzles = this.getGame().entityFinder.getPuzzles(undefined, undefined, "voice");
		if (dialog.whisper) this.#communicateWhisperedDialog(dialog);
		this.#communicateDialogToRoomOccupants(dialog);
		this.#solveVoicePuzzles(dialog.location, dialog);
		this.#communicateDialogToNeighboringRooms(dialog);
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
		return player.isNPC || player.hasBehaviorAttribute("no hearing") || !player.isConscious();
	}

	/**
	 * Returns true if the player notification should be sent to the spectate channel instead of a webhook.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 * @param {Player} player - The player hearing the dialog.
	 * @param {boolean} playerCanSeeSpeaker - Whether or not the player can see the speaker.
	 */
	#playerNotificationTakesPriority(dialog, player, playerCanSeeSpeaker) {
		return dialog.isMimicking(player) || !player.canSee() || !player.knows(dialog.speakerRecognitionName) && !playerCanSeeSpeaker;
	}

	/**
	 * Returns true if a player should be notified of dialog that's already being narrated in the room they're in.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 * @param {Player} player - The player hearing the dialog.
	 */
	#playerShouldReceiveNotification(dialog, player) {
		return dialog.isMimicking(player) || player.knows(dialog.speakerRecognitionName) || player.hasBehaviorAttribute("hear room");
	}

	/**
	 * Returns a custom username to use for the webhook that will mirror dialog. If no custom username should be set, returns undefined.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 * @param {Player} player - The player hearing the dialog.
	 * @param {boolean} playerCanSeeSpeaker - Whether or not the player can see the speaker.
	 */
	#generateWebhookUsername(dialog, player, playerCanSeeSpeaker) {
		if (player.knows(dialog.speakerRecognitionName) && playerCanSeeSpeaker && dialog.speakerDisplayNameIsDifferent)
			return `${dialog.speakerDisplayName} (${dialog.speakerRecognitionName})`;
		else if (player.knows(dialog.speakerRecognitionName) && !playerCanSeeSpeaker)
			return `${dialog.speakerRecognitionName}`;
		else if (player.canSee() && !player.knows(dialog.speakerRecognitionName) && !playerCanSeeSpeaker)
			return `${dialog.speakerDisplayName}`;
		return undefined;
	}

	/**
	 * Tries to solve any voice puzzles in the given room.
	 * @param {Room} location - The room to filter the voice puzzles to.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	#solveVoicePuzzles(location, dialog) {
		for (const puzzle of this.#voicePuzzles) {
			if (puzzle.location.id === location.id) {
				for (const solution of puzzle.solutions) {
					if (dialog.cleanContent.includes(solution)) {
						const player = dialog.speaker.location.id === location.id ? dialog.speaker : undefined;
						const solveAction = new SolveAction(this.getGame(), undefined, player, location, this.forced, this.whisper);
						solveAction.performSolve(puzzle, solution);
					}
				}
			}
		}
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
			const playerCanSeeSpeaker = player.canSee() && player.member.permissionsIn(dialog.whisper.channel).has('ViewChannel');
			let webhookUsername = this.#generateWebhookUsername(dialog, player, playerCanSeeSpeaker);
			const notification = this.getGame().notificationGenerator.generateHearWhisperNotification(dialog, player);
			if (this.#playerNotificationTakesPriority(dialog, player, playerCanSeeSpeaker)) {
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
			const playerAndSpeakerAreHidingTogether = dialog.speaker.isHidden() && player.isHidden() && dialog.speaker.hidingSpot === player.hidingSpot;
			const playerCanSeeSpeaker = player.canSee() && (!dialog.speaker.hasBehaviorAttribute(`hidden`) || playerAndSpeakerAreHidingTogether);
			const webhookUsername = this.#generateWebhookUsername(dialog, player, playerCanSeeSpeaker);
			// Players with the acute hearing attribute should overhear other whispers.
			if (dialog.whisper) {
				if (player.hasBehaviorAttribute("acute hearing") && !dialog.whisper.playersCollection.has(player.name)) {
					const notification = this.getGame().notificationGenerator.generateAcuteHearingPlayerOverhearWhisperNotification(dialog, player);
					if (this.#playerNotificationTakesPriority(dialog, player, playerCanSeeSpeaker)) {
						this.getGame().communicationHandler.notifyPlayer(player, this, notification);
						continue;
					}
					this.getGame().communicationHandler.mirrorDialogInSpectateChannel(player, this, dialog, webhookUsername, notification);
				}
				continue;
			}

			const notification = this.getGame().notificationGenerator.generateHearDialogNotification(dialog, player);
			if (this.#playerNotificationTakesPriority(dialog, player, playerCanSeeSpeaker)) {
				this.getGame().communicationHandler.notifyPlayer(player, this, notification);
				continue;
			}
			if (webhookUsername || player.hasBehaviorAttribute("hear room"))
				this.getGame().communicationHandler.mirrorDialogInSpectateChannel(player, this, dialog, webhookUsername, notification);
			else this.getGame().communicationHandler.mirrorDialogInSpectateChannel(player, this, dialog);
		}
	}

	/**
	 * Communicates dialog to rooms neighboring the room it was spoken in.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	#communicateDialogToNeighboringRooms(dialog) {
		// Communicate dialog to neighboring rooms.
		for (const neighboringRoom of dialog.neighboringRooms) {
			for (const player of neighboringRoom.occupants) {
				if (this.#playerCannotReceiveCommunications(player)) continue;
				if (player.hasBehaviorAttribute("acute hearing") || dialog.isShouted && this.#playerShouldReceiveNotification(dialog, player)) {
					const notification = this.getGame().notificationGenerator.generateHearNeighboringRoomDialogNotification(dialog, player);
					this.getGame().communicationHandler.notifyPlayer(player, this, notification);
				}
			}
			if (dialog.isShouted) {
				const narration = this.getGame().notificationGenerator.generateHearNeighboringRoomDialogNotification(dialog);
				this.getGame().narrationHandler.narrateSay(this, dialog, neighboringRoom, narration);
				this.#solveVoicePuzzles(neighboringRoom, dialog);
			}
		}
		// If any neighboring rooms have the `audio surveilled` tag, the audible dialog needs to be communicated to any `audio monitoring` rooms.
		for (const neighboringAudioSurveilledRoom of dialog.neighboringAudioSurveilledRooms) {
			const neighboringRoomDisplayName = neighboringAudioSurveilledRoom.tags.has("secret") ? "Intercom" : neighboringAudioSurveilledRoom.displayName;
			for (const audioMonitoringRoom of dialog.audioMonitoringRooms) {
				for (const player of audioMonitoringRoom.occupants) {
					if (this.#playerCannotReceiveCommunications(player)) continue;
					if (this.#playerShouldReceiveNotification(dialog, player)) {
						const notification = this.getGame().notificationGenerator.generateHearAudioSurveilledNeighboringRoomDialogNotification(neighboringRoomDisplayName, dialog, player);
						this.getGame().communicationHandler.notifyPlayer(player, this, notification);
					}
				}
				const narration = this.getGame().notificationGenerator.generateHearAudioSurveilledNeighboringRoomDialogNotification(neighboringRoomDisplayName, dialog);
				this.getGame().narrationHandler.narrateSay(this, dialog, audioMonitoringRoom, narration);
				this.#solveVoicePuzzles(audioMonitoringRoom, dialog);
			}
		}
	}
}