import Fixture from './Fixture.js';
import Game from './Game.js';
import InventorySlot from './InventorySlot.js';
import ItemInstance from './ItemInstance.js';
import Player from './Player.js';
import Puzzle from './Puzzle.js';
import Room from './Room.js';
import { instantiateItem, destroyItem } from '../Modules/itemManager.js';
import { addItem as addItemToDescription, removeItem as removeItemFromDescription } from '../Modules/parser.js';

/**
 * @class RoomItem
 * @classdesc Represents an item in a room that a player can take with them.
 * @extends ItemInstance
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/room_item.html
 */
export default class RoomItem extends ItemInstance {
    /**
     * The display name of the room the item can be found in.
     * @type {string}
     */
    locationDisplayName;
    /**
     * The room the item can be found in.
     * @type {Room}
     */
    location;
    /**
     * Whether the item can be interacted with.
     * @type {boolean}
     */
    accessible;
    /**
     * The item's actual container.
     * @type {Fixture|Puzzle|RoomItem}
     */
    container = null;
    /**
     * An array of {@link InventorySlot|inventory slots} the item has.
     * @type {InventorySlot<RoomItem>[]}
     */
    inventory = [];

    /**
     * @constructor
     * @param {string} prefabId - The ID of the prefab this item is an instance of.
     * @param {string} identifier - The unique identifier given to the item if it is capable of containing other items.
     * @param {string} locationDisplayName - The display name of the room the item can be found in.
     * @param {boolean} accessible - Whether the item can be interacted with.
     * @param {string} containerName - The type and identifier/name of the container the item can be found in, and the ID of the {@link InventorySlot|inventory slot} it belongs to, separated by a forward slash.
     * @param {number} quantity - How many identical instances of this item are in the given container.
     * @param {number} uses - The number of times this item can be used.
     * @param {string} description - The description of the item. Can contain multiple item lists named after its inventory slots.
     * @param {number} row - The row number of the item in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(prefabId, identifier, locationDisplayName, accessible, containerName, quantity, uses, description, row, game) {
        super(game, row, description, prefabId, identifier, containerName, quantity, uses);
        this.locationDisplayName = locationDisplayName;
        this.location = null;
        this.accessible = accessible;
        this.inventory = [];
    }

    /**
     * Sets the location.
     * @param {Room} room
     */
    setLocation(room) {
        this.location = room;
    }

    /**
     * Creates instances of all of the prefab's {@link InventorySlot|inventory slots} and inserts them into this instance's inventory.
     */
    initializeInventory() {
        for (let i = 0; i < this.prefab.inventory.length; i++) {
            /** @type {RoomItem[]} */
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
     * Decreases the number of uses this item has left. If it runs out of uses, instantiates its nextStage in its place, if it has one.
     * @param {Player} [player] - The player who used this item, if applicable.
     */
    decreaseUses(player) {
        this.uses--;
        if (this.uses === 0) {
            const nextStage = this.prefab.nextStage;
            const location = this.location;
            const container = this.container;
            const slot = this.slot;
            const quantity = this.quantity;
            let description = removeItemFromDescription(container.getDescription(), this, slot);
            container.setDescription(addItemToDescription(description, this, slot));
            destroyItem(this, this.quantity, true);
            instantiateItem(nextStage, location, container, slot, quantity, new Map(), player);
        }
    }

    /**
     * Inserts an item into the specified slot.
     * @param {RoomItem} item - The item to insert.
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
     * Removes an item from the specified slot.
     * @param {RoomItem} item - The item to remove.
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

    /** @returns {string} */
    descriptionCell() {
        return this.game.constants.roomItemSheetDescriptionColumn + this.row;
    }
}
