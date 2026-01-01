import { ActivityType, Collection } from "discord.js";
import PrettyPrinter from "./PrettyPrinter.js";

/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("./BotCommand.js").default} BotCommand */
/** @typedef {import("./ModeratorCommand.js").default} ModeratorCommand */
/** @typedef {import("./PlayerCommand.js").default} PlayerCommand */
/** @typedef {import("./EligibleCommand.js").default} EligibleCommand */
/** @typedef {(import("discord.js").Client)} Client */

/**
 * @class BotContext
 * @classdesc Represents the bot as a singleton.
 */
export default class BotContext {
	/**
	 * The single instance of the bot that can exist.
	 * @type {BotContext}
	 */
	static instance;
	/** 
	 * The Discord Client associated with the bot.
	 * @readonly
	 * @type {Client}
	 */
	client;
	/** 
	 * All commands usable by the bot itself.
	 * @readonly
	 * @type {Collection<string, BotCommand>}
	 */
	botCommands;
	/**
	 * All commands usable by moderators.
	 * @readonly
	 * @type {Collection<string, ModeratorCommand>}
	 */
	moderatorCommands;
	/**
	 * All commands usable by players.
	 * @readonly
	 * @type {Collection<string, PlayerCommand>}
	 */
	playerCommands;
	/**
	 * All commands usable by members with the eligible role.
	 * @readonly
	 * @type {Collection<string, EligibleCommand>}
	 */
	eligibleCommands;
	/**
	 * The game the bot is managing.
	 * @readonly
	 * @type {Game}
	 */
	game;
	/**
	 * An array of the most recently-issued commands. Used by the dumplog command for debugging purposes.
	 * @type {Array<CommandLogEntry>}
	 */
	commandLog;
	/**
	 * A set of functions to cleanly display objects.
	 * @type {PrettyPrinter}
	 */
	prettyPrinter;
	/**
	 * A timeout which updates the client user's presence every 30 seconds.
	 * @type NodeJS.Timeout
	 */
	#presenceUpdateInterval;

	/**
	 * @constructor
	 * @param {Client} client - The Discord Client associated with the bot.
	 * @param {Collection<string, BotCommand>} botCommands - All commands usable by the bot itself.
	 * @param {Collection<string, ModeratorCommand>} moderatorCommands - All commands usable by moderators.
	 * @param {Collection<string, PlayerCommand>} playerCommands - All commands usable by players.
	 * @param {Collection<string, EligibleCommand>} eligibleCommands - All commands usable by members with the eligible role.
	 * @param {Game} game - The game the bot is managing.
	 */
	constructor(client, botCommands, moderatorCommands, playerCommands, eligibleCommands, game) {
		if (BotContext.instance) {
			return BotContext.instance;
		}
		this.client = client;
		this.botCommands = botCommands;
		this.moderatorCommands = moderatorCommands;
		this.playerCommands = playerCommands;
		this.eligibleCommands = eligibleCommands;
		this.game = game;
		this.commandLog = [];
		this.prettyPrinter = new PrettyPrinter()
		this.#presenceUpdateInterval = setInterval(
			() => this.updatePresence(),
			30 * 1000
		);

		BotContext.instance = this;
	}

	/**
	 * Updates the client user's presence.
	 */
	updatePresence() {
		let onlineSuffix = '';
		if (this.game.settings.showOnlinePlayerCount && this.game.inProgress && !this.game.canJoin) {
			let onlinePlayers = 0;
			this.game.livingPlayersCollection.forEach(player => {
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
