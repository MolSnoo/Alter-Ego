import Game from "../Data/Game.js";

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
}