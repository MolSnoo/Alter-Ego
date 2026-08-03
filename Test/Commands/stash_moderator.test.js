// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from "../../Classes/ModeratorCommand.ts";
import { usage, execute, config } from '../../Commands/stash_moderator.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";
import StashAction from '../../Data/Actions/StashAction.ts';
import { createMockModerator } from "../__mocks__/utility.ts";

describe('stash_moderator command', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        // @ts-expect-error
        moderator = createMockModerator();
    });

    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const stash_moderator = new ModeratorCommand(config, usage, execute);

    /** @type {typeof import('../../Data/Moderator.ts')} */
    let moderator;

    describe('valid invocations', () => {
        afterEach(async () => {
            await game.entityLoader.loadInventoryItems(false);
        });

        test('valid item into specified slot of equipped item', async () => {
            const player = game.entityFinder.getPlayer("Kyra");
            const hand = game.entityFinder.getPlayerHandHoldingItem(player, "mug of coffee");
            const coffee = hand.items[0];
            const jacket = game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(player, "kyras lab coat");
            /** @type {StashAction} */
            let context;
            const original = StashAction.prototype.performStash;
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            spy.mockImplementation(function (...args) {
                context = this;
                return original.apply(this, args);
            });
            // @ts-ignore
            await stash_moderator.execute(game, createMockMessage(), "stash", ["kyra's", "mug", "of", "coffee", "in", "right", "pocket", "of", "kyras", "lab", "coat"], moderator);
            expect(spy).toBeInvokedWith(coffee, hand, jacket.items[0], jacket.items[0].inventory.get("RIGHT POCKET"));
            expect(context).not.toBeUndefined();
            expect(context.player.name).toBe(player.name);
        });

        test('valid item into unspecified slot of equipped item', async () => {
            const player = game.entityFinder.getPlayer("Kyra");
            const hand = game.entityFinder.getPlayerHandHoldingItem(player, "mug of coffee");
            const coffee = hand.items[0];
            const jacket = game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(player, "kyras lab coat");
            /** @type {StashAction} */
            let context;
            const original = StashAction.prototype.performStash;
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            spy.mockImplementation(function (...args) {
                context = this;
                return original.apply(this, args);
            });
            // @ts-ignore
            await stash_moderator.execute(game, createMockMessage(), "stash", ["kyra's", "mug", "of", "coffee", "in", "kyras", "lab", "coat"], moderator);
            expect(spy).toBeInvokedWith(coffee, hand, jacket.items[0], jacket.items[0].inventory.get("RIGHT POCKET"));
            expect(context).not.toBeUndefined();
            expect(context.player.name).toBe(player.name);
        });
    });

    describe('invalid invocations', () => {
        test('valid item into invalid slot of equipped item', async () => {
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            const message = createMockMessage();
            const author = message.author;
            // @ts-ignore
            await stash_moderator.execute(game, message, "stash", ["kyra's", "mug", "of", "coffee", "in", "invalid", "pocket", "of", "kyras", "lab", "coat"], moderator);
            await sendQueuedMessages(game);
            expect(spy).not.toHaveBeenCalled();
            expect(author.send).toBeInvokedWith("Couldn't find \"POCKET\" of KYRAS LAB COAT 1.");
        });

        test('valid item into slot of invalid item', async () => {
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            const message = createMockMessage();
            const author = message.author;
            // @ts-ignore
            await stash_moderator.execute(game, message, "stash", ["kyra's", "mug", "of", "coffee", "in", "right", "pocket", "of", "kyras", "invalid", "coat"], moderator);
            await sendQueuedMessages(game);
            expect(spy).not.toHaveBeenCalled();
            expect(author.send).toBeInvokedWith("Couldn't find container item \"COAT\".");
        });

        test('valid item into unspecified slot of item without capacity', async () => {
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            const message = createMockMessage();
            const author = message.author;
            // @ts-ignore
            await stash_moderator.execute(game, message, "stash", ["kyra's", "mug", "of", "coffee", "in", "kyras", "glasses"], moderator);
            await sendQueuedMessages(game);
            expect(spy).not.toHaveBeenCalled();
            expect(author.send).toBeInvokedWith("KYRAS GLASSES cannot hold items.");
        });

        test('valid item without container', async () => {
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            const message = createMockMessage();
            const author = message.author;
            // @ts-ignore
            await stash_moderator.execute(game, message, "stash", ["kyra's", "mug", "of", "coffee"], moderator);
            await sendQueuedMessages(game);
            expect(spy).not.toHaveBeenCalled();
            expect(author.send).toBeInvokedWith(`You need to specify two items. Usage:\n${stash_moderator.usage(game.settings)}`);
        });
    });
});
