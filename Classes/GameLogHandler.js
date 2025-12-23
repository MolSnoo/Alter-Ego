import Exit from "../Data/Exit.js";
import Fixture from "../Data/Fixture.js";
import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import InventoryItem from "../Data/InventoryItem.js";
import InventorySlot from "../Data/InventorySlot.js";
import ItemInstance from "../Data/ItemInstance.js";
import Player from "../Data/Player.js";
import Puzzle from "../Data/Puzzle.js";
import Room from "../Data/Room.js";
import RoomItem from "../Data/RoomItem.js";
import { addLogMessage } from "../Modules/messageHandler.js";

/**
 * @class GameLogHandler
 * @classdesc A set of functions to send messages to the game's log channel.
 */
export default class GameLogHandler {
	/**
	 * The game this belongs to.
	 * @readonly
	 * @type {Game}
	 */
	game;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 */
	constructor(game) {
		this.game = game;
	}

	#getTime() {
		return new Date().toLocaleTimeString();
	}

	/** @param {boolean} forced */
	#getForcedString(forced) {
		return forced ? `forcibly ` : ``;
	}

	/**
	 * Sends the log message.
	 * @param {string} logText - The text of the log message. 
	 */
	#sendLogMessage(logText) {
		addLogMessage(this.game, logText);
	}

	/**
	 * Logs a gesture action.
	 * @param {Gesture} gesture - The gesture that was performed.
	 * @param {Exit|Fixture|RoomItem|Player|InventoryItem|null} target - The target of the gesture action.
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logGesture(gesture, target, player, forced) {
		let targetString = "";
		if (target instanceof ItemInstance) targetString = `to ${target.identifier ? target.identifier : target.prefab.id} `;
		else if (target instanceof Exit || target instanceof Fixture || target instanceof Player) targetString = `to ${target.name} `;
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}did gesture ${gesture.id} ${targetString}in ${player.location.channel}`)
	}

	/**
	 * Logs an inspect action.
	 * @param {Room|Fixture|RoomItem|InventoryItem|Player} target - The target of the inspect action.
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logInspect(target, player, forced) {
		let targetString = "";
		if (target instanceof Room) targetString = `the room`;
		else if (target instanceof Fixture || target instanceof Player) targetString = `${target.name}`;
		else if (target instanceof RoomItem) {
			const preposition = target.getContainerPreposition();
			const containerPhrase = target.getContainerPhrase();
			targetString = `${target.getIdentifier()} ${preposition} ${containerPhrase}`;
		}
		else if (target instanceof InventoryItem) {
			const ownerString = target.player.name === player.name ? player.originalPronouns.dpos : `${target.player.name}'s`;
			targetString = `${target.getIdentifier()} from ${ownerString} inventory`;
		}
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}inspected ${targetString} in ${player.location.channel}`);
	}

	/**
	 * Logs a knock action.
	 * @param {Exit} exit - The exit that was knocked on.
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logKnock(exit, player, forced) {
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}knocked on ${exit.name} in ${player.location.channel}`);
	}

	/**
	 * Logs a use action.
	 * @param {InventoryItem} item - The item that was used.
	 * @param {Player} player - The player who performed the action.
	 * @param {Player} target - The player the item was used on.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logUse(item, player, target, forced) {
		const forcedString = this.#getForcedString(forced);
		const itemName = item.getIdentifier();
		const targetString = player.name === target.name ? `on ${target.name} ` : ``;
		const logText = `${this.#getTime()} - ${player.name} ${forcedString}used ${itemName} from ${player.originalPronouns.dpos} inventory ${targetString}in ${player.location.channel}`;
		this.#sendLogMessage(logText);
	}

	/**
	 * Logs a take action.
	 * @param {RoomItem} item - The item that was taken.
	 * @param {Player} player - The player who performed the action.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the item was taken from.
	 * @param {InventorySlot} inventorySlot - The inventory slot the item was taken from.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logTake(item, player, container, inventorySlot, forced) {
		const containerPhrase = container instanceof RoomItem ? `${inventorySlot.id} of ${container.identifier}` : container.name;
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}took ${item.getIdentifier()} from ${containerPhrase} in ${player.location.channel}`);
	}

	/**
	 * Logs a drop action.
	 * @param {InventoryItem} item - The item that was dropped.
	 * @param {Player} player - The player who performed the action.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the item was dropped into.
	 * @param {InventorySlot} inventorySlot - The inventory slot the item was dropped into.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logDrop(item, player, container, inventorySlot, forced) {
		const preposition = container.getPreposition() ? container.getPreposition() : "in";
		const containerPhrase = container instanceof RoomItem ? `${inventorySlot.id} of ${container.identifier}` : container.name;
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}dropped ${item.getIdentifier()} ${preposition} ${containerPhrase} in ${player.location.channel}`);
	}
}