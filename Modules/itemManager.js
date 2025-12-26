import EquipmentSlot from '../Data/EquipmentSlot.js';
import Fixture from '../Data/Fixture.js';
import Puzzle from '../Data/Puzzle.js';
import InventoryItem from '../Data/InventoryItem.js';
import InventorySlot from '../Data/InventorySlot.js';
import Prefab from '../Data/Prefab.js';
import Room from '../Data/Room.js';
import RoomItem from '../Data/RoomItem.js';
import Player from '../Data/Player.js';
import ItemInstance from '../Data/ItemInstance.js';
import { generateProceduralOutput } from '../Modules/parser.js';
import { addLogMessage } from './messageHandler.js';

/**
 * Instantiates a new item in the specified location and container.
 * @param {Prefab} prefab - The prefab to instantiate as an item.
 * @param {Room} location - The room to instantiate the item in.
 * @param {Fixture|Puzzle|RoomItem} container - The container to instantiate the item in.
 * @param {string} inventorySlotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
 * @param {number} quantity - The quantity to instantiate.
 * @param {Map<string, string>} proceduralSelections - The manually selected procedural possibilities.
 * @param {Player} [player] - The player who caused this item to be instantiated, if applicable.
 */
export function instantiateItem(prefab, location, container, inventorySlotId, quantity, proceduralSelections, player = null) {
    let containerType = "";
    let containerName = "";
    let containerLogDisplay = "";
    let preposition = "in";
    if (container instanceof Puzzle) {
        containerType = "Puzzle";
        containerName = container.name;
        containerLogDisplay = container.parentFixture ? container.parentFixture.name : container.name;
        if (container.parentFixture) preposition = container.parentFixture.preposition;
    }
    else if (container instanceof Fixture) {
        containerType = "Fixture";
        containerName = container.name;
        containerLogDisplay = container.name;
        preposition = container.preposition;
    }
    else if (container instanceof RoomItem) {
        containerType = "RoomItem";
        containerName = container.identifier + '/' + inventorySlotId;
        containerLogDisplay = `${inventorySlotId} of ${container.identifier}`;
        if (container.prefab) preposition = container.prefab.preposition;
    }

    let createdItem = new RoomItem(
        prefab.id,
        generateIdentifier(prefab),
        location.id,
        container instanceof Puzzle && container.type !== "weight" && container.type !== "container" ? container.accessible && container.solved : true,
        containerType,
        containerName,
        quantity,
        prefab.uses,
        generateProceduralOutput(prefab.description, proceduralSelections, player),
        0,
        prefab.getGame()
    );
    createdItem.setPrefab(prefab);
    createdItem.initializeInventory();
    createdItem.location = location;
    createdItem.container = container;
    createdItem.slot = inventorySlotId;

    if (container instanceof RoomItem)
        container.insertItem(createdItem, inventorySlotId);
    // Update the container's description.
    container.addItemToDescription(createdItem, inventorySlotId, quantity);

    insertRoomItems(location, [createdItem]);

    // Post log message.
    const time = new Date().toLocaleTimeString();
    addLogMessage(prefab.getGame(), `${time} - Instantiated ${quantity} ${createdItem.getIdentifier()} ${preposition} ${containerLogDisplay} in ${location.channel}`);
    return createdItem;
}

/**
 * Instantiates a new inventory item in the player's inventory with the specified equipment slot and container.
 * @param {Prefab} prefab - The prefab to instantiate as an inventory item.
 * @param {Player} player - The player to give this inventory item to.
 * @param {string} equipmentSlotId - The ID of the equipment slot this inventory item will belong to.
 * @param {InventoryItem} container - The container to instantiate the item in.
 * @param {string} inventorySlotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
 * @param {number} quantity - The quantity to instantiate.
 * @param {Map<string, string>} proceduralSelections - The manually selected procedural possibilities.
 * @param {boolean} [notify] - Whether or not to notify the player that the item was added to their inventory. Defaults to true. 
 */
export function instantiateInventoryItem(prefab, player, equipmentSlotId, container, inventorySlotId, quantity, proceduralSelections, notify = true) {
    let createdItem = new InventoryItem(
        player.name,
        prefab.id,
        generateIdentifier(prefab),
        equipmentSlotId,
        container ? "InventoryItem" : "",
        container ? container.identifier + '/' + inventorySlotId : "",
        quantity,
        prefab.uses,
        generateProceduralOutput(prefab.description, proceduralSelections, player),
        0,
        prefab.getGame()
    );
    createdItem.player = player;
    createdItem.setPrefab(prefab);
    createdItem.initializeInventory();
    createdItem.container = container;
    createdItem.slot = inventorySlotId;

    player.carryWeight += createdItem.weight * quantity;

    // Item is being stashed.
    const equipmentSlot = player.inventoryCollection.get(equipmentSlotId);
    if (container !== null) {
        container.insertItem(createdItem, inventorySlotId);
        container.addItemToDescription(createdItem, inventorySlotId, quantity);

        insertInventoryItems(player, [createdItem], equipmentSlot);

        const containerName = `${inventorySlotId} of ${container.identifier}`;
        const preposition = container.prefab ? container.prefab.preposition : "in";
        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(prefab.getGame(), `${time} - Instantiated ${quantity} ${createdItem.getIdentifier()} ${preposition} ${containerName} in ${player.name}'s inventory in ${player.location.channel}`);
    }
    // Item is being equipped.
    else {
        player.directEquip(createdItem, equipmentSlot, notify);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(prefab.getGame(), `${time} - Instantiated ${createdItem.getIdentifier()} and equipped it to ${player.name}'s ${equipmentSlotId} in ${player.location.channel}`);
    }
    return createdItem;
}

/**
 * Replaces an inventory item in-place with an instance of a different prefab.
 * @param {InventoryItem} item - The inventory item to replace. 
 * @param {Prefab} [newPrefab] - The prefab to replace it with. If one isn't given, the inventory item is simply destroyed.
 */
export function replaceInventoryItem(item, newPrefab) {
    if (newPrefab === null || newPrefab === undefined) {
        destroyInventoryItem(item, item.quantity, true);
    }
    else {
        item.player.carryWeight -= item.weight * item.quantity;
        item.setPrefab(newPrefab);
        item.identifier = generateIdentifier(newPrefab);
        item.uses = newPrefab.uses;
        item.player.carryWeight += item.weight * item.quantity;

        // Destroy all child items.
        /** @type {InventoryItem[]} */
        let childItems = [];
        getChildItems(childItems, item);
        for (let i = 0; i < childItems.length; i++)
            destroyInventoryItem(childItems[i], childItems[i].quantity, false);

        item.inventoryCollection.clear();
        item.initializeInventory();
        item.setDescription(newPrefab.description);
    }
    return item;
}

/**
 * Destroys an item.
 * @param {RoomItem} item - The item to destroy. 
 * @param {number} quantity - How many of this item to destroy.
 * @param {boolean} getChildren - Whether or not to recursively destroy all of the items it contains as well.
 */
export function destroyItem(item, quantity, getChildren) {
    item.quantity -= quantity;

    let containerLogDisplay = "";
    let preposition = "in";
    const container = item.container;

    container.removeItemFromDescription(item, item.slot, quantity);
    if (container instanceof Puzzle) {
        containerLogDisplay = container.parentFixture ? container.parentFixture.name : container.name;
        if (container.parentFixture) preposition = container.parentFixture.preposition;
    }
    else if (container instanceof Fixture) {
        containerLogDisplay = container.name;
        if (container.preposition) preposition = container.preposition;
    }
    else if (container instanceof RoomItem) {
        container.removeItem(item, item.slot, quantity);
        containerLogDisplay = `${item.slot} of ${container.identifier}`;
        if (container.prefab) preposition = container.prefab.preposition;
    }

    if (getChildren) {
        /** @type {RoomItem[]} */
        let childItems = [];
        getChildItems(childItems, item);
        for (let i = 0; i < childItems.length; i++)
            destroyItem(childItems[i], childItems[i].quantity, false);
    }

    // Post log message.
    const time = new Date().toLocaleTimeString();
    addLogMessage(item.getGame(), `${time} - Destroyed ${item.getIdentifier()} ${preposition} ${containerLogDisplay} in ${item.location.channel}`);
}

/**
 * Destroys an inventory item.
 * @param {InventoryItem} item - The inventory item to destroy. 
 * @param {number} quantity - How many of this inventory item to destroy.
 * @param {boolean} getChildren - Whether or not to recursively destroy all of the inventory items it contains as well.
 */
export function destroyInventoryItem(item, quantity, getChildren) {
    if (getChildren) {
        /** @type {InventoryItem[]} */
        let childItems = [];
        getChildItems(childItems, item);
        for (let i = 0; i < childItems.length; i++)
            destroyInventoryItem(childItems[i], childItems[i].quantity, false);
    }

    // If the item is equipped, simply unequip it. The directUnequip method will destroy it.
    if (item.container === null) {
        item.player.directUnequip(item);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(item.getGame(), `${time} - Destroyed ${item.getIdentifier()} equipped to ${item.equipmentSlot} in ${item.player.name}'s inventory in ${item.player.location.channel}`);
    }
    else {
        item.quantity -= quantity;

        const container = item.container;
        container.removeItem(item, item.slot, quantity);
        container.removeItemFromDescription(item, item.slot, quantity);
        const containerName = `${item.slot} of ${container.identifier}`;
        const preposition = container.prefab ? container.prefab.preposition : "in";

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(item.getGame(), `${time} - Destroyed ${item.getIdentifier()} ${preposition} ${containerName} in ${item.player.name}'s inventory in ${item.player.location.channel}`);
    }
}

/**
 * Converts a room item to an inventory item and recursively converts all of the items it contains.
 * @param {ItemInstance} item - The item to convert.
 * @param {Player} player - The player who the new inventory item will belong to.
 * @param {string} equipmentSlotId - The ID of the equipment slot the inventory item will be created in.
 * @param {number} quantity - The quantity of the new inventory item.
 * @returns {InventoryItem} The new inventory item.
 */
export function convertRoomItem(item, player, equipmentSlotId, quantity) {
    // Make a copy of the RoomItem as an InventoryItem.
    let createdItem = new InventoryItem(
        player.name,
        item.prefab.id,
        item.identifier,
        equipmentSlotId,
        item.container instanceof ItemInstance ? "InventoryItem" : "",
        item.container instanceof ItemInstance ? item.container.identifier + '/' + item.slot : "",
        quantity,
        item.uses,
        item.description,
        0,
        item.getGame()
    );
    createdItem.player = player;
    createdItem.setPrefab(item.prefab);
    createdItem.initializeInventory();

    // Now recursively run through all of the inventory items and convert them.
    item.inventoryCollection.forEach(inventorySlot => {
        for (let childItem of inventorySlot.items) {
            let inventoryItem = convertRoomItem(childItem, player, equipmentSlotId, childItem.quantity);
            if (inventoryItem.containerName !== "") {
                inventoryItem.container = createdItem;
                inventoryItem.slot = inventorySlot.id;
                createdItem.insertItem(inventoryItem, inventoryItem.slot);
            }
            else createdItem.inventoryCollection.get(inventorySlot.id).items.push(inventoryItem);
        }
    });

    return createdItem;
}

/**
 * Copies an inventory item into the given equipment slot.
 * @param {InventoryItem} item - The inventory item to copy.
 * @param {Player} player - The player who the new inventory item will belong to.
 * @param {string} equipmentSlotId - The ID of the equipment slot the inventory item will be created in.
 * @param {number} quantity - The quantity of the new inventory item.
 * @returns {InventoryItem} The new inventory item.
 */
export function copyInventoryItem(item, player, equipmentSlotId, quantity) {
    return convertRoomItem(item, player, equipmentSlotId, quantity);
}

/**
 * Converts an inventory item to a room item and recursively converts all of the inventory items it contains.
 * @param {ItemInstance} item - The inventory item to convert.
 * @param {Player} player - The player the inventory item currently belongs to.
 * @param {Fixture|Puzzle|ItemInstance} container - The container to new item will be created in.
 * @param {string} inventorySlotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
 * @param {number} quantity - The quantity of the new item.
 * @returns {RoomItem} The new room item.
 */
export function convertInventoryItem(item, player, container, inventorySlotId, quantity) {
    let containerType = "";
    let containerName = "";
    if (container instanceof Puzzle) {
        containerType = "Puzzle";
        containerName = container.name;
    }
    else if (container instanceof Fixture) {
        containerType = "Fixture";
        containerName = container.name;
    }
    else if (container instanceof RoomItem) {
        containerType = "RoomItem";
        containerName = container.identifier + '/' + inventorySlotId;
    }
    else if (container instanceof InventoryItem) {
        containerType = "RoomItem";
        containerName = container.identifier + '/' + item.slot;
    }
    // Make a copy of the InventoryItem as a RoomItem.
    let createdItem = new RoomItem(
        item.prefab.id,
        item.identifier,
        player.location.id,
        container instanceof Puzzle && container.type !== "weight" && container.type !== "container" ? container.accessible && container.solved : true,
        containerType,
        containerName,
        quantity,
        item.uses,
        item.description,
        0,
        item.getGame()
    );
    createdItem.setPrefab(item.prefab);
    createdItem.initializeInventory();
    createdItem.location = player.location;

    // Now recursively run through all of the inventory items and convert them.
    item.inventoryCollection.forEach(inventorySlot => {
        for (let childItem of inventorySlot.items) {
            let inventoryItem = convertInventoryItem(childItem, player, item, "", childItem.quantity);
            if (inventoryItem.containerName !== "") {
                inventoryItem.container = createdItem;
                inventoryItem.slot = inventorySlot.id;
                createdItem.insertItem(inventoryItem, inventoryItem.slot);
            }
            else createdItem.inventoryCollection.get(inventorySlot.id).items.push(inventoryItem);
        }
    });

    return createdItem;
}

/**
 * Recursively adds all child items of the given item to the array of items.
 * @param {ItemInstance[]} items - The array to add child items to.
 * @param {ItemInstance} item - The item whose child items are to be added.
 */
export function getChildItems(items, item) {
    item.inventoryCollection.forEach(inventorySlot => {
        for (let childItem of inventorySlot.items) {
            items.push(childItem);
            getChildItems(items, childItem);
        }
    });
}

/**
 * Sets the quantities of all child items to 0.
 * @param {ItemInstance} item - The item whose child items are to have their quantities updated. 
 */
export function setChildItemQuantitiesZero(item) {
    /** @type {ItemInstance[]} */
    let childItems = [];
    getChildItems(childItems, item);
    for (let i = 0; i < childItems.length; i++)
        childItems[i].quantity = 0;
}

/**
 * Removes a stashed inventory item from the inventory slot in its container.
 * Also decrements the quantity, updates the container's description, and removes the item from its equipment slot.
 * @param {InventoryItem} item - The item to remove.
 * @param {InventoryItem} container - The item's container.
 * @param {InventorySlot<InventoryItem>} inventorySlot - The inventory slot to remove the item from.
 * @param {EquipmentSlot} equipmentSlot - The equipment slot to remove the item from.
 */
export function removeStashedItem(item, container, inventorySlot, equipmentSlot) {
    // Reduce quantity if the quantity is finite.
    if (!isNaN(item.quantity))
        item.quantity--;

    // Update container.
    container.removeItem(item, inventorySlot.id, 1);
    container.removeItemFromDescription(item, inventorySlot.id);

    // Remove the item from its equipment slot.
    if (item.quantity === 0)
        equipmentSlot.removeItem(item);
}

/**
 * Converts the given item into an inventory item and puts it in the player's hand.
 * Also converts its child items and inserts the newly created items into the game's list of inventory items.
 * @param {ItemInstance} item - The item to put in the player's hand.
 * @param {Player} player - The player whose hand the item will be put in.
 * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the item in.
 * @returns The created item in the player's hand.
 */
export function putItemInHand(item, player, handEquipmentSlot) {
    // Copy the item into the player's hand.
    let createdItem = convertRoomItem(item, player, handEquipmentSlot.id, 1);
    createdItem.containerName = "";
    createdItem.container = null;
    createdItem.row = handEquipmentSlot.row;

    // Equip the item and add it to the player's inventory.
    handEquipmentSlot.equipItem(createdItem);
    // Create a list of all the child items.
    /** @type {InventoryItem[]} */
    let items = [];
    getChildItems(items, createdItem);
    // Now that the item has been converted, we can update the quantities of child items.
    setChildItemQuantitiesZero(item);
    // Insert the new items into the game's list of inventory items.
    insertInventoryItems(player, items, handEquipmentSlot);
    return createdItem;
}

/**
 * Inserts an array of items into the game at the correct position in the game's array of room items.
 * @param {Room} location - The room to insert items into. 
 * @param {RoomItem[]} items - The items to insert. 
 */
export function insertRoomItems(location, items) {
    const game = location.getGame();
    for (let item of items) {
        // Check if the player is putting this item back in original spot unmodified.
        const roomItems = game.roomItems.filter(gameItem => gameItem.location.id === location.id);
        let matchedItem = roomItems.find(roomItem =>
            roomItem.prefab.id === item.prefab.id &&
            roomItem.identifier === item.identifier &&
            roomItem.accessible &&
            roomItem.containerName === item.containerName &&
            roomItem.slot === item.slot &&
            (roomItem.uses === item.uses || isNaN(item.uses) && isNaN(item.uses)) &&
            roomItem.description === item.description
        );
        if (matchedItem) {
            if (!isNaN(matchedItem.quantity))
                matchedItem.quantity += item.quantity;
            /** @type {Fixture|Puzzle|RoomItem} */
            let itemContainer = null;
            if (item.container instanceof RoomItem) {
                /** 
                 * @param {RoomItem} item1
                 * @param {RoomItem} item2 
                 */
                const containersMatch = function (item1, item2) {
                    if (item1.container instanceof RoomItem && item2.container instanceof RoomItem)
                        return containersMatch(item1.container, item2.container);
                    else {
                        if (item1.containerName === item2.containerName) return true;
                        else return false;
                    }
                };
                const possibleContainers = roomItems.filter(roomItem =>
                    item.container instanceof RoomItem &&
                    roomItem.identifier === item.container.identifier &&
                    roomItem.containerName === item.container.containerName &&
                    roomItem.slot === item.container.slot &&
                    (roomItem.uses === item.container.uses || isNaN(roomItem.uses) && isNaN(item.container.uses)) &&
                    roomItem.description === item.container.description
                );
                for (let j = 0; j < possibleContainers.length; j++) {
                    if (item.container instanceof RoomItem && containersMatch(item.container, possibleContainers[j])) {
                        itemContainer = possibleContainers[j];
                        break;
                    }
                }
            }
            else itemContainer = item.container;
            matchedItem.container = itemContainer;
            matchedItem.weight = item.weight;
            matchedItem.inventoryCollection = item.inventoryCollection;
            // Update container's references to this item.
            if (item.container instanceof RoomItem) {
                let foundItem = false;
                for (let inventorySlot of item.container.inventoryCollection.values()) {
                    if (inventorySlot.id === item.slot) {
                        const containerSlot = inventorySlot;
                        for (let i = 0; i < containerSlot.items.length; i++) {
                            if (containerSlot.items[i].prefab.id === item.prefab.id &&
                                containerSlot.items[i].identifier === item.identifier &&
                                (containerSlot.items[i].uses === item.uses || isNaN(containerSlot.items[i].uses) && isNaN(item.uses)) &&
                                containerSlot.items[i].description === item.description) {
                                foundItem = true;
                                containerSlot.items.splice(i, 1, matchedItem);
                                break;
                            }
                        }
                        if (foundItem) break;
                    }
                }
            }
        }
        // The player is putting this item somewhere else or it's been modified somehow.
        else {
            // We want to insert this item near items in the same container, so get all of the items in that container.
            const containerItems = roomItems.filter(containerItem => containerItem.containerName === item.containerName);

            const lastRoomItem = roomItems[roomItems.length - 1];
            const lastContainerItem = containerItems[containerItems.length - 1];
            const lastGameItem = game.roomItems[game.roomItems.length - 1];
            let insertRow = -1;
            // If the list of items in that container isn't empty and isn't the last row of the spreadsheet, insert the new item.
            if (containerItems.length !== 0 && lastContainerItem.row !== lastGameItem.row)
                insertRow = lastContainerItem.row;
            // If there are none, it might just be that there are no items in that container yet. Try to at least put it near items in the same room.
            else if (roomItems.length !== 0 && lastRoomItem.row !== lastGameItem.row)
                insertRow = lastRoomItem.row;
            // If there are none, just insert it at the end of the sheet.
            else
                insertRow = lastGameItem.row;

            // Insert the new item into the items list at the appropriate position.
            let insertIndex = 0;
            for (insertIndex; insertIndex < game.roomItems.length; insertIndex++) {
                if (game.roomItems[insertIndex].row === insertRow) {
                    game.roomItems.splice(insertIndex + 1, 0, item);
                    break;
                }
            }
            // Update the rows for all of the items after this.
            for (let i = insertIndex + 1, newRow = insertRow + 1; i < game.roomItems.length; i++, newRow++)
                game.roomItems[i].row = newRow;
        }
    }
}


/**
 * Inserts an array of inventory items into the game at the correct position in the game's array of inventory items.
 * @param {Player} player - The player who these inventory items belong to.
 * @param {InventoryItem[]} items - The inventory items to insert.
 * @param {EquipmentSlot} equipmentSlot - The equipment slot within the player's inventory.
 */
export function insertInventoryItems(player, items, equipmentSlot) {
    const game = player.getGame();
    let lastNewItem = player.inventoryCollection.last().equippedItem !== null ?
        player.inventoryCollection.last().equippedItem :
        player.inventoryCollection.last().items[0];
    for (let item of items) {
        // Check if this item already exists in the player's inventory.
        const playerItems = game.inventoryItems.filter(gameItem => gameItem.player.name === player.name);
        let matchedItem = playerItems.find(playerItem =>
            playerItem.prefab !== null &&
            playerItem.prefab.id === item.prefab.id &&
            playerItem.identifier === item.identifier &&
            playerItem.equipmentSlot === item.equipmentSlot &&
            playerItem.containerName === item.containerName &&
            playerItem.slot === item.slot &&
            (playerItem.uses === item.uses || isNaN(playerItem.uses) && isNaN(item.uses)) &&
            playerItem.description === item.description
        );
        if (matchedItem) {
            if (!isNaN(matchedItem.quantity))
                matchedItem.quantity += item.quantity;
            const containerRow = matchedItem.container !== null ? matchedItem.container.row : 0;
            matchedItem.container = item.container;
            if (containerRow !== 0 && item.container.row === 0) matchedItem.container.row = containerRow;
            matchedItem.weight = item.weight;
            matchedItem.inventoryCollection = item.inventoryCollection;
            // Update container's references to this item.
            if (item.container instanceof InventoryItem) {
                let foundItem = false;
                for (let inventorySlot of item.container.inventoryCollection.values()) {
                    if (inventorySlot.id === item.slot) {
                        const containerSlot = inventorySlot;
                        for (let j = 0; j < containerSlot.items.length; j++) {
                            if (containerSlot.items[j].prefab.id === item.prefab.id &&
                                containerSlot.items[j].identifier === item.identifier &&
                                (containerSlot.items[j].uses === item.uses || isNaN(containerSlot.items[j].uses) && isNaN(item.uses)) &&
                                containerSlot.items[j].description === item.description) {
                                foundItem = true;
                                containerSlot.items.splice(j, 1, matchedItem);
                                break;
                            }
                        }
                        if (foundItem) break;
                    }
                }
            }
            equipmentSlot.items.splice(equipmentSlot.items.length, 0, matchedItem);
        }
        // The player hasn't picked this item up before or it's been modified somehow.
        else {
            // We want to insert this item near items in the same container slot, so get all of the items in that container slot.
            const slotItems = playerItems.filter(playerItem => playerItem.equipmentSlot === item.equipmentSlot && playerItem.containerName === item.containerName);
            // Just in case there aren't any, get items just within the same container.
            const containerItems = playerItems.filter(playerItem => playerItem.equipmentSlot === item.equipmentSlot && playerItem.container !== null && playerItem.container.identifier !== "" && playerItem.container.identifier === item.container.identifier);

            const lastSlotItem = slotItems[slotItems.length - 1];
            const lastContainerItem = containerItems[containerItems.length - 1];

            let insertRow = -1;
            // If the list of items in that slot isn't empty, insert the new item.
            if (slotItems.length !== 0)
                insertRow = lastSlotItem.row;
            // If there are none, it might just be that there are no items in that slot yet. Try to at least put it near items in the same container.
            else if (containerItems.length !== 0)
                insertRow = lastContainerItem.row;
            // If there are none, just insert it after the last new item.
            else
                insertRow = lastNewItem.row;
            lastNewItem = item;

            // Insert the new item into the inventoryItems list at the appropriate position.
            let insertIndex = 0;
            for (insertIndex; insertIndex < game.inventoryItems.length; insertIndex++) {
                if (game.inventoryItems[insertIndex].row === insertRow) {
                    game.inventoryItems.splice(insertIndex + 1, 0, item);
                    equipmentSlot.items.splice(equipmentSlot.items.length, 0, item);
                    break;
                }
            }
            // Update the rows for all of the inventoryItems after this.
            for (let i = insertIndex + 1, newRow = insertRow + 1; i < game.inventoryItems.length; i++, newRow++)
                game.inventoryItems[i].row = newRow;

            // Update the rows for all Player EquipmentSlots.
            game.playersCollection.forEach(player => {
                player.inventoryCollection.forEach(equipmentSlot => {
                    if (equipmentSlot.equippedItem === null) equipmentSlot.row = equipmentSlot.items[0].row;
                    else equipmentSlot.row = equipmentSlot.equippedItem.row;
                });
            });
        }
    }
}

/**
 * Generates a unique identifier for a new item instance.
 * @param {Prefab} prefab - The prefab this item is an instance of.
 * @returns {string} The new unique identifier.
 */
function generateIdentifier(prefab) {
    let identifier = "";
    if (prefab.inventoryCollection.size > 0) {
        identifier = prefab.id;
        let number = 1;
        while (prefab.getGame().roomItems.find(item => item.identifier === `${identifier} ${number}` && item.quantity !== 0) ||
            prefab.getGame().inventoryItems.find(item => item.identifier === `${identifier} ${number}` && item.quantity !== 0))
            number++;
        identifier = `${identifier} ${number}`;
    }
    return identifier;
}
