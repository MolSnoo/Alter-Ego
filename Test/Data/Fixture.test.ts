// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import CollatedItem from '../../Data/CollatedItem.ts';

describe('Fixture test', () => {
	beforeAll(async () => {
		if (!game.inProgress) await game.entityLoader.loadAll();
	});

	describe('Processing tests', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(async () => {
			vi.clearAllTimers();
			vi.useRealTimers();
			await game.entityLoader.loadFixtures(false);
			await game.entityLoader.loadRoomItems(false);
		});

		test('Fixture.destroyIngredients for CUTTING BOARD 1 of video-room', () => {
			const fixture = game.entityFinder.getFixture('CUTTING BOARD 1', 'video-room');
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(2);
				const orange = items[0];
				const knife = items[1];
				expect(orange.quantity).toBe(10);
				expect(orange.uses).toBe(1);
				expect(knife.quantity).toBe(1);
				expect(knife.uses).toBe(NaN);
			}
			const recipeData = fixture.findRecipe();
			fixture.process.recipe = recipeData.recipe;
			fixture.process.ingredients = recipeData.ingredients;
			fixture.destroyIngredients(fixture.process.recipe, fixture.process.ingredients, 1);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(2);
				const orange = items[0];
				const knife = items[1];
				expect(orange.quantity).toBe(9);
				expect(orange.uses).toBe(1);
				expect(knife.quantity).toBe(1);
				expect(knife.uses).toBe(NaN);
			}
			fixture.destroyIngredients(fixture.process.recipe, fixture.process.ingredients, 3);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(2);
				const orange = items[0];
				const knife = items[1];
				expect(orange.quantity).toBe(6);
				expect(orange.uses).toBe(1);
				expect(knife.quantity).toBe(1);
				expect(knife.uses).toBe(NaN);
			}
		});

		test('Fixture.instantiateProducts for CUTTING BOARD 1 of video-room', () => {
			const fixture = game.entityFinder.getFixture('CUTTING BOARD 1', 'video-room');
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(2);
				const orange = items[0];
				const knife = items[1];
				expect(orange.quantity).toBe(10);
				expect(orange.uses).toBe(1);
				expect(knife.quantity).toBe(1);
				expect(knife.uses).toBe(NaN);
			}
			const recipeData = fixture.findRecipe();
			fixture.process.recipe = recipeData.recipe;
			fixture.process.ingredients = recipeData.ingredients;
			fixture.instantiateProducts(fixture.process.recipe, 1);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(3);
				const orange = items[0];
				const knife = items[1];
				const slices = items[2];
				expect(orange.quantity).toBe(10);
				expect(orange.uses).toBe(1);
				expect(knife.quantity).toBe(1);
				expect(knife.uses).toBe(NaN);
				expect(slices.quantity).toBe(1);
				expect(slices.uses).toBe(1);
			}
			fixture.instantiateProducts(fixture.process.recipe, 3);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(3);
				const orange = items[0];
				const knife = items[1];
				const slices = items[2];
				expect(orange.quantity).toBe(10);
				expect(orange.uses).toBe(1);
				expect(knife.quantity).toBe(1);
				expect(knife.uses).toBe(NaN);
				expect(slices.quantity).toBe(4);
				expect(slices.uses).toBe(1);
			}
		});

		test('Fixture process flow for CUTTING BOARD 1 of video-room', () => {
			const fixture = game.entityFinder.getFixture('CUTTING BOARD 1', 'video-room');
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(2);
				const orange = items[0];
				const knife = items[1];
				expect(orange.quantity).toBe(10);
				expect(orange.uses).toBe(1);
				expect(knife.quantity).toBe(1);
				expect(knife.uses).toBe(NaN);
			}
			const recipeData = fixture.findRecipe();
			fixture.process.recipe = recipeData.recipe;
			fixture.process.ingredients = recipeData.ingredients;
            let variableValues = fixture.process.recipe.getIngredientVariableValues(fixture.process.ingredients);
			fixture.destroyIngredients(fixture.process.recipe, fixture.process.ingredients, 1);
			fixture.instantiateProducts(fixture.process.recipe, 1, variableValues);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(3);
				const orange = items[0];
				const knife = items[1];
				const slices = items[2];
				expect(orange.quantity).toBe(9);
				expect(orange.uses).toBe(1);
				expect(knife.quantity).toBe(1);
				expect(knife.uses).toBe(NaN);
				expect(slices.quantity).toBe(1);
				expect(slices.uses).toBe(1);
			}
            variableValues = fixture.process.recipe.getIngredientVariableValues(fixture.process.ingredients);
			fixture.destroyIngredients(fixture.process.recipe, fixture.process.ingredients, 3);
			fixture.instantiateProducts(fixture.process.recipe, 3, variableValues);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(3);
				const orange = items[0];
				const knife = items[1];
				const slices = items[2];
				expect(orange.quantity).toBe(6);
				expect(orange.uses).toBe(1);
				expect(knife.quantity).toBe(1);
				expect(knife.uses).toBe(NaN);
				expect(slices.quantity).toBe(4);
				expect(slices.uses).toBe(1);
			}
		});

		test('Fixture process flow for BLENDER 2 of video-room', () => {
			const fixture = game.entityFinder.getFixture('BLENDER 2', 'video-room');
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(1);
				const cup = items[0];
				const banana = cup.inventory.get(cup.inventory.firstKey()).items[0];
				expect(cup.quantity).toBe(1);
				expect(cup.uses).toBe(NaN);
				expect(banana.quantity).toBe(2);
				expect(banana.uses).toBe(1);
			}
			const recipeData = fixture.findRecipe();
			fixture.process.recipe = recipeData.recipe;
			fixture.process.ingredients = recipeData.ingredients;
            const variableValues = fixture.process.recipe.getIngredientVariableValues(fixture.process.ingredients);
			fixture.destroyIngredients(fixture.process.recipe, fixture.process.ingredients, 2);
			fixture.instantiateProducts(fixture.process.recipe, 2, variableValues);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(1);
				const milkshake = items[0];
				expect(milkshake.quantity).toBe(1);
				expect(milkshake.uses).toBe(2);
			}
		});

		test('Fixture process flow for BLENDER 3 of video-room', () => {
			const fixture = game.entityFinder.getFixture('BLENDER 3', 'video-room');
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(2);
				const apple = items[0];
				const orange = items[1];
				expect(apple.quantity).toBe(3);
				expect(apple.uses).toBe(1);
				expect(orange.quantity).toBe(3);
				expect(orange.uses).toBe(1);
			}
			const recipeData = fixture.findRecipe();
			fixture.process.recipe = recipeData.recipe;
			fixture.process.ingredients = recipeData.ingredients;
            const variableValues = fixture.process.recipe.getIngredientVariableValues(fixture.process.ingredients);
			fixture.destroyIngredients(fixture.process.recipe, fixture.process.ingredients, 3);
			fixture.instantiateProducts(fixture.process.recipe, 3, variableValues);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(1);
				const smoothie = items[0];
				expect(smoothie.quantity).toBe(3);
				expect(smoothie.uses).toBe(2);
			}
		});

		test('Fixture process flow for BLENDER 4 of video-room', () => {
			const fixture = game.entityFinder.getFixture('BLENDER 4', 'video-room');
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(2);
				const banana = items[0];
				const orange = items[1];
				expect(banana.quantity).toBe(7);
				expect(banana.uses).toBe(1);
				expect(orange.quantity).toBe(7);
				expect(orange.uses).toBe(1);
			}
			const recipeData = fixture.findRecipe();
			fixture.process.recipe = recipeData.recipe;
			fixture.process.ingredients = recipeData.ingredients;
            const variableValues = fixture.process.recipe.getIngredientVariableValues(fixture.process.ingredients);
			fixture.destroyIngredients(fixture.process.recipe, fixture.process.ingredients, 7);
			fixture.instantiateProducts(fixture.process.recipe, 7, variableValues);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(1);
				const smoothie = items[0];
				expect(smoothie.quantity).toBe(7);
				expect(smoothie.uses).toBe(3);
			}
		});

		test('Fixture process flow for BLENDER 7 of video-room', () => {
			const fixture = game.entityFinder.getFixture('BLENDER 7', 'video-room');
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(1);
				const orangeJuice = items[0];
				expect(orangeJuice.quantity).toBe(1);
				expect(orangeJuice.uses).toBe(4);
			}
			const recipeData = fixture.findRecipe();
			expect(recipeData.recipe).not.toBeNull();
			fixture.process.recipe = recipeData.recipe;
			fixture.process.ingredients = recipeData.ingredients;
			const spc = fixture.process.recipe.getSatisfactoryProcessCount(CollatedItem.collate(fixture.getContainedItems()));
            const variableValues = fixture.process.recipe.getIngredientVariableValues(fixture.process.ingredients);
			fixture.destroyIngredients(fixture.process.recipe, fixture.process.ingredients, spc);
			fixture.instantiateProducts(fixture.process.recipe, spc, variableValues);
			{
				let items = fixture.getContainedItems();
				expect(items.length).toBe(1);
				const milk = items[0];
				expect(milk.quantity).toBe(1);
				expect(milk.uses).toBe(4);
			}
		});
	});

	describe('Full flow tests', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(async () => {
            vi.clearAllTimers();
            vi.useRealTimers();
            await game.entityLoader.loadFixtures(false);
            await game.entityLoader.loadRoomItems(false);
        });

        test('Full flow for CUTTING BOARD 1 of video-room', () => {
            const fixture = game.entityFinder.getFixture('CUTTING BOARD 1', 'video-room');
            fixture.activate();
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items.length).toBe(2);
                const knife = items[0];
                const slices = items[1];
                expect(knife.prefabId).toBe("LARGE KNIFE");
                expect(knife.quantity).toBe(1);
                expect(knife.uses).toBe(NaN);
                expect(slices.prefabId).toBe("PEELED ORANGE");
                expect(slices.quantity).toBe(10);
                expect(slices.uses).toBe(1);
            }
        });

        test('Full flow for CUTTING BOARD 3 of video-room', () => {
            const fixture = game.entityFinder.getFixture('CUTTING BOARD 3', 'video-room');
            fixture.activate();
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items).toBeLength(3);
                const leather = items[0];
                const button = items[1];
                const jacket = items[2];
                expect(leather.prefabId).toBe("LEATHER SKIN");
                expect(leather.quantity).toBe(NaN);
                expect(leather.uses).toBe(NaN);
                expect(button.prefabId).toBe("BUTTON");
                expect(button.quantity).toBe(NaN);
                expect(button.uses).toBe(NaN);
                expect(jacket.prefabId).toBe("CRUDE LEATHER JACKET");
                expect(jacket.quantity).toBe(1);
                expect(jacket.uses).toBe(NaN);
            }
        });

        test('Full flow for BURNER 3 of video-room', () => {
            const fixture = game.entityFinder.getFixture('BURNER 3', 'video-room');
            fixture.activate();
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items.length).toBe(2);
                const pan1 = items[0];
                const pan2 = items[1];
                expect(pan1.prefabId).toBe("FRYING PAN");
                expect(pan1.quantity).toBe(1);
                expect(pan1.uses).toBe(NaN);
                expect(pan1.inventory.first().items[0].prefabId).toBe("FROZEN STEAK");
                expect(pan1.inventory.first().items[0].quantity).toBe(1);
                expect(pan1.inventory.first().items[0].uses).toBe(2);
                expect(pan2.prefabId).toBe("DIRTY PAN");
                expect(pan2.quantity).toBe(1);
                expect(pan2.uses).toBe(NaN);
                expect(pan2.inventory.first().items[0].prefabId).toBe("COOKED STEAK");
                expect(pan2.inventory.first().items[0].quantity).toBe(1);
                expect(pan2.inventory.first().items[0].uses).toBe(2);
            }
            fixture.recipeInterval.stop();
            fixture.recipeInterval.start();
            vi.advanceTimersByTime(5000);
            {
                let items = fixture.getContainedItems();
                expect(items.length).toBe(2);
                const pan1 = items[0];
                const pan2 = items[1];
                expect(pan1.prefabId).toBe("DIRTY PAN");
                expect(pan1.quantity).toBe(1);
                expect(pan1.uses).toBe(NaN);
                expect(pan1.inventory.first().items[0].prefabId).toBe("COOKED STEAK");
                expect(pan1.inventory.first().items[0].quantity).toBe(1);
                expect(pan1.inventory.first().items[0].uses).toBe(2);
                expect(pan2.prefabId).toBe("DIRTY PAN");
                expect(pan2.quantity).toBe(1);
                expect(pan2.uses).toBe(NaN);
                expect(pan2.inventory.first().items[0].prefabId).toBe("COOKED STEAK");
                expect(pan2.inventory.first().items[0].quantity).toBe(1);
                expect(pan2.inventory.first().items[0].uses).toBe(2);
            }
        });

        test('Full flow for BURNER 4 of video-room', () => {
            const fixture = game.entityFinder.getFixture('BURNER 4', 'video-room');
            fixture.activate();
            // Something, whether it be Vitest or a flaw in my programming, is causing quite the torment.
            // This test relies on the fixture's recipe interval to be CORRECTLY started.
            // These intervals never start correctly during testing, but start fine within the context of a real game.
            // This is a bandage fix to get this test to functionality correctly.
            fixture.recipeInterval.stop();
            fixture.recipeInterval.start();
            vi.advanceTimersByTime(5000);
            {
                let items = fixture.getContainedItems();
                expect(items.length).toBe(2);
                const pan1 = items[0];
                const pan2 = items[1];
                expect(pan1.prefabId).toBe("DIRTY PAN");
                expect(pan1.quantity).toBe(1);
                expect(pan1.uses).toBe(NaN);
                expect(pan1.inventory.first().items[0].prefabId).toBe("COOKED STEAK");
                expect(pan1.inventory.first().items[0].quantity).toBe(1);
                expect(pan1.inventory.first().items[0].uses).toBe(2);
                expect(pan2.prefabId).toBe("DIRTY PAN");
                expect(pan2.quantity).toBe(1);
                expect(pan2.uses).toBe(NaN);
                expect(pan2.inventory.first().items[0].prefabId).toBe("COOKED PORK CHOP");
                expect(pan2.inventory.first().items[0].quantity).toBe(1);
                expect(pan2.inventory.first().items[0].uses).toBe(2);
            }
        });

        test('Full flow for BURNER 5 of video-room', () => {
            const fixture = game.entityFinder.getFixture('BURNER 5', 'video-room');
            fixture.activate();
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items.length).toBe(2);
                const pan1 = items[0];
                const pan2 = items[1];
                expect(pan1.prefabId).toBe("FRYING PAN");
                expect(pan1.quantity).toBe(1);
                expect(pan1.uses).toBe(NaN);
                expect(pan1.inventory.first().items[0].prefabId).toBe("FROZEN STEAK");
                expect(pan1.inventory.first().items[0].quantity).toBe(1);
                expect(pan1.inventory.first().items[0].uses).toBe(2);
                expect(pan2.prefabId).toBe("DIRTY PAN");
                expect(pan2.quantity).toBe(1);
                expect(pan2.uses).toBe(NaN);
                expect(pan2.inventory.first().items[0].prefabId).toBe("COOKED STEAK");
                expect(pan2.inventory.first().items[0].quantity).toBe(2);
                expect(pan2.inventory.first().items[0].uses).toBe(2);
            }
            fixture.recipeInterval.stop();
            fixture.recipeInterval.start();
            vi.advanceTimersByTime(5000);
            {
                let items = fixture.getContainedItems();
                expect(items.length).toBe(2);
                const pan1 = items[0];
                const pan2 = items[1];
                expect(pan1.prefabId).toBe("DIRTY PAN");
                expect(pan1.quantity).toBe(1);
                expect(pan1.uses).toBe(NaN);
                expect(pan1.inventory.first().items[0].prefabId).toBe("COOKED STEAK");
                expect(pan1.inventory.first().items[0].quantity).toBe(2);
                expect(pan1.inventory.first().items[0].uses).toBe(2);
                expect(pan2.prefabId).toBe("DIRTY PAN");
                expect(pan2.quantity).toBe(1);
                expect(pan2.uses).toBe(NaN);
                expect(pan2.inventory.first().items[0].prefabId).toBe("COOKED STEAK");
                expect(pan2.inventory.first().items[0].quantity).toBe(1);
                expect(pan2.inventory.first().items[0].uses).toBe(2);
            }
        });

        test('Full flow for BURNER 6 of video-room', () => {
            const fixture = game.entityFinder.getFixture('BURNER 6', 'video-room');
            fixture.activate();
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items.length).toBe(2);
                const pan1 = items[0];
                const pan2 = items[1];
                expect(pan1.prefabId).toBe("FRYING PAN");
                expect(pan1.quantity).toBe(1);
                expect(pan1.uses).toBe(NaN);
                expect(pan1.inventory.first().items[0].prefabId).toBe("FROZEN CHICKEN BREAST");
                expect(pan1.inventory.first().items[0].quantity).toBe(1);
                expect(pan1.inventory.first().items[0].uses).toBe(2);
                expect(pan2.prefabId).toBe("DIRTY PAN");
                expect(pan2.quantity).toBe(1);
                expect(pan2.uses).toBe(NaN);
                expect(pan2.inventory.first().items[0].prefabId).toBe("COOKED CHICKEN BREAST");
                expect(pan2.inventory.first().items[0].quantity).toBe(2);
                expect(pan2.inventory.first().items[0].uses).toBe(2);
            }
            fixture.recipeInterval.stop();
            fixture.recipeInterval.start();
            vi.advanceTimersByTime(5000);
            {
                let items = fixture.getContainedItems();
                expect(items.length).toBe(2);
                const pan1 = items[0];
                const pan2 = items[1];
                expect(pan1.prefabId).toBe("DIRTY PAN");
                expect(pan1.quantity).toBe(1);
                expect(pan1.uses).toBe(NaN);
                expect(pan1.inventory.first().items[0].prefabId).toBe("COOKED CHICKEN BREAST");
                expect(pan1.inventory.first().items[0].quantity).toBe(2);
                expect(pan1.inventory.first().items[0].uses).toBe(2);
                expect(pan2.prefabId).toBe("DIRTY PAN");
                expect(pan2.quantity).toBe(1);
                expect(pan2.uses).toBe(NaN);
                expect(pan2.inventory.first().items[0].prefabId).toBe("COOKED CHICKEN BREAST");
                expect(pan2.inventory.first().items[0].quantity).toBe(1);
                expect(pan2.inventory.first().items[0].uses).toBe(2);
            }
        });

        test('Full flow for BURNER 7 of video-room', () => {
            const fixture = game.entityFinder.getFixture('BURNER 7', 'video-room');
            fixture.activate();
            {
                let items = fixture.getContainedItems();
                expect(items).toBeLength(1);
                const pan = items[0];
                expect(pan.prefabId).toBe("FRYING PAN");
                expect(pan.quantity).toBe(1);
                expect(pan.uses).toBe(NaN);
                expect(pan.inventory.first().items[0].prefabId).toBe("CLEAN GLASS");
                expect(pan.inventory.first().items[0].quantity).toBe(1);
                expect(pan.inventory.first().items[0].uses).toBe(NaN);
            }
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items).toBeLength(1);
                const pan = items[0];
                expect(pan.prefabId).toBe("DIRTY PAN");
                expect(pan.quantity).toBe(1);
                expect(pan.uses).toBe(NaN);
                expect(pan.inventory.first().items[0].prefabId).toBe("DIRTY GLASS");
                expect(pan.inventory.first().items[0].quantity).toBe(1);
                expect(pan.inventory.first().items[0].uses).toBe(NaN);
            }
        });

        test('Full flow for KILN 1 of video-room', () => {
            const fixture = game.entityFinder.getFixture('KILN 1', 'video-room');
            fixture.activate();
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items).toBeLength(1);
                const pot = items[0];
                const proceduralSelections = new Map([
                    ["base color", "white"],
                    ["quality", "decent"]
                ]);
                const expectedDescription = `<desc><s>This is a pot made of <procedural name="base color"><poss name="white">white</poss></procedural> clay.</s> <s>It was made on a pottery wheel.</s> <procedural name="quality"><s><poss name="decent">The craftsmanship is fairly decent. It has a flat, sturdy bottom that sits perfectly level. The sides are mostly even, but it has a bit of a rough texture, with a few small divots and bumps here and there. It should be able to hold things.</poss></s></procedural> <s>Since it's unglazed, it's bone dry, and feels quite delicate.</s> <s>If it comes into contact with moisture, it will absorb it, and it may eventually break.</s> <s>In it, you find <il></il>.</s></desc>`;
                expect(pot.proceduralSelections).toEqual(proceduralSelections);
                expect(pot.description.text).toEqual(expectedDescription);
                expect(pot.name).toBe('WHITE CLAY POT');
                expect(pot.pluralName).toBe('WHITE CLAY POTS');
                expect(pot.singleContainingPhrase).toBe('a WHITE CLAY POT');
                expect(pot.pluralContainingPhrase).toBe('WHITE CLAY POTS');
            }
        });

        test('Full flow for KILN 2 of video-room', () => {
            const fixture = game.entityFinder.getFixture('KILN 2', 'video-room');
            fixture.activate();
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items).toBeLength(1);
                const pot = items[0];
                const proceduralSelections = new Map([
                    ["base color", "obscured"],
                    ["quality", "excellent"],
                    ["glaze color", "orange"],
                    ["pattern", "waves"],
                    ["pattern quality", "detailed"],
                    ["pattern color", "teal"]
                ]);
                const expectedDescription = `<desc><s>This is a pot made of <procedural name="base color"><poss name="obscured"/></procedural>clay.</s> <s>It was made on a pottery wheel.</s> <procedural name="quality"><s><poss name="excellent">The craftsmanship is *excellent*. It has a flat, sturdy bottom that sits level on any surface. The sides have perfect radial symmetry, and a very smooth texture. It makes for a good container, as any pot should.</poss></s></procedural> <s>It's been glazed, giving it a smooth, glassy finish.</s> <s>The glaze is <procedural name="glaze color"><poss name="orange">orange</poss></procedural> in color<procedural name="pattern">, and patterned with <procedural name="pattern quality"><poss name="detailed">detailed</poss></procedural> <procedural name="pattern color"><poss name="teal">teal</poss></procedural> <poss name="waves">waves</poss></procedural>.</s> <s>In it, you find <il></il>.</s></desc>`;
                expect(pot.proceduralSelections).toEqual(proceduralSelections);
                expect(pot.description.text).toEqual(expectedDescription);
                expect(pot.name).toBe('ORANGE GLAZED CLAY POT');
                expect(pot.pluralName).toBe('ORANGE GLAZED CLAY POTS');
                expect(pot.singleContainingPhrase).toBe('an ORANGE GLAZED CLAY POT');
                expect(pot.pluralContainingPhrase).toBe('ORANGE GLAZED CLAY POTS');
            }
        });

        test('Full flow for KILN 3 of video-room', () => {
            const fixture = game.entityFinder.getFixture('KILN 3', 'video-room');
            fixture.activate();
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items).toBeLength(2);
                const pot1 = items[0];
                const pot2 = items[1];
                const proceduralSelections1 = new Map([
                    ["base color", "white"],
                    ["quality", "excellent"]
                ]);
                const proceduralSelections2 = new Map([
                    ["base color", "red"],
                    ["quality", "terrible"]
                ]);
                const expectedDescription1 = `<desc><s>This is a pot made of <procedural name="base color"><poss name="white">white</poss></procedural> clay.</s> <s>It was made on a pottery wheel.</s> <procedural name="quality"><s><poss name="excellent">The craftsmanship is *excellent*. It has a flat, sturdy bottom that sits level on any surface. The sides have perfect radial symmetry, and a very smooth texture.</poss></s></procedural> <s>It's unglazed, and it still needs to be fired in a kiln.</s></desc>`;
                const expectedDescription2 = `<desc><s>This is a pot made of <procedural name="base color"><poss name="red">red</poss></procedural> clay.</s> <s>It was made on a pottery wheel.</s> <procedural name="quality"><s><poss name="terrible">It's of *terrible* quality. The sides are extremely rugged and misshapen, with a thin bottom that's sure to break after a few uses. It barely even looks recognizable as a pot, but it should still be able to hold things for now.</poss></s></procedural> <s>Since it's unglazed, it's bone dry, and feels quite delicate.</s> <s>If it comes into contact with moisture, it will absorb it, and it may eventually break.</s> <s>In it, you find <il></il>.</s></desc>`;
                expect(pot1.prefab.id).toBe("WET CLAY POT");
                expect(pot2.prefab.id).toBe("FIRED CLAY POT");
                expect(pot1.proceduralSelections).toEqual(proceduralSelections1);
                expect(pot1.description.text).toEqual(expectedDescription1);
                expect(pot2.proceduralSelections).toEqual(proceduralSelections2);
                expect(pot2.description.text).toEqual(expectedDescription2);
                expect(pot1.name).toBe('WHITE CLAY POT');
                expect(pot1.pluralName).toBe('WHITE CLAY POTS');
                expect(pot1.singleContainingPhrase).toBe('an unfired WHITE CLAY POT');
                expect(pot1.pluralContainingPhrase).toBe('unfired WHITE CLAY POTS');
                expect(pot2.name).toBe('RED CLAY POT');
                expect(pot2.pluralName).toBe('RED CLAY POTS');
                expect(pot2.singleContainingPhrase).toBe('a RED CLAY POT');
                expect(pot2.pluralContainingPhrase).toBe('RED CLAY POTS');
            }
            fixture.recipeInterval.stop();
            fixture.recipeInterval.start();
            vi.advanceTimersByTime(1000);
            {
                let items = fixture.getContainedItems();
                expect(items).toBeLength(2);
                const pot1 = items[0];
                const pot2 = items[1];
                const proceduralSelections1 = new Map([
                    ["base color", "red"],
                    ["quality", "terrible"]
                ]);
                const proceduralSelections2 = new Map([
                    ["base color", "white"],
                    ["quality", "excellent"]
                ]);
                const expectedDescription1 = `<desc><s>This is a pot made of <procedural name="base color"><poss name="red">red</poss></procedural> clay.</s> <s>It was made on a pottery wheel.</s> <procedural name="quality"><s><poss name="terrible">It's of *terrible* quality. The sides are extremely rugged and misshapen, with a thin bottom that's sure to break after a few uses. It barely even looks recognizable as a pot, but it should still be able to hold things for now.</poss></s></procedural> <s>Since it's unglazed, it's bone dry, and feels quite delicate.</s> <s>If it comes into contact with moisture, it will absorb it, and it may eventually break.</s> <s>In it, you find <il></il>.</s></desc>`;
                const expectedDescription2 = `<desc><s>This is a pot made of <procedural name="base color"><poss name="white">white</poss></procedural> clay.</s> <s>It was made on a pottery wheel.</s> <procedural name="quality"><s><poss name="excellent">The craftsmanship is *excellent*. It has a flat, sturdy bottom that sits level on any surface. The sides have perfect radial symmetry, and a very smooth texture. It makes for a good container, as any pot should.</poss></s></procedural> <s>Since it's unglazed, it's bone dry, and feels quite delicate.</s> <s>If it comes into contact with moisture, it will absorb it, and it may eventually break.</s> <s>In it, you find <il></il>.</s></desc>`;
                expect(pot1.prefab.id).toBe("FIRED CLAY POT");
                expect(pot2.prefab.id).toBe("FIRED CLAY POT");
                expect(pot1.proceduralSelections).toEqual(proceduralSelections1);
                expect(pot1.description.text).toEqual(expectedDescription1);
                expect(pot2.proceduralSelections).toEqual(proceduralSelections2);
                expect(pot2.description.text).toEqual(expectedDescription2);
                expect(pot1.name).toBe('RED CLAY POT');
                expect(pot1.pluralName).toBe('RED CLAY POTS');
                expect(pot1.singleContainingPhrase).toBe('a RED CLAY POT');
                expect(pot1.pluralContainingPhrase).toBe('RED CLAY POTS');
                expect(pot2.name).toBe('WHITE CLAY POT');
                expect(pot2.pluralName).toBe('WHITE CLAY POTS');
                expect(pot2.singleContainingPhrase).toBe('a WHITE CLAY POT');
                expect(pot2.pluralContainingPhrase).toBe('WHITE CLAY POTS');
            }
        });
    });
});
