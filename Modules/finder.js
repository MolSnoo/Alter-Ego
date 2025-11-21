var game = require('../game.json');

module.exports.findRoom = function (name) {
    if (name) name = name.toLowerCase().replace(/\'/g, '').replace(/ /g, '-');

    return game.rooms.find(room => room.name === name);
};

module.exports.findObject = function (name, location) {
    if (name) name = name.toUpperCase().replace(/\'/g, '');
    if (location) location = location.toLowerCase().replace(/\'/g, '').replace(/ /g, '-');

    if (location)
        return game.objects.find(object => object.name === name && object.location.name === location);
    else return game.objects.find(object => object.name === name);
};

module.exports.findPrefab = function (id) {
    if (id) id = id.toUpperCase().replace(/\'/g, '');

    return game.prefabs.find(prefab => prefab.id === id);
};

module.exports.findItem = function (identifier, location, containerName) {
    if (identifier) identifier = identifier.toUpperCase().replace(/\'/g, '');
    if (location) location = location.toLowerCase().replace(/\'/g, '').replace(/ /g, '-');
    if (containerName && containerName.includes(':')) containerName = containerName.substring(0, containerName.indexOf(':')) + containerName.substring(containerName.indexOf(':')).toUpperCase().replace(/\'/g, '');

    if (location && containerName)
        return game.items.find(item =>
            (item.identifier !== "" && item.identifier === identifier || item.prefab.id === identifier)
            && item.location.name === location
            && item.containerName === containerName
            && item.quantity !== 0
        );
    else if (location)
        return game.items.find(item => (item.identifier !== "" && item.identifier === identifier || item.prefab.id === identifier)
            && item.location.name === location
            && item.quantity !== 0
        );
    else return game.items.find(item => (item.identifier !== "" && item.identifier === identifier || item.prefab.id === identifier) && item.quantity !== 0);
};

module.exports.findPuzzle = function (name, location) {
    if (name) name = name.toUpperCase().replace(/\'/g, '');
    if (location) location = location.toLowerCase().replace(/\'/g, '').replace(/ /g, '-');

    if (location)
        return game.puzzles.find(puzzle => puzzle.name === name && puzzle.location.name === location);
    else return game.puzzles.find(puzzle => puzzle.name === name);
};

module.exports.findEvent = function (name) {
    if (name) name = name.toUpperCase().replace(/\'/g, '');

    return game.events.find(event => event.name === name);
};

module.exports.findStatusEffect = function (name) {
    if (name) name = name.toLowerCase();

    return game.statusEffects.find(statusEffect => statusEffect.name === name);
};

module.exports.findPlayer = function (name) {
    if (name) name = name.toLowerCase();

    return game.players.find(player => player.name.toLowerCase() === name);
};

module.exports.findLivingPlayer = function (name) {
    if (name) name = name.toLowerCase();

    return game.players_alive.find(player => player.name.toLowerCase() === name);
};

module.exports.findDeadPlayer = function (name) {
    if (name) name = name.toLowerCase();

    return game.players_dead.find(player => player.name.toLowerCase() === name);
};

module.exports.findInventoryItem = function (identifier, player, containerName, equipmentSlot) {
    if (identifier) identifier = identifier.toUpperCase().replace(/\'/g, '');
    if (player) player = player.toLowerCase();
    if (containerName) containerName = containerName.toUpperCase().replace(/\'/g, '');
    if (equipmentSlot) equipmentSlot = equipmentSlot.toUpperCase().replace(/\'/g, '');

    if (player && containerName && equipmentSlot)
        return game.inventoryItems.find(inventoryItem =>
            inventoryItem.prefab !== null
            && (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.containerName === containerName
            && inventoryItem.equipmentSlot === equipmentSlot
            && inventoryItem.quantity !== 0
        );
    else if (player && containerName)
        return game.inventoryItems.find(inventoryItem =>
            inventoryItem.prefab !== null
            && (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.containerName === containerName
            && inventoryItem.quantity !== 0
        );
	else if (player && equipmentSlot)
        return game.inventoryItems.find(inventoryItem =>
            inventoryItem.prefab !== null
            && (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.equipmentSlot === equipmentSlot
            && inventoryItem.quantity !== 0
        );
    else if (player)
        return game.inventoryItems.find(inventoryItem =>
            inventoryItem.prefab !== null
            && (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.quantity !== 0
        );
    else return game.inventoryItems.find(inventoryItem =>
        inventoryItem.prefab !== null
        && (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
        && inventoryItem.quantity !== 0
    );
};

module.exports.findFlag = function (id, evaluate = false) {
    if (id) id = id.toUpperCase().replace(/\'/g, '');

    const flag = game.flags.get(id);
    if (flag && flag.valueScript && evaluate) {
        const value = flag.evaluate();
        flag.setValue(value);
    }
    return flag ? flag.value : flag;
};
