const constants = require('../Configs/constants.json');
const Object = require("./Object");
const Room = require("./Room");
const Prefab = require("./Prefab");
const Puzzle = require("./Puzzle");

/**
 * @class Item
 * @classdesc Represents an item in the game world.
 * @constructor
 * @param {Prefab} prefab - The prefab associated with the item.
 * @param {string} identifier - The unique name given to the item if it is capable of containing other items.
 * @param {Room} location - The location the item is found in.
 * @param {boolean} accessible - Whether the item can be interacted with.
 * @param {string} containerName - The identifier the container the item is found in and the slot name it is found in seperated by a slash.
 * @param {number} quantity - The number of items the container contains.
 * @param {number} uses - The number of uses the item has.
 * @param {string} description - The description of the item.
 * @param {number} row - The row number of the item in the sheet.
 */
class Item {
    /**
     * @param {Prefab} prefab - The prefab associated with the item.
     * @param {string} identifier - The unique name given to the item if it is capable of containing other items.
     * @param {Room} location - The location the item is found in.
     * @param {boolean} accessible - Whether the item can be interacted with.
     * @param {string} containerName - The identifier the container the item is found in and the slot name it is found in seperated by a slash.
     * @param {number} quantity - The number of items the container contains.
     * @param {number} uses - The number of uses the item has.
     * @param {string} description - The description of the item.
     * @param {number} row - The row number of the item in the sheet.
     */
    constructor(prefab, identifier, location, accessible, containerName, quantity, uses, description, row) {
        this.prefab = prefab;
        this.identifier = identifier;
        this.name = prefab.name ? prefab.name : "";
        this.pluralName = prefab.pluralName ? prefab.pluralName : "";
        this.singleContainingPhrase = prefab.singleContainingPhrase ? prefab.singleContainingPhrase : "";
        this.pluralContainingPhrase = prefab.pluralContainingPhrase ? prefab.pluralContainingPhrase : "";
        this.location = location;
        this.accessible = accessible;
        this.containerName = containerName;
        /** @type {Object | Puzzle | Item | null} */
        this.container = null;
        this.slot = "";
        this.quantity = quantity;
        this.uses = uses;
        this.weight = prefab ? prefab.weight : 0;
        /** @type {InventorySlot[]} */
        this.inventory = [];
        this.description = description;
        this.row = row;
    }

    /**
     * Inserts an item into the item's inventory.
     * @param {Item} item
     * @param {string} slot
     */
    insertItem(item, slot) {
        if (item.quantity !== 0) {
            for (let i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i].name === slot) {
                    let matchedItem = this.inventory[i].item.find(inventoryItem =>
                        inventoryItem.prefab !== null && item.prefab !== null &&
                        inventoryItem.prefab.id === item.prefab.id &&
                        inventoryItem.identifier === item.identifier &&
                        inventoryItem.containerName === item.containerName &&
                        inventoryItem.slot === item.slot &&
                        (inventoryItem.uses === item.uses || isNaN(inventoryItem.uses) && isNaN(item.uses)) &&
                        inventoryItem.description === item.description
                    );
                    if (!matchedItem || isNaN(matchedItem.quantity)) this.inventory[i].item.push(item);
                    if (!isNaN(item.quantity)) {
                        this.inventory[i].weight += item.weight * item.quantity;
                        this.inventory[i].takenSpace += item.prefab.size * item.quantity;
                        this.weight += item.weight * item.quantity;
                    }
                }
            }
        }
    }

    /**
     * Removes an item from the item's inventory.
     * @param {Item} item
     * @param {string} slot
     * @param {number} removedQuantity
     */
    removeItem(item, slot, removedQuantity) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].name === slot) {
                for (let j = 0; j < this.inventory[i].item.length; j++) {
                    if (this.inventory[i].item[j].name === item.name && this.inventory[i].item[j].description === item.description) {
                        if (item.quantity === 0) this.inventory[i].item.splice(j, 1);
                        this.inventory[i].weight -= item.weight * removedQuantity;
                        this.inventory[i].takenSpace -= item.prefab.size * removedQuantity;
                        this.weight -= item.weight * removedQuantity;
                        break;
                    }
                }
            }
        }
    }

    /**
     * Sets the item as accessible.
     */
    setAccessible() {
        this.accessible = true;
    }

    /**
     * Sets the item as inaccessible.
     */
    setInaccessible() {
        this.accessible = false;
    }

    /** @return {string} */
    descriptionCell() {
        return constants.itemSheetDescriptionColumn + this.row;
    }
}

module.exports = Item;
