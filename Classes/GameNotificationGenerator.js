import Game from "../Data/Game.js";

/**
 * @class GameNotificationGenerator
 * @classdesc A set of functions to generate notification messages to send to players.
 */
export default class GameNotificationGenerator {
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