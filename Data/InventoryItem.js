const Player = require("./Player");
const Prefab = require("./Prefab");

const constants = include('Configs/constants.json');

/**
 * @class InventoryItem
 * @classdesc Represents an inventory item in a player's inventory.
 * @constructor
 * @param {Player} player - The player who owns the inventory item.
 * @param {Prefab} prefab - The prefab associated with the inventory item.
 * @param {string} identifier - The unique name given to the inventory item if it is capable of containing other inventory items.
 * @param {string} equipmentSlot - The name of the equipment slot the inventory item is equipped in.
 * @param {string} containerName - The identifier the container the inventory item is found in and the slot name it is found in seperated by a slash.
 * @param {number} quantity - The number of items the inventory item contains.
 * @param {number} uses - The number of uses the inventory item has.
 * @param {string} description - The description of the inventory item.
 * @param {number} row - The row number of the inventory item in the sheet.
 */
class InventoryItem {
    /**
     * @param {Player} player - The player who owns the inventory item.
     * @param {Prefab} prefab - The prefab associated with the inventory item.
     * @param {string} identifier - The unique name given to the inventory item if it is capable of containing other inventory items.
     * @param {string} equipmentSlot - The name of the equipment slot the inventory item is equipped in.
     * @param {string} containerName - The identifier the container the inventory item is found in and the slot name it is found in seperated by a slash.
     * @param {number} quantity - The number of items the inventory item contains.
     * @param {number} uses - The number of uses the inventory item has.
     * @param {string} description - The description of the inventory item.
     * @param {number} row - The row number of the inventory item in the sheet.
     */
    constructor(player, prefab, identifier, equipmentSlot, containerName, quantity, uses, description, row) {
        this.player = player;
        this.prefab = prefab;
        this.identifier = identifier;
        this.name = prefab ? prefab.name : "";
        this.pluralName = prefab ? prefab.pluralName : "";
        this.singleContainingPhrase = prefab ? prefab.singleContainingPhrase : "";
        this.pluralContainingPhrase = prefab ? prefab.pluralContainingPhrase : "";
        this.equipmentSlot = equipmentSlot;
        this.foundEquipmentSlot = false;
        this.containerName = containerName;
        /** @type {InventoryItem | null} */
        this.container = null;
        this.slot = "";
        this.quantity = quantity;
        this.uses = uses;
        this.weight = prefab ? prefab.weight : 0;
        /** @type {import("./Prefab").InventorySlot[]} */
        this.inventory = [];
        this.description = description;
        this.row = row;
    }

    /**
     * Inserts an item into the inventory item's inventory.
     * @param {InventoryItem} item
     * @param {string} slot
     */
    insertItem(item, slot) {
        if (item.quantity !== 0) {
            for (let i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i].name === slot) {
                    /** @type {InventoryItem | null} */
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
     * Removes an item from the inventory item's inventory.
     * @param {InventoryItem} item
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

    /** @return {string} */
    descriptionCell() {
        return constants.inventorySheetDescriptionColumn + this.row;
    }
}

module.exports = InventoryItem;
