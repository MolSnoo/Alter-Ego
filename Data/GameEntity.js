import Game from "./Game.js";

/**
 * @class GameEntity
 * @classdesc Represents an in-game entity on the spreadsheet. Used as a base class for all other in-game entities.
 */
export default class GameEntity {
	/**
	 * The game this entity belongs to.
	 * @readonly
	 * @type {Game}
	 */
	#game;
	/**
	 * The row number of this entity on the spreadsheet.
	 * @type {number}
	 */
	row;

	/**
	 * @constructor
	 * @param {Game} game - The game this entity belongs to. 
	 * @param {number} row - The row number of this entity on the spreadsheet.
	 */
	constructor(game, row) {
		this.#game = game;
		this.row = row;
	}

	getGame() {
		return this.#game;
	}
}