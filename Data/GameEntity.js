import GameConstruct from "./GameConstruct.js";

/** @typedef {import("./Game.js").default} Game */

/**
 * @class GameEntity
 * @classdesc Represents an in-game entity on the spreadsheet. Used as a base class for all other in-game entities.
 * @extends GameConstruct
 */
export default class GameEntity extends GameConstruct {
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
		super(game);
		this.row = row;
	}
}