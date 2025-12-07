import Game from "./Game.js";
import GameEntity from "./GameEntity.js";

/**
 * @class ItemContainer
 * @classdesc Represents a game entity that can contain items.
 * @extends GameEntity
 */
export default class ItemContainer extends GameEntity {
	/**
	 * A description which can contain at least one item list.
	 * @type {string}
	 */
	description;

	/**
	 * @constructor
	 * @param {Game} game - The game this entity belongs to. 
	 * @param {number} row - The row number of this entity on the spreadsheet.
	 * @param {string} description - A description which can contain at least one item list.
	 */
	constructor(game, row, description) {
		super(game, row);
		this.description = description;
	}

	/**
	 * Gets this entity's description which can contain an item list.
	 * @return {string}
	 */
	getDescription() {
		return this.description;
	}

	/**
	 * Sets the entity's description which can contain an item list.
	 * @param {string} description - The new description.
	 */
	setDescription(description) {
		this.description = description;
	}
}