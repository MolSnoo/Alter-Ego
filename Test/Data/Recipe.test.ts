// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import CollatedItem from '../../Data/CollatedItem.ts';

describe('Recipe test', () => {
	beforeAll(async () => {
		if (!game.inProgress) await game.entityLoader.loadAll();
	});

	describe('test ingredientsMatch', () => {
		test('ingredientsMatch on canteen BURNER 1', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 1', 'canteen');
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe).toBeNull();
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.ingredientsMatch(items)).toBe(false);
		});

		test('ingredientsMatch on canteen BURNER 2', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 2', 'canteen');
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(burnerRecipe.ingredients.toString()).toBe(items.toString());
			expect(recipe.ingredientsMatch(items)).toBe(true);
		});

		test('ingredientsMatch on canteen BURNER 3', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 3', 'canteen');
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(burnerRecipe.ingredients.toString()).toBe(items.toString());
			expect(recipe.ingredientsMatch(items)).toBe(true);
		});

		test('ingredientsMatch on canteen BURNER 4', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 4', 'canteen');
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(burnerRecipe.ingredients.toString()).toBe(items.toString());
			expect(recipe.ingredientsMatch(items)).toBe(true);
		});

		test('ingredientsMatch on video room BURNER 1', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT FILLED WITH WATER, SPAGHETTI NOODLES', 'POT OF SPAGHETTI')[0];
			const burner = game.entityFinder.getFixture('BURNER 1', 'video-room');
			const burnerRecipe = burner.findRecipe();
            expect(burnerRecipe.recipe).not.toBeNull();
			expect(burnerRecipe.recipe).not.toBe(recipe);
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.ingredientsMatch(items)).toBe(false);
		});

		test('ingredientsMatch on video room BURNER 2', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT FILLED WITH WATER, SPAGHETTI NOODLES', 'POT OF SPAGHETTI')[0];
			const burner = game.entityFinder.getFixture('BURNER 2', 'video-room');
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(burnerRecipe.ingredients.toString()).toBe(items.toString());
			expect(recipe.ingredientsMatch(items)).toBe(true);
		});

		test('ingredientsMatch on video-room BLENDER 2', () => {
			const blender = game.entityFinder.getFixture('BLENDER 2', 'video-room');
			const recipe = blender.findRecipe().recipe;
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.ingredientsMatch(items)).toBe(true);
		});

		test('ingredientsMatch on video-room BLENDER 3', () => {
			const blender = game.entityFinder.getFixture('BLENDER 3', 'video-room');
			const recipe = blender.findRecipe().recipe;
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.ingredientsMatch(items)).toBe(true);
		});

		test('ingredientsMatch on video-room BLENDER 4', () => {
			const blender = game.entityFinder.getFixture('BLENDER 4', 'video-room');
			const recipe = blender.findRecipe().recipe;
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.ingredientsMatch(items)).toBe(true);
		});

		test('ingredientsMatch on video-room BLENDER 5', () => {
			const blender = game.entityFinder.getFixture('BLENDER 5', 'video-room');
			const recipe = game.entityFinder.getRecipes('processing', 'blender', 'BLENDER CUP OF MILK')[0];
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.ingredientsMatch(items)).toBe(false);
		});

		test('ingredientsMatch on video-room BLENDER 6', async () => {
			const blender = game.entityFinder.getFixture('BLENDER 6', 'video-room');
			const recipe = game.entityFinder.getRecipes('processing', 'blender', 'BANANA MILKSHAKE')[0];
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.ingredientsMatch(items)).toBe(false);
		});
	});

	describe('test getSatisfactoryProcessCount', () => {
		test('getSatisfactoryProcessCount on canteen BURNER 1', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 1', 'canteen');
			const items = CollatedItem.collate(burner.getContainedItems());
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe).toBeNull();
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(0);
		});

		test('getSatisfactoryProcessCount on canteen BURNER 2', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 2', 'canteen');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(1);
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			expect(burnerRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount on canteen BURNER 3', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 3', 'canteen');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(1);
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			expect(burnerRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount on canteen BURNER 4', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 4', 'canteen');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(2);
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			expect(burnerRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount in video-room BLENDER 1', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'blender', 'ORANGE', 'ORANGE SMOOTHIE')[0];
			const blender = game.entityFinder.getFixture('BLENDER 1', 'video-room');
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(3);
			const blenderRecipe = blender.findRecipe();
			expect(blenderRecipe.recipe.row).toBe(recipe.row);
			expect(blenderRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount in video-room SINK 1', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'small water source', 'DIRTY PLATE, DETERGENT', 'CLEAN PLATE, DETERGENT')[0];
			const sink = game.entityFinder.getFixture('SINK 1', 'video-room');
			const items = CollatedItem.collate(sink.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(13);
			const sinkRecipe = sink.findRecipe();
			expect(sinkRecipe.recipe.row).toBe(recipe.row);
			expect(sinkRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount in video-room SINK 2', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'small water source', 'DIRTY PLATE, DETERGENT', 'CLEAN PLATE, DETERGENT')[0];
			const sink = game.entityFinder.getFixture('SINK 2', 'video-room');
			const items = CollatedItem.collate(sink.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(19);
			const sinkRecipe = sink.findRecipe();
			expect(sinkRecipe.recipe.row).toBe(recipe.row);
			expect(sinkRecipe.ingredients.toString()).toBe(items.toString());
		});

        test('getSatisfactoryProcessCount in video-room SINK 3', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'small water source', 'DIRTY POT, DETERGENT', 'POT, DETERGENT')[0];
			const sink = game.entityFinder.getFixture('SINK 3', 'video-room');
			const items = CollatedItem.collate(sink.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(0);
			const sinkRecipe = sink.findRecipe();
			expect(sinkRecipe.recipe).toBeNull();
		});

		test('getSatisfactoryProcessCount on video-room BURNER 1', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT FILLED WITH WATER, SPAGHETTI NOODLES', 'POT OF SPAGHETTI')[0];
			const burner = game.entityFinder.getFixture('BURNER 1', 'video-room');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(0);
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe).not.toBeNull();
            expect(burnerRecipe.recipe).not.toBe(recipe);
		});

		test('getSatisfactoryProcessCount on video-room BURNER 2', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT FILLED WITH WATER, SPAGHETTI NOODLES', 'POT OF SPAGHETTI')[0];
			const burner = game.entityFinder.getFixture('BURNER 2', 'video-room');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(1);
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			expect(burnerRecipe.ingredients.toString()).toBe(items.toString());
		});

        test('getSatisfactoryProcessCount on video-room BURNER 3', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'FROZEN STEAK, FRYING PAN', 'COOKED STEAK, DIRTY PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 3', 'video-room');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(0);
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			expect(burnerRecipe.ingredients.toString()).not.toBe(items.toString());
		});

        test('getSatisfactoryProcessCount on video-room BURNER 4', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'FROZEN STEAK, FRYING PAN', 'COOKED STEAK, DIRTY PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 4', 'video-room');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(0);
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			expect(burnerRecipe.ingredients.toString()).not.toBe(items.toString());
		});

        test('getSatisfactoryProcessCount on video-room BURNER 5', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'FROZEN STEAK, FRYING PAN', 'COOKED STEAK, DIRTY PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 5', 'video-room');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(0);
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			expect(burnerRecipe.ingredients.toString()).not.toBe(items.toString());
		});

        test('getSatisfactoryProcessCount on video-room BURNER 6', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'FROZEN CHICKEN BREAST, FRYING PAN', 'COOKED CHICKEN BREAST, DIRTY PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 6', 'video-room');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(0);
			const burnerRecipe = burner.findRecipe();
			expect(burnerRecipe.recipe.row).toBe(recipe.row);
			expect(burnerRecipe.ingredients.toString()).not.toBe(items.toString());
		});

        test('getSatisfactoryProcessCount on video-room BURNER 7', () => {
            const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'FRYING PAN, CLEAN GLASS', 'DIRTY PAN, DIRTY GLASS')[0];
            const burner = game.entityFinder.getFixture('BURNER 7', 'video-room');
            const items = CollatedItem.collate(burner.getContainedItems());
            expect(recipe.getSatisfactoryProcessCount(items)).toBe(1);
            const burnerRecipe = burner.findRecipe();
            expect(burnerRecipe.recipe.row).toBe(recipe.row);
        });

		test('getSatisfactoryProcessCount on video-room CUTTING BOARD 1', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'cutting board', 'ORANGE, LARGE KNIFE', 'PEELED ORANGE, LARGE KNIFE')[0];
			const cuttingBoard = game.entityFinder.getFixture('CUTTING BOARD 1', 'video-room');
			const items = CollatedItem.collate(cuttingBoard.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(10);
			const cuttingBoardRecipe = cuttingBoard.findRecipe();
			expect(cuttingBoardRecipe.recipe.row).toBe(recipe.row);
			expect(cuttingBoardRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount on video-room CUTTING BOARD 2', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'cutting board', 'ORANGE, VEGETABLE PEELER', 'PEELED ORANGE, VEGETABLE PEELER')[0];
			const cuttingBoard = game.entityFinder.getFixture('CUTTING BOARD 2', 'video-room');
			const items = CollatedItem.collate(cuttingBoard.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(10);
			const cuttingBoardRecipe = cuttingBoard.findRecipe();
			expect(cuttingBoardRecipe.recipe.row).toBe(recipe.row);
			expect(cuttingBoardRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount on video-room CUTTING BOARD 3', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'cutting board', 'LEATHER SKIN, BUTTON', 'CRUDE LEATHER JACKET')[0];
			const cuttingBoard = game.entityFinder.getFixture('CUTTING BOARD 3', 'video-room');
			const items = CollatedItem.collate(cuttingBoard.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(1);
			const cuttingBoardRecipe = cuttingBoard.findRecipe();
			expect(cuttingBoardRecipe.recipe.row).toBe(recipe.row);
			expect(cuttingBoardRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount on video-room BLENDER 2', () => {
			const blender = game.entityFinder.getFixture('BLENDER 2', 'video-room');
			const recipe = blender.findRecipe().recipe;
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(2);
			const blenderRecipe = blender.findRecipe();
			expect(blenderRecipe.recipe.row).toBe(recipe.row);
			expect(blenderRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount on video-room BLENDER 3', () => {
			const blender = game.entityFinder.getFixture('BLENDER 3', 'video-room');
			const recipe = blender.findRecipe().recipe;
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(3);
			const blenderRecipe = blender.findRecipe();
			expect(blenderRecipe.recipe.row).toBe(recipe.row);
			expect(blenderRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount on video-room BLENDER 4', () => {
			const blender = game.entityFinder.getFixture('BLENDER 4', 'video-room');
			const recipe = blender.findRecipe().recipe;
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(7);
			const blenderRecipe = blender.findRecipe();
			expect(blenderRecipe.recipe.row).toBe(recipe.row);
			expect(blenderRecipe.ingredients.toString()).toBe(items.toString());
		});

		test('getSatisfactoryProcessCount on video-room BLENDER 5', () => {
			const blender = game.entityFinder.getFixture('BLENDER 5', 'video-room');
			const recipe = game.entityFinder.getRecipes('processing', 'blender', 'BLENDER CUP OF MILK')[0];
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(0);
			const blenderRecipe = blender.findRecipe();
			expect(blenderRecipe.recipe).toBeNull();
			expect(blenderRecipe.ingredients.toString()).toBe('');
		});

		test('getSatisfactoryProcessCount on video-room BLENDER 6', async () => {
			const blender = game.entityFinder.getFixture('BLENDER 6', 'video-room');
			const recipe = game.entityFinder.getRecipes('processing', 'blender', 'BANANA MILKSHAKE')[0];
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getSatisfactoryProcessCount(items)).toBe(0);
			const blenderRecipe = blender.findRecipe();
			expect(blenderRecipe.recipe).toBeNull();
			expect(blenderRecipe.ingredients.toString()).toBe('');
		});
	});

	describe('test getIngredientItems', () => {
		test('getIngredientItems on canteen BURNER 1', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 1', 'canteen');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual([]);
		});

		test('getIngredientItems on canteen BURNER 2', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 2', 'canteen');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual(items);
		});

		test('getIngredientItems on canteen BURNER 3', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 3', 'canteen');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual(items);
		});

		test('getIngredientItems on canteen BURNER 4', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT OF RICE, DICED ONIONS, BUTTER, COOKING SHERRY, SHREDDED CHEESE, CHICKEN BROTH, PAN')[0];
			const burner = game.entityFinder.getFixture('BURNER 4', 'canteen');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual(items);
		});

		test('getIngredientItems on video room BURNER 1', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT FILLED WITH WATER, SPAGHETTI NOODLES', 'POT OF SPAGHETTI')[0];
			const burner = game.entityFinder.getFixture('BURNER 1', 'video-room');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual([]);
		});

		test('getIngredientItems on video room BURNER 2', () => {
			const recipe = game.entityFinder.getRecipes('processing', 'stovetop', 'POT FILLED WITH WATER, SPAGHETTI NOODLES', 'POT OF SPAGHETTI')[0];
			const burner = game.entityFinder.getFixture('BURNER 2', 'video-room');
			const items = CollatedItem.collate(burner.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual(items);
		});

		test('getIngredientItems on video-room BLENDER 2', () => {
			const blender = game.entityFinder.getFixture('BLENDER 2', 'video-room');
			const recipe = blender.findRecipe().recipe;
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual(items);
		});

		test('getIngredientItems on video-room BLENDER 3', () => {
			const blender = game.entityFinder.getFixture('BLENDER 3', 'video-room');
			const recipe = blender.findRecipe().recipe;
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual(items);
		});

		test('getIngredientItems on video-room BLENDER 4', () => {
			const blender = game.entityFinder.getFixture('BLENDER 4', 'video-room');
			const recipe = blender.findRecipe().recipe;
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual(items);
		});

		test('getIngredientItems on video-room BLENDER 5', () => {
			const blender = game.entityFinder.getFixture('BLENDER 5', 'video-room');
			const recipe = game.entityFinder.getRecipes('processing', 'blender', 'BLENDER CUP OF MILK')[0];
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual([]);
		});

		test('getIngredientItems on video-room BLENDER 6', async () => {
			const blender = game.entityFinder.getFixture('BLENDER 6', 'video-room');
			const recipe = game.entityFinder.getRecipes('processing', 'blender', 'BANANA MILKSHAKE')[0];
			const items = CollatedItem.collate(blender.getContainedItems());
			expect(recipe.getIngredientItems(items)).toStrictEqual([]);
		});
	});
});
