import BotContext from '../Classes/BotContext.js';
import GameConstants from '../Classes/GameConstants.js';
import GameEntityFinder from '../Classes/GameEntityFinder.js';
import GameEntityLoader from '../Classes/GameEntityLoader.js';
import GameEntitySaver from '../Classes/GameEntitySaver.js';
import GameLogHandler from '../Classes/GameLogHandler.js';
import GameNotificationGenerator from '../Classes/GameNotificationGenerator.js';
import PriorityQueue from '../Classes/PriorityQueue.js';
import Event from './Event.js';
import { sendQueuedMessages } from '../Modules/messageHandler.js';
import { Collection } from 'discord.js';
import { DateTime } from 'luxon';

/** @typedef {import('../Classes/GameNarrationHandler.js').default} GameNarrationHandler */
/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Classes/GuildContext.js').default} GuildContext */
/** @typedef {import('./Room.js').default} Room */
/** @typedef {import('./Fixture.js').default} Fixture */
/** @typedef {import('./Prefab.js').default} Prefab */
/** @typedef {import('./Recipe.js').default} Recipe */
/** @typedef {import('./RoomItem.js').default} RoomItem */
/** @typedef {import('./Puzzle.js').default} Puzzle */
/** @typedef {import('./Status.js').default} Status */
/** @typedef {import('./Player.js').default} Player */
/** @typedef {import('./InventoryItem.js').default} InventoryItem */
/** @typedef {import('./Gesture.js').default} Gesture */
/** @typedef {import('./Flag.js').default} Flag */
/** @typedef {import('./Whisper.js').default} Whisper */

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
	 * A set of functions to get and find game entities.
	 * @readonly
	 * @type {GameEntityFinder}
	 */
	entityFinder;
	/**
	 * A set of functions to load game entities from the sheet.
	 * @readonly
	 * @type {GameEntityLoader}
	 */
	entityLoader;
	/**
	 * A set of functions to save game entities to the sheet.
	 * @readonly
	 * @type {GameEntitySaver}
	 */
	entitySaver;
	/**
	 * A set of functions to send messages to the game's log channel.
	 * @readonly
	 * @type {GameLogHandler}
	 */
	logHandler;
	/**
	 * A set of functions to generate notifications to send to players.
	 * @readonly
	 * @type {GameNotificationGenerator}
	 */
	notificationGenerator;
	/**
	 * A set of functions to send narrations.
	 * @readonly
	 * @type {GameNarrationHandler}
	 */
	narrationHandler;
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
	 * A set of data types that have been loaded with errors. The game is not playable if this set isn't empty.
	 * @type {Set<string>}
	 */
	loadedEntitiesWithErrors;
	/** 
	 * An array of all rooms in the game.
	 * @deprecated
	 * @type {Room[]}
	 */
	rooms;
	/**
	 * A collection of all rooms in the game. The key for each room is its id.
	 * @type {Collection<string, Room>}
	 */
	roomsCollection;
	/** 
	 * An array of all fixtures in the game. Deprecated. Use fixtures instead.
	 * @deprecated
	 * @type {Fixture[]}
	 */
	objects;
	/**
	 * An array of all fixtures in the game.
	 * @type {Fixture[]}
	 */
	fixtures;
	/**
	 * An array of all prefabs in the game.
	 * @deprecated
	 * @type {Prefab[]}
	 */
	prefabs;
	/**
	 * A collection of all prefabs in the game. The key for each prefab is its id.
	 * @type {Collection<string, Prefab>}
	 */
	prefabsCollection;
	/** 
	 * An array of all recipes in the game.
	 * @type {Recipe[]}
	 */
	recipes;
	/** 
	 * An array of all room items in the game. Deprecated. Use roomItems instead.
	 * @deprecated
	 * @type {RoomItem[]}
	 */
	items;
	/**
	 * An array of all room items in the game.
	 * @type {RoomItem[]}
	 */
	roomItems;
	/** 
	 * An array of all puzzles in the game.
	 * @type {Puzzle[]} 
	 */
	puzzles;
	/** 
	 * An array of all events in the game.
	 * @deprecated
	 * @type {Event[]}
	 */
	events;
	/**
	 * A collection of all events in the game. The key for each prefab is its id.
	 * @type {Collection<string, Event>}
	 */
	eventsCollection;
	/**
	 * An array of all status effects in the game. 
	 * @deprecated
	 * @type {Status[]} 
	 */
	statusEffects;
	/**
	 * A collection of all status effects in the game. The key for each prefab is its id.
	 * @type {Collection<string, Status>}
	 */
	statusEffectsCollection;
	/**
	 * An array of all players in the game. 
	 * @deprecated
	 * @type {Player[]} 
	 */
	players;
	/**
	 * A collection of all players in the game. The key for each player is their name.
	 * @type {Collection<string, Player>}
	 */
	playersCollection;
	/** 
	 * An array of all living players in the game.
	 * @deprecated
	 * @type {Player[]}
	 */
	players_alive;
	/**
	 * A collection of all living players in the game. The key for each player is their name.
	 * @type {Collection<string, Player>}
	 */
	livingPlayersCollection;
	/**
	 * An array of all dead players in the game. 
	 * @deprecated
	 * @type {Player[]}
	 */
	players_dead;
	/**
	 * A collection of all dead players in the game. The key for each player is their name.
	 * @type {Collection<string, Player>}
	 */
	deadPlayersCollection;
	/**
	 * An array of all inventory items in the game. 
	 * @type {InventoryItem[]}
	 */
	inventoryItems;
	/** 
	 * An array of all gestures in the game.
	 * @deprecated
	 * @type {Gesture[]}
	 */
	gestures;
	/**
	 * A collection of all gestures in the game. The key for each gesture is its id.
	 * @type {Collection<string, Gesture>}
	 */
	gesturesCollection;
	/** 
	 * A collection of all flags in the game, where the key is the flag's ID.
	 * @type {Collection<string, Flag>} */
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
		this.entityFinder = new GameEntityFinder(this);
		this.entityLoader = new GameEntityLoader(this);
		this.entitySaver = new GameEntitySaver(this);
		this.logHandler = new GameLogHandler(this);
		this.notificationGenerator = new GameNotificationGenerator(this);
		this.inProgress = false;
		this.canJoin = false;
		this.halfTimer = null;
		this.endTimer = null;
		this.heated = false;
		this.editMode = false;
		this.loadedEntitiesWithErrors = new Set();
		this.rooms = [];
		this.roomsCollection = new Collection();
		this.objects = [];
		this.fixtures = [];
		this.prefabs = [];
		this.prefabsCollection = new Collection();
		this.recipes = [];
		this.items = [];
		this.roomItems = [];
		this.puzzles = [];
		this.events = [];
		this.eventsCollection = new Collection();
		this.statusEffects = [];
		this.statusEffectsCollection = new Collection();
		this.players = [];
		this.playersCollection = new Collection();
		this.players_alive = [];
		this.livingPlayersCollection = new Collection();
		this.players_dead = [];
		this.deadPlayersCollection = new Collection();
		this.inventoryItems = [];
		this.gestures = [];
		this.gesturesCollection = new Collection();
		this.flags = new Collection();
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
			() => { if (this.inProgress && !this.editMode) this.entitySaver.saveGame(); },
			this.settings.autoSaveInterval * 1000
		);
		// Check for any events that are supposed to trigger at this time of day.
		this.#eventTriggerInterval = setInterval(() => {
			if (this.inProgress) {
				const now = DateTime.now();
				this.eventsCollection.forEach(event => {
					if (!event.ongoing) {
						for (let triggerTimeString of event.triggerTimesStrings) {
							const time = Event.parseTriggerTime(triggerTimeString);
							if (time.valid
								&& now.month === time.datetime.month
								&& now.day === time.datetime.day
								&& now.weekday === time.datetime.weekday
								&& now.hour === time.datetime.hour
								&& now.minute === time.datetime.minute) {
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
