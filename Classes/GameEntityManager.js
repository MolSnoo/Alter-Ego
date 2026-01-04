import Room from "../Data/Room.js";
import Whisper from "../Data/Whisper.js";
import { ChannelType, TextChannel } from "discord.js";

/** @typedef {import("../Data/Event.js").default} Event */
/** @typedef {import("../Data/Fixture.js").default} Fixture */
/** @typedef {import("../Data/Flag.js").default} Flag */
/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("../Data/Player.js").default} Player */
/** @typedef {import("../Data/Prefab.js").default} Prefab */
/** @typedef {import("../Data/Puzzle.js").default} Puzzle */
/** @typedef {import("../Data/Status.js").default} Status */

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
	 * Clears all game data from memory.
	 * @protected
	 */
	clearGame() {
		this.clearRooms();
		this.clearFixtures();
		this.clearPrefabs();
		this.clearRecipes();
		this.clearRoomItems();
		this.clearPuzzles();
		this.clearEvents();
		this.clearStatusEffects();
		this.clearPlayers();
		this.clearInventoryItems();
		this.clearGestures();
		this.clearFlags();
	}

	/**
	 * Clears all room data from memory.
	 * @protected
	 */
	clearRooms() {
		this.game.rooms.length = 0;
		this.game.roomsCollection.clear();
	}

	/**
	 * Clears all fixture data from memory.
	 * @protected
	 */
	clearFixtures() {
		this.game.fixtures.forEach(fixture => {
			if (fixture.recipeInterval !== null)
				fixture.recipeInterval.stop();
			if (fixture.process.timer !== null)
				fixture.process.timer.stop();
			if (fixture.hidingSpot !== null) {
				fixture.hidingSpot.occupants.length = 0;
				fixture.hidingSpot.deleteWhisper();
			}
		});
		this.game.fixtures.length = 0;
	}

	/**
	 * Clears all prefab data from memory.
	 * @protected
	 */
	clearPrefabs() {
		this.game.prefabs.length = 0;
		this.game.prefabsCollection.clear();
	}

	/**
	 * Clears all recipe data from memory.
	 * @protected
	 */
	clearRecipes() {
		this.game.recipes.length = 0;
	}

	/**
	 * Clears all room item data from memory.
	 * @protected
	 */
	clearRoomItems() {
		this.game.roomItems.length = 0;
	}

	/**
	 * Clears all puzzle data from memory.
	 * @protected
	 */
	clearPuzzles() {
		this.game.puzzles.length = 0;
	}

	/**
	 * Clears all event data from memory.
	 * @protected
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
	 * @protected
	 */
	clearStatusEffects() {
		this.game.statusEffects.length = 0;
		this.game.statusEffectsCollection.clear();
	}

	/**
	 * Clears all player data from memory.
	 * @protected
	 */
	clearPlayers() {
		this.game.playersCollection.forEach(player => {
			player.statusCollection.values().forEach(status => {
				if (status.timer !== null)
					status.timer.stop();
			});
			player.stopMoving();
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
	 * @protected
	 */
	clearInventoryItems() {
		this.game.inventoryItems.length = 0;
	}

	/**
	 * Clears all gesture data from memory.
	 * @protected
	 */
	clearGestures() {
		this.game.gestures.length = 0;
		this.game.gesturesCollection.clear();
	}

	/**
	 * Clears all flag data from memory.
	 * @protected
	 */
	clearFlags() {
		this.game.flags.clear();
	}

	/** 
	 * Updates references to a given room throughout the game.
	 * @protected
	 * @param {Room} room - The room to reference.
	 */
	updateRoomReferences(room) {
		this.game.livingPlayersCollection.forEach(player => {
			if (Room.generateValidId(player.locationDisplayName) === room.id)
				room.addPlayer(player);
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
		this.game.whispersCollection.forEach(whisper => {
			if (whisper.locationId === room.id)
				whisper.setLocation(room);
		});
	}

	/**
	 * Updates references to a given fixture throughout the game.
	 * @protected
	 * @param {Fixture} fixture - The fixture to reference. 
	 */
	updateFixtureReferences(fixture) {
		this.game.roomItems.forEach(roomItem => {
			if (roomItem.location?.id === fixture.location?.id && roomItem.containerType === "Fixture" && roomItem.containerName === fixture.name)
				roomItem.setContainer(fixture);
		});
		this.game.puzzles.forEach(puzzle => {
			if (puzzle.location?.id === fixture.location?.id && puzzle.parentFixtureName !== "" && puzzle.parentFixtureName === fixture.name)
				puzzle.setParentFixture(fixture);
		});
	}

	/**
	 * Updates references to a given prefab throughout the game.
	 * @protected
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
	 * @protected
	 * @param {Puzzle} puzzle - The puzzle to reference.
	 */
	updatePuzzleReferences(puzzle) {
		this.game.fixtures.forEach(fixture => {
			if (fixture.location?.id === puzzle.location?.id && fixture.childPuzzleName !== "" && fixture.childPuzzleName === puzzle.name)
				fixture.setChildPuzzle(puzzle);
		});
		this.game.roomItems.forEach(roomItem => {
			if (roomItem.location?.id === puzzle.location?.id && roomItem.containerType === "Puzzle" && roomItem.containerName === puzzle.name)
				roomItem.setContainer(puzzle);
		});
	}

	/**
	 * Updates references to a given event throughout the game.
	 * @protected
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
	 * @protected
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
	 * @protected
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

	/**
	 * Creates a new whisper and adds it to the game's collection of whispers.
	 * @param {Player[]} players - The players to add to the whisper.
	 * @param {string} [hidingSpotName] - The name of the hiding spot the whisper belongs to. Optional.
	 * @returns The created whisper.
	 */
	async createWhisper(players, hidingSpotName) {
		const whisper = new Whisper(this.game, players, hidingSpotName);
		whisper.channel = await this.#createWhisperChannel(whisper);
		this.game.whispersCollection.set(whisper.id, whisper);
		return whisper;
	}

	/**
	 * Updates a whisper's key in the game's collection of whispers and edits its channel name.
	 * @param {Whisper} whisper - The whisper to edit.
	 * @param {string} newId - The whisper's new ID.
	 */
	updateWhisperId(whisper, newId) {
		const oldId = whisper.id;
		whisper.id = newId;
		this.game.whispersCollection.set(whisper.id, whisper);
		this.game.whispersCollection.delete(oldId);
		whisper.channel.edit({ name: whisper.id.substring(0, 100) });
	}

	/**
	 * Deletes a whisper from the game.
	 * @param {Whisper} whisper - The whisper to delete. 
	 */
	deleteWhisper(whisper) {
		if (this.game.settings.autoDeleteWhisperChannels) whisper.channel.delete();
		else whisper.channel.edit({ name: `archived-${whisper.location.id}`, lockPermissions: true });
		whisper.playersCollection.clear();
		this.game.whispersCollection.delete(whisper.id);
	}

	/**
	 * Creates a channel for a whisper.
	 * @param {Whisper} whisper
	 * @returns {Promise<TextChannel>} The created channel.
	 */
	async #createWhisperChannel(whisper) {
		return new Promise(resolve => {
			this.game.guildContext.guild.channels.create({
				name: whisper.channelName,
				type: ChannelType.GuildText,
				parent: this.game.guildContext.whisperCategoryId
			}).then(channel => {
				whisper.playersCollection.forEach(player => {
					const noChannel = player.isNPC
						|| player.hasBehaviorAttribute("hidden") && player.getBehaviorAttributeStatusEffects("no channel").length > 1
						|| !player.hasBehaviorAttribute("hidden") && player.hasBehaviorAttribute("no channel")
						|| player.hasBehaviorAttribute("no hearing");
					if (!noChannel) {
						channel.permissionOverwrites.create(player.id, {
							ViewChannel: true,
							ReadMessageHistory: true
						});
					}
				});
				resolve(channel);
			}).catch();
		});
	}
}