import { Collection } from "discord.js";
import Fixture from "../Data/Fixture.js";
import Game from "../Data/Game.js";
import GameEntity from "../Data/GameEntity.js";
import Gesture from "../Data/Gesture.js";
import InventoryItem from "../Data/InventoryItem.js";
import ItemInstance from "../Data/ItemInstance.js";
import Player from "../Data/Player.js";
import Puzzle from "../Data/Puzzle.js";
import Room from "../Data/Room.js";
import RoomItem from "../Data/RoomItem.js";
import Status from "../Data/Status.js";

export default class GameEntityFinder {
	/**
	 * The game this belongs to.
	 * @readonly
	 * @type {Game}
	 */
	#game;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 */
	constructor(game) {
		this.#game = game;
	}

	/**
	 * Returns true if the entity's location's ID matches the given ID.
	 * @param {Fixture|RoomItem|Puzzle|Player} entity - The entity whose location we want to match the ID against.
	 * @param {string} id - The ID to match.
	 * @param {boolean} [normalize] - Whether or not to normalize the ID before matching. Defaults to false.
	 */
	static entityLocationIdMatches = (entity, id, normalize = false) => {
		if (normalize) id = Room.generateValidId(id);
		return entity.location.id === id;
	};

	/**
	 * Returns true if the item's identifier matches the given identifier.
	 * @param {ItemInstance} item - The item instance to match the identifier against.
	 * @param {string} identifier - The identifier to match. 
	 * @param {boolean} [normalize] - Whether or not to normalize the identifier before matching. Defaults to false.
	 */
	static itemIdentifierMatches = (item, identifier, normalize = false) => {
		if (normalize) identifier = Game.generateValidEntityName(identifier);
		return item.identifier !== "" && item.identifier === identifier || item.prefab.id === identifier;
	};

	/**
	 * Returns true if the item's containerName matches the given container name.
	 * @param {ItemInstance} item - The item instance to match the container name against.
	 * @param {string} containerName - The container name to match.
	 * @param {boolean} [normalize] - Whether or not to normalize the container name before matching. Defaults to false.
	 */
	static itemContainerNameMatches = (item, containerName, normalize = false) => {
		if (normalize) containerName = Game.generateValidEntityName(containerName);
		return Game.generateValidEntityName(item.containerName) === containerName;
	};

	/**
	 * Returns true if the inventory item's player's name matches the given name.
	 * @param {InventoryItem} inventoryItem - The inventory item whose player we want to match the name against.
	 * @param {string} name - The name to match.
	 * @param {boolean} [normalize] - Whether or not to normalize the name before matching. Defaults to false.
	 */
	static inventoryItemPlayerNameMatches = (inventoryItem, name, normalize = false) => {
		if (normalize) name = Game.generateValidEntityName(name);
		return Game.generateValidEntityName(inventoryItem.player.name) === name;
	};

	/**
	 * Returns true if the inventory item's equipment slot ID matches the given equipment slot ID.
	 * @param {InventoryItem} inventoryItem - The inventory item whose equipment slot we want to match the equipment slot ID against.
	 * @param {string} equipmentSlotId - The ID of the equipment slot to match. 
	 * @param {boolean} [normalize] - Whether or not to normalize the equipment slot ID before matching. Defaults to false.
	 */
	static inventoryItemEquipmentSlotMatches = (inventoryItem, equipmentSlotId, normalize = false) => {
		if (normalize) equipmentSlotId = Game.generateValidEntityName(equipmentSlotId);
		return inventoryItem.equipmentSlot === equipmentSlotId;
	};

	/** 
	 * Gets a room.
	 * @param {string} id - The ID or displayName of the room.
	 * @returns The room with the specified ID. If no such room exists, returns undefined.
	 */
	getRoom(id) {
		return this.#game.roomsCollection.get(Room.generateValidId(id));
	}

	/**
	 * Gets a fixture.
	 * @param {string} name - The name of the fixture. 
	 * @param {string} [location] - The ID or displayName of the room the fixture is in. 
	 * @returns The fixture with the specified name and location, if applicable. If no such fixture exists, returns undefined.
	 */
	getFixture(name, location) {
		if (location) this.#game.fixtures.find(fixture => fixture.name === Game.generateValidEntityName(name) && fixture.location.id === Room.generateValidId(location));
		else this.#game.fixtures.find(fixture => fixture.name === Game.generateValidEntityName(name));
	}

	/**
	 * Gets a prefab.
	 * @param {string} id - The prefab's ID.
	 * @returns The prefab with the specified ID. If no such prefab exists, returns undefined.
	 */
	getPrefab(id) {
		return this.#game.prefabsCollection.get(Game.generateValidEntityName(id));
	}

	/**
	 * Gets a room item.
	 * @param {string} identifier - The room item's identifier or prefab ID.
	 * @param {string} [location] - The ID or displayName of the room the item is in. 
	 * @param {string} [containerName] - The room item's containerName.
	 * @returns The room item with the specified identifier, and location and containerName if applicable. If no such item exists, returns undefined.
	 */
	getRoomItem(identifier, location, containerName) {
		/** @type {Collection<string, (entity: GameEntity, id: string, normalize?: boolean) => boolean>} */
		let selectedFilters = new Collection();
		selectedFilters.set(Game.generateValidEntityName(identifier), GameEntityFinder.itemIdentifierMatches);
		if (location) selectedFilters.set(Room.generateValidId(location), GameEntityFinder.entityLocationIdMatches);
		if (containerName) selectedFilters.set(Game.generateValidEntityName(containerName), GameEntityFinder.itemContainerNameMatches);
		return this.#game.roomItems.find(roomItem => roomItem.quantity !== 0 && selectedFilters.every((filterFunction, key) => filterFunction(roomItem, key)));
	}

	/**
	 * Gets a puzzle.
	 * @param {string} name - The name of the puzzle. 
	 * @param {string} [location] - The ID or displayName of the room the puzzle is in. 
	 * @returns The puzzle with the specified name and location, if applicable. If no such puzzle exists, returns undefined.
	 */
	getPuzzle(name, location) {
		if (location) this.#game.puzzles.find(puzzle => puzzle.name === Game.generateValidEntityName(name) && puzzle.location.id === Room.generateValidId(location));
		else this.#game.puzzles.find(puzzle => puzzle.name === Game.generateValidEntityName(name));
	}

	/**
	 * Gets an event.
	 * @param {string} id - The event's ID.
	 * @returns The event with the specified ID. If no such event exists, returns undefined.
	 */
	getEvent(id) {
		return this.#game.eventsCollection.get(Game.generateValidEntityName(id));
	}

	/**
	 * Gets a status effect.
	 * @param {string} id - The status effect's ID.
	 * @returns The status effect with the specified ID. If no such status effect exists, returns undefined.
	 */
	getStatusEffect(id) {
		return this.#game.statusEffectsCollection.get(Status.generateValidId(id));
	}

	/**
	 * Gets a player.
	 * @param {string} name - The player's name. 
	 * @returns The player with the specified name. If no such player exists, returns undefined.
	 */
	getPlayer(name) {
		return this.#game.playersCollection.get(Game.generateValidEntityName(name));
	}

	/**
	 * Gets a living player.
	 * @param {string} name - The player's name. 
	 * @returns The living player with the specified name. If no such player exists, returns undefined.
	 */
	getLivingPlayer(name) {
		return this.#game.livingPlayersCollection.get(Game.generateValidEntityName(name));
	}
	
	/**
	 * Gets a dead player.
	 * @param {string} name - The player's name. 
	 * @returns The dead player with the specified name. If no such player exists, returns undefined.
	 */
	getDeadPlayer(name) {
		return this.#game.deadPlayersCollection.get(Game.generateValidEntityName(name));
	}

	/**
	 * 
	 * @param {string} identifier - The inventory item's identifier or prefab ID.
	 * @param {string} [player] - The name of the player the inventory item belongs to.
	 * @param {string} [containerName] - The inventory item's containerName.
	 * @param {string} [equipmentSlotId] - The ID of the equipment slot the inventory item belongs to.
	 * @returns The inventory item with the specified identifier, and player, containerName, and equipment slot if applicable. If no such item exists, returns undefined.
	 */
	getInventoryItem(identifier, player, containerName, equipmentSlotId) {
		/** @type {Collection<string, (entity: GameEntity, id: string, normalize?: boolean) => boolean>} */
		let selectedFilters = new Collection();
		selectedFilters.set(Game.generateValidEntityName(identifier), GameEntityFinder.itemIdentifierMatches);
		if (player) selectedFilters.set(Game.generateValidEntityName(player), GameEntityFinder.inventoryItemPlayerNameMatches);
		if (containerName) selectedFilters.set(Game.generateValidEntityName(containerName), GameEntityFinder.itemContainerNameMatches);
		if (equipmentSlotId) selectedFilters.set(Game.generateValidEntityName(equipmentSlotId), GameEntityFinder.inventoryItemEquipmentSlotMatches);
		return this.#game.inventoryItems.find(inventoryItem => inventoryItem.prefab !== null && inventoryItem.quantity !== 0 && selectedFilters.every((filterFunction, key) => filterFunction(inventoryItem, key)));
	}

	/**
	 * Gets a gesture.
	 * @param {string} id - The gesture's ID.
	 * @returns The gesture with the specified ID. If no such gesture exists, returns undefined.
	 */
	getGesture(id) {
		return this.#game.gesturesCollection.get(Gesture.generateValidId(id));
	}

	/**
	 * Gets a flag.
	 * @param {string} id - The flag's ID. 
	 * @param {boolean} [evaluate] - Whether or not to also evaluate the flag's value script and update its value. Does not execute the flag's set commands. Defaults to false.
	 * @returns The flag with the specified ID. If no such flag exists, returns undefined.
	 */
	getFlag(id, evaluate = false) {
		const flag = this.#game.flags.get(Game.generateValidEntityName(id));
		if (flag && flag.valueScript && evaluate) {
			const value = flag.evaluate();
			flag.setValue(value, false);
		}
		return flag ? flag.value : flag;
	}
}
