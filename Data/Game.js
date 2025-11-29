import BotContext from './BotContext.js';
import GameSettings from './GameSettings.js';
import GuildContext from './GuildContext.js';
import Room from './Room.js';
import { default as Fixture } from './Object.js';
import Prefab from './Prefab.js';
import Recipe from './Recipe.js';
import Item from './Item.js';
import Puzzle from './Puzzle.js';
import Event from './Event.js';
import Status from './Status.js';
import Player from './Player.js';
import InventoryItem from './InventoryItem.js';
import Gesture from './Gesture.js';
import Flag from './Flag.js';
import Whisper from './Whisper.js';

/**
 * @class Game
 * @classdesc Represents a game managed by the bot.
 * @constructor
 * @param {BotContext} botContext - The bot managing the game.
 * @param {GuildContext} guildContext - The guild this game is occurring in.
 * @param {GameSettings} settings - The settings for the game.
 */
export default class Game {
	/**
	 * @param {BotContext} botContext 
	 * @param {GuildContext} guildContext 
	 * @param {GameSettings} settings 
	 */
	constructor(botContext, guildContext, settings) {
		this.botContext = botContext;
		this.guildContext = guildContext;
		this.settings = settings;
		this.inProgress = false;
		this.canJoin = false;
		/** @type {NodeJS.Timeout|null} */
		this.halfTimer = null;
		/** @type {NodeJS.Timeout|null} */
		this.endTimer = null;
		this.heated = false;
		this.editMode = false;
		/** @type {Map<string, Room>} */
		this.rooms = new Map();
		/** @type {Array<Fixture>} */
		this.objects = [];
		/** @type {Map<string, Prefab>} */
		this.prefabs = new Map();
		/** @type {Array<Recipe>} */
		this.recipes = [];
		/** @type {Array<Item>} */
		this.items = [];
		/** @type {Array<Puzzle>} */
		this.puzzles = [];
		/** @type {Map<string, Event>} */
		this.events = new Map();
		/** @type {Map<string, Status>} */
		this.statusEffects = new Map();
		/** @type {Map<string, Player>} */
		this.players = new Map();
		/** @type {Map<string, Player>} */
		this.players_alive = new Map();
		/** @type {Map<string, Player>} */
		this.players_dead = new Map();
		/** @type {Array<InventoryItem>} */
		this.inventoryItems = [];
		/** @type {Map<string, Gesture>} */
		this.gestures = new Map();
		/** @type {Map<string, Flag>} */
		this.flags = new Map();
		/** @type {Array<Whisper>} */
		this.whispers = [];
	}
}