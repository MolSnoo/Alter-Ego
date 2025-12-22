import GameEntity from "../Data/GameEntity.js";

/** 
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} id - The ID or displayName of the room.
 * @returns The room with the specified ID. If no such room exists, returns undefined.
 */
export function findRoom(container, id) {
    return container.getGame().entityFinder.getRoom(id);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} name - The name of the fixture. 
 * @param {string} [location] - The ID or displayName of the room the fixture is in. 
 * @returns The fixture with the specified name and location, if applicable. If no such fixture exists, returns undefined.
 */
export function findFixture(container, name, location) {
    return container.getGame().entityFinder.getFixture(name, location);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} id - The prefab's ID.
 * @returns The prefab with the specified ID. If no such prefab exists, returns undefined.
 */
export function findPrefab(container, id) {
    return container.getGame().entityFinder.getPrefab(id);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} identifier - The room item's identifier or prefab ID.
 * @param {string} [location] - The ID or displayName of the room the item is in. 
 * @param {string} [containerName] - The room item's container name.
 * @returns The room item with the specified identifier, and location and container name if applicable. If no such item exists, returns undefined.
 */
export function findRoomItem(container, identifier, location, containerName) {
    return container.getGame().entityFinder.getRoomItem(identifier, location, containerName);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} name - The name of the puzzle. 
 * @param {string} [location] - The ID or displayName of the room the puzzle is in. 
 * @returns The puzzle with the specified name and location, if applicable. If no such puzzle exists, returns undefined.
 */
export function findPuzzle(container, name, location) {
    return container.getGame().entityFinder.getPuzzle(name, location);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} id - The event's ID.
 * @returns The event with the specified ID. If no such event exists, returns undefined.
 */
export function findEvent(container, id) {
    return container.getGame().entityFinder.getEvent(id);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} id - The status effect's ID.
 * @returns The status effect with the specified ID. If no such status effect exists, returns undefined.
 */
export function findStatusEffect(container, id) {
    return container.getGame().entityFinder.getStatusEffect(id);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} name - The player's name. 
 * @returns The player with the specified name. If no such player exists, returns undefined.
 */
export function findPlayer(container, name) {
    return container.getGame().entityFinder.getPlayer(name);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} name - The player's name. 
 * @returns The living player with the specified name. If no such player exists, returns undefined.
 */
export function findLivingPlayer(container, name) {
    return container.getGame().entityFinder.getLivingPlayer(name);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} name - The player's name. 
 * @returns The dead player with the specified name. If no such player exists, returns undefined.
 */
export function findDeadPlayer(container, name) {
    return container.getGame().entityFinder.getDeadPlayer(name);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} identifier - The inventory item's identifier or prefab ID.
 * @param {string} [player] - The name of the player the inventory item belongs to.
 * @param {string} [containerName] - The inventory item's container name.
 * @param {string} [equipmentSlotId] - The ID of the equipment slot the inventory item belongs to.
 * @returns The inventory item with the specified identifier, and player, container name, and equipment slot if applicable. If no such item exists, returns undefined.
 */
export function findInventoryItem(container, identifier, player, containerName, equipmentSlotId) {
    return container.getGame().entityFinder.getInventoryItem(identifier, player, containerName, equipmentSlotId);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} id - The gesture's ID.
 * @returns The gesture with the specified ID. If no such gesture exists, returns undefined.
 */
export function findGesture(container, id) {
    return container.getGame().entityFinder.getGesture(id);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} id - The flag's ID. 
 * @param {boolean} [evaluate] - Whether or not to also evaluate the flag's value script and update its value. Does not execute the flag's set commands. Defaults to false.
 * @returns The flag with the specified ID. If no such flag exists, returns undefined.
 */
export function findFlag(container, id, evaluate = false) {
    return container.getGame().entityFinder.getFlagValue(id, evaluate);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [id] - Filter the rooms to only those whose ID matches the given ID.
 * @param {string} [tag] - Filter the rooms to only those with the given tag.
 * @param {boolean} [occupied] - Filter the rooms to only those who have at least one occupant. If this is `true`, includes NPCs as occupants. If this is `false`, NPCs are not counted.
 */
export function findRooms(container, id, tag, occupied) {
    return container.getGame().entityFinder.getRooms(id, tag, occupied);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [name] - Filter the fixtures to only those whose name matches the given name.
 * @param {string} [location] - Filter the fixtures to only those whose location ID matches the given location ID.
 * @param {boolean} [accessible] - Filter the fixtures to only those who are accessible or not.
 * @param {string} [recipeTag] - Filter the fixtures to only those with the given recipe tag.
 */
export function findFixtures(container, name, location, accessible, recipeTag) {
    return container.getGame().entityFinder.getFixtures(name, location, accessible, recipeTag);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [id] - Filter the prefabs to only those whose ID matches the given ID.
 * @param {string} [effectsString] - Filter the prefabs to only those who inflict the given comma-separated status effects.
 * @param {string} [curesString] - Filter the prefabs to only those who cure the given comma-separated status effects.
 * @param {string} [equipmentSlotsString] - Filter the prefabs to only those who are equippable to the given comma-separated equipment slots.
 */
export function findPrefabs(container, id, effectsString, curesString, equipmentSlotsString) {
    return container.getGame().entityFinder.getPrefabs(id, effectsString, curesString, equipmentSlotsString);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [type] - Filter the recipes to only those of the given type.
 * @param {string} [fixtureTag] - Filter the recipes to only those with the given fixture tag.
 * @param {string} [ingredientsString] - Filter the recipes to only those with the given comma-separated ingredients.
 * @param {string} [productsString] - Filter the recipes to only those with the given comma-separated products.
 */
export function findRecipes(container, type, fixtureTag, ingredientsString, productsString) {
    return container.getGame().entityFinder.getRecipes(type, fixtureTag, ingredientsString, productsString);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [identifier] - Filter the room items to only those whose identifier or prefab ID matches the given identifier in moderator contexts, or its name or plural name in player contexts.
 * @param {string} [location] - Filter the room items to only those whose location ID matches the given location ID.
 * @param {boolean} [accessible] - Filter the room items to only those who are accessible or not.
 * @param {string} [containerName] - Filter the room items to only those with the given container name. Does not include slot.
 * @param {string} [slotId] - Filter the room items to only those in the inventory slot with the given ID.
 */
export function findRoomItems(container, identifier, location, accessible, containerName, slotId) {
    return container.getGame().entityFinder.getRoomItems(identifier, location, accessible, containerName, slotId);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [name] - Filter the puzzles to only those whose name matches the given name.
 * @param {string} [location] - Filter the puzzles to only those whose location ID matches the given location ID.
 * @param {string} [type] - Filter the puzzles to only those of the given type.
 * @param {boolean} [accessible] - Filter the puzzles to only those who are accessible or not.
 */
export function findPuzzles(container, name, location, type, accessible) {
    return container.getGame().entityFinder.getPuzzles(name, location, type, accessible);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [id] - Filter the events to only those whose ID matches the given ID.
 * @param {boolean} [ongoing] - Filter the events to only those that are ongoing or not.
 * @param {string} [roomTag] - Filter the events to only those with the given room tag.
 * @param {string} [effectsString] - Filter the events to only those who inflict the given comma-separated status effects.
 * @param {string} [refreshesString] - Filter the events to only those who refresh the given comma-separated status effects.
 */
export function findEvents(container, id, ongoing, roomTag, effectsString, refreshesString) {
    return container.getGame().entityFinder.getEvents(id, ongoing, roomTag, effectsString, refreshesString);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [id] - Filter the status effects to only those whose ID matches the given ID.
 * @param {string} [modifiedStatsString] - Filter the status effects to only those who modify the given stats.
 * @param {string} [attributesString] - Filter the status effects to only those with the given comma-separated behavior attributes.
 */
export function findStatusEffects(container, id, modifiedStatsString, attributesString) {
    return container.getGame().entityFinder.getStatusEffects(id, modifiedStatsString, attributesString);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [name] - Filter the players to only those whose name or display name matches the given name.
 * @param {boolean} [isNPC] - Filter the players to only those who are NPCs or not.
 * @param {string} [location] - Filter the players to only those whose location ID matches the given location ID.
 * @param {string} [hidingSpot] - Filter the players to only those whose hiding spot matches the given hiding spot.
 * @param {string} [statusString] - Filter the players to only those inflicted with all of the given comma-separated status effects.
 */
export function findLivingPlayers(container, name, isNPC, location, hidingSpot, statusString) {
    return container.getGame().entityFinder.getLivingPlayers(name, isNPC, location, hidingSpot, statusString);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [name] - Filter the players to only those whose name or display name matches the given name.
 * @param {boolean} [isNPC] - Filter the players to only those who are NPCs or not.
 */
export function findDeadPlayers(container, name, isNPC) {
    return container.getGame().entityFinder.getDeadPlayers(name, isNPC);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [identifier] - Filter the inventory items to only those whose identifier or prefab ID matches the given identifier in moderator contexts, or its name or plural name in player contexts.
 * @param {string} [player] - Filter the inventory items to only those belonging to the given player. 
 * @param {string} [containerName] - Filter the inventory items to only those with the given container name. Does not include slot.
 * @param {string} [slotId] - Filter the inventory items to only those in the inventory slot with the given ID.
 * @param {string} [equipmentSlotId] - Filter the inventory items to only those belonging to the equipment slot with the given ID.
 */
export function findInventoryItems(container, identifier, player, containerName, slotId, equipmentSlotId) {
    return container.getGame().entityFinder.getInventoryItems(identifier, player, containerName, slotId, equipmentSlotId);
}

/**
 * Gests all gestures that match the given search queries.
 * @param {GameEntity} container - The container in context.
 * @param {string} [id] - Filters the gestures to only those whose ID matches the given ID.
 */
export function findGestures(container, id) {
    return container.getGame().entityFinder.getGestures(id);
}

/**
 * Wrapper function for the limited scope of  the scriptParser module.
 * Do not use this outside of that context.
 * @param {GameEntity} container - The container in context.
 * @param {string} [id] - Filters the flags to only those whose ID matches the given ID.
 */
export function findFlags(container, id) {
    return container.getGame().entityFinder.getFlags(id);
}
