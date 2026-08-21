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
import { bench } from "../../benchmark.ts";

/**
 * @privateRemarks
 * this is a little strange, but switching this to TRUE will print out some benchmarking times for GetLexicon() tests...
 * any suggestions for doing this in a less terrible way would be appreciated!
 * - AC
 */
const DEBUG = false;

/** Number of iterations used for benchmarking. Lowered to avoid OOM crashes. */
const BENCH_ITERATIONS = 100;

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
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [
                    new Pattern([
                        new Multislot(
                            [Player, InventoryItem, RoomItem, Fixture, Puzzle, Room, Exit, Gesture],
                            "multislot",
                        ),
                    ]),
                ],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
            }
            expect(trie.size()).toBe(303);
        });

        test("feed Kyra Context [Player] to Trie", async () => {
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [new Pattern([new Multislot([Player], "multislot")])],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
            }
            expect(trie.size()).toBe(12);
        });

        test("feed Kyra Context [InventoryItem] to Trie", async () => {
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [new Pattern([new Multislot([InventoryItem], "multislot")])],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
            }
            expect(trie.size()).toBe(27);
        });

        test("feed Kyra Context [RoomItem] to Trie", async () => {
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [new Pattern([new Multislot([RoomItem], "multislot")])],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
            }
            expect(trie.size()).toBe(41);
        });

        test("feed Kyra Context [Fixture] to Trie", async () => {
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [new Pattern([new Multislot([Fixture], "multislot")])],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
            }
            expect(trie.size()).toBe(30);
        });

        test("feed Kyra Context [Puzzle] to Trie", async () => {
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [new Pattern([new Multislot([Puzzle], "multislot")])],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
            }
            expect(trie.size()).toBe(19);
        });

        test("feed Kyra Context [Room] to Trie", async () => {
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [new Pattern([new Multislot([Room], "multislot")])],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
            }
            expect(trie.size()).toBe(4);
        });

        test("feed Kyra Context [Exit] to Trie", async () => {
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [new Pattern([new Multislot([Exit], "multislot")])],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
            }
            expect(trie.size()).toBe(5);
        });

        test("feed Kyra Context [Gesture] to Trie", async () => {
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [new Pattern([new Multislot([Gesture], "multislot")])],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
            }
            expect(trie.size()).toBe(199);
        });

        test("feed Kyra Context [] to Trie", async () => {
            const [trie, trieInit] = bench({
                function: () => new Trie(),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [message, messageInit] = bench({
                function: createMockMessage,
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [context, contextInit] = bench({
                function: () => new PlayerContext(testGame, kyra, "test", message),
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [patterns, patternsInit] = bench({
                function: () => [],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [tokens, getLexicon] = bench({
                function: context.getLexicon,
                context: context,
                args: [patterns, commandConfig],
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            const [_, trieLoad] = bench({
                function: () => {
                    const t = new Trie();
                    for (const token of tokens) {
                        t.insert(token.value, token);
                    }
                },
                shortcircuit: !DEBUG,
                iterations: BENCH_ITERATIONS,
            });
            for (const token of tokens) {
                trie.insert(token.value, token);
            }
            if (DEBUG) {
                console.log(
                    `full trie load from context took ${Number(trieInit + messageInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs`,
                );
                console.log(
                    `  (excluding mock init: ${Number(trieInit + contextInit + patternsInit + getLexicon + (trieLoad - trieInit)) / 1000}μs)`,
                );
                console.log(`  trie init took ${Number(trieInit) / 1000}μs`);
                console.log(`  mock message init took ${Number(messageInit) / 1000}μs`);
                console.log(`  context init took ${Number(contextInit) / 1000}μs`);
                console.log(`  pattern building took ${Number(patternsInit) / 1000}μs`);
                console.log(`  lexicon building took ${Number(getLexicon) / 1000}μs`);
                console.log(`  trie loading took ${Number(trieLoad - trieInit) / 1000}μs`);
                console.log(`final trie size is ${trie.size()}`);
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
            const coffee = streams[0][0];
            expect.assert.instanceOf(coffee, ItemContainerToken);
            expect(coffee.value).toBe("COFFEE");
            expect(coffee.preposition).toBe("");
            // PrepositionToken: should be "on"
            const preposition = streams[1][0];
            expect.assert.instanceOf(preposition, PrepositionToken);
            expect(preposition.value).toBe("on");
            // ItemContainerToken: should be FLOOR, with preposition "on"
            const floor = streams[2][0];
            expect.assert.instanceOf(floor, ItemContainerToken);
            expect(floor.value).toBe("FLOOR");
            expect(floor.preposition).toBe("on");
        });
    });
});
