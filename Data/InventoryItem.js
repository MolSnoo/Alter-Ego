import Game from './Game.js';
import InventorySlot from './InventorySlot.js';
import ItemInstance from './ItemInstance.js';
import Player from './Player.js';
import { replaceInventoryItem } from '../Modules/itemManager.js';
import { addItem as addItemToDescription, removeItem as removeItemFromDescription } from '../Modules/parser.js';

/**
 * @class InventoryItem
 * @classdesc Represents an item that is currently possessed by a player.
 * @extends ItemInstance
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/inventory_item.html
 */
export default class InventoryItem extends ItemInstance {
    /**
     * The name of the player who has this inventory item.
     * @type {string}
     */
    playerName;
    /**
     * The player who has this inventory item.
     * @type {Player}
     */
    player;
    /**
     * The ID of the equipment slot the inventory item or its top-level container is equipped to.
     * @type {string}
     */
    equipmentSlot;
    /**
     * Whether the equipment slot was found.
     * @type {boolean}
     */
    foundEquipmentSlot;
    /**
     * The inventory item's actual container.
     * @type {InventoryItem}
     */
    container = null;
    /**
     * An array of {@link InventorySlot|inventory slots} the item has.
     * @override
     * @type {InventorySlot<InventoryItem>[]}
     */
    inventory = [];

    /**
     * @constructor
     * @param {string} playerName - The name of the player who has this inventory item.
     * @param {string} prefabId - The ID of the prefab this inventory item is an instance of.
     * @param {string} identifier - The unique identifier given to the inventory item if it is capable of containing other inventory items.
     * @param {string} equipmentSlot - The ID of the equipment slot the inventory item or its top-level container is equipped to.
     * @param {string} containerName - The identifier of the container the inventory item can be found in, and the ID of the {@link InventorySlot|inventory slot} it belongs to, separated by a forward slash.
     * @param {number} quantity - How many identical instances of this inventory item are in the given container.
     * @param {number} uses - The number of times this inventory item can be used.
     * @param {string} description - The description of the inventory item. Can contain multiple item lists named after its inventory slots.
     * @param {number} row - The row number of the inventory inventory item in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(playerName, prefabId, identifier, equipmentSlot, containerName, quantity, uses, description, row, game) {
        super(game, row, description, prefabId, identifier, containerName, quantity, uses);
        this.playerName = playerName;
        this.equipmentSlot = equipmentSlot;
        this.foundEquipmentSlot = false;
        this.inventory = [];
    }

    /**
     * Creates instances of all of the prefab's {@link InventorySlot|inventory slots} and inserts them into this instance's inventory.
     */
    initializeInventory() {
        for (let i = 0; i < this.prefab.inventory.length; i++) {
            /** @type {InventoryItem[]} */
            const items = [];
            this.inventory.push(
                new InventorySlot(
                    this.prefab.inventory[i].id,
                    this.prefab.inventory[i].capacity,
                    this.prefab.inventory[i].takenSpace,
                    this.prefab.inventory[i].weight,
                    items
                )
            );
        }
    }

    /**
     * Decreases the number of uses this inventory item has left. If it runs out of uses, instantiates its nextStage in its place, if it has one.
     */
    decreaseUses() {
        this.uses--;
        if (this.uses === 0) {
            const nextStage = this.prefab.nextStage;
            const container = this.container !== null ? this.container : this.player;
            const slot = this.container !== null ? this.slot :
                this.equipmentSlot === "RIGHT HAND" || this.equipmentSlot === "LEFT HAND" ? "hands" : "equipment";
            if (nextStage && !this.prefab.discreet)
                container.setDescription(removeItemFromDescription(container.getDescription(), this, slot));
            replaceInventoryItem(this, nextStage);
            if (nextStage && !nextStage.discreet)
                container.setDescription(addItemToDescription(container.getDescription(), this, slot));
        }
    }

    /**
     * Inserts an inventory item into the specified slot.
     * @param {InventoryItem} item - The item to insert.
     * @param {string} slotId - The ID of the inventory slot to insert it in.
     */
    insertItem(item, slotId) {
        if (item.quantity !== 0) {
            for (let i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i].id === slotId) {
                    this.inventory[i].insertItem(item);
                }
            }
        }
    }

    /**
     * Removes an inventory item from the specified slot.
     * @param {InventoryItem} item - The item to remove.
     * @param {string} slotId - The ID of the inventory slot to remove it from.
     * @param {number} removedQuantity - The quantity of this item to remove.
     */
    removeItem(item, slotId, removedQuantity) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].id === slotId) {
                this.inventory[i].removeItem(item, removedQuantity);
            }
        }
    }

    /** @returns {string} */
    descriptionCell() {
        return this.game.constants.inventorySheetDescriptionColumn + this.row;
    }
}
