import { Message } from "discord.js";
import Game from "../Data/Game.js";

/**
 * @class EligibleCommand
 * @classdesc A command usable by someone with the eligible role.
 * @implements {IEligibleCommand}
 * @constructor
 * @param {CommandConfig} config 
 * @param {(game: Game, message: Message, command: string, args: string[]) => Promise<void>} execute 
 */
export default class EligibleCommand {
	/**
	 * @param {CommandConfig} config 
	 * @param {(game: Game, message: Message, command: string, args: string[]) => Promise<void>} execute 
	 */
	constructor(config, execute) {
		this.config = config;
		this.execute = execute;
	}
}
