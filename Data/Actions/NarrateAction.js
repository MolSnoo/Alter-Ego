import Action from "../Action.js";
import Narration from "../Narration.js";
import UnhideAction from "./UnhideAction.js";
import { ChannelType } from "discord.js";

/** @typedef {import("../Player.js").default} Player */

/**
 * @class NarrateAction
 * @classdesc Represents a narrate action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/narrate-action.html
 */
export default class NarrateAction extends Action {
	/**
	 * Performs a narrate action.
	 * @param {Narration} narration - The narration to narrate.
	 */
	performNarrate(narration) {
		if (this.performed) return;
		super.perform();
		this.#communicateNarrationToLocation(narration);
		this.#communicateNarrationToWhisper(narration);
		this.#communicateNarrationToVideoMonitoringRooms(narration);
	}

	/**
	 * Returns true if the given player is unable to receive communications.
	 * @param {Player} player
	 */
	#playerCannotReceiveCommunications(player) {
		return player.isNPC || !player.canSee() || !player.isConscious();
	}

	/**
	 * Returns true if a player should be notified of the narration.
	 * @param {Narration} narration - The narration to be communicated.
	 * @param {Player} player - The player hearing the dialog.
	 */
	#playerShouldReceiveNotification(narration, player) {
		return player.hasBehaviorAttribute("see room")
			|| narration.message && narration.message.channel.type === ChannelType.GuildText && !player.member.permissionsIn(narration.message.channel).has('ViewChannel');
	}

	/**
	 * Sends the narration to the player's spectate channel as a webhook.
	 * @param {Player} player - The player whose spectate channel the narration is to be mirrored in.
	 * @param {Narration} narration - The narration to send.
	 * @param {string} [narratorDisplayName] - The custom display name of the narrator to use for the webhook. Defaults to the narration's narrator display name.
	 * @param {string} [narratorDisplayIcon] - The custom avatar URL of the narrator to use for the webhook. Defaults to the narration's narrator display icon.
	 * @param {string} [narrationText] - The custom text of the narration to send. Optional.
	 */
	#mirrorMessageNarrationInSpectateChannel(player, narration, narratorDisplayName = narration.narratorDisplayName, narratorDisplayIcon = narration.narratorDisplayIcon, narrationText = narration.content) {
		this.getGame().communicationHandler.mirrorNarrationInSpectateChannel(player, narration.action, narration, narratorDisplayName, narratorDisplayIcon, narrationText);
	}

	/**
	 * Communicates the narration to players.
	 * @param {Narration} narration - The narration to be communicated.
	 * @param {Player[]} players - The players to communicate the narration to.
	 * @param {string} [narratorDisplayName] - The custom display name of the narrator to use for the webhook, if the narration was created by a narrator.
	 * @param {string} [narratorDisplayIcon] - The custom avatar URL of the narrator to use for the webhook, if the narration was created by a narrator.
	 * @param {string} [narrationText] - The custom text of the narration to send. Optional.
	 */
	#communicateNarrationToPlayers(narration, players, narratorDisplayName, narratorDisplayIcon, narrationText) {
		for (const player of players) {
			if (narration.player.name === player.name) continue;
			if (this.#playerCannotReceiveCommunications(player)) continue;
			if (this.#playerShouldReceiveNotification(narration, player))
				this.getGame().communicationHandler.notifyPlayer(player, narration.action, narration.content, false);
			if (narration.narrator) this.#mirrorMessageNarrationInSpectateChannel(player, narration, narratorDisplayName, narratorDisplayIcon, narrationText);
		}
	}

	/**
	 * Communicates the narration to its location.
	 * @param {Narration} narration - The narration to be communicated.
	 */
	#communicateNarrationToLocation(narration) {
		if (narration.player && narration.player.isHidden() && !(narration.action instanceof UnhideAction)) return;
		this.#communicateNarrationToPlayers(narration, narration.location.occupants);
		if (!narration.narrator) this.getGame().communicationHandler.narrateInRoom(narration);
	}

	/**
	 * Communicates the narration to a whisper.
	 * @param {Narration} narration - The narration to be communicated.
	 */
	#communicateNarrationToWhisper(narration) {
		if (!narration.whisper) return;
		this.#communicateNarrationToPlayers(narration, narration.whisper.playersCollection.map(player => player));
		if (!narration.narrator) this.getGame().communicationHandler.narrateInWhisper(narration.whisper, narration.action, narration.content);
	}

	/**
	 * Communicates the narration in rooms with the `video monitoring` tag.
	 * @param {Narration} narration - The narration to be communicated.
	 */
	#communicateNarrationToVideoMonitoringRooms(narration) {
		if (!narration.locationIsVideoSurveilled) return;
		const roomDisplayName = narration.location.getSurveilledDisplayName();
		const prefix = narration.narrator ? `` : `[${roomDisplayName}] `;
		const narrationText = `\`${prefix}${narration.content}\``;
		for (const videoMonitoringRoom of narration.videoMonitoringRooms) {
			this.#communicateNarrationToPlayers(narration, videoMonitoringRoom.occupants, `[${roomDisplayName}] ${narration.narratorDisplayName}`, narration.narratorDisplayIcon, narrationText);
			if (!narration.narrator) this.getGame().communicationHandler.narrateInRoom(narration, narrationText);
		}
	}
}