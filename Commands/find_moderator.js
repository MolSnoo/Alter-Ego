import Fixture from '../Data/Fixture.js';
import GameEntity from '../Data/GameEntity.js';
import InventoryItem from '../Data/InventoryItem.js';
import RoomItem from '../Data/RoomItem.js';
import ItemInstance from '../Data/ItemInstance.js';
import Player from '../Data/Player.js';
import Puzzle from '../Data/Puzzle.js';
import Recipe from '../Data/Recipe.js';
import { table } from 'table';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "find_moderator",
    description: "Search in-game data.",
    details: 'Search in-game data and display results with row numbers. You can search for any entry on the spreadsheet, but you must specify which kind of data to find. '
		+ 'With no arguments, all entries of that data type will be displayed. Results will be divided into pages, with no more than 15 entries per page, '
		+ 'or however many will fit in one Discord message. To narrow down the results, you can add a search query. Queries are case-insensitive, '
		+ 'and any entries which contain the search query will be displayed. To examine an entry in more detail, use the view command.\n\n'
		+ 'It is also possible to add specifiers to your search for certain data types. Objects, Items, and Puzzles can be filtered by location '
		+ 'by ending your search query with "at" followed by the name of a Room. Recipes can be filtered by type by starting your search with '
		+ '"crafting", "uncraftable", or "processing".  It is also possible to filter Recipes by comma-separated lists of ingredients and products. '
		+ 'To filter by ingredients, prefix the list with "using"; to filter by products, prefix the list with "producing". '
		+ 'When using specifiers, it is not actually necessary to provide a search query; the results will simply be all entries that match the specified criteria.\n\n'
		+ 'Items and Inventory Items can be filtered by container name and slot, by entering "[preposition] ([slot name] of) [container name]". '
		+ 'The container name is also a search query, so any container whose name, plural name, Prefab ID, or container identifier contains the given string '
		+ 'will be displayed; the same is not true for the slot, however. It is also possible to filter Inventory Items by Equipment Slot and Player. '
		+ 'To filter by Equipment Slot, enter "in" or "on", followed by the name of an Equipment Slot. To filter by Player, enter their name followed by `\'s`, '
		+ 'directly after the preposition, if there is one. Keep in mind that it is not possible to filter by Equipment Slot and container at the same time.',
    usableBy: "Moderator",
    aliases: ["find", "search"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}find room dorm 201\n`
		+ `${settings.commandPrefix}search rooms stoke-hall\n`
		+ `${settings.commandPrefix}find object desk\n`
		+ `${settings.commandPrefix}search objects at chancellors office\n`
		+ `${settings.commandPrefix}find prefab FRIED RICE\n`
		+ `${settings.commandPrefix}search items THIGH HIGH\n`
		+ `${settings.commandPrefix}find item life preserver at beach\n`
		+ `${settings.commandPrefix}search items in trash can\n`
		+ `${settings.commandPrefix}find items on PREP STATIONS at dining-hall-kitchen\n`
		+ `${settings.commandPrefix}search items COLORED PENCILS in MAIN POUCH of BACKPACK at school store\n`
		+ `${settings.commandPrefix}find recipes uncraftable\n`
		+ `${settings.commandPrefix}search recipes crafting producing glass of orange juice\n`
		+ `${settings.commandPrefix}find recipes processing using MILK, RAW EGG producing PANCAKE BATTER, EGGSHELL\n`
		+ `${settings.commandPrefix}search puzzles LOCK\n`
		+ `${settings.commandPrefix}find puzzle COMPUTER at infirmary\n`
		+ `${settings.commandPrefix}search events snow\n`
		+ `${settings.commandPrefix}find status effects medicated\n`
		+ `${settings.commandPrefix}search players an individual wearing a\n`
		+ `${settings.commandPrefix}find inventory items on JACKET\n`
		+ `${settings.commandPrefix}search inventoryitems in RIGHT POCKET of DEFAULT PANTS\n`
		+ `${settings.commandPrefix}find inventoryitem in phoebe's right hand\n`
		+ `${settings.commandPrefix}search inventory item in julie's main pocket of luna purse\n`
		+ `${settings.commandPrefix}find inventoryitem lillie's blue flannel\n`
		+ `${settings.commandPrefix}search gestures smile\n`
		+ `${settings.commandPrefix}find flag SEASON FLAG`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
	let input = args.join(' ');

	if (args.length === 0)
		return addReply(game, message, `You need to specify what kind of data to find. Usage:\n${usage(game.settings)}`);

	const dataTypeRegex = /^((?<Room>rooms?)|(?<Object>objects?)|(?<Prefab>prefabs?)|(?<Recipe>recipes?)|(?<Item>items?)|(?<Puzzle>puzzles?)|(?<Event>events?)|(?<Status>status(?:es)? ?(?:effects?)?)|(?<Player>players?)|(?<InventoryItem>inventory(?: ?items?)?)|(?<Gesture>gestures?)|(?<Flag>flags?))(?<search>.*)/i;
	const dataTypeMatch = input.match(dataTypeRegex);
	if (dataTypeMatch?.groups) {
		const originalInput = input;
		if (dataTypeMatch.groups.search) input = input.substring(input.indexOf(dataTypeMatch.groups.search)).trim();
		let results = [];
		let fields;
		if (dataTypeMatch.groups.Room) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getRooms();
			else results = game.entityFinder.getRooms(dataTypeMatch.groups.search, undefined, undefined, true);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Object) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getFixtures();
			else {
				let name, location;
				const locationRegex = /((?:^| )at (?<location>.+?$))/i;
				const locationMatch = input.match(locationRegex);
				if (locationMatch?.groups?.location) {
					location = locationMatch.groups.location;
					input = input.substring(0, input.indexOf(locationMatch[0])).trim();
				}
				if (input !== '') name = input;
				results = game.entityFinder.getFixtures(name, location, undefined, undefined, true);
			}
			fields = { row: 'Row', name: 'Name', location: 'Location' };
		}
		else if (dataTypeMatch.groups.Prefab) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getPrefabs();
			else results = game.entityFinder.getPrefabs(dataTypeMatch.groups.search, undefined, undefined, undefined, true);
			fields = { row: 'Row', id: 'ID' };
		}
		else if (dataTypeMatch.groups.Recipe) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getRecipes();
			else {
				let type, ingredients, products;
				const typeRegex = /(?<type>^crafting|uncraftable|processing)/i;
				const typeMatch = input.match(typeRegex);
				if (typeMatch?.groups?.type) {
					type = typeMatch.groups.type;
					input = input.substring(typeMatch.groups.type.length).trim();
				}
				const productsRegex = /(producing (?<products>.+?)$)/i;
				const productsMatch = input.match(productsRegex);
				if (productsMatch?.groups?.products) {
					products = productsMatch.groups.products;
					input = input.substring(0, input.indexOf(productsMatch[0])).trim();
				}
				const ingredientsRegex = /((?:using )?(?<ingredients>.+?)$)/i;
				const ingredientsMatch = input.match(ingredientsRegex);
				if (ingredientsMatch?.groups?.ingredients) {
					ingredients = ingredientsMatch.groups.ingredients;
				}
				results = game.entityFinder.getRecipes(type, undefined, ingredients, products);
			}
			fields = { row: 'Row', ingredients: 'Ingredients', products: 'Products' };
		}
		else if (dataTypeMatch.groups.Item) {
			if (!dataTypeMatch.groups.search) {
				results = game.entityFinder.getRoomItems();
				fields = { row: 'Row', id: 'ID', location: 'Location', containerName: 'Container' };
			}
			else {
				let id, location, containerName, slot;
				const locationRegex = /(?:^|.* )(at (?<location>.+?$))/i;
				const locationMatch = input.match(locationRegex);
				if (locationMatch?.groups?.location) {
					location = locationMatch.groups.location;
					input = input.substring(0, input.indexOf(locationMatch[1])).trim();
				}
				const containerSlotRegex = /([^\s]+? (?<slot>.+?) of (?<container>.+))/i;
				const containerRegex = /(?:^|.* )((?:in|on|under|behind|beneath|above|among|with) (?<container>.+))/i;
				const containerSlotMatch = input.match(containerSlotRegex);
				const containerMatch = input.match(containerRegex);
				if (containerSlotMatch?.groups?.slot && containerSlotMatch?.groups?.container) {
					slot = containerSlotMatch.groups.slot;
					containerName = containerSlotMatch.groups.container;
					input = input.substring(0, input.indexOf(containerSlotMatch[0])).trim();
				}
				else if (containerMatch?.groups?.container) {
					containerName = containerMatch.groups.container;
					input = input.substring(0, input.indexOf(containerMatch[1])).trim();
				}
				if (input !== '') id = input;
				results = game.entityFinder.getRoomItems(id, location, undefined, containerName, slot, true);
				fields = { row: 'Row', id: 'ID' };
				// If the user specified a location and a containerName, don't include the location.
				// That way, they're more likely to see the entire containerName, which is searched, not an exact match.
				const locationField = { location: 'Location' };
				const containerField = { containerName: 'Container' };
				if (location && containerName)
					fields = Object.assign(fields, containerField);
				else Object.assign(fields, locationField, containerField);
			}
		}
		else if (dataTypeMatch.groups.Puzzle) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getPuzzles();
			else {
				let name, location;
				const locationRegex = /((?:^| )at (?<location>.+?$))/i;
				const locationMatch = input.match(locationRegex);
				if (locationMatch?.groups?.location) {
					location = locationMatch.groups.location;
					input = input.substring(0, input.indexOf(locationMatch[0])).trim();
				}
				if (input !== '') name = input;
				results = game.entityFinder.getPuzzles(name, location, undefined, undefined, true);
			}
			fields = { row: 'Row', name: 'Name', location: 'Location' };
		}
		else if (dataTypeMatch.groups.Event) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getEvents();
			else results = game.entityFinder.getEvents(dataTypeMatch.groups.search, undefined, undefined, undefined, undefined, true);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Status) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getStatusEffects();
			else results = game.entityFinder.getStatusEffects(dataTypeMatch.groups.search, undefined, undefined, true);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Player) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getLivingPlayers();
			else results = game.entityFinder.getLivingPlayers(dataTypeMatch.groups.search, undefined, undefined, undefined, undefined, true);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.InventoryItem) {
			if (!dataTypeMatch.groups.search) {
				results = game.entityFinder.getInventoryItems();
				fields = { row: 'Row', player: 'Player', id: 'ID', containerName: 'Container' };
			}
			else {
				let id, player, containerName, slot, equipmentSlot;
				const containerSlotRegex = /((?:in|on|under|behind|beneath|above|among|with) (?:(?<player>[^\s]+?)'s )?(?<slot>.+?) of (?<container>.+))/i;
				const equipmentSlotRegex = /(?:^|.* )((?:in|on) (?:(?<player>[^\s]+?)'s )?(?<equipmentSlot>(?:right|left) hand|[^\s]+))$/i;
				const containerRegex = /(?:^|.* )((?:in|on|under|behind|beneath|above|among|with) (?:(?<player>[^\s]+?)'s )?(?<container>.+))/i;
				const containerSlotMatch = input.match(containerSlotRegex);
				const equipmentSlotMatch = input.match(equipmentSlotRegex);
				const containerMatch = input.match(containerRegex);
				if (containerSlotMatch?.groups?.slot && containerSlotMatch?.groups?.container) {
					slot = containerSlotMatch.groups.slot;
					containerName = containerSlotMatch.groups.container;
					if (containerSlotMatch.groups.player) player = containerSlotMatch.groups.player;
					input = input.substring(0, input.indexOf(containerSlotMatch[0])).trim();
				}
				else if (equipmentSlotMatch?.groups?.equipmentSlot) {
					equipmentSlot = equipmentSlotMatch.groups.equipmentSlot;
					if (equipmentSlotMatch.groups.player) player = equipmentSlotMatch.groups.player;
					input = input.substring(0, input.indexOf(equipmentSlotMatch[0])).trim();
				}
				else if (containerMatch?.groups?.container) {
					containerName = containerMatch.groups.container;
					if (containerMatch.groups.player) player = containerMatch.groups.player;
					input = input.substring(0, input.indexOf(containerMatch[0])).trim();
				}
				const playerRegex = /((?<player>[^\s]+?)'s)/i;
				const playerMatch = input.match(playerRegex);
				if (!player && playerMatch?.groups?.player) {
					player = playerMatch.groups.player;
					input = input.substring(playerMatch[0].length).trim();
				}
				if (input !== '') id = input;
				results = game.entityFinder.getInventoryItems(id, player, containerName, slot, equipmentSlot, true);
				fields = { row: 'Row', id: 'ID' };
				// Exclude unneeded fields.
				const playerField = { player: 'Player' };
				const equipmentSlotField = { equipmentSlot: 'Equip. Slot' };
				const containerField = { containerName: 'Container' };
				if (player && (equipmentSlot || containerName))
					fields = Object.assign(fields, containerField);
				else if (player)
					fields = Object.assign(fields, equipmentSlotField, containerField);
				else if (equipmentSlot)
					fields = Object.assign(fields, playerField, containerField);
				else fields = Object.assign(fields, playerField, equipmentSlotField, containerField);
			}
			
		}
		else if (dataTypeMatch.groups.Gesture) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getGestures();
			else results = game.entityFinder.getGestures(dataTypeMatch.groups.search, true);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Flag) {
			if (!dataTypeMatch.groups.search) results = game.entityFinder.getFlags();
			else results = game.entityFinder.getFlags(dataTypeMatch.groups.search, true);
			fields = { row: 'Row', id: 'ID' };
		}
		else return addReply(game, message, `Couldn't find a valid data type in "${originalInput}". Usage:\n${usage(game.settings)}`);
		
		if (results.length === 0)
			return addGameMechanicMessage(game, game.guildContext.commandChannel, `Found 0 results.`);
		// Divide the results into pages.
		const pages = createPages(fields, results);
		let page = 0;

		const resultCountString = `Found ${results.length} result` + (results.length === 1 ? '' : 's') + `.`;
		let pageString = pages.length > 1 ? ` Showing page ${page + 1}/${pages.length}.\n` : '\n';
		let resultsDisplay = '```' + table(pages[page]) + '```';
		game.guildContext.commandChannel.send(resultCountString + pageString + resultsDisplay).then(msg => {
			if (pages.length > 1) {
				msg.react('⏪').then(() => {
					msg.react('⏩');

					const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
					const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

					const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 300000 });
					const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 300000 });

					backwards.on("collect", () => {
						const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏪');
						if (reaction) reaction.users.cache.forEach(user => { if (user.id !== game.botContext.client.user.id) reaction.users.remove(user.id); });
						if (page === 0) return;
						page--;
						pageString = ` Showing page ${page + 1}/${pages.length}.\n`;
						resultsDisplay = '```' + table(pages[page]) + '```';
						msg.edit(resultCountString + pageString + resultsDisplay);
					});

					forwards.on("collect", () => {
						const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏩');
						if (reaction) reaction.users.cache.forEach(user => { if (user.id !== game.botContext.client.user.id) reaction.users.remove(user.id); });
						if (page === pages.length - 1) return;
						page++;
						pageString = ` Showing page ${page + 1}/${pages.length}.\n`;
						resultsDisplay = '```' + table(pages[page]) + '```';
						msg.edit(resultCountString + pageString + resultsDisplay);
					});
            	});
			}
		});
	}
	else addReply(game, message, `Couldn't find "${input}". Usage:\n${usage(game.settings)}`);
}

/**
 * Divides all of the results into pages to be displayed as a table.
 * Ensures that the length of the table will never exceed Discord's maximum character limit.
 * @param {object} fields - The fields of the respective game entity to use as column headers.
 * @param {GameEntity[]} results - All results found from the search.
 * @returns {string[][][]} An array of rows and columns to convert into a table.
 */
function createPages(fields, results) {
	// Divide the results into pages.
	const pages = [];
	let page = [];
	const header = [];
	const headerEntryLength = [];
	const fieldCount = Object.keys(fields).length;
	const cellCharacterLimit = 
		fieldCount <= 2 ? 80
		: fieldCount === 3 ? 37
		: fieldCount === 4 ? 26
		: 20;
	Object.values(fields).forEach(value => {
		header.push(value);
		headerEntryLength.push(value.length);
	});
	page.push(header);

	const widestEntryLength = [...headerEntryLength];
	
	for (let i = 0, pageNo = 0; i < results.length; i++) {
		// Create a new row.
		const row = [];
		Object.keys(fields).forEach((key, j) => {
			// Some fields require special access to get a string value. Handle those here.
			let cellContents = "";
			const result = results[i];
			if (key === 'location' && (result instanceof Fixture || result instanceof RoomItem || result instanceof Player || result instanceof Puzzle))
				cellContents = result.location.displayName;
			else if (key === 'player' && result instanceof InventoryItem)
				cellContents = result.player.name;
			else if (key === 'id' && result instanceof ItemInstance)
				cellContents = result.getIdentifier();
			else if (key === 'ingredients' && result instanceof Recipe)
				cellContents = result.ingredients.map(ingredient => ingredient.id).join(',');
			else if (key === 'products' && result instanceof Recipe)
				cellContents = result.products.map(product => product.id).join(',');
			else
				cellContents = String(result[key]);
			// If the cellContents exceed the preset character limit, truncate it.
			if (cellContents.length >= cellCharacterLimit)
				cellContents = cellContents.substring(0, cellCharacterLimit) + '…';
			// If the cellContents would make this the widest entry for this column, update the widestEntryLength.
			if (cellContents.length > widestEntryLength[j])
				widestEntryLength[j] = cellContents.length;
			row.push(cellContents);
		});
		// If the new row would cause the current page to exceed 15 entries per page or Discord's message character limit of 2000, make a new page.
		// Here, rowLength is multiplied by the number of rows in the current page plus 3: one new row, one divider per row, plus a top and bottom border.
		const rowLength = calculateRowLength(widestEntryLength);
		if (page.length >= 15 || rowLength * (2 * page.length + 3) > 2000 - 50) {
			pages.push(page);
			pageNo++;
			page = [];
			page.push(header);
			for (let k = 0; k < widestEntryLength.length; k++) {
				if (widestEntryLength[k] < headerEntryLength[k]) widestEntryLength[k] = headerEntryLength[k];
			}
		}
		page.push(row);
	}
	pages.push(page);
	return pages;
}

/**
 * Calculates the length of the row in terms of character count.
 * @param {number[]} widestEntryLength - The current widest entry of each row in every column.
 */
function calculateRowLength(widestEntryLength) {
	const cellPadding = 2;
	const cellBorders = widestEntryLength.length + 1;
	const newLine = 1;
	let rowLength = 0;
	for (const entry of widestEntryLength)
		rowLength += entry + cellPadding;
	return rowLength + cellBorders + newLine;
}
