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
     * The IDs of the ingredients required to carry out the recipe.
     * @readonly
     * @type {string[]}
     */
    ingredientsStrings;
    /**
     * The ingredients required to carry out the recipe.
     * @type {Prefab[]}
     */
    ingredients;
    /**
     * Whether the product can be transformed back into its ingredients.
     * @readonly
     * @type {boolean}
     */
    uncraftable;
    /**
     * Phrase that allows an object with the matching recipeTag to process this recipe.
     * @readonly
     * @type {string}
     */
    objectTag;
    /**
     * How long it takes to process the recipe. Accepted units: s, m, h, d, w, M, y.
     * @readonly
     * @type {import('dayjs/plugin/duration.js').Duration}
     */
    duration;
    /**
     * The IDs of the products produced by the recipe.
     * @readonly
     * @type {string[]}
     */
    productsStrings;
    /**
     * The products produced by the recipe.
     * @type {Prefab[]}
     */
    products;
    /**
     * The description that indicates when a recipe has begun being processed.
     * @readonly
     * @type {string}
     */
    initiatedDescription;
    /**
     * The description that indicates when a recipe has finished being processed or crafted.
     * @readonly
     * @type {string}
     */
    completedDescription;
    /**
     * The description that indicates when a recipe has been uncrafted.
     * @readonly
     * @type {string}
     */
    uncraftedDescription;

    /**
     * @constructor
     * @param {string[]} ingredientsStrings - The IDs of the ingredients required to carry out the recipe.
     * @param {boolean} uncraftable - Whether the product can be transformed back into its ingredients.
     * @param {string} objectTag - Phrase that allows an object with the matching recipeTag to process this recipe.
     * @param {import('dayjs/plugin/duration.js').Duration} duration - How long it takes to process the recipe. Accepted units: s, m, h, d, w, M, y.
     * @param {string[]} productsStrings - The IDs of the products produced by the recipe.
     * @param {string} initiatedDescription - The description that indicates when a recipe has begun being processed.
     * @param {string} completedDescription - The description that indicates when a recipe has finished being processed or crafted.
     * @param {string} uncraftedDescription - The description that indicates when a recipe has been uncrafted.
     * @param {number} row - The row number of the recipe in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(ingredientsStrings, uncraftable, objectTag, duration, productsStrings, initiatedDescription, completedDescription, uncraftedDescription, row, game) {
        super(game, row);
        this.ingredientsStrings = ingredientsStrings;
        this.ingredients = new Array(this.ingredientsStrings.length);
        this.uncraftable = uncraftable;
        this.objectTag = objectTag;
        this.duration = duration;
        this.productsStrings = productsStrings;
        this.products = new Array(this.productsStrings.length);
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
