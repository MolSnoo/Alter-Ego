import { default as Action, ActionType } from "../Action.js";
import Fixture from "../Fixture.js";
import InventoryItem from "../InventoryItem.js";

/** @typedef {import("../Player.js").default} Player */
/** @typedef {import("../Room.js").default} Room */
/** @typedef {import("../RoomItem.js").default} RoomItem */

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
		this.getGame().logHandler.logInspect(target, this.player, this.forced);
	}
}