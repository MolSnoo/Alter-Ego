// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ActivitiesOptions, ActivityType } from "discord.js";

/**
 * Represents a Discord activity.
 */
export interface Activity extends ActivitiesOptions {
    /** The name of the activity. */
    name: string;
    /** The type of activity. {@link https://discord.com/developers/docs/events/gateway-events#activity-object-activity-types} */
    type: ActivityType;
    /** The URL of the activity, if applicable. */
    url?: string;
}

/**
 * Contains all of the settings for a Game.
 */
export default class GameSettings {
	/**
	 * A string that indicates a message should be interpreted by the commandHandler.
	 */
	commandPrefix: string;
	/**
	 * Whether debug mode is enabled or disabled.
	 */
	debug: boolean;
	/**
	 * The Google Sheets spreadsheet ID for the Game.
	 */
	spreadsheetID: string;
	/**
	 * How many pixels it takes to represent 1 meter of Player movement.
	 */
	pixelsPerMeter: number;
	/**
	 * How much stamina a Player loses every 1/10th of a second while they are moving.
	 */
	staminaUseRate: number;
	/**
	 * A number that will be multiplied by the amount of time passing when at least 1 Player is inflicted with the heated Status.
	 */
	heatedSlowdownRate: number;
    /**
     * Whether or not a progress indicator will be sent to players for long movements.
     */
    sendMoveProgressIndicator: boolean;
	/**
	 * How often, in seconds, the bot will save game data to the spreadsheet.
	 */
	autoSaveInterval: number;
	/**
	 * The lowest possible number for a standard Die roll.
	 */
	diceMin: number;
	/**
	 * The highest possible number for a standard Die roll.
	 */
	diceMax: number;
	/**
	 * The name of the Object in each Room that Players will drop Items in if they don't specify one.
	 * @deprecated Use `defaultDropFixture` instead.
	 */
	defaultDropObject: string;
	/**
	 * The name of the Fixture in each Room that Players will drop Items in if they don't specify one.
	 */
	defaultDropFixture: string;
	/**
	 * The URL of an image that will be displayed when a Player enters a Room if that Room does not have an icon URL of its own.
	 */
	defaultRoomIconURL: string;
	/**
	 * The URL of an image that will be used as the display icon of a player with the `concealed` behavior attribute if a custom one isn't set.
	 */
	defaultConcealedIconURL: string;
	/**
	 * The URL of an image that will be used as the display icon when a player with the `hidden` behavior attribute speaks in the room.
	 */
	hiddenIconURL: string;
	/**
	 * Whether or not Whisper channels will be automatically deleted when all Players have been removed from it.
	 */
	autoDeleteWhisperChannels: boolean;
    /**
	 * Whether or not @everyone should have the Read Message History permission.
	 */
	readMessageHistory: boolean;
	/**
	 * The accent color that will be used in Discord Embeds.
	 */
	embedAccentColor: string;
	/**
	 * The accent color that will be used in standard-type message displays.
	 */
	standardMessageDisplayAccentColor: string;
	/**
	 * The accent color that will be used in warning-type message displays.
	 */
	warningMessageDisplayAccentColor: string;
	/**
	 * The accent color that will be used in alert-type message displays.
	 */
	alertMessageDisplayAccentColor: string;
	/**
	 * Whether or not to show the online player count in the bot's Discord status.
	 */
	showOnlinePlayerCount: boolean;
	/**
	 * Whether or not the bot should automatically execute a command identical to `load all resume` upon startup.
	 */
	autoLoad: boolean;
	/**
	 * The activity the bot will set for itself while it is online with no game in progress.
	 */
	onlineActivity: Activity;
	/**
	 * The activity the bot will set for itself while it is online when debug mode is enabled.
	 */
	debugModeActivity: Activity;
	/**
	 * The activity the bot will set for itself while it is online when a game is in progress.
	 */
	gameInProgressActivity: Activity;

	/**
	 * @param commandPrefix - A string that indicates a message should be interpreted by the commandHandler.
	 * @param debug - Whether debug mode is enabled or disabled.
	 * @param spreadsheetID - The Google Sheets spreadsheet ID for the Game.
	 * @param pixelsPerMeter - How many pixels it takes to represent 1 meter of Player movement.
	 * @param staminaUseRate - How much stamina a Player loses every 1/10th of a second while they are moving.
	 * @param heatedSlowdownRate - A number that will be multiplied by the amount of time passing when at least 1 Player is inflicted with the heated Status.
     * @param sendMoveProgressIndicator - Whether or not a progress indicator will be sent to players for long movements.
	 * @param autoSaveInterval - How often, in seconds, the bot will save game data to the spreadsheet.
	 * @param diceMin - The lowest possible number for a standard Die roll.
	 * @param diceMax - The highest possible number for a standard Die roll.
	 * @param defaultDropObject - The name of the Object in each Room that Players will drop Items in if they don't specify one.
	 * @param defaultRoomIconURL - The URL of an image that will be displayed when a Player enters a Room if that Room does not have an icon URL of its own.
	 * @param defaultConcealedIconURL - The URL of an image that will be used as the display icon of a player with the `concealed` behavior attribute if a custom one isn't set.
	 * @param hiddenIconURL - The URL of an image that will be used as the display icon when a player with the `hidden` behavior attribute speaks in the room.
	 * @param autoDeleteWhisperChannels - Whether or not Whisper channels will be automatically deleted when all Players have been removed from it.
     * @param readMessageHistory - Whether or not @everyone should have the Read Message History permission.
	 * @param embedAccentColor - The accent color that will be used in Discord Embeds.
	 * @param standardMessageDisplayAccentColor - The accent color that will be used in standard-type message displays.
	 * @param warningMessageDisplayAccentColor - The accent color that will be used in warning-type message displays.
	 * @param alertMessageDisplayAccentColor - The accent color that will be used in alert-type message displays.
	 * @param showOnlinePlayerCount - Whether or not to show the online player count in the bot's Discord status.
	 * @param autoLoad - Whether or not the bot should automatically execute a command identical to `load all resume` upon startup.
	 * @param onlineActivity - The activity the bot will set for itself while it is online with no game in progress.
	 * @param debugModeActivity - The activity the bot will set for itself while it is online when debug mode is enabled.
	 * @param gameInProgressActivity - The activity the bot will set for itself while it is online when a game is in progress.
	 */
	constructor(
		commandPrefix: string,
		debug: boolean,
		spreadsheetID: string,
		pixelsPerMeter: number,
		staminaUseRate: number,
		heatedSlowdownRate: number,
        sendMoveProgressIndicator: boolean,
		autoSaveInterval: number,
		diceMin: number,
		diceMax: number,
		defaultDropObject: string,
		defaultRoomIconURL: string,
		defaultConcealedIconURL: string,
		hiddenIconURL: string,
		autoDeleteWhisperChannels: boolean,
		readMessageHistory: boolean,
		embedAccentColor: string,
		standardMessageDisplayAccentColor: string,
		warningMessageDisplayAccentColor: string,
		alertMessageDisplayAccentColor: string,
		showOnlinePlayerCount: boolean,
		autoLoad: boolean,
		onlineActivity: Activity,
		debugModeActivity: Activity,
		gameInProgressActivity: Activity
	) {
		this.commandPrefix = commandPrefix;
		this.debug = debug;
		this.spreadsheetID = spreadsheetID;
		this.pixelsPerMeter = pixelsPerMeter;
		this.staminaUseRate = staminaUseRate;
		this.heatedSlowdownRate = heatedSlowdownRate;
        this.sendMoveProgressIndicator = sendMoveProgressIndicator;
		this.autoSaveInterval = autoSaveInterval;
		this.diceMin = diceMin;
		this.diceMax = diceMax;
		this.defaultDropFixture = defaultDropObject;
		this.defaultRoomIconURL = defaultRoomIconURL;
		this.defaultConcealedIconURL = defaultConcealedIconURL;
		this.hiddenIconURL = hiddenIconURL;
		this.autoDeleteWhisperChannels = autoDeleteWhisperChannels;
        this.readMessageHistory = readMessageHistory;
		this.embedAccentColor = embedAccentColor;
		this.standardMessageDisplayAccentColor = standardMessageDisplayAccentColor;
		this.warningMessageDisplayAccentColor = warningMessageDisplayAccentColor;
		this.alertMessageDisplayAccentColor = alertMessageDisplayAccentColor;
		this.showOnlinePlayerCount = showOnlinePlayerCount;
		this.autoLoad = autoLoad;
		this.onlineActivity = onlineActivity;
		this.debugModeActivity = debugModeActivity;
		this.gameInProgressActivity = gameInProgressActivity
	}
}
