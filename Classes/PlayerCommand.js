import { Message } from "discord.js";
import Game from "../Data/Game.js";
import Player from "../Data/Player.js";

/**
 * @class PlayerCommand
 * @classdesc A command usable by a player.
 * @implements {IPlayerCommand}
 * @constructor
 * @param {CommandConfig} config 
 * @param {(game: Game, message: Message, command: string, args: string[], player?: Player) => Promise<void>} execute 
 */
export default class PlayerCommand {
	/**
	 * @param {CommandConfig} config 
	 * @param {(game: Game, message: Message, command: string, args: string[], player?: Player) => Promise<void>} execute 
	 */
	constructor(config, execute) {
		this.config = config;
		this.execute = execute;
	}
}
