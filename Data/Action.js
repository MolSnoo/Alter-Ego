import Game from "./Game.js";
import Player from "./Player.js";
import Room from "./Room.js";
import Whisper from "./Whisper.js";

/**
 * @class Action
 * @classdesc Represents an action taken by a player.
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/action.html
 */
export default class Action {
	/**
	 * The game this belongs to.
	 * @readonly
	 * @type {Game}
	 */
	game;
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
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 * @param {ActionType} type - The type of action being performed.
	 * @param {UserMessage} message - The message that initiated the action. 
	 * @param {Player} player - The player performing the action.
	 * @param {Room} location - The location where this action is being performed.
	 * @param {boolean} forced - Whether or not the action was performed by someone other than the player themselves.
	 * @param {Whisper} [whisper] - The whisper where this action is being performed, if applicable.
	 */
	constructor(game, type, message, player, location, forced, whisper) {
		this.game = game;
		this.type = type;
		this.message = message;
		this.player = player;
		this.location = location;
		this.forced = forced;
		this.whisper = whisper;
		this.id = this.#generateId();
	}

	#generateId() {
		return `${this.player}-${this.type}-${this.message.id}`;
	}
}