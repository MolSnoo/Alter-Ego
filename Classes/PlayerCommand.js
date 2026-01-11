/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("../Data/Player.js").default} Player */
/** @typedef {import("./GameSettings.js").default} GameSettings */

/**
 * @class PlayerCommand
 * @classdesc A command usable by a player.
 * @implements {IPlayerCommand}
 */
export default class PlayerCommand {
	/**
	 * @constructor
	 * @param {CommandConfig} config 
	 * @param {(settings: GameSettings) => string} usage 
	 * @param {(game: Game, message: UserMessage, command: string, args: string[], player?: Player) => Promise<void>} execute 
	 */
	constructor(config, usage, execute) {
		this.config = config;
		this.usage = usage;
		this.execute = execute;
	}
}
