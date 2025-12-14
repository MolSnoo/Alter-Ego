import InventoryItem from "./InventoryItem.js";
import RoomItem from "./RoomItem.js";
import ItemInstance from "./ItemInstance.js";

/**
 * @class InventorySlot
 * @classdesc Represents a slot within an item that can contain other items.
 * @template {ItemInstance|RoomItem|InventoryItem} T
 */
export default class InventorySlot {
	/**
	 * The ID of the slot. Must be unique relative to other slots held by the same item.
	 * @readonly
	 * @type {string}
	 */
	id;
	/**
	 * The name of the slot. Deprecated. Use `id` instead.
	 * @deprecated
	 * @readonly
	 * @type {string}
	 */
	name;
	/**
	 * Maximum sum of sizes that can be stored in the slot.
	 * @type {number}
	 */
	capacity;
	/**
	 * The current sum of sizes stored in the slot.
	 * @type {number}
	 */
	takenSpace;
	/**
	 * The combined weight of all items stored in the slot.
	 * @type {number}
	 */
	weight;
	/**
	 * The items stored in the slot.
	 * @type {Array<T>}
	 */
	items;
	/**
	 * The items stored in the slot. Deprecated. Use `items` instead.
	 * @deprecated
	 * @readonly
	 * @type {Array<T>}
	 */
	item;

	/**
	 * @constructor
	 * @param {string} id - The ID of the slot. Must be unique relative to other slots held by the same item.
	 * @param {number} capacity - Maximum sum of sizes that can be stored in the slot.
	 * @param {number} takenSpace - The current sum of sizes stored in the slot.
	 * @param {number} weight - The combined weight of all items stored in the slot.
	 * @param {Array<T>} items - The items stored in the slot.
	 */
	constructor(id, capacity, takenSpace, weight, items) {
		this.id = id;
		this.name = id;
		this.capacity = capacity;
		this.takenSpace = takenSpace;
		this.weight = weight;
		this.items = items;
		this.item = [];
	}
	
	/** 
	 * Inserts an item into this slot.
	 * @param {T} item - The item to insert.
	 */
	insertItem(item) {
        let matchedItem = this.items.find(inventoryItem =>
			inventoryItem.prefab !== null && item.prefab !== null &&
			inventoryItem.prefab.id === item.prefab.id &&
			inventoryItem.identifier === item.identifier &&
			inventoryItem.containerName === item.containerName &&
			inventoryItem.slot === item.slot &&
			(inventoryItem.uses === item.uses || isNaN(inventoryItem.uses) && isNaN(item.uses)) &&
			inventoryItem.description === item.description
		);
		if (!matchedItem || isNaN(matchedItem.quantity)) this.items.push(item);
		if (!isNaN(item.quantity)) {
			this.weight += item.weight * item.quantity;
			this.takenSpace += item.prefab.size * item.quantity;
			this.weight += item.weight * item.quantity;
		}
    }

	/**
	 * Removes an item from this slot.
	 * @param {T} item - The item to remove. 
	 * @param {number} removedQuantity - The quantity of this item to remove.
	 */
	removeItem(item, removedQuantity) {
		for (let i = 0; i < this.items.length; i++) {
			if (this.items[i].name === item.name && this.items[i].description === item.description) {
				if (item.quantity === 0) this.items.splice(i, 1);
				this.weight -= item.weight * removedQuantity;
				this.takenSpace -= item.prefab.size * removedQuantity;
				this.weight -= item.weight * removedQuantity;
				break;
			}
		}
	}
}