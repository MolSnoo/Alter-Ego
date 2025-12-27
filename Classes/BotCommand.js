/** @typedef {import("../Data/Event.js").default} Event */
/** @typedef {import("../Data/Flag.js").default} Flag */
/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("./GameSettings.js").default} GameSettings */
/** @typedef {import("../Data/InventoryItem.js").default} InventoryItem */
/** @typedef {import("../Data/Player.js").default} Player */
/** @typedef {import("../Data/Puzzle.js").default} Puzzle */

/**
 * @class BotCommand
 * @classdesc A command usable by the bot itself. Command sets can be written for some in-game data structures to be executed when certain conditions are met.
 * @implements {IBotCommand}
 */
export default class BotCommand {
	/**
	 * @constructor
	 * @param {CommandConfig} config 
	 * @param {(settings: GameSettings) => string} usage 
	 * @param {(game: Game, command: string, args: string[], player?: Player, callee?: Event|Flag|InventoryItem|Puzzle) => Promise<void>} execute 
	 */
	constructor(config, usage, execute) {
		this.config = config;
		this.usage = usage;
		this.execute = execute;
	}
}
