import Exit from "./Exit.js";
import Fixture from "./Fixture.js";
import Game from "./Game.js";
import Gesture from "./Gesture.js";
import InventoryItem from "./InventoryItem.js";
import Narration from "./Narration.js";
import Player from "./Player.js";
import Room from "./Room.js";
import RoomItem from "./RoomItem.js";
import Whisper from "./Whisper.js";
import { parseDescription } from "../Modules/parser.js";
import { addDirectNarrationWithAttachments } from "../Modules/messageHandler.js";

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

	/**
	 * Performs a text action.
	 * @param {Player} recipient - The player who will receive the text.
	 * @param {string} messageText - The text content of the text message.
	 */
	performText(recipient, messageText) {
		const senderText = this.game.notificationGenerator.generateTextNotification(messageText, this.player.name, recipient.name);
		const recipientText = this.game.notificationGenerator.generateTextNotification(messageText, this.player.name);
		addDirectNarrationWithAttachments(this.player, senderText, this.message.attachments);
		addDirectNarrationWithAttachments(recipient, recipientText, this.message.attachments);
	}

	/**
	 * Performs a gesture action.
	 * @param {Gesture} gesture - The gesture to perform.
	 * @param {string} targetType - The type of entity to target.
	 * @param {Exit|Fixture|RoomItem|Player|InventoryItem|null} target - The entity to target.
	 */
	performGesture(gesture, targetType, target) {
		let newGesture = new Gesture(gesture.id, [...gesture.requires], [...gesture.disabledStatusesStrings], gesture.description, gesture.narration, gesture.row, this.game);
		newGesture.targetType = targetType;
		newGesture.target = target;
		this.game.narrationHandler.narrateGesture(newGesture, this.player);
		this.game.logger.logGesture(gesture, target, this.player, this.forced);
	}

	/**
	 * Performs a stop action.
	 */
	performStop() {
		this.player.stopMoving();
		this.game.narrationHandler.narrateStop(this.player);
	}
}