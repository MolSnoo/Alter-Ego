import Game from "../Data/Game.js";
import GameSettings from "./GameSettings.js";

/**
 * @class ModeratorCommand
 * @classdesc A command usable by a moderator.
 * @implements {IModeratorCommand}
 */
export default class ModeratorCommand {
	/**
	 * @constructor
	 * @param {CommandConfig} config 
	 * @param {(settings: GameSettings) => string} usage 
	 * @param {(game: Game, message: UserMessage, command: string, args: string[]) => Promise<void>} execute 
	 */
	constructor(config, usage, execute) {
		this.config = config;
		this.usage = usage;
		this.execute = execute;
	}
}
