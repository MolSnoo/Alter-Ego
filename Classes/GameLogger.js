import Exit from "../Data/Exit.js";
import Fixture from "../Data/Fixture.js";
import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import InventoryItem from "../Data/InventoryItem.js";
import ItemInstance from "../Data/ItemInstance.js";
import Player from "../Data/Player.js";
import RoomItem from "../Data/RoomItem.js";
import { addLogMessage } from "../Modules/messageHandler.js";

/**
 * @class GameLogger
 * @classdesc A set of functions to send messages to the game's log channel.
 */
export default class GameLogger {
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

	/**
	 * Logs a gesture action.
	 * @param {Gesture} gesture - The gesture that was performed.
	 * @param {Exit|Fixture|RoomItem|Player|InventoryItem|null} target - The target of the gesture.
	 * @param {Player} player - The player who performed the gesture.
	 * @param {boolean} forced - Whether or not the player was forced to perform the gesture.
	 */
	logGesture(gesture, target, player, forced) {
		const time = new Date().toLocaleTimeString();
		const forcedString = forced ? `forcibly ` : ``;
		let targetString = "";
		if (target instanceof ItemInstance) targetString = `to ${target.identifier ? target.identifier : target.prefab.id} `;
		else if (target instanceof Exit || target instanceof Fixture || target instanceof Player) targetString = `to ${target.name} `;
		const logString = `${time} - ${player.name} ${forcedString}did gesture ${gesture.id} ${targetString}in ${player.location.channel}`;
		addLogMessage(this.game, logString);
	}
}