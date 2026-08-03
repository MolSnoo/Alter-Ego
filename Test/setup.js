import { beforeAll, afterEach, vi, expect } from 'vitest';
import { plugins } from '@vitest/pretty-format';

import demodata from './__mocks__/configs/demodata.js';
import serverconfig from './__mocks__/configs/serverconfig.js';

import toBeWithinRange from './__extenders__/toBeWithinRange.ts';
import toBeLength from './__extenders__/toBeLength.ts';
import toHaveSize from './__extenders__/toHaveSize.ts';
import toBeInvokedWith from './__extenders__/toBeInvokedWith.ts';
import toBeWebhookMessage from './__extenders__/toBeWebhookMessage.ts';
import toBeMessageWith from './__extenders__/toBeMessageWith.ts';

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

/** @import BotCommand from '../Classes/BotCommand.ts' */
/** @import ModeratorCommand from '../Classes/ModeratorCommand.ts' */
/** @import PlayerCommand from '../Classes/PlayerCommand.ts' */
/** @import EligibleCommand from '../Classes/EligibleCommand.ts' */

import GuildContext from '../Classes/GuildContext.ts';
import Game from '../Data/Game.ts';
import BotContext from '../Classes/BotContext.ts';
import { ChannelType, Collection } from 'discord.js';
import {DEFAULT_GAME_SETTINGS} from "../Modules/settingsLoader.ts";

vi.mock('../Configs/demodata.json', () => ({ default: demodata }));
vi.mock('../Configs/serverconfig.json', () => ({ default: serverconfig }));

beforeAll(() => {
    /** @type {any} */ const client = discordMock.createMockClient();

    // Create a minimal mocked Discord environment and initialize Game.
    /** @type {any[]} */
    let channels = [];
    /** @type {any} */ const commandChannel = discordMock.createMockChannel(serverconfig.commandChannel, 'bot-commands', ChannelType.GuildText, undefined, undefined, client);
    /** @type {any} */ const logChannel = discordMock.createMockChannel(serverconfig.logChannel, 'bot-log', ChannelType.GuildText, undefined, undefined, client);
    /** @type {any} */ const announcementChannel = discordMock.createMockChannel(serverconfig.announcementChannel, 'announcements', ChannelType.GuildText, undefined, undefined, client);
    /** @type {any} */ const testingChannel = discordMock.createMockChannel(serverconfig.testingChannel, 'testing', ChannelType.GuildText, undefined, undefined, client);
    /** @type {any} */ const generalChannel = discordMock.createMockChannel(serverconfig.generalChannel, 'general', ChannelType.GuildText, undefined, undefined, client);
    /** @type {any} */ const whisperCategory = discordMock.createMockChannel(serverconfig.whisperCategory, 'Whispers', ChannelType.GuildCategory, undefined, undefined, client);
    /** @type {any} */ const spectateCategory = discordMock.createMockChannel(serverconfig.spectateCategory, 'Spectate', ChannelType.GuildCategory, undefined, undefined, client);
    channels.push(commandChannel, logChannel, announcementChannel, testingChannel, generalChannel, whisperCategory, spectateCategory);
    /** @type {any[]} */ const roomCategoryIds = serverconfig.roomCategories.split(',');
    for (const roomCategoryId of roomCategoryIds)
        channels.push(discordMock.createMockChannel(roomCategoryId, 'Rooms', ChannelType.GuildCategory, undefined, undefined, client));

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

    const memberIds = ["665168062697177107", "621550382253998081", "778157117936107520", "621554507041734656", "656377156934434818", "849256035867820072", "822180788288094238", "578764435766640640", "430830419793936394"];
    /** @type {any[]} */
    let members = [];
    for (const memberId of memberIds) {
        const member = discordMock.createMockMember(memberId);
        member.roles.add(playerRole);
        if (memberId === "430830419793936394") member.roles.add(freeMovementRole);
        members.push(member);
    }
    const moderator = discordMock.createMockMember("775841429641232417", "Narrator");
    moderator.roles.add(moderatorRole);
    members.push(moderator);

    /** @type {any} */
    const mockGuild = discordMock.createMockGuild(channels, roles, members, client);

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

    // Initialize game and bot context with empty command collections.
    const game = new Game(guildContext, DEFAULT_GAME_SETTINGS);
    /** @type {Collection<string, BotCommand>} */
    const botCommands = new Collection();
    /** @type {Collection<string, ModeratorCommand>} */
    const moderatorCommands = new Collection();
    /** @type {Collection<string, PlayerCommand>} */
    const playerCommands = new Collection();
    /** @type {Collection<string, EligibleCommand>} */
    const eligibleCommands = new Collection();

    // Create BotContext singleton and attach to game.
    BotContext.Instance(client, botCommands, moderatorCommands, playerCommands, eligibleCommands, game);
    game.setBotContext();
    // Ensure presence update doesn't throw during tests.
    try { BotContext.instance.updatePresence(); } catch (e) { }
    globalThis.game = game;
    game.messageQueue.manual = true;
});

afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
});

expect.extend({
    toBeWithinRange,
    toBeLength,
    toHaveSize,
    toBeInvokedWith,
    toBeWebhookMessage,
    toBeMessageWith
});

import { PolyPlugin } from "../Classes/PrettyPrinter.ts";
const polyPlugin = new PolyPlugin()

plugins.DOMElement.test = polyPlugin.test;
plugins.DOMElement.serialize = /** @type {typeof plugins.DOMElement.serialize} */ (polyPlugin.serialize);
plugins.DOMCollection.test = () => false;
plugins.DOMCollection.serialize = () => "";
plugins.ReactElement.test = () => false;
plugins.ReactElement.serialize = () => "";
plugins.ReactTestComponent.test = () => false;
plugins.ReactTestComponent.serialize = () => "";
