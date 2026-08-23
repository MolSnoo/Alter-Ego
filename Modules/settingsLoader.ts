// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import GameSettings from "../Classes/GameSettings.ts";
import ClientContext from "../Classes/ClientContext.ts";
import { type Activity } from "../Classes/GameSettings.ts";

export interface PlayerDefaults {
    defaultPronouns: string;
    defaultVoice: string;
    defaultStats: Stats;
    defaultLocation: string;
    defaultStatusEffects: string;
    defaultInventory: string[][];
    defaultDescription: string;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
    commandPrefix: ".",
    debug: false,
    spreadsheetID: "",
    pixelsPerMeter: 25,
    staminaUseRate: -0.01,
    heatedSlowdownRate: 0.5,
    sendMoveProgressIndicator: true,
    autoSaveInterval: 30,
    diceMin: 1,
    diceMax: 6,
    defaultDropFixture: "FLOOR",
    defaultDropObject: "FLOOR",
    defaultRoomIconURL: "",
    defaultConcealedIconURL: "https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png",
    hiddenIconURL: "https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png",
    autoDeleteWhisperChannels: true,
    embedAccentColor: "1F8B4C",
    standardMessageDisplayAccentColor: "1F8B4C",
    warningMessageDisplayAccentColor: "FFC107",
    alertMessageDisplayAccentColor: "FF0E0E",
    showOnlinePlayerCount: true,
    autoLoad: false,
    onlineActivity: {
        name: "Waiting for commands...",
        type: ClientContext.getActivityType("CUSTOM")
    },
    debugModeActivity: {
        name: "Debug Mode",
        type: ClientContext.getActivityType("PLAYING")
    },
    gameInProgressActivity: {
        name: "NWP",
        type: ClientContext.getActivityType("STREAMING"),
        url: "https://www.twitch.tv/twitch"
    },
    readMessageHistory: false
}

export const DEFAULT_PLAYER_DEFAULTS: PlayerDefaults = {
    defaultPronouns: "neutral",
    defaultVoice: "a neutral voice",
    defaultStats: {
        strength: 5,
        perception: 5,
        dexterity: 5,
        stamina: 5,
        speed: 5,
    },
    defaultLocation: "Dorm 1",
    defaultStatusEffects: "satisfied, well rested, clean, normal",
    defaultInventory: [
        ["NULL", "", "RIGHT HAND", "", "", "", ""],
        ["NULL", "", "LEFT HAND", "", "", "", ""],
        ["NULL", "", "HAT", "", "", "", ""],
        ["NULL", "", "GLASSES", "", "", "", ""],
        ["NULL", "", "FACE", "", "", "", ""],
        ["NULL", "", "NECK", "", "", "", ""],
        ["NULL", "", "ACCESSORY", "", "", "", ""],
        ["NULL", "", "CHEST", "", "", "", ""],
        ["DEFAULT SHIRT", "", "SHIRT", "", "1", "", "<desc><s>It's a plain, <procedural name=\"clothing color\"><poss name=\"white\">white</poss></procedural> T-shirt.</s></desc>"],
        ["NULL", "", "JACKET", "", "", "", ""],
        ["NULL", "", "BAG", "", "", "", ""],
        ["NULL", "", "GLOVES", "", "", "", ""],
        ["DEFAULT PANTS", "DEFAULT PANTS #", "PANTS", "", "1", "", "<desc><s>It's a plain pair of <procedural name=\"clothing color\"><poss name=\"light blue\">light blue</poss></procedural> jeans.</s> <s>It has two pockets on the front.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s></desc>"],
        ["DEFAULT UNDERWEAR", "", "UNDERWEAR", "", "1", "", "<desc><s>It's a plain, <procedural name=\"clothing color\"><poss name=\"white\">white</poss></procedural> pair of underwear.</s></desc>"],
        ["DEFAULT SOCKS", "", "SOCKS", "", "1", "", "<desc><s>It's a pair of plain, <procedural name=\"clothing color\"><poss name=\"white\">white</poss></procedural> ankle socks.</s></desc>"],
        ["DEFAULT SHOES", "", "SHOES", "", "1", "", "<desc><s>It's a pair of plain, <procedural name=\"clothing color\"><poss name=\"white\">white</poss></procedural> tennis shoes.</s></desc>"]
    ],
    defaultDescription: "<desc><s>You examine <var v=\"this.displayName\"/>.</s> <if cond=\"this.hasBehaviorAttribute('concealed')\"><s><var v=\"this.pronouns.Sbj\" /> <if cond=\"this.pronouns.plural\">are</if><if cond=\"!this.pronouns.plural\">is</if> [HEIGHT], but <var v=\"this.pronouns.dpos\" /> face is concealed.</s></if><if cond=\"!this.hasBehaviorAttribute('concealed')\"><s><var v=\"this.pronouns.Sbj\" /><if cond=\"this.pronouns.plural\">'re</if><if cond=\"!this.pronouns.plural\">'s</if> [HEIGHT] with [SKIN TONE], [HAIR], and [EYES].</s> <if cond=\"this.hasStatus('tired')\"><s><var v=\"this.pronouns.Sbj\"/> <if cond=\"this.pronouns.plural\">have</if><if cond=\"!this.pronouns.plural\">has</if> bags under <var v=\"this.pronouns.dpos\"/> eyes.</s></if><if cond=\"this.hasStatus('exhausted')\"><s><var v=\"this.pronouns.Sbj\"/> <if cond=\"this.pronouns.plural\">have</if><if cond=\"!this.pronouns.plural\">has</if> dark bags under <var v=\"this.pronouns.dpos\"/> eyes.</s> <s><var v=\"this.pronouns.Sbj\"/> look<if cond=\"!this.pronouns.plural\">s</if> absolutely **exhausted**.</s></if><if cond=\"this.hasStatus('delirious')\"><s><var v=\"this.pronouns.Sbj\"/> look<if cond=\"!this.pronouns.plural\">s</if> completely **delirious**, like <var v=\"this.pronouns.sbj\"/> <if cond=\"this.pronouns.plural\">have</if><if cond=\"!this.pronouns.plural\">has</if>n't slept in days.</s></if></if><br /><br /><s><var v=\"this.pronouns.Sbj\" /> wear<if cond=\"!this.pronouns.plural\">s</if> <il name=\"equipment\"></il>.</s><if cond=\"this.getContainedItemsForItemList('equipment').length === 0\"><s><var v=\"this.pronouns.Sbj\" /> <if cond=\"!this.pronouns.plural\">is</if><if cond=\"this.pronouns.plural\">are</if> completely naked.</s></if> <s>You see <var v=\"this.pronouns.obj\"/> carrying <il name=\"hands\"></il>.</s> <if cond=\"this.hasStatus('stinky')\"><s><var v=\"this.pronouns.Sbj\"/>'<if cond=\"this.pronouns.plural\">re</if><if cond=\"!this.pronouns.plural\">s</if> a little stinky.</s></if><if cond=\"this.hasStatus('rancid')\"><s><var v=\"this.pronouns.Sbj\"/> smell<if cond=\"!this.pronouns.plural\">s</if> absolutely **rancid**.</s></if> <if cond=\"this.hasStatus('soaking wet')\"><s>Also, <var v=\"this.pronouns.sbj\"/> <if cond=\"!this.pronouns.plural\">is</if><if cond=\"this.pronouns.plural\">are</if> soaking wet.</s></if><if cond=\"this.hasStatus('wet')\"><s>Also, <var v=\"this.pronouns.sbj\"/> <if cond=\"!this.pronouns.plural\">is</if><if cond=\"this.pronouns.plural\">are</if> a bit wet.</s></if></desc>"
}

/**
 * Loads game settings and player defaults.
 *
 * @returns The loaded game settings.
 */
export function loadGameSettingsAndPlayerDefaults(): GameSettings {
    let errors: string[] = [];

    let [gs, gsErr] = loadGameSettings();
    errors.push(...gsErr);

    let [, pdErr] = loadPlayerDefaults();
    errors.push(...pdErr);

    if (errors.length > 0) {
        throw new Error(errors.join('\n'));
    }

    return gs;
}

/**
 * Loads game settings from environment variables.
 *
 * @returns Array with GameSettings object and an array of errors encountered during loading.
 */
export function loadGameSettings(): [GameSettings, string[]] {
    let errors: string[] = [];

    const commandPrefix: string = process.env.COMMAND_PREFIX ?? DEFAULT_GAME_SETTINGS.commandPrefix;

    const debug = pushErrors(stringToBoolOrDefault(process.env.DEBUG_MODE, DEFAULT_GAME_SETTINGS.debug), errors);
    const spreadsheetId = process.env.SPREADSHEET_ID ?? DEFAULT_GAME_SETTINGS.spreadsheetID;
    const pixelsPerMeter = pushErrors(parseIntOrDefault(process.env.PIXELS_PER_METER, DEFAULT_GAME_SETTINGS.pixelsPerMeter), errors);

    let staminaUseRate = pushErrors(parseFloatOrDefault(process.env.STAMINA_USE_RATE, DEFAULT_GAME_SETTINGS.staminaUseRate), errors);
    if (staminaUseRate > 0) {
        errors.push("Error: STAMINA_USE_RATE must be a negative number.");
        staminaUseRate = DEFAULT_GAME_SETTINGS.staminaUseRate;
    }

    const heatedSlowdownRate = pushErrors(parseFloatOrDefault(process.env.HEATED_SLOWDOWN_RATE, DEFAULT_GAME_SETTINGS.heatedSlowdownRate), errors);
    const autoSaveInterval = pushErrors(parseIntOrDefault(process.env.AUTOSAVE_INTERVAL, DEFAULT_GAME_SETTINGS.autoSaveInterval), errors);
    const sendMoveProgressIndicator = pushErrors(stringToBoolOrDefault(process.env.SEND_MOVE_PROGRESS_INDICATOR, DEFAULT_GAME_SETTINGS.sendMoveProgressIndicator), errors);

    let diceMin = pushErrors(parseIntOrDefault(process.env.DICE_MIN, DEFAULT_GAME_SETTINGS.diceMin), errors);
    let diceMax = pushErrors(parseIntOrDefault(process.env.DICE_MAX, DEFAULT_GAME_SETTINGS.diceMax), errors);
    if (diceMin >= diceMax) {
        errors.push("Error: DICE_MIN must be less than DICE_MAX.");
        diceMin = DEFAULT_GAME_SETTINGS.diceMin;
        diceMax = DEFAULT_GAME_SETTINGS.diceMax;
    }

    const defaultDropFixture = process.env.DEFAULT_DROP_FIXTURE ?? DEFAULT_GAME_SETTINGS.defaultDropFixture;
    const defaultRoomIconUrl = process.env.DEFAULT_ROOM_ICON_URL ?? DEFAULT_GAME_SETTINGS.defaultRoomIconURL;
    const defaultConcealedIconUrl = process.env.DEFAULT_CONCEALED_ICON_URL ?? DEFAULT_GAME_SETTINGS.defaultConcealedIconURL;
    const hiddenIconUrl = process.env.HIDDEN_ICON_URL ?? DEFAULT_GAME_SETTINGS.hiddenIconURL;

    const autoDeleteWhisperChannels = pushErrors(stringToBoolOrDefault(process.env.AUTO_DELETE_WHISPER_CHANNELS, DEFAULT_GAME_SETTINGS.autoDeleteWhisperChannels), errors);
    const readMessageHistory = pushErrors(stringToBoolOrDefault(process.env.READ_MESSAGE_HISTORY, DEFAULT_GAME_SETTINGS.readMessageHistory), errors);

    const colorRegex = /^[\dA-F]{6}$/i;
    let embedAccentColor = process.env.EMBED_ACCENT_COLOR ?? DEFAULT_GAME_SETTINGS.embedAccentColor;
    if (!colorRegex.test(embedAccentColor)) {
        errors.push("Error: EMBED_ACCENT_COLOR is not a valid hex color code. If it contains a # character, remove it.");
        embedAccentColor = DEFAULT_GAME_SETTINGS.embedAccentColor;
    }
    let standardMessageDisplayAccentColor = process.env.STANDARD_MESSAGE_DISPLAY_ACCENT_COLOR ?? DEFAULT_GAME_SETTINGS.standardMessageDisplayAccentColor;
    if (!colorRegex.test(standardMessageDisplayAccentColor)) {
        errors.push("Error: STANDARD_MESSAGE_DISPLAY_ACCENT_COLOR is not a valid hex color code. If it contains a # character, remove it.");
        standardMessageDisplayAccentColor = DEFAULT_GAME_SETTINGS.standardMessageDisplayAccentColor;
    }
    let warningMessageDisplayAccentColor = process.env.WARNING_MESSAGE_DISPLAY_ACCENT_COLOR ?? DEFAULT_GAME_SETTINGS.warningMessageDisplayAccentColor;
    if (!colorRegex.test(warningMessageDisplayAccentColor)) {
        errors.push("Error: WARNING_MESSAGE_DISPLAY_ACCENT_COLOR is not a valid hex color code. If it contains a # character, remove it.");
        warningMessageDisplayAccentColor = DEFAULT_GAME_SETTINGS.warningMessageDisplayAccentColor;
    }
    let alertMessageDisplayAccentColor = process.env.ALERT_MESSAGE_DISPLAY_ACCENT_COLOR ?? DEFAULT_GAME_SETTINGS.alertMessageDisplayAccentColor;
    if (!colorRegex.test(alertMessageDisplayAccentColor)) {
        errors.push("Error: ALERT_MESSAGE_DISPLAY_ACCENT_COLOR is not a valid hex color code. If it contains a # character, remove it.");
        alertMessageDisplayAccentColor = DEFAULT_GAME_SETTINGS.alertMessageDisplayAccentColor;
    }

    const showOnlinePlayerCount = pushErrors(stringToBoolOrDefault(process.env.SHOW_ONLINE_PLAYER_COUNT, DEFAULT_GAME_SETTINGS.showOnlinePlayerCount), errors);
    const autoLoad = pushErrors(stringToBoolOrDefault(process.env.AUTO_LOAD, DEFAULT_GAME_SETTINGS.autoLoad), errors);

    const onlineActivityString = process.env.ONLINE_ACTIVITY_STRING ?? DEFAULT_GAME_SETTINGS.onlineActivity.name;
    const onlineActivityType = () => {
        if (process.env.ONLINE_ACTIVITY_TYPE === undefined) return DEFAULT_GAME_SETTINGS.onlineActivity.type;
        else return ClientContext.getActivityType(process.env.ONLINE_ACTIVITY_TYPE);
    };
    const onlineActivity: Activity = {
        name: onlineActivityString,
        type: onlineActivityType()
    };

    const debugModeActivityString = process.env.DEBUG_MODE_ACTIVITY_STRING ?? DEFAULT_GAME_SETTINGS.debugModeActivity.name;
    const debugModeActivityType = () => {
        if (process.env.DEBUG_MODE_ACTIVITY_TYPE === undefined) return DEFAULT_GAME_SETTINGS.debugModeActivity.type;
        else return ClientContext.getActivityType(process.env.DEBUG_MODE_ACTIVITY_TYPE);
    };
    const debugModeActivity: Activity = {
        name: debugModeActivityString,
        type: debugModeActivityType()
    };

    const gameInProgressActivityString = process.env.GAME_IN_PROGRESS_ACTIVITY_STRING ?? DEFAULT_GAME_SETTINGS.gameInProgressActivity.name;
    const gameInProgressActivityType = () => {
        if (process.env.GAME_IN_PROGRESS_ACTIVITY_TYPE === undefined) return DEFAULT_GAME_SETTINGS.gameInProgressActivity.type;
        else return ClientContext.getActivityType(process.env.GAME_IN_PROGRESS_ACTIVITY_TYPE);
    }
    const gameInProgressActivityUrl = process.env.GAME_IN_PROGRESS_ACTIVITY_URL ?? DEFAULT_GAME_SETTINGS.gameInProgressActivity.url;
    const gameInProgressActivity: Activity = {
        name: gameInProgressActivityString,
        type: gameInProgressActivityType(),
        url: gameInProgressActivityUrl
    }

    let settings = new GameSettings(
        commandPrefix,
        debug,
        spreadsheetId,
        pixelsPerMeter,
        staminaUseRate,
        heatedSlowdownRate,
        sendMoveProgressIndicator,
        autoSaveInterval,
        diceMin,
        diceMax,
        defaultDropFixture,
        defaultRoomIconUrl,
        defaultConcealedIconUrl,
        hiddenIconUrl,
        autoDeleteWhisperChannels,
        readMessageHistory,
        embedAccentColor,
        standardMessageDisplayAccentColor,
        warningMessageDisplayAccentColor,
        alertMessageDisplayAccentColor,
        showOnlinePlayerCount,
        autoLoad,
        onlineActivity,
        debugModeActivity,
        gameInProgressActivity
    );

    return [settings, errors];
}

/**
 * Loads player defaults from environment variables.
 *
 * @returns Array with PlayerDefaults object and an array of errors encountered during loading.
 */
export function loadPlayerDefaults(): [PlayerDefaults, string[]] {
    let errors: string[] = [];

    const defaultPronouns = process.env.DEFAULT_PRONOUNS ?? DEFAULT_PLAYER_DEFAULTS.defaultPronouns;
    const defaultVoice = process.env.DEFAULT_VOICE ?? DEFAULT_PLAYER_DEFAULTS.defaultVoice;

    let defaultStrength = pushErrors(parseIntOrDefault(process.env.DEFAULT_STR, DEFAULT_PLAYER_DEFAULTS.defaultStats.strength), errors);
    if (defaultStrength < 1 || defaultStrength > 10) {
        errors.push("Error: DEFAULT_STR must be between 1 and 10.");
        defaultStrength = DEFAULT_PLAYER_DEFAULTS.defaultStats.strength;
    }
    let defaultPerception = pushErrors(parseIntOrDefault(process.env.DEFAULT_PER, DEFAULT_PLAYER_DEFAULTS.defaultStats.perception), errors);
    if (defaultPerception < 1 || defaultPerception > 10) {
        errors.push("Error: DEFAULT_PER must be between 1 and 10.");
        defaultPerception = DEFAULT_PLAYER_DEFAULTS.defaultStats.perception;
    }
    let defaultDexterity = pushErrors(parseIntOrDefault(process.env.DEFAULT_DEX,  DEFAULT_PLAYER_DEFAULTS.defaultStats.dexterity), errors);
    if (defaultDexterity < 1 || defaultDexterity > 10) {
        errors.push("Error: DEFAULT_DEX must be between 1 and 10.");
        defaultDexterity = DEFAULT_PLAYER_DEFAULTS.defaultStats.dexterity;
    }
    let defaultStamina = pushErrors(parseIntOrDefault(process.env.DEFAULT_STA, DEFAULT_PLAYER_DEFAULTS.defaultStats.stamina), errors);
    if (defaultStamina < 1 || defaultStamina > 10) {
        errors.push("Error: DEFAULT_STA must be between 1 and 10.");
        defaultStamina = DEFAULT_PLAYER_DEFAULTS.defaultStats.stamina;
    }
    let defaultSpeed = pushErrors(parseIntOrDefault(process.env.DEFAULT_SPD,  DEFAULT_PLAYER_DEFAULTS.defaultStats.speed), errors);
    if (defaultSpeed < 1 || defaultSpeed > 10) {
        errors.push("Error: DEFAULT_SPD must be between 1 and 10.");
        defaultSpeed = DEFAULT_PLAYER_DEFAULTS.defaultStats.speed;
    }
    const defaultStats: Stats = {
        strength: defaultStrength,
        perception: defaultPerception,
        dexterity: defaultDexterity,
        stamina: defaultStamina,
        speed: defaultSpeed,
    }

    const defaultLocation = process.env.DEFAULT_LOCATION ?? DEFAULT_PLAYER_DEFAULTS.defaultLocation;
    const defaultStatusEffects = process.env.DEFAULT_STATUS_EFFECTS ?? DEFAULT_PLAYER_DEFAULTS.defaultStatusEffects;

    const defaultInventory = (): string[][] => {
        if (process.env.DEFAULT_INVENTORY === undefined) return DEFAULT_PLAYER_DEFAULTS.defaultInventory;
        else try {
            return JSON.parse(process.env.DEFAULT_INVENTORY);
        } catch (e) {
            errors.push("Error: DEFAULT_INVENTORY is not valid JSON.");
            return DEFAULT_PLAYER_DEFAULTS.defaultInventory;
        }
    };

    const defaultDescription = process.env.DEFAULT_DESCRIPTION ?? DEFAULT_PLAYER_DEFAULTS.defaultDescription;

    let playerDefaults: PlayerDefaults = {
        defaultPronouns: defaultPronouns,
        defaultVoice: defaultVoice,
        defaultStats: defaultStats,
        defaultLocation: defaultLocation,
        defaultStatusEffects: defaultStatusEffects,
        defaultInventory: defaultInventory(),
        defaultDescription: defaultDescription
    };

    return [playerDefaults, errors];
}



/**
 * Converts a string to a boolean value, or returns a default value if the input is undefined.
 *
 * @param input - A string representing a boolean value.
 * @param defaultValue - The value to return if the input is undefined.
 * @returns An array containing the converted boolean value and an array of errors encountered during conversion.
 */
function stringToBoolOrDefault(input: string, defaultValue: boolean): [boolean, string[]] {
    if (input === undefined) return [defaultValue, []];
    switch (input.trim().toLowerCase()) {
        case "true":
            return [true, []];
        case "false":
            return [false, []];
        default:
            return [defaultValue, [`Error: Invalid boolean value: ${input}`]];
    }
}

/**
 * Converts a string to an integer value, or returns a default value if the input is undefined.
 *
 * @returns An array containing the converted integer value and an array of errors encountered during conversion.
 */
function parseIntOrDefault(input: string, defaultValue: number): [number, string[]] {
    if (input === undefined) return [defaultValue, []];

    let num = parseInt(input);
    if (isNaN(num)) return [defaultValue, [`Error: Invalid integer value: ${input}`]];
    else return [num, []];
}

/**
 * Converts a string to a float value, or returns a default value if the input is undefined.
 *
 * @returns An array containing the converted float value and an array of errors encountered during conversion.
 */
function parseFloatOrDefault(input: string, defaultValue: number): [number, string[]] {
    if (input === undefined) return [defaultValue, []];

    let num = parseFloat(input);
    if (isNaN(num)) return [defaultValue, [`Error: Invalid float value: ${input}`]];
    else return [num, []];
}

/**
 * Takes an input array and pushes any errors into an output array.
 *
 * @param input - An input array containing a value of type T and an array of errors.
 * @param outArray - An output array to push errors into.
 * @returns The value of type T from the input array.
 */
function pushErrors<T>(input: [T, string[]], outArray: string[]): T {
    let [value, errs] = input;
    if (errs.length > 0) outArray.push(...errs);
    return value;
}
