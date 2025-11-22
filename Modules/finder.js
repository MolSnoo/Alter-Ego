var game = require('../game.json');

module.exports.findRoom = function (name) {
    if (name) name = name.toLowerCase().replace(/\'/g, '').trim().replace(/ /g, '-');

    return game.rooms.find(room => room.name === name);
};

module.exports.findRooms = function (name) {
    if (name) {
        name = name.toLowerCase().replace(/\'/g, '').trim().replace(/ /g, '-');
        return game.rooms.filter(room => room.name.includes(name));
    }
    else return game.rooms;
};

module.exports.findObject = function (name, location) {
    if (name) name = name.toUpperCase().replace(/\'/g, '').trim();
    if (location) location = location.toLowerCase().replace(/\'/g, '').trim().replace(/ /g, '-');

    if (location)
        return game.objects.find(object => object.name === name && object.location.name === location);
    else return game.objects.find(object => object.name === name);
};

module.exports.findObjects = function (name, location) {
    if (name) name = name.toUpperCase().replace(/\'/g, '').trim();
    if (location) location = location.toLowerCase().replace(/\'/g, '').trim().replace(/ /g, '-');

    if (name && location) return game.objects.filter(object => object.name.includes(name) && object.location.name === location);
    else if (location) return game.objects.filter(object => object.location.name === location);
    else if (name) return game.objects.filter(object => object.name.includes(name));
    else return game.objects;
};

module.exports.findPrefab = function (id) {
    if (id) id = id.toUpperCase().replace(/\'/g, '').trim();

    return game.prefabs.find(prefab => prefab.id === id);
};

module.exports.findPrefabs = function (id) {
    if (id) {
        id = id.toUpperCase().replace(/\'/g, '').trim();
        return game.prefabs.filter(prefab => prefab.id.includes(id) || prefab.name.includes(id) || prefab.pluralName.includes(id));
    }
    else return game.prefabs;
};

module.exports.findRecipes = function (type, ingredients, products) {
    if (type) type = type.toLowerCase();
    if (ingredients) {
        ingredients.forEach((ingredient, i) => ingredients[i] = ingredient.toUpperCase().replace(/\'/g, '').trim());
        ingredients.sort();
    }
    if (products) {
        products.forEach((product, i) => products[i] = product.toUpperCase().replace(/\'/g, '').trim());
        products.sort();
    }
    const typeMatch = (recipe) => {
        return type === "crafting" && recipe.objectTag === "" ? true : type === "processing" && recipe.objectTag !== "" ? true : false;
    };

    if (type && ingredients && products)
        return game.recipes.filter(recipe => {
                const recipeIngredients = recipe.ingredients.map(ingredient => ingredient.id);
                const recipeProducts = recipe.products.map(product => product.id);
                return typeMatch(recipe)
                && ingredients.every(ingredient => recipeIngredients.includes(ingredient))
                && products.every(product => recipeProducts.includes(product))
            }
        );
    else if (ingredients && products)
        return game.recipes.filter(recipe => {
                const recipeIngredients = recipe.ingredients.map(ingredient => ingredient.id);
                const recipeProducts = recipe.products.map(product => product.id);
                return ingredients.every(ingredient => recipeIngredients.includes(ingredient))
                && products.every(product => recipeProducts.includes(product))
            }
        );
    else if (type && ingredients)
        return game.recipes.filter(recipe => {
                const recipeIngredients = recipe.ingredients.map(ingredient => ingredient.id);
                return typeMatch(recipe)
                && ingredients.every(ingredient => recipeIngredients.includes(ingredient))
            }
        );
    else if (ingredients)
        return game.recipes.filter(recipe => {
                const recipeIngredients = recipe.ingredients.map(ingredient => ingredient.id);
                return ingredients.every(ingredient => recipeIngredients.includes(ingredient))
            }
        );
    else if (type && products)
        return game.recipes.filter(recipe => {
                const recipeProducts = recipe.products.map(product => product.id);
                return typeMatch(recipe)
                && products.every(product => recipeProducts.includes(product))
            }
        );
    else if (products)
        return game.recipes.filter(recipe => {
                const recipeProducts = recipe.products.map(product => product.id);
                return products.every(product => recipeProducts.includes(product))
            }
        );
    else if (type)
        return game.recipes.filter(recipe => typeMatch(recipe));
    else return game.recipes;
};

module.exports.findItem = function (identifier, location, containerName) {
    if (identifier) identifier = identifier.toUpperCase().replace(/\'/g, '').trim();
    if (location) location = location.toLowerCase().replace(/\'/g, '').trim().replace(/ /g, '-');
    if (containerName && containerName.includes(':')) containerName = containerName.substring(0, containerName.indexOf(':')) + containerName.substring(containerName.indexOf(':')).toUpperCase().replace(/\'/g, '').trim();

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

module.exports.findItems = function (identifier, location, containerName, slot) {
    if (identifier) identifier = identifier.toUpperCase().replace(/\'/g, '').trim();
    if (location) location = location.toLowerCase().replace(/\'/g, '').trim().replace(/ /g, '-');
    if (containerName) containerName = containerName.toUpperCase().replace(/\'/g, '').trim();
    if (slot) slot = slot.toUpperCase().replace(/\'/g, '').trim();

    if (identifier && location && containerName && slot)
        return game.items.filter(item =>
            (item.identifier !== "" && item.identifier.includes(identifier)
                || item.prefab.id.includes(identifier)
                || item.name.includes(identifier)
                || item.pluralName.includes(identifier))
            && item.location.name === location
            && (item.container.hasOwnProperty("identifier") && item.container.identifier !== "" && item.container.identifier.includes(containerName)
                || item.container.name.includes(containerName)
                || item.container.hasOwnProperty("pluralName") && item.container.pluralName !== "" && item.container.pluralName.includes(containerName))
            && item.slot === slot
            && item.quantity !== 0
        );
    else if (location && containerName && slot)
        return game.items.filter(item =>
            item.location.name === location
            && (item.container.hasOwnProperty("identifier") && item.container.identifier !== "" && item.container.identifier.includes(containerName)
                || item.container.name.includes(containerName)
                || item.container.hasOwnProperty("pluralName") && item.container.pluralName !== "" && item.container.pluralName.includes(containerName))
            && item.slot === slot
            && item.quantity !== 0
        );
    else if (identifier && location && containerName)
        return game.items.filter(item =>
            (item.identifier !== "" && item.identifier.includes(identifier)
                || item.prefab.id.includes(identifier)
                || item.name.includes(identifier)
                || item.pluralName.includes(identifier))
            && item.location.name === location
            && (item.container.hasOwnProperty("identifier") && item.container.identifier !== "" && item.container.identifier.includes(containerName)
                || item.container.name.includes(containerName)
                || item.container.hasOwnProperty("pluralName") && item.container.pluralName !== "" && item.container.pluralName.includes(containerName))
            && item.quantity !== 0
        );
    else if (location && containerName)
        return game.items.filter(item =>
            item.location.name === location
            && (item.container.hasOwnProperty("identifier") && item.container.identifier !== "" && item.container.identifier.includes(containerName)
                || item.container.name.includes(containerName)
                || item.container.hasOwnProperty("pluralName") && item.container.pluralName !== "" && item.container.pluralName.includes(containerName))
            && item.quantity !== 0
        );
    else if (identifier && location)
        return game.items.filter(item => (item.identifier !== "" && item.identifier.includes(identifier) || item.prefab.id.includes(identifier) || item.name.includes(identifier) || item.pluralName.includes(identifier))
            && item.location.name === location
            && item.quantity !== 0
        );
    else if (location) return game.items.filter(item => item.location.name === location && item.quantity !== 0);
    else if (identifier) return game.items.filter(item => (item.identifier !== "" && item.identifier.includes(identifier) || item.prefab.id.includes(identifier) || item.name.includes(identifier) || item.pluralName.includes(identifier)) && item.quantity !== 0);
    else return game.items.filter(item => item.quantity !== 0)
};

module.exports.findPuzzle = function (name, location) {
    if (name) name = name.toUpperCase().replace(/\'/g, '').trim();
    if (location) location = location.toLowerCase().replace(/\'/g, '').trim().replace(/ /g, '-');

    if (location)
        return game.puzzles.find(puzzle => puzzle.name === name && puzzle.location.name === location);
    else return game.puzzles.find(puzzle => puzzle.name === name);
};

module.exports.findPuzzles = function (name, location) {
    if (name) name = name.toUpperCase().replace(/\'/g, '').trim();
    if (location) location = location.toLowerCase().replace(/\'/g, '').trim().replace(/ /g, '-');

    if (name && location) return game.puzzles.filter(puzzle => puzzle.name.includes(name) && puzzle.location.name === location);
    else if (location) return game.puzzles.filter(puzzle => puzzle.location.name === location);
    else if (name) return game.puzzles.filter(puzzle => puzzle.name.includes(name));
    else return game.puzzles;
};

module.exports.findEvent = function (name) {
    if (name) name = name.toUpperCase().replace(/\'/g, '').trim();

    return game.events.find(event => event.name === name);
};

module.exports.findEvents = function (name) {
    if (name) {
        name = name.toUpperCase().replace(/\'/g, '').trim();
        return game.events.filter(event => event.name.includes(name));
    }
    else return game.events;
};

module.exports.findStatusEffect = function (name) {
    if (name) name = name.toLowerCase().trim();

    return game.statusEffects.find(statusEffect => statusEffect.name === name);
};

module.exports.findStatusEffects = function (name) {
    if (name) {
        name = name.toLowerCase().trim();
        return game.statusEffects.filter(statusEffect => statusEffect.name.includes(name));
    }
    else return game.statusEffects;
};

module.exports.findPlayer = function (name) {
    if (name) name = name.toLowerCase().trim();

    return game.players.find(player => player.name.toLowerCase() === name);
};

module.exports.findPlayers = function (name) {
    if (name) {
        name = name.toLowerCase().trim();
        return game.players.filter(player => player.name.toLowerCase().includes(name) || player.displayName.toLowerCase().includes(name));
    }
    else return game.players;
};

module.exports.findLivingPlayer = function (name) {
    if (name) name = name.toLowerCase().trim();

    return game.players_alive.find(player => player.name.toLowerCase() === name);
};

module.exports.findLivingPlayers = function (name) {
    if (name) {
        name = name.toLowerCase().trim();
        return game.players_alive.filter(player => player.name.toLowerCase().includes(name) || player.displayName.toLowerCase().includes(name));
    }
    else return game.players_alive;
};

module.exports.findDeadPlayer = function (name) {
    if (name) name = name.toLowerCase().trim();

    return game.players_dead.find(player => player.name.toLowerCase() === name);
};

module.exports.findDeadPlayers = function (name) {
    if (name) {
        name = name.toLowerCase().trim();
        return game.players_dead.filter(player => player.name.toLowerCase().includes(name) || player.displayName.toLowerCase().includes(name));
    }
    else return game.players_dead;
};

module.exports.findInventoryItem = function (identifier, player, containerName, equipmentSlot) {
    if (identifier) identifier = identifier.toUpperCase().replace(/\'/g, '').trim();
    if (player) player = player.toLowerCase().trim();
    if (containerName) containerName = containerName.toUpperCase().replace(/\'/g, '').trim();
    if (equipmentSlot) equipmentSlot = equipmentSlot.toUpperCase().replace(/\'/g, '').trim();

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

module.exports.findInventoryItems = function (identifier, player, containerName, slot, equipmentSlot) {
    if (identifier) identifier = identifier.toUpperCase().replace(/\'/g, '').trim();
    if (player) player = player.toLowerCase().trim();
    if (containerName) containerName = containerName.toUpperCase().replace(/\'/g, '').trim();
    if (slot) slot = slot.toUpperCase().replace(/\'/g, '').trim();
    if (equipmentSlot) equipmentSlot = equipmentSlot.toUpperCase().replace(/\'/g, '').trim();

    if (identifier && player && containerName && slot)
        return game.inventoryItems.filter(inventoryItem =>
            inventoryItem.prefab !== null
            && (inventoryItem.identifier !== "" && inventoryItem.identifier.includes(identifier)
                || inventoryItem.prefab.id.includes(identifier) || inventoryItem.name.includes(identifier) || inventoryItem.pluralName.includes(identifier))
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.container !== null
                && (inventoryItem.container.identifier.includes(containerName)
                || inventoryItem.container.name.includes(containerName)
                || inventoryItem.container.pluralName.includes(containerName))
            && inventoryItem.slot === slot
            && inventoryItem.quantity !== 0
        );
    else if (player && containerName && slot)
        return game.inventoryItems.filter(inventoryItem =>
            inventoryItem.prefab !== null
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.container !== null
                && (inventoryItem.container.identifier.includes(containerName)
                || inventoryItem.container.name.includes(containerName)
                || inventoryItem.container.pluralName.includes(containerName))
            && inventoryItem.slot === slot
            && inventoryItem.quantity !== 0
        );
    else if (identifier && player && containerName)
        return game.inventoryItems.filter(inventoryItem =>
            inventoryItem.prefab !== null
            && (inventoryItem.identifier !== "" && inventoryItem.identifier.includes(identifier)
                || inventoryItem.prefab.id.includes(identifier) || inventoryItem.name.includes(identifier) || inventoryItem.pluralName.includes(identifier))
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.container !== null
                && (inventoryItem.container.identifier.includes(containerName)
                || inventoryItem.container.name.includes(containerName)
                || inventoryItem.container.pluralName.includes(containerName))
            && inventoryItem.quantity !== 0
        );
    else if (player && containerName)
        return game.inventoryItems.filter(inventoryItem =>
            inventoryItem.prefab !== null
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.container !== null
                && (inventoryItem.container.identifier.includes(containerName)
                || inventoryItem.container.name.includes(containerName)
                || inventoryItem.container.pluralName.includes(containerName))
            && inventoryItem.quantity !== 0
        );
    else if (identifier && player)
        return game.inventoryItems.filter(inventoryItem =>
            inventoryItem.prefab !== null
            && (inventoryItem.identifier !== "" && inventoryItem.identifier.includes(identifier)
                || inventoryItem.prefab.id.includes(identifier) || inventoryItem.name.includes(identifier) || inventoryItem.pluralName.includes(identifier))
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.quantity !== 0
        );
    else if (player && equipmentSlot)
        return game.inventoryItems.filter(inventoryItem =>
            inventoryItem.prefab !== null
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.equipmentSlot === equipmentSlot
            && inventoryItem.quantity !== 0
        );
    else if (player)
        return game.inventoryItems.filter(inventoryItem =>
            inventoryItem.prefab !== null
            && inventoryItem.player.name.toLowerCase() === player
            && inventoryItem.quantity !== 0
        );
    else if (equipmentSlot)
        return game.inventoryItems.filter(inventoryItem =>
            inventoryItem.prefab !== null
            && inventoryItem.equipmentSlot === equipmentSlot
            && inventoryItem.quantity !== 0
        );
    else if (identifier)
        return game.inventoryItems.filter(inventoryItem =>
            inventoryItem.prefab !== null
            && (inventoryItem.identifier !== "" && inventoryItem.identifier.includes(identifier)
                || inventoryItem.prefab.id.includes(identifier) || inventoryItem.name.includes(identifier) || inventoryItem.pluralName.includes(identifier))
            && inventoryItem.quantity !== 0
        );
    else return game.inventoryItems.filter(inventoryItem => inventoryItem.prefab !== null && inventoryItem.quantity !== 0);
};

module.exports.findGestures = function (name) {
    if (name) {
        name = name.toLowerCase().replace(/\'/g, '').trim();
        return game.gestures.filter(gesture => gesture.name.includes(name));
    }
    else return game.gestures;
}

module.exports.findFlag = function (id, evaluate = false) {
    if (id) id = id.toUpperCase().replace(/[\'"“”`]/g, '').trim();

    const flag = game.flags.get(id);
    if (flag && flag.valueScript && evaluate) {
        const value = flag.evaluate();
        flag.setValue(value);
    }
    return flag ? flag.value : flag;
};

module.exports.findFlags = function (id) {
    if (id) id = id.toUpperCase().replace(/[\'"“”`]/g, '').trim();

    const flags = [...game.flags.values()];
    if (id) return flags.filter(flag => flag.id.includes(id));
    else return flags;
};
