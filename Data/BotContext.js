import { Client, Collection } from "discord.js";

/**
 * @class BotContext
 * @classdesc Represents the bot as a singleton.
 * @constructor
 * @param {Client} client - The Discord Client associated with the bot.
 * @param {Collection} commands - All commands the bot recognizes.
 * @param {Collection} commandConfigs - The configs for each command.
 */
export default class BotContext {
	/** @type {BotContext} */
	static instance;

	/**
	 * @param {Client} client 
	 * @param {Collection} commands 
	 * @param {Collection} commandConfigs 
	 * @returns 
	 */
	constructor(client, commands, commandConfigs) {
		if (BotContext.instance) {
			return BotContext.instance;
		}
		this.client = client;
		this.commands = commands;
		this.commandConfigs = commandConfigs;
		/** @type {Array<CommandLogEntry>} */
		this.commandLog = [];

		BotContext.instance = this;
	}
}