import { default as Action, ActionType } from "../Action.js";
import Game from "../Game.js";
import Room from "../Room.js";
import MoveAction from "./MoveAction.js";
import StartMoveAction from "./StartMoveAction.js";

/** @typedef {import("../Exit.js").default} Exit */

/**
 * @class QueueMoveAction
 * @classdesc Represents a queue move action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/queue-move-action.html
 */
export default class QueueMoveAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.QueueMove;

	/**
	 * Performs a queue move action.
	 * @param {boolean} isRunning - Whether the player is running.
     * @param {string} destinationString - The destination the user supplied.
	 */
	performQueueMove(isRunning, destinationString) {
		if (this.performed) return;
		super.perform();
		const currentRoom = this.player.location;
        /** @type {Exit} */
        let exit = null;
        /** @type {Room} */
        let destinationRoom = null;
        /** @type {Exit} */
        let entrance = null;

		// If the player has the free movement role, they can move to any room they please.
        if (this.player.member.roles.cache.has(this.getGame().guildContext.freeMovementRole.id))
            destinationRoom = this.getGame().entityFinder.getRoom(destinationString);
		// Otherwise, check that the desired room is adjacent to the current room.
		else {
			const exitName = Game.generateValidEntityName(destinationString);
			exit = currentRoom.exitCollection.get(exitName);
			if (!exit) {
				const destRoomId = Room.generateValidId(destinationString);
				for (const targetExit of currentRoom.exitCollection.values()) {
					if (targetExit.dest.id === destRoomId) {
						exit = targetExit;
						break;
					}
				}
			}
			if (exit) {
				destinationRoom = exit.dest;
				entrance = destinationRoom.exitCollection.get(exit.link);
			}
		}
		if (!destinationRoom) {
			this.player.moveQueue.length = 0;
			return this.player.notify(`There is no exit "${destinationString}" that you can currently move to. Please try the name of an exit in the room you're in or the name of the room you want to go to.`, false);
		}

		if (exit) {
			const startMoveAction = new StartMoveAction(this.getGame(), this.message, this.player, this.player.location, this.forced);
			startMoveAction.performStartMove(isRunning, currentRoom, destinationRoom, exit, entrance);
		}
		else {
			const moveAction = new MoveAction(this.getGame(), this.message, this.player, this.player.location, this.forced);
			moveAction.performMove(isRunning, currentRoom, destinationRoom, exit, entrance);
		}
	}
}