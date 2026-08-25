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
import type Prefab from '../../Data/Prefab.ts';
import type InventoryItem from '../../Data/InventoryItem.ts';
import type RoomItem from '../../Data/RoomItem.ts';
import type { ContainedItem } from '../../Modules/stringDataExtractor.ts';
import type { Mock } from 'vitest';
import type Moderator from '../../Data/Moderator.ts';

describe('instantiate_moderator command', () => {
    beforeAll(async () => {
        if (!testGame.inProgress) await testGame.entityLoader.loadAll();
        moderator = createMockModerator();
    });

    afterEach(async () => {
        clearQueue(testGame);
        vi.resetAllMocks();
    });

    const instantiate_moderator = new ModeratorCommand(config, usage, execute);

    let moderator: Moderator;

    describe('inventory items', () => {
        beforeEach(() => {
            spy = vi.spyOn(InstantiateInventoryItemAction.prototype, "performInstantiateInventoryItem");
            spy.mockImplementation(function(this: InstantiateInventoryItemAction) {
                context = this;
                return [];
            });
        });

        afterEach(() => {
            context = undefined;
        });

        let spy: Mock<(prefab: Prefab, equipmentSlotId: string, container: InventoryItem, inventorySlotId: string, quantity: number, proceduralSelections: Map<string, string>, uses?: number, containedItems?: ContainedItem[], notify?: boolean) => InventoryItem[]>;

        let context: InstantiateInventoryItemAction;

        describe('valid invocations', () => {
            test('1 valid item without procedural selections into valid player equipment slot', async () => {
                const kyra = testGame.entityFinder.getPlayer("Kyra");
                const coffee = testGame.entityFinder.getPrefab("mug of coffee");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "mug of coffee in kyra's left hand".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(coffee, "LEFT HAND", null, "", 1, new Map(), coffee.uses, []);
                expect(context).not.toBeUndefined();
                expect(context.player.name).toBe(kyra.name);
            });

            test('1 valid item with valid procedural selections into valid player equipment slot', async () => {
                const kyra = testGame.entityFinder.getPlayer("Kyra");
                const pen = testGame.entityFinder.getPrefab("pen");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "pen (ink color = red) in kyra's left hand".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(pen, "LEFT HAND", null, "", 1, new Map([["ink color", "red"]]), pen.uses, []);
                expect(context).not.toBeUndefined();
                expect(context.player.name).toBe(kyra.name);
            });

            test('1 valid item without procedural selections containing 3 items with valid procedural selections into valid player equipment slot', async () => {
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

            test('1 valid item without procedural selections containing 6 items with valid procedural selections into valid player equipment slot', async () => {
                const kyra = testGame.entityFinder.getPlayer("Kyra");
                const pack = testGame.entityFinder.getPrefab("pack of pens");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "red)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pack, "LEFT HAND", null, "", 1, new Map(), pack.uses, [
                    {
                        prefab: pen, quantity: 3, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "red"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
                expect(context.player.name).toBe(kyra.name);
            });

            test('1 valid item with valid procedural selections containing 3 items with valid procedural selections into valid player equipment slot', async () => {
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

            test('1 valid item with valid procedural selections containing 4 items with valid procedural selections into valid player equipment slot', async () => {
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
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "kyra's", "left", "hand",
                ];
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
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
                expect(context.player.name).toBe(kyra.name);
            });
        });

        describe('invalid invocations (prefab)', () => {
            test('1 invalid item without procedural selections into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "something very scary in kyra's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('1 invalid item with procedural selections into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "something very scary (scary = true) in kyra's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });
        });

        describe('invalid invocations (procedural)', () => {
            test('1 valid item with invalid procedural selection possibility into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "pen (ink color = rainbow) in kyra's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "pen (scary = true) in kyra's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('1 valid item without procedural selections containing 3 items with invalid procedural selection possibility into valid player equipment slot', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item without procedural selections containing 6 items with invalid procedural selection possibility into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "1", "pen", "(ink", "color", "=", "rainbow)", "+",
                    "2", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item without procedural selections containing 3 items with invalid procedural selection into valid player equipment slot', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('1 valid item without procedural selections containing 6 items with invalid procedural selection into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "1", "pen", "(scary", "=", "true)", "+",
                    "2", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 3 items with valid procedural selections into valid player equipment slot', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 4 items with valid procedural selections into valid player equipment slot', async () => {
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
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection containing 3 items with valid procedural selections into valid player equipment slot', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 4 items with valid procedural selections into valid player equipment slot', async () => {
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
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection possibility into valid player equipment slot', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection possibility into valid player equipment slot', async () => {
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
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection into valid player equipment slot', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection into valid player equipment slot', async () => {
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
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection containing 3 items with invalid procedural selection possibility into valid player equipment slot', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 4 items with invalid procedural selection possibility into valid player equipment slot', async () => {
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
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 3 items with invalid procedural selection into valid player equipment slot', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 4 items with invalid procedural selection into valid player equipment slot', async () => {
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
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });
        });

        describe('invalid invocations (player)', () => {
            test('1 valid item without procedural selections into invalid player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "mug of coffee in nobody's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find a room or player in your input.");
            });

            test('1 valid item with valid procedural selections into invalid player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "pen (ink color = red) in nobody's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find a room or player in your input.");
            });

            test('1 invalid item without procedural selections into invalid player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "something very scary in nobody's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find a room or player in your input.");
            });

            test('1 invalid item with procedural selections into invalid player hand', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "something very scary (scary = true) in nobody's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find a room or player in your input.");
            });
        });

        describe('invalid invocations (quantity)', () => {
            test('2 valid items without procedural selections into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 mug of coffee in kyra's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Cannot instantiate an item to a player's equipment slot with a quantity other than 1.");
            });

            test('2 valid items with valid procedural selections into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 pen (ink color = red) in kyra's left hand".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Cannot instantiate an item to a player's equipment slot with a quantity other than 1.");
            });

            test('2 valid items without procedural selections containing 3 items with valid procedural selections into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "pack", "of", "pens",
                    "containing",
                    "pen", "(ink", "color", "=", "red)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Cannot instantiate an item to a player's equipment slot with a quantity other than 1.");
            });

            test('2 valid items with valid procedural selections containing 4 items with valid procedural selections into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "blue)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Cannot instantiate an item to a player's equipment slot with a quantity other than 1.");
            });

            test('1 valid item without procedural selections with 10 capacity containing 11 items with valid procedural selections into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "4", "pen", "(ink", "color", "=", "red)", "+",
                    "4", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN, PEN, and PEN will not fit in PACK OF PENS.");
            });

            test('1 valid item with valid procedural selections with 4 capacity containing 6 items with valid procedural selections into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "red)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN, PEN, and PEN will not fit in FIRED GLAZED CLAY POT.");
            });
        });

        describe('invalid invocations (location)', () => {
            test('1 valid item without procedural selections containing 9 items with valid procedural selections into invalid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "red)", "+",
                    "3", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "kyra's", "abyssal", "void",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find inventory item or equipment slot \"ABYSSAL VOID\".");
            });

            test('1 valid item with valid procedural selections containing 4 items with valid procedural selections into invalid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "blue)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "kyra's", "abyssal", "void",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find inventory item or equipment slot \"ABYSSAL VOID\".");
            });
        });

        describe('invalid invocations (syntax)', () => {
            test('1 valid item without procedural selections and invalid containing syntax into valid player equipment slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "in",
                    "kyra's", "left", "hand",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("TODO");
            });
        });
    });

    describe('room items', () => {
        beforeEach(() => {
            spy = vi.spyOn(InstantiateRoomItemAction.prototype, "performInstantiateRoomItem");
            spy.mockImplementation(function(this: InstantiateRoomItemAction) {
                context = this;
                return [];
            });
        });

        afterEach(() => {
            context = undefined;
        });

        let spy: Mock<(prefab: Prefab, container: RoomItemContainer, inventorySlotId: string, quantity: number, proceduralSelections: Map<string, string>, uses?: number, containedItems?: ContainedItem[]) => RoomItem[]>;

        let context: InstantiateRoomItemAction;

        describe('valid invocations', () => {
            test('1 valid item without procedural selections into valid fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const coffee = testGame.entityFinder.getPrefab("mug of coffee");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "mug of coffee on floor at lobby".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(coffee, floor, "", 1, new Map(), coffee.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('2 valid items without procedural selections into valid fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const coffee = testGame.entityFinder.getPrefab("mug of coffee");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "2 mug of coffee on floor at lobby".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(coffee, floor, "", 2, new Map(), coffee.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('1 valid item with valid procedural selections into valid fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pen = testGame.entityFinder.getPrefab("pen");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "pen (ink color = red) on floor at lobby".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(pen, floor, "", 1, new Map([["ink color", "red"]]), pen.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('2 valid items with valid procedural selections into valid fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pen = testGame.entityFinder.getPrefab("pen");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "2 pen (ink color = red) on floor at lobby".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(pen, floor, "", 2, new Map([["ink color", "red"]]), pen.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('1 valid item without procedural selections containing 3 items with valid procedural selections into valid fixture', async () => {
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

            test('2 valid items without procedural selections containing 3 items with valid procedural selections into valid fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pack = testGame.entityFinder.getPrefab("pack of pens");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "2", "pack", "of", "pens",
                    "containing",
                    "pen", "(ink", "color", "=", "red)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pack, floor, "", 2, new Map(), pack.uses, [
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

            test('1 valid item without procedural selections containing 6 items with valid procedural selections into valid fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pack = testGame.entityFinder.getPrefab("pack of pens");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "red)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pack, floor, "", 1, new Map(), pack.uses, [
                    {
                        prefab: pen, quantity: 3, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "red"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });

            test('2 valid items without procedural selections containing 6 items with valid procedural selections into valid fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pack = testGame.entityFinder.getPrefab("pack of pens");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "2", "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "red)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pack, floor, "", 2, new Map(), pack.uses, [
                    {
                        prefab: pen, quantity: 3, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "red"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });

            test('1 valid item with valid procedural selections containing 3 items with valid procedural selections into valid fixture', async () => {
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

            test('2 valid items with valid procedural selections containing 3 items with valid procedural selections into valid fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pot = testGame.entityFinder.getPrefab("fired glazed clay pot");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pot, floor, "", 2, new Map([
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

            test('1 valid item with valid procedural selections containing 4 items with valid procedural selections into valid fixture', async () => {
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
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
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
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });

            test('2 valid items with valid procedural selections containing 4 items with valid procedural selections into valid fixture', async () => {
                const floor = testGame.entityFinder.getFixture('floor', 'lobby');
                const pot = testGame.entityFinder.getPrefab("fired glazed clay pot");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pot, floor, "", 2, new Map([
                    ["base color", "obscured"],
                    ["quality", "excellent"],
                    ["glaze color", "black"],
                    ["pattern", "drip lines"],
                    ["pattern quality", "ornate"],
                    ["pattern color", "white"],
                ]), pot.uses, [
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });

            test('1 valid item without procedural selections into valid room item', async () => {
                const pot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const coffee = testGame.entityFinder.getPrefab("mug of coffee");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "mug of coffee in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(coffee, pot, "POT", 1, new Map(), coffee.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('2 valid items without procedural selections into valid room item', async () => {
                const pot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const coffee = testGame.entityFinder.getPrefab("mug of coffee");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "2 mug of coffee in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(coffee, pot, "POT", 2, new Map(), coffee.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('1 valid item with valid procedural selections into valid room item', async () => {
                const pot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const pen = testGame.entityFinder.getPrefab("pen");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "pen (ink color = red) in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(pen, pot, "POT", 1, new Map([["ink color", "red"]]), pen.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('2 valid items with valid procedural selections into valid room item', async () => {
                const pot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const pen = testGame.entityFinder.getPrefab("pen");
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", "2 pen (ink color = red) in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                expect(spy).toBeInvokedWith(pen, pot, "POT", 2, new Map([["ink color", "red"]]), pen.uses, []);
                expect(context).not.toBeUndefined();
            });

            test('1 valid item without procedural selections containing 3 items with valid procedural selections into valid room item', async () => {
                const pot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const pack = testGame.entityFinder.getPrefab("pack of pens");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "pen", "(ink", "color", "=", "red)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pack, pot, "POT", 1, new Map(), pack.uses, [
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

            test('2 valid items without procedural selections containing 2 items with valid procedural selections into valid room item', async () => {
                const pot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const cup = testGame.entityFinder.getPrefab("paint cup");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "2", "paint", "cup",
                    "containing",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(cup, pot, "POT", 2, new Map(), cup.uses, [
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

            test('1 valid item without procedural selections containing 6 items with valid procedural selections into valid room item', async () => {
                const pot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const pack = testGame.entityFinder.getPrefab("pack of pens");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "red)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pack, pot, "POT", 1, new Map(), pack.uses, [
                    {
                        prefab: pen, quantity: 3, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "red"]]),
                    },
                    {
                        prefab: pen, quantity: 1, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });

            test('2 valid items without procedural selections containing 2 items with valid procedural selections into valid room item', async () => {
                const pot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const pack = testGame.entityFinder.getPrefab("paint cup");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "paint", "cup",
                    "containing",
                    "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pack, pot, "POT", 1, new Map(), pack.uses, [
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });

            test('1 valid item with valid procedural selections containing 3 items with valid procedural selections into valid room item', async () => {
                const kitchenPot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pot, kitchenPot, "POT", 1, new Map([
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

            test('2 valid item with valid procedural selections containing 3 items with valid procedural selections into valid room item', async () => {
                const kitchenPot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const pot = testGame.entityFinder.getPrefab("fired glazed clay pot");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pot, kitchenPot, "POT", 2, new Map([
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

            test('1 valid item with valid procedural selections containing 4 items with valid procedural selections into valid room item', async () => {
                const kitchenPot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
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
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pot, kitchenPot, "POT", 1, new Map([
                    ["base color", "obscured"],
                    ["quality", "excellent"],
                    ["glaze color", "black"],
                    ["pattern", "drip lines"],
                    ["pattern quality", "ornate"],
                    ["pattern color", "white"],
                ]), pot.uses, [
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });

            test('2 valid item with valid procedural selections containing 4 items with valid procedural selections into valid room item', async () => {
                const kitchenPot = testGame.entityFinder.getRoomItem('pot 1', 'kitchen');
                const pot = testGame.entityFinder.getPrefab("fired glazed clay pot");
                const pen = testGame.entityFinder.getPrefab("pen");
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, createMockMessage(), "create", args, moderator);
                expect(spy).toBeInvokedWith(pot, kitchenPot, "POT", 2, new Map([
                    ["base color", "obscured"],
                    ["quality", "excellent"],
                    ["glaze color", "black"],
                    ["pattern", "drip lines"],
                    ["pattern quality", "ornate"],
                    ["pattern color", "white"],
                ]), pot.uses, [
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "green"]]),
                    },
                    {
                        prefab: pen, quantity: 2, uses: pen.uses,
                        proceduralSelections: new Map([["ink color", "blue"]]),
                    },
                ]);
                expect(context).not.toBeUndefined();
            });
        });

        describe('invalid invocations (prefab)', () => {
            test('1 invalid item without procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "something very scary on floor at lobby".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('2 invalid item without procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 something very scary on floor at lobby".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('1 invalid item with procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "something very scary (scary = true) on floor at lobby".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('2 invalid item with procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 something very scary (scary = true) on floor at lobby".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('1 invalid item without procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "something very scary in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('2 invalid item without procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 something very scary in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('1 invalid item with procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "something very scary (scary = true) in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });

            test('2 invalid item with procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 something very scary (scary = true) in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find prefab with id \"SOMETHING VERY SCARY\".");
            });
        });

        describe('invalid invocations (procedural)', () => {
            test('1 valid item with invalid procedural selection possibility into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "pen (ink color = rainbow) on floor at lobby".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 pen (ink color = rainbow) on floor at lobby".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "pen (scary = true) on floor at lobby".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 pen (scary = true) on floor at lobby".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('1 valid item without procedural selections containing 3 items with invalid procedural selection possibility into valid fixture', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item without procedural selections containing 3 items with invalid procedural selection possibility into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "pack", "of", "pens",
                    "containing",
                    "pen", "(ink", "color", "=", "rainbow)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item without procedural selections containing 6 items with invalid procedural selection possibility into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "rainbow)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item without procedural selections containing 6 items with invalid procedural selection possibility into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "rainbow)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item without procedural selections containing 3 items with invalid procedural selection into valid fixture', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('2 valid item without procedural selections containing 3 items with invalid procedural selection into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "pack", "of", "pens",
                    "containing",
                    "pen", "(scary", "=", "true)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('1 valid item without procedural selections containing 6 items with invalid procedural selection into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(scary", "=", "true)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('2 valid item without procedural selections containing 6 items with invalid procedural selection into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(scary", "=", "true)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 3 items with valid procedural selections into valid fixture', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 3 items with valid procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 4 items with valid procedural selections into valid fixture', async () => {
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
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 4 items with valid procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection containing 3 items with valid procedural selections into valid fixture', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 3 items with valid procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 4 items with valid procedural selections into valid fixture', async () => {
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
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 4 items with valid procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection possibility into valid fixture', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection possibility into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection possibility into valid fixture', async () => {
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
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection possibility into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection into valid fixture', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection into valid fixture', async () => {
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
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection containing 3 items with invalid procedural selection possibility into valid fixture', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 3 items with invalid procedural selection possibility into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 4 items with invalid procedural selection possibility into valid fixture', async () => {
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
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 4 items with invalid procedural selection possibility into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 3 items with invalid procedural selection into valid fixture', async () => {
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });


            test('2 valid item with invalid procedural selection containing 3 items with invalid procedural selection into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 4 items with invalid procedural selection into valid fixture', async () => {
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
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 4 items with invalid procedural selection into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "pen (ink color = rainbow) in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 pen (ink color = rainbow) in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "pen (scary = true) in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                await instantiate_moderator.execute(testGame, message, "create", "2 pen (scary = true) in pot of pot 1 at kitchen".split(/[^\S\n]/), moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('1 valid item without procedural selections containing 3 items with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "pen", "(ink", "color", "=", "rainbow)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item without procedural selections containing 2 items with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "paint", "cup",
                    "containing",
                    "pen", "(ink", "color", "=", "rainbow)", "+",
                    "pen", "(ink", "color", "=", "green)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item without procedural selections containing 6 items with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "rainbow)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item without procedural selections containing 2 items with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "paint", "cup",
                    "containing",
                    "2", "pen", "(ink", "color", "=", "rainbow)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN's procedural \"ink color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item without procedural selections containing 3 items with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "pen", "(scary", "=", "true)", "+",
                    "pen", "(ink", "color", "=", "green)", "+",
                    "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('2 valid item without procedural selections containing 2 items with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "paint", "cup",
                    "containing",
                    "pen", "(scary", "=", "true)", "+",
                    "pen", "(ink", "color", "=", "green)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('1 valid item without procedural selections containing 6 items with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(scary", "=", "true)", "+",
                    "1", "pen", "(ink", "color", "=", "green)", "+",
                    "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('2 valid item without procedural selections containing 2 items with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "paint", "cup",
                    "containing",
                    "2", "pen", "(scary", "=", "true)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 3 items with valid procedural selections into valid room item', async () => {
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 3 items with valid procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 4 items with valid procedural selections into valid room item', async () => {
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
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 4 items with valid procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection containing 3 items with valid procedural selections into valid room item', async () => {
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 3 items with valid procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 4 items with valid procedural selections into valid room item', async () => {
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
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 4 items with valid procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "green)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection possibility into valid room item', async () => {
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection possibility into valid room item', async () => {
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
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection into valid room item', async () => {
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 3 items with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection into valid room item', async () => {
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
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('2 valid item with invalid procedural selection possibility containing 4 items with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "rainbow)",
                    "containing",
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT's procedural \"pattern color\" does not have possibility \"rainbow\".");
            });

            test('1 valid item with invalid procedural selection containing 3 items with invalid procedural selection possibility into valid room item', async () => {
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 3 items with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 4 items with invalid procedural selection possibility into valid room item', async () => {
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
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 4 items with invalid procedural selection possibility into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "rainbow)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 3 items with invalid procedural selection into valid room item', async () => {
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 3 items with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
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
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('1 valid item with invalid procedural selection containing 4 items with invalid procedural selection into valid room item', async () => {
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
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });

            test('2 valid item with invalid procedural selection containing 4 items with invalid procedural selection into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "scary", "=", "true)",
                    "containing",
                        "2", "pen", "(scary", "=", "true)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT does not have procedural \"scary\".");
            });
        });

        describe('invalid invocations (quantity)', () => {
            test('1 valid item without procedural selections with 10 capacity containing 11 items with valid procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "4", "pen", "(ink", "color", "=", "red)", "+",
                    "4", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "on",
                    "floor",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN, PEN, and PEN will not fit in PACK OF PENS.");
            });

            test('1 valid item with valid procedural selections with 4 capacity containing 6 items with valid procedural selections into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "red)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN, PEN, and PEN will not fit in FIRED GLAZED CLAY POT.");
            });

            test('1 valid item without procedural selections with 10 capacity containing 11 items with valid procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "4", "pen", "(ink", "color", "=", "red)", "+",
                    "4", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN, PEN, and PEN will not fit in PACK OF PENS.");
            });

            test('1 valid item with valid procedural selections with 4 capacity containing 6 items with valid procedural selections into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "red)", "+",
                        "2", "pen", "(ink", "color", "=", "blue)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PEN, PEN, and PEN will not fit in FIRED GLAZED CLAY POT.");
            });

            test('2 valid items of size 7 without procedural selections containing 9 items with valid procedural selections into valid room item of capacity 8', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "2", "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "red)", "+",
                    "3", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "pot",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("PACK OF PENS will not fit in POT 1 because there isn't enough space left.");
            });

            test('5 valid items of size 2 with valid procedural selections containing 4 items with valid procedural selections into valid room item of capacity 8', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "5", "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "blue)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("FIRED GLAZED CLAY POT will not fit in POT 1 because there isn't enough space left.");
            });
        });

        describe('invalid invocations (location)', () => {
            test('1 valid item without procedural selections containing 9 items with valid procedural selections into invalid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "red)", "+",
                    "3", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "very", "scary", "abyssal", "void",
                    "at",
                    "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find fixture, room item, or puzzle \"VERY SCARY ABYSSAL VOID\".");
            });

            test('1 valid item with valid procedural selections containing 4 items with valid procedural selections into invalid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "blue)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "very", "scary", "abyssal", "void",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find fixture, room item, or puzzle \"VERY SCARY ABYSSAL VOID\".");
            });

            test('1 valid item without procedural selections containing 9 items with valid procedural selections into invalid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "red)", "+",
                    "3", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "void",
                    "of",
                    "very", "scary", "abyssal", "void",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find fixture, room item, or puzzle \"VOID OF VERY SCARY ABYSSAL VOID\".");
            });

            test('1 valid item with valid procedural selections containing 4 items with valid procedural selections into invalid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "blue)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "void",
                    "of",
                        "very", "scary", "abyssal", "void",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find fixture, room item, or puzzle \"VOID OF VERY SCARY ABYSSAL VOID\".");
            });

            test('1 valid item without procedural selections containing 9 items with valid procedural selections into invalid room item slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "3", "pen", "(ink", "color", "=", "red)", "+",
                    "3", "pen", "(ink", "color", "=", "green)", "+",
                    "3", "pen", "(ink", "color", "=", "blue)",
                    "in",
                    "void",
                    "of",
                    "pot", "1",
                    "at",
                    "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find \"VOID\" of POT 1.");
            });

            test('1 valid item with valid procedural selections containing 4 items with valid procedural selections into invalid room item slot', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "fired", "glazed", "clay", "pot",
                        "(base", "color", "=", "obscured", "+",
                        "quality", "=", "excellent", "+",
                        "glaze", "color", "=", "black", "+",
                        "pattern", "=", "drip", "lines", "+",
                        "pattern", "quality", "=", "ornate", "+",
                        "pattern", "color", "=", "white)",
                    "containing",
                        "2", "pen", "(ink", "color", "=", "blue)", "+",
                        "2", "pen", "(ink", "color", "=", "green)",
                    "in",
                        "void",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("Couldn't find \"VOID\" of POT 1.");
            });
        });

        describe('invalid invocations (syntax)', () => {
            test('1 valid item without procedural selections and invalid containing syntax into valid fixture', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "on",
                        "floor",
                    "at",
                        "lobby",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("TODO");
            });

            test('1 valid item without procedural selections and invalid containing syntax into valid room item', async () => {
                const message = createMockMessage({ channel: testGame.guildContext.commandChannel });
                const args = [
                    "pack", "of", "pens",
                    "containing",
                    "in",
                        "pot",
                    "of",
                        "pot", "1",
                    "at",
                        "kitchen",
                ];
                await instantiate_moderator.execute(testGame, message, "create", args, moderator);
                await testGame.messageQueue.process();
                expect(spy).not.toHaveBeenCalled();
                expect(context).toBeUndefined();
                expect(message.reply).toBeInvokedWith("TODO");
            });
        });
    });
});
