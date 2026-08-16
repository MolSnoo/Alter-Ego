// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from '../../Classes/ModeratorCommand.ts';
import { usage, execute, config } from '../../Commands/instantiate_moderator.js'
import InstantiateInventoryItemAction from '../../Data/Actions/InstantiateInventoryItemAction.ts';
import { clearQueue } from '../../Modules/messageHandler.ts';
import { createMockMessage } from '../__mocks__/libs/discord.js';
import { createMockModerator } from '../__mocks__/utility.ts';

/** @import Prefab from '../../Data/Prefab.ts' */
/** @import InventoryItem from '../../Data/InventoryItem.ts' */
/** @import { ContainedItem } from '../../Modules/stringDataExtractor.ts' */
/** @import { Mock } from 'vitest' */

/**
 * @privateRemarks
 * a few tests still need implementation, and nested describes would help clean up the test structure...
 * inventory:
 *   - invalid item with procedural selections into player hand
 *     (should error on the same case as invalid item without procedural selections into player hand)
 *   - valid item with invalid procedural selection possibility containing items with valid procedural selections into player hand
 *     (should error on the same case as valid item with invalid procedural selection possibility into player hand)
 *   - valid item with invalid procedural selection containing items with valid procedural selections into player hand
 *     (should error on the same case as valid item with invalid procedural selection into player hand)
 *   - valid item with invalid procedural selection possibility containing items with invalid procedural selection possibility into player hand
 *     (should error on the same case as valid item with invalid procedural selection possibility into player hand)
 *   - valid item with invalid procedural selection containing items with invalid procedural selection possibility into player hand
 *     (should error on the same case as valid item with invalid procedural selection into player hand)
 *   - valid item with invalid procedural selection possibility containing items with invalid procedural selection into player hand
 *     (should error on the same case as valid item with invalid procedural selection possibility into player hand)
 *   - valid item with invalid procedural selection containing items with invalid procedural selection into player hand
 *     (should error on the same case as valid item with invalid procedural selection into player hand)
 * all tests should be repeated for room item instantiation as well.
 * -AC
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
        });
    });

    describe('room items', () => {
        describe('valid invocations', () => {

        });
        describe('invalid invocations (prefab)', () => {

        });
        describe('invalid invocations (procedural)', () => {

        });
    });
});
