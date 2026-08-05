// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
    ConstantToken,
    EntityToken,
    ItemContainerToken,
    PrepositionToken,
    SentinelToken,
} from "../../../Classes/Command/Token.ts";
import Trie from "../../../Classes/Command/Trie.ts";
import { clearQueue } from "../../../Modules/messageHandler.js";
import { bench } from "../../benchmark.ts";

/**
 * @privateRemarks
 * this is a little strange, but switching this to TRUE will print out some benchmarking times for certain tests...
 * any suggestions for doing this in a less terrible way would be appreciated!
 * - AC
 */
const DEBUG = true;

/** Number of iterations used for the heavy full‑load benchmark – keep it low to avoid OOM. */
const LOAD_ITERATIONS = 100;
/** Number of iterations for lightweight lookup benchmarks. */
const LOOKUP_ITERATIONS = 100;

describe("Trie class from NG Commands", () => {
    beforeAll(async () => {
        if (!testGame.inProgress) await testGame.entityLoader.loadAll();
    });

    beforeEach(async () => {
        trie = new Trie();
    });

    afterEach(async () => {
        clearQueue(testGame);
        vi.resetAllMocks();
    });

    let trie: Trie;

    describe("data loading", () => {
        test("1", async () => {
            const data = "Last one in is a **{rotten egg}!**";
            trie.insert(data, new ConstantToken(data));
            expect(trie.size()).toBe(8); // 7 words + root node
        });
        test("2", async () => {
            const data1 = "The quick brown fox";
            const data2 = "The lazy dog";
            trie.insert(data1, new ConstantToken(data1));
            trie.insert(data2, new ConstantToken(data2));
            expect(trie.size()).toBe(7); // root node + shared "the" node + 3 words + 2 words
            expect(trie.root.children.get("the").children.size).toBe(2); // two descending nodes from "the"
        });
    });

    describe("input tokenization", () => {
        beforeEach(async () => {
            const data: string[] = ["Last one in is a **{rotten egg}!**"];
            for (const line of data) {
                trie.insert(line, new ConstantToken(line));
            }
        });
        test("1", async () => {
            const stream = trie.tokenize(["Last", "one", "in", "is", "a", "**{rotten", "egg}!**"]);
            expect(stream[0][0] instanceof ConstantToken).toBeTruthy();
            expect(stream[0][0].value).toBe("Last one in is a **{rotten egg}!**");
        });
        test("2", async () => {
            const stream = trie.tokenize(["Last", "one", "in", "is", "a", "rotten", "egg!"]);
            expect(stream[0][0] instanceof SentinelToken).toBeTruthy();
            expect(stream[0][0].value).toBe("Last");
            expect(stream[1][0] instanceof SentinelToken).toBeTruthy();
            expect(stream[1][0].value).toBe("one");
            expect(stream[2][0] instanceof SentinelToken).toBeTruthy();
            expect(stream[2][0].value).toBe("in");
            expect(stream[3][0] instanceof SentinelToken).toBeTruthy();
            expect(stream[3][0].value).toBe("is");
            expect(stream[4][0] instanceof SentinelToken).toBeTruthy();
            expect(stream[4][0].value).toBe("a");
            expect(stream[5][0] instanceof SentinelToken).toBeTruthy();
            expect(stream[5][0].value).toBe("rotten");
            expect(stream[6][0] instanceof SentinelToken).toBeTruthy();
            expect(stream[6][0].value).toBe("egg!");
        });
    });

    describe("benchmarking", () => {
        test("load all loadable game data into trie and perform lookups", async () => {
            // ------------------------------------------------------------
            // 1. Benchmark the full trie loading process
            // ------------------------------------------------------------
            const [loadedTrie, totalLoadTime] = bench({
                function: () => {
                    const t = new Trie();
                    const prepositions = new Set<string>();

                    // Players
                    for (const player of testGame.players.values()) {
                        t.insert(player.displayName, new EntityToken(player.displayName, player));
                    }

                    // Inventory items
                    for (const item of testGame.inventoryItems) {
                        if (item.prefab !== null && item.quantity > 0) {
                            t.insert(item.prefab.id, new ItemContainerToken(item.prefab.id, item));
                            if (!prepositions.has(item.getPreposition())) {
                                const preposition = item.getPreposition();
                                prepositions.add(preposition);
                                t.insert(preposition, new PrepositionToken(preposition));
                            }
                        }
                    }

                    // Room items
                    for (const item of testGame.roomItems) {
                        if (item.prefab !== null && item.quantity > 0) {
                            t.insert(item.prefab.id, new ItemContainerToken(item.prefab.id, item));
                            if (!prepositions.has(item.getPreposition())) {
                                const preposition = item.getPreposition();
                                prepositions.add(preposition);
                                t.insert(preposition, new PrepositionToken(preposition));
                            }
                        }
                    }

                    // Fixtures
                    for (const fixture of testGame.fixtures) {
                        t.insert(fixture.name, new ItemContainerToken(fixture.name, fixture));
                        if (!prepositions.has(fixture.getPreposition())) {
                            const preposition = fixture.getPreposition();
                            prepositions.add(preposition);
                            t.insert(preposition, new PrepositionToken(preposition));
                        }
                    }

                    // Puzzles
                    for (const puzzle of testGame.puzzles) {
                        t.insert(puzzle.name, new ItemContainerToken(puzzle.name, puzzle));
                    }

                    // Equipment slots
                    for (const player of testGame.players.values()) {
                        for (const slot of player.inventory.values()) {
                            t.insert(slot.id, new EntityToken(slot.id, slot));
                        }
                    }

                    // Rooms
                    for (const room of testGame.rooms.values()) {
                        t.insert(room.id, new EntityToken(room.id, room));
                    }

                    // Exits
                    for (const room of testGame.rooms.values()) {
                        for (const exit of room.exits.values()) {
                            t.insert(exit.name, new EntityToken(exit.name, exit));
                        }
                    }

                    // Events
                    for (const event of testGame.events.values()) {
                        t.insert(event.id, new EntityToken(event.id, event));
                    }

                    // Flags
                    for (const flag of testGame.flags.values()) {
                        t.insert(flag.id, new EntityToken(flag.id, flag));
                    }

                    // Prefabs
                    for (const prefab of testGame.prefabs.values()) {
                        t.insert(prefab.id, new EntityToken(prefab.id, prefab));
                    }

                    // Status effects
                    for (const status of testGame.statusEffects.values()) {
                        t.insert(status.id, new EntityToken(status.id, status));
                    }

                    return t;
                },
                iterations: LOAD_ITERATIONS,
                shortcircuit: !DEBUG,
            });

            if (DEBUG) {
                console.log(`full trie load took ${Number(totalLoadTime) / 1000}μs`);
                console.log(`final trie size is ${loadedTrie.size()}`);
            }

            // ------------------------------------------------------------
            // 2. Benchmark individual lookups
            // ------------------------------------------------------------
            const lookupAmadeus = (t: Trie) => t.tokenize(["amadeus"]);
            const lookupPot = (t: Trie) => t.tokenize(["pot"]);
            const lookupFilledPot = (t: Trie) => t.tokenize(["pot", "filled", "with", "water"]);
            const lookupComplex = (t: Trie) =>
                t.tokenize(["drop", "pot", "filled", "with", "water", "on", "reception", "desk"]);

            const [amaResult, amaTime] = bench({
                function: lookupAmadeus,
                args: [loadedTrie],
                iterations: LOOKUP_ITERATIONS,
                shortcircuit: !DEBUG,
            });
            const [potResult, potTime] = bench({
                function: lookupPot,
                args: [loadedTrie],
                iterations: LOOKUP_ITERATIONS,
                shortcircuit: !DEBUG,
            });
            const [filledPotResult, filledPotTime] = bench({
                function: lookupFilledPot,
                args: [loadedTrie],
                iterations: LOOKUP_ITERATIONS,
                shortcircuit: !DEBUG,
            });
            const [complexResult, complexTime] = bench({
                function: lookupComplex,
                args: [loadedTrie],
                iterations: LOOKUP_ITERATIONS,
                shortcircuit: !DEBUG,
            });

            if (DEBUG) {
                const totalLookupTime = amaTime + potTime + filledPotTime + complexTime;
                console.log(`all lookups took ${Number(totalLookupTime) / 1000}μs`);
                console.log(`  amadeus lookup took ${Number(amaTime) / 1000}μs`);
                console.log(`  pot lookup took ${Number(potTime) / 1000}μs`);
                console.log(`  filled pot lookup took ${Number(filledPotTime) / 1000}μs`);
                console.log(`  complex lookup took ${Number(complexTime) / 1000}μs`);
                console.log(amaResult);
                console.log(potResult);
                console.log(filledPotResult);
                console.log(complexResult);
            }
        });
    });
});
