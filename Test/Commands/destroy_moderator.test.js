// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from '../../Classes/ModeratorCommand.ts';
import { usage, execute, config } from '../../Commands/destroy_moderator.js'
import DestroyInventoryItemAction from '../../Data/Actions/DestroyInventoryItemAction.ts';
import { clearQueue, sendQueuedMessages } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';
import { createMockModerator } from '../__mocks__/utility.ts';

describe('destroy_moderator command', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        // @ts-expect-error
        moderator = createMockModerator();
    });

    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const destroy_moderator = new ModeratorCommand(config, usage, execute);

    /** @type {typeof import('../../Data/Moderator.ts')} */
    let moderator;

    describe('on inventory items', () => {
        describe('shallow nested', () => {
            describe('valid invocations', () => {
                afterEach(async () => {
                    await game.entityLoader.loadInventoryItems(false);
                });

                test('given player hand with item', async () => {
                    const player = game.entityFinder.getPlayer("Kyra");
                    const item = game.entityFinder.getInventoryItem("mug of coffee", "Kyra");
                    /** @type {DestroyInventoryItemAction} */
                    let context;
                    const original = DestroyInventoryItemAction.prototype.performDestroyInventoryItem;
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    spy.mockImplementation(function (...args) {
                        context = this;
                        return original.apply(this, args);
                    });
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["kyra's", "right", "hand"], moderator);
                    expect(spy).toBeInvokedWith(item, item.quantity, true, true);
                    expect(context).not.toBeUndefined();
                    expect(context.player.name).toBe(player.name);
                });
                test('given player item', async () => {
                    const player = game.entityFinder.getPlayer("Kyra");
                    const item = game.entityFinder.getInventoryItem("mug of coffee", "Kyra");
                    /** @type {DestroyInventoryItemAction} */
                    let context;
                    const original = DestroyInventoryItemAction.prototype.performDestroyInventoryItem;
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    spy.mockImplementation(function (...args) {
                        context = this;
                        return original.apply(this, args);
                    });
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["kyra's", "mug", "of", "coffee"], moderator);
                    expect(spy).toBeInvokedWith(item, item.quantity, true, true);
                    expect(context).not.toBeUndefined();
                    expect(context.player.name).toBe(player.name);
                });
                test('given player all in container', async () => {
                    const player = game.entityFinder.getPlayer("Kyra");
                    const items = game.entityFinder.getInventoryItems(null, "Kyra", "kyras pants");
                    /** @type {DestroyInventoryItemAction[]} */
                    let contexts = [];
                    const original = DestroyInventoryItemAction.prototype.performDestroyInventoryItem;
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    spy.mockImplementation(function (...args) {
                        contexts.push(this);
                        return original.apply(this, args);
                    });
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["all", "in", "kyra's", "kyras", "pants"], moderator);
                    expect(spy).toHaveBeenCalledTimes(items.length);
                    for (const context of contexts) {
                        expect(context.player.name).toBe(player.name);
                    }
                });
                test('given player all in container slot', async () => {
                    const player = game.entityFinder.getPlayer("Kyra");
                    const items = game.entityFinder.getInventoryItems(null, "Kyra", "kyras pants", "right pocket");
                    /** @type {DestroyInventoryItemAction[]} */
                    let contexts = [];
                    const original = DestroyInventoryItemAction.prototype.performDestroyInventoryItem;
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    spy.mockImplementation(function (...args) {
                        contexts.push(this);
                        return original.apply(this, args);
                    });
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["all", "in", "kyra's", "right", "pocket", "of", "kyras", "pants"], moderator);
                    expect(spy).toHaveBeenCalledTimes(items.length);
                    for (const context of contexts) {
                        expect(context.player.name).toBe(player.name);
                    }
                });
                test('given player item in container', async () => {
                    const player = game.entityFinder.getPlayer("Kyra");
                    const item = game.entityFinder.getInventoryItem("master key", "Kyra");
                    const quantity = item.quantity;
                    /** @type {DestroyInventoryItemAction} */
                    let context;
                    const original = DestroyInventoryItemAction.prototype.performDestroyInventoryItem;
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    spy.mockImplementation(function (...args) {
                        context = this;
                        return original.apply(this, args);
                    });
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["master", "key", "in", "kyra's", "kyras", "pants"], moderator);
                    expect(spy).toBeInvokedWith(item, quantity, true);
                    expect(context).not.toBeUndefined();
                    expect(context.player.name).toBe(player.name);
                });
                test('given player item in container slot', async () => {
                    const player = game.entityFinder.getPlayer("Kyra");
                    const item = game.entityFinder.getInventoryItem("master key", "Kyra");
                    const quantity = item.quantity;
                    /** @type {DestroyInventoryItemAction} */
                    let context;
                    const original = DestroyInventoryItemAction.prototype.performDestroyInventoryItem;
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    spy.mockImplementation(function (...args) {
                        context = this;
                        return original.apply(this, args);
                    });
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["master", "key", "in", "kyra's", "right", "pocket", "of", "kyras", "pants"], moderator);
                    expect(spy).toBeInvokedWith(item, quantity, true);
                    expect(context).not.toBeUndefined();
                    expect(context.player.name).toBe(player.name);
                });
            });
            describe('invalid invocations', () => {
                test('given player all in equipment slot', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["all", "in", "kyra's", "right", "hand"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    //expect(author.send).toBeInvokedWith("The \"all\" argument cannot be used when the container is an equipment slot.") // TODO: not called?
                });
                /*test('given player all when ???', async () => {
                    const spy = vi.spyOn(DestroyAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["all", "in", "kyra's", "mug", "of", "coffee"]);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("The \"all\" argument cannot be used when the container is an equipped item.")
                });*/ // TODO: what conditions trigger this?
                test('given player hand without item', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["kyra's", "left", "hand"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Cannot destroy item equipped to LEFT HAND because nothing is equipped to it.");
                });
                test('given nonexistent item', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["kyra's", "INVALID", "ITEM"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find \"INVALID ITEM\" in Kyra's inventory.");
                });
                test('given nonexistent item in nonexistent container', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["INVALID", "ITEM", "in", "kyra's", "INVALID", "CONTAINER"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find \"INVALID ITEM IN INVALID CONTAINER\" in Kyra's inventory.");
                });
                test('given nonexistent item in existent container', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["INVALID", "ITEM", "in", "kyra's", "kyras", "pants"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find item \"INVALID ITEM\" in RIGHT POCKET of KYRAS PANTS 1 in Kyra's inventory.");
                });
                test('given nonexistent item in nonexistent container nonexistent slot', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["INVALID", "ITEM", "in", "kyra's", "INVALID", "SLOT", "of", "INVALID", "CONTAINER"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find \"INVALID ITEM IN INVALID SLOT OF INVALID CONTAINER\" in Kyra's inventory.");
                });
                test('given nonexistent item in nonexistent container existent slot', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["INVALID", "ITEM", "in", "kyra's", "right", "pocket", "of", "INVALID", "CONTAINER"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find \"INVALID ITEM IN RIGHT POCKET OF INVALID CONTAINER\" in Kyra's inventory.");
                });
                test('given nonexistent item in existent container nonexistent slot', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["INVALID", "ITEM", "in", "kyra's", "INVALID", "SLOT", "of", "kyras", "pants"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find \"INVALID SLOT\" of KYRAS PANTS 1.");
                });
                test('given nonexistent item in existent container existent slot', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["INVALID", "ITEM", "in", "kyra's", "right", "pocket", "of", "kyras", "pants"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find item \"INVALID ITEM\" in RIGHT POCKET of KYRAS PANTS 1 in Kyra's inventory.");
                });
                test('given existent item in nonexistent container', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["master", "key", "in", "kyra's", "INVALID", "CONTAINER"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find \"MASTER KEY IN INVALID CONTAINER\" in Kyra's inventory.");
                });
                test('given existent item in nonexistent container nonexistent slot', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["master", "key", "in", "kyra's", "INVALID", "SLOT", "of", "INVALID", "CONTAINER"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find \"MASTER KEY IN INVALID SLOT OF INVALID CONTAINER\" in Kyra's inventory.");
                });
                test('given existent item in nonexistent container existent slot', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["master", "key", "in", "kyra's", "right", "pocket", "of", "INVALID", "CONTAINER"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find \"MASTER KEY IN RIGHT POCKET OF INVALID CONTAINER\" in Kyra's inventory.");
                });
                test('given existent item in existent container nonexistent slot', async () => {
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    const message = createMockMessage();
                    const author = message.author;
                    // @ts-ignore
                    await destroy_moderator.execute(game, message, "destroy", ["master", "key", "in", "kyra's", "INVALID", "SLOT", "of", "kyras", "pants"], moderator);
                    await sendQueuedMessages(game);
                    expect(spy).not.toHaveBeenCalled();
                    expect(author.send).toBeInvokedWith("Couldn't find \"INVALID SLOT\" of KYRAS PANTS 1.");
                });
            });
        });
        describe('deep nested', () => {
            describe('valid invocations', () => {
                afterEach(async () => {
                    await game.entityLoader.loadInventoryItems(false);
                });

                test('given deep-nested player item', async () => {
                    const player = game.entityFinder.getPlayer("Vivian");
                    const item = game.entityFinder.getInventoryItem("hamburger bun", "Vivian");
                    const quantity = item.quantity;
                    /** @type {DestroyInventoryItemAction} */
                    let context;
                    const original = DestroyInventoryItemAction.prototype.performDestroyInventoryItem;
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    spy.mockImplementation(function (...args) {
                        context = this;
                        return original.apply(this, args);
                    });
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["vivian's", "hamburger", "bun"], moderator);
                    expect(spy).toBeInvokedWith(item, quantity, true);
                    expect(context).not.toBeUndefined();
                    expect(context.player.name).toBe(player.name);
                });
                test('given deep-nested player item on container', async () => {
                    const player = game.entityFinder.getPlayer("Vivian");
                    const item = game.entityFinder.getInventoryItem("hamburger bun", "Vivian");
                    const quantity = item.quantity;
                    /** @type {DestroyInventoryItemAction} */
                    let context;
                    const original = DestroyInventoryItemAction.prototype.performDestroyInventoryItem;
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    spy.mockImplementation(function (...args) {
                        context = this;
                        return original.apply(this, args);
                    });
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["hamburger", "bun", "in", "vivian's", "pack", "of", "toilet", "paper"], moderator);
                    expect(spy).toBeInvokedWith(item, quantity, true);
                    expect(context).not.toBeUndefined();
                    expect(context.player.name).toBe(player.name);
                });
                test('given deep-nested player item on container slot', async () => {
                    const player = game.entityFinder.getPlayer("Vivian");
                    const item = game.entityFinder.getInventoryItem("hamburger bun", "Vivian");
                    const quantity = item.quantity;
                    /** @type {DestroyInventoryItemAction} */
                    let context;
                    const original = DestroyInventoryItemAction.prototype.performDestroyInventoryItem;
                    const spy = vi.spyOn(DestroyInventoryItemAction.prototype, "performDestroyInventoryItem");
                    spy.mockImplementation(function (...args) {
                        context = this;
                        return original.apply(this, args);
                    });
                    // @ts-ignore
                    await destroy_moderator.execute(game, createMockMessage(), "destroy", ["hamburger", "bun", "in", "vivian's", "pack", "of", "pack", "of", "toilet", "paper"], moderator);
                    expect(spy).toBeInvokedWith(item, quantity, true);
                    expect(context).not.toBeUndefined();
                    expect(context.player.name).toBe(player.name);
                });
            });
        });
    });

    /*describe('on room items', () => {
        describe('valid invocations', () => {
            afterEach(async () => {
                await game.entityLoader.loadRoomItems(false);
            });
        });
        describe('invalid invocations', () => {

        })
    });*/ // TODO
});
