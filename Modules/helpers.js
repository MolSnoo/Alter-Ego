import Game from "../Data/Game.js";
import { EmbedBuilder } from "discord.js";

export function getRandomString (possibilities = []) {
	return possibilities[Math.floor(Math.random() * possibilities.length)];
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