// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { CommandConfig } from "../../../Classes/Command/Command.ts";
import { Multislot, Pattern } from "../../../Classes/Command/Pattern.ts";
import PlayerContext from "../../../Classes/Command/PlayerContext.ts";
import { ItemContainerToken, PrepositionToken } from "../../../Classes/Command/Token.ts";
import Trie from "../../../Classes/Command/Trie.ts";
import Exit from "../../../Data/Exit.ts";
import Fixture from "../../../Data/Fixture.ts";
import Gesture from "../../../Data/Gesture.ts";
import InventoryItem from "../../../Data/InventoryItem.ts";
import Player from "../../../Data/Player.ts";
import Puzzle from "../../../Data/Puzzle.ts";
import Room from "../../../Data/Room.ts";
import RoomItem from "../../../Data/RoomItem.ts";
import { clearQueue } from "../../../Modules/messageHandler.js";
import { createMockMessage } from "../../__mocks__/libs/discord.js";

/**
 * @privateRemarks
 * this is a little strange, but switching this to TRUE will print out some benchmarking times for GetLexicon() tests...
 * any suggestions for doing this in a less terrible way would be appreciated!
 * - AC
 */
const DEBUG = false;

describe("PlayerContext class from NG Commands", () => {
    beforeAll(async () => {
        if (!testGame.inProgress) await testGame.entityLoader.loadAll();
        commandConfig = {
            name: "not_real",
            description: "This command is not real",
            details: "This command is not real",
            usableBy: "Moderator",
            aliases: new Set(),
            requiresGame: false,
        };
    });

    beforeEach(async () => {
        kyra = testGame.entityFinder.getPlayer("Kyra");
    });

    afterEach(async () => {
        clearQueue(testGame);
        vi.resetAllMocks();
    });

    let kyra: Player;
    let commandConfig: CommandConfig<Set<string>>;

    describe("constructor()", () => {
        test("verify that stashedItems does not include top-level items", async () => {
            const context = new PlayerContext(testGame, kyra, "test", createMockMessage());
            const noStash: Set<InventoryItem> = new Set();
            const stash: Set<InventoryItem> = new Set();

            for (const item of context.heldItems) noStash.add(item);
            for (const item of context.equippedItems) noStash.add(item);
            for (const item of context.stashedItems) stash.add(item);

            for (const item of stash) expect(noStash.has(item)).toBeFalsy();
            for (const item of noStash) expect(stash.has(item)).toBeFalsy();
        });

        test("verify that stashedItems are not duplicated", async () => {
            const context = new PlayerContext(testGame, kyra, "test", createMockMessage());
            let stashCount = 0;
            const stash: Set<InventoryItem> = new Set();

            for (const item of context.stashedItems) {
                stash.add(item);
                stashCount += 1;
            }

            expect(stash.size).toStrictEqual(stashCount);
        });
    });

    describe("getLexicon()", () => {
        test("feed Kyra Context [Player,InventoryItem,RoomItem,Fixture,Puzzle,Room,Exit,Gesture] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [
                new Pattern([
                    new Multislot([Player, InventoryItem, RoomItem, Fixture, Puzzle, Room, Exit, Gesture], "multislot"),
                ]),
            ];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(303);
        });

        test("feed Kyra Context [Player] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [new Pattern([new Multislot([Player], "multislot")])];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(12);
        });

        test("feed Kyra Context [InventoryItem] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [new Pattern([new Multislot([InventoryItem], "multislot")])];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(27);
        });

        test("feed Kyra Context [RoomItem] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [new Pattern([new Multislot([RoomItem], "multislot")])];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(41);
        });

        test("feed Kyra Context [Fixture] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [new Pattern([new Multislot([Fixture], "multislot")])];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(30);
        });

        test("feed Kyra Context [Puzzle] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [new Pattern([new Multislot([Puzzle], "multislot")])];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(19);
        });

        test("feed Kyra Context [Room] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [new Pattern([new Multislot([Room], "multislot")])];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(4);
        });

        test("feed Kyra Context [Exit] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [new Pattern([new Multislot([Exit], "multislot")])];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(5);
        });

        test("feed Kyra Context [Gesture] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [new Pattern([new Multislot([Gesture], "multislot")])];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(199);
        });

        test("feed Kyra Context [] to Trie", async () => {
            const start = process.hrtime.bigint();
            const trie = new Trie();
            const trieInitConclude = process.hrtime.bigint();
            const message = createMockMessage();
            const mockInitConclude = process.hrtime.bigint();
            const context = new PlayerContext(testGame, kyra, "test", message);
            const contextInitConclude = process.hrtime.bigint();
            const patterns = [];
            const patternInitConclude = process.hrtime.bigint();
            const tokens = context.getLexicon(patterns, commandConfig);
            const getLexiconConclude = process.hrtime.bigint();
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            const trieLoadConclude = process.hrtime.bigint();
            if (DEBUG) {
                console.log(`full trie load from context took ${Number(trieLoadConclude - start) / 1000000}ms`);
                console.log(`  (excluding mock init: ${Number((trieLoadConclude - start) - (mockInitConclude - trieInitConclude)) / 1000000}ms)`);
                console.log(`  trie init took ${Number(trieInitConclude - start) / 1000000}ms`);
                console.log(`  mock message init took ${Number(mockInitConclude - trieInitConclude) / 1000000}ms`);
                console.log(`  context init took ${Number(contextInitConclude - mockInitConclude) / 1000000}ms`);
                console.log(`  pattern building took ${Number(patternInitConclude - contextInitConclude) / 1000000}ms`);
                console.log(`  lexicon building took ${Number(getLexiconConclude - patternInitConclude) / 1000000}ms`);
                console.log(`  trie loading took ${Number(trieLoadConclude - getLexiconConclude) / 1000000}ms`);
                console.log(`final trie size is ${trie.size()}`);
                console.log(testGame.clientContext.prettyPrinter.prettyString(trie));
            }
            expect(trie.size()).toBe(1);
        });
    });

    describe("lexicon usage tests", () => {
        test("kyra: (drop) coffee on floor", async () => {
            const trie = new Trie();
            {
                const context = new PlayerContext(testGame, kyra, "test", createMockMessage());
                const tokens = context.getLexicon(
                    [new Pattern([new Multislot([InventoryItem, Fixture], "multislot")])],
                    commandConfig,
                );
                for (const token of tokens) {
                    trie.insert(token.value, token);
                }
            }
            const streams = trie.tokenize(["coffee", "on", "floor"]);
            expect(streams.length).toBe(3);
            for (const stream of streams) {
                // this is a simple test, and will break if a second valid tokenization for "coffee" is ever introduced to the environment kyra resides within
                expect(stream.length).toBe(2);
            }
            // ItemContainerToken: should be COFFEE, with empty preposition string
            const coffee = streams[0][0] as ItemContainerToken<InventoryItem>;
            expect(coffee instanceof ItemContainerToken).toBeTruthy();
            expect(coffee.value).toBe("COFFEE");
            expect(coffee.preposition).toBe("");
            // PrepositionToken: should be "on"
            const preposition = streams[1][0] as PrepositionToken;
            expect(preposition instanceof PrepositionToken).toBeTruthy();
            expect(preposition.value).toBe("on");
            // ItemContainerToken: should be FLOOR, with preposition "on"
            const floor = streams[2][0] as ItemContainerToken<Fixture>;
            expect(floor instanceof ItemContainerToken).toBeTruthy();
            expect(floor.value).toBe("FLOOR");
            expect(floor.preposition).toBe("on");
        });
    });
});
