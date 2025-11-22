const finder = require('../Modules/finder.js');

const { table } = require('table');

module.exports.config = {
    name: "find_moderator",
    description: " ",
    details: '',
    usage: ``,
    usableBy: "Moderator",
    aliases: ["find", "search"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
	let input = args.join(' ');

	if (args.length === 0)
		return game.messageHandler.addReply(message, `You need to specify what kind of data to find. Usage:\n${exports.config.usage}`);

	const dataTypeRegex = /^((?<Room>rooms?)|(?<Object>objects?)|(?<Prefab>prefabs?)|(?<Recipe>recipes?)|(?<Item>items?)|(?<Puzzle>puzzles?)|(?<Event>events?)|(?<Status>status(?:es)? ?(?:effects?)?)|(?<Player>players?)|(?<InventoryItem>inventory(?: ?items?)?)|(?<Gesture>gestures?)|(?<Flag>flags?))(?<search>.*)/i;
	const dataTypeMatch = input.match(dataTypeRegex);
	if (dataTypeMatch?.groups) {
		const originalInput = input;
		if (dataTypeMatch.groups.search) input = input.substring(input.indexOf(dataTypeMatch.groups.search)).trim();
		let results = [];
		let fields;
		if (dataTypeMatch.groups.Room) {
			if (!dataTypeMatch.groups.search) results = finder.findRooms();
			else results = finder.findRooms(dataTypeMatch.groups.search);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Object) {
			if (!dataTypeMatch.groups.search) results = finder.findObjects();
			else {
				let name, location;
				const locationRegex = /((?:^| )at (?<location>.+?$))/i;
				const locationMatch = input.match(locationRegex);
				if (locationMatch?.groups?.location) {
					location = locationMatch.groups.location;
					input = input.substring(0, input.indexOf(locationMatch[0])).trim();
				}
				if (input !== '') name = input;
				results = finder.findObjects(name, location);
			}
			fields = { row: 'Row', name: 'Name', location: 'Location' };
		}
		else if (dataTypeMatch.groups.Prefab) {
			if (!dataTypeMatch.groups.search) results = finder.findPrefabs();
			else results = finder.findPrefabs(dataTypeMatch.groups.search);
			fields = { row: 'Row', id: 'ID' };
		}
		else if (dataTypeMatch.groups.Recipe) {
			if (!dataTypeMatch.groups.search) results = finder.findRecipes();
			else {
				let type, ingredients, products;
				const typeRegex = /(?<type>^crafting|processing)/i;
				const typeMatch = input.match(typeRegex);
				if (typeMatch?.groups?.type) {
					type = typeMatch.groups.type;
					input = input.substring(typeMatch.groups.type.length).trim();
				}
				const productsRegex = /(producing (?<products>.+?)$)/i;
				const productsMatch = input.match(productsRegex);
				if (productsMatch?.groups?.products) {
					products = productsMatch.groups.products.split(',');
					input = input.substring(0, input.indexOf(productsMatch[0])).trim();
				}
				const ingredientsRegex = /((?:using )?(?<ingredients>.+?)$)/i;
				const ingredientsMatch = input.match(ingredientsRegex);
				if (ingredientsMatch?.groups?.ingredients) {
					ingredients = ingredientsMatch.groups.ingredients.split(',');
				}
				results = finder.findRecipes(type, ingredients, products);
			}
			fields = { row: 'Row', ingredients: 'Ingredients', products: 'Products' };
		}
		else if (dataTypeMatch.groups.Item) {
			if (!dataTypeMatch.groups.search) results = finder.findItems();
			fields = { row: 'Row', id: 'ID', location: 'Location', containerName: 'Container' };
		}
		else if (dataTypeMatch.groups.Puzzle) {
			if (!dataTypeMatch.groups.search) results = finder.findPuzzles();
			else {
				let name, location;
				const locationRegex = /((?:^| )at (?<location>.+?$))/i;
				const locationMatch = input.match(locationRegex);
				if (locationMatch?.groups?.location) {
					location = locationMatch.groups.location;
					input = input.substring(0, input.indexOf(locationMatch[0])).trim();
				}
				if (input !== '') name = input;
				results = finder.findPuzzles(name, location);
			}
			fields = { row: 'Row', name: 'Name', location: 'Location' };
		}
		else if (dataTypeMatch.groups.Event) {
			if (!dataTypeMatch.groups.search) results = finder.findEvents();
			else results = finder.findEvents(dataTypeMatch.groups.search);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Status) {
			if (!dataTypeMatch.groups.search) results = finder.findStatusEffects();
			else results = finder.findStatusEffects(dataTypeMatch.groups.search);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Player) {
			if (!dataTypeMatch.groups.search) results = finder.findPlayers();
			else results = finder.findPlayers(dataTypeMatch.groups.search);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.InventoryItem) {
			if (!dataTypeMatch.groups.search) results = finder.findInventoryItems();
			fields = { row: 'Row', player: 'Player', id: 'ID', containerName: 'Container' };
		}
		else if (dataTypeMatch.groups.Gesture) {
			if (!dataTypeMatch.groups.search) results = finder.findGestures();
			else results = finder.findGestures(dataTypeMatch.groups.search);
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Flag) {
			if (!dataTypeMatch.groups.search) results = finder.findFlags();
			else results = finder.findFlags(dataTypeMatch.groups.search);
			fields = { row: 'Row', id: 'ID' };
		}
		else return game.messageHandler.addReply(message, `Couldn't find a valid data type in "${originalInput}". Usage:\n${exports.config.usage}`);
		
		if (results.length === 0)
			return game.messageHandler.addGameMechanicMessage(message.channel, `Found 0 results.`);
		// Divide the results into pages.
		const pages = createPages(fields, results);
		let page = 0;

		const resultCountString = `Found ${results.length} result` + (results.length === 1 ? '' : 's') + `.`;
		let pageString = pages.length > 1 ? ` Showing page ${page + 1}/${pages.length}.\n` : '\n';
		let resultsDisplay = '```' + table(pages[page]) + '```';
		message.channel.send(resultCountString + pageString + resultsDisplay).then(msg => {
			if (pages.length > 1) {
				msg.react('⏪').then(() => {
					msg.react('⏩');

					const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
					const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

					const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 300000 });
					const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 300000 });

					backwards.on("collect", () => {
						const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏪');
						if (reaction) reaction.users.cache.forEach(user => { if (user.id !== bot.user.id) reaction.users.remove(user.id); });
						if (page === 0) return;
						page--;
						pageString = ` Showing page ${page + 1}/${pages.length}.\n`;
						resultsDisplay = '```' + table(pages[page]) + '```';
						msg.edit(resultCountString + pageString + resultsDisplay);
					});

					forwards.on("collect", () => {
						const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏩');
						if (reaction) reaction.users.cache.forEach(user => { if (user.id !== bot.user.id) reaction.users.remove(user.id); });
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
	else game.messageHandler.addReply(message, `Couldn't find "${input}". Usage:\n${exports.config.usage}`);
};

function createPages(fields, results) {
	// Divide the results into pages.
	let pages = [];
	let page = [];
	let header = [];
	let headerEntryLength = [];
	Object.values(fields).forEach(value => {
		header.push(value);
		headerEntryLength.push(value.length);
	});
	page.push(header);

	let widestEntryLength = [...headerEntryLength];
	
	for (let i = 0, pageNo = 0; i < results.length; i++) {
		// If the new row would cause the current page to exceed 15 entries per page or Discord's message character limit of 2000, make a new page.
		// Here, rowLength is multiplied by the number of rows in the current page plus 3: one new row, one divider per row, plus a top and bottom border.
		const rowLength = calculateRowLength(widestEntryLength);
		if (page.length >= 15 || rowLength >= 90 || rowLength * (2 * page.length + 3) > 2000 - 50) {
			pages.push(page);
			pageNo++;
			page = [];
			page.push(header);
			widestEntryLength = [...headerEntryLength];
		}
		// Create a new row.
		let row = [];
		Object.keys(fields).forEach((key, j) => {
			// Some fields require special access to get a string value. Handle those here.
			let cellContents = "";
			if (key === 'location')
				cellContents = results[i].location.name;
			else if (key === 'player')
				cellContents = results[i].player.name;
			else if (key === 'id' && Object.hasOwn(results[i], 'prefab'))
				cellContents = results[i].identifier !== '' ? results[i].identifier : results[i].prefab.id;
			else if (key === 'ingredients')
				cellContents = results[i].ingredients.map(ingredient => ingredient.id).join(',');
			else if (key === 'products')
				cellContents = results[i].products.map(product => product.id).join(',');
			else
				cellContents = results[i][key];
			// If the cellContents would make this the widest entry for this column, update the widestEntryLength.
			if (cellContents.length > widestEntryLength[j])
				widestEntryLength[j] = cellContents.length;
			row.push(cellContents);
		});
		page.push(row);
	}
	pages.push(page);
	return pages;
}

function calculateRowLength(widestEntryLength) {
	const cellPadding = 2;
	const cellBorders = widestEntryLength.length + 1;
	const newLine = 1;
	let rowLength = 0;
	for (const entry of widestEntryLength)
		rowLength += entry + cellPadding;
	return rowLength + cellBorders + newLine;
}
