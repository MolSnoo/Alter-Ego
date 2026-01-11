import GameEntity from "./GameEntity.js";
import { addItem as addItemToList, removeItem as removeItemFromList } from "../Modules/parser.js";

/** @typedef {import("./Game.js").default} Game */
/** @typedef {import("./ItemInstance.js").default} ItemInstance */

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
	#setDescription(description) {
		this.description = description;
	}

	/**
	 * Adds an item to the specified item list in the container's description.
	 * @param {ItemInstance} item - The item to add.
	 * @param {string} [list] - The item list to add the item to.
	 * @param {number} [quantity] - The quantity of the item to add. If none is provided, defaults to 1.
	 */
	addItemToDescription(item, list, quantity) {
		this.#setDescription(addItemToList(this.getDescription(), item, list, quantity));
	}

	/**
	 * Removes an item from the specified item list in the container's description.
	 * @param {ItemInstance} item - The item to remove.
	 * @param {string} [list] - The item list to remove the item from.
	 * @param {number} [quantity] - The quantity of the item to remove. If none is provided, defaults to 1.
	 */
	removeItemFromDescription(item, list, quantity) {
		this.#setDescription(removeItemFromList(this.getDescription(), item, list, quantity));
	}
}