import Fixture from '../Data/Fixture.js';
import RoomItem from '../Data/RoomItem.js';
import Puzzle from '../Data/Puzzle.js';
import InventoryItem from '../Data/InventoryItem.js';
import InventorySlot from '../Data/InventorySlot.js';
import Prefab from '../Data/Prefab.js';
import Room from '../Data/Room.js';
import Player from '../Data/Player.js';
import ItemInstance from '../Data/ItemInstance.js';
import { addItem as addItemToDescription, generateProceduralOutput, removeItem as removeItemFromDescription } from '../Modules/parser.js';
import { addLogMessage } from './messageHandler.js';

/**
 * Instantiates a new item in the specified location and container.
 * @param {Prefab} prefab - The prefab to instantiate as an item.
 * @param {Room} location - The room to instantiate the item in.
 * @param {Fixture|Puzzle|RoomItem} container - The container to instantiate the item in.
 * @param {string} slotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
 * @param {number} quantity - The quantity to instantiate.
 * @param {Map<string, string>} proceduralSelections - The manually selected procedural possibilities.
 * @param {Player} [player] - The player who caused this item to be instantiated, if applicable.
 */
export function instantiateItem(prefab, location, container, slotId, quantity, proceduralSelections, player = null) {
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
        containerName = container.identifier + '/' + slotId;
        containerLogDisplay = `${slotId} of ${container.identifier}`;
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
        prefab.game
    );
    createdItem.setPrefab(prefab);
    createdItem.initializeInventory();
    createdItem.location = location;
    createdItem.container = container;
    createdItem.slot = slotId;

    if (container instanceof RoomItem)
        container.insertItem(createdItem, slotId);
    // Update the container's description.
    container.setDescription(addItemToDescription(container.getDescription(), createdItem, slotId, quantity));

    insertItems(location, [createdItem]);

    // Post log message.
    const time = new Date().toLocaleTimeString();
    addLogMessage(prefab.game, `${time} - Instantiated ${quantity} ${createdItem.identifier ? createdItem.identifier : createdItem.prefab.id} ${preposition} ${containerLogDisplay} in ${location.channel}`);
}

/**
 * Instantiates a new inventory item in the player's inventory with the specified equipment slot and container.
 * @param {Prefab} prefab - The prefab to instantiate as an inventory item.
 * @param {Player} player - The player to give this inventory item to.
 * @param {string} equipmentSlot - The ID of the equipment slot this inventory item will belong to.
 * @param {InventoryItem} container - The container to instantiate the item in.
 * @param {string} slotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
 * @param {number} quantity - The quantity to instantiate.
 * @param {Map<string, string>} proceduralSelections - The manually selected procedural possibilities.
 * @param {boolean} [notify] - Whether or not to notify the player that the item was added to their inventory. Defaults to true. 
 */
export function instantiateInventoryItem(prefab, player, equipmentSlot, container, slotId, quantity, proceduralSelections, notify = true) {
    let createdItem = new InventoryItem(
        player.name,
        prefab.id,
        generateIdentifier(prefab),
        equipmentSlot,
        container ? "InventoryItem" : "",
        container ? container.identifier + '/' + slotId : "",
        quantity,
        prefab.uses,
        generateProceduralOutput(prefab.description, proceduralSelections, player),
        0,
        prefab.game
    );
    createdItem.player = player;
    createdItem.setPrefab(prefab);
    createdItem.initializeInventory();
    createdItem.container = container;
    createdItem.slot = slotId;

    // Get the slot number of the EquipmentSlot that the item will go into.
    let slot = 0;
    for (slot; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].id === equipmentSlot)
            break;
    }

    player.carryWeight += createdItem.weight * quantity;

    // Item is being stashed.
    if (container !== null) {
        container.insertItem(createdItem, slotId);
        container.setDescription(addItemToDescription(container.getDescription(), createdItem, slotId, quantity));

        insertInventoryItems(player, [createdItem], slot);

        const containerName = `${slotId} of ${container.identifier}`;
        const preposition = container.prefab ? container.prefab.preposition : "in";
        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(prefab.game, `${time} - Instantiated ${quantity} ${createdItem.identifier ? createdItem.identifier : createdItem.prefab.id} ${preposition} ${containerName} in ${player.name}'s inventory in ${player.location.channel}`);
    }
    // Item is being equipped.
    else {
        player.directEquip(createdItem, equipmentSlot, notify);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(prefab.game, `${time} - Instantiated ${createdItem.identifier ? createdItem.identifier : createdItem.prefab.id} and equipped it to ${player.name}'s ${equipmentSlot} in ${player.location.channel}`);
    }
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

        item.inventory.length = 0;
        item.initializeInventory();
        item.description = newPrefab.description;
    }
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

    container.setDescription(removeItemFromDescription(container.getDescription(), item, item.slot, quantity));
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
    addLogMessage(item.game, `${time} - Destroyed ${item.identifier ? item.identifier : item.prefab.id} ${preposition} ${containerLogDisplay} in ${item.location.channel}`);
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
        addLogMessage(item.game, `${time} - Destroyed ${item.identifier ? item.identifier : item.prefab.id} equipped to ${item.equipmentSlot} in ${item.player.name}'s inventory in ${item.player.location.channel}`);
    }
    else {
        item.quantity -= quantity;

        const container = item.container;
        container.removeItem(item, item.slot, quantity);
        container.setDescription(removeItemFromDescription(container.getDescription(), item, item.slot, quantity));
        const containerName = `${item.slot} of ${container.identifier}`;
        const preposition = container.prefab ? container.prefab.preposition : "in";

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(item.game, `${time} - Destroyed ${item.identifier ? item.identifier : item.prefab.id} ${preposition} ${containerName} in ${item.player.name}'s inventory in ${item.player.location.channel}`);
    }
}

/**
 * Converts a room item to an inventory item and recursively converts all of the items it contains.
 * @param {ItemInstance} item - The item to convert.
 * @param {Player} player - The player who the new inventory item will belong to.
 * @param {string} equipmentSlot - The ID of the equipment slot the inventory item will be created in.
 * @param {number} quantity - The quantity of the new inventory item.
 * @returns {InventoryItem} The new inventory item.
 */
export function convertRoomItem(item, player, equipmentSlot, quantity) {
    // Make a copy of the RoomItem as an InventoryItem.
    let createdItem = new InventoryItem(
        player.name,
        item.prefab.id,
        item.identifier,
        equipmentSlot,
        item.container instanceof ItemInstance ? "InventoryItem" : "",
        item.container instanceof ItemInstance ? item.container.identifier + '/' + item.slot : "",
        quantity,
        item.uses,
        item.description,
        0,
        item.game
    );
    createdItem.player = player;
    createdItem.setPrefab(item.prefab);
    createdItem.initializeInventory();

    // Now recursively run through all of the inventory items and convert them.
    for (let i = 0; i < item.inventory.length; i++) {
        for (let j = 0; j < item.inventory[i].items.length; j++) {
            let inventoryItem = convertRoomItem(item.inventory[i].items[j], player, equipmentSlot, item.inventory[i].items[j].quantity);
            if (inventoryItem.containerName !== "") {
                inventoryItem.container = createdItem;
                inventoryItem.slot = createdItem.inventory[i].id;
                createdItem.insertItem(inventoryItem, inventoryItem.slot);
            }
            else createdItem.inventory[i].items.push(inventoryItem);
        }
    }

    return createdItem;
}

/**
 * Copies an inventory item into the given equipment slot.
 * @param {InventoryItem} item - The inventory item to copy.
 * @param {Player} player - The player who the new inventory item will belong to.
 * @param {string} equipmentSlot - The ID of the equipment slot the inventory item will be created in.
 * @param {number} quantity - The quantity of the new inventory item.
 * @returns {InventoryItem} The new inventory item.
 */
export function copyInventoryItem(item, player, equipmentSlot, quantity) {
    return convertRoomItem(item, player, equipmentSlot, quantity);
}

/**
 * Converts an inventory item to a room item and recursively converts all of the inventory items it contains.
 * @param {ItemInstance} item - The inventory item to convert.
 * @param {Player} player - The player the inventory item currently belongs to.
 * @param {Fixture|Puzzle|ItemInstance} container - The container to new item will be created in.
 * @param {string} slotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
 * @param {number} quantity - The quantity of the new item.
 * @returns {RoomItem} The new room item.
 */
export function convertInventoryItem(item, player, container, slotId, quantity) {
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
        containerName = container.identifier + '/' + slotId;
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
        item.game
    );
    createdItem.setPrefab(item.prefab);
    createdItem.initializeInventory();
    createdItem.location = player.location;

    // Now recursively run through all of the inventory items and convert them.
    for (let i = 0; i < item.inventory.length; i++) {
        for (let j = 0; j < item.inventory[i].items.length; j++) {
            let inventoryItem = convertInventoryItem(item.inventory[i].items[j], player, item, "", item.inventory[i].items[j].quantity);
            if (inventoryItem.containerName !== "") {
                inventoryItem.container = createdItem;
                inventoryItem.slot = createdItem.inventory[i].id;
                createdItem.insertItem(inventoryItem, inventoryItem.slot);
            }
            else createdItem.inventory[i].items.push(inventoryItem);
        }
    }

    return createdItem;
}

/**
 * Recursively adds all child items of the given item to the array of items.
 * @param {ItemInstance[]} items - The array to add child items to.
 * @param {ItemInstance} item - The item whose child items are to be added.
 */
export function getChildItems(items, item) {
    for (let i = 0; i < item.inventory.length; i++) {
        for (let j = 0; j < item.inventory[i].items.length; j++) {
            items.push(item.inventory[i].items[j]);
            getChildItems(items, item.inventory[i].items[j]);
        }
    }
}

/**
 * Inserts an array of items into the game at the correct position in the game's array of items.
 * @param {Room} location - The room to insert items into. 
 * @param {RoomItem[]} items - The items to insert. 
 */
export function insertItems(location, items) {
    const game = location.game;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Check if the player is putting this item back in original spot unmodified.
        const roomItems = game.items.filter(gameItem => gameItem.location.id === location.id);
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
            matchedItem.inventory = item.inventory;
            // Update container's references to this item.
            if (item.container instanceof RoomItem) {
                let foundItem = false;
                for (let slot = 0; slot < item.container.inventory.length; slot++) {
                    if (item.container.inventory[slot].id === item.slot) {
                        const containerSlot = item.container.inventory[slot];
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
        }
        // The player is putting this item somewhere else or it's been modified somehow.
        else {
            // We want to insert this item near items in the same container, so get all of the items in that container.
            const containerItems = roomItems.filter(containerItem => containerItem.containerName === item.containerName);

            const lastRoomItem = roomItems[roomItems.length - 1];
            const lastContainerItem = containerItems[containerItems.length - 1];
            const lastGameItem = game.items[game.items.length - 1];
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
            for (insertIndex; insertIndex < game.items.length; insertIndex++) {
                if (game.items[insertIndex].row === insertRow) {
                    game.items.splice(insertIndex + 1, 0, item);
                    break;
                }
            }
            // Update the rows for all of the items after this.
            for (let j = insertIndex + 1, newRow = insertRow + 1; j < game.items.length; j++, newRow++)
                game.items[j].row = newRow;
        }
    }
}


/**
 * Inserts an array of inventory items into the game at the correct position in the game's array of inventory items.
 * @param {Player} player - The player who these inventory items belong to.
 * @param {InventoryItem[]} items - The inventory items to insert.
 * @param {number} equipmentSlotIndex - The index of the equipment slot within the player's inventory.
 */
export function insertInventoryItems(player, items, equipmentSlotIndex) {
    const game = player.game;
    let lastNewItem = player.inventory[player.inventory.length - 1].equippedItem !== null ?
        player.inventory[player.inventory.length - 1].equippedItem :
        player.inventory[player.inventory.length - 1].items[0];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
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
            matchedItem.inventory = item.inventory;
            // Update container's references to this item.
            if (item.container instanceof InventoryItem) {
                let foundItem = false;
                for (let slot = 0; slot < item.container.inventory.length; slot++) {
                    if (item.container.inventory[slot].id === item.slot) {
                        const containerSlot = item.container.inventory[slot];
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
            player.inventory[equipmentSlotIndex].items.splice(player.inventory[equipmentSlotIndex].items.length, 0, matchedItem);
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
                    player.inventory[equipmentSlotIndex].items.splice(player.inventory[equipmentSlotIndex].items.length, 0, item);
                    break;
                }
            }
            // Update the rows for all of the inventoryItems after this.
            for (let j = insertIndex + 1, newRow = insertRow + 1; j < game.inventoryItems.length; j++, newRow++)
                game.inventoryItems[j].row = newRow;

            // Update the rows for all Player EquipmentSlots.
            for (let j = 0; j < game.players.length; j++) {
                for (let slot = 0; slot < game.players[j].inventory.length; slot++) {
                    if (game.players[j].inventory[slot].equippedItem === null) game.players[j].inventory[slot].row = game.players[j].inventory[slot].items[0].row;
                    else game.players[j].inventory[slot].row = game.players[j].inventory[slot].equippedItem.row;
                }
            }
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
    if (prefab.inventory.length > 0) {
        identifier = prefab.id;
        let number = 1;
        while (prefab.game.items.find(item => item.identifier === `${identifier} ${number}` && item.quantity !== 0) ||
            prefab.game.inventoryItems.find(item => item.identifier === `${identifier} ${number}` && item.quantity !== 0))
            number++;
        identifier = `${identifier} ${number}`;
    }
    return identifier;
}
