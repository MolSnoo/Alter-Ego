// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import TakeAction from '../../../Data/Actions/TakeAction.ts';
import StashAction from '../../../Data/Actions/StashAction.ts';
import RoomItem from '../../../Data/RoomItem.ts';
import { clearQueue } from '../../../Modules/messageHandler.js';
import { createMockMessage } from '../../__mocks__/libs/discord.js';

describe('StashAction test', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    afterAll(async () => {
        clearQueue(game);
        vi.resetAllMocks();
        await game.entityLoader.loadInventoryItems(false);
        await game.entityLoader.loadRoomItems(false);
    });

    test('ported legacy test', async () => {
        const kyra = game.entityFinder.getLivingPlayer("Kyra");
        const hand = game.entityFinder.getPlayerFreeHand(kyra);
        const labCoat = game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(kyra, "KYRAS LAB COAT").equippedItem;
        const rightPocket = labCoat.inventory.get("RIGHT POCKET");
        const leftPocket = labCoat.inventory.get("LEFT POCKET");

        let roomItem = game.entityFinder.getRoomItem("LAMBS FROM HELL PAGE NINE", "suite-9");
        let takeAction = new TakeAction(game, createMockMessage(), kyra, kyra.location, false);
        takeAction.performTake(roomItem, hand, roomItem.container, roomItem.container instanceof RoomItem ? roomItem.container.inventory.get(roomItem.slot) : null);
        let handItem = hand.equippedItem;
        let stashAction = new StashAction(game, createMockMessage(), kyra, kyra.location, false);
        stashAction.performStash(handItem, hand, labCoat, rightPocket);

        roomItem = game.entityFinder.getRoomItem("9 BALL", "suite-9");
        takeAction = new TakeAction(game, createMockMessage(), kyra, kyra.location, false);
        takeAction.performTake(roomItem, hand, roomItem.container, null);
        handItem = hand.equippedItem;
        stashAction = new StashAction(game, createMockMessage(), kyra, kyra.location, false);
        stashAction.performStash(handItem, hand, labCoat, leftPocket);

        // Test that all of the data was converted properly.
        expect(labCoat.name).toStrictEqual("LAB COAT");
        expect(labCoat.weight).toStrictEqual(labCoat.inventory.reduce((weight, slot) => weight + slot.items.reduce((innerWeight, item) => innerWeight + item.weight, 0), 0));
        expect(labCoat.prefab.size).toStrictEqual(5);
        expect(labCoat.inventory.reduce((count, slot) => count + slot.items.length, 0));
        expect(rightPocket.items[0].name).toStrictEqual("LAMBS FROM HELL PAGE NINE");
        expect(rightPocket.items[0].pluralName).toStrictEqual("");
        expect(rightPocket.items[0].singleContainingPhrase).toStrictEqual("LAMBS FROM HELL PAGE NINE");
        expect(rightPocket.items[0].pluralContainingPhrase).toStrictEqual("");
        expect(rightPocket.items[0].equipmentSlot).toStrictEqual("JACKET");
        expect(rightPocket.items[0].containerName).toStrictEqual("KYRAS LAB COAT 1/RIGHT POCKET");
        expect(rightPocket.items[0].container.name).toStrictEqual("LAB COAT");
        expect(rightPocket.items[0].slot).toStrictEqual("RIGHT POCKET");
        expect(rightPocket.items[0].quantity).toStrictEqual(1);
        expect(isNaN(rightPocket.items[0].uses)).toBeTruthy();
        expect(rightPocket.items[0].weight).toStrictEqual(1);
        expect(rightPocket.items[0].prefab.size).toStrictEqual(2);
        expect(rightPocket.items[0].inventory.size).toStrictEqual(0);
        expect(rightPocket.items[0].row).toStrictEqual(17);
        expect(leftPocket.items[0].name).toStrictEqual("9 BALL");
        expect(leftPocket.items[0].pluralName).toStrictEqual("");
        expect(leftPocket.items[0].singleContainingPhrase).toStrictEqual("a BILLIARD BALL");
        expect(leftPocket.items[0].pluralContainingPhrase).toStrictEqual("BILLIARD BALLS");
        expect(leftPocket.items[0].equipmentSlot).toStrictEqual("JACKET");
        expect(leftPocket.items[0].containerName).toStrictEqual("KYRAS LAB COAT 1/LEFT POCKET");
        expect(leftPocket.items[0].container.name).toStrictEqual("LAB COAT");
        expect(leftPocket.items[0].slot).toStrictEqual("LEFT POCKET");
        expect(leftPocket.items[0].quantity).toStrictEqual(1);
        expect(isNaN(leftPocket.items[0].uses)).toBeTruthy();
        expect(leftPocket.items[0].weight).toStrictEqual(1);
        expect(leftPocket.items[0].prefab.size).toStrictEqual(2);
        expect(leftPocket.items[0].inventory.size).toStrictEqual(0);
        expect(leftPocket.items[0].row).toStrictEqual(18);

        // Test that all of the inventoryItem row numbers were updated properly.
        for (let i = 0; i < game.inventoryItems.length; i++)
            expect(game.inventoryItems[i].row).toStrictEqual(i + 2);

        // Test that all of the inventoryItems and Player inventory items have the same row numbers.
        for (const slot of kyra.inventory.values()) {
            for (const item of slot.items) {
                const match = game.inventoryItems.find(item => item.player.id === kyra.id && (item.prefab === null && item.prefab === null || item.prefab !== null && item.prefab !== null && item.prefab.id === item.prefab.id) && item.equipmentSlot === item.equipmentSlot && item.containerName === item.containerName);
                expect(match !== null && match !== undefined).toBeTruthy();
                expect(item.row === match.row);
            }
        }
    });
});
