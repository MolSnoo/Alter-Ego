import Fixture from "../Data/Fixture.js";
import Game from "../Data/Game.js";
import InventoryItem from "../Data/InventoryItem.js";
import ItemInstance from "../Data/ItemInstance.js";
import Player from "../Data/Player.js";
import Prefab from "../Data/Prefab.js";
import Puzzle from "../Data/Puzzle.js";
import Room from "../Data/Room.js";
import RoomItem from "../Data/RoomItem.js";

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
 * Returns true if the room's tags include the given tag.
 * @param {Room} room - The room to match the tag against.
 * @param {string} tag - The tag to match.
 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
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
 * Returns whether or not the fixture's accessible property matches the given accessible state.
 * @param {Fixture} fixture - The fixture to match the accessible state against. 
 * @param {boolean} accessible - The accessible state to match against. 
 */
export const fixtureAccessibleMatches = (fixture, accessible) => {
	return fixture.accessible === accessible;
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
 * Returns true if the item's containerName matches the given container name.
 * @param {ItemInstance} item - The item instance to match the container name against.
 * @param {string} containerName - The container name to match.
 * @param {boolean} [normalize] - Whether or not to normalize the container name before matching. Defaults to false.
 */
export const itemContainerNameMatches = (item, containerName, normalize = false) => {
	if (normalize) containerName = Game.generateValidEntityName(containerName);
	return Game.generateValidEntityName(item.containerName) === containerName;
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