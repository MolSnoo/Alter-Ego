import Event from "../Data/Event.js";
import Flag from "../Data/Flag.js";
import Game from "../Data/Game.js";
import GameSettings from "./GameSettings.js";
import InventoryItem from "../Data/InventoryItem.js";
import Player from "../Data/Player.js";
import Puzzle from "../Data/Puzzle.js";

/**
 * @class BotCommand
 * @classdesc A command usable by the bot itself. Command sets can be written for some in-game data structures to be executed when certain conditions are met.
 * @implements {IBotCommand}
 * @constructor
 * @param {CommandConfig} config 
 * @param {(settings: GameSettings) => string} usage 
 * @param {(game: Game, command: string, args: string[], player?: Player, callee?: Event|Flag|InventoryItem|Puzzle) => Promise<void>} execute 
 */
export default class BotCommand {
	/**
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
