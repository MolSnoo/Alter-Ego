

/**
 * @class GameSettings
 * @classdesc Contains all of the settings for a Game.
 * @constructor
 * @param {string} commandPrefix - A string that indicates a message should be interpreted by the commandHandler.
 * @param {boolean} debug - Whether debug mode is enabled or disabled.
 * @param {string} embedColor - The accent color that will be used in Discord Embeds.
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
 * @param {Activity} onlineActivity - The activity the bot will set for itself while it is online with no game in progress.
 * @param {Activity} debugModeActivity - The activity the bot will set for itself while it is online when debug mode is enabled.
 * @param {Activity} gameInProgressActivity - The activity the bot will set for itself while it is online when a game is in progress.
 */
export default class GameSettings {
	/**
	 * @param {string} commandPrefix 
	 * @param {boolean} debug 
	 * @param {string} embedColor 
	 * @param {string} spreadsheetID 
	 * @param {number} pixelsPerMeter 
	 * @param {number} staminaUseRate 
	 * @param {number} heatedSlowdownRate 
	 * @param {number} autoSaveInterval 
	 * @param {number} diceMin 
	 * @param {number} diceMax 
	 * @param {string} defaultDropObject 
	 * @param {string} defaultRoomIconURL 
	 * @param {boolean} autoDeleteWhisperChannels 
	 * @param {Activity} onlineActivity 
	 * @param {Activity} debugModeActivity 
	 * @param {Activity} gameInProgressActivity 
	 */
	constructor(
		commandPrefix,
		debug,
		embedColor,
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
		onlineActivity,
		debugModeActivity,
		gameInProgressActivity
	) {
		this.commandPrefix = commandPrefix;
		this.debug = debug;
		this.embedColor = embedColor;
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
		this.onlineActivity = onlineActivity;
		this.debugModeActivity = debugModeActivity;
		this.gameInProgressActivity = gameInProgressActivity
	}
}