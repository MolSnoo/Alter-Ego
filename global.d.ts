// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ButtonInteraction, GuildMember, Message, ModalSubmitInteraction, OmitPartialGroupDMChannel, Snowflake, StringSelectMenuInteraction } from "discord.js";
import type GameSettings from "./Classes/GameSettings.ts";
import type Event from "./Data/Event.ts";
import type Exit from "./Data/Exit.js";
import type Fixture from "./Data/Fixture.ts";
import type Flag from "./Data/Flag.ts";
import type Game from "./Data/Game.ts";
import type GameEntity from "./Data/GameEntity.ts";
import type InventoryItem from "./Data/InventoryItem.ts";
import type Player from "./Data/Player.ts";
import type Puzzle from "./Data/Puzzle.ts";
import type Room from "./Data/Room.ts";
import type RoomItem from "./Data/RoomItem.ts";
import type { Node } from "acorn";
import type Moderator from "./Data/Moderator.ts";

export { };

declare global {
    /** Utility type that indicates that something is to be a value of T. Used for enums. */
    type valueof<T> = T[keyof T];

    /**
     * Represents a user of the bot in a game context.
     */
    interface User {
        /** The Discord ID of the user. */
        id: string;
        /** The Discord member object of the user. */
        readonly member: GuildMember;
        /** The name that will be displayed for this user. */
        displayName: string;
        /** An image URL that will be used as an avatar when the user's messages are mirrored in a webhook. */
        displayIcon: string;
    }

    /**
     * A message that we've sent, with the channel ID and message ID so that it can be retrieved later.
     */
    interface SentMessage {
        /** The ID of the channel the message is in. */
        channelId: Snowflake;
        /** The ID of the message. */
        messageId: Snowflake;
    }

	/**
	 * Represents a Discord message handled by Alter Ego.
	 */
	type UserMessage = OmitPartialGroupDMChannel<Message>;

	/**
	 * Represents a Discord object that can be messaged.
	 */
	type Messageable = UserMessage['channel'];

	/**
	 * Represents the callee of a bot command.
	 */
	type Callee = Event | Flag | InventoryItem | Puzzle;

    /**
     * Represents a container that can hold room items.
     */
    type RoomItemContainer = Fixture | Puzzle | RoomItem;

	/**
	 * Represents an inspectable game entity.
	 */
	type Inspectable = Room|Fixture|RoomItem|InventoryItem|Player;

    /**
     * Represents a game entity that can be used as a target for gestures.
     */
    type GestureTarget = Exit|Fixture|RoomItem|Player|InventoryItem;

    /**
     * Represents an interaction that the bot can accept.
     */
    type BotInteraction = ButtonInteraction|StringSelectMenuInteraction|ModalSubmitInteraction;

	/**
	 * The configuration for a command.
	 */
	interface CommandConfig {
        /** The name of the command. */
		name: string;
        /** A brief description of what the command does. */
		description: string;
        /** Detailed information about the command. */
		details: string;
        /** The role that can use the command. */
		usableBy: string;
        /** Alternative names for the command. */
		aliases: string[];
        /** Indicates whether the command requires an ongoing game to be executed. */
		requiresGame: boolean;
        /** Whether or not the command is sensitive to whitespace, and should not have argument whitespace altered. */
        whitespaceSensitive?: boolean;
        /** Whether the command is usable in edit mode. */
        usableInEditMode?: boolean;
	}

	/**
	 * Represents an abstract command with its configuration.
	 */
	interface ICommand {
        /** The specific configuration of the command. */
		config: CommandConfig;
        /** Examples of the command's usage. */
		usage: (settings: GameSettings) => string;
	}

    /**
     * A command usable by the bot itself. Command sets can be written for some in-game data structures to be executed when certain conditions are met.
     */
	interface IBotCommand extends ICommand {
        /** The code to execute when the command is called. */
		execute: (game: Game, command: string, args: string[], player?: Player, callee?: Callee) => Promise<void>;
	}

    /**
     * A command usable by a moderator.
     */
	interface IModeratorCommand extends ICommand {
        /** The code to execute when the command is called. */
		execute: (game: Game, message: UserMessage, command: string, args: string[], moderator: Moderator) => Promise<void>;
	}

    /**
     * A command usable by a player.
     */
	interface IPlayerCommand extends ICommand {
        /** The code to execute when the command is called. */
		execute: (game: Game, message: UserMessage, command: string, args: string[], player: Player) => Promise<void>;
	}

    /**
     * A command usable by someone with the eligible role.
     */
	interface IEligibleCommand extends ICommand {
        /** The code to execute when the command is called. */
		execute: (game: Game, message: UserMessage, command: string, args: string[]) => Promise<void>;
	}

    type PersistentGameEntityName = "Room"|"Exit"|"Fixture"|"Prefab"|"Recipe"|"RoomItem"|"Puzzle"|"Event"|"StatusEffect"|"Player"|"InventoryItem"|"Gesture"|"Flag";

    interface PersistentGameEntity extends GameEntity {
        getEntityID: () => string;
        getLabel: (field: string) => string;
        getValue: (field: string) => string;
        getViewField: (field: string) => ViewField;
    }

    interface ViewField {
        label?: string,
        value: string
    }

	/**
	 * Represents a range of values in a spreadsheet.
	 */
	interface ValueRange {
        /** The A1 notation of the range. */
		range: string;
        /** The major dimension of the values. Either 'ROWS' or 'COLUMNS'. Optional. */
		majorDimension?: string;
        /** The values within the specified range. */
		values: string[][];
	}

	/**
	 * Represents a 3D position.
	 */
	interface Pos {
        /** X coordinate */
		x: number;
        /** Y coordinate */
		y: number;
        /** Z coordinate */
		z: number;
	}

	/**
	 * Represents a player's stats.
	 */
	interface Stats {
        /** Physical strength. */
		strength: number;
        /** Perception. */
		perception: number;
        /**
         * Alias for perception.
         * @deprecated Use perception instead.
         */
		intelligence?: number;
        /** Agility or dexterity. */
		dexterity: number;
        /** Movement speed. */
		speed: number;
        /** Physical stamina. */
		stamina: number;
	}

	interface StatModifier {
        /** Whether the stat modifier modifies the player's own stat. */
		modifiesSelf: boolean;
        /** The stat to modify. */
		stat: string;
        /** Whether it assigns the value or adds to it. */
		assignValue: boolean;
        /** The value to assign or add. */
		value: number;
	}

	interface StatusDisplay {
        /** The ID of the status effect. */
		id: string;
        /** The remaining time for the status effect. */
		timeRemaining: string;
	}

	interface CraftingResult {
        /** The first product of the crafting result, or null if none. */
		product1: InventoryItem | null;
        /** The second product of the crafting result, or null if none. */
		product2: InventoryItem | null;
	}

	interface UncraftingResult {
        /** The first ingredient recovered from uncrafting, or null if none. */
		ingredient1: InventoryItem | null;
        /** The second ingredient recovered from uncrafting, or null if none. */
		ingredient2: InventoryItem | null;
	}

	interface Possibility {
		index: number;
		chance: number;
        name: string;
	}

	interface TestParserWarningOrError {
		cell: string;
		warnings?: string[];
		errors?: string[];
	}

	interface TestParserResults {
		warnings: TestParserWarningOrError[];
		errors: TestParserWarningOrError[];
        gameDictionary: Set<string>;
	}

	type ScriptEvaluationContext = {
        /** The game entity this script is attached to. */
		container: GameEntity;
        /** The player currently in scope. */
		player: Player;
	};

	type ScriptProxyHandler = {
        /** Function to handle property access. */
		get: (targetObject: any, propKey: string | symbol, thisReceiver: any) => any;
        /** Function to handle property assignment. */
		set: () => any;
		deleteProperty: () => any;
		defineProperty: () => any;
		setPrototypeOf: () => any;
		has: (targetObject: Node, propKey: string | symbol) => boolean;
		ownKeys: (targetObject: Node) => (string | symbol)[];
		getOwnPropertyDescriptor: (targetObject: Node, propKey: string | symbol) => TypedPropertyDescriptor<any>;
		getPrototypeOf: (targetObject: Node) => object;
	};

	/** Convenience alias for the constructor of T. */
    type Constructor<T extends any> = { new(...args: any[]): T }
}
