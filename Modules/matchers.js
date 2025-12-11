import Event from "../Data/Event.js";
import Fixture from "../Data/Fixture.js";
import Flag from "../Data/Flag.js";
import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import InventoryItem from "../Data/InventoryItem.js";
import ItemInstance from "../Data/ItemInstance.js";
import Player from "../Data/Player.js";
import Prefab from "../Data/Prefab.js";
import Puzzle from "../Data/Puzzle.js";
import Recipe from "../Data/Recipe.js";
import Room from "../Data/Room.js";
import RoomItem from "../Data/RoomItem.js";
import Status from "../Data/Status.js";

/**
 * Returns true if the room's ID matches the given ID.
 * @param {Room} room - The room to match the ID against.
 * @param {string} id - The ID to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
 */
export const roomIdMatches = (room, id, normalize = false) => {
	if (normalize) Room.generateValidId(id);
	return room.id === id;
};

/**
 * Returns true if the room's ID contains the given ID.
 * @param {Room} room - The room to match the ID against.
 * @param {string} id - The ID to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
 */
export const roomIdContains = (room, id, normalize = false) => {
	if (normalize) Room.generateValidId(id);
	return room.id.includes(id);
};

/**
 * Returns true if the room's tags include the given tag.
 * @param {Room} room - The room to match the tag against.
 * @param {string} tag - The tag to match.
 * @param {boolean} [normalize] - Whether or not to normalize the tag before matching. Defaults to false.
 */
export const roomTagMatches = (room, tag, normalize = false) => {
	if (normalize) tag = tag.trim();
	return room.tags.includes(tag);
};

/**
 * Returns true if the room has at least 1 occupant. 
 * @param {Room} room - The room for which to check for occupants.
 * @param {boolean} includeNPCs - Whether or not to count NPCs as occupants.
 */
export const roomOccupiedMatches = (room, includeNPCs) => {
	if (room.occupants.length === 0) return false;
	if (!includeNPCs) return room.occupants.filter(occupant => occupant.title !== "NPC").length > 0;
	else return room.occupants.length > 0;
};

/**
 * Returns true if the entity's name matches the given name.
 * @param {Fixture|ItemInstance|Player|Prefab|Puzzle} entity - The entity to match the name against.
 * @param {string} name - The name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
 */
export const entityNameMatches = (entity, name, normalize = false) => {
	if (normalize) name = Game.generateValidEntityName(name);
	return entity.name === name;
};

/**
 * Returns true if the entity's name contains the given name.
 * @param {Fixture|ItemInstance|Player|Prefab|Puzzle} entity - The entity to match the name against.
 * @param {string} name - The name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
 */
export const entityNameContains = (entity, name, normalize = false) => {
	if (normalize) name = Game.generateValidEntityName(name);
	return entity.name.includes(name);
};

/**
 * Returns true if the entity's ID matches the given name.
 * @param {Event|Flag|Prefab} entity - The entity to match the ID against.
 * @param {string} id - The ID to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
 */
export const entityIdMatches = (entity, id, normalize = false) => {
	if (normalize) id = Game.generateValidEntityName(id);
	return entity.id === id;
};

/**
 * Returns true if the entity's ID contains the given name.
 * @param {Event|Flag|Prefab} entity - The entity to match the ID against.
 * @param {string} id - The ID to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
 */
export const entityIdContains = (entity, id, normalize = false) => {
	if (normalize) id = Game.generateValidEntityName(id);
	return entity.id.includes(id);
};

/**
 * Returns true if the entity's location's ID matches the given ID.
 * @param {Fixture|RoomItem|Puzzle|Player} entity - The entity whose location we want to match the ID against.
 * @param {string} id - The ID to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
 */
export const entityLocationIdMatches = (entity, id, normalize = false) => {
	if (normalize) id = Room.generateValidId(id);
	return entity.location.id === id;
};

/**
 * Returns whether or not the entity's accessible property matches the given accessible state.
 * @param {Fixture|RoomItem|Puzzle} entity - The entity to match the accessible state against. 
 * @param {boolean} accessible - The accessible state to match against. 
 */
export const entityAccessibleMatches = (entity, accessible) => {
	return entity.accessible === accessible;
};

/**
 * Returns true if the fixture's recipe tag matches the given recipe tag.
 * @param {Fixture} fixture - The fixture to match the recipe tag against. 
 * @param {string} recipeTag - The recipe tag to match.
 * @param {boolean} [normalize] - Whether or not to normalize the recipe tag before matching. Defaults to false.
 */
export const fixtureRecipeTagMatches = (fixture, recipeTag, normalize = false) => {
	if (normalize) recipeTag = recipeTag.trim();
	return fixture.recipeTag === recipeTag;
};

/**
 * Returns true if the entity's effects strings include all of the given status effects.
 * @param {Prefab|Event} entity - The entity to match the effects against.
 * @param {string} effectsString - A comma-separated list of status effect IDs to match.
 * @param {boolean} [normalize] - Whether or not to normalize the effects before matching. Defaults to false. 
 */
export const effectsMatches = (entity, effectsString, normalize = false) => {
	let effects = effectsString.split(',');
	if (normalize) effects.forEach((effect, i) => effects[i] = Status.generateValidId(effect));
	return effects.every(effect => entity.effectsStrings.includes(effect));
};

/**
 * Returns true if the prefab's cures strings include all of the given status effects.
 * @param {Prefab} prefab - The prefab to match the cures against.
 * @param {string} curesString - A comma-separated list of status effect IDs to match.
 * @param {boolean} [normalize] - Whether or not to normalize the cures before matching. Defaults to false. 
 */
export const prefabCuresMatches = (prefab, curesString, normalize = false) => {
	let cures = curesString.split(',');
	if (normalize) cures.forEach((cure, i) => cures[i] = Status.generateValidId(cure));
	return cures.every(cure => prefab.curesStrings.includes(cure));
};

/**
 * Returns true if the prefab's equipment slot IDs include all of the given equipment slot IDs.
 * @param {Prefab} prefab - The prefab to match the equipment slots against.
 * @param {string} equipmentSlotsString - A comma-separated list of equipment slot IDs to match.
 * @param {boolean} [normalize] - Whether or not to normalize the effects before matching. Defaults to false. 
 */
export const prefabEquipmentSlotsMatches = (prefab, equipmentSlotsString, normalize = false) => {
	let equipmentSlots = equipmentSlotsString.split(',');
	if (normalize) equipmentSlots.forEach((equipmentSlot, i) => equipmentSlots[i] = Game.generateValidEntityName(equipmentSlot));
	return equipmentSlots.every(equipmentSlot => prefab.equipmentSlots.includes(equipmentSlot));
};

/**
 * Returns true if the recipe's type matches the given type.
 * @param {Recipe} recipe - The recipe to match the type against.
 * @param {string} type - The type of recipe to match. Either `processing`, `crafting`, or `uncraftable`.
 * @param {boolean} [normalize] - Whether or not to normalize the type before matching. Defaults to false.
 */
export const recipeTypeMatches = (recipe, type, normalize = false) => {
	if (normalize) type = type.toLowerCase().trim();
	return type === "processing" && recipe.fixtureTag !== "" ? true
        : type === "crafting" && recipe.fixtureTag === "" ? true
        : type === "uncraftable" && recipe.uncraftable ? true
        : false;
};

/**
 * Returns true if the recipe's fixture tag matches the given fixture tag.
 * @param {Recipe} recipe - The recipe to match the fixture tag against. 
 * @param {string} fixtureTag - The fixture tag to match.
 * @param {boolean} [normalize] - Whether or not to normalize the fixture tag before matching. Defaults to false.
 */
export const recipeFixtureTagMatches = (recipe, fixtureTag, normalize = false) => {
	if (normalize) fixtureTag = fixtureTag.trim();
	return recipe.fixtureTag === fixtureTag;
};

/**
 * Returns true if the recipe's ingredients prefab IDs include all of the given prefab IDs.
 * @param {Recipe} recipe - The recipe to match the ingredients against.
 * @param {string} ingredientsString - A comma-separated list of ingredient prefab IDs to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ingredients before matching. Defaults to false. 
 */
export const recipeIngredientsMatches = (recipe, ingredientsString, normalize = false) => {
	let ingredients = ingredientsString.split(',');
	if (normalize) ingredients.forEach((ingredient, i) => ingredients[i] = Game.generateValidEntityName(ingredient));
	return ingredients.every(ingredient => recipe.ingredientsStrings.includes(ingredient));
};

/**
 * Returns true if the recipe's products prefab IDs include all of the given prefab IDs.
 * @param {Recipe} recipe - The recipe to match the products against.
 * @param {string} productsString - A comma-separated list of product prefab IDs to match.
 * @param {boolean} [normalize] - Whether or not to normalize the products before matching. Defaults to false. 
 */
export const recipeProductsMatches = (recipe, productsString, normalize = false) => {
	let products = productsString.split(',');
	if (normalize) products.forEach((product, i) => products[i] = Game.generateValidEntityName(product));
	return products.every(product => recipe.ingredientsStrings.includes(product));
};

/**
 * Returns true if the item's name matches the given name.
 * @param {Prefab|ItemInstance} item - The prefab or item instance to match the name against.
 * @param {string} name - The name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
 */
export const itemNameMatches = (item, name, normalize = false) => {
	if (normalize) name = Game.generateValidEntityName(name);
	return item.name === name || item.pluralName === name;
};

/**
 * Returns true if the item's identifier matches the given identifier.
 * @param {ItemInstance} item - The item instance to match the identifier against.
 * @param {string} identifier - The identifier to match. 
 * @param {boolean} [normalize] - Whether or not to normalize the identifier before matching. Defaults to false.
 */
export const itemIdentifierMatches = (item, identifier, normalize = false) => {
	if (normalize) identifier = Game.generateValidEntityName(identifier);
	return item.identifier !== "" && item.identifier === identifier || item.prefab.id === identifier;
};

/**
 * Returns true if the item's identifier or name matches the given identifier.
 * @param {ItemInstance} item - The item instance to match the identifier or name against.
 * @param {string} identifier - The identifier to match. 
 * @param {boolean} [normalize] - Whether or not to normalize the identifier before matching. Defaults to false.
 */
export const itemIdentifierOrNameMatches = (item, identifier, normalize = false) => {
	if (normalize) identifier = Game.generateValidEntityName(identifier);
	return itemIdentifierMatches(item, identifier) || itemNameMatches(item, identifier);
};

/**
 * Returns true if the item's identifier or name contains the given identifier.
 * @param {ItemInstance} item - The item instance to match the identifier or name against.
 * @param {string} identifier - The identifier to match. 
 * @param {boolean} [normalize] - Whether or not to normalize the identifier before matching. Defaults to false.
 */
export const itemIdentifierOrNameContains = (item, identifier, normalize = false) => {
	if (normalize) identifier = Game.generateValidEntityName(identifier);
	return item.identifier !== "" && item.identifier.includes(identifier)
		|| item.prefab.id.includes(identifier)
		|| item.name.includes(identifier)
		|| item.pluralName !== "" && item.pluralName.includes(identifier);
};

/**
 * Returns true if the item's container's name matches the given name.
 * @param {RoomItem|InventoryItem} item - The item instance whose container we want to match the name against.
 * @param {string} name - The name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
 */
export const itemContainerNameMatches = (item, name, normalize = false) => {
	if (normalize) name = Game.generateValidEntityName(name);
	if (item.container instanceof ItemInstance) return item.container.name === name || item.container.pluralName === name;
	return item.container.name === name;
};

/**
 * Returns true if the item's container's identifier matches the given identifier.
 * @param {RoomItem|InventoryItem} item - The item instance whose container we want to match the identifier against.
 * @param {string} identifier - The identifier to match. 
 * @param {boolean} [normalize] - Whether or not to normalize the identifier before matching. Defaults to false.
 */
export const itemContainerIdentifierMatches = (item, identifier, normalize = false) => {
	if (normalize) identifier = Game.generateValidEntityName(identifier);
	if (item.container instanceof ItemInstance) return item.container.identifier !== "" && item.container.identifier === identifier || item.container.prefab.id === identifier;
	return itemContainerNameMatches(item, identifier);
};

/**
 * Returns true if the item's container's identifier or name matches the given identifier.
 * @param {RoomItem|InventoryItem} item - The item instance whose container we want to match the identifier or name against.
 * @param {string} identifier - The identifier to match. 
 * @param {boolean} [normalize] - Whether or not to normalize the identifier before matching. Defaults to false.
 */
export const itemContainerIdentifierOrNameMatches = (item, identifier, normalize = false) => {
	if (normalize) identifier = Game.generateValidEntityName(identifier);
	if (item.container instanceof ItemInstance) return itemContainerIdentifierMatches(item, identifier) || itemContainerNameMatches(item, identifier);
	return itemContainerNameMatches(item, identifier);
};

/**
 * Returns true if the item's container's identifier or name matches the given identifier.
 * @param {RoomItem|InventoryItem} item - The item instance whose container we want to match the identifier or name against.
 * @param {string} identifier - The identifier to match. 
 * @param {boolean} [normalize] - Whether or not to normalize the identifier before matching. Defaults to false.
 */
export const itemContainerIdentifierOrNameContains = (item, identifier, normalize = false) => {
	if (normalize) identifier = Game.generateValidEntityName(identifier);
	if (item.container instanceof ItemInstance) return itemIdentifierOrNameContains(item.container, identifier);
	return entityNameContains(item.container, identifier);
};

/**
 * Returns true if the item's containerName matches the given container name.
 * @param {ItemInstance} item - The item instance to match the container name against.
 * @param {string} containerName - The container name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the container name before matching. Defaults to false.
 */
export const itemContainerNamePropertyMatches = (item, containerName, normalize = false) => {
	if (normalize) containerName = Game.generateValidEntityName(containerName);
	return Game.generateValidEntityName(item.containerName) === containerName;
};

/**
 * Returns true if the inventory slot ID the item instance is contained in matches the given slot ID.
 * @param {ItemInstance} item - The item instance to match the inventory slot ID against. 
 * @param {string} slotId - The inventory slot ID to match. 
 * @param {boolean} [normalize] - Whether or not to normalize the slot ID before matching. Defaults to false.
 */
export const itemSlotMatches = (item, slotId, normalize = false) => {
	if (normalize) slotId = Game.generateValidEntityName(slotId);
	return item.slot === slotId;
};

/**
 * Returns true if the puzzle's type matches the given type.
 * @param {Puzzle} puzzle - The puzzle to match the type against.
 * @param {string} type - The type to match.
 * @param {boolean} [normalize] - Whether or not to normalize the slot ID before matching. Defaults to false.
 */
export const puzzleTypeMatches = (puzzle, type, normalize = false) => {
	if (normalize) type = type.trim();
	return puzzle.type === type;
};

/**
 * Returns whether or not the event's ongoing property matches the given ongoing state.
 * @param {Event} event - The event to match the ongoing state against. 
 * @param {boolean} ongoing - The ongoing state to match against. 
 */
export const eventOngoingMatches = (event, ongoing) => {
	return event.ongoing === ongoing;
};

/**
 * Returns true if the event's refreshes strings include all of the given status effects.
 * @param {Event} event - The event to match the effects against.
 * @param {string} refreshesString - A comma-separated list of status effect IDs to match.
 * @param {boolean} [normalize] - Whether or not to normalize the cures before matching. Defaults to false. 
 */
export const eventRefreshesMatches = (event, refreshesString, normalize = false) => {
	let refreshes = refreshesString.split(',');
	if (normalize) refreshes.forEach((refresh, i) => refreshes[i] = Status.generateValidId(refresh));
	return refreshes.every(refresh => event.refreshesStrings.includes(refresh));
};

/**
 * Returns true if the event's room tag matches the given room tag.
 * @param {Event} event - The event to match the room tag against. 
 * @param {string} roomTag - The room tag to match.
 * @param {boolean} [normalize] - Whether or not to normalize the room tag before matching. Defaults to false.
 */
export const eventRoomTagMatches = (event, roomTag, normalize = false) => {
	if (normalize) roomTag = roomTag.trim();
	return event.roomTag === roomTag;
};

/**
 * Returns true if the status's ID matches the given ID.
 * @param {Status} status - The status to match the ID against.
 * @param {string} id - The ID to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
 */
export const statusIdMatches = (status, id, normalize = false) => {
	if (normalize) id = Status.generateValidId(id);
	return status.id === id;
};

/**
 * Returns true if the status's ID contains the given ID.
 * @param {Status} status - The status to match the ID against.
 * @param {string} id - The ID to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
 */
export const statusIdContains = (status, id, normalize = false) => {
	if (normalize) id = Status.generateValidId(id);
	return status.id.includes(id);
};

/**
 * Returns true if the status modifies all of the given stats.
 * @param {Status} status - The status to match the stats against. 
 * @param {string} statsString - A comma-separated list of stats to match the stat modifiers against.
 * @param {boolean} [normalize] - Whether or not to normalize the stats before matching. Defaults to false. 
 */
export const statusStatModifiersMatches = (status, statsString, normalize = false) => {
	let stats = statsString.split(',');
	if (normalize) stats.forEach((stat, i) => stats[i] = Player.abbreviateStatName(stat));
	const statModifiers = status.statModifiers.map(statModifier => statModifier.stat);
	return stats.every(stat => statModifiers.includes(stat));
};

/**
 * Returns true if the status's behavior attributes include all of the given attributes.
 * @param {Status} status - The status to match the attributes against.
 * @param {string} attributesString - A comma-separated list of behavior attributes to match the status against.
 * @param {boolean} [normalize] - Whether or not to normalize the attributes before matching. Defaults to false. 
 */
export const statusAttributeMatches = (status, attributesString, normalize = false) => {
	let attributes = attributesString.split(',');
	if (normalize) attributes.forEach((attribute, i) => attributes[i] = attribute.trim());
	return attributes.every(attribute => status.attributes.includes(attribute));
};

/**
 * Returns true if the player's name matches the given name.
 * @param {Player} player - The player to match the name against.
 * @param {string} name - The name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
 */
export const playerNameMatches = (player, name, normalize = false) => {
	if (normalize) name = name.toLowerCase().trim();
	return player.name.toLowerCase() === name;
};

/**
 * Returns true if the player's name or display name matches the given name.
 * @param {Player} player - The player to match the name against.
 * @param {string} name - The name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
 */
export const playerNameOrDisplayNameMatches = (player, name, normalize = false) => {
	if (normalize) name = name.toLowerCase().trim();
	return playerNameMatches(player, name) || player.displayName.toLowerCase() === name;
};

/**
 * Returns true if the player's name contains the given name.
 * @param {Player} player - The player to match the name against.
 * @param {string} name - The name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
 */
export const playerNameContains = (player, name, normalize = false) => {
	if (normalize) name = name.toLowerCase().trim();
	return player.name.toLowerCase().includes(name);
};

/**
 * Returns true if the player's name or display name matches the given name.
 * @param {Player} player - The player to match the name against.
 * @param {string} name - The name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
 */
export const playerNameOrDisplayNameContains = (player, name, normalize = false) => {
	if (normalize) name = name.toLowerCase().trim();
	return playerNameContains(player, name) || player.displayName.toLowerCase().includes(name);
};

/**
 * Returns whether or not the player's NPC state matches the given NPC state.
 * @param {Player} player - The player to match the NPC state against.
 * @param {boolean} isNPC - The NPC state to match. 
 */
export const playerNPCMatches = (player, isNPC) => {
	return player.isNPC === isNPC;
};

/**
 * Returns true if the player's hiding spot matches the given hiding spot.
 * @param {Player} player - The player to match the hiding spot against.
 * @param {string} hidingSpot - The hiding spot to match.
 * @param {boolean} [normalize] - Whether or not to normalize the hiding spot before matching. Defaults to false.
 */
export const playerHidingSpotMatches = (player, hidingSpot, normalize = false) => {
	if (normalize) hidingSpot = Game.generateValidEntityName(hidingSpot);
	return player.hidingSpot === hidingSpot;
};

/**
 * Returns true if the players's status strings include all of the given status effects.
 * @param {Player} player - The player to match the status effects against.
 * @param {string} statusString - A comma-separated list of status effect IDs to match.
 * @param {boolean} [normalize] - Whether or not to normalize the status effects before matching. Defaults to false. 
 */
export const playerStatusMatches = (player, statusString, normalize = false) => {
	let statuses = statusString.split(',');
	if (normalize) statuses.forEach((status, i) => statuses[i] = Status.generateValidId(status));
	const playerStatuses = player.status.map(status => status.id);
	return statuses.every(status => playerStatuses.includes(status));
};

/**
 * Returns true if the inventory item's player's name matches the given name.
 * @param {InventoryItem} inventoryItem - The inventory item whose player we want to match the name against.
 * @param {string} name - The name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
 */
export const inventoryItemPlayerNameMatches = (inventoryItem, name, normalize = false) => {
	if (normalize) name = Game.generateValidEntityName(name);
	return Game.generateValidEntityName(inventoryItem.player.name) === name;
};

/**
 * Returns true if the inventory item's equipment slot ID matches the given equipment slot ID.
 * @param {InventoryItem} inventoryItem - The inventory item whose equipment slot we want to match the equipment slot ID against.
 * @param {string} equipmentSlotId - The ID of the equipment slot to match. 
 * @param {boolean} [normalize] - Whether or not to normalize the equipment slot ID before matching. Defaults to false.
 */
export const inventoryItemEquipmentSlotMatches = (inventoryItem, equipmentSlotId, normalize = false) => {
	if (normalize) equipmentSlotId = Game.generateValidEntityName(equipmentSlotId);
	return inventoryItem.equipmentSlot === equipmentSlotId;
};

/**
 * Returns true if the gesture's ID matches the given ID.
 * @param {Gesture} gesture - The gesture to match the ID against.
 * @param {string} id - The ID to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
 */
export const gestureIdMatches = (gesture, id, normalize = false) => {
	if (normalize) id = Gesture.generateValidId(id);
	return gesture.id === id;
};

/**
 * Returns true if the gesture's ID contains the given ID.
 * @param {Gesture} gesture - The gesture to match the ID against.
 * @param {string} id - The ID to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
 */
export const gestureIdContains = (gesture, id, normalize = false) => {
	if (normalize) id = Gesture.generateValidId(id);
	return gesture.id.includes(id);
};