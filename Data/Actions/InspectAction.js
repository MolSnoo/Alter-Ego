import { default as Action, ActionType } from "../Action.js";
import Fixture from "../Fixture.js";
import InventoryItem from "../InventoryItem.js";
import Player from "../Player.js";
import Room from "../Room.js";
import RoomItem from "../RoomItem.js";
import { generatePlayerListString } from "../../Modules/helpers.js";

/**
 * @class InspectAction
 * @classdesc Represents an inspect action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/inspect-action.html
 */
export default class InspectAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Inspect;

	/**
	 * Performs an inspect action.
	 * @param {Room|Fixture|RoomItem|InventoryItem|Player} target - The entity to inspect.
	 */
	performInspect(target) {
		if (this.performed) return;
		super.perform();
		this.getGame().narrationHandler.narrateInspect(target, this.player);
		let description = target.description;
		// If the player is inspecting an inventory item that belongs to another player, remove the contents of all il tags before parsing it.
		if (target instanceof InventoryItem && target.player.name !== this.player.name)
			description = description.replace(/(<(il)(\s[^>]+?)*>)[\s\S]+?(<\/\2>)/g, "$1$4");
		this.player.sendDescription(description, target);

		// If there are any players hidden in the fixture, notify them that they were found, and notify the player who found them.
		// However, don't notify anyone if the player is inspecting the fixture that they're hiding in.
		// Also ensure that the fixture isn't locked.
		if (target instanceof Fixture && !this.player.hasBehaviorAttribute("hidden") && this.player.hidingSpot !== target.name
		&&  (target.childPuzzle === null || !target.childPuzzle.type.endsWith("lock") || target.childPuzzle.solved)) {
			const hiddenPlayers = this.getGame().entityFinder.getLivingPlayers(undefined, undefined, this.player.location.id, target.name);
			for (const hiddenPlayer of hiddenPlayers)
				hiddenPlayer.notify(this.getGame().notificationGenerator.generateHiddenPlayerFoundNotification(this.player.displayName));
			const hiddenPlayersString = generatePlayerListString(hiddenPlayers);
			if (hiddenPlayersString) this.player.notify(this.getGame().notificationGenerator.generateFoundHiddenPlayersNotification(hiddenPlayersString, target.name));
		}
		this.getGame().logHandler.logInspect(target, this.player, this.forced);
	}
}