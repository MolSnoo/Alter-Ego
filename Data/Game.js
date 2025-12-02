import BotContext from '../Classes/BotContext.js';
import GameSettings from '../Classes/GameSettings.js';
import GuildContext from '../Classes/GuildContext.js';
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
import { saveGame } from '../Modules/saver.js';
import moment from 'moment';
moment().format();

/**
 * @class Game
 * @classdesc Represents a game managed by the bot.
 * @constructor
 * @param {BotContext} botContext - The bot managing the game.
 * @param {GuildContext} guildContext - The guild this game is occurring in.
 * @param {GameSettings} settings - The settings for the game.
 */
export default class Game {
	/** @type NodeJS.Timeout */
	#autoSaveInterval;
	/** @type NodeJS.Timeout */
	#eventTriggerInterval;

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
		/** @type {Array<Room>} */
		this.rooms = [];
		/** @type {Array<Fixture>} */
		this.objects = [];
		/** @type {Array<Prefab>} */
		this.prefabs = [];
		/** @type {Array<Recipe>} */
		this.recipes = [];
		/** @type {Array<Item>} */
		this.items = [];
		/** @type {Array<Puzzle>} */
		this.puzzles = [];
		/** @type {Array<Event>} */
		this.events = [];
		/** @type {Array<Status>} */
		this.statusEffects = [];
		/** @type {Array<Player>} */
		this.players = [];
		/** @type {Array<Player>} */
		this.players_alive = [];
		/** @type {Array<Player>} */
		this.players_dead = [];
		/** @type {Array<InventoryItem>} */
		this.inventoryItems = [];
		/** @type {Array<Gesture>} */
		this.gestures = [];
		/** @type {Map<string, Flag>} */
		this.flags = new Map();
		/** @type {Array<Whisper>} */
		this.whispers = [];

		// Save data to the sheet periodically.
		this.#autoSaveInterval = setInterval(
			() => { if (this.inProgress && !this.editMode) saveGame(); },
			this.settings.autoSaveInterval * 1000
		);
		// Check for any Events that are supposed to trigger at this time of day.
		this.#eventTriggerInterval = setInterval(() => {
			if (this.inProgress) {
				const now = moment();
				this.events.forEach(event => {
					if (!event.ongoing) {
						for (let triggerTime of event.triggerTimes) {
							const time = moment(triggerTime, Event.formats);
							if (now.month() === time.month()
								&& now.weekday() === time.weekday()
								&& now.date() === time.date()
								&& now.hour() === time.hour()
								&& now.minute() === time.minute()) {
									event.trigger(this.botContext, this, true);
									break;
							}
						}
					}
				});
			}
		}, 60 * 1000);
	}
}
