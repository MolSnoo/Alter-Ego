import InventorySlot from './InventorySlot.js';
import ItemInstance from './ItemInstance.js';
import { replaceInventoryItem } from '../Modules/itemManager.js';
import { Collection } from 'discord.js';
^
/** @typedef {import("./Game.js").default} Game */
/** @typedef {import("./Player.js").default} Player */

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
     * An array of {@link InventorySlot|inventory slots} the item has. Deprecated. Use inventoryCollection instead.
     * @deprecated
     * @override
     * @type {InventorySlot<InventoryItem>[]}
     */
    inventory = [];
    /**
     * A collection of {@link InventorySlot|inventory slots} the item has. The key is the inventory slot's ID.
     * @override
     * @type {Collection<string, InventorySlot<InventoryItem>>}
     */
    inventoryCollection = new Collection();

    /**
     * @constructor
     * @param {string} playerName - The name of the player who has this inventory item.
     * @param {string} prefabId - The ID of the prefab this inventory item is an instance of.
     * @param {string} identifier - The unique identifier given to the inventory item if it is capable of containing other inventory items.
     * @param {string} equipmentSlot - The ID of the equipment slot the inventory item or its top-level container is equipped to.
     * @param {string} containerType - The type of the item's container. The only acceptable option is "InventoryItem" or an empty string.
     * @param {string} containerName - The identifier of the container the inventory item can be found in, and the ID of the {@link InventorySlot|inventory slot} it belongs to, separated by a forward slash.
     * @param {number} quantity - How many identical instances of this inventory item are in the given container.
     * @param {number} uses - The number of times this inventory item can be used.
     * @param {string} description - The description of the inventory item. Can contain multiple item lists named after its inventory slots.
     * @param {number} row - The row number of the inventory inventory item in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(playerName, prefabId, identifier, equipmentSlot, containerType, containerName, quantity, uses, description, row, game) {
        super(game, row, description, prefabId, identifier, containerType, containerName, quantity, uses);
        this.playerName = playerName;
        this.equipmentSlot = equipmentSlot;
        this.foundEquipmentSlot = false;
        this.inventory = [];
        this.inventoryCollection = new Collection();
^    }
^
    /**
     * Sets the player.
     * @param {Player} player 
     */
    setPlayer(player) {
        this.player = player;
    }

    /**
     * Sets the container.
     * @param {InventoryItem} container
     */
    setContainer(container) {
        this.container = container;
    }

    /**
     * Creates instances of all of the prefab's {@link InventorySlot|inventory slots} and inserts them into this instance's inventory.
     */
    initializeInventory() {
        this.prefab.inventoryCollection.forEach(prefabInventorySlot => {
            /** @type {InventoryItem[]} */
            const items = [];
            const inventorySlot = new InventorySlot(
                prefabInventorySlot.id,
                prefabInventorySlot.capacity,
                prefabInventorySlot.takenSpace,
                prefabInventorySlot.weight,
                items
            );
            this.inventoryCollection.set(inventorySlot.id, inventorySlot);
        });
    }

    /**
     * Decreases the number of uses this inventory item has left. If it runs out of uses, instantiates its nextStage in its place, if it has one.
     * @override
     */
    decreaseUses() {
        this.uses--;
        if (this.uses === 0) {
            const nextStage = this.prefab.nextStage;
            const container = this.container !== null ? this.container : this.player;
            const slot = this.container !== null ? this.slot :
                this.equipmentSlot === "RIGHT HAND" || this.equipmentSlot === "LEFT HAND" ? "hands" : "equipment";
            if (nextStage && !this.prefab.discreet)
                container.removeItemFromDescription(this, slot);
            replaceInventoryItem(this, nextStage);
            if (nextStage && !nextStage.discreet)
                container.addItemToDescription(this, slot);
        }
    }

    /**
     * Inserts an inventory item into the specified slot.
     * @param {InventoryItem} item - The item to insert.
     * @param {string} slotId - The ID of the inventory slot to insert it in.
     */
    insertItem(item, slotId) {
        if (item.quantity !== 0) {
            const inventorySlot = this.inventoryCollection.get(slotId);
            if (inventorySlot) inventorySlot.insertItem(item);
        }
    }

    /**
     * Removes an inventory item from the specified slot.
     * @param {InventoryItem} item - The item to remove.
     * @param {string} slotId - The ID of the inventory slot to remove it from.
     * @param {number} removedQuantity - The quantity of this item to remove.
     */
    removeItem(item, slotId, removedQuantity) {
        const inventorySlot = this.inventoryCollection.get(slotId);
        if (inventorySlot) inventorySlot.removeItem(item, removedQuantity);
    }

    /**
     * Returns true if the item is usable on the given player.
     * @param {Player} player 
     */
    usableOn(player) {
        let canEffect = false, canCure = false;
		for (const effect of this.prefab.effects) {
			if (!player.hasStatus(effect.id) || effect.duplicatedStatus !== null)
                canEffect = true;
		}
		for (const cure of this.prefab.cures) {
			if (player.hasStatus(cure.id))
                canCure = true;
		}
        if (!canEffect && !canCure) return false;
        return true;
    }

    /**
     * Sets the description.
     * @param {string} description - The description to set.
     */
    setDescription(description) {
        this.description = description;
    }

    /** @returns {string} */
^    descriptionCell() {
        return this.getGame().constants.inventorySheetDescriptionColumn + this.row;
^    }
^}
