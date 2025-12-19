import { beforeAll, afterEach, vi, expect } from 'vitest';

import credentials from './__mocks__/configs/credentials.js';
import demodata from './__mocks__/configs/demodata.js';
import playerdefaults from './__mocks__/configs/playerdefaults.js';
import serverconfig from './__mocks__/configs/serverconfig.js';
import settings from './__mocks__/configs/settings.js';

import toBeWithinRange from './__extenders__/toBeWithinRange.js';
import toHaveSize from './__extenders__/toHaveSize.js';

import * as sheetsMock from './__mocks__/libs/sheets.js';
vi.mock('../Modules/sheets.js', () => sheetsMock);

import GuildContext from '../Classes/GuildContext.js';
import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import BotContext from '../Classes/BotContext.js';
import { Collection } from 'discord.js';


vi.mock('../Configs/credentials.json', () => ({ default: credentials }));
vi.mock('../Configs/demodata.json', () => ({ default: demodata }));
vi.mock('../Configs/playerdefaults.json', () => ({ default: playerdefaults }));
vi.mock('../Configs/serverconfig.json', () => ({ default: serverconfig }));
vi.mock('../Configs/settings.json', () => ({ default: settings }));

beforeAll(() => {
    // Create a minimal mocked Discord environment and initialize Game.
    /** @type {any} */
    const mockGuild = { id: 'test-guild' };
    /** @type {any} */ const commandChannel = { id: 'commandChannel' };
    /** @type {any} */ const logChannel = { id: 'logChannel' };
    /** @type {any} */ const announcementChannel = { id: 'announcementChannel' };
    /** @type {any} */ const testingChannel = { id: 'testingChannel' };
    /** @type {any} */ const generalChannel = { id: 'generalChannel' };
    /** @type {any} */ const testerRole = { id: 'testerRole' };
    /** @type {any} */ const eligibleRole = { id: 'eligibleRole' };
    /** @type {any} */ const playerRole = { id: 'playerRole' };
    /** @type {any} */ const freeMovementRole = { id: 'freeMovementRole' };
    /** @type {any} */ const moderatorRole = { id: 'moderatorRole' };
    /** @type {any} */ const deadRole = { id: 'deadRole' };
    /** @type {any} */ const spectatorRole = { id: 'spectatorRole' };

    const guildContext = new GuildContext(
        mockGuild,
        commandChannel,
        logChannel,
        announcementChannel,
        testingChannel,
        generalChannel,
        serverconfig.roomCategories.split(','),
        serverconfig.whisperCategory,
        serverconfig.spectateCategory,
        testerRole,
        eligibleRole,
        playerRole,
        freeMovementRole,
        moderatorRole,
        deadRole,
        spectatorRole
    );

    const onlineActivity = { name: settings.onlineActivity.string, type: BotContext.getActivityType(settings.onlineActivity.type) };
    const debugModeActivity = { name: settings.debugModeActivity.string, type: BotContext.getActivityType(settings.debugModeActivity.type) };
    const gameInProgressActivity = { name: settings.gameInProgressActivity.string, type: BotContext.getActivityType(settings.gameInProgressActivity.type), url: settings.gameInProgressActivity.url };

    const gameSettings = new GameSettings(
        settings.commandPrefix,
        settings.debug,
        settings.spreadsheetID,
        settings.pixelsPerMeter,
        settings.staminaUseRate,
        settings.heatedSlowdownRate,
        settings.autoSaveInterval,
        settings.diceMin,
        settings.diceMax,
        settings.defaultDropObject,
        settings.defaultRoomIconURL,
        settings.autoDeleteWhisperChannels,
        settings.embedColor,
        settings.showOnlinePlayerCount,
        settings.autoLoad,
        onlineActivity,
        debugModeActivity,
        gameInProgressActivity
    );

    // Initialize game and bot context with empty command collections.
    const game = new Game(guildContext, gameSettings);
    const botCommands = new Collection();
    const moderatorCommands = new Collection();
    const playerCommands = new Collection();
    const eligibleCommands = new Collection();

    // Minimal client stub that BotContext.updatePresence can call.
    /** @type {any} */
    const clientStub = {
        user: { username: 'alter-ego-testing', setPresence: () => { } },
        guilds: { cache: { size: 1, first: () => mockGuild } }
    };

    // Create BotContext singleton and attach to game.
    new BotContext(clientStub, botCommands, moderatorCommands, playerCommands, eligibleCommands, game);
    game.setBotContext();
    // Ensure presence update doesn't throw during tests.
    try { BotContext.instance.updatePresence(); } catch (e) { }
    globalThis.game = game;
});

afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
});

expect.extend({
    toBeWithinRange,
    toHaveSize
});