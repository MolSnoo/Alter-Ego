const constants = include('Configs/constants.json');

/**
 * @class Recipe
 * @classdesc Represents a recipe in the game.
 * @constructor
 * @param {Prefab[]} ingredients - The ingredients required to craft the recipe.
 * @param {boolean} uncraftable - Whether the recipe is uncraftable.
 * @param {string} objectTag - Phrase that describes which objects can be used to process the recipe.
 * @param {Duration} duration - How long it takes to process the recipe.
 * @param {Prefab[]} products - The products produced by the recipe.
 * @param {string} initiatedDescription - The description that indicates when a recipe has begun being processed.
 * @param {string} completedDescription - The description that indicates when a recipe has finished being processed.
 * @param {string} uncraftedDescription - The description that indicates when a recipe has been uncrafted.
 * @param {number} row - The row number of the recipe in the sheet.
 */
class Recipe {
    /**
     * @param {Prefab[]} ingredients - The ingredients required to craft the recipe.
     * @param {boolean} uncraftable - Whether the recipe is uncraftable.
     * @param {string} objectTag - Phrase that describes which objects can be used to process the recipe.
     * @param {Duration} duration - How long it takes to process the recipe.
     * @param {Prefab[]} products - The products produced by the recipe.
     * @param {string} initiatedDescription - The description that indicates when a recipe has begun being processed.
     * @param {string} completedDescription - The description that indicates when a recipe has finished being processed.
     * @param {string} uncraftedDescription - The description that indicates when a recipe has been uncrafted.
     * @param {number} row - The row number of the recipe in the sheet.
     */
    constructor(ingredients, uncraftable, objectTag, duration, products, initiatedDescription, completedDescription, uncraftedDescription, row) {
        this.ingredients = ingredients;
        this.uncraftable = uncraftable;
        this.objectTag = objectTag;
        this.duration = duration;
        this.products = products;
        this.initiatedDescription = initiatedDescription;
        this.completedDescription = completedDescription;
        this.uncraftedDescription = uncraftedDescription;
        this.row = row;
    }

    /**
     * Returns the contents of the cell in the recipe sheet where the initiated description is stored.
     * @returns {string}
     */
    initiatedCell() {
        return constants.recipeSheetInitiatedColumn + this.row;
    }

    /**
     * Returns the contents of the cell in the recipe sheet where the completed description is stored.
     * @returns {string}
     */
    completedCell() {
        return constants.recipeSheetCompletedColumn + this.row;
    }

    /**
     * Returns the contents of the cell in the recipe sheet where the uncrafted description is stored.
     * @returns {string}
     */
    uncraftedCell() {
        return constants.recipeSheetUncraftedColumn + this.row;
    }
}

module.exports = Recipe;
