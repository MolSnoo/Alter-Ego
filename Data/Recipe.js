import Game from './Game.js';
import GameEntity from './GameEntity.js';
import Prefab from './Prefab.js';

/**
 * @class Recipe
 * @classdesc Allows players to transform items or inventory items into other items or inventory items.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/recipe.html
 */
export default class Recipe extends GameEntity {
    /**
     * The ingredients required to carry out the recipe.
     * @type {Prefab[]}
     */
    ingredients;
    /**
     * Whether the product can be transformed back into its ingredients.
     * @type {boolean}
     */
    uncraftable;
    /**
     * Phrase that allows an object with the matching recipeTag to process this recipe.
     * @type {string}
     */
    objectTag;
    /**
     * How long it takes to process the recipe. Accepted units: s, m, h, d, w, M, y.
     * @type {import('moment').Duration}
     */
    duration;
    /**
     * The products produced by the recipe.
     * @type {Prefab[]}
     */
    products;
    /**
     * The description that indicates when a recipe has begun being processed.
     * @type {string}
     */
    initiatedDescription;
    /**
     * The description that indicates when a recipe has finished being processed or crafted.
     * @type {string}
     */
    completedDescription;
    /**
     * The description that indicates when a recipe has been uncrafted.
     * @type {string}
     */
    uncraftedDescription;

    /**
     * @constructor
     * @param {Prefab[]} ingredients - The ingredients required to carry out the recipe.
     * @param {boolean} uncraftable - Whether the product can be transformed back into its ingredients.
     * @param {string} objectTag - Phrase that allows an object with the matching recipeTag to process this recipe.
     * @param {import('moment').Duration} duration - How long it takes to process the recipe. Accepted units: s, m, h, d, w, M, y.
     * @param {Prefab[]} products - The products produced by the recipe.
     * @param {string} initiatedDescription - The description that indicates when a recipe has begun being processed.
     * @param {string} completedDescription - The description that indicates when a recipe has finished being processed or crafted.
     * @param {string} uncraftedDescription - The description that indicates when a recipe has been uncrafted.
     * @param {number} row - The row number of the recipe in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(ingredients, uncraftable, objectTag, duration, products, initiatedDescription, completedDescription, uncraftedDescription, row, game) {
        super(game, row);
        this.ingredients = ingredients;
        this.uncraftable = uncraftable;
        this.objectTag = objectTag;
        this.duration = duration;
        this.products = products;
        this.initiatedDescription = initiatedDescription;
        this.completedDescription = completedDescription;
        this.uncraftedDescription = uncraftedDescription;
    }

    /**
     * @returns {string}
     */
    initiatedCell() {
        return this.game.constants.recipeSheetInitiatedColumn + this.row;
    }

    /**
     * @returns {string}
     */
    completedCell() {
        return this.game.constants.recipeSheetCompletedColumn + this.row;
    }

    /**
     * @returns {string}
     */
    uncraftedCell() {
        return this.game.constants.recipeSheetUncraftedColumn + this.row;
    }
}
