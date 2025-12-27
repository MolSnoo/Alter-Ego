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
import * as discordMock from './__mocks__/libs/discord.js';
vi.mock(import('discord.js'), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        discordMock
    }
    
});

import GuildContext from '../Classes/GuildContext.js';
import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import BotContext from '../Classes/BotContext.js';
import { ChannelType, Collection } from 'discord.js';

vi.mock('../Configs/credentials.json', () => ({ default: credentials }));
vi.mock('../Configs/demodata.json', () => ({ default: demodata }));
vi.mock('../Configs/playerdefaults.json', () => ({ default: playerdefaults }));
vi.mock('../Configs/serverconfig.json', () => ({ default: serverconfig }));
vi.mock('../Configs/settings.json', () => ({ default: settings }));

beforeAll(() => {
    // Create a minimal mocked Discord environment and initialize Game.
    /** @type {any[]} */
    let channels = [];
    /** @type {any} */ const commandChannel = discordMock.createMockChannel(serverconfig.commandChannel, 'bot-commands', ChannelType.GuildText);
    /** @type {any} */ const logChannel = discordMock.createMockChannel(serverconfig.logChannel, 'bot-log', ChannelType.GuildText);
    /** @type {any} */ const announcementChannel = discordMock.createMockChannel(serverconfig.announcementChannel, 'announcements', ChannelType.GuildText);
    /** @type {any} */ const testingChannel = discordMock.createMockChannel(serverconfig.testingChannel, 'testing', ChannelType.GuildText);
    /** @type {any} */ const generalChannel = discordMock.createMockChannel(serverconfig.generalChannel, 'general', ChannelType.GuildText);
    /** @type {any} */ const whisperCategory = discordMock.createMockChannel(serverconfig.whisperCategory, 'Whispers', ChannelType.GuildCategory);
    /** @type {any} */ const spectateCategory = discordMock.createMockChannel(serverconfig.spectateCategory, 'Spectate', ChannelType.GuildCategory);
    channels.push(commandChannel, logChannel, announcementChannel, testingChannel, generalChannel, whisperCategory, spectateCategory);
    /** @type {any[]} */ const roomCategoryIds = serverconfig.roomCategories.split(',');
    for (const roomCategoryId of roomCategoryIds)
        channels.push(discordMock.createMockChannel(roomCategoryId, 'Rooms', ChannelType.GuildCategory));

    /** @type {any[]} */
    let roles = [];
    /** @type {any} */ const testerRole = discordMock.createMockRole(serverconfig.testerRole, 'Tester');
    /** @type {any} */ const eligibleRole = discordMock.createMockRole(serverconfig.eligibleRole, 'Eligible');
    /** @type {any} */ const playerRole = discordMock.createMockRole(serverconfig.playerRole, 'Player');
    /** @type {any} */ const freeMovementRole = discordMock.createMockRole(serverconfig.headmasterRole, 'Free Movement');
    /** @type {any} */ const moderatorRole = discordMock.createMockRole(serverconfig.moderatorRole, 'Moderator');
    /** @type {any} */ const deadRole = discordMock.createMockRole(serverconfig.deadRole, 'Dead');
    /** @type {any} */ const spectatorRole = discordMock.createMockRole(serverconfig.spectatorRole, 'Spectator');
    roles.push(testerRole, eligibleRole, playerRole, freeMovementRole, moderatorRole, deadRole, spectatorRole);

    const memberIds = ["665168062697177107", "621550382253998081", "778157117936107520", "578764435766640640", "656377156934434818", "430830419793936394"];
    /** @type {any[]} */
    let members = [];
    for (const memberId of memberIds)
        members.push(discordMock.createMockMember(memberId));

    /** @type {any} */
    const mockGuild = discordMock.createMockGuild(channels, roles, members);

    const guildContext = new GuildContext(
        mockGuild,
        commandChannel,
        logChannel,
        announcementChannel,
        testingChannel,
        generalChannel,
        roomCategoryIds,
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

    /** @type {any} */ const client = discordMock.createMockClient();

    // Create BotContext singleton and attach to game.
    new BotContext(client, botCommands, moderatorCommands, playerCommands, eligibleCommands, game);
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