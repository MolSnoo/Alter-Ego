import Fixture from "../Data/Fixture.js";
import Game from "../Data/Game.js";
import Prefab from "../Data/Prefab.js";
import Puzzle from "../Data/Puzzle.js";
import Room from "../Data/Room.js";

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
				if (requirementsString.entityId === "Prefab" && requirementsString.entityId === prefab.id)
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
}