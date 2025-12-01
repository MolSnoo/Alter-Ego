import type { ActivitiesOptions, ActivityType, Message } from "discord.js";
import type Event from "./Data/Event.js";
import type Flag from "./Data/Flag.js";
import type Game from "./Data/Game.js";
import type InventoryItem from "./Data/InventoryItem.js";
import type Player from "./Data/Player.js";
import type Puzzle from "./Data/Puzzle.js";
import type GameSettings from "./Classes/GameSettings.js";

export {};

declare global {
	/**
	 * Represents a Discord activity.
	 * @property {string} name - The name of the activity.
	 * @property {string} type - The type of activity. {@link https://discord.com/developers/docs/events/gateway-events#activity-object-activity-types}
	 * @property {string} [url] - The URL of the activity, if applicable.
	 */
	interface Activity extends ActivitiesOptions{
		name: string;
		type: ActivityType;
		url?: string;
	}

	/**
	 * The configuration for a command.
	 * @property {string} name - The name of the command.
	 * @property {string} description - A brief description of what the command does.
	 * @property {string} details - Detailed information about the command.
	 * @property {string} usableBy - The role that can use the command.
	 * @property {string[]} aliases - Alternative names for the command.
	 * @property {boolean} requiresGame - Indicates whether the command requires an ongoing game to be executed.
	 */
	interface CommandConfig {
		name: string;
		description: string;
		details: string;
		usableBy: string;
		aliases: string[];
		requiresGame: boolean;
	}
	
	/**
	 * Represents an abstract command with its configuration.
	 * @property {CommandConfig} config - The specific configuration of the command.
	 * @property {(settings: GameSettings) => string} usage - Examples of the command's usage.
	 */
	interface Command {
		config: CommandConfig;
		usage: (settings: GameSettings) => string;
	}

	interface IBotCommand extends Command {
		execute: (game: Game, command: string, args: string[], player?: Player, callee?: Event|Flag|InventoryItem|Puzzle) => Promise<void>;
	}

	interface IModeratorCommand extends Command {
		execute: (game: Game, message: Message, command: string, args: string[]) => Promise<void>;
	}

	interface IPlayerCommand extends Command {
		execute: (game: Game, message: Message, command: string, args: string[], player: Player) => Promise<void>;
	}

	interface IEligibleCommand extends Command {
		execute: (game: Game, message: Message, command: string, args: string[]) => Promise<void>;
	}

	/**
	 * Represents a log entry for a command executed in the game.
	 * @property {Date} timestamp - The date and time when the command was executed.
	 * @property {string} author - Who issued the command.
	 * @property {string} content - The content of the command.
	 */
	interface CommandLogEntry {
		timestamp: Date;
		author: string;
		content: string;
	}
}