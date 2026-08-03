// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import DropAction from "../../../Data/Actions/DropAction.ts";
import UnequipAction from "../../../Data/Actions/UnequipAction.ts";
import { clearQueue } from "../../../Modules/messageHandler.js";
import { createMockMessage } from "../../__mocks__/libs/discord.js";

describe("DropAction test", () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    afterAll(async () => {
        clearQueue(game);
        vi.resetAllMocks();
        await game.entityLoader.loadInventoryItems(false);
        await game.entityLoader.loadRoomItems(false);
    });

    test("ported legacy test", async () => {
        const kyra = game.entityFinder.getPlayer("Kyra");
        const vivian = game.entityFinder.getPlayer("Vivian");
        const kyraHand = game.entityFinder.getPlayerHandHoldingItem(kyra, "MUG OF COFFEE");
        const vivianHand = game.entityFinder.getPlayerFreeHand(vivian);
        const kyraFloor = game.entityFinder.getFixture("FLOOR", kyra.location.id);
        const vivianFloor = game.entityFinder.getFixture("FLOOR", vivian.location.id);

        {
            const coffee = kyraHand.equippedItem;
            const dropAction = new DropAction(game, createMockMessage(), kyra, kyra.location, false);
            dropAction.performDrop(coffee, kyraHand, kyraFloor, null);
        }

        {
            let quiver = game.entityFinder.getInventoryItem("VIVIANS QUIVER");
            const unequipAction = new UnequipAction(game, createMockMessage(), vivian, vivian.location, false);
            unequipAction.performUnequip(quiver,game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(vivian, quiver.getIdentifier()),vivianHand);
            quiver = game.entityFinder.getInventoryItem("VIVIANS QUIVER");
            const dropAction = new DropAction(game, createMockMessage(), vivian, vivian.location, false);
            dropAction.performDrop(quiver, vivianHand, vivianFloor, null);
        }

        const coffee = game.entityFinder.getRoomItem("MUG OF COFFEE", kyra.location.id, "FIXTURE", kyraFloor.name);
        const quiver = game.entityFinder.getRoomItem("VIVIANS QUIVER", vivian.location.id, "FIXTURE", vivianFloor.name);
        const jeans = quiver.inventory.get("QUIVER").items[0];
        const ptp2 = jeans.inventory.get("RIGHT POCKET").items[0];
        const ptp3 = jeans.inventory.get("LEFT POCKET").items[0];
        const buns = ptp2.inventory.get("PACK").items[0];
        const detergent = ptp3.inventory.get("PACK").items[0];

        expect(coffee).not.toBeUndefined();
        expect(quiver).not.toBeUndefined();
        expect(jeans).not.toBeUndefined();

        expect(coffee.name).toStrictEqual("COFFEE");
        expect(coffee.pluralName).toStrictEqual("");
        expect(coffee.singleContainingPhrase).toStrictEqual("a mug of COFFEE");
        expect(coffee.pluralContainingPhrase).toStrictEqual("mugs of COFFEE");
        expect(coffee.location.id).toStrictEqual("suite-9");
        expect(coffee.accessible).toBeTruthy();
        expect(coffee.containerName).toStrictEqual("FLOOR");
        expect(coffee.container.name).toStrictEqual("FLOOR");
        expect(coffee.slot).toStrictEqual("");
        expect(coffee.quantity).toStrictEqual(1);
        expect(coffee.uses).toStrictEqual(1);
        expect(coffee.weight).toStrictEqual(3);
        expect(coffee.inventory.size).toStrictEqual(0);
        expect(coffee.row).toStrictEqual(1031);

        expect(quiver.name).toStrictEqual("QUIVER");
        expect(quiver.pluralName).toStrictEqual("QUIVERS");
        expect(quiver.singleContainingPhrase).toStrictEqual("a QUIVER");
        expect(quiver.pluralContainingPhrase).toStrictEqual("QUIVERS");
        expect(quiver.location.id).toStrictEqual("general-managers-office");
        expect(quiver.accessible).toBeTruthy();
        expect(quiver.containerName).toStrictEqual("FLOOR");
        expect(quiver.container.name).toStrictEqual("FLOOR");
        expect(quiver.slot).toStrictEqual("");
        expect(quiver.quantity).toStrictEqual(1);
        expect(isNaN(quiver.uses)).toBeTruthy();
        expect(quiver.weight).toStrictEqual(20);
        expect(quiver.inventory.size).toStrictEqual(1);
        expect(quiver.row).toStrictEqual(341);

        expect(jeans.name).toStrictEqual("WHITE JEANS");
        expect(jeans.pluralName).toStrictEqual("");
        expect(jeans.singleContainingPhrase).toStrictEqual("a pair of WHITE JEANS");
        expect(jeans.pluralContainingPhrase).toStrictEqual("pairs of WHITE JEANS");
        expect(jeans.location.id).toStrictEqual("general-managers-office");
        expect(jeans.accessible).toBeTruthy();
        expect(jeans.containerName).toStrictEqual("VIVIANS QUIVER/QUIVER");
        expect(jeans.container.name).toStrictEqual("QUIVER");
        expect(jeans.slot).toStrictEqual("QUIVER");
        expect(jeans.quantity).toStrictEqual(1);
        expect(isNaN(jeans.uses)).toBeTruthy();
        expect(jeans.weight).toStrictEqual(19);
        expect(jeans.inventory.size).toStrictEqual(4);
        expect(jeans.row).toStrictEqual(342);

        expect(ptp2.location.id).toStrictEqual("general-managers-office");
        expect(ptp2.accessible).toBeTruthy();
        expect(ptp2.containerName).toStrictEqual("WHITE JEANS 2/RIGHT POCKET");
        expect(ptp2.quantity).toStrictEqual(1);
        expect(isNaN(ptp2.uses)).toBeTruthy();
        expect(ptp2.weight).toStrictEqual(12);
        expect(ptp2.inventory.size).toStrictEqual(1);

        expect(ptp3.location.id).toStrictEqual("general-managers-office");
        expect(ptp3.accessible).toBeTruthy();
        expect(ptp3.containerName).toStrictEqual("WHITE JEANS 2/LEFT POCKET");
        expect(ptp3.quantity).toStrictEqual(1);
        expect(isNaN(ptp3.uses)).toBeTruthy();
        expect(ptp3.weight).toStrictEqual(6);
        expect(ptp3.inventory.size).toStrictEqual(1);

        expect(buns.location.id).toStrictEqual("general-managers-office");
        expect(buns.accessible).toBeTruthy();
        expect(buns.containerName).toStrictEqual("PACK OF TOILET PAPER 2/PACK");
        expect(buns.quantity).toStrictEqual(12);
        expect(buns.uses).toStrictEqual(1);
        expect(buns.weight).toStrictEqual(1);
        expect(buns.inventory.size).toStrictEqual(0);

        expect(detergent.location.id).toStrictEqual("general-managers-office");
        expect(detergent.accessible).toBeTruthy();
        expect(detergent.containerName).toStrictEqual("PACK OF TOILET PAPER 3/PACK");
        expect(detergent.quantity).toStrictEqual(1);
        expect(detergent.uses).toStrictEqual(10);
        expect(detergent.weight).toStrictEqual(6);
        expect(detergent.inventory.size).toStrictEqual(0);

        // Test that all of the item row numbers were updated properly.
        for (let i = 0; i < game.roomItems.length; i++)
            expect(game.roomItems[i].row).toStrictEqual(i + 2);

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
