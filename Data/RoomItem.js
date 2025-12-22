import Fixture from './Fixture.js';
import Game from './Game.js';
import InventorySlot from './InventorySlot.js';
import ItemInstance from './ItemInstance.js';
import Player from './Player.js';
import Puzzle from './Puzzle.js';
import Room from './Room.js';
import { instantiateItem, destroyItem } from '../Modules/itemManager.js';
import { Collection } from 'discord.js';

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
     * An array of {@link InventorySlot|inventory slots} the item has. Deprecated. Use inventoryCollection instead.
     * @deprecated
     * @override
     * @type {InventorySlot<RoomItem>[]}
     */
    inventory = [];
    /**
     * A collection of {@link InventorySlot|inventory slots} the item has. The key is the inventory slot's ID.
     * @override
     * @type {Collection<string, InventorySlot<RoomItem>>}
     */
    inventoryCollection = new Collection();

    /**
     * @constructor
     * @param {string} prefabId - The ID of the prefab this item is an instance of.
     * @param {string} identifier - The unique identifier given to the item if it is capable of containing other items.
     * @param {string} locationDisplayName - The display name of the room the item can be found in.
     * @param {boolean} accessible - Whether the item can be interacted with.
     * @param {string} containerType - The type of the item's container. Either "Fixture", "RoomItem", or "Puzzle".
     * @param {string} containerName - The type and identifier/name of the container the item can be found in, and the ID of the {@link InventorySlot|inventory slot} it belongs to, separated by a forward slash.
     * @param {number} quantity - How many identical instances of this item are in the given container.
     * @param {number} uses - The number of times this item can be used.
     * @param {string} description - The description of the item. Can contain multiple item lists named after its inventory slots.
     * @param {number} row - The row number of the item in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(prefabId, identifier, locationDisplayName, accessible, containerType, containerName, quantity, uses, description, row, game) {
        super(game, row, description, prefabId, identifier, containerType, containerName, quantity, uses);
        this.locationDisplayName = locationDisplayName;
        this.location = null;
        this.accessible = accessible;
        this.inventory = [];
        this.inventoryCollection = new Collection();
    }

    /**
     * Sets the location.
     * @param {Room} room
     */
    setLocation(room) {
        this.location = room;
    }

    /**
     * Sets the container.
     * @param {Fixture|Puzzle|RoomItem} container
     */
    setContainer(container) {
        this.container = container;
    }

    /**
     * Creates instances of all of the prefab's {@link InventorySlot|inventory slots} and inserts them into this instance's inventory.
     */
    initializeInventory() {
        this.prefab.inventoryCollection.forEach(prefabInventorySlot => {
            /** @type {RoomItem[]} */
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
            container.removeItemFromDescription(this, slot);
            container.addItemToDescription(this, slot);
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
            const inventorySlot = this.inventoryCollection.get(slotId);
            if (inventorySlot) inventorySlot.insertItem(item);
        }
    }

    /**
     * Removes an item from the specified slot.
     * @param {RoomItem} item - The item to remove.
     * @param {string} slotId - The ID of the inventory slot to remove it from.
     * @param {number} removedQuantity - The quantity of this item to remove.
     */
    removeItem(item, slotId, removedQuantity) {
        const inventorySlot = this.inventoryCollection.get(slotId);
        if (inventorySlot) inventorySlot.removeItem(item, removedQuantity);
    }

    /**
     * Gets a phrase to refer to the container in narrations.
     */
    getContainerPhrase() {
        let containerPhrase = "";
        if (this.container instanceof Puzzle)
            containerPhrase = `the ` + this.container.parentFixture ? this.container.parentFixture.name : this.container.name;
        else if (this.container instanceof Fixture)
            containerPhrase = `the ${this.container.name}`;
        else if (this.container instanceof RoomItem)
            containerPhrase = this.container.singleContainingPhrase;
        return containerPhrase;
    }

    /**
     * Gets the preposition of the container.
     */
    getContainerPreposition() {
        let preposition = "in";
        if (this.container instanceof Puzzle)
            preposition = this.container.parentFixture ? this.container.parentFixture.preposition : "in";
        else if (this.container instanceof Fixture)
            preposition = this.container.preposition;
        else if (this.container instanceof RoomItem)
            preposition = this.container.prefab ? this.container.prefab.preposition : "in";
        return preposition;
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
        return this.getGame().constants.roomItemSheetDescriptionColumn + this.row;
    }
}
