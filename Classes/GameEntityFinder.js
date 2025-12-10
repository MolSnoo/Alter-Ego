import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import Room from "../Data/Room.js";
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
		if (identifier) identifier = Game.generateValidEntityName(identifier);
		if (location) location = Room.generateValidId(location);
		if (containerName && containerName.includes(':')) containerName = containerName.substring(0, containerName.indexOf(':')) + Game.generateValidEntityName(containerName.substring(containerName.indexOf(':')));
		
		if (location && containerName) {
			return this.#game.roomItems.find(roomItem =>
				(roomItem.identifier !== "" && roomItem.identifier === identifier || roomItem.prefab.id === identifier)
				&& roomItem.location.id === location
				&& roomItem.containerName === containerName
				&& roomItem.quantity !== 0
			);
		}
		else if (location) {
			return this.#game.roomItems.find(roomItem =>
			(roomItem.identifier !== "" && roomItem.identifier === identifier || roomItem.prefab.id === identifier)
			&& roomItem.location.id === location
			);
		}
		else return this.#game.roomItems.find(roomItem => (roomItem.identifier !== "" && roomItem.identifier === identifier || roomItem.prefab.id === identifier) && roomItem.quantity !== 0);
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
	 * @param {string} [equipmentSlot] - The ID of the equipment slot the inventory item belongs to.
	 * @returns The inventory item with the specified identifier, and player, containerName, and equipment slot if applicable. If no such item exists, returns undefined.
	 */
	getInventoryItem(identifier, player, containerName, equipmentSlot) {
		if (identifier) identifier = Game.generateValidEntityName(identifier);
		if (player) player = Game.generateValidEntityName(player);
		if (containerName) containerName = Game.generateValidEntityName(containerName);
		if (equipmentSlot) equipmentSlot = Game.generateValidEntityName(equipmentSlot);

		if (player && containerName && equipmentSlot) {
			return this.#game.inventoryItems.find(inventoryItem =>
				inventoryItem.prefab !== null
				&& (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
				&& Game.generateValidEntityName(inventoryItem.player.name) === player
				&& inventoryItem.containerName === containerName
				&& inventoryItem.equipmentSlot === equipmentSlot
				&& inventoryItem.quantity !== 0
			);
		}
		else if (player && containerName) {
			return this.#game.inventoryItems.find(inventoryItem =>
				inventoryItem.prefab !== null
				&& (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
				&& Game.generateValidEntityName(inventoryItem.player.name) === player
				&& inventoryItem.containerName === containerName
				&& inventoryItem.quantity !== 0
			);
		}
		else if (player && equipmentSlot) {
			return this.#game.inventoryItems.find(inventoryItem =>
				inventoryItem.prefab !== null
				&& (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
				&& Game.generateValidEntityName(inventoryItem.player.name) === player
				&& inventoryItem.equipmentSlot === equipmentSlot
				&& inventoryItem.quantity !== 0
			);
		}
		else if (player) {
			return this.#game.inventoryItems.find(inventoryItem =>
				inventoryItem.prefab !== null
				&& (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
				&& Game.generateValidEntityName(inventoryItem.player.name) === player
				&& inventoryItem.quantity !== 0
			);
		}
		else {
			return this.#game.inventoryItems.find(inventoryItem =>
				inventoryItem.prefab !== null
				&& (inventoryItem.identifier !== "" && inventoryItem.identifier === identifier || inventoryItem.prefab.id === identifier)
				&& Game.generateValidEntityName(inventoryItem.player.name) === player
				&& inventoryItem.quantity !== 0
			);
		}
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
