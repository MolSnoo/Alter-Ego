import Event from "../Data/Event.js";
import Fixture from "../Data/Fixture.js";
import Flag from "../Data/Flag.js";
import Game from "../Data/Game.js";
import Prefab from "../Data/Prefab.js";
import Puzzle from "../Data/Puzzle.js";
import Room from "../Data/Room.js";
import Status from "../Data/Status.js";

/**
 * @class GameEntityManager
 * @classdesc A set of functions to manage game entities.
 */
export default class GameEntityManager {
	/**
	 * The game this belongs to.
	 * @readonly
	 * @type {Game}
	 */
	game;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to. 
	 */
	constructor(game) {
		this.game = game;
	}

	/**
	 * Clears all room data from memory.
	 */
	clearRooms() {
		this.game.rooms.length = 0;
		this.game.roomsCollection.clear();
	}

	/**
	 * Clears all fixture data from memory.
	 */
	clearFixtures() {
		this.game.fixtures.forEach(fixture => {
			if (fixture.recipeInterval !== null)
				fixture.recipeInterval.stop();
			if (fixture.process.timer !== null)
				fixture.process.timer.stop();
		});
		this.game.fixtures.length = 0;
	}

	/**
	 * Clears all prefab data from memory.
	 */
	clearPrefabs() {
		this.game.prefabs.length = 0;
		this.game.prefabsCollection.clear();
	}

	/**
	 * Clears all recipe data from memory.
	 */
	clearRecipes() {
		this.game.recipes.length = 0;
	}

	/**
	 * Clears all room item data from memory.
	 */
	clearRoomItems() {
		this.game.roomItems.length = 0;
	}

	/**
	 * Clears all puzzle data from memory.
	 */
	clearPuzzles() {
		this.game.puzzles.length = 0;
	}

	/**
	 * Clears all event data from memory.
	 */
	clearEvents() {
		this.game.eventsCollection.forEach(event => {
			if (event.timer !== null)
				event.timer.stop();
			if (event.effectsTimer !== null)
				event.effectsTimer.stop();
		});
		this.game.events.length = 0;
		this.game.eventsCollection.clear();
	}

	/**
	 * Clears all status effect data from memory.
	 */
	clearStatusEffects() {
		this.game.statusEffects.length = 0;
		this.game.statusEffectsCollection.clear();
	}

	/**
	 * Clears all player data from memory.
	 */
	clearPlayers() {
		this.game.playersCollection.forEach(player => {
			player.status.forEach(status => {
				if (status.timer !== null)
					status.timer.stop();
			});
			if (player.moveTimer !== null)
				clearInterval(player.moveTimer)
			player.isMoving = false;
			player.remainingTime = 0;
			player.moveQueue.length = 0;
			player.setOffline();
		});
		this.game.roomsCollection.forEach(room => {
			room.occupants.length = 0;
		});
		this.game.players.length = 0;
		this.game.players_alive.length = 0;
		this.game.players_dead.length = 0;
		this.game.playersCollection.clear();
		this.game.livingPlayersCollection.clear();
		this.game.deadPlayersCollection.clear();
	}

	/**
	 * Clears all inventory item data from memory.
	 */
	clearInventoryItems() {
		this.game.inventoryItems.length = 0;
	}

	/**
	 * Clears all gesture data from memory.
	 */
	clearGestures() {
		this.game.gestures.length = 0;
		this.game.gesturesCollection.clear();
	}

	/**
	 * Clears all flag data from memory.
	 */
	clearFlags() {
		this.game.flags.clear();
	}

	/** 
	 * Updates references to a given room throughout the game.
	 * @param {Room} room - The room to reference.
	 */
	updateRoomReferences(room) {
		this.game.livingPlayersCollection.forEach(player => {
			if (Room.generateValidId(player.locationDisplayName) === room.id)
				room.addPlayer(player, null, null, false);
		});
		this.game.fixtures.forEach(fixture => {
			if (Room.generateValidId(fixture.locationDisplayName) === room.id)
				fixture.setLocation(room);
		});
		this.game.roomItems.forEach(roomItem => {
			if (Room.generateValidId(roomItem.locationDisplayName) === room.id)
				roomItem.setLocation(room);
		});
		this.game.puzzles.forEach(puzzle => {
			if (Room.generateValidId(puzzle.locationDisplayName) === room.id)
				puzzle.setLocation(room);
		});
		this.game.whispers.forEach(whisper => {
			if (whisper.locationId === room.id)
				whisper.setLocation(room);
		});
	}

	/**
	 * Updates references to a given fixture throughout the game.
	 * @param {Fixture} fixture - The fixture to reference. 
	 */
	updateFixtureReferences(fixture) {
		this.game.roomItems.forEach(roomItem => {
			if (roomItem.location.id === fixture.location.id && roomItem.containerType === "Fixture" && roomItem.containerName === fixture.name)
				roomItem.setContainer(fixture);
		});
		this.game.puzzles.forEach(puzzle => {
			if (puzzle.location.id === fixture.location.id && puzzle.parentFixtureName !== "" && puzzle.parentFixtureName === fixture.name)
				puzzle.setParentFixture(fixture);
		});
	}

	/**
	 * Updates references to a given prefab throughout the game.
	 * @param {Prefab} prefab - The prefab to reference.
	 */
	updatePrefabReferences(prefab) {
		this.game.roomItems.forEach(roomItem => {
			if (roomItem.prefabId === prefab.id)
				roomItem.setPrefab(prefab);
		});
		this.game.inventoryItems.forEach(inventoryItem => {
			if (inventoryItem.prefabId !== "" && inventoryItem.prefabId === prefab.id)
				inventoryItem.setPrefab(prefab);
		});
		this.game.puzzles.forEach(puzzle => {
			puzzle.requirementsStrings.forEach((requirementsString, i) => {
				if (requirementsString.type === "Prefab" && requirementsString.entityId === prefab.id)
					puzzle.requirements[i] = prefab;
			});
		});
	}

	/**
	 * Updates references to a given puzzle throughout the game.
	 * @param {Puzzle} puzzle - The puzzle to reference.
	 */
	updatePuzzleReferences(puzzle) {
		this.game.fixtures.forEach(fixture => {
			if (fixture.location.id === puzzle.location.id && fixture.childPuzzleName !== "" && fixture.childPuzzleName === puzzle.name)
				fixture.setChildPuzzle(puzzle);
		});
		this.game.roomItems.forEach(roomItem => {
			if (roomItem.location.id === puzzle.location.id && roomItem.containerType === "Puzzle" && roomItem.containerName === puzzle.name)
				roomItem.setContainer(puzzle);
		});
	}

	/**
	 * Updates references to a given event throughout the game.
	 * @param {Event} event 
	 */
	updateEventReferences(event) {
		this.game.puzzles.forEach(puzzle => {
			puzzle.requirementsStrings.forEach((requirementsString, i) => {
				if (requirementsString.type === "Event" && requirementsString.entityId === event.id)
					puzzle.requirements[i] = event;
			});
		});
	}

	/**
	 * Updates references to a given status effect throughout the game.
	 * @param {Status} status 
	 */
	updateStatusEffectReferences(status) {
		this.game.prefabsCollection.forEach(prefab => {
			prefab.effectsStrings.forEach((effectsString, i) => {
				if (effectsString === status.id)
					prefab.effects[i] = status;
			});
			prefab.curesStrings.forEach((curesString, i) => {
				if (curesString === status.id)
					prefab.cures[i] = status;
			});
		});
		this.game.eventsCollection.forEach(event => {
			event.effectsStrings.forEach((effectsString, i) => {
				if (effectsString === status.id)
					event.effects[i] = status;
			});
			event.refreshesStrings.forEach((refreshesString, i) => {
				if (refreshesString === status.id)
					event.refreshes[i] = status;
			});
		});
		this.game.gesturesCollection.forEach(gesture => {
			gesture.disabledStatusesStrings.forEach((disabledStatusString, i) => {
				if (disabledStatusString === status.id)
					gesture.disabledStatuses[i] = status;
			});
		});
	}

	/**
	 * Updates references to a given flag throughout the game.
	 * @param {Flag} flag 
	 */
	updateFlagReferences(flag) {
		this.game.puzzles.forEach(puzzle => {
			puzzle.requirementsStrings.forEach((requirementsString, i) => {
				if (requirementsString.type === "Flag" && requirementsString.entityId === flag.id)
					puzzle.requirements[i] = flag;
			});
		});
	}
}