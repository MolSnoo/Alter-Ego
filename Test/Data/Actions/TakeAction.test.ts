// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import DropAction from "../../../Data/Actions/DropAction.ts";
import UnequipAction from "../../../Data/Actions/UnequipAction.ts";
import TakeAction from "../../../Data/Actions/TakeAction.ts";
import { clearQueue } from "../../../Modules/messageHandler.js";
import { createMockMessage } from "../../__mocks__/libs/discord.js";

type MockItem = {
    name?: string;
    pluralName?: string;
    singleContainingPhrase?: string;
    pluralContainingPhrase?: string;
    quantity?: number;
    uses?: number;
    weight?: number;
    size?: number;
    inventory?: { size?: number };
}

describe('TakeAction test', () => {
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
        // grab common references
        const kyra = game.entityFinder.getPlayer("Kyra");
        const hand = game.entityFinder.getPlayerHandHoldingItem(kyra, "MUG OF COFFEE");
        const floor = game.entityFinder.getFixture("FLOOR", kyra.location.id);

        // initialize repeat data
        let coffeeData: MockItem = {};
        let jacketData: MockItem = {};
        let drawerData: MockItem = {};
        let pageData: MockItem = {};

        {
            coffeeData.name = "COFFEE";
            coffeeData.pluralName = "";
            coffeeData.singleContainingPhrase = "a mug of COFFEE";
            coffeeData.pluralContainingPhrase = "mugs of COFFEE";
            coffeeData.quantity = 1;
            coffeeData.uses = 1;
            coffeeData.weight = 3;
            coffeeData.size = 2;
            coffeeData.inventory = {};
            coffeeData.inventory.size = 0;
            jacketData.name = "LAB COAT";
            jacketData.pluralName = "LAB COATS";
            jacketData.singleContainingPhrase = "a LAB COAT";
            jacketData.pluralContainingPhrase = "LAB COATS";
            jacketData.quantity = 1;
            jacketData.uses = NaN;
            jacketData.weight = 0;
            jacketData.size = 5;
            jacketData.inventory = {};
            jacketData.inventory.size = 2;
            drawerData.name = "TOP DRAWER";
            drawerData.pluralName = "TOP DRAWERS";
            drawerData.singleContainingPhrase = "a TOP DRAWER";
            drawerData.pluralContainingPhrase = "TOP DRAWERS";
            drawerData.quantity = 1;
            drawerData.uses = NaN;
            drawerData.weight = 3;
            drawerData.size = 5;
            drawerData.inventory = {};
            drawerData.inventory.size = 1;
            pageData.weight = 1;
            pageData.size = 2;
        }

        // step 1: drop item on fixture
        {
            const coffee = hand.equippedItem;
            const dropAction = new DropAction(game, createMockMessage(), kyra, kyra.location, false);
            dropAction.performDrop(coffee, hand, floor, null);
        }

        // step 1 validation
        {
            const coffee = game.entityFinder.getRoomItem("MUG OF COFFEE", kyra.location.id);
            expect(coffee).not.toBeUndefined();
            expect(coffee.name).toStrictEqual(coffeeData.name);
            expect(coffee.pluralName).toStrictEqual(coffeeData.pluralName);
            expect(coffee.singleContainingPhrase).toStrictEqual(coffeeData.singleContainingPhrase);
            expect(coffee.pluralContainingPhrase).toStrictEqual(coffeeData.pluralContainingPhrase);
            expect(coffee.quantity).toStrictEqual(coffeeData.quantity);
            expect(coffee.uses).toStrictEqual(coffeeData.uses);
            expect(coffee.weight).toStrictEqual(coffeeData.weight);
            expect(coffee.inventory.size).toStrictEqual(coffeeData.inventory.size);
        }

        // step 2: drop container item on fixture
        {
            let jacket = game.entityFinder.getInventoryItem("KYRAS LAB COAT", kyra.name);
            const unequipAction = new UnequipAction(game, createMockMessage(), kyra, kyra.location, false);
            unequipAction.performUnequip(jacket,game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(kyra, jacket.getIdentifier()),hand);
            jacket = game.entityFinder.getInventoryItem("KYRAS LAB COAT", kyra.name);
            const dropAction = new DropAction(game, createMockMessage(), kyra, kyra.location, false);
            dropAction.performDrop(jacket, hand, floor, null);
        }

        // step 2 validation
        {
            const jacket = game.entityFinder.getRoomItem("KYRAS LAB COAT", kyra.location.id);
            expect(jacket).not.toBeUndefined();
            expect(jacket.name).toStrictEqual(jacketData.name);
            expect(jacket.pluralName).toStrictEqual(jacketData.pluralName);
            expect(jacket.singleContainingPhrase).toStrictEqual(jacketData.singleContainingPhrase);
            expect(jacket.pluralContainingPhrase).toStrictEqual(jacketData.pluralContainingPhrase);
            expect(jacket.quantity).toStrictEqual(jacketData.quantity);
            expect(jacket.uses).toStrictEqual(jacketData.uses);
            expect(jacket.weight).toStrictEqual(jacketData.weight);
            expect(jacket.inventory.size).toStrictEqual(jacketData.inventory.size);
        }

        // step 3: take item from fixture
        {
            const coffee = game.entityFinder.getRoomItem("MUG OF COFFEE", kyra.location.id);
            const takeAction = new TakeAction(game, createMockMessage(), kyra, kyra.location, false);
            takeAction.performTake(coffee, hand, floor, null);
        }

        // step 3 validation
        {
            const coffee = hand.equippedItem;
            expect(coffee).not.toBeUndefined();
            expect(coffee.name).toStrictEqual(coffeeData.name);
            expect(coffee.pluralName).toStrictEqual(coffeeData.pluralName);
            expect(coffee.singleContainingPhrase).toStrictEqual(coffeeData.singleContainingPhrase);
            expect(coffee.pluralContainingPhrase).toStrictEqual(coffeeData.pluralContainingPhrase);
            expect(coffee.quantity).toStrictEqual(coffeeData.quantity);
            expect(coffee.uses).toStrictEqual(coffeeData.uses);
            expect(coffee.weight).toStrictEqual(coffeeData.weight);
            expect(coffee.inventory.size).toStrictEqual(coffeeData.inventory.size);
        }

        // step 4: drop item on container item
        {
            const coffee = hand.equippedItem;
            const jacket = game.entityFinder.getRoomItem("KYRAS LAB COAT", kyra.location.id);
            const pocket = jacket.inventory.get("RIGHT POCKET")
            const dropAction = new DropAction(game, createMockMessage(), kyra, kyra.location, false);
            dropAction.performDrop(coffee, hand, jacket, pocket);
        }

        // step 4 validation
        {
            const jacket = game.entityFinder.getRoomItem("KYRAS LAB COAT", kyra.location.id);
            expect(jacket).not.toBeUndefined();
            const coffee = game.entityFinder.getRoomItem("MUG OF COFFEE", kyra.location.id);
            expect(coffee).not.toBeUndefined();
            expect(jacket.name).toStrictEqual(jacketData.name);
            expect(jacket.pluralName).toStrictEqual(jacketData.pluralName);
            expect(jacket.singleContainingPhrase).toStrictEqual(jacketData.singleContainingPhrase);
            expect(jacket.pluralContainingPhrase).toStrictEqual(jacketData.pluralContainingPhrase);
            expect(jacket.quantity).toStrictEqual(jacketData.quantity);
            expect(jacket.uses).toStrictEqual(jacketData.uses);
            expect(jacket.weight).toStrictEqual(jacketData.weight + coffeeData.weight);
            expect(jacket.inventory.size).toStrictEqual(jacketData.inventory.size);
            expect(jacket.inventory.get("RIGHT POCKET").takenSpace).toStrictEqual(coffeeData.size);
            expect(coffee.name).toStrictEqual(coffeeData.name);
            expect(coffee.pluralName).toStrictEqual(coffeeData.pluralName);
            expect(coffee.singleContainingPhrase).toStrictEqual(coffeeData.singleContainingPhrase);
            expect(coffee.pluralContainingPhrase).toStrictEqual(coffeeData.pluralContainingPhrase);
            expect(coffee.quantity).toStrictEqual(coffeeData.quantity);
            expect(coffee.uses).toStrictEqual(coffeeData.uses);
            expect(coffee.weight).toStrictEqual(coffeeData.weight);
            expect(coffee.inventory.size).toStrictEqual(coffeeData.inventory.size);
        }

        // step 5: take container item
        {
            const jacket = game.entityFinder.getRoomItem("KYRAS LAB COAT", kyra.location.id);
            const takeAction = new TakeAction(game, createMockMessage(), kyra, kyra.location, false);
            takeAction.performTake(jacket, hand, floor, null);
        }

        // step 5 validation
        {
            const jacket = hand.equippedItem;
            expect(jacket).not.toBeUndefined();
            const coffee = jacket.inventory.get("RIGHT POCKET").items[0];
            expect(coffee).not.toBeUndefined();
            expect(jacket.name).toStrictEqual(jacketData.name);
            expect(jacket.pluralName).toStrictEqual(jacketData.pluralName);
            expect(jacket.singleContainingPhrase).toStrictEqual(jacketData.singleContainingPhrase);
            expect(jacket.pluralContainingPhrase).toStrictEqual(jacketData.pluralContainingPhrase);
            expect(jacket.quantity).toStrictEqual(jacketData.quantity);
            expect(jacket.uses).toStrictEqual(jacketData.uses);
            expect(jacket.weight).toStrictEqual(jacketData.weight + coffeeData.weight);
            expect(jacket.inventory.size).toStrictEqual(jacketData.inventory.size);
            expect(jacket.inventory.get("RIGHT POCKET").takenSpace).toStrictEqual(coffeeData.size);
            expect(coffee.name).toStrictEqual(coffeeData.name);
            expect(coffee.pluralName).toStrictEqual(coffeeData.pluralName);
            expect(coffee.singleContainingPhrase).toStrictEqual(coffeeData.singleContainingPhrase);
            expect(coffee.pluralContainingPhrase).toStrictEqual(coffeeData.pluralContainingPhrase);
            expect(coffee.quantity).toStrictEqual(coffeeData.quantity);
            expect(coffee.uses).toStrictEqual(coffeeData.uses);
            expect(coffee.weight).toStrictEqual(coffeeData.weight);
            expect(coffee.inventory.size).toStrictEqual(coffeeData.inventory.size);
        }

        // step 6: drop container item on bigger container item
        {
            const jacket = hand.equippedItem;
            const drawer = game.entityFinder.getRoomItem("TOP DRAWER 9", kyra.location.id)
            const container = drawer.inventory.get("TOP DRAWER");
            const dropAction = new DropAction(game, createMockMessage(), kyra, kyra.location, false);
            dropAction.performDrop(jacket, hand, drawer, container);
        }

        // step 6 validation
        {
            const drawer = game.entityFinder.getRoomItem("TOP DRAWER 9", kyra.location.id);
            expect(drawer).not.toBeUndefined();
            const jacket = drawer.inventory.get("TOP DRAWER").items[1];
            expect(jacket).not.toBeUndefined();
            const coffee = jacket.inventory.get("RIGHT POCKET").items[0];
            expect(coffee).not.toBeUndefined();
            expect(drawer.name).toStrictEqual(drawerData.name);
            expect(drawer.pluralName).toStrictEqual(drawerData.pluralName);
            expect(drawer.singleContainingPhrase).toStrictEqual(drawerData.singleContainingPhrase);
            expect(drawer.pluralContainingPhrase).toStrictEqual(drawerData.pluralContainingPhrase);
            expect(drawer.quantity).toStrictEqual(drawerData.quantity);
            expect(drawer.uses).toStrictEqual(drawerData.uses);
            expect(drawer.weight).toStrictEqual(drawerData.weight + jacketData.weight + coffeeData.weight + pageData.weight);
            expect(drawer.inventory.size).toStrictEqual(drawerData.inventory.size);
            expect(drawer.inventory.get("TOP DRAWER").takenSpace).toStrictEqual(jacketData.size + pageData.size);
            expect(jacket.name).toStrictEqual(jacketData.name);
            expect(jacket.pluralName).toStrictEqual(jacketData.pluralName);
            expect(jacket.singleContainingPhrase).toStrictEqual(jacketData.singleContainingPhrase);
            expect(jacket.pluralContainingPhrase).toStrictEqual(jacketData.pluralContainingPhrase);
            expect(jacket.quantity).toStrictEqual(jacketData.quantity);
            expect(jacket.uses).toStrictEqual(jacketData.uses);
            expect(jacket.weight).toStrictEqual(jacketData.weight + coffeeData.weight);
            expect(jacket.inventory.size).toStrictEqual(jacketData.inventory.size);
            expect(jacket.inventory.get("RIGHT POCKET").takenSpace).toStrictEqual(coffeeData.size);
            expect(coffee.name).toStrictEqual(coffeeData.name);
            expect(coffee.pluralName).toStrictEqual(coffeeData.pluralName);
            expect(coffee.singleContainingPhrase).toStrictEqual(coffeeData.singleContainingPhrase);
            expect(coffee.pluralContainingPhrase).toStrictEqual(coffeeData.pluralContainingPhrase);
            expect(coffee.quantity).toStrictEqual(coffeeData.quantity);
            expect(coffee.uses).toStrictEqual(coffeeData.uses);
            expect(coffee.weight).toStrictEqual(coffeeData.weight);
            expect(coffee.inventory.size).toStrictEqual(coffeeData.inventory.size);
        }

        // step 7: take bigger container item
        {
            const drawer = game.entityFinder.getRoomItem("TOP DRAWER 9", kyra.location.id);
            const nightstand = game.entityFinder.getFixture("NIGHTSTAND", "suite-9")
            const takeAction = new TakeAction(game, createMockMessage(), kyra, kyra.location, false);
            takeAction.performTake(drawer, hand, nightstand, null);
        }

        // step 7 validation
        {
            const drawer = hand.equippedItem;
            expect(drawer).not.toBeUndefined();
            const jacket = drawer.inventory.get("TOP DRAWER").items[1];
            expect(jacket).not.toBeUndefined();
            const coffee = jacket.inventory.get("RIGHT POCKET").items[0];
            expect(coffee).not.toBeUndefined();
            expect(drawer.name).toStrictEqual(drawerData.name);
            expect(drawer.pluralName).toStrictEqual(drawerData.pluralName);
            expect(drawer.singleContainingPhrase).toStrictEqual(drawerData.singleContainingPhrase);
            expect(drawer.pluralContainingPhrase).toStrictEqual(drawerData.pluralContainingPhrase);
            expect(drawer.quantity).toStrictEqual(drawerData.quantity);
            expect(drawer.uses).toStrictEqual(drawerData.uses);
            expect(drawer.weight).toStrictEqual(drawerData.weight + jacketData.weight + coffeeData.weight + pageData.weight);
            expect(drawer.inventory.size).toStrictEqual(drawerData.inventory.size);
            expect(drawer.inventory.get("TOP DRAWER").takenSpace).toStrictEqual(jacketData.size + pageData.size);
            expect(jacket.name).toStrictEqual(jacketData.name);
            expect(jacket.pluralName).toStrictEqual(jacketData.pluralName);
            expect(jacket.singleContainingPhrase).toStrictEqual(jacketData.singleContainingPhrase);
            expect(jacket.pluralContainingPhrase).toStrictEqual(jacketData.pluralContainingPhrase);
            expect(jacket.quantity).toStrictEqual(jacketData.quantity);
            expect(jacket.uses).toStrictEqual(jacketData.uses);
            expect(jacket.weight).toStrictEqual(jacketData.weight + coffeeData.weight);
            expect(jacket.inventory.size).toStrictEqual(jacketData.inventory.size);
            expect(jacket.inventory.get("RIGHT POCKET").takenSpace).toStrictEqual(coffeeData.size);
            expect(coffee.name).toStrictEqual(coffeeData.name);
            expect(coffee.pluralName).toStrictEqual(coffeeData.pluralName);
            expect(coffee.singleContainingPhrase).toStrictEqual(coffeeData.singleContainingPhrase);
            expect(coffee.pluralContainingPhrase).toStrictEqual(coffeeData.pluralContainingPhrase);
            expect(coffee.quantity).toStrictEqual(coffeeData.quantity);
            expect(coffee.uses).toStrictEqual(coffeeData.uses);
            expect(coffee.weight).toStrictEqual(coffeeData.weight);
            expect(coffee.inventory.size).toStrictEqual(coffeeData.inventory.size);
        }

        // Test that all of the item row numbers were updated properly.
        for (let i = 0; i < game.roomItems.length; i++)
            expect(game.roomItems[i].row).toStrictEqual(i + 2);

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
