import Game from "./Game.js";
import GameConstruct from "./GameConstruct.js";
import Player from "./Player.js";
import Room from "./Room.js";
import Whisper from "./Whisper.js";
import { randomUUID } from "crypto";

/**
 * @class Action
 * @classdesc Represents an action taken by a player.
 * @extends GameConstruct
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/action.html
 */
export default class Action extends GameConstruct {
	/**
	 * The unique ID of this action.
	 * @readonly
	 * @type {string}
	 */
	id;
	/**
	 * The type of action being performed.
	 * @readonly
	 * @type {ActionType}
	 */
	type;
	/**
	 * The message that initiated the action.
	 * @readonly
	 * @type {UserMessage}
	 */
	message;
	/**
	 * The player performing the action.
	 * @readonly
	 * @type {Player}
	 */
	player;
	/**
	 * The location where this action is being performed.
	 * @readonly
	 * @type {Room}
	 */
	location;
	/**
	 * Whether or not the action was performed by someone other than the player themselves.
	 * @readonly
	 * @type {boolean}
	 */
	forced;
	/**
	 * The whisper where this action is being performed, if applicable.
	 * @readonly
	 * @type {Whisper}
	 */
	whisper;
	/**
	 * Whether the action has already been performed. If this is true, the action cannot be performed again.
	 * @protected
	 * @type {boolean}
	 */
	performed;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 * @param {UserMessage} message - The message that initiated the action. 
	 * @param {Player} player - The player performing the action.
	 * @param {Room} location - The location where this action is being performed.
	 * @param {boolean} forced - Whether or not the action was performed by someone other than the player themselves.
	 * @param {Whisper} [whisper] - The whisper where this action is being performed, if applicable.
	 */
	constructor(game, message, player, location, forced, whisper) {
		super(game);
		this.message = message;
		this.player = player;
		this.location = location;
		this.forced = forced;
		this.whisper = whisper;
		this.id = this.#generateId();
	}

	#generateId() {
		const playerName = this.player ? this.player.name : `null`;
		const id =  randomUUID();
		return `${this.type}-${playerName}-${id}`;
	}

	/**
	 * Marks the action as performed.
	 * @protected
	 */
	perform() {
		this.performed = true;
	}
}

/**
 * @enum {string}
 */
export const ActionType = {
	Say: "say", // TODO
	Whisper: "whisper", // TODO
	Text: "text",
	Gesture: "gesture",
	QueueMove: "queueMove",
	StartMove: "startMove",
	Move: "move",
	Stop: "stop",
	Inspect: "inspect",
	Knock: "knock",
	Hide: "hide",
	Unhide: "unhide",
	Inflict: "inflict",
	Cure: "cure",
	Use: "use",
	Take: "take",
	Steal: "steal",
	Drop: "drop",
	Give: "give",
	Stash: "stash",
	Unstash: "unstash",
	Equip: "equip",
	Unequip: "unequip",
	Dress: "dress",
	Undress: "undress",
	Instantiate: "instantiate", // TODO
	Destroy: "destroy", // TODO
	Craft: "craft",
	Uncraft: "uncraft",
	Activate: "activate",
	Deactivate: "deactivate",
	Attempt: "attempt",
	Solve: "solve",
	Unsolve: "unsolve",
	Die: "die"
};