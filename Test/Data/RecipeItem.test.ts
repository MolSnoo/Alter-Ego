// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import RecipeItem from "../../Data/RecipeItem.ts";

describe('Recipe test', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    test('', () => {
        const recipe = new RecipeItem("", game, "processing");
        expect(recipe.recipeItemString).toBe("");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("");
        expect(recipe.prefabId).toBe("");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('1X CHICKPEA FLOUR', () => {
        const recipe = new RecipeItem("1X CHICKPEA FLOUR", game, "processing");
        expect(recipe.recipeItemString).toBe("1X CHICKPEA FLOUR");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("X");
        expect(recipe.prefabId).toBe("CHICKPEA FLOUR");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('1X SOY MILK', () => {
        const recipe = new RecipeItem("1X SOY MILK", game, "processing");
        expect(recipe.recipeItemString).toBe("1X SOY MILK");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("X");
        expect(recipe.prefabId).toBe("SOY MILK");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('1Y DUCK EGG', () => {
        const recipe = new RecipeItem("1Y DUCK EGG", game, "processing");
        expect(recipe.recipeItemString).toBe("1Y DUCK EGG");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("Y");
        expect(recipe.prefabId).toBe("DUCK EGG");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('MEASURING CUP OF HONEY', () => {
        const recipe = new RecipeItem("MEASURING CUP OF HONEY", game, "processing");
        expect(recipe.recipeItemString).toBe("MEASURING CUP OF HONEY");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("");
        expect(recipe.prefabId).toBe("MEASURING CUP OF HONEY");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('1X BREADED ONION RINGS', () => {
        const recipe = new RecipeItem("1X BREADED ONION RINGS", game, "processing");
        expect(recipe.recipeItemString).toBe("1X BREADED ONION RINGS");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("X");
        expect(recipe.prefabId).toBe("BREADED ONION RINGS");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('2  SALT', () => {
        const recipe = new RecipeItem("2  SALT", game, "processing");
        expect(recipe.recipeItemString).toBe("2  SALT");
        expect(recipe.quantity).toBe(2);
        expect(recipe.quantityVariableName).toBe("");
        expect(recipe.prefabId).toBe("SALT");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('OILED PAN', () => {
        const recipe = new RecipeItem("OILED PAN", game, "processing");
        expect(recipe.recipeItemString).toBe("OILED PAN");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("");
        expect(recipe.prefabId).toBe("OILED PAN");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('2X GORED STUFFED MONKEY (PROPRIETARY SCREWDRIVER)', () => {
        const recipe = new RecipeItem("2X GORED STUFFED MONKEY (PROPRIETARY SCREWDRIVER)", game, "processing");
        expect(recipe.recipeItemString).toBe("2X GORED STUFFED MONKEY (PROPRIETARY SCREWDRIVER)");
        expect(recipe.quantity).toBe(2);
        expect(recipe.quantityVariableName).toBe("X");
        expect(recipe.prefabId).toBe("GORED STUFFED MONKEY");
        expect(recipe.containedItemsString).toBe("PROPRIETARY SCREWDRIVER");
    });

    test('2X GORED STUFFED MONKEY(2X PROPRIETARY SCREWDRIVER)', () => {
        const recipe = new RecipeItem("2X GORED STUFFED MONKEY(2X PROPRIETARY SCREWDRIVER)", game, "processing");
        expect(recipe.recipeItemString).toBe("2X GORED STUFFED MONKEY(2X PROPRIETARY SCREWDRIVER)");
        expect(recipe.quantity).toBe(2);
        expect(recipe.quantityVariableName).toBe("X");
        expect(recipe.prefabId).toBe("GORED STUFFED MONKEY");
        expect(recipe.containedItemsString).toBe("2X PROPRIETARY SCREWDRIVER");
    });

    test('GORED STUFFED MONKEY ( PROPRIETARY SCREWDRIVER)', () => {
        const recipe = new RecipeItem("GORED STUFFED MONKEY ( PROPRIETARY SCREWDRIVER)", game, "processing");
        expect(recipe.recipeItemString).toBe("GORED STUFFED MONKEY ( PROPRIETARY SCREWDRIVER)");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("");
        expect(recipe.prefabId).toBe("GORED STUFFED MONKEY");
        expect(recipe.containedItemsString).toBe("PROPRIETARY SCREWDRIVER");
    });

    test('SWITCHBLADE', () => {
        const recipe = new RecipeItem("SWITCHBLADE", game, "processing");
        expect(recipe.recipeItemString).toBe("SWITCHBLADE");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("");
        expect(recipe.prefabId).toBe("SWITCHBLADE");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('3D BEAVER MATERIALS', () => {
        const recipe = new RecipeItem("3D BEAVER MATERIALS", game, "processing");
        expect(recipe.recipeItemString).toBe("3D BEAVER MATERIALS");
        expect(recipe.quantity).toBe(3);
        expect(recipe.quantityVariableName).toBe("D");
        expect(recipe.prefabId).toBe("BEAVER MATERIALS");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('1X 3D BEAVER MATERIALS', () => {
        const recipe = new RecipeItem("1X 3D BEAVER MATERIALS", game, "processing");
        expect(recipe.recipeItemString).toBe("1X 3D BEAVER MATERIALS");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("X");
        expect(recipe.prefabId).toBe("3D BEAVER MATERIALS");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('K CUP', () => {
        const recipe = new RecipeItem("K CUP", game, "processing");
        expect(recipe.recipeItemString).toBe("K CUP");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("");
        expect(recipe.prefabId).toBe("K CUP");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('1X K CUP', () => {
        const recipe = new RecipeItem("1X K CUP", game, "processing");
        expect(recipe.recipeItemString).toBe("1X K CUP");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("X");
        expect(recipe.prefabId).toBe("K CUP");
        expect(recipe.containedItemsString).toBe(null);
    });

    test('CRATE (5X PLANK + 10X NAILS)', () => {
        const recipe = new RecipeItem("CRATE (5X PLANK, 10X NAILS)", game, "processing");
        expect(recipe.recipeItemString).toBe("CRATE (5X PLANK, 10X NAILS)");
        expect(recipe.quantity).toBe(1);
        expect(recipe.quantityVariableName).toBe("");
        expect(recipe.prefabId).toBe("CRATE");
        expect(recipe.containedItemsString).toBe("5X PLANK, 10X NAILS");
    });
});
