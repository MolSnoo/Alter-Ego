// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import BotContext from "../../../Classes/Command/BotContext.ts";
import type { CommandConfig } from "../../../Classes/Command/Command.ts";
import { InvalidInvocation, MatchedInvocation } from "../../../Classes/Command/Invocation.ts";
import { Constant, Glob, Multiconstant, Multislot, Option, Pattern, Pocket, Preposition, Slot } from "../../../Classes/Command/Pattern.ts";
import { ConstantToken, EntityToken, ItemContainerToken, PocketToken, PrepositionToken } from "../../../Classes/Command/Token.ts";
import Trie from "../../../Classes/Command/Trie.ts";
import EquipmentSlot from "../../../Data/EquipmentSlot.ts";
import Event from "../../../Data/Event.ts";
import Exit from "../../../Data/Exit.ts";
import Fixture from "../../../Data/Fixture.ts";
import Flag from "../../../Data/Flag.ts";
import type Game from "../../../Data/Game.ts";
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
import { bench } from "../../benchmark.ts";

/**
 * @privateRemarks
 * this is a little strange, but switching this to TRUE will print out some benchmarking times for tokenization and pattern matching...
 * any suggestions for doing this in a less terrible way would be appreciated!
 * - AC
 */
const DEBUG = false;

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
        describe("BotContext-style multi-patterns (destroy_bot)", () => {
            /**
             * @privateRemarks
             * This test is incomplete, and should also verify the IDs and names of returned arguments...
             * - AC
             */

            const patterns = [
                new Pattern([
                    new Slot(RoomItem, "target"),
                    new Constant("at"),
                    new Slot(Room, "destination")
                ]),
                new Pattern([
                    new Slot(RoomItem, "target"),
                    new Preposition("intermediate"),
                    new Multislot([Fixture, RoomItem], "intermediate"),
                    new Constant("at"),
                    new Slot(Room, "destination")
                ]),
                new Pattern([
                    new Slot(RoomItem, "target"),
                    new Constant("in"),
                    new Pocket("intermediate", "pocket"),
                    new Constant("of"),
                    new Slot(RoomItem, "intermediate"),
                    new Constant("at"),
                    new Slot(Room, "destination")
                ]),
                new Pattern([
                    new Option("target", ["all"]),
                    new Preposition("intermediate"),
                    new Multislot([Fixture, RoomItem], "intermediate"),
                    new Constant("at"),
                    new Slot(Room, "destination")
                ]),
                new Pattern([
                    new Option("callee", ["player"]),
                    new Slot(InventoryItem, "target")
                ]),
                new Pattern([
                    new Option("target", ["all"]),
                    new Slot(EquipmentSlot, "target")
                ]),
                new Pattern([
                    new Option("callee", ["room"]),
                    new Slot(RoomItem, "target")
                ]),
                new Pattern([
                    new Slot(Player, "player"),
                    new Slot(InventoryItem, "target"),
                    new Preposition("intermediate"),
                    new Slot(InventoryItem, "intermediate")
                ]),
                new Pattern([
                    new Slot(InventoryItem, "target"),
                    new Constant("in"),
                    new Slot(Player, "player"),
                    new Pocket("destination", "pocket"),
                    new Constant("of"),
                    new Slot(InventoryItem, "destination")
                ]),
                new Pattern([
                    new Option("target", ["all"]),
                    new Preposition("destination"),
                    new Slot(Player, "player"),
                    new Slot(InventoryItem, "destination")
                ]),
                new Pattern([
                    new Option("target", ["all"]),
                    new Constant("in"),
                    new Slot(Player, "player"),
                    new Pocket("destination", "pocket"),
                    new Constant("of"),
                    new Slot(InventoryItem, "destination")
                ]),
            ];

            const config: CommandConfig<Set<string>> = {
                name: "destroy_bot",
                description: "Destroys an item.",
                details: `Destroys an item in the specified location or in the player's inventory. `
                    + `The prefab ID or container identifier of the item must be given.\n\n`
                    + `To destroy a room item, the display name or ID of the room it's in must be given at the end of the command, following "at". `
                    + `To destroy an inventory item, the name of the player must be given followed by \`'s\` before the item's identifier.\n\n`
                    + `If, when destroying an inventory item, "player" is supplied instead of a player's name, then the given item will be `
                    + `destroyed from the inventory of the player who caused this command to be executed. If "room" is supplied instead, then `
                    + `the command will be executed on all players in the room as the initiating player. If "all" is supplied instead, then `
                    + `the command will be executed on all living players, including NPCs and players with the Free Movement role.\n\n`
                    + `It is possible to specify the container from which to destroy the item. To do so, add the container's preposition or "in" `
                    + `after the item's identifier, followed by the container's name. If the container is another item, its identifier or prefab `
                    + `ID must be used. The ID of the inventory slot to destroy the item from can also be specified, followed by "of". `
                    + `If you enter "all" in place of an item's identifier and specify a container, all items in that container will be destroyed.\n\n`
                    + `It is also possible to destroy an inventory item by specifying only the ID of the equipment slot it's equipped to `
                    + `instead of the item's identifier. This will destroy whatever is equipped to that equipment slot.\n\n`
                    + `Note that if you destroy an inventory item, the player will be notified if it is an item they have equipped, and its `
                    + `unequipped commands will be executed. The player will not be notified if it is an item they have stashed.`,
                usableBy: "Bot",
                aliases: new Set(["destroy", "ds"]),
                requiresGame: true,
                possessivePlayer: true
            }

            beforeEach(async () => {
                context = new BotContext(testGame, "destroy");
                const lexicon = context.getLexicon(patterns, config);
                trie = new Trie();
                for (const token of lexicon)
                    trie.insert(token.value, token);
            });

            let trie: Trie;
            let context: BotContext;

            test("Pattern.match(1)", async () => {
                const tokens = trie.tokenize("PEN at lobby".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const target = match.getRoomItems("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(2);
                const destination = match.getRooms("destination");
                expect(destination).not.toBeUndefined();
                expect(destination).toHaveLength(1);
            });

            test("Pattern.match(2)", async () => {
                const tokens = trie.tokenize("PEN on RECEPTION DESK at lobby".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const target = match.getRoomItems("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(2);
                const intermediate = match.getFixtures("intermediate");
                expect(intermediate).not.toBeUndefined();
                expect(intermediate).toHaveLength(1);
                const destination = match.getRooms("destination");
                expect(destination).not.toBeUndefined();
                expect(destination).toHaveLength(1);
            });

            test("Pattern.match(3)", async () => {
                const tokens = trie.tokenize("DATE LIST in FILING CABINET at general managers office".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const target = match.getRoomItems("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(1);
                const intermediate = match.getFixtures("intermediate");
                expect(intermediate).not.toBeUndefined();
                expect(intermediate).toHaveLength(1);
                const destination = match.getRooms("destination");
                expect(destination).not.toBeUndefined();
                expect(destination).toHaveLength(1);
            });

            test("Pattern.match(4)", async () => {
                const tokens = trie.tokenize("BARBELL WEIGHT on BARBELL at fitness room".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const target = match.getRoomItems("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(1);
                const intermediate = match.getRoomItems("intermediate");
                expect(intermediate).not.toBeUndefined();
                expect(intermediate).toHaveLength(1);
                const destination = match.getRooms("destination");
                expect(destination).not.toBeUndefined();
                expect(destination).toHaveLength(1);
            });

            test("Pattern.match(5)", async () => {
                const tokens = trie.tokenize("BARBELL WEIGHT in BARBELL of BARBELL at fitness room".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const target = match.getRoomItems("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(1);
                const pocket = match.getInventorySlots("pocket");
                expect(pocket).not.toBeUndefined();
                expect(pocket).toHaveLength(1);
                const intermediate = match.getRoomItems("intermediate");
                expect(intermediate).not.toBeUndefined();
                expect(intermediate).toHaveLength(1);
                const destination = match.getRooms("destination");
                expect(destination).not.toBeUndefined();
                expect(destination).toHaveLength(1);
            });

            test("Pattern.match(6)", async () => {
                const tokens = trie.tokenize("all on RECEPTION DESK at lobby".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const intermediate = match.getFixtures("intermediate");
                expect(intermediate).not.toBeUndefined();
                expect(intermediate).toHaveLength(1);
                const destination = match.getRooms("destination");
                expect(destination).not.toBeUndefined();
                expect(destination).toHaveLength(1);
                expect(match.getOpt("target", "all")).toBeTruthy();
            });

            test("Pattern.match(7)", async () => {
                const tokens = trie.tokenize("player MUG OF COFFEE".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const target = match.getInventoryItems("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(1);
                expect(match.getOpt("callee", "player")).toBeTruthy();
            });

            test("Pattern.match(8)", async () => {
                const tokens = trie.tokenize("all FACE".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const target = match.getEquipmentSlots("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(9);
                expect(match.getOpt("target", "all")).toBeTruthy();
            });

            test("Pattern.match(9)", async () => {
                const tokens = trie.tokenize("room PEN".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const target = match.getRoomItems("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(2);
                expect(match.getOpt("callee", "room")).toBeTruthy();
            });

            test("Pattern.match(10)", async () => {
                const tokens = trie.tokenize("Kyra's MASTER KEY in KYRAS PANTS".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const player = match.getPlayers("player");
                expect(player).not.toBeUndefined();
                expect(player).toHaveLength(1);
                const target = match.getInventoryItems("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(1);
                const intermediate = match.getInventoryItems("intermediate");
                expect(intermediate).not.toBeUndefined();
                expect(intermediate).toHaveLength(1);
            });

            test("Pattern.match(11)", async () => {
                const tokens = trie.tokenize("MASTER KEY in Kyra's RIGHT POCKET of KYRAS PANTS 1".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const player = match.getPlayers("player");
                expect(player).not.toBeUndefined();
                expect(player).toHaveLength(1);
                const target = match.getInventoryItems("target");
                expect(target).not.toBeUndefined();
                expect(target).toHaveLength(1);
                const pocket = match.getInventorySlots("pocket");
                expect(pocket).not.toBeUndefined();
                expect(pocket).toHaveLength(1);
                const destination = match.getInventoryItems("destination");
                expect(destination).not.toBeUndefined();
                expect(destination).toHaveLength(1);
            });

            test("Pattern.match(12)", async () => {
                const tokens = trie.tokenize("all in Kyra's KYRAS PANTS".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const player = match.getPlayers("player");
                expect(player).not.toBeUndefined();
                expect(player).toHaveLength(1);
                const destination = match.getInventoryItems("destination");
                expect(destination).not.toBeUndefined();
                expect(destination).toHaveLength(1);
                expect(match.getOpt("target", "all")).toBeTruthy();
            });

            test("Pattern.match(13)", async () => {
                const tokens = trie.tokenize("all in Kyra's RIGHT POCKET of KYRAS PANTS 1".split(/[^\S\n]/g));
                const attempts = patterns.map(pattern => pattern.match(tokens, testGame));
                const matches = attempts.filter(value => value instanceof MatchedInvocation) as ArrayNonEmpty<MatchedInvocation>;
                expect(matches).toHaveLength(1);
                const match = matches[0];
                const player = match.getPlayers("player");
                expect(player).not.toBeUndefined();
                expect(player).toHaveLength(1);
                const pocket = match.getInventorySlots("pocket");
                expect(pocket).not.toBeUndefined();
                expect(pocket).toHaveLength(1);
                const destination = match.getInventoryItems("destination");
                expect(destination).not.toBeUndefined();
                expect(destination).toHaveLength(1);
                expect(match.getOpt("target", "all")).toBeTruthy();
            });
        });

        describe("One-shot patterns", () => {
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "and", "PACK", "OF", "TOILET", "PAPER", "2"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(1) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(2);
                expect(invocation.getArgs("item1")).not.toBeUndefined();
                expect(invocation.getArgs("item1").length).toBe(1);
                invocation.getArgs("item1").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocation.getArgs("item2")).not.toBeUndefined();
                expect(invocation.getArgs("item2").length).toBe(1);
                invocation.getArgs("item2").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MG", "F", "CFF", "and", "PACK", "OF", "TOILET", "PAPER", "2"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(2) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, InvalidInvocation);
                expect(invocation.errors).toBeLength(1);
                expect(invocation.errors[0]).toBe("Couldn't find inventory item \"MG F CFF\" in your input.");
            });

            test("Pattern.match(3)", async () => {
                const pattern = new Pattern([
                    new Slot(InventoryItem, "target"),
                    new Preposition("destination"),
                    new Slot(Fixture, "destination"),
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "on", "FLOOR"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(3) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(2);
                expect(invocation.getArgs("target")).not.toBeUndefined();
                expect(invocation.getArgs("target").length).toBe(1);
                invocation.getArgs("target").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocation.getArgs("destination")).not.toBeUndefined();
                // there are 189 floor fixtures within the test data
                // however, two lack a preposition, and are thus excluded
                expect(invocation.getArgs("destination").length).toBe(187);
                invocation.getArgs("destination").forEach(fixture => {
                    expect.assert.instanceOf(fixture, Fixture);
                    expect(fixture.name).toBe("FLOOR");
                });
            });

            test("Pattern.match(4)", async () => {
                const pattern = new Pattern([
                    new Slot(InventoryItem, "target"),
                    new Preposition("destination"),
                    new Slot(Fixture, "destination"),
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "next", "to", "FLOOR"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(4) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, InvalidInvocation);
                expect(invocation.errors).toBeLength(1);
                expect(invocation.errors[0]).toBe("Couldn't find a preposition for destination.");
            });

            test("Pattern.match(5)", async () => {
                const pattern = new Pattern([
                    new Slot(InventoryItem, "target"),
                    new Preposition("destination"),
                    new Slot(Fixture, "destination"),
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "in", "FLOOR"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(5) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(2);
                expect(invocation.getArgs("target")).not.toBeUndefined();
                expect(invocation.getArgs("target").length).toBe(1);
                invocation.getArgs("target").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocation.getArgs("destination")).not.toBeUndefined();
                expect(invocation.getArgs("destination").length).toBe(189);
                invocation.getArgs("destination").forEach(fixture => {
                    expect.assert.instanceOf(fixture, Fixture);
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "in", "RIGHT", "POCKET", "of", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(6) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(3);
                expect(invocation.getArgs("target")).not.toBeUndefined();
                expect(invocation.getArgs("target").length).toBe(1);
                invocation.getArgs("target").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocation.getArgs("destination")).not.toBeUndefined();
                expect(invocation.getArgs("destination").length).toBe(1);
                invocation.getArgs("destination").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("KYRAS LAB COAT");
                    expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
                });
                expect(invocation.getArgs("destination pocket")).not.toBeUndefined();
                expect(invocation.getArgs("destination pocket").length).toBe(1); // there are 505 right pockets within the testing data, but we specifically want the right pocket of kyras lab coat 1
                invocation.getArgs("destination pocket").forEach(pocket => {
                    expect.assert.instanceOf(pocket, InventorySlot);
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "with"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(7) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, InvalidInvocation);
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "in", "RIGHT", "POCKET", "of", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(8) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(3);
                expect(invocation.getArgs("target")).not.toBeUndefined();
                expect(invocation.getArgs("target").length).toBe(1);
                invocation.getArgs("target").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocation.getArgs("destination")).not.toBeUndefined();
                expect(invocation.getArgs("destination").length).toBe(1);
                invocation.getArgs("destination").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("KYRAS LAB COAT");
                    expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
                });
                expect(invocation.getArgs("destination pocket")).not.toBeUndefined();
                expect(invocation.getArgs("destination pocket").length).toBe(1); // there are 505 right pockets within the testing data, but we specifically want the right pocket of kyras lab coat 1
                invocation.getArgs("destination pocket").forEach(pocket => {
                    expect.assert.instanceOf(pocket, InventorySlot);
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "in", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(9) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(2);
                expect(invocation.getArgs("target")).not.toBeUndefined();
                expect(invocation.getArgs("target").length).toBe(1);
                invocation.getArgs("target").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocation.getArgs("destination")).not.toBeUndefined();
                expect(invocation.getArgs("destination").length).toBe(1);
                invocation.getArgs("destination").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("KYRAS LAB COAT");
                    expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
                });
            });

            test("Pattern.match(10)", async () => {
                const pattern = new Pattern([
                    new Slot(Player, "recipient"),
                    new Glob(),
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["kyra", "Hello.\n\nI", "have", "overheard", "your", "conversation", "with", "Huiyu", "regarding", "your", "*very", "large", "rabbit*.\n\nPlease", "tell", "me", "more", "about", "the", "nature", "of", "this", "rabbit."]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(10) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(1);
                expect(invocation.getArgs("recipient")).not.toBeUndefined();
                expect(invocation.getArgs("recipient").length).toBe(1);
                invocation.getArgs("recipient").forEach(player => {
                    expect.assert.instanceOf(player, Player);
                    expect(player.name).toBe("Kyra");
                });
                expect(invocation.glob).toStrictEqual(["Hello.\n\nI", "have", "overheard", "your", "conversation", "with", "Huiyu", "regarding", "your", "*very", "large", "rabbit*.\n\nPlease", "tell", "me", "more", "about", "the", "nature", "of", "this", "rabbit."]);
            });

            test("Pattern.match(11)", async () => {
                const pattern = new Pattern([
                    new Slot(Player, "recipient"),
                    new Glob(),
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["kyra"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(11) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(1);
                expect(invocation.getArgs("recipient")).not.toBeUndefined();
                expect(invocation.getArgs("recipient").length).toBe(1);
                invocation.getArgs("recipient").forEach(player => {
                    expect.assert.instanceOf(player, Player);
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "in", "RIGHT", "POCKET", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(12) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, InvalidInvocation);
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [[]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(13) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "IN", "RIGHT", "POCKET", "OF", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(14) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(3);
                expect(invocation.getArgs("target")).not.toBeUndefined();
                expect(invocation.getArgs("target").length).toBe(1);
                invocation.getArgs("target").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocation.getArgs("destination")).not.toBeUndefined();
                expect(invocation.getArgs("destination").length).toBe(1);
                invocation.getArgs("destination").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("KYRAS LAB COAT");
                    expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
                });
                expect(invocation.getArgs("destination pocket")).not.toBeUndefined();
                expect(invocation.getArgs("destination pocket").length).toBe(1);
                invocation.getArgs("destination pocket").forEach(pocket => {
                    expect.assert.instanceOf(pocket, InventorySlot);
                    expect(pocket.id).toBe("RIGHT POCKET");
                });
            });

            test("Pattern.match(15)", async () => {
                const pattern = new Pattern([
                    new Glob(),
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [[]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(15) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(0);
                expect(invocation.glob).toStrictEqual([]);
            });

            test("Pattern.match(16)", async () => {
                const pattern = new Pattern([
                    new Glob(),
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["Hello", "world!"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(16) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(0);
                expect(invocation.glob).toStrictEqual(["Hello", "world!"]);
            });

            test("Pattern.match(17)", async () => {
                const pattern = new Pattern([
                    new Glob(),
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["Hello?"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(17) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(0);
                expect(invocation.glob).toStrictEqual(["Hello?"]);
            });

            test("Pattern.match(18)", async () => {
                const pattern = new Pattern([
                    new Slot(InventoryItem, "item 1"),
                    new Multiconstant(["and", "with"]),
                    new Slot(InventoryItem, "item 2"),
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "attacks", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(18) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, InvalidInvocation);
                expect(invocation.errors.length).toBe(1);
                expect(invocation.errors[0]).toBe("Couldn't find a required \"and/with\" in your input, instead found attacks KYRAS LAB COAT 1.");
            });

            test("Pattern.match(19)", async () => {
                const pattern = new Pattern([
                    new Slot(InventoryItem, "item 1"),
                    new Multiconstant(["and", "with"]),
                    new Slot(InventoryItem, "item 2"),
                ]);
                for (const constant of pattern.constants)
                    trie.insert(constant, new ConstantToken(constant));
                // first sub-case "with"
                const [tokensWith, tokenizedWith] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "with", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocationWith, matchedWith] = bench({ function: pattern.match, context: pattern, args: [tokensWith, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(19) [with] took ${Number(tokenizedWith + matchedWith) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenizedWith) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matchedWith) / 1000}μs`);
                }
                expect.assert.instanceOf(invocationWith, MatchedInvocation);
                expect(invocationWith.args.size).toBe(2);
                expect(invocationWith.args.get("item 1")).not.toBeUndefined();
                expect(invocationWith.args.get("item 1").length).toBe(1);
                invocationWith.args.get("item 1").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocationWith.args.get("item 2")).not.toBeUndefined();
                expect(invocationWith.args.get("item 2").length).toBe(1);
                invocationWith.args.get("item 2").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("KYRAS LAB COAT");
                    expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
                });
                // second sub-case "and"
                const [tokensAnd, tokenizedAnd] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "and", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocationAnd, matchedAnd] = bench({ function: pattern.match, context: pattern, args: [tokensAnd, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(19) [and] took ${Number(tokenizedAnd + matchedAnd) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenizedAnd) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matchedAnd) / 1000}μs`);
                }
                expect.assert.instanceOf(invocationAnd, MatchedInvocation);
                expect(invocationAnd.args.size).toBe(2);
                expect(invocationAnd.args.get("item 1")).not.toBeUndefined();
                expect(invocationAnd.args.get("item 1").length).toBe(1);
                invocationAnd.args.get("item 1").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocationAnd.args.get("item 2")).not.toBeUndefined();
                expect(invocationAnd.args.get("item 2").length).toBe(1);
                invocationAnd.args.get("item 2").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
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
                // first sub-case "with"
                const [tokensWith, tokenizedWith] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "with", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocationWith, matchedWith] = bench({ function: pattern.match, context: pattern, args: [tokensWith, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(20) [with] took ${Number(tokenizedWith + matchedWith) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenizedWith) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matchedWith) / 1000}μs`);
                }
                expect.assert.instanceOf(invocationWith, MatchedInvocation);
                expect(invocationWith.args.size).toBe(2);
                expect(invocationWith.args.get("item 1")).not.toBeUndefined();
                expect(invocationWith.args.get("item 1").length).toBe(1);
                invocationWith.args.get("item 1").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocationWith.args.get("item 2")).not.toBeUndefined();
                expect(invocationWith.args.get("item 2").length).toBe(1);
                invocationWith.args.get("item 2").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("KYRAS LAB COAT");
                    expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
                });
                expect(invocationWith.opts.size).toBe(1);
                expect(invocationWith.opts.get("article").size).toBe(1);
                expect(invocationWith.getOpt("article", "with")).toBeTruthy();
                expect(invocationWith.getOpt("article", "and")).toBeFalsy();
                // second sub-case "and"
                const [tokensAnd, tokenizedAnd] = bench({ function: trie.tokenize, context: trie, args: [["MUG", "OF", "COFFEE", "and", "KYRAS", "LAB", "COAT", "1"]], shortcircuit: !DEBUG });
                const [invocationAnd, matchedAnd] = bench({ function: pattern.match, context: pattern, args: [tokensAnd, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(20) [and] took ${Number(tokenizedAnd + matchedAnd) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenizedAnd) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matchedAnd) / 1000}μs`);
                }
                expect.assert.instanceOf(invocationAnd, MatchedInvocation);
                expect(invocationAnd.args.size).toBe(2);
                expect(invocationAnd.args.get("item 1")).not.toBeUndefined();
                expect(invocationAnd.args.get("item 1").length).toBe(1);
                invocationAnd.args.get("item 1").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("MUG OF COFFEE");
                });
                expect(invocationAnd.args.get("item 2")).not.toBeUndefined();
                expect(invocationAnd.args.get("item 2").length).toBe(1);
                invocationAnd.args.get("item 2").forEach(item => {
                    expect.assert.instanceOf(item, InventoryItem);
                    expect(item.prefabId).toBe("KYRAS LAB COAT");
                    expect(item.getIdentifier()).toBe("KYRAS LAB COAT 1");
                });
                expect(invocationAnd.opts.size).toBe(1);
                expect(invocationAnd.opts.get("article").size).toBe(1);
                expect(invocationAnd.getOpt("article", "with")).toBeFalsy();
                expect(invocationAnd.getOpt("article", "and")).toBeTruthy();
            });

            test("Pattern.match(21)", async () => {
                const pattern = new Pattern([]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [[]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(21) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
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
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["kyra", "VIVIAN", "Astrid", "Hello", "everyone!"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(22) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, MatchedInvocation);
                expect(invocation.args.size).toBe(1);
                const recipients = invocation.getPlayers("recipient");
                const playerList = new Set([testGame.entityFinder.getPlayer("Kyra"), testGame.entityFinder.getPlayer("Vivian"), testGame.entityFinder.getPlayer("Astrid")]);
                for (const recipient of recipients) {
                    expect(recipient).toBeOneOf(playerList);
                    playerList.delete(recipient);
                }
                expect(invocation.glob).toStrictEqual(["Hello", "everyone!"]);
            });

            test("Pattern.match(23)", async () => {
                const pattern = new Pattern([
                    new Slot(Player, "recipient", (game: Game) => game.errorMessageGenerator.generateInsufficientArgumentsError())
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["nobody"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(23) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, InvalidInvocation);
                expect(invocation.errors.length).toBe(1);
                expect(invocation.errors[0]).toBe("Insufficient arguments.");
            });

            test("Pattern.match(24)", async () => {
                const error: (game: Game) => string = (game: Game) => game.errorMessageGenerator.generateInsufficientArgumentsError();
                const pattern = new Pattern([
                    new Slot(Player, "recipient", error)
                ]);
                const [tokens, tokenized] = bench({ function: trie.tokenize, context: trie, args: [["nobody"]], shortcircuit: !DEBUG });
                const [invocation, matched] = bench({ function: pattern.match, context: pattern, args: [tokens, testGame], shortcircuit: !DEBUG });
                if (DEBUG) {
                    console.log(`Pattern.match(24) took ${Number(tokenized + matched) / 1000}μs`);
                    console.log(`  tokenization took ${Number(tokenized) / 1000}μs`);
                    console.log(`  pattern match took ${Number(matched) / 1000}μs`);
                }
                expect.assert.instanceOf(invocation, InvalidInvocation);
                expect(invocation.errors.length).toBe(1);
                expect(invocation.errors[0]).toBe("Insufficient arguments.");
            });
        });
    });
});
