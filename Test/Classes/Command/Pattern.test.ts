// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InvalidInvocation, MatchedInvocation } from "../../../Classes/Command/Invocation.ts";
import { Constant, Glob, Multiconstant, Option, Pattern, Pocket, Preposition, Slot } from "../../../Classes/Command/Pattern.ts";
import { ConstantToken, EntityToken, ItemContainerToken, PocketToken, PrepositionToken } from "../../../Classes/Command/Token.ts";
import Trie from "../../../Classes/Command/Trie.ts";
import EquipmentSlot from "../../../Data/EquipmentSlot.ts";
import Event from "../../../Data/Event.ts";
import Exit from "../../../Data/Exit.ts";
import Fixture from "../../../Data/Fixture.ts";
import Flag from "../../../Data/Flag.ts";
import Gesture from "../../../Data/Gesture.ts";
import InventoryItem from "../../../Data/InventoryItem.ts";
import InventorySlot from "../../../Data/InventorySlot.ts";
import Player from "../../../Data/Player.ts";
import Prefab from "../../../Data/Prefab.ts";
import Puzzle from "../../../Data/Puzzle.ts";
import Room from "../../../Data/Room.ts";
import RoomItem from "../../../Data/RoomItem.ts";
import Status from "../../../Data/Status.ts";
import { clearQueue } from "../../../Modules/messageHandler.js";

describe("Pattern file from NG Commands", () => {
    beforeAll(async () => {
        if (!testGame.inProgress) await testGame.entityLoader.loadAll();
    });

    beforeEach(async () => {
        kyra = testGame.entityFinder.getPlayer("Kyra");
        playerToken = new EntityToken("Kyra", kyra);
        inventoryItemToken = new ItemContainerToken("COFFEE", kyra.inventory.get("RIGHT HAND").equippedItem);
        roomItemToken = new ItemContainerToken(
            "SIGN IN SHEET",
            testGame.entityFinder.getRoomItem("SIGN IN SHEET", "lobby"),
        );
        fixtureToken = new ItemContainerToken("FLOOR", testGame.entityFinder.getFixture("FLOOR", "lobby"));
        puzzleToken = new ItemContainerToken("SCALE", testGame.entityFinder.getPuzzle("SCALE", "fitness-room"));
        roomToken = new EntityToken("lobby", testGame.entityFinder.getRoom("lobby"));
        exitToken = new EntityToken(
            "REVOLVING DOOR 1",
            testGame.entityFinder.getExit(testGame.entityFinder.getRoom("lobby"), "REVOLVING DOOR 1"),
        );
        equipmentSlotToken = new EntityToken("RIGHT HAND", kyra.inventory.get("RIGHT HAND"));
        eventToken = new EntityToken("PROLOGUE", testGame.entityFinder.getEvent("PROLOGUE"));
        flagToken = new EntityToken("CHAPTER", testGame.entityFinder.getFlag("CHAPTER"));
        prefabToken = new EntityToken("PEN", testGame.entityFinder.getPrefab("PEN"));
        statusToken = new EntityToken("heated", testGame.entityFinder.getStatusEffect("heated"));
        gestureToken = new EntityToken("giggle", testGame.entityFinder.getGesture("giggle"))
    });

    afterEach(async () => {
        clearQueue(testGame);
        vi.resetAllMocks();
    });

    let kyra: Player;
    let playerToken: EntityToken<Player>;
    let inventoryItemToken: ItemContainerToken<InventoryItem>;
    let roomItemToken: ItemContainerToken<RoomItem>;
    let fixtureToken: ItemContainerToken<Fixture>;
    let puzzleToken: ItemContainerToken<Puzzle>;
    let roomToken: EntityToken<Room>;
    let exitToken: EntityToken<Exit>;
    let equipmentSlotToken: EntityToken<EquipmentSlot>;
    let eventToken: EntityToken<Event>;
    let flagToken: EntityToken<Flag>;
    let prefabToken: EntityToken<Prefab>;
    let statusToken: EntityToken<Status>;
    let gestureToken: EntityToken<Gesture>;

    describe("Slot class from NG Commands", () => {
        test("Slot.satisfiedBy(Player)", async () => {
            const slot = new Slot(Player, "Player");
            expect(slot.satisfiedBy(playerToken)).toBeTruthy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(InventoryItem)", async () => {
            const slot = new Slot(InventoryItem, "InventoryItem");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeTruthy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(RoomItem)", async () => {
            const slot = new Slot(RoomItem, "RoomItem");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeTruthy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(Fixture)", async () => {
            const slot = new Slot(Fixture, "Fixture");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeTruthy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(Puzzle)", async () => {
            const slot = new Slot(Puzzle, "Puzzle");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeTruthy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(Room)", async () => {
            const slot = new Slot(Room, "Room");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeTruthy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(Exit)", async () => {
            const slot = new Slot(Exit, "Exit");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeTruthy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(EquipmentSlot)", async () => {
            const slot = new Slot(EquipmentSlot, "EquipmentSlot");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeTruthy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(Event)", async () => {
            const slot = new Slot(Event, "Event");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeTruthy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(Flag)", async () => {
            const slot = new Slot(Flag, "Flag");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeTruthy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(Prefab)", async () => {
            const slot = new Slot(Prefab, "Prefab");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeTruthy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(Status)", async () => {
            const slot = new Slot(Status, "Status");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeTruthy();
            expect(slot.satisfiedBy(gestureToken)).toBeFalsy();
        });

        test("Slot.satisfiedBy(Gesture)", async () => {
            const slot = new Slot(Gesture, "Gesture");
            expect(slot.satisfiedBy(playerToken)).toBeFalsy();
            expect(slot.satisfiedBy(inventoryItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomItemToken)).toBeFalsy();
            expect(slot.satisfiedBy(fixtureToken)).toBeFalsy();
            expect(slot.satisfiedBy(puzzleToken)).toBeFalsy();
            expect(slot.satisfiedBy(roomToken)).toBeFalsy();
            expect(slot.satisfiedBy(exitToken)).toBeFalsy();
            expect(slot.satisfiedBy(equipmentSlotToken)).toBeFalsy();
            expect(slot.satisfiedBy(eventToken)).toBeFalsy();
            expect(slot.satisfiedBy(flagToken)).toBeFalsy();
            expect(slot.satisfiedBy(prefabToken)).toBeFalsy();
            expect(slot.satisfiedBy(statusToken)).toBeFalsy();
            expect(slot.satisfiedBy(gestureToken)).toBeTruthy();
        });
    });

    describe("Option class from NG Commands", () => {
        test("Option.satisfiedBy(1)", async () => {
            const option = new Option("test", ["one", "two", "three", "four"])
            expect(option.satisfiedBy(new ConstantToken("zero"))).toBeFalsy();
            expect(option.satisfiedBy(new ConstantToken("one"))).toBeTruthy();
            expect(option.satisfiedBy(new ConstantToken("two"))).toBeTruthy();
            expect(option.satisfiedBy(new ConstantToken("three"))).toBeTruthy();
            expect(option.satisfiedBy(new ConstantToken("four"))).toBeTruthy();
            expect(option.satisfiedBy(new ConstantToken("five"))).toBeFalsy();
        });
    });

    describe("Pattern class from NG Commands", () => {
        beforeEach(async () => {
            const prepositions: Set<string> = new Set();
            trie = new Trie();
            for (const player of testGame.players.values()) {
                trie.insert(player.displayName, new EntityToken(player.displayName, player));
            }
            for (const item of testGame.inventoryItems) {
                if (item.prefab !== null && item.quantity > 0) {
                    trie.insert(item.getIdentifier(), new ItemContainerToken(item.getIdentifier(), item));
                    for (const [key, val] of item.inventory)
                        trie.insert(key, new PocketToken(key, val, item));
                    if (!prepositions.has(item.getPreposition())) {
                        const preposition = item.getPreposition();
                        prepositions.add(preposition);
                        trie.insert(preposition, new PrepositionToken(preposition));
                    }
                }
            }
            for (const item of testGame.roomItems) {
                if (item.prefab !== null && item.quantity > 0) {
                    trie.insert(item.getIdentifier(), new ItemContainerToken(item.getIdentifier(), item));
                    for (const [key, val] of item.inventory)
                        trie.insert(key, new PocketToken(key, val, item));
                    if (!prepositions.has(item.getPreposition())) {
                        const preposition = item.getPreposition();
                        prepositions.add(preposition);
                        trie.insert(preposition, new PrepositionToken(preposition));
                    }
                }
            }
            for (const fixture of testGame.fixtures) {
                trie.insert(fixture.name, new ItemContainerToken(fixture.name, fixture));
                if (!prepositions.has(fixture.getPreposition())) {
                    const preposition = fixture.getPreposition();
                    prepositions.add(preposition);
                    trie.insert(preposition, new PrepositionToken(preposition));
                }
            }
            for (const puzzle of testGame.puzzles) {
                trie.insert(puzzle.name, new ItemContainerToken(puzzle.name, puzzle));
            }
            for (const player of testGame.players.values()) {
                for (const slot of player.inventory.values()) {
                    trie.insert(slot.id, new EntityToken(slot.id, slot));
                }
            }
            for (const room of testGame.rooms.values()) {
                trie.insert(room.id, new EntityToken(room.id, room));
            }
            for (const room of testGame.rooms.values()) {
                for (const exit of room.exits.values()) {
                    trie.insert(exit.name, new EntityToken(exit.name, exit));
                }
            }
            for (const event of testGame.events.values()) {
                trie.insert(event.id, new EntityToken(event.id, event));
            }
            for (const flag of testGame.flags.values()) {
                trie.insert(flag.id, new EntityToken(flag.id, flag));
            }
            for (const prefab of testGame.prefabs.values()) {
                trie.insert(prefab.id, new EntityToken(prefab.id, prefab));
            }
            for (const status of testGame.statusEffects.values()) {
                trie.insert(status.id, new EntityToken(status.id, status));
            }
            for (const gesture of testGame.gestures.values()) {
                trie.insert(gesture.id, new EntityToken(gesture.id, gesture));
            }
        });

        let trie: Trie;

        test("Pattern.match(1)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "item1"),
                new Constant("and"),
                new Slot(InventoryItem, "item2"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "and", "PACK", "OF", "TOILET", "PAPER", "2"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(2);
            expect(invocation.args.get("item1")).not.toBeUndefined();
            expect(invocation.args.get("item1").length).toBe(1);
            invocation.args.get("item1").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("item2")).not.toBeUndefined();
            expect(invocation.args.get("item2").length).toBe(1);
            invocation.args.get("item2").forEach((item: InventoryItem) => { 
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("PACK OF TOILET PAPER");
                expect(item.getIdentifier()).toBe("PACK OF TOILET PAPER 2");
            });
        });

        test("Pattern.match(2)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "item1"),
                new Constant("and"),
                new Slot(InventoryItem, "item2"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            const invocation = pattern.match(trie.tokenize(["MG", "F", "CFF", "and", "PACK", "OF", "TOILET", "PAPER", "2"]), testGame) as InvalidInvocation;
            expect(invocation).toBeInstanceOf(InvalidInvocation);
            expect(invocation.errors).toBeLength(1);
            expect(invocation.errors[0]).toBe("Couldn't find inventory item \"MG F CFF\" in your input.");
        });

        test("Pattern.match(3)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "target"),
                new Preposition("destination"),
                new Slot(Fixture, "destination"),
            ]);
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "on", "FLOOR"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(2);
            expect(invocation.args.get("target")).not.toBeUndefined();
            expect(invocation.args.get("target").length).toBe(1);
            invocation.args.get("target").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("destination")).not.toBeUndefined();
            // there are 189 floor fixtures within the test data
            // however, two lack a preposition, and are thus excluded
            expect(invocation.args.get("destination").length).toBe(187);
            invocation.args.get("destination").forEach((fixture: Fixture) => { 
                expect(fixture).toBeInstanceOf(Fixture);
                expect(fixture.name).toBe("FLOOR");
            });
        });

        test("Pattern.match(4)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "target"),
                new Preposition("destination"),
                new Slot(Fixture, "destination"),
            ]);
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "next", "to", "FLOOR"]), testGame) as InvalidInvocation;
            expect(invocation).toBeInstanceOf(InvalidInvocation);
            expect(invocation.errors).toBeLength(1);
            expect(invocation.errors[0]).toBe("Couldn't find a preposition for destination.");
        });

        test("Pattern.match(5)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "target"),
                new Preposition("destination"),
                new Slot(Fixture, "destination"),
            ]);
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "in", "FLOOR"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(2);
            expect(invocation.args.get("target")).not.toBeUndefined();
            expect(invocation.args.get("target").length).toBe(1);
            invocation.args.get("target").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("destination")).not.toBeUndefined();
            expect(invocation.args.get("destination").length).toBe(189);
            invocation.args.get("destination").forEach((fixture: Fixture) => { 
                expect(fixture).toBeInstanceOf(Fixture);
                expect(fixture.name).toBe("FLOOR");
            });
        });

        test("Pattern.match(6)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "target"),
                new Constant("in"),
                new Pocket("destination", "destination pocket"),
                new Constant("of"),
                new Slot(InventoryItem, "destination"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "in", "RIGHT", "POCKET", "of", "KYRAS", "LAB", "COAT", "1"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(3);
            expect(invocation.args.get("target")).not.toBeUndefined();
            expect(invocation.args.get("target").length).toBe(1);
            invocation.args.get("target").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("destination")).not.toBeUndefined();
            expect(invocation.args.get("destination").length).toBe(1);
            invocation.args.get("destination").forEach((item: InventoryItem) => { 
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("KYRAS LAB COAT");
                expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
            });
            expect(invocation.args.get("destination pocket")).not.toBeUndefined();
            expect(invocation.args.get("destination pocket").length).toBe(1); // there are 505 right pockets within the testing data, but we specifically want the right pocket of kyras lab coat 1
            invocation.args.get("destination pocket").forEach((pocket: InventorySlot<InventoryItem>) => { 
                expect(pocket).toBeInstanceOf(InventorySlot);
                expect(pocket.id).toBe("RIGHT POCKET");
            });
        });

        test("Pattern.match(7)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "target"),
                new Constant("with"),
                new Slot(Fixture, "destination"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "with"]), testGame) as InvalidInvocation;
            expect(invocation).toBeInstanceOf(InvalidInvocation);
            expect(invocation.errors).toBeLength(1);
            expect(invocation.errors[0]).toBe("Couldn't find anything for destination in your input.");
        });

        test("Pattern.match(8)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "target"),
                new Preposition("destination"),
                new Pattern([
                    new Pocket("destination", "destination pocket"),
                    new Constant("of")
                ], { optional: true, mandatory: true }),
                new Slot(InventoryItem, "destination"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "in", "RIGHT", "POCKET", "of", "KYRAS", "LAB", "COAT", "1"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(3);
            expect(invocation.args.get("target")).not.toBeUndefined();
            expect(invocation.args.get("target").length).toBe(1);
            invocation.args.get("target").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("destination")).not.toBeUndefined();
            expect(invocation.args.get("destination").length).toBe(1);
            invocation.args.get("destination").forEach((item: InventoryItem) => { 
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("KYRAS LAB COAT");
                expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
            });
            expect(invocation.args.get("destination pocket")).not.toBeUndefined();
            expect(invocation.args.get("destination pocket").length).toBe(1); // there are 505 right pockets within the testing data, but we specifically want the right pocket of kyras lab coat 1
            invocation.args.get("destination pocket").forEach((pocket: InventorySlot<InventoryItem>) => { 
                expect(pocket).toBeInstanceOf(InventorySlot);
                expect(pocket.id).toBe("RIGHT POCKET");
            });
        });

        test("Pattern.match(9)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "target"),
                new Preposition("destination"),
                new Pattern([
                    new Pocket("destination", "destination pocket"),
                    new Constant("of")
                ], { optional: true, mandatory: true }),
                new Slot(InventoryItem, "destination"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "in", "KYRAS", "LAB", "COAT", "1"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(2);
            expect(invocation.args.get("target")).not.toBeUndefined();
            expect(invocation.args.get("target").length).toBe(1);
            invocation.args.get("target").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("destination")).not.toBeUndefined();
            expect(invocation.args.get("destination").length).toBe(1);
            invocation.args.get("destination").forEach((item: InventoryItem) => { 
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("KYRAS LAB COAT");
                expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
            });
        });

        test("Pattern.match(10)", async () => {
            const pattern = new Pattern([
                new Slot(Player, "recipient"),
                new Glob(),
            ]);
            const invocation = pattern.match(trie.tokenize(["kyra", "Hello.\n\nI", "have", "overheard", "your", "conversation", "with", "Huiyu", "regarding", "your", "*very", "large", "rabbit*.\n\nPlease", "tell", "me", "more", "about", "the", "nature", "of", "this", "rabbit."]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(1);
            expect(invocation.args.get("recipient")).not.toBeUndefined();
            expect(invocation.args.get("recipient").length).toBe(1);
            invocation.args.get("recipient").forEach((player: Player) => {
                expect(player).toBeInstanceOf(Player);
                expect(player.name).toBe("Kyra");
            });
            expect(invocation.glob).toStrictEqual(["Hello.\n\nI", "have", "overheard", "your", "conversation", "with", "Huiyu", "regarding", "your", "*very", "large", "rabbit*.\n\nPlease", "tell", "me", "more", "about", "the", "nature", "of", "this", "rabbit."]);
        });

        test("Pattern.match(11)", async () => {
            const pattern = new Pattern([
                new Slot(Player, "recipient"),
                new Glob(),
            ]);
            const invocation = pattern.match(trie.tokenize(["kyra"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(1);
            expect(invocation.args.get("recipient")).not.toBeUndefined();
            expect(invocation.args.get("recipient").length).toBe(1);
            invocation.args.get("recipient").forEach((player: Player) => {
                expect(player).toBeInstanceOf(Player);
                expect(player.name).toBe("Kyra");
            });
            expect(invocation.glob).toStrictEqual([]);
        });

        test("Pattern.match(12)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "target"),
                new Preposition("destination"),
                new Pattern([
                    new Pocket("destination", "destination pocket"),
                    new Constant("of")
                ], { optional: true, mandatory: true }),
                new Slot(InventoryItem, "destination"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "in", "RIGHT", "POCKET", "KYRAS", "LAB", "COAT", "1"]), testGame) as InvalidInvocation;
            expect(invocation).toBeInstanceOf(InvalidInvocation);
            expect(invocation.errors).toBeLength(4);
            expect(invocation.errors[0]).toBe("Couldn't find a required \"of\" in your input, instead found KYRAS LAB COAT 1.");
            expect(invocation.errors[1]).toBe("Couldn't find anything for destination in your input.");
            expect(invocation.errors[2]).toBe("Found a preposition for destination, but no corresponding game object?");
            expect(invocation.errors[3]).toBe("Found a pocket for destination, but no corresponding game object?");
        });

        test("Pattern.match(13)", async () => {
            const pattern = new Pattern([
                new Glob(),
            ]);
            const invocation = pattern.match(trie.tokenize([]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(0);
            expect(invocation.glob).toStrictEqual([]);
        });

        test("Pattern.match(14)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "target"),
                new Preposition("destination"),
                new Pattern([
                    new Pocket("destination", "destination pocket"),
                    new Constant("of")
                ], { optional: true, mandatory: true }),
                new Slot(InventoryItem, "destination"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "IN", "RIGHT", "POCKET", "OF", "KYRAS", "LAB", "COAT", "1"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(3);
            expect(invocation.args.get("target")).not.toBeUndefined();
            expect(invocation.args.get("target").length).toBe(1);
            invocation.args.get("target").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("destination")).not.toBeUndefined();
            expect(invocation.args.get("destination").length).toBe(1);
            invocation.args.get("destination").forEach((item: InventoryItem) => { 
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("KYRAS LAB COAT");
                expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
            });
            expect(invocation.args.get("destination pocket")).not.toBeUndefined();
            expect(invocation.args.get("destination pocket").length).toBe(1);
            invocation.args.get("destination pocket").forEach((pocket: InventorySlot<InventoryItem>) => { 
                expect(pocket).toBeInstanceOf(InventorySlot);
                expect(pocket.id).toBe("RIGHT POCKET");
            });
        });

        test("Pattern.match(15)", async () => {
            const pattern = new Pattern([
                new Glob(),
            ]);
            const invocation = pattern.match(trie.tokenize([]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(0);
            expect(invocation.glob).toStrictEqual([]);
        });

        test("Pattern.match(16)", async () => {
            const pattern = new Pattern([
                new Glob(),
            ]);
            const invocation = pattern.match(trie.tokenize(["Hello", "world!"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(0);
            expect(invocation.glob).toStrictEqual(["Hello", "world!"]);
        });

        test("Pattern.match(17)", async () => {
            const pattern = new Pattern([
                new Glob(),
            ]);
            const invocation = pattern.match(trie.tokenize(["Hello?"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(0);
            expect(invocation.glob).toStrictEqual(["Hello?"]);
        });

        test("Pattern.match(18)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "item 1"),
                new Multiconstant(["and", "with"]),
                new Slot(InventoryItem, "item 2"),
            ]);
            const invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "attacks", "KYRAS", "LAB", "COAT", "1"]), testGame) as InvalidInvocation;
            expect(invocation).toBeInstanceOf(InvalidInvocation);
            expect(invocation.errors.length).toBe(1);
            expect(invocation.errors[0]).toBe("Couldn't find a required \"and/with\" in your input, instead found attacks KYRAS LAB COAT 1.")
        });

        test("Pattern.match(19)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "item 1"),
                new Multiconstant(["and", "with"]),
                new Slot(InventoryItem, "item 2"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            let invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "with", "KYRAS", "LAB", "COAT", "1"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(2);
            expect(invocation.args.get("item 1")).not.toBeUndefined();
            expect(invocation.args.get("item 1").length).toBe(1);
            invocation.args.get("item 1").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("item 2")).not.toBeUndefined();
            expect(invocation.args.get("item 2").length).toBe(1);
            invocation.args.get("item 2").forEach((item: InventoryItem) => { 
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("KYRAS LAB COAT");
                expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
            });
            invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "and", "KYRAS", "LAB", "COAT", "1"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(2);
            expect(invocation.args.get("item 1")).not.toBeUndefined();
            expect(invocation.args.get("item 1").length).toBe(1);
            invocation.args.get("item 1").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("item 2")).not.toBeUndefined();
            expect(invocation.args.get("item 2").length).toBe(1);
            invocation.args.get("item 2").forEach((item: InventoryItem) => { 
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("KYRAS LAB COAT");
                expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
            });
        });

        test("Pattern.match(20)", async () => {
            const pattern = new Pattern([
                new Slot(InventoryItem, "item 1"),
                new Option("article", ["and", "with"]),
                new Slot(InventoryItem, "item 2"),
            ]);
            for (const constant of pattern.constants)
                trie.insert(constant, new ConstantToken(constant));
            let invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "with", "KYRAS", "LAB", "COAT", "1"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(2);
            expect(invocation.args.get("item 1")).not.toBeUndefined();
            expect(invocation.args.get("item 1").length).toBe(1);
            invocation.args.get("item 1").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("item 2")).not.toBeUndefined();
            expect(invocation.args.get("item 2").length).toBe(1);
            invocation.args.get("item 2").forEach((item: InventoryItem) => { 
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("KYRAS LAB COAT");
                expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
            });
            expect(invocation.opts.size).toBe(1);
            expect(invocation.opts.get("article").size).toBe(1);
            expect(invocation.getOpt("article", "with")).toBeTruthy();
            expect(invocation.getOpt("article", "and")).toBeFalsy();
            invocation = pattern.match(trie.tokenize(["MUG", "OF", "COFFEE", "and", "KYRAS", "LAB", "COAT", "1"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(2);
            expect(invocation.args.get("item 1")).not.toBeUndefined();
            expect(invocation.args.get("item 1").length).toBe(1);
            invocation.args.get("item 1").forEach((item: InventoryItem) => {
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("MUG OF COFFEE");
            });
            expect(invocation.args.get("item 2")).not.toBeUndefined();
            expect(invocation.args.get("item 2").length).toBe(1);
            invocation.args.get("item 2").forEach((item: InventoryItem) => { 
                expect(item).toBeInstanceOf(InventoryItem);
                expect(item.prefabId).toBe("KYRAS LAB COAT");
                expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
            });
            expect(invocation.opts.size).toBe(1);
            expect(invocation.opts.get("article").size).toBe(1);
            expect(invocation.getOpt("article", "with")).toBeFalsy();
            expect(invocation.getOpt("article", "and")).toBeTruthy();
        });

        test("Pattern.match(21)", async () => {
            const pattern = new Pattern([]);
            let invocation = pattern.match(trie.tokenize([]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(0);
            expect(invocation.opts.size).toBe(0);
            expect(invocation.glob.length).toBe(0);
        });

        test("Pattern.match(22)", async () => {
            const pattern = new Pattern([
                new Pattern([
                    new Slot(Player, "recipient")
                ], { repeatable: true }),
                new Glob(),
            ]);
            const invocation = pattern.match(trie.tokenize(["kyra", "VIVIAN", "Astrid", "Hello", "everyone!"]), testGame) as MatchedInvocation;
            expect(invocation).toBeInstanceOf(MatchedInvocation);
            expect(invocation.args.size).toBe(1);
            const recipients = invocation.getPlayers("recipient");
            const playerList = new Set([testGame.entityFinder.getPlayer("Kyra"), testGame.entityFinder.getPlayer("Vivian"), testGame.entityFinder.getPlayer("Astrid")]);
            for (const recipient of recipients) {
                expect(recipient).toBeOneOf(playerList);
                playerList.delete(recipient);
            }
            expect(invocation.glob).toStrictEqual(["Hello", "everyone!"]);
        });
    });
});
