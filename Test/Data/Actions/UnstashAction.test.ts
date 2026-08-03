// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import UnstashAction from '../../../Data/Actions/UnstashAction.ts';
import { clearQueue } from '../../../Modules/messageHandler.js';
import { createMockMessage } from '../../__mocks__/libs/discord.js';

describe('UnstashAction test', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    afterAll(async () => {
        clearQueue(game);
        vi.resetAllMocks();
        await game.entityLoader.loadInventoryItems(false);
    });

    test('ported legacy test', async () => {
        const vivian = game.entityFinder.getLivingPlayer("Vivian");
        const hand = game.entityFinder.getPlayerFreeHand(vivian);
        let toiletPaperPack = game.entityFinder.getInventoryItem("PACK OF TOILET PAPER 2", "Vivian", "WHITE JEANS 2/RIGHT POCKET", "BAG");
        const quiver = game.entityFinder.getInventoryItem("VIVIANS QUIVER", "Vivian")
        expect(quiver.weight).toStrictEqual(20);
        const unstashAction = new UnstashAction(game, createMockMessage(), vivian, vivian.location, false);
        unstashAction.performUnstash(toiletPaperPack, hand, toiletPaperPack.container, toiletPaperPack.container.inventory.get(toiletPaperPack.slot));

        // Test that all of the data was converted properly.
        toiletPaperPack = hand.equippedItem;
        expect(toiletPaperPack).not.toBeNull();
        expect(quiver.weight).toStrictEqual(8);
        const buns = toiletPaperPack.inventory.get("PACK").items[0];
        expect(toiletPaperPack.name).toStrictEqual("PACK OF TOILET PAPER");
        expect(buns.name).toStrictEqual("HAMBURGER BUN");
        expect(toiletPaperPack.pluralName).toStrictEqual("PACKS OF TOILET PAPER");
        expect(buns.pluralName).toStrictEqual("HAMBURGER BUNS");
        expect(toiletPaperPack.singleContainingPhrase).toStrictEqual("a PACK OF TOILET PAPER");
        expect(buns.singleContainingPhrase).toStrictEqual("a HAMBURGER BUN");
        expect(toiletPaperPack.pluralContainingPhrase).toStrictEqual("PACKS OF TOILET PAPER");
        expect(buns.pluralContainingPhrase).toStrictEqual("HAMBURGER BUNS");
        expect(toiletPaperPack.equipmentSlot).toStrictEqual(hand.id);
        expect(buns.equipmentSlot).toStrictEqual(hand.id);
        expect(toiletPaperPack.containerName).toStrictEqual("");
        expect(buns.containerName).toStrictEqual("PACK OF TOILET PAPER 2/PACK");
        expect(toiletPaperPack.container).toBeNull();
        expect(buns.container.name).toStrictEqual("PACK OF TOILET PAPER");
        expect(toiletPaperPack.slot).toStrictEqual("");
        expect(buns.slot).toStrictEqual("PACK");
        expect(toiletPaperPack.quantity).toStrictEqual(1);
        expect(buns.quantity).toStrictEqual(12);
        expect(isNaN(toiletPaperPack.uses)).toBeTruthy();
        expect(buns.uses).toStrictEqual(1);
        expect(toiletPaperPack.weight).toStrictEqual(12);
        expect(buns.weight).toStrictEqual(1);
        expect(toiletPaperPack.inventory.size).toStrictEqual(1);
        expect(buns.inventory.size).toStrictEqual(0);
        expect(toiletPaperPack.row).toStrictEqual(18);
        expect(buns.row).toStrictEqual(33);

        // Test that all of the inventoryItem row numbers were updated properly.
        for (let i = 0; i < game.inventoryItems.length; i++)
            expect(game.inventoryItems[i].row).toStrictEqual(i + 2);

        // Test that all of the inventoryItems and Player inventory items have the same row numbers.
        for (const slot of vivian.inventory.values()) {
            for (const item of slot.items) {
                const match = game.inventoryItems.find(item => item.player.id === vivian.id && (item.prefab === null && item.prefab === null || item.prefab !== null && item.prefab !== null && item.prefab.id === item.prefab.id) && item.equipmentSlot === item.equipmentSlot && item.containerName === item.containerName);
                expect(match !== null && match !== undefined).toBeTruthy();
                expect(item.row === match.row);
            }
        }
    });
});
