import Game from "../Data/Game.js";
import Player from "../Data/Player.js";
import RoomItem from "../Data/RoomItem.js";
import { EmbedBuilder } from "discord.js";
import { Duration } from 'luxon';

/**
 * Gets a random string out of an array of possibilties.
 * @param {string[]} possibilities - A list of strings to choose from.
 * @returns A randomly chosen entry from possibilities.
 */
export function getRandomString(possibilities = []) {
	return possibilities[Math.floor(Math.random() * possibilities.length)];
}

/**
 * Generates a grammatically correct list of players, sorted alphabetically by display name.
 * @param {Player[]} players - A list of players.
 */
export function generatePlayerListString(players) {
	players.sort((a, b) => {
		const nameA = a.displayName.toLowerCase();
		const nameB = b.displayName.toLowerCase();
		if (nameA < nameB) return -1;
		if (nameA > nameB) return 1;
		return 0;
	});
	const playerList = players.map(player => player.displayName);
	return generateListString(playerList);
}

/**
 * Generates a gramatically correct list.
 * @param {string[]} list 
 */
export function generateListString(list) {
	let listString = "";
	if (list.length === 1) listString = list[0];
	else if (list.length === 2)
		listString += `${list[0]} and ${list[1]}`;
	else if (list.length >= 3) {
		for (let i = 0; i < list.length - 1; i++)
			listString += `${list[i]}, `;
		listString += `and ${list[list.length - 1]}`;
	}
	return listString;
}

/**
 * Generates a comma-separated list of items, sorted alphabetically by prefab ID.
 * @param {RoomItem[]} items - A list of room items.
 */
export function getSortedItemsString(items) {
	return items.sort(function (a, b) {
		if (a.prefab.id < b.prefab.id) return -1;
		if (a.prefab.id > b.prefab.id) return 1;
		return 0;
	}).map(item => item.prefab.id).join(',');
}

/**
 * Parses a duration string and returns a duration object.
 * @param {string} durationString - An integer and a unit. Acceptable units: y, M, w, d, h, m, s.
 * @returns A duration object, or null.
 */
export function parseDuration(durationString) {
	let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
	let durationUnit = durationString.charAt(durationString.length - 1);
	/** @type {import("luxon").DurationLikeObject} */
	let durationInput = {}
	if (durationString) {
		switch (durationUnit) {
			case 'y':
				durationInput.years = durationInt;
			case 'M':
				durationInput.months = durationInt;
			case 'w':
				durationInput.weeks = durationInt;
			case 'd':
				durationInput.days = durationInt;
			case 'h':
				durationInput.hours = durationInt;
			case 'm':
				durationInput.minutes = durationInt;
			case 's':
				durationInput.seconds = durationInt;
		}
	}
	return Duration.fromObject(durationInput);
}

/**
 * Converts a time string to a luxon duration input object.
 * @param {string} timeString - The string to convert. The format is `D? HH:mm:ss`, e.g. `1 23:59:59`.
 * @returns {import("luxon").DurationObjectUnits} The input object to pass into the duration constructor.
 */
export function convertTimeStringToDurationUnits(timeString) {
	const timeRegex = /^(?<days>\d+)? ?(?<hours>\d{2}):(?<minutes>\d{2}):(?<seconds>\d{2})$/;
	const timeMatch = timeString.match(timeRegex);
	if (timeMatch?.groups) {
		const daysValue = timeMatch.groups.days ? parseInt(timeMatch.groups.days) : 0;
		const hoursValue = timeMatch.groups.hours ? parseInt(timeMatch.groups.hours) : 0;
		const minutesValue = timeMatch.groups.minutes ? parseInt(timeMatch.groups.minutes) : 0;
		const secondsValue = timeMatch.groups.seconds ? parseInt(timeMatch.groups.seconds) : 0;
		return {
			days: daysValue,
			hours: hoursValue,
			minutes: minutesValue,
			seconds: secondsValue
		};
	}
}

/**
 * Creates a page of an embed.
 * @param {Game} game - The game context.
 * @param {number} page - The current page number.
 * @param {*[][]} pages - All of the entries, divided into pages.
 * @param {string} authorName - The title of the embed.
 * @param {string} authorIcon - The thumbnail URL to display for the embed.
 * @param {string} description - The description of the embed.
 * @param {(entryIndex: any) => string} getFieldName - A function to generate the name of each field in the embed.
 * @param {(entryIndex: any) => string} getFieldValue - A function to generate the value of each field in the embed.
 */
export function createPaginatedEmbed(game, page, pages, authorName, authorIcon, description, getFieldName, getFieldValue) {
	let embed = new EmbedBuilder()
		.setColor(Number(`0x${game.settings.embedColor}`))
		.setAuthor({ name: authorName, iconURL: authorIcon })
		.setDescription(description)
		.setFooter({ text: `Page ${page + 1}/${pages.length}` });
	let fields = [];
	for (let entryIndex = 0; entryIndex < pages[page].length; entryIndex++)
		fields.push({ name: getFieldName(entryIndex), value: getFieldValue(entryIndex) });
	embed.addFields(fields);
	return embed;
}