import { Message } from "discord.js";
import Game from "../Data/Game.js";

/**
 * @class ModeratorCommand
 * @classdesc A command usable by a moderator.
 * @implements {IModeratorCommand}
 * @constructor
 * @param {CommandConfig} config 
 * @param {(game: Game, message: Message, command: string, args: string[]) => Promise<void>} execute 
 */
export default class ModeratorCommand {
	/**
	 * @param {CommandConfig} config 
	 * @param {(game: Game, message: Message, command: string, args: string[]) => Promise<void>} execute 
	 */
	constructor(config, execute) {
		this.config = config;
		this.execute = execute;
	}
}
