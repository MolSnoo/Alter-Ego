

/**
 * @class GameSettings
 * @classdesc Contains all of the settings for a Game.
 */
export default class GameSettings {
	/**
	 * A string that indicates a message should be interpreted by the commandHandler.
	 * @type {string}
	 */
	commandPrefix;
	/**
	 * Whether debug mode is enabled or disabled.
	 * @type {boolean}
	 */
	debug;
	/**
	 * The Google Sheets spreadsheet ID for the Game.
	 * @type {string}
	 */
	spreadsheetID;
	/**
	 * How many pixels it takes to represent 1 meter of Player movement.
	 * @type {number}
	 */
	pixelsPerMeter;
	/**
	 * How much stamina a Player loses every 1/10th of a second while they are moving.
	 * @type {number}
	 */
	staminaUseRate;
	/**
	 * A number that will be multiplied by the amount of time passing when at least 1 Player is inflicted with the heated Status.
	 * @type {number}
	 */
	heatedSlowdownRate;
	/**
	 * How often, in seconds, the bot will save game data to the spreadsheet.
	 * @type {number}
	 */
	autoSaveInterval;
	/**
	 * The lowest possible number for a standard Die roll.
	 * @type {number}
	 */
	diceMin;
	/**
	 * The highest possible number for a standard Die roll.
	 * @type {number}
	 */
	diceMax;
	/**
	 * The name of the Object in each Room that Players will drop Items in if they don't specify one.
	 * @type {string}
	 */
	defaultDropObject;
	/**
	 * The URL of an image that will be displayed when a Player enters a Room if that Room does not have an icon URL of its own.
	 * @type {string}
	 */
	defaultRoomIconURL;
	/**
	 * Whether or not Whisper channels will be automatically deleted when all Players have been removed from it.
	 * @type {boolean}
	 */
	autoDeleteWhisperChannels;
	/**
	 * The accent color that will be used in Discord Embeds.
	 * @type {string}
	 */
	embedColor;
	/**
	 * Whether or not to show the online player count in the bot's Discord status.
	 * @type {boolean}
	 */
	showOnlinePlayerCount;
	/**
	 * The activity the bot will set for itself while it is online with no game in progress.
	 * @type {Activity}
	 */
	onlineActivity;
	/**
	 * The activity the bot will set for itself while it is online when debug mode is enabled.
	 * @type {Activity}
	 */
	debugModeActivity;
	/**
	 * The activity the bot will set for itself while it is online when a game is in progress.
	 * @type {Activity}
	 */
	gameInProgressActivity;

	/**
	 * @constructor
	 * @param {string} commandPrefix - A string that indicates a message should be interpreted by the commandHandler.
	 * @param {boolean} debug - Whether debug mode is enabled or disabled.
	 * @param {string} spreadsheetID - The Google Sheets spreadsheet ID for the Game.
	 * @param {number} pixelsPerMeter - How many pixels it takes to represent 1 meter of Player movement.
	 * @param {number} staminaUseRate - How much stamina a Player loses every 1/10th of a second while they are moving.
	 * @param {number} heatedSlowdownRate - A number that will be multiplied by the amount of time passing when at least 1 Player is inflicted with the heated Status.
	 * @param {number} autoSaveInterval - How often, in seconds, the bot will save game data to the spreadsheet.
	 * @param {number} diceMin - The lowest possible number for a standard Die roll.
	 * @param {number} diceMax - The highest possible number for a standard Die roll.
	 * @param {string} defaultDropObject - The name of the Object in each Room that Players will drop Items in if they don't specify one.
	 * @param {string} defaultRoomIconURL - The URL of an image that will be displayed when a Player enters a Room if that Room does not have an icon URL of its own.
	 * @param {boolean} autoDeleteWhisperChannels - Whether or not Whisper channels will be automatically deleted when all Players have been removed from it.
	 * @param {string} embedColor - The accent color that will be used in Discord Embeds.
	 * @param {boolean} showOnlinePlayerCount - Whether or not to show the online player count in the bot's Discord status.
	 * @param {Activity} onlineActivity - The activity the bot will set for itself while it is online with no game in progress.
	 * @param {Activity} debugModeActivity - The activity the bot will set for itself while it is online when debug mode is enabled.
	 * @param {Activity} gameInProgressActivity - The activity the bot will set for itself while it is online when a game is in progress.
	 */
	constructor(
		commandPrefix,
		debug,
		spreadsheetID,
		pixelsPerMeter,
		staminaUseRate,
		heatedSlowdownRate,
		autoSaveInterval,
		diceMin,
		diceMax,
		defaultDropObject,
		defaultRoomIconURL,
		autoDeleteWhisperChannels,
		embedColor,
		showOnlinePlayerCount,
		onlineActivity,
		debugModeActivity,
		gameInProgressActivity
	) {
		this.commandPrefix = commandPrefix;
		this.debug = debug;
		this.spreadsheetID = spreadsheetID;
		this.pixelsPerMeter = pixelsPerMeter;
		this.staminaUseRate = staminaUseRate;
		this.heatedSlowdownRate = heatedSlowdownRate;
		this.autoSaveInterval = autoSaveInterval;
		this.diceMin = diceMin;
		this.diceMax = diceMax;
		this.defaultDropObject = defaultDropObject;
		this.defaultRoomIconURL = defaultRoomIconURL;
		this.autoDeleteWhisperChannels = autoDeleteWhisperChannels;
		this.embedColor = embedColor;
		this.showOnlinePlayerCount = showOnlinePlayerCount;
		this.onlineActivity = onlineActivity;
		this.debugModeActivity = debugModeActivity;
		this.gameInProgressActivity = gameInProgressActivity
	}
}
