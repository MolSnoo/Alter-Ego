// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import PlayerCommand from "../../Classes/PlayerCommand.ts";
import { usage, execute, config } from '../../Commands/stash_player.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";
import StashAction from '../../Data/Actions/StashAction.ts';

describe('stash_player command', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const stash_player = new PlayerCommand(config, usage, execute);

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
            await stash_player.execute(game, createMockMessage(), "stash", ["coffee", "in", "right", "pocket", "of", "lab", "coat"], player);
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
            await stash_player.execute(game, createMockMessage(), "stash", ["coffee", "in", "lab", "coat"], player);
            expect(spy).toBeInvokedWith(coffee, hand, jacket.items[0], jacket.items[0].inventory.get("RIGHT POCKET"));
            expect(context).not.toBeUndefined();
            expect(context.player.name).toBe(player.name);
        });
    });

    describe('invalid invocations', () => {
        test('valid item into invalid slot of equipped item', async () => {
            const player = game.entityFinder.getPlayer("Kyra");
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            const message = createMockMessage();
            const author = message.author;
            // @ts-ignore
            await stash_player.execute(game, message, "stash", ["coffee", "in", "invalid", "pocket", "of", "lab", "coat"], player);
            await sendQueuedMessages(game);
            expect(spy).not.toHaveBeenCalled();
            expect(author.send).toBeInvokedWith("Couldn't find \"POCKET\" of LAB COAT.");
        });

        test('valid item into slot of invalid item', async () => {
            const player = game.entityFinder.getPlayer("Kyra");
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            const message = createMockMessage();
            const author = message.author;
            // @ts-ignore
            await stash_player.execute(game, message, "stash", ["coffee", "in", "right", "pocket", "of", "invalid", "coat"], player);
            await sendQueuedMessages(game);
            expect(spy).not.toHaveBeenCalled();
            expect(author.send).toBeInvokedWith("Couldn't find container item \"COAT\".");
        });

        test('valid item into unspecified slot of item without capacity', async () => {
            const player = game.entityFinder.getPlayer("Kyra");
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            const message = createMockMessage();
            const author = message.author;
            // @ts-ignore
            await stash_player.execute(game, message, "stash", ["coffee", "in", "glasses"], player);
            await sendQueuedMessages(game);
            expect(spy).not.toHaveBeenCalled();
            expect(author.send).toBeInvokedWith("GLASSES cannot hold items. Contact a moderator if you believe this is a mistake.");
        });

        test('valid item without container', async () => {
            const player = game.entityFinder.getPlayer("Kyra");
            const spy = vi.spyOn(StashAction.prototype, "performStash");
            const message = createMockMessage();
            const author = message.author;
            // @ts-ignore
            await stash_player.execute(game, message, "stash", ["coffee"], player);
            await sendQueuedMessages(game);
            expect(spy).not.toHaveBeenCalled();
            expect(author.send).toBeInvokedWith(`You need to specify two items. Usage:\n${stash_player.usage(game.settings)}`);
        });
    });
});
