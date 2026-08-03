// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
    DEFAULT_GAME_SETTINGS,
    DEFAULT_PLAYER_DEFAULTS,
    loadGameSettings,
    loadPlayerDefaults
} from "../../Modules/settingsLoader.ts";
import BotContext from "../../Classes/BotContext.ts";

describe("settingsLoader tests", () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
    });

    afterAll(() => {
        vi.unstubAllEnvs();
    });

    describe("loadGameSettings tests", () => {
        test("When no environment variables set, load default settings", () => {
            stubEmptyGameSettingsEnvs();
            let [gs, errs] = loadGameSettings();

            expect(errs.length).toBe(0);
            expect(gs.commandPrefix).toBe(DEFAULT_GAME_SETTINGS.commandPrefix);
            expect(gs.debug).toBe(DEFAULT_GAME_SETTINGS.debug);
            expect(gs.spreadsheetID).toBe(DEFAULT_GAME_SETTINGS.spreadsheetID);
            expect(gs.pixelsPerMeter).toBe(DEFAULT_GAME_SETTINGS.pixelsPerMeter);
            expect(gs.staminaUseRate).toBe(DEFAULT_GAME_SETTINGS.staminaUseRate);
            expect(gs.heatedSlowdownRate).toBe(DEFAULT_GAME_SETTINGS.heatedSlowdownRate);
            expect(gs.autoSaveInterval).toBe(DEFAULT_GAME_SETTINGS.autoSaveInterval);
            expect(gs.diceMin).toBe(DEFAULT_GAME_SETTINGS.diceMin);
            expect(gs.diceMax).toBe(DEFAULT_GAME_SETTINGS.diceMax);
            expect(gs.defaultDropFixture).toBe(DEFAULT_GAME_SETTINGS.defaultDropFixture);
            expect(gs.defaultRoomIconURL).toBe(DEFAULT_GAME_SETTINGS.defaultRoomIconURL);
            expect(gs.defaultConcealedIconURL).toBe(DEFAULT_GAME_SETTINGS.defaultConcealedIconURL);
            expect(gs.hiddenIconURL).toBe(DEFAULT_GAME_SETTINGS.hiddenIconURL);
            expect(gs.autoDeleteWhisperChannels).toBe(DEFAULT_GAME_SETTINGS.autoDeleteWhisperChannels);
            expect(gs.embedAccentColor).toBe(DEFAULT_GAME_SETTINGS.embedAccentColor);
            expect(gs.standardMessageDisplayAccentColor).toBe(DEFAULT_GAME_SETTINGS.standardMessageDisplayAccentColor);
            expect(gs.alertMessageDisplayAccentColor).toBe(DEFAULT_GAME_SETTINGS.alertMessageDisplayAccentColor);
            expect(gs.showOnlinePlayerCount).toBe(DEFAULT_GAME_SETTINGS.showOnlinePlayerCount);
            expect(gs.autoLoad).toBe(DEFAULT_GAME_SETTINGS.autoLoad);
            expect(gs.onlineActivity).toStrictEqual(DEFAULT_GAME_SETTINGS.onlineActivity);
            expect(gs.debugModeActivity).toStrictEqual(DEFAULT_GAME_SETTINGS.debugModeActivity);
            expect(gs.gameInProgressActivity).toStrictEqual(DEFAULT_GAME_SETTINGS.gameInProgressActivity);
        });
        test("When environment variables set, load settings from environment variables", () => {
            stubGameSettingsEnv();
            let [gs, errs] = loadGameSettings();
            let customActivity = BotContext.getActivityType("CUSTOM");

            expect(errs.length).toBe(0);
            expect(gs.commandPrefix).toBe("!");
            expect(gs.debug).toBe(true);
            expect(gs.spreadsheetID).toBe("69");
            expect(gs.pixelsPerMeter).toBe(20);
            expect(gs.staminaUseRate).toBe(-0.02);
            expect(gs.heatedSlowdownRate).toBe(0.1);
            expect(gs.autoSaveInterval).toBe(10);
            expect(gs.diceMin).toBe(2);
            expect(gs.diceMax).toBe(20);
            expect(gs.defaultDropFixture).toBe("test");
            expect(gs.defaultRoomIconURL).toBe("test");
            expect(gs.defaultConcealedIconURL).toBe("test");
            expect(gs.hiddenIconURL).toBe("test");
            expect(gs.autoDeleteWhisperChannels).toBe(false);
            expect(gs.embedAccentColor).toBe("FFFFFF");
            expect(gs.standardMessageDisplayAccentColor).toBe("FFFFFF");
            expect(gs.alertMessageDisplayAccentColor).toBe("FFFFFF");
            expect(gs.showOnlinePlayerCount).toBe(false);
            expect(gs.autoLoad).toBe(true);
            expect(gs.onlineActivity.name).toBe("test");
            expect(gs.onlineActivity.type).toBe(customActivity);
            expect(gs.debugModeActivity.name).toBe("test");
            expect(gs.debugModeActivity.type).toBe(customActivity);
            expect(gs.gameInProgressActivity.name).toBe("test");
            expect(gs.gameInProgressActivity.type).toBe(customActivity);
            expect(gs.gameInProgressActivity.url).toBe("test");
        });
        test("When invalid boolean set, return default value with error", () => {
            stubEmptyGameSettingsEnvs();
            vi.stubEnv("DEBUG_MODE", "invalid");
            let [gs, errs] = loadGameSettings();

            expect(errs.length).toBe(1);
            expect(gs.debug).toBe(DEFAULT_GAME_SETTINGS.debug);
        });
        test("When invalid integer set, return default value with error", () => {
            stubEmptyGameSettingsEnvs();
            vi.stubEnv("PIXELS_PER_METER", "invalid");
            let [gs, errs] = loadGameSettings();

            expect(errs.length).toBe(1);
            expect(gs.pixelsPerMeter).toBe(DEFAULT_GAME_SETTINGS.pixelsPerMeter);
        });
        test("When invalid float set, return default value with error", () => {
            stubEmptyGameSettingsEnvs();
            vi.stubEnv("HEATED_SLOWDOWN_RATE", "invalid");
            let [gs, errs] = loadGameSettings();

            expect(errs.length).toBe(1);
            expect(gs.heatedSlowdownRate).toBe(DEFAULT_GAME_SETTINGS.heatedSlowdownRate);
        });
        test("When staminaUseRate > 0, return default value with error", () => {
            stubEmptyGameSettingsEnvs();
            vi.stubEnv("STAMINA_USE_RATE", "1");
            let [gs, errs] = loadGameSettings();

            expect(errs.length).toBe(1);
            expect(gs.staminaUseRate).toBe(DEFAULT_GAME_SETTINGS.staminaUseRate);
            expect(errs[0]).toBe("Error: STAMINA_USE_RATE must be a negative number.");
        });
        test("When diceMin > diceMax, return default value with error", () => {
            stubEmptyGameSettingsEnvs();
            vi.stubEnv("DICE_MIN", "6");
            vi.stubEnv("DICE_MAX", "1");
            let [gs, errs] = loadGameSettings();

            expect(errs.length).toBe(1);
            expect(gs.diceMin).toBe(DEFAULT_GAME_SETTINGS.diceMin);
            expect(gs.diceMax).toBe(DEFAULT_GAME_SETTINGS.diceMax);
            expect(errs[0]).toBe("Error: DICE_MIN must be less than DICE_MAX.");
        });
        test("When invalid color code set, return default value with error", () => {
            stubEmptyGameSettingsEnvs();
            vi.stubEnv("EMBED_ACCENT_COLOR", "#FFFFFF");
            vi.stubEnv("STANDARD_MESSAGE_DISPLAY_ACCENT_COLOR", "#FFFFFF");
            vi.stubEnv("WARNING_MESSAGE_DISPLAY_ACCENT_COLOR", "#FFFFFF");
            vi.stubEnv("ALERT_MESSAGE_DISPLAY_ACCENT_COLOR", "#FFFFFF");
            let [gs, errs] = loadGameSettings();

            expect(errs.length).toBe(4);
            expect(gs.embedAccentColor).toBe(DEFAULT_GAME_SETTINGS.embedAccentColor);
            expect(gs.standardMessageDisplayAccentColor).toBe(DEFAULT_GAME_SETTINGS.standardMessageDisplayAccentColor);
            expect(gs.warningMessageDisplayAccentColor).toBe(DEFAULT_GAME_SETTINGS.warningMessageDisplayAccentColor);
            expect(gs.alertMessageDisplayAccentColor).toBe(DEFAULT_GAME_SETTINGS.alertMessageDisplayAccentColor);
        });
    });

    describe("loadPlayerDefaults tests", () => {
        test("When no environment variables set, load default player defaults", () => {
            stubEmptyPlayerDefaultsEnv();
            let [pd, errs] = loadPlayerDefaults();

            expect(errs.length).toBe(0);
            expect(pd.defaultPronouns).toBe(DEFAULT_PLAYER_DEFAULTS.defaultPronouns);
            expect(pd.defaultVoice).toBe(DEFAULT_PLAYER_DEFAULTS.defaultVoice);
            expect(pd.defaultStats).toStrictEqual(DEFAULT_PLAYER_DEFAULTS.defaultStats);
            expect(pd.defaultLocation).toBe(DEFAULT_PLAYER_DEFAULTS.defaultLocation);
            expect(pd.defaultStatusEffects).toBe(DEFAULT_PLAYER_DEFAULTS.defaultStatusEffects);
            expect(pd.defaultInventory).toBe(DEFAULT_PLAYER_DEFAULTS.defaultInventory);
            expect(pd.defaultDescription).toBe(DEFAULT_PLAYER_DEFAULTS.defaultDescription);
        });
        test("When environment variables set, load player defaults from environment variables", () => {
            stubPlayerDefaultsEnv();
            let [pd, errs] = loadPlayerDefaults();

            expect(errs.length).toBe(0);
            expect(pd.defaultPronouns).toBe("test");
            expect(pd.defaultVoice).toBe("test");
            expect(pd.defaultStats).toStrictEqual<Stats>({
                strength: 1,
                perception: 1,
                dexterity: 1,
                stamina: 1,
                speed: 1
            });
            expect(pd.defaultLocation).toBe("test");
            expect(pd.defaultStatusEffects).toBe("test");
            expect(pd.defaultInventory).toStrictEqual([
                ["test"]
            ]);
            expect(pd.defaultDescription).toBe("test");
        });
        test("If stat values are invalid, return default values with errors", () => {
            stubEmptyPlayerDefaultsEnv();
            vi.stubEnv("DEFAULT_STR", "11");
            vi.stubEnv("DEFAULT_PER", "-1");
            vi.stubEnv("DEFAULT_DEX", "0");
            vi.stubEnv("DEFAULT_STA", "100");
            vi.stubEnv("DEFAULT_SPD", "-100");
            let [pd, errs] = loadPlayerDefaults();

            expect(errs.length).toBe(5);
            expect(pd.defaultStats).toStrictEqual(DEFAULT_PLAYER_DEFAULTS.defaultStats);
        });
        test("If inventory is invalid JSON, return default values with errors", () => {
            stubEmptyPlayerDefaultsEnv();
            vi.stubEnv("DEFAULT_INVENTORY", "invalid");
            let [pd, errs] = loadPlayerDefaults();

            expect(errs.length).toBe(1);
            expect(pd.defaultInventory).toStrictEqual(DEFAULT_PLAYER_DEFAULTS.defaultInventory);
        });
    })

    function stubGameSettingsEnv() {
        vi.stubEnv("COMMAND_PREFIX", "!");
        vi.stubEnv("DEBUG_MODE", "true");
        vi.stubEnv("SPREADSHEET_ID", "69");
        vi.stubEnv("PIXELS_PER_METER", "20");
        vi.stubEnv("STAMINA_USE_RATE", "-0.02");
        vi.stubEnv("HEATED_SLOWDOWN_RATE", "0.1");
        vi.stubEnv("AUTOSAVE_INTERVAL", "10");
        vi.stubEnv("DICE_MIN", "2");
        vi.stubEnv("DICE_MAX", "20");
        vi.stubEnv("DEFAULT_DROP_FIXTURE", "test");
        vi.stubEnv("DEFAULT_ROOM_ICON_URL", "test");
        vi.stubEnv("DEFAULT_CONCEALED_ICON_URL", "test");
        vi.stubEnv("HIDDEN_ICON_URL", "test");
        vi.stubEnv("AUTO_DELETE_WHISPER_CHANNELS", "false");
        vi.stubEnv("EMBED_ACCENT_COLOR", "FFFFFF");
        vi.stubEnv("STANDARD_MESSAGE_DISPLAY_ACCENT_COLOR", "FFFFFF");
        vi.stubEnv("ALERT_MESSAGE_DISPLAY_ACCENT_COLOR", "FFFFFF");
        vi.stubEnv("SHOW_ONLINE_PLAYER_COUNT", "false");
        vi.stubEnv("AUTO_LOAD", "true");
        vi.stubEnv("ONLINE_ACTIVITY_STRING", "test");
        vi.stubEnv("ONLINE_ACTIVITY_TYPE", "CUSTOM");
        vi.stubEnv("DEBUG_MODE_ACTIVITY_STRING", "test");
        vi.stubEnv("DEBUG_MODE_ACTIVITY_TYPE", "CUSTOM");
        vi.stubEnv("GAME_IN_PROGRESS_ACTIVITY_STRING", "test");
        vi.stubEnv("GAME_IN_PROGRESS_ACTIVITY_TYPE", "CUSTOM");
        vi.stubEnv("GAME_IN_PROGRESS_ACTIVITY_URL", "test");
    }

    function stubEmptyGameSettingsEnvs() {
        vi.stubEnv("COMMAND_PREFIX", undefined);
        vi.stubEnv("DEBUG_MODE", undefined);
        vi.stubEnv("SPREADSHEET_ID", undefined);
        vi.stubEnv("PIXELS_PER_METER", undefined);
        vi.stubEnv("STAMINA_USE_RATE", undefined);
        vi.stubEnv("HEATED_SLOWDOWN_RATE", undefined);
        vi.stubEnv("AUTOSAVE_INTERVAL", undefined);
        vi.stubEnv("DICE_MIN", undefined);
        vi.stubEnv("DICE_MAX", undefined);
        vi.stubEnv("DEFAULT_DROP_OBJECT", undefined);
        vi.stubEnv("DEFAULT_ROOM_ICON_URL", undefined);
        vi.stubEnv("DEFAULT_CONCEALED_ICON_URL", undefined);
        vi.stubEnv("HIDDEN_ICON_URL", undefined);
        vi.stubEnv("AUTO_DELETE_WHISPER_CHANNELS", undefined);
        vi.stubEnv("EMBED_ACCENT_COLOR", undefined);
        vi.stubEnv("STANDARD_MESSAGE_DISPLAY_ACCENT_COLOR", undefined);
        vi.stubEnv("ALERT_MESSAGE_DISPLAY_ACCENT_COLOR", undefined);
        vi.stubEnv("SHOW_ONLINE_PLAYER_COUNT", undefined);
        vi.stubEnv("AUTO_LOAD", undefined);
        vi.stubEnv("ONLINE_ACTIVITY_STRING", undefined);
        vi.stubEnv("ONLINE_ACTIVITY_TYPE", undefined);
        vi.stubEnv("DEBUG_MODE_ACTIVITY_STRING", undefined);
        vi.stubEnv("DEUBG_MODE_ACTIVITY_TYPE", undefined);
        vi.stubEnv("GAME_IN_PROGRESS_ACTIVITY_STRING", undefined);
        vi.stubEnv("GAME_IN_PROGRESS_ACTIVITY_TYPE", undefined);
        vi.stubEnv("GAME_IN_PROGRESS_ACTIVITY_URL", undefined);
    }

    function stubEmptyPlayerDefaultsEnv() {
        vi.stubEnv("DEFAULT_PRONOUNS", undefined);
        vi.stubEnv("DEFAULT_VOICE", undefined);
        vi.stubEnv("DEFAULT_STR", undefined);
        vi.stubEnv("DEFAULT_PER", undefined);
        vi.stubEnv("DEFAULT_DEX", undefined);
        vi.stubEnv("DEFULAT_STA", undefined);
        vi.stubEnv("DEFAULT_SPD", undefined);
        vi.stubEnv("DEFAULT_LOCATION", undefined);
        vi.stubEnv("DEFAULT_STATUS_EFFECTS", undefined);
        vi.stubEnv("DEFAULT_INVENTORY", undefined);
        vi.stubEnv("DEFAULT_DESCRIPTION", undefined);
    }

    function stubPlayerDefaultsEnv() {
        vi.stubEnv("DEFAULT_PRONOUNS", "test");
        vi.stubEnv("DEFAULT_VOICE", "test");
        vi.stubEnv("DEFAULT_STR", "1");
        vi.stubEnv("DEFAULT_PER", "1");
        vi.stubEnv("DEFAULT_DEX", "1");
        vi.stubEnv("DEFAULT_STA", "1");
        vi.stubEnv("DEFAULT_SPD", "1");
        vi.stubEnv("DEFAULT_LOCATION", "test");
        vi.stubEnv("DEFAULT_STATUS_EFFECTS", "test");
        vi.stubEnv("DEFAULT_INVENTORY", "[[\"test\"]]");
        vi.stubEnv("DEFAULT_DESCRIPTION", "test");
    }
});
