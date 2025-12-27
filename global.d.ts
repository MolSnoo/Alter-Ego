import type { ActivitiesOptions, ActivityType, GuildMember, Message, OmitPartialGroupDMChannel, Snowflake } from "discord.js";
import type GameSettings from "./Classes/GameSettings.js";
import type Event from "./Data/Event.js";
import type Flag from "./Data/Flag.js";
import type Game from "./Data/Game.js";
import type GameEntity from "./Data/GameEntity.js";
import type InventoryItem from "./Data/InventoryItem.js";
import type Player from "./Data/Player.js";
import type Puzzle from "./Data/Puzzle.js";
import type Recipe from "./Data/Recipe.js";
import type RoomItem from "./Data/RoomItem.js";
import type { DateTime, Duration } from "luxon";
import type { Node } from "acorn";

export { };

declare global {
	/**
	 * Represents a Discord activity.
	 * @property {string} name - The name of the activity.
	 * @property {string} type - The type of activity. {@link https://discord.com/developers/docs/events/gateway-events#activity-object-activity-types}
	 * @property {string} [url] - The URL of the activity, if applicable.
	 */
	interface Activity extends ActivitiesOptions {
		name: string;
		type: ActivityType;
		url?: string;
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
	 * A cached dialog message.
	 * @property {Snowflake} messageId - The ID of the original dialog message.
	 * @property {SpectatedDialogMessage[]} spectateMirrors - All messages that have mirrored this dialog in spectate channels.
	 */
	interface CachedDialog {
		messageId: Snowflake;
		spectateMirrors: SpectatedDialogMessage[];
	}

	/**
	 * A dialog message that has been mirrored in a spectate channel.
	 * @property {Snowflake} messageId - The ID of the mirrored dialog message.
	 * @property {Snowflake} webhookId - The ID of the webhook used to send the mirrored message to the spectate channel.
	 */
	interface SpectatedDialogMessage {
		messageId: Snowflake;
		webhookId: Snowflake;
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
		execute: (game: Game, command: string, args: string[], player?: Player, callee?: Event | Flag | InventoryItem | Puzzle) => Promise<void>;
	}

	interface IModeratorCommand extends Command {
		execute: (game: Game, message: UserMessage, command: string, args: string[]) => Promise<void>;
	}

	interface IPlayerCommand extends Command {
		execute: (game: Game, message: UserMessage, command: string, args: string[], player: Player) => Promise<void>;
	}

	interface IEligibleCommand extends Command {
		execute: (game: Game, message: UserMessage, command: string, args: string[]) => Promise<void>;
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

	/**
	 * Represents a queue entry for a message waiting to be sent in one of the priority queue's stack queues.
	 */
	interface MessageQueueEntry {
		fire: () => Promise<void>;
	}

	/**
	 * @callback GameEntityMatcher
	 * @param {GameEntity} entity - The game entity to match the criteria against.
	 * @param {string|number|boolean} criteria - The criteria to match.
	 * @param {boolean} [normalize] - Whether or not to normalize the criteria before matching. Defaults to false.
	 * @returns {boolean} - Whether the entity matches the criteria.
	 */
	type GameEntityMatcher = (entity: GameEntity, criteria: string | number | boolean, normalize?: boolean) => boolean;

	/**
	 * Represents a range of values in a spreadsheet.
	 * @property {string} range - The A1 notation of the range.
	 * @property {string} [majorDimension] - The major dimension of the values. Either 'ROWS' or 'COLUMNS'.
	 * @property {string[][]} values - The values within the specified range.
	 */
	interface ValueRange {
		range: string;
		majorDimension?: string;
		values: string[][];
	}

	/** @enum {string} */
	class ActionType {
		static Say: "say";
		static Whisper: "whisper";
		static Text: "text";
		static Gesture: "gesture";
		static Move: "move";
		static Stop: "stop";
		static Inspect: "inspect";
		static Knock: "knock";
		static Inflict: "inflict";
		static Cure: "cure";
		static Sleep: "sleep";
		static Wake: "wake";
		static Use: "use";
		static Take: "take";
		static Steal: "steal";
		static Drop: "drop";
		static Give: "give";
		static Stash: "stash";
		static Unstash: "unstash";
		static Equip: "equip";
		static Unequip: "unequip";
		static Dress: "dress";
		static Undress: "undress";
		static Craft: "craft";
		static Uncraft: "uncraft";
		static Attempt: "attempt";
		static Die: "die"
	}

	/**
	 * Represents a 3D position.
	 * @property x - X coordinate
	 * @property y - Y coordinate
	 * @property z - Z coordinate
	 */
	interface Pos {
		x: number;
		y: number;
		z: number;
	}

	/**
	 * @property recipe - The recipe being processed.
	 * @property ingredients - The ingredients used in the recipe.
	 * @property duration - The duration of the recipe.
	 * @property timer - The timer used to track the duration of the recipe.
	 */
	interface Process {
		recipe?: Recipe;
		ingredients: RoomItem[];
		duration?: Duration;
		timer?: any;
	}

	/**
	 * @property recipe - The recipe found.
	 * @property ingredients - The ingredients used in the recipe.
	 */
	interface FindRecipeResult {
		recipe: Recipe | null;
		ingredients: RoomItem[];
	}

	/**
	 * @property ingredientIndex - The index of the ingredient in the ingredients array.
	 * @property productIndex - The index of the product in the products array.
	 * @property decreaseUses - Whether to decrease the uses of the ingredient.
	 * @property nextStage - Whether to move to the next stage of the product.
	 */
	interface RemainingIngredient {
		ingredientIndex: number;
		productIndex: number;
		decreaseUses: boolean;
		nextStage: boolean;
	}

	/**
	 * A player's third-person pronouns.
	 * @property sbj - The subjective pronoun.
	 * @property Sbj - The subjective pronoun with first letter capitalized.
	 * @property obj - The objective pronoun.
	 * @property Obj - The objective pronoun with first letter capitalized.
	 * @property dpos - The dependent possessive pronoun.
	 * @property Dpos - The dependent possessive pronoun with first letter capitalized.
	 * @property ipos - The independent possessive pronoun.
	 * @property Ipos - The independent possessive pronoun with first letter capitalized.
	 * @property ref - The reflexive pronoun.
	 * @property Ref - The reflexive pronoun with first letter capitalized.
	 * @property plural - Whether this set of pronouns turns verbs into their plural form.
	 */
	interface Pronouns {
		sbj?: string;
		Sbj?: string;
		obj?: string;
		Obj?: string;
		dpos?: string;
		Dpos?: string;
		ipos?: string;
		Ipos?: string;
		ref?: string;
		Ref?: string;
		plural?: boolean;
	}

	/**
	 * Represents a player's stats.
	 * @property {number} strength - Physical strength.
	 * @property {number} perception - Perception.
	 * @property {number} [intelligence] - Alias for perception.
	 * @property {number} dexterity - Agility or dexterity.
	 * @property {number} speed - Movement speed.
	 * @property {number} stamina - Physical stamina.
	 */
	interface Stats {
		strength: number;
		perception: number;
		intelligence?: number;
		dexterity: number;
		speed: number;
		stamina: number;
	}

	/**
	 * @property {boolean} modifiesSelf - Whether the stat modifier modifies the player's own stat.
	 * @property {string} stat - The stat to modify.
	 * @property {boolean} assignValue - Whether it assigns the value or adds to it.
	 * @property {number} value - The value to assign or add.
	 */
	interface StatModifier {
		modifiesSelf: boolean;
		stat: string;
		assignValue: boolean;
		value: number;
	}

	/**
	 * @property {string} id - The ID of the status effect.
	 * @property {string} timeRemaining - The remaining time for the status effect.
	 */
	interface StatusDisplay {
		id: string;
		timeRemaining: string;
	}

	/**
	 * @property {InventoryItem|null} product1 - The first product of the crafting result, or null if none.
	 * @property {InventoryItem|null} product2 - The second product of the crafting result, or null if none.
	 */
	interface CraftingResult {
		product1: InventoryItem | null;
		product2: InventoryItem | null;
	}

	/**
	 * @property {InventoryItem|null} ingredient1 - The first ingredient recovered from uncrafting, or null if none.
	 * @property {InventoryItem|null} ingredient2 - The second ingredient recovered from uncrafting, or null if none.
	 */
	interface UncraftingResult {
		ingredient1: InventoryItem | null;
		ingredient2: InventoryItem | null;
	}

	interface PuzzleRequirement {
		type: string;
		entityId: string
	}

	/**
	 * @property [outcomes] - Strings indicating which puzzle solutions will execute the commands in this command set.
	 * @property solvedCommands - Bot commands that will be executed when the puzzle is solved.
	 * @property unsolvedCommands - Bot commands that will be executed when the puzzle is unsolved.
	 */
	interface PuzzleCommandSet {
		outcomes?: string[];
		solvedCommands: string[];
		unsolvedCommands: string[];
	}

	/**
	 * @property [values] - Strings indicating which flag values will execute the commands in this command set.
	 * @property setCommands - Bot commands that will be executed when the flag is set.
	 * @property clearedCommands - Bot commands that will be executed when the flag is cleared.
	 */
	interface FlagCommandSet {
		values?: string[];
		setCommands: string[];
		clearedCommands: string[];
	}

	/**
	 * @property {number} number - The total modifier value.
	 * @property {string[]} strings - The modifier strings.
	 */
	interface ModifierResult {
		number: number;
		strings: string[];
	}

	/**
	 * Represents a stripped down Item/InventoryItem for use in the parser module.
	 * @property {string} [name] - The name of the item.
	 * @property {string} [pluralName] - The plural name of the item.
	 * @property {number} [quantity] - The quantity of the item.
	 * @property {string} [singleContainingPhrase] - The phrase used when referring to a single item.
	 * @property {string} [pluralContainingPhrase] - The phrase used when referring to multiple items.
	 */
	interface PseudoItem {
		name?: string,
		pluralName?: string,
		quantity?: number,
		singleContainingPhrase?: string,
		pluralContainingPhrase?: string
	}

	/**
	 * Represents a simplified player object for use in various places.
	 * @property {string} [name] - The name of the player.
	 * @property {string} [displayName] - The display name of the player.
	 * @property {string} [displayIcon] - The display icon URL of the player.
	 * @property {string} [title] - The title of the player.
	 * @property {GuildMember} [member] - The Discord guild member associated with the player. 
	 * @property {number} [strength] - The strength stat of the player.
	 * @property {number} [perception] - The perception stat of the player.
	 * @property {number} [intelligence] - The perception stat of the player.
	 * @property {number} [dexterity] - The dexterity stat of the player.
	 * @property {number} [speed] - The speed stat of the player.
	 * @property {number} [stamina] - The stamina stat of the player.
	 * @property {Game} [game] - The game instance the player is part of.
	 */
	interface PseudoPlayer {
		name?: string;
		displayName?: string;
		displayIcon?: string;
		title?: string;
		member?: GuildMember;
		strength?: number;
		perception?: number;
		intelligence?: number;
		dexterity?: number;
		speed?: number;
		stamina?: number;
		game?: Game;
		getGame: () => this["game"];
	}

	interface Possibility {
		index: number;
		chance: number;
	}

	interface DayJsDurationInput {
		days?: number;
		hours?: number;
		minutes?: number;
		seconds?: number;
	}

	interface TimerAttributes {
		loop: boolean;
		start: boolean;
	}

	interface ParsedTriggerTime {
		datetime?: DateTime<true>;
		format?: string;
		valid: boolean;
	}

	interface TestParserWarningOrError {
		cell: string;
		warnings?: string[];
		errors?: string[];
	}

	interface TestParserResults {
		warnings: TestParserWarningOrError[];
		errors: TestParserWarningOrError[];
	}

	interface TestParserError {
		cell: string;
		text: string;
	}

	/**
	 * @typedef ScriptEvaluationContext
	 * @param {GameEntity} container - The game entity this script is attached to.
	 * @param {Player|PseudoPlayer} player - The player currently in scope.
	 */
	type ScriptEvaluationContext = {
		container: GameEntity;
		player: Player | PseudoPlayer;
	};

	/**
	 * @typedef ScriptProxyHandler
	 * @property {function} get - Function to handle property access.
	 * @property {function} set - Function to handle property assignment.
	 */
	type ScriptProxyHandler = {
		get: (targetObject: any, propKey: string | symbol, thisReceiver: any) => any;
		set: () => any;
		deleteProperty: () => any;
		defineProperty: () => any;
		setPrototypeOf: () => any;
		has: (targetObject: Node, propKey: string | symbol) => boolean;
		ownKeys: (targetObject: Node) => (string | symbol)[];
		getOwnPropertyDescriptor: (targetObject: Node, propKey: string | symbol) => TypedPropertyDescriptor<any>;
		getPrototypeOf: (targetObject: Node) => object;
	};

	type PriorityQueuePriority = "mod" | "tell" | "mechanic" | "log" | "spectator";

	type TypeGuard<T> = (value: unknown) => value is T;

    type Formatter<T> = (
        value: T,
        config?: import("pretty-format").Config,
        indentation?: string,
        depth?: number,
        refs?: import("pretty-format").Refs,
        printer?: import("pretty-format").Printer
    ) => string;

    type FormatterPair<T = unknown> = [TypeGuard<T>, Formatter<T>];

    type FormatterPairs = Array<FormatterPair<any>>;
}