// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from '../../Classes/ModeratorCommand.ts';
import { usage, execute, config } from '../../Commands/instantiate_moderator.js'
import InstantiateInventoryItemAction from '../../Data/Actions/InstantiateInventoryItemAction.ts';
import InstantiateRoomItemAction from '../../Data/Actions/InstantiateRoomItemAction.ts';
import { clearQueue } from '../../Modules/messageHandler.ts';
import { createMockMessage } from '../__mocks__/libs/discord.js';
import { createMockModerator } from '../__mocks__/utility.ts';

/** @import Prefab from '../../Data/Prefab.ts' */
/** @import InventoryItem from '../../Data/InventoryItem.ts' */
/** @import RoomItem from '../../Data/RoomItem.ts' */
/** @import { ContainedItem } from '../../Modules/stringDataExtractor.ts' */
/** @import { Mock } from 'vitest' */

/**
 * @privateRemarks
 * TODO: room items should have additional tests for syntax instantiating an item in a slot of another inventory item..
 * -LDL
 */

describe('instantiate_moderator command', () => {
    beforeAll(async () => {
        if (!testGame.inProgress) await testGame.entityLoader.loadAll();
        // @ts-expect-error
        moderator = createMockModerator();
    });

    afterEach(async () => {
        await testGame.entityLoader.loadInventoryItems(false);
        await testGame.entityLoader.loadRoomItems(false);
        clearQueue(testGame);
        vi.resetAllMocks();
    });

    const instantiate_moderator = new ModeratorCommand(config, usage, execute);

    /** @type {typeof import('../../Data/Moderator.ts')} */
    let moderator;

    describe('inventory items', () => {
        beforeEach(() => {
            const original = InstantiateInventoryItemAction.prototype.performInstantiateInventoryItem;
            spy = vi.spyOn(InstantiateInventoryItemAction.prototype, "performInstantiateInventoryItem");
            spy.mockImplementation(function (...args) {
                // @ts-expect-error
                context = this;
                // @ts-expect-error
                return original.apply(this, args);
            });
        });

        afterEach(() => {
            context = undefined;
        });

        /** @type Mock<(prefab: Prefab, equipmentSlotId: string, container: InventoryItem, inventorySlotId: string, quantity: number, proceduralSelections: Map<string, string>, uses?: number, containedItems?: ContainedItem[], notify?: boolean) => InventoryItem[]> */
        let spy;

        /** @type {InstantiateInventoryItemAction} */
        let context;

        describe('valid invocations', () => {
            test('valid item without procedural selections into player hand', async () => {
                const kyra = testGame.entityFinder.getPlayer("Kyra");
                const coffee = testGame.entityFinder.getPrefab("mug of coffee");
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", ["mug", "of", "coffee", "in", "kyra's", "left", "hand"], moderator);
                expect(spy).toBeInvokedWith(coffee, "LEFT HAND", null, "", 1, new Map(), coffee.uses, []);
                expect(context).not.toBeUndefined();
                expect(context.player.name).toBe(kyra.name);
            });

            test('valid item with valid procedural selections into player hand', async () => {
                const kyra = testGame.entityFinder.getPlayer("Kyra");
                const pen = testGame.entityFinder.getPrefab("pen");
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", ["pen", "(ink", "color", "=", "red)", "in", "kyra's", "left", "hand"], moderator);
                expect(spy).toBeInvokedWith(pen, "LEFT HAND", null, "", 1, new Map([["ink color", "red"]]), pen.uses, []);
                expect(context).not.toBeUndefined();
                expect(context.player.name).toBe(kyra.name);
            });

            test('valid item without procedural selections containing items with valid procedural selections into player hand', async () => {
                const kyra = testGame.entityFinder.getPlayer("Kyra");
                const pack = testGame.entityFinder.getPrefab("pack of pens");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "pen", "(ink", "color", "=", "red)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pack, "LEFT HAND", null, "", 1, new Map(), pack.uses, [
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "red"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
                expect(context.player.name).toBe(kyra.name);
            });

            test('valid item with valid procedural selections containing items with valid procedural selections into player hand', async () => {
                const kyra = testGame.entityFinder.getPlayer("Kyra");
                const pot = testGame.entityFinder.getPrefab("fired glazed clay pot");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "pen", "(ink", "color", "=", "red)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pot, "LEFT HAND", null, "", 1, new Map([
                    ["base color", "obscured"],
                    ["quality", "excellent"],
                    ["glaze color", "black"],
                    ["pattern", "drip lines"],
                    ["pattern quality", "ornate"],
                    ["pattern color", "white"],
                ]), pot.uses, [
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "red"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
                expect(context.player.name).toBe(kyra.name);
            });
        });

        describe('invalid invocations (prefab)', () => {
            test('invalid item without procedural selections into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["something", "very", "scary", "in", "kyra's", "left", "hand"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('invalid item with procedural selections into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["something", "very", "scary", "(scary", "=", "true)", "in", "kyra's", "left", "hand"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });
        });

        describe('invalid invocations (procedural)', () => {
            test('valid item with invalid procedural selection possibility into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["pen", "(ink", "color", "=", "rainbow)", "in", "kyra's", "left", "hand"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('valid item with invalid procedural selection into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["pen", "(scary", "=", "true)", "in", "kyra's", "left", "hand"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('valid item without procedural selections containing items with invalid procedural selection possibility into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "pen", "(ink", "color", "=", "rainbow)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('valid item without procedural selections containing items with invalid procedural selection into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "pen", "(scary", "=", "true)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('valid item with invalid procedural selection possibility containing items with valid procedural selections into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "pen", "(ink", "color", "=", "red)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('valid item with invalid procedural selection containing items with valid procedural selections into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "pen", "(ink", "color", "=", "red)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('valid item with invalid procedural selection possibility containing items with invalid procedural selection possibility into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "pen", "(ink", "color", "=", "rainbow)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "red)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('valid item with invalid procedural selection possibility containing items with invalid procedural selection into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "pen", "(scary", "=", "true)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('valid item with invalid procedural selection containing items with invalid procedural selection possibility into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "pen", "(ink", "color", "=", "rainbow)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "red)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('valid item with invalid procedural selection containing items with invalid procedural selection into player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "pen", "(scary", "=", "true)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });
        });

        describe('invalid invocations (player)', () => {
            test('valid item without procedural selections into invalid player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["mug", "of", "coffee", "in", "nobody's", "left", "hand"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find a room or player in your input.");
            });

            test('valid item with valid procedural selections into invalid player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["pen", "(ink", "color", "=", "red)", "in", "nobody's", "left", "hand"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find a room or player in your input.");
            });

            test('invalid item without procedural selections into invalid player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["something", "very", "scary", "in", "nobody's", "left", "hand"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find a room or player in your input.");
            });

            test('invalid item with procedural selections into invalid player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["something", "very", "scary", "(scary", "=", "true)", "in", "nobody's", "left", "hand"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find a room or player in your input.");
            });
        });
    });

    describe('room items', () => {
        beforeEach(() => {
            const original = InstantiateRoomItemAction.prototype.performInstantiateRoomItem;
            spy = vi.spyOn(InstantiateRoomItemAction.prototype, "performInstantiateRoomItem");
            spy.mockImplementation(function (...args) {
                // @ts-expect-error
                context = this;
                // @ts-expect-error
                return original.apply(this, args);
            });
        });

        afterEach(() => {
            context = undefined;
        });

        /** @type Mock<(prefab: Prefab, container: RoomItemContainer, inventorySlotId: string, quantity: number, proceduralSelections: Map<string, string>, uses?: number, containedItems?: ContainedItem[]) => RoomItem[]> */
        let spy;

        /** @type {InstantiateRoomItemAction} */
        let context;

        describe('valid invocations', () => {
            test('valid item without procedural selections into fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const coffee = testGame.entityFinder.getPrefab("mug of coffee");
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", ["mug", "of", "coffee", "on", "floor", "at", "lobby"], moderator);
                expect(spy).toBeInvokedWith(coffee, floor, "", 1, new Map(), coffee.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('valid item with valid procedural selections into fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pen = testGame.entityFinder.getPrefab("pen");
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", ["pen", "(ink", "color", "=", "red)", "on", "floor", "at", "lobby"], moderator);
                expect(spy).toBeInvokedWith(pen, floor, "", 1, new Map([["ink color", "red"]]), pen.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('valid item without procedural selections containing items with valid procedural selections into fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pack = testGame.entityFinder.getPrefab("pack of pens");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "pen", "(ink", "color", "=", "red)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pack, floor, "", 1, new Map(), pack.uses, [
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "red"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });

            test('valid item with valid procedural selections containing items with valid procedural selections into fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pot = testGame.entityFinder.getPrefab("fired glazed clay pot");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "pen", "(ink", "color", "=", "red)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pot, floor, "", 1, new Map([
                    ["base color", "obscured"],
                    ["quality", "excellent"],
                    ["glaze color", "black"],
                    ["pattern", "drip lines"],
                    ["pattern quality", "ornate"],
                    ["pattern color", "white"],
                ]), pot.uses, [
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "red"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });
        });

        describe('invalid invocations (prefab)', () => {
            test('invalid item without procedural selections into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["something", "very", "scary", "on", "floor", "at", "lobby"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('invalid item with procedural selections into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["something", "very", "scary", "(scary", "=", "true)", "on", "floor", "at", "lobby"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });
        });

        describe('invalid invocations (procedural)', () => {
            test('valid item with invalid procedural selection possibility into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["pen", "(ink", "color", "=", "rainbow)", "on", "floor", "at", "lobby"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('valid item with invalid procedural selection into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", ["pen", "(scary", "=", "true)", "on", "floor", "at", "lobby"], moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('valid item without procedural selections containing items with invalid procedural selection possibility into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "pen", "(ink", "color", "=", "rainbow)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('valid item without procedural selections containing items with invalid procedural selection into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "pen", "(scary", "=", "true)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('valid item with invalid procedural selection possibility containing items with valid procedural selections into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "pen", "(ink", "color", "=", "red)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('valid item with invalid procedural selection containing items with valid procedural selections into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "pen", "(ink", "color", "=", "red)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('valid item with invalid procedural selection possibility containing items with invalid procedural selection possibility into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "pen", "(ink", "color", "=", "rainbow)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "red)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('valid item with invalid procedural selection possibility containing items with invalid procedural selection into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "pen", "(scary", "=", "true)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('valid item with invalid procedural selection containing items with invalid procedural selection possibility into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "pen", "(ink", "color", "=", "rainbow)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "red)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('valid item with invalid procedural selection containing items with invalid procedural selection into fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "pen", "(scary", "=", "true)", "+",
                        "pen", "(ink", "color", "=", "green)", "+",
                        "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                // @ts-expect-error
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });
        });
    });
});
