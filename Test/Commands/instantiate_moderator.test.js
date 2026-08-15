// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from '../../Classes/ModeratorCommand.ts';
import { usage, execute, config } from '../../Commands/instantiate_moderator.js'
import InstantiateInventoryItemAction from '../../Data/Actions/InstantiateInventoryItemAction.ts';
import { clearQueue } from '../../Modules/messageHandler.ts';
import { createMockMessage } from '../__mocks__/libs/discord.js';
import { createMockModerator } from '../__mocks__/utility.ts';

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

    test('valid item into player hand', async () => {
        const kyra = testGame.entityFinder.getPlayer("Kyra");
        const coffee = testGame.entityFinder.getPrefab("mug of coffee");
        /** @type {InstantiateInventoryItemAction} */
        let context;
        const original = InstantiateInventoryItemAction.prototype.performInstantiateInventoryItem;
        const spy = vi.spyOn(InstantiateInventoryItemAction.prototype, "performInstantiateInventoryItem");
        spy.mockImplementation(function (...args) {
            // @ts-expect-error
            context = this;
            // @ts-expect-error
            return original.apply(this, args);
        });
        // @ts-ignore
        await instantiate_moderator.execute(testGame, createMockMessage(), "create", ["mug", "of", "coffee", "in", "kyra's", "left", "hand"], moderator);
        expect(spy).toBeInvokedWith(coffee, "LEFT HAND", null, "", 1, new Map(), coffee.uses, []);
        expect(context).not.toBeUndefined();
        expect(context.player.name).toBe(kyra.name);
    });

    test('valid item containing pens into player hand', async () => {
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
        /** @type {InstantiateInventoryItemAction} */
        let context;
        const original = InstantiateInventoryItemAction.prototype.performInstantiateInventoryItem;
        const spy = vi.spyOn(InstantiateInventoryItemAction.prototype, "performInstantiateInventoryItem");
        spy.mockImplementation(function (...args) {
            // @ts-expect-error
            context = this;
            // @ts-expect-error
            return original.apply(this, args);
        });
        // @ts-ignore
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
});
