import { format } from 'pretty-format';

/**
 * Returns a pretty string representation of the given object with unneeded data filtered out.
 * @param {any} object - The object to display.
 */
export function prettyString(object) {
	return format(object, {
		plugins: [simpleFilterPlugin, complexFilterPlugin],
		indent: 4
	});
}

/**
 * Returns a copy of the object to display in console.log with certain properties excluded.
 * @param {any} object - The object to display.
 */
export function prettyObject(object) {
	const filteredProperties = new Set([
		'game', 'guild', 'member', 'channel', 'spectateChannel', 'timer'
	]);
	return Object.fromEntries(Object.entries(object).filter(property => !filteredProperties.has(property[0])));
}

const simpleFilter = new Set([
	'Game', 'Guild', 'GuildMember', 'TextChannel', 'Duration', 'Timeout',
	'Timer', 'Status', 'Gesture'
]);

const simpleFilterPlugin = {
	test: (val) => {
		if (val === null || typeof val !== 'object') return false;
		return simpleFilter.has(val.constructor?.name);
	},

	print: (val) => {
		const constructorName = val.constructor?.name;

		switch (constructorName) {
			case 'Guild':
				return `<Guild "${val.name || 'unknown'}">`;
			case 'GuildMember':
				return `<GuildMember "${val.displayName || 'unknown'}">`;
			case 'TextChannel':
				return `<TextChannel "${val.name || 'unknown'}">`;
			case 'Duration':
				return `<Duration ${val.humanize?.() || 'unknown'}>`;
			case 'Timeout':
				return `<Timeout ${val._idleTimeout}ms>`;
			case 'Timer':
				return `<Timer ${val.timerDuration}ms>`;
			case 'Status':
				return `<Status "${val.name}" lasting ${val.duration?.humanize?.() || 'unknown'}>`;
			case 'Gesture':
				return `<Gesture "${val.name}">`;
			default:
				return `<${constructorName || 'Unknown'}>`;
		}
	}
};

const complexFilter = new Set([
	'Player', 'Room'
]);

const complexProcessing = new Set();

const complexFilterPlugin = {
	test: (val) => {
		if (val === null || typeof val !== 'object') return false;
		if (complexProcessing.has(val)) return false;
		return complexFilter.has(val.constructor?.name);
	},

	serialize: (val, config, indentation, depth, refs, printer) => {
		const constructorName = val.constructor?.name;

		switch (constructorName) {
			case 'Player':
				if (depth > 2) {
					return `<Player ${val.name}>`;
				} else {
					complexProcessing.add(val);
					let serialized = printer(val, config, indentation, depth, refs);
					complexProcessing.delete(val);
					return serialized;
				}
			case 'Room':
				if (depth > 2) {
					let occupants = val.occupants.length
						? ` occupied by ${val.occupants.map(player => player.name).join(', ')}`
						: '';
					return `<Room ${val.name}${occupants}>`;
				} else {
					complexProcessing.add(val);
					let serialized = printer(val, config, indentation, depth, refs);
					complexProcessing.delete(val);
					return serialized;
				}
			default:
				return `<${constructorName || 'Unknown'}>`;
		}
	}
}