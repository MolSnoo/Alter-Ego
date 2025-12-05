import { Message } from "discord.js";
import Game from "../Data/Game.js";
import Player from "../Data/Player.js";
import GameSettings from "./GameSettings.js";

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
	 * @param {(game: Game, message: Message, command: string, args: string[], player?: Player) => Promise<void>} execute 
	 */
	constructor(config, usage, execute) {
		this.config = config;
		this.usage = usage;
		this.execute = execute;
	}
}
