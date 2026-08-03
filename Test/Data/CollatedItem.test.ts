// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import CollatedItem from "../../Data/CollatedItem.ts";
import type Fixture from "../../Data/Fixture.ts";
import type RoomItem from "../../Data/RoomItem.ts";

describe('CollatedItem test', () => {
	beforeAll(async () => {
		if (!game.inProgress) await game.entityLoader.loadAll();
	});

	describe('test collate method', () => {
		test('collate items on canteen BURNER 1', () => {
			const burner1 = game.entityFinder.getFixture("BURNER 1", "canteen");
			const items = CollatedItem.collate(burner1.getContainedItems());
			expect(items.length).toBe(7);
			const butter = items[0];
			const chickenBroth = items[1];
			const cookingSherry = items[2];
			const dicedOnions = items[3];
			const pan = items[4];
			const potOfRice = items[5];
			const shreddedCheese = items[6];
			expect(butter.prefab.id).toBe("BUTTER");
			expect(butter.quantity).toBe(1);
			expect(butter.uses).toBe(6);
			expect(chickenBroth.prefab.id).toBe("CHICKEN BROTH");
			expect(chickenBroth.quantity).toBe(1);
			expect(chickenBroth.uses).toBeNaN();
			expect(cookingSherry.prefab.id).toBe("COOKING SHERRY");
			expect(cookingSherry.quantity).toBe(1);
			expect(cookingSherry.uses).toBe(10);
			expect(dicedOnions.prefab.id).toBe("DICED ONIONS");
			expect(dicedOnions.quantity).toBe(1);
			expect(dicedOnions.uses).toBeNaN();
			expect(pan.prefab.id).toBe("PAN");
			expect(pan.quantity).toBe(1);
			expect(pan.uses).toBeNaN();
			expect(potOfRice.prefab.id).toBe("POT OF RICE");
			expect(potOfRice.quantity).toBe(1);
			expect(potOfRice.uses).toBe(3);
			expect(shreddedCheese.prefab.id).toBe("SHREDDED CHEESE");
			expect(shreddedCheese.quantity).toBe(1);
			expect(shreddedCheese.uses).toBeNaN();
		});

		test('collate items on canteen BURNER 2', () => {
			const burner2 = game.entityFinder.getFixture("BURNER 2", "canteen");
			const items = CollatedItem.collate(burner2.getContainedItems());
			expect(items.length).toBe(7);
			const butter = items[0];
			const chickenBroth = items[1];
			const cookingSherry = items[2];
			const dicedOnions = items[3];
			const pan = items[4];
			const potOfRice = items[5];
			const shreddedCheese = items[6];
			expect(butter.prefab.id).toBe("BUTTER");
			expect(butter.quantity).toBe(3);
			expect(butter.uses).toBe(6);
			expect(chickenBroth.prefab.id).toBe("CHICKEN BROTH");
			expect(chickenBroth.quantity).toBe(1);
			expect(chickenBroth.uses).toBeNaN();
			expect(cookingSherry.prefab.id).toBe("COOKING SHERRY");
			expect(cookingSherry.quantity).toBe(1);
			expect(cookingSherry.uses).toBe(10);
			expect(dicedOnions.prefab.id).toBe("DICED ONIONS");
			expect(dicedOnions.quantity).toBe(1);
			expect(dicedOnions.uses).toBeNaN();
			expect(pan.prefab.id).toBe("PAN");
			expect(pan.quantity).toBe(1);
			expect(pan.uses).toBeNaN();
			expect(potOfRice.prefab.id).toBe("POT OF RICE");
			expect(potOfRice.quantity).toBe(1);
			expect(potOfRice.uses).toBe(3);
			expect(shreddedCheese.prefab.id).toBe("SHREDDED CHEESE");
			expect(shreddedCheese.quantity).toBe(2);
			expect(shreddedCheese.uses).toBeNaN();
		});

		test('collate items on canteen BURNER 3', () => {
			const burner3 = game.entityFinder.getFixture("BURNER 3", "canteen");
			const items = CollatedItem.collate(burner3.getContainedItems());
			expect(items.length).toBe(7);
			const butter = items[0];
			const chickenBroth = items[1];
			const cookingSherry = items[2];
			const dicedOnions = items[3];
			const pan = items[4];
			const potOfRice = items[5];
			const shreddedCheese = items[6];
			expect(butter.prefab.id).toBe("BUTTER");
			expect(butter.quantity).toBe(3);
			expect(butter.uses).toBe(13);
			expect(chickenBroth.prefab.id).toBe("CHICKEN BROTH");
			expect(chickenBroth.quantity).toBe(2);
			expect(chickenBroth.uses).toBeNaN();
			expect(cookingSherry.prefab.id).toBe("COOKING SHERRY");
			expect(cookingSherry.quantity).toBe(2);
			expect(cookingSherry.uses).toBe(20);
			expect(dicedOnions.prefab.id).toBe("DICED ONIONS");
			expect(dicedOnions.quantity).toBe(2);
			expect(dicedOnions.uses).toBeNaN();
			expect(pan.prefab.id).toBe("PAN");
			expect(pan.quantity).toBe(2);
			expect(pan.uses).toBeNaN();
			expect(potOfRice.prefab.id).toBe("POT OF RICE");
			expect(potOfRice.quantity).toBe(2);
			expect(potOfRice.uses).toBe(6);
			expect(shreddedCheese.prefab.id).toBe("SHREDDED CHEESE");
			expect(shreddedCheese.quantity).toBe(2);
			expect(shreddedCheese.uses).toBeNaN();
		});

		test('collate items on canteen BURNER 4', () => {
			const burner4 = game.entityFinder.getFixture("BURNER 4", "canteen");
			const items = CollatedItem.collate(burner4.getContainedItems());
			expect(items.length).toBe(7);
			const butter = items[0];
			const chickenBroth = items[1];
			const cookingSherry = items[2];
			const dicedOnions = items[3];
			const pan = items[4];
			const potOfRice = items[5];
			const shreddedCheese = items[6];
			expect(butter.prefab.id).toBe("BUTTER");
			expect(butter.quantity).toBe(4);
			expect(butter.uses).toBe(24);
			expect(chickenBroth.prefab.id).toBe("CHICKEN BROTH");
			expect(chickenBroth.quantity).toBe(2);
			expect(chickenBroth.uses).toBeNaN();
			expect(cookingSherry.prefab.id).toBe("COOKING SHERRY");
			expect(cookingSherry.quantity).toBe(3);
			expect(cookingSherry.uses).toBeNaN();
			expect(dicedOnions.prefab.id).toBe("DICED ONIONS");
			expect(dicedOnions.quantity).toBe(2);
			expect(dicedOnions.uses).toBeNaN();
			expect(pan.prefab.id).toBe("PAN");
			expect(pan.quantity).toBe(2);
			expect(pan.uses).toBeNaN();
			expect(potOfRice.prefab.id).toBe("POT OF RICE");
			expect(potOfRice.quantity).toBe(2);
			expect(potOfRice.uses).toBe(6);
			expect(shreddedCheese.prefab.id).toBe("SHREDDED CHEESE");
			expect(shreddedCheese.quantity).toBe(4);
			expect(shreddedCheese.uses).toBeNaN();
		});

		test('collate items in video room SINK 1', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			expect(items.length).toBe(2);
			const detergent = items[0];
			const dirtyPlate = items[1];
			expect(detergent.prefab.id).toBe("DETERGENT");
			expect(detergent.quantity).toBe(4);
			expect(detergent.uses).toBe(13);
			expect(dirtyPlate.prefab.id).toBe("DIRTY PLATE");
			expect(dirtyPlate.quantity).toBe(20);
			expect(dirtyPlate.uses).toBeNaN();
		});

		test('collate items in video room SINK 2', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			expect(items.length).toBe(2);
			const detergent = items[0];
			const dirtyPlate = items[1];
			expect(detergent.prefab.id).toBe("DETERGENT");
			expect(detergent.quantity).toBe(2);
			expect(detergent.uses).toBe(20);
			expect(dirtyPlate.prefab.id).toBe("DIRTY PLATE");
			expect(dirtyPlate.quantity).toBe(19);
			expect(dirtyPlate.uses).toBeNaN();
		});

        test('collate items in video room KILN 3', () => {
            const kiln = game.entityFinder.getFixture("KILN 3", "video-room");
            const items = CollatedItem.collate(kiln.getContainedItems());
            expect(items).toBeLength(2);
            const wetClayPot1 = items[0];
            const wetClayPot2 = items[1];
            const proceduralSelections1 = new Map([
                ["base color", "red"],
                ["quality", "terrible"]
            ]);
            const proceduralSelections2 = new Map([
                ["base color", "white"],
                ["quality", "excellent"]
            ]);
            expect(wetClayPot1.proceduralSelections).toEqual(proceduralSelections1);
            expect(wetClayPot2.proceduralSelections).toEqual(proceduralSelections2);
        });
	});

	describe('test decreaseUses method', () => {
		afterEach(async () => {
			await game.entityLoader.loadRoomItems(false);
		});

		test('decrease uses of detergent in video room SINK 1 by 1', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(1);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(4);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			const detergent3 = newItems[3];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent3.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent2.quantity).toBe(1);
			expect(detergent3.quantity).toBe(1);
			expect(detergent1.uses).toBe(4);
			expect(detergent2.uses).toBe(3);
			expect(detergent3.uses).toBe(1);
		});

		test('decrease uses of detergent in video room SINK 1 by 2', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(2);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(4);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			const detergent3 = newItems[3];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent3.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(2);
			expect(detergent2.quantity).toBe(1);
			expect(detergent3.quantity).toBe(1);
			expect(detergent1.uses).toBe(4);
			expect(detergent2.uses).toBe(3);
			expect(detergent3.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 1 by 3', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(3);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(4);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			const detergent3 = newItems[3];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent3.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(2);
			expect(detergent2.quantity).toBe(1);
			expect(detergent3.quantity).toBe(1);
			expect(detergent1.uses).toBe(4);
			expect(detergent2.uses).toBe(2);
			expect(detergent3.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 1 by 4', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(4);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(4);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			const detergent3 = newItems[3];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent3.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(2);
			expect(detergent2.quantity).toBe(1);
			expect(detergent3.quantity).toBe(1);
			expect(detergent1.uses).toBe(4);
			expect(detergent2.uses).toBe(1);
			expect(detergent3.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 1 by 5', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(5);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(2);
			expect(detergent2.quantity).toBe(2);
			expect(detergent1.uses).toBe(4);
			expect(detergent2.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 1 by 6', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(6);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(4);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			const detergent3 = newItems[3];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent3.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(2);
			expect(detergent3.quantity).toBe(1);
			expect(detergent1.uses).toBe(3);
			expect(detergent2.uses).toBeNaN();
			expect(detergent3.uses).toBe(4);
		});

		test('decrease uses of detergent in video room SINK 1 by 7', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(7);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(2);
			expect(detergent2.quantity).toBe(2);
			expect(detergent1.uses).toBe(3);
			expect(detergent2.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 1 by 8', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(8);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(4);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			const detergent3 = newItems[3];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent3.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(2);
			expect(detergent3.quantity).toBe(1);
			expect(detergent1.uses).toBe(2);
			expect(detergent2.uses).toBeNaN();
			expect(detergent3.uses).toBe(3);
		});

		test('decrease uses of detergent in video room SINK 1 by 9', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(9);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(2);
			expect(detergent2.quantity).toBe(2);
			expect(detergent1.uses).toBe(2);
			expect(detergent2.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 1 by 10', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(10);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(4);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			const detergent3 = newItems[3];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent3.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(2);
			expect(detergent3.quantity).toBe(1);
			expect(detergent1.uses).toBe(1);
			expect(detergent2.uses).toBeNaN();
			expect(detergent3.uses).toBe(2);
		});

		test('decrease uses of detergent in video room SINK 1 by 11', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(11);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(2);
			expect(detergent2.quantity).toBe(2);
			expect(detergent1.uses).toBe(1);
			expect(detergent2.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 1 by 12', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(12);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(3);
			expect(detergent1.uses).toBe(1);
			expect(detergent2.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 1 by 13', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(13);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const newDetergent = newItems[1];
			expect(newDetergent.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(newDetergent.quantity).toBe(4);
			expect(newDetergent.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 2 by 1', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(1);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(9);
			expect(detergent2.uses).toBe(10);
		});

		test('decrease uses of detergent in video room SINK 2 by 2', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(2);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(9);
		});

		test('decrease uses of detergent in video room SINK 2 by 3', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(3);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(8);
			expect(detergent2.uses).toBe(9);
		});

		test('decrease uses of detergent in video room SINK 2 by 4', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(4);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(8);
		});

		test('decrease uses of detergent in video room SINK 2 by 5', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(5);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(7);
			expect(detergent2.uses).toBe(8);
		});

		test('decrease uses of detergent in video room SINK 2 by 6', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(6);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(7);
		});

		test('decrease uses of detergent in video room SINK 2 by 7', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(7);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(6);
			expect(detergent2.uses).toBe(7);
		});

		test('decrease uses of detergent in video room SINK 2 by 8', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(8);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(6);
		});

		test('decrease uses of detergent in video room SINK 2 by 9', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(9);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(5);
			expect(detergent2.uses).toBe(6);
		});

		test('decrease uses of detergent in video room SINK 2 by 10', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(10);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(5);
		});

		test('decrease uses of detergent in video room SINK 2 by 11', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(11);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(4);
			expect(detergent2.uses).toBe(5);
		});

		test('decrease uses of detergent in video room SINK 2 by 12', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(12);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(4);
		});

		test('decrease uses of detergent in video room SINK 2 by 13', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(13);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(3);
			expect(detergent2.uses).toBe(4);
		});

		test('decrease uses of detergent in video room SINK 2 by 14', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(14);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(3);
		});

		test('decrease uses of detergent in video room SINK 2 by 15', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(15);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(2);
			expect(detergent2.uses).toBe(3);
		});

		test('decrease uses of detergent in video room SINK 2 by 16', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(16);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(2);
		});

		test('decrease uses of detergent in video room SINK 2 by 17', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(17);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(1);
			expect(detergent2.uses).toBe(2);
		});

		test('decrease uses of detergent in video room SINK 2 by 18', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(18);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(1);
		});

		test('decrease uses of detergent in video room SINK 2 by 19', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(19);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(1);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(1);
			expect(detergent2.uses).toBeNaN();
		});

		test('decrease uses of detergent in video room SINK 2 by 20', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.decreaseUses(20);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("EMPTY DETERGENT BOTTLE");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBeNaN();
		});

		describe('canteen BURNERS', () => {
			let burner: Fixture;
			let items: CollatedItem<RoomItem>[];
			let butter: CollatedItem<RoomItem>;
			let cookingSherry: CollatedItem<RoomItem>;
			let chickenBroth: CollatedItem<RoomItem>;

			describe('BURNER 2', () => {
				beforeAll(() => {
					burner = game.entityFinder.getFixture("BURNER 2", "canteen");
				});

				beforeEach(() => {
					items = CollatedItem.collate(burner.getContainedItems());
					butter = items[0];
					chickenBroth = items[1];
					cookingSherry = items[2];
				});

				test('decrease uses of reusable products on BURNER 2 by 1', () => {
					butter.decreaseUses(1);
					cookingSherry.decreaseUses(1);
					chickenBroth.decreaseUses(1);
					const newItems = burner.getContainedItems();
					expect(newItems).toHaveLength(8);
					const newButter1 = newItems[2];
					const newButter2 = newItems[3];
					const newCookingSherry = newItems[4];
					const newChickenBroth = newItems[6];
					expect(newButter1.prefab.id).toBe("BUTTER");
					expect(newButter2.prefab.id).toBe("BUTTER");
					expect(newCookingSherry.prefab.id).toBe("COOKING SHERRY");
					expect(newChickenBroth.prefab.id).toBe("CHICKEN BROTH");

					expect(newButter1.quantity).toBe(2);
					expect(newButter1.uses).toBe(1);
					expect(newButter2.quantity).toBe(1);
					expect(newButter2.uses).toBe(3);
					expect(newCookingSherry.quantity).toBe(1);
					expect(newCookingSherry.uses).toBe(9);
					expect(newChickenBroth.quantity).toBe(1);
					expect(newChickenBroth.uses).toBeNaN();
				});
			});

			describe('BURNER 3', () => {
				beforeAll(() => {
					burner = game.entityFinder.getFixture("BURNER 3", "canteen");
				});

				beforeEach(() => {
					items = CollatedItem.collate(burner.getContainedItems());
					butter = items[0];
					chickenBroth = items[1];
					cookingSherry = items[2];
				});

				test('decrease uses of reusable products on BURNER 3 by 1', () => {
					butter.decreaseUses(1);
					cookingSherry.decreaseUses(1);
					chickenBroth.decreaseUses(1);
					const newItems = burner.getContainedItems();
					expect(newItems).toHaveLength(9);
					const newButter1 = newItems[2];
					const newButter2 = newItems[7];
					const newCookingSherry1 = newItems[3];
					const newCookingSherry2 = newItems[8];
					const newChickenBroth = newItems[5];
					expect(newButter1.prefab.id).toBe("BUTTER");
					expect(newButter2.prefab.id).toBe("BUTTER WRAPPER");
					expect(newCookingSherry1.prefab.id).toBe("COOKING SHERRY");
					expect(newCookingSherry2.prefab.id).toBe("COOKING SHERRY");
					expect(newChickenBroth.prefab.id).toBe("CHICKEN BROTH");

					expect(newButter1.quantity).toBe(2);
					expect(newButter1.uses).toBe(6);
					expect(newButter2.quantity).toBe(1);
					expect(newButter2.uses).toBeNaN();
					expect(newCookingSherry1.quantity).toBe(1);
					expect(newCookingSherry1.uses).toBe(9);
					expect(newCookingSherry2.quantity).toBe(1);
					expect(newCookingSherry2.uses).toBe(10);
					expect(newChickenBroth.quantity).toBe(2);
					expect(newChickenBroth.uses).toBeNaN();
				});

				test('decrease uses of reusable products on BURNER 3 by 2', () => {
					butter.decreaseUses(2);
					cookingSherry.decreaseUses(2);
					chickenBroth.decreaseUses(2);
					const newItems = burner.getContainedItems();
					expect(newItems).toHaveLength(9);
					const newButter1 = newItems[2];
					const newButter2 = newItems[8];
					const newButter3 = newItems[7];
					const newCookingSherry1 = newItems[3];
					const newChickenBroth = newItems[5];
					expect(newButter1.prefab.id).toBe("BUTTER");
					expect(newButter2.prefab.id).toBe("BUTTER");
					expect(newButter3.prefab.id).toBe("BUTTER WRAPPER");
					expect(newCookingSherry1.prefab.id).toBe("COOKING SHERRY");
					expect(newChickenBroth.prefab.id).toBe("CHICKEN BROTH");

					expect(newButter1.quantity).toBe(1);
					expect(newButter1.uses).toBe(5);
					expect(newButter2.quantity).toBe(1);
					expect(newButter2.uses).toBe(6);
					expect(newButter3.quantity).toBe(1);
					expect(newButter3.uses).toBeNaN();
					expect(newCookingSherry1.quantity).toBe(2);
					expect(newCookingSherry1.uses).toBe(9);
					expect(newChickenBroth.quantity).toBe(2);
					expect(newChickenBroth.uses).toBeNaN();
				});
			});

			describe('BURNER 4', () => {
				beforeAll(() => {
					burner = game.entityFinder.getFixture("BURNER 4", "canteen");
				});

				beforeEach(() => {
					items = CollatedItem.collate(burner.getContainedItems());
					butter = items[0];
					chickenBroth = items[1];
					cookingSherry = items[2];
				});

				test('decrease uses of reusable products on BURNER 4 by 1', () => {
					butter.decreaseUses(1);
					cookingSherry.decreaseUses(1);
					chickenBroth.decreaseUses(1);
					const newItems = burner.getContainedItems();
					expect(newItems).toHaveLength(10);
					const newButter1 = newItems[2];
					const newButter2 = newItems[8];
					const newCookingSherry1 = newItems[3];
					const newCookingSherry2 = newItems[4];
					const newCookingSherry3 = newItems[9];
					const newChickenBroth = newItems[6];
					expect(newButter1.prefab.id).toBe("BUTTER");
					expect(newButter2.prefab.id).toBe("BUTTER");
					expect(newCookingSherry1.prefab.id).toBe("COOKING SHERRY");
					expect(newCookingSherry2.prefab.id).toBe("COOKING SHERRY");
					expect(newCookingSherry3.prefab.id).toBe("EMPTY COOKING SHERRY");
					expect(newChickenBroth.prefab.id).toBe("CHICKEN BROTH");

					expect(newButter1.quantity).toBe(3);
					expect(newButter1.uses).toBe(6);
					expect(newButter2.quantity).toBe(1);
					expect(newButter2.uses).toBe(5);
					expect(newCookingSherry1.quantity).toBe(1);
					expect(newCookingSherry1.uses).toBeNaN();
					expect(newCookingSherry2.quantity).toBe(1);
					expect(newCookingSherry2.uses).toBe(1);
					expect(newCookingSherry3.quantity).toBe(1);
					expect(newCookingSherry3.uses).toBe(0);
					expect(newChickenBroth.quantity).toBe(2);
					expect(newChickenBroth.uses).toBeNaN();
				});

				test('decrease uses of reusable products on BURNER 4 by 2', () => {
					butter.decreaseUses(2);
					cookingSherry.decreaseUses(2);
					chickenBroth.decreaseUses(2);
					const newItems = burner.getContainedItems();
					expect(newItems).toHaveLength(9);
					const newButter1 = newItems[2];
					const newButter2 = newItems[7];
					const newCookingSherry1 = newItems[3];
					const newCookingSherry2 = newItems[8];
					const newChickenBroth = newItems[5];
					expect(newButter1.prefab.id).toBe("BUTTER");
					expect(newButter2.prefab.id).toBe("BUTTER");
					expect(newCookingSherry1.prefab.id).toBe("COOKING SHERRY");
					expect(newCookingSherry2.prefab.id).toBe("EMPTY COOKING SHERRY");
					expect(newChickenBroth.prefab.id).toBe("CHICKEN BROTH");

					expect(newButter1.quantity).toBe(3);
					expect(newButter1.uses).toBe(6);
					expect(newButter2.quantity).toBe(1);
					expect(newButter2.uses).toBe(4);
					expect(newCookingSherry1.quantity).toBe(1);
					expect(newCookingSherry1.uses).toBeNaN();
					expect(newCookingSherry2.quantity).toBe(2);
					expect(newCookingSherry2.uses).toBe(0);
					expect(newChickenBroth.quantity).toBe(2);
					expect(newChickenBroth.uses).toBeNaN();
				});
			});
		});
	});

	describe('test destroy method', () => {
		afterEach(async () => {
			await game.entityLoader.loadRoomItems(false);
		});

		test('destroy detergent in video room SINK 1 by 1', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.destroy(1);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(3);
			expect(newItems[0].prefabId === "DIRTY DISHES");
			expect(newItems[0].quantity === 20);
			const detergent1 = newItems[1];
			const detergent2 = newItems[2];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent2.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent2.quantity).toBe(1);
			expect(detergent1.uses).toBe(4);
			expect(detergent2.uses).toBe(2);
		});

		test('destroy detergent in video room SINK 1 by 2', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.destroy(2);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			expect(newItems[0].prefabId === "DIRTY DISHES");
			expect(newItems[0].quantity === 20);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(2);
			expect(detergent1.uses).toBe(4);
		});

		test('destroy detergent in video room SINK 1 by 3', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.destroy(3);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			expect(newItems[0].prefabId === "DIRTY DISHES");
			expect(newItems[0].quantity === 20);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent1.uses).toBe(4);
		});

		test('destroy detergent in video room SINK 1 by 4', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.destroy(4);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(1);
			expect(newItems[0].prefabId === "DIRTY DISHES");
			expect(newItems[0].quantity === 20);
		});

		test('destroy detergent in video room SINK 1 by Infinity', () => {
			const sink = game.entityFinder.getFixture("SINK 1", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.destroy(Infinity);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(1);
			expect(newItems[0].prefabId === "DIRTY DISHES");
			expect(newItems[0].quantity === 20);
		});

		test('destroy detergent in video room SINK 2 by 1', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.destroy(1);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(2);
			const detergent1 = newItems[1];
			expect(detergent1.prefab.id).toBe("DETERGENT");
			expect(detergent1.quantity).toBe(1);
			expect(detergent1.uses).toBe(10);
		});

		test('destroy detergent in video room SINK 2 by 2', () => {
			const sink = game.entityFinder.getFixture("SINK 2", "video-room");
			const items = CollatedItem.collate(sink.getContainedItems());
			const detergent = items[0];
			detergent.destroy(2);
			const newItems = sink.getContainedItems();
			expect(newItems).toHaveLength(1);
		});
	});
});
