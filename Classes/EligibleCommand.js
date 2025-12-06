import { Message } from "discord.js";
import Game from "../Data/Game.js";
import GameSettings from "./GameSettings.js";

/**
 * @class EligibleCommand
 * @classdesc A command usable by someone with the eligible role.
 * @implements {IEligibleCommand}
 */
export default class EligibleCommand {
	/**
	 * @constructor
	 * @param {CommandConfig} config 
	 * @param {(settings: GameSettings) => string} usage 
	 * @param {(game: Game, message: Message, command: string, args: string[]) => Promise<void>} execute 
	 */
	constructor(config, usage, execute) {
		this.config = config;
		this.usage = usage;
		this.execute = execute;
	}
}
