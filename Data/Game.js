import BotContext from '../Classes/BotContext.js';
import GameConstants from '../Classes/GameConstants.js';
import GameSettings from '../Classes/GameSettings.js';
import GuildContext from '../Classes/GuildContext.js';
import PriorityQueue from '../Classes/PriorityQueue.js';
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
import { sendQueuedMessages } from '../Modules/messageHandler.js';
import dayjs from 'dayjs';
dayjs().format();

/**
 * @class Game
 * @classdesc Represents a game managed by the bot.
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/game.html
 */
export default class Game {
	/**
	 * The guild in which the game is occurring and all of the parts of the guild frequently accessed by the bot.
	 * @readonly
	 * @type {GuildContext}
	 */
	guildContext;
	/** 
	 * The bot managing the game.
	 * @type {BotContext} 
	 */
	botContext;
	/**
	 * All of the settings for the game.
	 * @type {GameSettings}
	 */
	settings;
	/** 
	 * A collection of constants used to refer to cell ranges on the spreadsheet. 
	 * @readonly
	 * @type {GameConstants}
	*/
	constants;
	/**
	 * Whether or not the game is currently in progress.
	 * @type {boolean}
	 */
	inProgress;
	/**
	 * Whether or not members with the eligible role can join the game with the play command.
	 * @type {boolean}
	 */
	canJoin;
	/** 
	 * A timer used by the startgame command to announce when half of the time allotted for players to join the game has elapsed.
	 * @type {NodeJS.Timeout}
	 */
	halfTimer;
	/**
	 * A timer used by the startgame command. When this expires, all of the players who joined the game are saved to the spreadsheet. 
	 * @type {NodeJS.Timeout}
	 * */
	endTimer;
	/**
	 * Whether or not there is currently at least one player with the `heated` status in the game.
	 * @type {boolean}
	 */
	heated;
	/**
	 * Whether or not edit mode is currently enabled.
	 * @type {boolean}
	 */
	editMode;
	/** 
	 * An array of all rooms in the game.
	 * @type {Room[]}
	 */
	rooms;
	/** 
	 * An array of all fixtures in the game.
	 * @type {Fixture[]}
	 */
	objects;
	/**
	 * An array of all prefabs in the game.
	 * @type {Prefab[]}
	 */
	prefabs;
	/** 
	 * An array of all recipes in the game.
	 * @type {Recipe[]}
	 */
	recipes;
	/** 
	 * An array of all room items in the game.
	 * @type {Item[]}
	 */
	items;
	/** 
	 * An array of all puzzles in the game.
	 * @type {Puzzle[]} 
	 */
	puzzles;
	/** 
	 * An array of all events in the game.
	 * @type {Event[]}
	 */
	events;
	/**
	 * An array of all status effects in the game. 
	 * @type {Status[]} 
	 */
	statusEffects;
	/**
	 * An array of all players in the game. 
	 * @type {Player[]} 
	 */
	players;
	/** 
	 * An array of all living players in the game.
	 * @type {Player[]}
	 */
	players_alive;
	/**
	 * An array of all dead players in the game. 
	 * @type {Player[]}
	 */
	players_dead;
	/**
	 * An array of all inventory items in the game. 
	 * @type {InventoryItem[]}
	 */
	inventoryItems;
	/** 
	 * An array of all gestures in the game.
	 * @type {Gesture[]}
	 */
	gestures;
	/** 
	 * A map of all flags in the game, where the key is the flag's ID.
	 * @type {Map<string, Flag>} */
	flags;
	/** 
	 * An array of all whispers in the game. These are not saved to the sheet.
	 * @type {Whisper[]}
	 */
	whispers;
	/**
	 * A queue of messages to be sent by the messageHandler.
	 * @type {PriorityQueue}
	 */
	messageQueue;
	/** 
	 * A cache of dialog messages to allow edits to dialog messages to be reflected in spectate channels.
	 * @type {CachedDialog[]}
	 */
	dialogCache;
	/**
	 * A timeout which sends queued messages every quarter of a second.
	 * @type {NodeJS.Timeout}
	 */
	#queuedMessageSendInterval;
	/** 
	 * A timeout that saves the game data to the spreadsheet periodically.
	 * @type NodeJS.Timeout
	 */
	#autoSaveInterval;
	/** 
	 * A timeout that checks for events that should be triggered every minute.
	 * @type NodeJS.Timeout
	 */
	#eventTriggerInterval;

	/**
	 * @constructor
	 * @param {GuildContext} guildContext - The guild this game is occurring in.
	 * @param {GameSettings} settings - The settings for the game.
	 */
	constructor(guildContext, settings) {
		this.guildContext = guildContext;
		this.settings = settings;
		this.constants = new GameConstants();
		this.inProgress = false;
		this.canJoin = false;
		this.halfTimer = null;
		this.endTimer = null;
		this.heated = false;
		this.editMode = false;
		this.rooms = [];
		this.objects = [];
		this.prefabs = [];
		this.recipes = [];
		this.items = [];
		this.puzzles = [];
		this.events = [];
		this.statusEffects = [];
		this.players = [];
		this.players_alive = [];
		this.players_dead = [];
		this.inventoryItems = [];
		this.gestures = [];
		this.flags = new Map();
		this.whispers = [];
		this.messageQueue = new PriorityQueue();
		this.dialogCache = [];

		// Send the messages in the queue every quarter of a second.
		this.#queuedMessageSendInterval = setInterval(
			() => sendQueuedMessages(this),
			0.25 * 1000
		);
		// Save data to the sheet periodically.
		this.#autoSaveInterval = setInterval(
			() => { if (this.inProgress && !this.editMode) saveGame(this); },
			this.settings.autoSaveInterval * 1000
		);
		// Check for any events that are supposed to trigger at this time of day.
		this.#eventTriggerInterval = setInterval(() => {
			if (this.inProgress) {
				const now = dayjs();
				this.events.forEach(event => {
					if (!event.ongoing) {
						for (let triggerTime of event.triggerTimes) {
							const time = dayjs(triggerTime, Event.formats);
							if (now.month() === time.month()
								&& now.weekday() === time.weekday()
								&& now.date() === time.date()
								&& now.hour() === time.hour()
								&& now.minute() === time.minute()) {
									event.trigger(true);
									break;
							}
						}
					}
				});
			}
		}, 60 * 1000);
	}

	setBotContext() {
		this.botContext = BotContext.instance;
	}

	/**
	 * Generate a name in all uppercase with no apostrophes or quotation marks.
	 * @param {string} name
	 * @returns {string} 
	 */
	static generateValidEntityName(name) {
		return name.toUpperCase().replace(/[\'"“”`]/g, '').trim();
	}
}
