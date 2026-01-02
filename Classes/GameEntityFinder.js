import { Collection } from "discord.js";
import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import Player from "../Data/Player.js";
import Room from "../Data/Room.js";
import Status from "../Data/Status.js";
import * as matchers from '../Modules/matchers.js';

/**
 * @class GameEntityFinder
 * @classdesc A set of functions to easily find in-game entities without parsing inputs yourself.
 */
export default class GameEntityFinder {
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
	 * Gets a room.
	 * @param {string} id - The ID or displayName of the room.
	 * @returns The room with the specified ID. If no such room exists, returns undefined.
	 */
	getRoom(id) {
		if (!id) return;
		return this.game.roomsCollection.get(Room.generateValidId(id));
	}

	/**
	 * Gets a room exit.
	 * @param {Room} room - The room to locate an exit in.
	 * @param {string} name - The name to look up.
	 * @returns The exit in the specified room with the specified name, if applicable. If no such exit exists, returns undefined.
	 */
	getExit(room, name) {
		return room.exitCollection.get(Game.generateValidEntityName(name));
	}

	/**
	 * Gets a fixture.
	 * @param {string} name - The name of the fixture. 
	 * @param {string} [location] - The ID or displayName of the room the fixture is in. 
	 * @returns The fixture with the specified name and location, if applicable. If no such fixture exists, returns undefined.
	 */
	getFixture(name, location) {
		if (!name) return;
		if (location) return this.game.fixtures.find(fixture => fixture.name === Game.generateValidEntityName(name) && fixture.location.id === Room.generateValidId(location));
		else return this.game.fixtures.find(fixture => fixture.name === Game.generateValidEntityName(name));
	}

	/**
	 * Gets a prefab.
	 * @param {string} id - The prefab's ID.
	 * @returns The prefab with the specified ID. If no such prefab exists, returns undefined.
	 */
	getPrefab(id) {
		if (!id) return;
		return this.game.prefabsCollection.get(Game.generateValidEntityName(id));
	}

	/**
	 * Gets a room item.
	 * @param {string} identifier - The room item's identifier or prefab ID.
	 * @param {string} [location] - The ID or displayName of the room the item is in. 
	 * @param {string} [containerName] - The room item's container name.
	 * @returns The room item with the specified identifier, and location and container name if applicable. If no such item exists, returns undefined.
	 */
	getRoomItem(identifier, location, containerName) {
		if (!identifier) return;
		/** @type {Collection<string, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierMatches);
		if (identifier && location) selectedFilters.set(Room.generateValidId(location), matchers.entityLocationIdMatches);
		if (identifier && containerName) selectedFilters.set(Game.generateValidEntityName(containerName), matchers.itemContainerNamePropertyMatches);
		return this.game.roomItems.find(roomItem => roomItem.quantity !== 0 && selectedFilters.every((filterFunction, key) => filterFunction(roomItem, key)));
	}

	/**
	 * Gets a puzzle.
	 * @param {string} name - The name of the puzzle. 
	 * @param {string} [location] - The ID or displayName of the room the puzzle is in. 
	 * @param {string} [type] - The type of the puzzle.
	 * @param {boolean} [accessible] - Whether the puzzle is accessible or not.
	 * @returns The puzzle with the specified name and location, if applicable. If no such puzzle exists, returns undefined.
	 */
	getPuzzle(name, location, type, accessible) {
		if (!name) return;
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		selectedFilters.set(Game.generateValidEntityName(name), matchers.entityNameMatches);
		if (location) selectedFilters.set(Room.generateValidId(location), matchers.entityLocationIdMatches);
		if (type) selectedFilters.set(type.trim(), matchers.puzzleTypeMatches);
		if (accessible !== undefined && accessible !== null) selectedFilters.set(accessible, matchers.entityAccessibleMatches);
		return this.game.puzzles.find(puzzle => selectedFilters.every((filterFunction, key) => filterFunction(puzzle, key)));
	}

	/**
	 * Gets an event.
	 * @param {string} id - The event's ID.
	 * @returns The event with the specified ID. If no such event exists, returns undefined.
	 */
	getEvent(id) {
		if (!id) return;
		return this.game.eventsCollection.get(Game.generateValidEntityName(id));
	}

	/**
	 * Gets a status effect.
	 * @param {string} id - The status effect's ID.
	 * @returns The status effect with the specified ID. If no such status effect exists, returns undefined.
	 */
	getStatusEffect(id) {
		if (!id) return;
		return this.game.statusEffectsCollection.get(Status.generateValidId(id));
	}

	/**
	 * Gets a player.
	 * @param {string} name - The player's name. 
	 * @returns The player with the specified name. If no such player exists, returns undefined.
	 */
	getPlayer(name) {
		if (!name) return;
		return this.game.playersCollection.get(Game.generateValidEntityName(name));
	}

	/**
	 * Gets a living player.
	 * @param {string} name - The player's name. 
	 * @returns The living player with the specified name. If no such player exists, returns undefined.
	 */
	getLivingPlayer(name) {
		if (!name) return;
		return this.game.livingPlayersCollection.get(Game.generateValidEntityName(name));
	}

	/**
	 * Gets a living player by their Discord user ID.
	 * @param {string} id - The ID to search for. 
	 * @returns The living player with the specified user ID. If no such player exists, returns undefined.
	 */
	getLivingPlayerById(id) {
		if (!id) return;
		for (const livingPlayer of this.game.livingPlayersCollection.values()) {
			if (!livingPlayer.isNPC && livingPlayer.id === id) return livingPlayer;
		}
	}

	/**
	 * Gets a dead player.
	 * @param {string} name - The player's name. 
	 * @returns The dead player with the specified name. If no such player exists, returns undefined.
	 */
	getDeadPlayer(name) {
		if (!name) return;
		return this.game.deadPlayersCollection.get(Game.generateValidEntityName(name));
	}

	/**
	 * Gets a given player's hands.
	 * @param {Player} player - The player.
	 * @returns Hands belonging to the player.
	 */
	getPlayerHands(player) {
		if (!player) return [];
		let hands = [];
		if (player.inventoryCollection.has("RIGHT HAND")) hands.push(player.inventoryCollection.get("RIGHT HAND"));
		if (player.inventoryCollection.has("LEFT HAND")) hands.push(player.inventoryCollection.get("LEFT HAND"));
		return hands;
	}

	/** Gets a free hand from the given player.
	 * @param {Player} player - The player.
	 * @returns A free hand of the player. Returns undefined if all hands are occupied.
	 */
	getPlayerFreeHand(player) {
		if (!player) return;
		for (const hand of this.getPlayerHands(player))
			if (hand.equippedItem === null) return hand;
	}

	/** Gets a player's hand equipment slot whose equipped item has the given identifier.
	 * @param {Player} player - The player.
	 * @param {string} identifier - The item identifier or prefab ID in moderator contexts, or its name or plural name in player contexts.
	 * @param {string} [resultContext] - Either `moderator`, `player`, or `combined`. Determines whether to search only identifiers, names, or both. Defaults to `moderator`.
	 * @returns The hand equipment slot holding the specified item. Returns undefined if no such equipment slot exists.
	 */
	getPlayerHandHoldingItem(player, identifier, resultContext = 'moderator') {
		if (!player || !identifier) return;
		/** @type {Collection<string, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (resultContext === 'player') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemNameMatches);
		else if (resultContext === 'combined') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierOrNameMatches);
		else selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierMatches);
		return this.getPlayerHands(player).find(equipmentSlot => equipmentSlot.equippedItem ? selectedFilters.every((filterFunction, key) => filterFunction(equipmentSlot.equippedItem, key)) : false);
	}

	/** Gets a player equipment slot whose equipped item has the given identifier. Will always look up items based on name.
	 * @param {Player} player - The player.
	 * @param {string} identifier - The item identifier or prefab ID in moderator contexts, or its name or plural name in player contexts.
	 * @param {string} [equipmentSlotId] - The ID of the equipment slot the item should be equipped to. Optional.
	 * @param {string} [resultContext] - Either `moderator`, `player`, or `combined`. Determines whether to search only identifiers, names, or both. Defaults to `moderator`.
	 * @returns The equipment slot that has the specified item equipped. Returns undefined if no such equipment slot exists.
	 */
	getPlayerEquipmentSlotWithEquippedItem(player, identifier, equipmentSlotId = "", resultContext = 'moderator') {
		if (!player || !identifier) return;
		/** @type {Collection<string, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (resultContext === 'player') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemNameMatches);
		else if (resultContext === 'combined') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierOrNameMatches);
		else selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierMatches);
		if (equipmentSlotId) {
			equipmentSlotId = Game.generateValidEntityName(equipmentSlotId);
			const equipmentSlot = player.inventoryCollection.get(equipmentSlotId);
			selectedFilters.set(equipmentSlotId, matchers.inventoryItemEquipmentSlotMatches);
			if (equipmentSlot?.equippedItem && selectedFilters.every((filterFunction, key) => filterFunction(equipmentSlot.equippedItem, key))) return equipmentSlot;
		}
		else return player.inventoryCollection.find(equipmentSlot => equipmentSlot.equippedItem ? selectedFilters.every((filterFunction, key) => filterFunction(equipmentSlot.equippedItem, key)) : false);
	}

	/**
	 * Gets an inventory item.
	 * @param {string} identifier - The inventory item's identifier or prefab ID.
	 * @param {string} [player] - The name of the player the inventory item belongs to.
	 * @param {string} [containerName] - The inventory item's container name.
	 * @param {string} [equipmentSlotId] - The ID of the equipment slot the inventory item belongs to.
	 * @returns The inventory item with the specified identifier, and player, container name, and equipment slot if applicable. If no such item exists, returns undefined.
	 */
	getInventoryItem(identifier, player, containerName, equipmentSlotId) {
		if (!identifier) return;
		/** @type {Collection<string, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierMatches);
		if (identifier && player) selectedFilters.set(Game.generateValidEntityName(player), matchers.inventoryItemPlayerNameMatches);
		if (identifier && containerName) selectedFilters.set(Game.generateValidEntityName(containerName), matchers.itemContainerNamePropertyMatches);
		if (identifier && equipmentSlotId) selectedFilters.set(Game.generateValidEntityName(equipmentSlotId), matchers.inventoryItemEquipmentSlotMatches);
		return this.game.inventoryItems.find(inventoryItem => inventoryItem.prefab !== null && inventoryItem.quantity !== 0 && selectedFilters.every((filterFunction, key) => filterFunction(inventoryItem, key)));
	}

	/**
	 * Gets a gesture.
	 * @param {string} id - The gesture's ID.
	 * @returns The gesture with the specified ID. If no such gesture exists, returns undefined.
	 */
	getGesture(id) {
		if (!id) return;
		return this.game.gesturesCollection.get(Gesture.generateValidId(id));
	}

	/**
	 * Gets a flag.
	 * @param {string} id - The flag's ID. 
	 * @returns The flag with the specified ID. If no such flag exists, returns undefined.
	 */
	getFlag(id) {
		if (!id) return;
		return this.game.flags.get(Game.generateValidEntityName(id));
	}

	/**
	 * Gets the value of a flag.
	 * @param {string} id - The flag's ID. 
	 * @param {boolean} [evaluate] - Whether or not to also evaluate the flag's value script and update its value. Does not execute the flag's set commands. Defaults to false.
	 * @returns The value of the flag with the specified ID. If no such flag exists, returns undefined.
	 */
	getFlagValue(id, evaluate = false) {
		const flag = this.getFlag(id);
		if (flag && flag.valueScript && evaluate) {
			const value = flag.evaluate();
			flag.setValue(value, false);
		}
		return flag ? flag.value : undefined;
	}

	/**
	 * Gets a whisper.
	 * @param {string} channelName - The whisper's channel name.
	 * @returns The whisper with the specified channel name. If no such whisper exists, returns undefined.
	 */
	getWhisper(channelName) {
		if (!channelName) return;
		channelName = Room.generateValidId(channelName);
		for (const whisper of this.game.whispers) {
			if (whisper.channelName === channelName) return whisper;
		}
	}

	/**
	 * Gets all rooms that match the given search queries.
	 * @param {string} [id] - Filter the rooms to only those whose ID matches the given ID.
	 * @param {string} [tag] - Filter the rooms to only those with the given tag.
	 * @param {boolean} [occupied] - Filter the rooms to only those who have at least one occupant. If this is `true`, includes NPCs as occupants. If this is `false`, NPCs are not counted.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose ID only contains the given ID. Defaults to false.
	 */
	getRooms(id, tag, occupied, fuzzySearch = false) {
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (id) selectedFilters.set(Room.generateValidId(id), fuzzySearch ? matchers.roomIdContains : matchers.roomIdMatches);
		if (tag) selectedFilters.set(tag.trim(), matchers.roomTagMatches);
		if (occupied !== undefined && occupied !== null) selectedFilters.set(occupied, matchers.roomOccupiedMatches);
		return this.game.roomsCollection.filter(room => selectedFilters.every((filterFunction, key) => filterFunction(room, key))).map(room => room);
	}

	/**
	 * Gets all exits that match the given search queries.
	 * @param {Room} room - Search for exits in this given room
	 * @param {string} [name] - Filter the exits to only those whose name matches the given name.
	 * @param {string} [dest] - Filter the exits to only those whose destination matches the given name.
	 * @param {boolean} [locked] - Filter the exits to only those who are locked (if true) or unlocked (if false).
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose name only contains the given name. Defaults to false.
	 */
	getExits(room, name, dest, locked, fuzzySearch = false) {
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (name) selectedFilters.set(Game.generateValidEntityName(name), fuzzySearch ? matchers.exitNameContains : matchers.exitNameMatches);
		if (dest) selectedFilters.set(Room.generateValidId(dest), matchers.exitDestMatches);
		if (locked !== undefined && locked !== null) selectedFilters.set(locked, matchers.exitLockedMatches);
		return room.exitCollection.filter(exit => selectedFilters.every((filterFunction, key) => filterFunction(exit, key))).map(exit => exit);
	}

	/**
	 * Gets all fixtures that match the given search queries.
	 * @param {string} [name] - Filter the fixtures to only those whose name matches the given name.
	 * @param {string} [location] - Filter the fixtures to only those whose location ID matches the given location ID.
	 * @param {boolean} [accessible] - Filter the fixtures to only those who are accessible or not.
	 * @param {string} [recipeTag] - Filter the fixtures to only those with the given recipe tag.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose name only contains the given name. Defaults to false.
	 */
	getFixtures(name, location, accessible, recipeTag, fuzzySearch = false) {
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (name) selectedFilters.set(Game.generateValidEntityName(name), fuzzySearch ? matchers.entityNameContains : matchers.entityNameMatches);
		if (location) selectedFilters.set(Room.generateValidId(location), matchers.entityLocationIdMatches);
		if (accessible !== undefined && accessible !== null) selectedFilters.set(accessible, matchers.entityAccessibleMatches);
		if (recipeTag) selectedFilters.set(recipeTag.trim(), matchers.fixtureRecipeTagMatches);
		return this.game.fixtures.filter(fixture => selectedFilters.every((filterFunction, key) => filterFunction(fixture, key)));
	}

	/**
	 * Gets all prefabs that match the given search queries.
	 * @param {string} [id] - Filter the prefabs to only those whose ID matches the given ID.
	 * @param {string} [effectsString] - Filter the prefabs to only those who inflict the given comma-separated status effects.
	 * @param {string} [curesString] - Filter the prefabs to only those who cure the given comma-separated status effects.
	 * @param {string} [equipmentSlotsString] - Filter the prefabs to only those who are equippable to the given comma-separated equipment slots.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose ID only contains the given ID. Defaults to false.
	 */
	getPrefabs(id, effectsString, curesString, equipmentSlotsString, fuzzySearch = false) {
		/** @type {Collection<string, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (id) selectedFilters.set(Game.generateValidEntityName(id), fuzzySearch ? matchers.entityIdContains : matchers.entityIdMatches);
		if (effectsString) {
			let effects = effectsString.split(',');
			effects.forEach((effect, i) => effects[i] = Status.generateValidId(effect));
			selectedFilters.set(effects.join(','), matchers.effectsMatches);
		}
		if (curesString) {
			let cures = curesString.split(',');
			cures.forEach((cure, i) => cures[i] = Status.generateValidId(cure));
			selectedFilters.set(cures.join(','), matchers.prefabCuresMatches);
		}
		if (equipmentSlotsString) {
			let equipmentSlots = equipmentSlotsString.split(',');
			equipmentSlots.forEach((equipmentSlot, i) => equipmentSlots[i] = Game.generateValidEntityName(equipmentSlot));
			selectedFilters.set(equipmentSlots.join(','), matchers.prefabEquipmentSlotsMatches);
		}
		return this.game.prefabsCollection.filter(prefab => selectedFilters.every((filterFunction, key) => filterFunction(prefab, key))).map(prefab => prefab);
	}

	/**
	 * Gets all recipes that match the given search queries.
	 * @param {string} [type] - Filter the recipes to only those of the given type.
	 * @param {string} [fixtureTag] - Filter the recipes to only those with the given fixture tag.
	 * @param {string} [ingredientsString] - Filter the recipes to only those with the given comma-separated ingredients.
	 * @param {string} [productsString] - Filter the recipes to only those with the given comma-separated products.
	 */
	getRecipes(type, fixtureTag, ingredientsString, productsString) {
		/** @type {Collection<string, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (type) selectedFilters.set(type.toLowerCase().trim(), matchers.recipeTypeMatches);
		if (fixtureTag) selectedFilters.set(fixtureTag.trim(), matchers.recipeFixtureTagMatches);
		if (ingredientsString) {
			let ingredients = ingredientsString.split(',');
			ingredients.forEach((ingredient, i) => ingredients[i] = Game.generateValidEntityName(ingredient));
			selectedFilters.set(ingredients.join(','), matchers.recipeIngredientsMatches);
		}
		if (productsString) {
			let products = productsString.split(',');
			products.forEach((product, i) => products[i] = Game.generateValidEntityName(product));
			selectedFilters.set(products.join(','), matchers.recipeProductsMatches);
		}
		return this.game.recipes.filter(recipe => selectedFilters.every((filterFunction, key) => filterFunction(recipe, key)));
	}

	/**
	 * Gets all room items that match the given search queries.
	 * @param {string} [identifier] - Filter the room items to only those whose identifier or prefab ID matches the given identifier in moderator contexts, or its name or plural name in player contexts.
	 * @param {string} [location] - Filter the room items to only those whose location ID matches the given location ID.
	 * @param {boolean} [accessible] - Filter the room items to only those who are accessible or not.
	 * @param {string} [containerName] - Filter the room items to only those with the given container name. Does not include slot.
	 * @param {string} [slotId] - Filter the room items to only those in the inventory slot with the given ID.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose ID only contains the given ID. If this is true, automatically makes the result context `combined`. Defaults to false.
	 * @param {string} [resultContext] - Either `moderator`, `player`, or `combined`. Determines whether to search only identifiers, names, or both. Defaults to `moderator`.
	 */
	getRoomItems(identifier, location, accessible, containerName, slotId, fuzzySearch = false, resultContext = 'moderator') {
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (identifier) {
			if (fuzzySearch) selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierOrNameContains)
			else if (resultContext === 'player') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemNameMatches);
			else if (resultContext === 'combined') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierOrNameMatches);
			else selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierMatches);
		}
		if (location) selectedFilters.set(Room.generateValidId(location), matchers.entityLocationIdMatches);
		if (accessible !== undefined && accessible !== null) selectedFilters.set(accessible, matchers.entityAccessibleMatches);
		if (containerName) {
			if (fuzzySearch) selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemContainerIdentifierOrNameContains);
			else if (resultContext === 'player') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemContainerNameMatches);
			else if (resultContext === 'combined') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemContainerIdentifierOrNameMatches);
			else selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierMatches);
		}
		if (slotId) selectedFilters.set(Game.generateValidEntityName(slotId), matchers.itemSlotMatches);
		return this.game.roomItems.filter(roomItem => roomItem.quantity !== 0 && selectedFilters.every((filterFunction, key) => filterFunction(roomItem, key)));
	}

	/**
	 * Gets all puzzles that match the given search queries.
	 * @param {string} [name] - Filter the puzzles to only those whose name matches the given name.
	 * @param {string} [location] - Filter the puzzles to only those whose location ID matches the given location ID.
	 * @param {string} [type] - Filter the puzzles to only those of the given type.
	 * @param {boolean} [accessible] - Filter the puzzles to only those who are accessible or not.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose name only contains the given name. Defaults to false.
	 */
	getPuzzles(name, location, type, accessible, fuzzySearch = false) {
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (name) selectedFilters.set(Game.generateValidEntityName(name), fuzzySearch ? matchers.entityNameContains : matchers.entityNameMatches);
		if (location) selectedFilters.set(Room.generateValidId(location), matchers.entityLocationIdMatches);
		if (type) selectedFilters.set(type.trim(), matchers.puzzleTypeMatches);
		if (accessible !== undefined && accessible !== null) selectedFilters.set(accessible, matchers.entityAccessibleMatches);
		return this.game.puzzles.filter(puzzle => selectedFilters.every((filterFunction, key) => filterFunction(puzzle, key)));
	}

	/**
	 * Gets all events that match the given search queries.
	 * @param {string} [id] - Filter the events to only those whose ID matches the given ID.
	 * @param {boolean} [ongoing] - Filter the events to only those that are ongoing or not.
	 * @param {string} [roomTag] - Filter the events to only those with the given room tag.
	 * @param {string} [effectsString] - Filter the events to only those who inflict the given comma-separated status effects.
	 * @param {string} [refreshesString] - Filter the events to only those who refresh the given comma-separated status effects.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose ID only contains the given ID. Defaults to false.
	 */
	getEvents(id, ongoing, roomTag, effectsString, refreshesString, fuzzySearch = false) {
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (id) selectedFilters.set(Game.generateValidEntityName(id), fuzzySearch ? matchers.entityIdContains : matchers.entityIdMatches);
		if (ongoing !== undefined && ongoing !== null) selectedFilters.set(ongoing, matchers.eventOngoingMatches);
		if (roomTag) selectedFilters.set(roomTag.trim(), matchers.eventRoomTagMatches);
		if (effectsString) {
			let effects = effectsString.split(',');
			effects.forEach((effect, i) => effects[i] = Status.generateValidId(effect));
			selectedFilters.set(effects.join(','), matchers.effectsMatches);
		}
		if (refreshesString) {
			let refreshes = refreshesString.split(',');
			refreshes.forEach((refresh, i) => refreshes[i] = Status.generateValidId(refresh));
			selectedFilters.set(refreshes.join(','), matchers.eventRefreshesMatches);
		}
		return this.game.eventsCollection.filter(event => selectedFilters.every((filterFunction, key) => filterFunction(event, key))).map(event => event);
	}

	/**
	 * Gets all status effects that match the given search queries.
	 * @param {string} [id] - Filter the status effects to only those whose ID matches the given ID.
	 * @param {string} [modifiedStatsString] - Filter the status effects to only those who modify the given stats.
	 * @param {string} [attributesString] - Filter the status effects to only those with the given comma-separated behavior attributes.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose ID only contains the given ID. Defaults to false.
	 */
	getStatusEffects(id, modifiedStatsString, attributesString, fuzzySearch = false) {
		/** @type {Collection<string, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (id) selectedFilters.set(Status.generateValidId(id), fuzzySearch ? matchers.statusIdContains : matchers.statusIdMatches);
		if (modifiedStatsString) {
			let modifiedStats = modifiedStatsString.split(',');
			modifiedStats.forEach((modifiedStat, i) => modifiedStats[i] = Player.abbreviateStatName(modifiedStat));
			selectedFilters.set(modifiedStats.join(','), matchers.statusStatModifiersMatches);
		}
		if (attributesString) {
			let attributes = attributesString.split(',');
			attributes.forEach((attribute, i) => attributes[i] = attribute.trim());
			selectedFilters.set(attributes.join(','), matchers.statusAttributeMatches);
		}
		return this.game.statusEffectsCollection.filter(status => selectedFilters.every((filterFunction, key) => filterFunction(status, key))).map(status => status);
	}

	/**
	 * Gets all living players that match the given search queries.
	 * @param {string} [name] - Filter the players to only those whose name or display name matches the given name.
	 * @param {boolean} [isNPC] - Filter the players to only those who are NPCs or not.
	 * @param {string} [location] - Filter the players to only those whose location ID matches the given location ID.
	 * @param {string} [hidingSpot] - Filter the players to only those whose hiding spot matches the given hiding spot.
	 * @param {string} [statusString] - Filter the players to only those inflicted with all of the given comma-separated status effects.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose name or display name only contains the given name. Defaults to false.
	 */
	getLivingPlayers(name, isNPC, location, hidingSpot, statusString, fuzzySearch = false) {
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (name) selectedFilters.set(name.toLowerCase().trim(), fuzzySearch ? matchers.playerNameOrDisplayNameContains : matchers.playerNameOrDisplayNameMatches);
		if (isNPC !== undefined && isNPC !== null) selectedFilters.set(isNPC, matchers.playerNPCMatches);
		if (location) selectedFilters.set(Room.generateValidId(location), matchers.entityLocationIdMatches);
		if (hidingSpot) selectedFilters.set(Game.generateValidEntityName(hidingSpot), matchers.playerHidingSpotMatches);
		if (statusString) {
			let statuses = statusString.split(',');
			statuses.forEach((status, i) => statuses[i] = Status.generateValidId(status));
			selectedFilters.set(statuses.join(','), matchers.playerStatusMatches);
		}
		return this.game.livingPlayersCollection.filter(player => selectedFilters.every((filterFunction, key) => filterFunction(player, key))).map(player => player);
	}

	/**
	 * Gets all dead players that match the given search queries.
	 * @param {string} [name] - Filter the players to only those whose name or display name matches the given name.
	 * @param {boolean} [isNPC] - Filter the players to only those who are NPCs or not.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose name or display name only contains the given name. Defaults to false.
	 */
	getDeadPlayers(name, isNPC, fuzzySearch = false) {
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (name) selectedFilters.set(name.toLowerCase().trim(), fuzzySearch ? matchers.playerNameOrDisplayNameContains : matchers.playerNameOrDisplayNameMatches);
		if (isNPC !== undefined && isNPC !== null) selectedFilters.set(isNPC, matchers.playerNPCMatches);
		return this.game.deadPlayersCollection.filter(player => selectedFilters.every((filterFunction, key) => filterFunction(player, key))).map(player => player);
	}

	/**
	 * Gets all inventory items that match the given search queries.
	 * @param {string} [identifier] - Filter the inventory items to only those whose identifier or prefab ID matches the given identifier in moderator contexts, or its name or plural name in player contexts.
	 * @param {string} [player] - Filter the inventory items to only those belonging to the given player. 
	 * @param {string} [containerName] - Filter the inventory items to only those with the given container name. Does not include slot.
	 * @param {string} [slotId] - Filter the inventory items to only those in the inventory slot with the given ID.
	 * @param {string} [equipmentSlotId] - Filter the inventory items to only those belonging to the equipment slot with the given ID.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose ID only contains the given ID. If this is true, automatically makes the result context `combined`. Defaults to false.
	 * @param {string} [resultContext] - Either `moderator`, `player`, or `combined`. Determines whether to search only identifiers, names, or both. Defaults to `moderator`.
	 */
	getInventoryItems(identifier, player, containerName, slotId, equipmentSlotId, fuzzySearch = false, resultContext = 'moderator') {
		/** @type {Collection<string, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (identifier) {
			if (fuzzySearch) selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierOrNameContains)
			else if (resultContext === 'player') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemNameMatches);
			else if (resultContext === 'combined') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierOrNameMatches);
			else selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierMatches);
		}
		if (player) selectedFilters.set(Game.generateValidEntityName(player), matchers.inventoryItemPlayerNameMatches);
		if (containerName) {
			if (fuzzySearch) selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemContainerIdentifierOrNameContains);
			else if (resultContext === 'player') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemContainerNameMatches);
			else if (resultContext === 'combined') selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemContainerIdentifierOrNameMatches);
			else selectedFilters.set(Game.generateValidEntityName(identifier), matchers.itemIdentifierMatches);
		}
		if (slotId) selectedFilters.set(Game.generateValidEntityName(slotId), matchers.itemSlotMatches);
		if (equipmentSlotId) selectedFilters.set(Game.generateValidEntityName(equipmentSlotId), matchers.inventoryItemEquipmentSlotMatches);
		return this.game.roomItems.filter(inventoryItem => inventoryItem.prefab !== null && inventoryItem.quantity !== 0 && selectedFilters.every((filterFunction, key) => filterFunction(inventoryItem, key)));
	}

	/**
	 * Gests all gestures that match the given search queries.
	 * @param {string} [id] - Filters the gestures to only those whose ID matches the given ID.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose ID only contains the given ID. Defaults to false.
	 */
	getGestures(id, fuzzySearch = false) {
		/** @type {Collection<string, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (id) selectedFilters.set(Gesture.generateValidId(id), fuzzySearch ? matchers.gestureIdContains : matchers.gestureIdMatches);
		return this.game.gesturesCollection.filter(gesture => selectedFilters.every((filterFunction, key) => filterFunction(gesture, key))).map(gesture => gesture);
	}

	/**
	 * Gets all flags that match the given search queries.
	 * @param {string} [id] - Filters the flags to only those whose ID matches the given ID.
	 * @param {boolean} [fuzzySearch] - Whether or not to include results whose ID only contains the given ID. Defaults to false.
	 */
	getFlags(id, fuzzySearch = false) {
		/** @type {Collection<string|boolean, GameEntityMatcher>} */
		let selectedFilters = new Collection();
		if (id) selectedFilters.set(Game.generateValidEntityName(id), fuzzySearch ? matchers.entityIdContains : matchers.entityIdMatches);
		return this.game.flags.filter(flag => selectedFilters.every((filterFunction, key) => filterFunction(flag, key))).map(flag => flag);
	}
}
