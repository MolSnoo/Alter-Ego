import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import Narration from "../Data/Narration.js";
import Player from "../Data/Player.js";
import { parseDescription } from "../Modules/parser.js";

/**
 * @class GameNarrationHandler
 * @classdesc A set of functions to send narrations.
 */
export default class GameNarrationHandler {
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
	 * Narrations a gesture action.
	 * @param {Gesture} gesture - The gesture being narrated.
	 * @param {Player} player - The player performing the gesture.
	 */
	narrateGesture(gesture, player) {
		const narration = parseDescription(gesture.narration, gesture, player);
		new Narration(this.game, player, player.location, narration).send();
	}

	/**
	 * Narrates a stop action.
	 * @param {Player} player 
	 */
	narrateStop(player) {
		const narration = `${player.displayName} stops moving.`;
		new Narration(this.game, player, player.location, narration).send();
	}
}