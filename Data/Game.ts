// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "discord.js";
import { DateTime } from "luxon";
import ClientContext from "../Classes/ClientContext.ts";
import GameCommunicationHandler from "../Classes/GameCommunicationHandler.ts";
import GameConstants from "../Classes/GameConstants.ts";
import GameEntityFinder from "../Classes/GameEntityFinder.ts";
import GameEntityLoader from "../Classes/GameEntityLoader.ts";
import GameEntitySaver from "../Classes/GameEntitySaver.ts";
import GameErrorMessageGenerator from "../Classes/GameErrorMessageGenerator.ts";
import GameLogHandler from "../Classes/GameLogHandler.ts";
import GameNarrationHandler from "../Classes/GameNarrationHandler.ts";
import GameNotificationGenerator from "../Classes/GameNotificationGenerator.ts";
import GameMovementHandler from "../Classes/GameMovementHandler.ts";
import type GameSettings from "../Classes/GameSettings.ts";
import type GuildContext from "../Classes/GuildContext.ts";
import PriorityQueue from "../Classes/PriorityQueue.ts";
import TriggerAction from "./Actions/TriggerAction.ts";
import Event from "./Event.ts";
import type Fixture from "./Fixture.ts";
import type Flag from "./Flag.ts";
import type Gesture from "./Gesture.ts";
import type InventoryItem from "./InventoryItem.ts";
import type Party from "./Party.ts";
import type Player from "./Player.ts";
import type Prefab from "./Prefab.ts";
import type Puzzle from "./Puzzle.ts";
import type Recipe from "./Recipe.ts";
import type Room from "./Room.ts";
import type RoomItem from "./RoomItem.ts";
import type Status from "./Status.ts";
import type Whisper from "./Whisper.ts";
import type Moderator from "./Moderator.ts";

/**
 * Represents a game managed by the bot.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/game.html
 */
export default class Game {
	/**
	 * The guild in which the game is occurring and all of the parts of the guild frequently accessed by the bot.
	 */
	readonly guildContext: GuildContext;
	/**
	 * The bot managing the game.
	 */
	clientContext: ClientContext;
	/**
	 * All of the settings for the game.
	 */
	settings: GameSettings;
	/**
	 * A collection of constants used to refer to cell ranges on the spreadsheet.
	*/
	readonly constants: GameConstants;
	/**
	 * An interface for the message handler. Contains a number of functions that ensure actions won't be communicated multiple times in the same channel.
	 */
	readonly communicationHandler: GameCommunicationHandler;
	/**
	 * A set of functions to get and find game entities.
	 */
	readonly entityFinder: GameEntityFinder;
	/**
	 * A set of functions to load game entities from the sheet.
	 */
	readonly entityLoader: GameEntityLoader;
	/**
	 * A set of functions to save game entities to the sheet.
	 */
	readonly entitySaver: GameEntitySaver;
	/**
	 * A set of functions to send messages to the game's log channel.
	 */
	readonly logHandler: GameLogHandler;
    /**
     * A set of functions to generate error messages to send to users.
     */
    readonly errorMessageGenerator: GameErrorMessageGenerator;
	/**
	 * A set of functions to generate notifications to send to players.
	 */
	readonly notificationGenerator: GameNotificationGenerator;
	/**
	 * A set of functions to send narrations.
	 */
	readonly narrationHandler: GameNarrationHandler;
    /**
     * A set of functions to handle movement.
     */
    readonly movementHandler: GameMovementHandler;
	/**
	 * Whether or not the game is currently in progress.
	 */
	inProgress: boolean;
	/**
	 * Whether or not members with the eligible role can join the game with the play command.
	 */
	canJoin: boolean;
	/**
	 * A timer used by the startgame command to announce when half of the time allotted for players to join the game has elapsed.
	 */
	halfTimer: NodeJS.Timeout;
	/**
	 * A timer used by the startgame command. When this expires, all of the players who joined the game are saved to the spreadsheet.
	 * */
	endTimer: NodeJS.Timeout;
	/**
	 * Whether or not there is currently at least one player with the `heated` status in the game.
	 */
	heated: boolean;
	/**
	 * Whether or not edit mode is currently enabled.
	 */
	editMode: boolean;
	/**
	 * A set of data types that have been loaded with errors. The game is not playable if this set isn't empty.
	 */
	loadedEntitiesWithErrors: Set<string>;
	/**
	 * A collection of all rooms in the game. The key for each room is its id.
	 */
	rooms: Collection<string, Room>;
	/**
	 * An array of all fixtures in the game. Deprecated. Use fixtures instead.
	 * @deprecated
	 */
	objects: Fixture[];
	/**
	 * An array of all fixtures in the game.
	 */
	fixtures: Fixture[];
	/**
	 * A collection of all prefabs in the game. The key for each prefab is its id.
	 */
	prefabs: Collection<string, Prefab>;
	/**
	 * An array of all recipes in the game.
	 */
	recipes: Recipe[];
	/**
	 * An array of all room items in the game. Deprecated. Use roomItems instead.
	 * @deprecated
	 */
	items: RoomItem[];
	/**
	 * An array of all room items in the game.
	 */
	roomItems: RoomItem[];
	/**
	 * An array of all puzzles in the game.
	 */
	puzzles: Puzzle[];
	/**
	 * A collection of all events in the game. The key for each prefab is its id.
	 */
	events: Collection<string, Event>;
	/**
	 * A collection of all status effects in the game. The key for each prefab is its id.
	 */
	statusEffects: Collection<string, Status>;
	/**
	 * A collection of all players in the game. The key for each player is their name.
	 */
	players: Collection<string, Player>;
	/**
	 * A collection of all living players in the game. The key for each player is their name.
	 */
	livingPlayers: Collection<string, Player>;
	/**
	 * A collection of all dead players in the game. The key for each player is their name.
	 */
	deadPlayers: Collection<string, Player>;
	/**
	 * An array of all inventory items in the game.
	 */
	inventoryItems: InventoryItem[];
	/**
	 * A collection of all gestures in the game. The key for each gesture is its id.
	 */
	gestures: Collection<string, Gesture>;
	/**
	 * A collection of all flags in the game, where the key is the flag's ID.
	 */
	flags: Collection<string, Flag>;
	/**
	 * A collection of all whispers in the game. The key for each whisper is its channel name. These are not saved to the sheet.
	 */
	whispers: Collection<string, Whisper>;
    /**
     * A collection of all parties in the game, where the key is the party's ID. These are not saved to the sheet.
     */
    parties: Collection<string, Party>;
    /**
     * A collection of all moderators in the game, where the key is the moderator's Discord user ID.
     * These are created the first time a user with the moderator role sends a message in the game server.
     */
    moderators: Collection<string, Moderator>;
	/**
	 * A queue of messages to be sent by the messageHandler.
	 */
	messageQueue: PriorityQueue<["mod", "tell", "mechanic", "log", "spectator"]>;
    /**
     * A queue of message edits to be handled by the messageHandler.
     */
    editQueue: PriorityQueue<["standard"]>;
	/**
	 * A timeout which sends queued messages every quarter of a second.
	 */
	#queuedMessageSendInterval: NodeJS.Timeout;
	/**
	 * A timeout that saves the game data to the spreadsheet periodically.
	 */
	#autoSaveInterval: NodeJS.Timeout;
	/**
	 * A timeout that checks for events that should be triggered every minute.
	 */
	#eventTriggerInterval: NodeJS.Timeout;
    /**
     * A constant value that determines how long an in-game tick is. To be used in timers.
     */
    public static readonly tick = 100;

	/**
	 * @param guildContext - The guild this game is occurring in.
	 * @param settings - The settings for the game.
	 */
	constructor(guildContext: GuildContext, settings: GameSettings) {
		this.guildContext = guildContext;
		this.settings = settings;
		this.constants = GameConstants.Instance;
		this.communicationHandler = new GameCommunicationHandler(this);
		this.entityFinder = new GameEntityFinder(this);
		this.entityLoader = new GameEntityLoader(this);
		this.entitySaver = new GameEntitySaver(this);
		this.logHandler = new GameLogHandler(this);
        this.errorMessageGenerator = new GameErrorMessageGenerator(this);
		this.notificationGenerator = new GameNotificationGenerator(this);
		this.narrationHandler = new GameNarrationHandler(this);
        this.movementHandler = new GameMovementHandler(this);
		this.inProgress = false;
		this.canJoin = false;
		this.halfTimer = null;
		this.endTimer = null;
		this.heated = false;
		this.editMode = false;
		this.loadedEntitiesWithErrors = new Set();
		this.rooms = new Collection();
		this.objects = [];
		this.fixtures = [];
		this.prefabs = new Collection();
		this.recipes = [];
		this.items = [];
		this.roomItems = [];
		this.puzzles = [];
		this.events = new Collection();
		this.statusEffects = new Collection();
		this.players = new Collection();
		this.livingPlayers = new Collection();
		this.deadPlayers = new Collection();
		this.inventoryItems = [];
		this.gestures = new Collection();
		this.flags = new Collection();
		this.whispers = new Collection();
        this.parties = new Collection();
        this.moderators = new Collection();
		this.messageQueue = new PriorityQueue("Message Handler encountered exception sending message:", ['mod', 'tell', 'mechanic', 'log', 'spectator']);
        this.editQueue = new PriorityQueue("Message Handler encountered exception editing message:", ['standard']);

		// Save data to the sheet periodically.
		this.#autoSaveInterval = setInterval(
			() => {
                try {
                    if (this.inProgress && !this.editMode) this.entitySaver.saveGame();
                }
                catch (error) {
                    if (error.hasOwnProperty("code") && error.code !== 503 && error.code !== 500) {
                        console.log(error);
                    }
                }
            },
			this.settings.autoSaveInterval * 1000
		);
		// Check for any events that are supposed to trigger at this time of day.
		this.#eventTriggerInterval = setInterval(() => {
			if (this.inProgress) {
				const now = DateTime.now();
				this.events.forEach(event => {
					if (!event.ongoing) {
						for (let triggerTimeString of event.triggerTimesStrings) {
							const time = Event.parseTriggerTime(triggerTimeString);
							if (time.valid
								&& now.month === time.datetime.month
								&& now.day === time.datetime.day
								&& now.weekday === time.datetime.weekday
								&& now.hour === time.datetime.hour
								&& now.minute === time.datetime.minute) {
								const triggerAction = new TriggerAction(this, undefined, undefined, undefined, false);
								triggerAction.performTrigger(event);
								break;
							}
						}
					}
				});
			}
		}, 60 * 1000);
	}

	setClientContext(): void {
		this.clientContext = ClientContext.instance;
	}

	/**
	 * Generate a name in all uppercase with no apostrophes or quotation marks.
	 */
	static generateValidEntityName(name: string): string {
		return name?.toUpperCase().replace(/[\'"“”`]/g, '').trim();
	}
}
