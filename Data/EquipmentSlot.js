import GameEntity from "./GameEntity.js";
import InventoryItem from "./InventoryItem.js";

/** @typedef {import("./Game.js").default} Game */

/**
 * @class EquipmentSlot
 * @classdesc Represents a part of a player's body that they can equip inventory items to.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/equipment_slot.html
 */
export default class EquipmentSlot extends GameEntity {
    /**
     * The ID of this equipment slot. Must be unique only within the context of a single player.
     * @readonly
     * @type {string}
     */
    id;
    /**
     * The name of this equipment slot. Deprecated. Use `id` instead.
     * @deprecated
     * @readonly
     * @type {string}
     */
    name;
    /**
     * The inventory item currently equipped to this equipment slot. If nothing is equipped, this is `null`.
     * @type {InventoryItem | null}
     */
    equippedItem;
    /**
     * An array of inventory items within this equipment slot.
     * This includes the equippedItem, as well as any inventory items whose top-level parent is the equippedItem.
     * @type {InventoryItem[]}
     */
    items;

    /**
     * @constructor
     * @param {string} id - The ID of the equipment slot.
     * @param {number} row - The row number of the equipment slot in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(id, row, game) {
        super(game, row);
        this.id = id;
        this.name = id;
        this.equippedItem = null;
        this.items = [];
    }

    /**
     * Equips the given item and inserts it into the equipment slot's items list.
     * The previously equipped item will be replaced with the new equipped item in the game's list of inventory items.
     * @param {InventoryItem} item - The inventory item to equip. 
     */
    equipItem(item) {
        this.equippedItem = item.prefab !== null ? item : null;
        this.items.length = 0;
        this.insertItem(item);
        this.#replaceInventoryItemEntry(item);
    }

    /**
     * Unequips the given item and replaces it with a null inventory item that will be inserted into the equipment slot's items list.
     * The previously equipped item will be replaced with the null inventory item in the game's list of inventory items.
     * @param {InventoryItem} item - The inventory item to unequip. 
     */
    unequipItem(item) {
        const nullItem = new InventoryItem(
            item.player.name,
            "",
            "",
            this.id,
            "",
            "",
            null,
            null,
            "",
            this.row,
            this.getGame()
        );
        nullItem.setPlayer(item.player);
        this.equippedItem = null;
        this.items.length = 0;
        this.insertItem(nullItem);
        this.#replaceInventoryItemEntry(nullItem);
    }

    /**
     * Replace the previously equipped item in the game's list of inventory items with the new equipped item.
     * @param {InventoryItem} item - The newly equipped item.
     */
    #replaceInventoryItemEntry(item) {
        for (let i = 0; i < this.getGame().inventoryItems.length; i++) {
            if (this.getGame().inventoryItems[i].row === item.row) {
                this.getGame().inventoryItems.splice(i, 1, item);
                break;
            }
        }
    }

    /**
     * Inserts an inventory item into the equipment slot's list of items.
     * @param {InventoryItem} item - The inventory item to insert. 
     */
    insertItem(item) {
        if (item.quantity !== 0) {
            this.items.push(item);
        }
    }

    /**
     * Removes an inventory item from the equipment slot's list of items.
     * @param {InventoryItem} item - The inventory item to remove. 
     */
    removeItem(item) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].row === item.row) {
                this.items.splice(i, 1);
                break;
            }
        };
    }
}
