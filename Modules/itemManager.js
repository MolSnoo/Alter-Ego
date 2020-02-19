const settings = include('settings.json');
var game = include('game.json');

const Item = include(`${settings.dataDir}/Item.js`);
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
