const constants = include('Configs/constants.json');
const parser = include(`${constants.modulesDir}/parser.js`);
var game = include('game.json');

const Object = include(`${constants.dataDir}/Object.js`);
const Item = include(`${constants.dataDir}/Item.js`);
const Puzzle = include(`${constants.dataDir}/Puzzle.js`);
const InventoryItem = include(`${constants.dataDir}/InventoryItem.js`);

module.exports.instantiateItem = function (prefab, location, container, slotName, quantity) {
    var containerName = "";
    if (container instanceof Puzzle) containerName = "Puzzle: " + container.name;
    else if (container instanceof Object) containerName = "Object: " + container.name;
    else if (container instanceof Item) containerName = "Item: " + container.identifier + '/' + slotName;

    var createdItem = new Item(
        prefab,
        generateIdentifier(prefab),
        location,
        container instanceof Puzzle && container.type !== "weight" && container.type !== "container" ? container.accessible && container.solved : true,
        containerName,
        quantity,
        prefab.uses,
        prefab.description,
        0
    );
    createdItem.container = container;
    createdItem.slot = slotName;

    // Initialize the item's inventory slots.
    for (let i = 0; i < prefab.inventory.length; i++)
        createdItem.inventory.push({
            name: prefab.inventory[i].name,
            capacity: prefab.inventory[i].capacity,
            takenSpace: prefab.inventory[i].takenSpace,
            weight: prefab.inventory[i].weight,
            item: []
        });

    var preposition = "in";
    // Update the container's description.
    if (container instanceof Puzzle) {
        container.alreadySolvedDescription = parser.addItem(container.alreadySolvedDescription, createdItem, null, quantity);
        containerName = container.parentObject ? container.parentObject.name : container.name;
        preposition = container.parentObject ? container.parentObject.preposition : "in";
    }
    else if (container instanceof Object) {
        container.description = parser.addItem(container.description, createdItem, null, quantity);
        containerName = container.name;
        preposition = container.preposition;
    }
    else if (container instanceof Item) {
        container.insertItem(createdItem, slotName);
        container.description = parser.addItem(container.description, createdItem, slotName, quantity);
        containerName = `${slotName} of ${container.identifier}`;
        preposition = container.prefab ? container.prefab.preposition : "in";
    }

    this.insertItems(game, location, [createdItem]);

    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - Instantiated ${quantity} ${createdItem.identifier ? createdItem.identifier : createdItem.prefab.id} ${preposition} ${containerName} in ${location.channel}`);

    return;
};

module.exports.instantiateInventoryItem = function (prefab, player, equipmentSlot, container, slotName, quantity, bot) {
    var createdItem = new InventoryItem(
        player,
        prefab,
        generateIdentifier(prefab),
        equipmentSlot,
        container ? container.identifier + '/' + slotName : "",
        quantity,
        prefab.uses,
        prefab.description,
        0
    );
    createdItem.container = container;
    createdItem.slot = slotName;

    // Initialize the item's inventory slots.
    for (let i = 0; i < prefab.inventory.length; i++)
        createdItem.inventory.push({
            name: prefab.inventory[i].name,
            capacity: prefab.inventory[i].capacity,
            takenSpace: prefab.inventory[i].takenSpace,
            weight: prefab.inventory[i].weight,
            item: []
        });

    // Get the slot number of the EquipmentSlot that the item will go into.
    for (var slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === equipmentSlot)
            break;
    }

    player.carryWeight += createdItem.weight * quantity;

    // Item is being stashed.
    if (container !== null) {
        container.insertItem(createdItem, slotName);
        container.description = parser.addItem(container.description, createdItem, slotName, quantity);

        this.insertInventoryItems(game, player, [createdItem], slot);

        const containerName = `${slotName} of ${container.identifier}`;
        const preposition = container.prefab ? container.prefab.preposition : "in";
        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - Instantiated ${quantity} ${createdItem.identifier ? createdItem.identifier : createdItem.prefab.id} ${preposition} ${containerName} in ${player.name}'s inventory in ${player.location.channel}`);
    }
    // Item is being equipped.
    else {
        player.fastEquip(game, createdItem, equipmentSlot, bot);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - Instantiated ${createdItem.identifier ? createdItem.identifier : createdItem.prefab.id} and equipped it to ${player.name}'s ${equipmentSlot} in ${player.location.channel}`);
    }

    return;
};

module.exports.replaceInventoryItem = function (item, newPrefab) {
    if (newPrefab === null || newPrefab === undefined) {
        this.destroyInventoryItem(item, item.quantity, null, true);
        return;
    }
    item.player.carryWeight -= item.weight * item.quantity;
    item.prefab = newPrefab;
    item.identifier = generateIdentifier(newPrefab);
    item.name = newPrefab.name;
    item.pluralName = newPrefab.pluralName;
    item.singleContainingPhrase = newPrefab.singleContainingPhrase;
    item.pluralContainingPhrase = newPrefab.pluralContainingPhrase;
    item.uses = newPrefab.uses;
    item.weight = newPrefab.weight;
    item.player.carryWeight += item.weight * item.quantity;

    // Destroy all child items.
    let childItems = [];
    this.getChildItems(childItems, item);
    for (let i = 0; i < childItems.length; i++)
        this.destroyInventoryItem(childItems[i], childItems[i].quantity, null, false);

    item.inventory.length = 0;
    for (let i = 0; i < newPrefab.inventory.length; i++) {
        item.inventory.push({
            name: newPrefab.inventory[i].name,
            capacity: newPrefab.inventory[i].capacity,
            takenSpace: newPrefab.inventory[i].takenSpace,
            weight: newPrefab.inventory[i].weight,
            item: []
        });
    }
    item.description = newPrefab.description;

    return;
};

module.exports.destroyItem = function (item, quantity, getChildren) {
    item.quantity -= quantity;

    var containerName = "";
    var preposition = "in";
    const container = item.container;
    if (container instanceof Puzzle) {
        container.alreadySolvedDescription = parser.removeItem(container.alreadySolvedDescription, item, null, quantity);
        containerName = container.parentObject ? container.parentObject.name : container.name;
        preposition = container.parentObject ? container.parentObject.preposition : "in";
    }
    else if (container instanceof Object) {
        container.description = parser.removeItem(container.description, item, null, quantity);
        containerName = container.name;
        preposition = container.preposition ? container.preposition : "in";
    }
    else if (container instanceof Item) {
        container.removeItem(item, item.slot, quantity);
        container.description = parser.removeItem(container.description, item, item.slot, quantity);
        containerName = `${item.slot} of ${container.identifier}`;
        preposition = container.prefab ? container.prefab.preposition : "in";
    }
    else if (container === null) {
        container.description = parser.removeItem(container.description, item, null, quantity);
        for (let i = 0; i < container.exit.length; i++)
            container.exit[i].description = parser.removeItem(container.exit[i].description, item, null, quantity);
        preposition = "in";
    }

    if (getChildren) {
        let childItems = [];
        this.getChildItems(childItems, item);
        for (let i = 0; i < childItems.length; i++)
            this.destroyItem(childItems[i], childItems[i].quantity, false);
    }

    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - Destroyed ${item.identifier ? item.identifier : item.prefab.id} ${preposition} ${containerName} in ${item.location.channel}`);

    return;
};

module.exports.destroyInventoryItem = function (item, quantity, bot, getChildren) {
    if (getChildren) {
        let childItems = [];
        this.getChildItems(childItems, item);
        for (let i = 0; i < childItems.length; i++)
            this.destroyInventoryItem(childItems[i], childItems[i].quantity, bot, false);
    }

    // If the item is equipped, simply unequip it. The fastEquip method will destroy it.
    if (item.container === null) {
        item.player.fastUnequip(game, item, bot);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - Destroyed ${item.identifier ? item.identifier : item.prefab.id} equipped to ${item.equipmentSlot} in ${item.player.name}'s inventory in ${item.player.location.channel}`);
    }
    else {
        item.quantity -= quantity;

        const container = item.container;
        container.removeItem(item, item.slot, quantity);
        container.description = parser.removeItem(container.description, item, item.slot, quantity);
        const containerName = `${item.slot} of ${container.identifier}`;
        const preposition = container.prefab ? container.prefab.preposition : "in";

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - Destroyed ${item.identifier ? item.identifier : item.prefab.id} ${preposition} ${containerName} in ${item.player.name}'s inventory in ${item.player.location.channel}`);
    }

    return;
};

// This recursive function is used to convert Items to InventoryItems.
module.exports.convertItem = function (item, player, hand, quantity) {
    // Make a copy of the Item as an InventoryItem.
    var createdItem = new InventoryItem(
        player,
        item.prefab,
        item.identifier,
        hand,
        item.container && item.container.prefab ? item.container.identifier + '/' + item.slot : "",
        quantity,
        item.uses,
        item.description,
        0
    );

    // Initialize the item's inventory slots.
    for (let i = 0; i < item.prefab.inventory.length; i++)
        createdItem.inventory.push({
            name: item.prefab.inventory[i].name,
            capacity: item.prefab.inventory[i].capacity,
            takenSpace: item.prefab.inventory[i].takenSpace,
            weight: item.prefab.inventory[i].weight,
            item: []
        });

    // Now recursively run through all of the inventory items and convert them.
    for (let i = 0; i < item.inventory.length; i++) {
        for (let j = 0; j < item.inventory[i].item.length; j++) {
            let inventoryItem = this.convertItem(item.inventory[i].item[j], player, hand, item.inventory[i].item[j].quantity);
            if (inventoryItem.containerName !== "") {
                inventoryItem.container = createdItem;
                inventoryItem.slot = createdItem.inventory[i].name;
                createdItem.insertItem(inventoryItem, inventoryItem.slot);
            }
            else createdItem.inventory[i].item.push(inventoryItem);
        }
    }

    return createdItem;
};


module.exports.copyInventoryItem = function (item, player, hand, quantity) {
    // convertItem can also be used to copy Inventory Items, effectively making this function another name for convertItem.
    return this.convertItem(item, player, hand, quantity);
};

// This recursive function is used to convert InventoryItems to Items.
module.exports.convertInventoryItem = function (item, player, container, slotName, quantity) {
    var containerName = "";
    if (container instanceof Puzzle) containerName = "Puzzle: " + container.name;
    else if (container instanceof Object) containerName = "Object: " + container.name;
    else if (container instanceof Item) containerName = "Item: " + container.identifier + '/' + slotName;
    else if (container instanceof InventoryItem) containerName = "Item: " + container.identifier + '/' + item.slot;
    // Make a copy of the Item as an InventoryItem.
    var createdItem = new Item(
        item.prefab,
        item.identifier,
        player.location,
        container instanceof Puzzle && container.type !== "weight" && container.type !== "container" ? container.accessible && container.solved : true,
        containerName,
        quantity,
        item.uses,
        item.description,
        0
    );

    // Initialize the item's inventory slots.
    for (let i = 0; i < item.prefab.inventory.length; i++)
        createdItem.inventory.push({
            name: item.prefab.inventory[i].name,
            capacity: item.prefab.inventory[i].capacity,
            takenSpace: item.prefab.inventory[i].takenSpace,
            weight: item.prefab.inventory[i].weight,
            item: []
        });

    // Now recursively run through all of the inventory items and convert them.
    for (let i = 0; i < item.inventory.length; i++) {
        for (let j = 0; j < item.inventory[i].item.length; j++) {
            let inventoryItem = this.convertInventoryItem(item.inventory[i].item[j], player, item, "", item.inventory[i].item[j].quantity);
            if (inventoryItem.containerName !== "") {
                inventoryItem.container = createdItem;
                inventoryItem.slot = createdItem.inventory[i].name;
                createdItem.insertItem(inventoryItem, inventoryItem.slot);
            }
            else createdItem.inventory[i].item.push(inventoryItem);
        }
    }

    return createdItem;
};

module.exports.getChildItems = function (items, item) {
    for (let i = 0; i < item.inventory.length; i++) {
        for (let j = 0; j < item.inventory[i].item.length; j++) {
            items.push(item.inventory[i].item[j]);
            this.getChildItems(items, item.inventory[i].item[j]);
        }
    }

    return;
};

module.exports.insertItems = function (game, location, items) {
    for (let i = 0; i < items.length; i++) {
        // Check if the player is putting this item back in original spot unmodified.
        const roomItems = game.items.filter(item => item.location.name === location.name);
        let matchedItem = roomItems.find(item =>
            item.prefab.id === items[i].prefab.id &&
            item.identifier === items[i].identifier &&
            item.accessible &&
            item.containerName === items[i].containerName &&
            item.slot === items[i].slot &&
            (item.uses === items[i].uses || isNaN(item.uses) && isNaN(items[i].uses)) &&
            item.description === items[i].description
        );
        if (matchedItem) {
            if (!isNaN(matchedItem.quantity))
                matchedItem.quantity += items[i].quantity;
            var itemContainer = null;
            if (items[i].container instanceof Item) {
                let containersMatch = function (item1, item2) {
                    if (item1.container instanceof Item && item2.container instanceof Item)
                        var result = containersMatch(item1.container, item2.container);
                    else {
                        if (item1.containerName === item2.containerName) return true;
                        else return false;
                    }
                    return result;
                };
                const possibleContainers = roomItems.filter(item =>
                    item.identifier === items[i].container.identifier &&
                    item.containerName === items[i].container.containerName &&
                    item.slot === items[i].container.slot &&
                    (item.uses === items[i].container.uses || isNaN(item.uses) && isNaN(items[i].container.uses)) &&
                    item.description === items[i].container.description
                );
                for (let j = 0; j < possibleContainers.length; j++) {
                    if (containersMatch(items[i].container, possibleContainers[j])) {
                        itemContainer = possibleContainers[j];
                        break;
                    }
                }
            }
            else itemContainer = items[i].container;
            matchedItem.container = itemContainer;
            matchedItem.weight = items[i].weight;
            matchedItem.inventory = items[i].inventory;
            // Update container's references to this item.
            if (items[i].container instanceof Item) {
                let foundItem = false;
                for (let slot = 0; slot < items[i].container.inventory.length; slot++) {
                    if (items[i].container.inventory[slot].name === items[i].slot) {
                        const containerSlot = items[i].container.inventory[slot];
                        for (let j = 0; j < containerSlot.item.length; j++) {
                            if (containerSlot.item[j].prefab.id === items[i].prefab.id &&
                                containerSlot.item[j].identifier === items[i].identifier &&
                                (containerSlot.item[j].uses === items[i].uses || isNaN(containerSlot.item[j].uses) && isNaN(items[i].uses)) &&
                                containerSlot.item[j].description === items[i].description) {
                                foundItem = true;
                                containerSlot.item.splice(j, 1, matchedItem);
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
            const containerItems = roomItems.filter(item => item.containerName === items[i].containerName);

            const lastRoomItem = roomItems[roomItems.length - 1];
            const lastContainerItem = containerItems[containerItems.length - 1];
            const lastGameItem = game.items[game.items.length - 1];
            var insertRow = -1;
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
            for (var insertIndex = 0; insertIndex < game.items.length; insertIndex++) {
                if (game.items[insertIndex].row === insertRow) {
                    game.items.splice(insertIndex + 1, 0, items[i]);
                    break;
                }
            }
            // Update the rows for all of the items after this.
            for (let j = insertIndex + 1, newRow = insertRow + 1; j < game.items.length; j++ , newRow++)
                game.items[j].row = newRow;
        }
    }

    return;
};

module.exports.insertInventoryItems = function (game, player, items, slot) {
    var lastNewItem = player.inventory[player.inventory.length - 1].equippedItem !== null ?
        player.inventory[player.inventory.length - 1].equippedItem :
        player.inventory[player.inventory.length - 1].items[0];
    for (let i = 0; i < items.length; i++) {
        // Check if this item already exists in the player's inventory.
        const playerItems = game.inventoryItems.filter(item => item.player.name === player.name);
        let matchedItem = playerItems.find(item =>
            item.prefab !== null &&
            item.prefab.id === items[i].prefab.id &&
            item.identifier === items[i].identifier &&
            item.equipmentSlot === items[i].equipmentSlot &&
            item.containerName === items[i].containerName &&
            item.slot === items[i].slot &&
            (item.uses === items[i].uses || isNaN(item.uses) && isNaN(items[i].uses)) &&
            item.description === items[i].description
        );
        if (matchedItem) {
            if (!isNaN(matchedItem.quantity))
                matchedItem.quantity += items[i].quantity;
            const containerRow = matchedItem.container !== null ? matchedItem.container.row : 0;
            matchedItem.container = items[i].container;
            if (containerRow !== 0 && items[i].container.row === 0) matchedItem.container.row = containerRow;
            matchedItem.weight = items[i].weight;
            matchedItem.inventory = items[i].inventory;
            // Update container's references to this item.
            if (items[i].container instanceof InventoryItem) {
                let foundItem = false;
                for (let slot = 0; slot < items[i].container.inventory.length; slot++) {
                    if (items[i].container.inventory[slot].name === items[i].slot) {
                        const containerSlot = items[i].container.inventory[slot];
                        for (let j = 0; j < containerSlot.item.length; j++) {
                            if (containerSlot.item[j].prefab.id === items[i].prefab.id &&
                                containerSlot.item[j].identifier === items[i].identifier &&
                                (containerSlot.item[j].uses === items[i].uses || isNaN(containerSlot.item[j].uses) && isNaN(items[i].uses)) &&
                                containerSlot.item[j].description === items[i].description) {
                                foundItem = true;
                                containerSlot.item.splice(j, 1, matchedItem);
                                break;
                            }
                        }
                        if (foundItem) break;
                    }
                }
            }
            player.inventory[slot].items.splice(player.inventory[slot].items.length, 0, matchedItem);
        }
        // The player hasn't picked this item up before or it's been modified somehow.
        else {
            // We want to insert this item near items in the same container slot, so get all of the items in that container slot.
            const slotItems = playerItems.filter(item => item.equipmentSlot === items[i].equipmentSlot && item.containerName === items[i].containerName);
            // Just in case there aren't any, get items just within the same container.
            const containerItems = playerItems.filter(item => item.equipmentSlot === items[i].equipmentSlot && item.container !== null && item.container.identifier !== "" && item.container.identifier === items[i].container.identifier);

            const lastSlotItem = slotItems[slotItems.length - 1];
            const lastContainerItem = containerItems[containerItems.length - 1];

            var insertRow = -1;
            // If the list of items in that slot isn't empty, insert the new item.
            if (slotItems.length !== 0)
                insertRow = lastSlotItem.row;
            // If there are none, it might just be that there are no items in that slot yet. Try to at least put it near items in the same container.
            else if (containerItems.length !== 0)
                insertRow = lastContainerItem.row;
            // If there are none, just insert it after the last new item.
            else
                insertRow = lastNewItem.row;
            lastNewItem = items[i];

            // Insert the new item into the inventoryItems list at the appropriate position.
            for (var insertIndex = 0; insertIndex < game.inventoryItems.length; insertIndex++) {
                if (game.inventoryItems[insertIndex].row === insertRow) {
                    game.inventoryItems.splice(insertIndex + 1, 0, items[i]);
                    player.inventory[slot].items.splice(player.inventory[slot].items.length, 0, items[i]);
                    break;
                }
            }
            // Update the rows for all of the inventoryItems after this.
            for (let j = insertIndex + 1, newRow = insertRow + 1; j < game.inventoryItems.length; j++ , newRow++)
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

    return;
};

function generateIdentifier(prefab) {
    var identifier = "";
    if (prefab.inventory.length > 0) {
        identifier = prefab.id;
        var number = 1;
        while (game.items.find(item => item.identifier === `${identifier} ${number}` && item.quantity !== 0) ||
            game.inventoryItems.find(item => item.identifier === `${identifier} ${number}` && item.quantity !== 0))
            number++;
        identifier = `${identifier} ${number}`;
    }
    return identifier;
}
