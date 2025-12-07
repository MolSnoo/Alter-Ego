import Game from "./Game.js";
import InventorySlot from "./InventorySlot.js";
import ItemContainer from "./ItemContainer.js";
import Prefab from "./Prefab.js";

/**
 * @class ItemInstance
 * @classdesc Represents an instance of a prefab that actually exists in the game.
 * @extends ItemContainer
 */
export default class ItemInstance extends ItemContainer {
	/**
	 * The ID of the prefab this item is an instance of.
	 * @readonly
	 * @type {string}
	 */
	prefabId;
	/**
	 * The prefab this item is an instance of.
	 * @type {Prefab}
	 */
	prefab;
	/**
	 * The unique identifier given to the item if it is capable of containing other items.
	 * @readonly
	 * @type {string}
	 */
	identifier;
	/**
	 * The name of the prefab.
	 * @type {string}
	 */
	name;
	/**
	 * The pluralName of the prefab.
	 * @type {string}
	 */
	pluralName;
	/**
	 * The singleContainingPhrase of the prefab.
	 * @type {string}
	 */
	singleContainingPhrase;
	/**
	 * The pluralContainingPhrase of the prefab.
	 * @type {string}
	 */
	pluralContainingPhrase;
	/**
	 * The identifier of the container the item can be found in, and the ID of the {@link InventorySlot|inventory slot} it belongs to, separated by a forward slash.
	 * @type {string}
	 */
	containerName;
	/**
	 * The ID of the {@link InventorySlot|inventory slot} the item can be found in.
	 * @type {string}
	 */
	slot;
	/**
	 * How many identical instances of this item are in the given container.
	 * @type {number}
	 */
	quantity;
	/**
	 * The number of times this item can be used.
	 * @type {number}
	 */
	uses;
	/**
	 * The total weight in kilograms of this item, including all of the child items it contains.
	 * @type {number}
	 */
	weight;
	/**
	 * An array of {@link InventorySlot|inventory slots} the item has.
	 * @type {InventorySlot<ItemInstance>[]}
	 */
	inventory;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 * @param {number} row - The row number of the item in the sheet.
	 * @param {string} description - The description of the item. Can contain multiple item lists named after its inventory slots.
	 * @param {string} prefabId - The ID of the prefab this item is an instance of.
	 * @param {string} identifier - The unique identifier given to the item if it is capable of containing other items.
	 * @param {string} containerName - The identifier of the container the item can be found in, and the ID of the {@link InventorySlot|inventory slot} it belongs to, separated by a forward slash.
	 * @param {number} quantity - How many identical instances of this item are in the given container.
	 * @param {number} uses - The number of times this item can be used.
	 */
	constructor(game, row, description, prefabId, identifier, containerName, quantity, uses) {
		super(game, row, description);
		this.prefabId = prefabId;
		this.identifier = identifier;
		this.containerName = containerName;
		this.slot = "";
		this.quantity = quantity;
		this.uses = uses;
		this.inventory = [];
	}

	/**
	 * @param {Prefab} prefab 
	 */
	setPrefab(prefab) {
		this.prefab = prefab;
		this.name = prefab.name ? prefab.name : "";
        this.pluralName = prefab.pluralName ? prefab.pluralName : "";
        this.singleContainingPhrase = prefab.singleContainingPhrase ? prefab.singleContainingPhrase : "";
        this.pluralContainingPhrase = prefab.pluralContainingPhrase ? prefab.pluralContainingPhrase : "";
		this.weight = prefab ? prefab.weight: 0;
	}
}