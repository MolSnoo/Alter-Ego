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
	if (dataTypeMatch.groups) {
		let results = [];
		let fields;
		if (dataTypeMatch.groups.Room) {
			if (!dataTypeMatch.groups.search) results = finder.findRooms();
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Object) {
			if (!dataTypeMatch.groups.search) results = finder.findObjects();
			fields = { row: 'Row', name: 'Name', location: 'Location' };
		}
		else if (dataTypeMatch.groups.Prefab) {
			if (!dataTypeMatch.groups.search) results = finder.findPrefabs();
			fields = { row: 'Row', id: 'ID' };
		}
		else if (dataTypeMatch.groups.Recipe) {
			if (!dataTypeMatch.groups.search) results = finder.findRecipes();
			fields = { row: 'Row', ingredients: 'Ingredients', products: 'Products' };
		}
		else if (dataTypeMatch.groups.Item) {
			if (!dataTypeMatch.groups.search) results = finder.findItems();
			fields = { row: 'Row', id: 'ID', location: 'Location', containerName: 'Container' };
		}
		else if (dataTypeMatch.groups.Puzzle) {
			if (!dataTypeMatch.groups.search) results = finder.findPuzzles();
			fields = { row: 'Row', name: 'Name', location: 'Location' };
		}
		else if (dataTypeMatch.groups.Event) {
			if (!dataTypeMatch.groups.search) results = finder.findEvents();
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Status) {
			if (!dataTypeMatch.groups.search) results = finder.findStatusEffects();
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Player) {
			if (!dataTypeMatch.groups.search) results = finder.findPlayers();
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.InventoryItem) {
			if (!dataTypeMatch.groups.search) results = finder.findInventoryItems();
			fields = { row: 'Row', player: 'Player', id: 'ID', containerName: 'Container' };
		}
		else if (dataTypeMatch.groups.Gesture) {
			if (!dataTypeMatch.groups.search) results = finder.findGestures();
			fields = { row: 'Row', name: 'Name' };
		}
		else if (dataTypeMatch.groups.Flag) {
			if (!dataTypeMatch.groups.search) results = finder.findFlags();
			fields = { row: 'Row', id: 'ID' };
		}
		else return game.messageHandler.addReply(message, `Couldn't find a valid data type in "${input}". Usage:\n${exports.config.usage}`);
		
		if (results.length === 0)
			return game.messageHandler.addGameMechanicMessage(message.channel, `Found 0 results.`);
		// Divide the results into pages.
		let pages = [];
		let page = 0;
		for (let i = 0, pageNo = 0; i < results.length; i++) {
			// Divide the results into groups of 9.
			if (i % 9 === 0) {
				pages.push([]);
				if (i !== 0) pageNo++;
			}
			pages[pageNo].push(results[i]);
		}

		const resultCountString = `Found ${results.length} result` + (results.length === 1 ? '' : 's') + `.`;
		let pageString = pages.length > 1 ? ` Showing page ${page + 1}/${pages.length}.\n` : '\n';
		let resultsDisplay = '```' + displayResults(fields, page, pages) + '```';
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
						resultsDisplay = '```' + displayResults(fields, page, pages) + '```';
						msg.edit(resultCountString + pageString + resultsDisplay);
					});

					forwards.on("collect", () => {
						const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏩');
						if (reaction) reaction.users.cache.forEach(user => { if (user.id !== bot.user.id) reaction.users.remove(user.id); });
						if (page === pages.length - 1) return;
						page++;
						pageString = ` Showing page ${page + 1}/${pages.length}.\n`;
						resultsDisplay = '```' + displayResults(fields, page, pages) + '```';
						msg.edit(resultCountString + pageString + resultsDisplay);
					});
            	});
			}
		});
	}
	else game.messageHandler.addReply(message, `Couldn't find "${input}". Usage:\n${exports.config.usage}`);
};

function displayResults(fields, page, pages) {
	let data = [];
	// Add the header.
	let header = [];
	Object.values(fields).forEach(value => header.push(value));
	data.push(header);

	for (let entry of pages[page]) {
		let row = [];
		Object.keys(fields).forEach(key => {
			if (key === 'location') row.push(entry.location.name);
			else if (key === 'player') row.push(entry.player.name);
			else if (key === 'id' && Object.hasOwn(entry, 'prefab')) row.push(entry.identifier !== '' ? entry.identifier : entry.prefab.id);
			else if (key === 'ingredients') row.push(entry.ingredients.map(ingredient => ingredient.id).join(','));
			else if (key === 'products') row.push(entry.products.map(product => product.id).join(','));
			else row.push(entry[key]);
		});
		data.push(row);
	}
	return table(data);
}