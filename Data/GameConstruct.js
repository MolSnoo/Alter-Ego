/** @typedef {import("./Game.js").default} Game */

/**
 * @class GameConstruct
 * @classdesc Represents a construct that belongs to a game. Used as a base class for all other in-game constructs.
 */
export default class GameConstruct {
	/**
	 * The game this construct belongs to.
	 * @readonly
	 * @type {Game}
	 */
	#game;

	/**
	 * @constructor
	 * @param {Game} game - The game this construct belongs to.
	 */
	constructor(game) {
		this.#game = game;
	}

	getGame() {
		return this.#game;
	}
}