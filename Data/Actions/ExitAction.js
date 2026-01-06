import { default as Action, ActionType } from "../Action.js";

/** @typedef {import("../Exit.js").default} Exit */
/** @typedef {import("../Room.js").default} Room */

/**
 * @class ExitAction
 * @classdesc Represents an exit action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/exit-action.html
 */
export default class ExitAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Exit;

	/**
	 * Performs an exit action.
	 * @param {Room} currentRoom - The room the player is currently in.
	 * @param {Exit} exit - The exit the player will leave their current room through.
	 */
	performExit(currentRoom, exit) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateExit(this, currentRoom, exit, this.player);
		currentRoom.removePlayer(this.player);
		const whisperRemovalMessage = this.getGame().notificationGenerator.generateExitLeaveWhisperNotification(this.player.displayName);
		this.player.removeFromWhispers(whisperRemovalMessage, this);
	}
}