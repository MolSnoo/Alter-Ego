import { ActivityType, Client, Collection } from "discord.js";
import Game from "../Data/Game.js";
import { sendQueuedMessages } from "../Modules/messageHandler.js";

/**
 * @class BotContext
 * @classdesc Represents the bot as a singleton.
 * @constructor
 * @param {Client} client - The Discord Client associated with the bot.
 * @param {Collection<string, Command>} commands - All commands the bot recognizes.
 * @param {Collection<string, CommandConfig>} commandConfigs - The configs for each command.
 * @param {Game} game - The game the bot is managing.
 */
export default class BotContext {
	/** @type {BotContext} */
	static instance;

	/** @type NodeJS.Timeout */
	#queuedMessageSendInterval;
	/** @type NodeJS.Timeout */
	#presenceUpdateInterval;

	/**
	 * @param {Client} client 
	 * @param {Collection<string, Command>} commands 
	 * @param {Collection<string, CommandConfig>} commandConfigs 
	 * @param {Game} game
	 */
	constructor(client, commands, commandConfigs, game) {
		if (BotContext.instance) {
			return BotContext.instance;
		}
		this.client = client;
		this.commands = commands;
		this.commandConfigs = commandConfigs;
		this.game = game;
		/** @type {Array<CommandLogEntry>} */
		this.commandLog = [];
		// Send messages in message queue every quarter of a second.
		this.#queuedMessageSendInterval = setInterval(
			() => sendQueuedMessages(),
			0.25 * 1000
		);
		// Update user presence every 30 seconds.
		this.#presenceUpdateInterval = setInterval(
			() => this.updatePresence(),
			30 * 1000
		);

		BotContext.instance = this;
	}

	updatePresence() {
		let onlineSuffix = '';
		if (this.game.settings.showOnlinePlayerCount && this.game.inProgress && !this.game.canJoin) {
			let onlinePlayers = 0;
			this.game.players_alive.forEach(player => {
				if (player.online) onlinePlayers++;
			});
			const statusSuffix = onlinePlayers === 1 ? "player online" : "players online";
			onlineSuffix = ` - ${onlinePlayers} ${statusSuffix}`;
		}

		const activityName =
			this.game.settings.debug ? `${this.game.settings.debugModeActivity.name}${onlineSuffix}`
			: this.game.inProgress && !this.game.canJoin ? `${this.game.settings.gameInProgressActivity.name}${onlineSuffix}`
			: this.game.settings.onlineActivity.name;
		const activityType = this.game.settings.debug ? this.game.settings.debugModeActivity.type
			: this.game.inProgress && !this.game.canJoin ? this.game.settings.gameInProgressActivity.type
			: this.game.settings.onlineActivity.type;
		let url;
		if (this.game.inProgress && !this.game.canJoin) url = this.game.settings.gameInProgressActivity.url;

		/** @type import("discord.js").PresenceData */
		const presence = {
			status: this.game.settings.debug ? "dnd" : "online",
			activities: [
				{
					name: activityName,
					type: activityType,
					url: url
				}
			]
		};
		this.client.user.setPresence(presence);
	}

	/** 
	 * @param {string} type 
	 * @returns {ActivityType}
	 * */
	static getActivityType(type) {
		switch (type.toUpperCase()) {
			case "PLAYING":
				return ActivityType.Playing;
			case "STREAMING":
				return ActivityType.Streaming;
			case "LISTENING":
				return ActivityType.Listening;
			case "WATCHING":
				return ActivityType.Watching;
			case "COMPETING":
				return ActivityType.Competing;
			case "CUSTOM":
				return ActivityType.Custom;
		}
	}
}
