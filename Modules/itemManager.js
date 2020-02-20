const settings = include('settings.json');
var game = include('game.json');

const Object = include(`${settings.dataDir}/Object.js`);
const Item = include(`${settings.dataDir}/Item.js`);
const Puzzle = include(`${settings.dataDir}/Puzzle.js`);
const InventoryItem = include(`${settings.dataDir}/InventoryItem.js`);
const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

module.exports.replaceInventoryItem = function (item, newPrefab) {
    item.player.carryWeight -= item.weight * item.quantity;
    item.prefab = newPrefab;
    item.name = newPrefab.name;
    item.pluralName = newPrefab.pluralName;
    item.singleContainingPhrase = newPrefab.singleContainingPhrase;
    item.pluralContainingPhrase = newPrefab.pluralContainingPhrase;
    item.uses = newPrefab.uses;
    item.weight = newPrefab.weight;
    item.player.carryWeight += item.weight * item.quantity;
    // TODO: Add destroy method that properly destroys and deallocates all child items.
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

    game.queue.push(new QueueEntry(Date.now(), "updateRow", item.itemCells(), `Inventory Items!|${item.player.name}|${item.equipmentSlot}|${item.containerName}`, [item.player.name, item.prefab.id, item.equipmentSlot, item.containerName, item.quantity.toString(), item.uses.toString(), item.description]));
};

module.exports.destroyInventoryItem = function (item) {
    // Get the row number of the EquipmentSlot that the item is being unequipped from.
    var rowNumber = 0;
    for (var slot = 0; slot < item.player.inventory.length; slot++) {
        if (item.player.inventory[slot].name === item.equipmentSlot) {
            rowNumber = item.player.inventory[slot].row;
            break;
        }
    }

    // Replace this inventory slot with a null item.
    const nullItem = new InventoryItem(
        item.player,
        null,
        item.equipmentSlot,
        "",
        null,
        null,
        "",
        rowNumber
    );
    item.player.inventory[slot].equippedItem = null;
    item.player.inventory[slot].items.length = 0;
    item.player.inventory[slot].items.push(nullItem);
    item.player.carryWeight -= item.weight * item.quantity;
    // Replace the equipped item's entry in the inventoryItems list.
    for (let i = 0; i < game.inventoryItems.length; i++) {
        if (game.inventoryItems[i].row === item.row) {
            game.inventoryItems.splice(i, 1, nullItem);
            break;
        }
    }
    game.queue.push(new QueueEntry(Date.now(), "updateRow", nullItem.itemCells(), `Inventory Items!|${item.player.name}|${nullItem.equipmentSlot}|${nullItem.containerName}`, [item.player.name, "NULL", nullItem.equipmentSlot, "", "", "", "", ""]));
};

// This recursive function is used to convert Items to InventoryItems.
module.exports.convertItem = function (item, player, hand, quantity) {
    // Make a copy of the Item as an InventoryItem.
    var createdItem = new InventoryItem(
        player,
        item.prefab,
        hand,
        item.container && item.container.prefab ? item.container.prefab.id + '/' + item.slot : "",
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
    else if (container instanceof Item) containerName = "Item: " + container.prefab.id + '/' + slotName;
    else if (container instanceof InventoryItem) containerName = "Item: " + container.prefab.id + '/' + item.slot;
    // Make a copy of the Item as an InventoryItem.
    var createdItem = new Item(
        item.prefab,
        player.location,
        container instanceof Puzzle ? container.accessible && container.solved : true,
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
};

module.exports.insertItems = function (game, player, items) {
    for (let i = 0; i < items.length; i++) {
        // Check if the player is putting this item back in original spot unmodified.
        const roomItems = game.items.filter(item => item.location.name === player.location.name);
        let matchedItem = roomItems.find(item =>
            item.prefab.id === items[i].prefab.id &&
            item.accessible &&
            item.containerName === items[i].containerName &&
            item.slot === items[i].slot &&
            (item.uses === items[i].uses || isNaN(item.uses) && isNaN(items[i].uses)) &&
            item.description === items[i].description
        );
        if (matchedItem) {
            if (!isNaN(matchedItem.quantity)) {
                matchedItem.quantity += items[i].quantity;
                game.queue.push(new QueueEntry(Date.now(), "updateCell", matchedItem.quantityCell(), `Items!${matchedItem.prefab.id}|${matchedItem.location.name}|${matchedItem.containerName}`, matchedItem.quantity));
            }
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
                    item.prefab.id === items[i].container.prefab.id &&
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
                            if (containerSlot.item[j].prefab.id === items[i].prefab.id) {
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
            let data = [[
                items[i].prefab.id,
                items[i].location.name,
                items[i].accessible,
                items[i].containerName,
                items[i].quantity.toString(),
                !isNaN(items[i].uses) ? items[i].uses.toString() : "",
                items[i].description
            ]];

            // We want to insert this item near items in the same container, so get all of the items in that container.
            const containerItems = roomItems.filter(item => item.containerName === items[i].containerName);

            const lastRoomItem = roomItems[roomItems.length - 1];
            const lastContainerItem = containerItems[containerItems.length - 1];
            const lastGameItem = game.items[game.items.length - 1];
            var insertRow = -1;
            // If the list of items in that container isn't empty and isn't the last row of the spreadsheet, insert the new item.
            if (containerItems.length !== 0 && lastContainerItem.row !== lastGameItem.row) {
                game.queue.push(new QueueEntry(Date.now(), "insertData", lastContainerItem.itemCells(), `Items!${lastContainerItem.prefab.id}|${lastContainerItem.location.name}|${lastContainerItem.containerName}`, data));
                insertRow = lastContainerItem.row;
            }
            // If there are none, it might just be that there are no items in that container yet. Try to at least put it near items in the same room.
            else if (roomItems.length !== 0 && lastRoomItem.row !== lastGameItem.row) {
                game.queue.push(new QueueEntry(Date.now(), "insertData", lastRoomItem.itemCells(), `Items!${lastRoomItem.prefab.id}|${lastRoomItem.location.name}|${lastRoomItem.containerName}`, data));
                insertRow = lastRoomItem.row;
            }
            // If there are none, just insert it at the end of the sheet.
            else {
                game.queue.push(new QueueEntry(Date.now(), "insertData", lastGameItem.itemCells(), `Items!${lastGameItem.prefab.id}|${lastGameItem.location.name}|${lastGameItem.containerName}`, data));
                insertRow = lastGameItem.row;
            }

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
    var lastNewItem = player.inventory[player.inventory.length - 1].equippedItem;
    for (let i = 0; i < items.length; i++) {
        // Check if this item already exists in the player's inventory.
        const playerItems = game.inventoryItems.filter(item => item.player.id === player.id);
        let matchedItem = playerItems.find(item =>
            item.prefab !== null &&
            item.prefab.id === items[i].prefab.id &&
            item.equipmentSlot === items[i].equipmentSlot &&
            item.containerName === items[i].containerName &&
            item.slot === items[i].slot &&
            (item.uses === items[i].uses || isNaN(item.uses) && isNaN(items[i].uses)) &&
            item.description === items[i].description
        );
        if (matchedItem) {
            if (!isNaN(matchedItem.quantity)) {
                matchedItem.quantity += items[i].quantity;
                game.queue.push(new QueueEntry(Date.now(), "updateCell", matchedItem.quantityCell(), `Inventory Items!${matchedItem.prefab.id}|${player.name}|${matchedItem.equipmentSlot}|${matchedItem.containerName}`, matchedItem.quantity));
            }
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
                            if (containerSlot.item[j].prefab.id === items[i].prefab.id) {
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
            let data = [[
                player.name,
                items[i].prefab.id,
                items[i].equipmentSlot,
                items[i].containerName,
                isNaN(items[i].quantity) ? "" : items[i].quantity,
                isNaN(items[i].uses) ? "" : items[i].uses,
                items[i].description
            ]];

            // We want to insert this item near items in the same container slot, so get all of the items in that container slot.
            const slotItems = playerItems.filter(item => item.equipmentSlot === items[i].equipmentSlot && item.containerName === items[i].containerName);
            // Just in case there aren't any, get items just within the same container.
            const containerItems = playerItems.filter(item => item.equipmentSlot === items[i].equipmentSlot && item.container !== null && item.container.prefab !== null && item.container.prefab.id === items[i].container.prefab.id);

            const lastSlotItem = slotItems[slotItems.length - 1];
            const lastContainerItem = containerItems[containerItems.length - 1];

            var insertRow = -1;
            // If the list of items in that slot isn't empty, insert the new item.
            if (slotItems.length !== 0) {
                game.queue.push(new QueueEntry(Date.now(), "insertData", lastSlotItem.itemCells(), `Inventory Items!${lastSlotItem.prefab.id}|${player.name}|${lastSlotItem.equipmentSlot}|${lastSlotItem.containerName}`, data));
                insertRow = lastSlotItem.row;
            }
            // If there are none, it might just be that there are no items in that slot yet. Try to at least put it near items in the same container.
            else if (containerItems.length !== 0) {
                game.queue.push(new QueueEntry(Date.now(), "insertData", lastContainerItem.itemCells(), `Inventory Items!${lastContainerItem.prefab.id}|${player.name}|${lastContainerItem.equipmentSlot}|${lastContainerItem.containerName}`, data));
                insertRow = lastContainerItem.row;
            }
            // If there are none, just insert it after the last new item.
            else {
                game.queue.push(new QueueEntry(Date.now(), "insertData", lastNewItem.itemCells(), `Inventory Items!|${player.name}|${lastNewItem.equipmentSlot}|${lastNewItem.containerName}`, data));
                insertRow = lastNewItem.row;
            }
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
