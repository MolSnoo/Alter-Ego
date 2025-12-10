import Game from './Game.js';
import RoomItem from './RoomItem.js';
import ItemContainer from './ItemContainer.js';
import Narration from './Narration.js';
import Player from './Player.js';
import Prefab from './Prefab.js';
import Puzzle from './Puzzle.js';
import Recipe from './Recipe.js';
import Room from './Room.js';
import { getChildItems, instantiateItem, destroyItem } from '../Modules/itemManager.js';
import Timer from '../Classes/Timer.js';
import dayjs from 'dayjs';
dayjs().format();

/**
 * @class Fixture
 * @classdesc Represents a fixed structure in a room that cannot be taken or moved by a player.
 * @extends ItemContainer
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/fixture.html
 */
export default class Fixture extends ItemContainer {
    /**
     * The name of the fixture.
     * @readonly
     * @type {string}
     */
    name;
    /**
     * The name of the room the fixture is located in.
     * @readonly
     * @type {string}
     */
    locationName;
    /**
     * The room the fixture is located in.
     * @type {Room}
     */
    location;
    /**
     * Whether the fixture can be interacted with.
     * @type {boolean}
     */
    accessible;
    /**
     * The name of a puzzle that is associated with the fixture.
     * @readonly
     * @type {string}
     */
    childPuzzleName;
    /** 
     * The puzzle that is associated with the fixture.
     * @type {Puzzle} 
     */
    childPuzzle;
    /**
     * A keyword or phrase assigned to an fixture's recipe that allows it to carry out recipes that require it.
     * @readonly
     * @type {string}
     */
    recipeTag;
    /**
     * Whether the fixture can be activated or deactivated with the use command.
     * @type {boolean}
     */
    activatable;
    /**
     * Whether the fixture is currently checking for and processing recipes.
     * @type {boolean}
     */
    activated;
    /**
     * Whether the fixture should automatically deactivate after processing a recipe.
     * @type {boolean}
     */
    autoDeactivate;
    /**
     * Whole number indicating how many players can hide in this fixture.
     * @type {number}
     */
    hidingSpotCapacity;
    /**
     * A preposition that will be used when a player drops an item in this fixture. If this blank, players cannot drop items into it.
     * @type {string}
     */
    preposition;
    /** 
     * The current recipe being processed, the ingredients being processed, the recipe's duration, and a timer counting down until the recipe finishes.
     * @type {Process} 
     */
    process;
    /** 
     * A timer that checks for recipes that the fixture can process every second.
     * @type {Timer}
     */
    recipeInterval;

    /**
     * @constructor
     * @param {string} name - The name of the fixture.
     * @param {string} locationName - The name of the room the fixture is located in.
     * @param {boolean} accessible - Whether the fixture can be interacted with.
     * @param {string} childPuzzleName - The name of a puzzle that is associated with the fixture.
     * @param {string} recipeTag - A keyword or phrase assigned to an fixture's recipe that allows it to carry out recipes that require it.
     * @param {boolean} activatable - Whether the fixture can be activated or deactivated with the use command.
     * @param {boolean} activated - Whether the fixture is currently checking for and processing recipes.
     * @param {boolean} autoDeactivate - Whether the fixture should automatically deactivate after processing a recipe.
     * @param {number} hidingSpotCapacity - Whole number indicating how many players can hide in this fixture.
     * @param {string} preposition - A preposition that will be used when a player drops an item in this fixture. If this blank, players cannot drop items into it.
     * @param {string} description - A description of the fixture. Can contain an item list.
     * @param {number} row - The row number of the fixture in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(name, locationName, accessible, childPuzzleName, recipeTag, activatable, activated, autoDeactivate, hidingSpotCapacity, preposition, description, row, game) {
        super(game, row, description);
        this.name = name;
        this.locationName = locationName;
        this.accessible = accessible;
        this.childPuzzleName = childPuzzleName;
        this.childPuzzle = null;
        this.recipeTag = recipeTag;
        this.activatable = activatable;
        this.activated = activated;
        this.autoDeactivate = autoDeactivate;
        this.hidingSpotCapacity = hidingSpotCapacity;
        this.preposition = preposition;

        this.process = { recipe: null, ingredients: [], duration: null, timer: null };
        let fixture = this;
        this.recipeInterval = this.recipeTag ? new Timer(dayjs.duration(1000), { start: true, loop: true }, function () { fixture.processRecipes(); }) : null;
    }

    /**
     * Sets the fixture to be accessible.
     */
    setAccessible() {
        this.accessible = true;
    }

    /**
     * Sets the fixture to be inaccessible.
     */
    setInaccessible() {
        this.accessible = false;
    }

    /**
     * Makes the fixture start processing recipes.
     * @param {Player} player - The player who activated the fixture.
     * @param {boolean} narrate - Whether to narrate the fixture's activation.
     */
    activate(player, narrate) {
        this.activated = true;
        if (narrate) {
            if (player) new Narration(this.game, player, this.game.rooms.find(room => room.id === this.location.id), `${player.displayName} turns on the ${this.name}.`).send();
            else new Narration(this.game, null, this.game.rooms.find(room => room.id === this.location.id), `${this.name} turns on.`).send();
        }

        const result = this.findRecipe();
        if (result.recipe === null) {
            // If this is supposed to deactivate automatically and no recipe was found, turn it off after 1 minute.
            if (this.autoDeactivate) {
                this.process.duration = dayjs.duration(1, 'm');
                let fixture = this;
                this.process.timer = new Timer(dayjs.duration(1000), { start: true, loop: true }, function () {
                    if (fixture.process.duration !== null) {
                        fixture.process.duration.subtract(1000, 'ms');
                        if (fixture.process.duration.asMilliseconds() <= 0)
                            fixture.deactivate(null, true);
                    }
                });
            }
            return;
        }

        this.process.recipe = result.recipe;
        this.process.ingredients = result.ingredients;
        if (player) player.sendDescription(this.process.recipe.initiatedDescription, this);
        this.process.duration = this.process.recipe.duration.clone();

        let fixture = this;
        fixture.process.timer = new Timer(dayjs.duration(1000), { start: true, loop: true }, function () {
            if (fixture.process.duration !== null) {
                fixture.process.duration.subtract(1000, 'ms');

                if (fixture.process.duration.asMilliseconds() <= 0)
                    process(fixture, player);
            }
        });

        return;
    }

    /**
     * Stops the fixture from processing recipes.
     * @param {Player} player - The player who deactivated the fixture.
     * @param {boolean} narrate - Whether to narrate the fixture's deactivation.
     */
    deactivate(player, narrate) {
        this.activated = false;
        if (narrate) {
            if (player) new Narration(this.game, player, this.game.rooms.find(room => room.id === this.location.id), `${player.displayName} turns off the ${this.name}.`).send();
            else new Narration(this.game, null, this.game.rooms.find(room => room.id === this.location.id), `${this.name} turns off.`).send();
        }

        this.process.recipe = null;
        this.process.ingredients.length = 0;
        if (this.process.timer !== null)
            this.process.timer.stop();
        this.process.duration = null;

        return;
    }

    /**
     * Checks if the fixture is activated and processes its recipes if it is.
     */
    processRecipes() {
        if (this.activated) {
            const result = this.findRecipe();
            if (this.process.recipe === null && this.process.duration === null && result.recipe === null && this.autoDeactivate) {
                this.process.duration = dayjs.duration(1, 'm');
                const fixture = this;
                this.process.timer = new Timer(dayjs.duration(1000), { start: true, loop: true }, function () {
                    if (fixture.process.duration !== null) {
                        fixture.process.duration.subtract(1000, 'ms');
                        if (fixture.process.duration.asMilliseconds() <= 0)
                            fixture.deactivate(null, true);
                    }
                });
                return;
            }
            // If the current recipe being processed is no longer the one it found, cancel it.
            if (this.process.recipe !== null && result.recipe !== null && this.process.recipe.row !== result.recipe.row
                || this.process.recipe !== null && result.recipe === null) {
                this.process.recipe = null;
                this.process.ingredients.length = 0;
                if (this.process.timer !== null)
                    this.process.timer.stop();
                this.process.duration = null;
            }
            // Start a new process.
            if (this.process.recipe === null && result.recipe !== null) {
                this.process.recipe = result.recipe;
                this.process.ingredients = result.ingredients;
                this.process.duration = this.process.recipe.duration.clone();

                const fixture = this;
                this.process.timer = new Timer(dayjs.duration(1000), { start: true, loop: true }, function () {
                    if (fixture.process.duration !== null) {
                        fixture.process.duration.subtract(1000, 'ms');

                        if (fixture.process.duration.asMilliseconds() <= 0)
                            process(fixture);
                    }
                });
            }
        }

        return;
    }

    /**
     * Finds a recipe that can currently be processed by this fixture. The fixture must contain all of the ingredients for this recipe.
     * If multiple recipes can be processed, it will choose the one with the highest number of matched ingredients.
     * @returns {FindRecipeResult}
     */
    findRecipe() {
        // Get all the items contained within this fixture.
        let items = this.game.roomItems.filter(item => item.containerName.startsWith("Object: ") && item.container instanceof Fixture && item.container.row === this.row && item.quantity > 0);
        for (let i = 0; i < items.length; i++)
            getChildItems(items, items[i]);
        items.sort(function (a, b) {
            if (a.prefab.id < b.prefab.id) return -1;
            if (a.prefab.id > b.prefab.id) return 1;
            return 0;
        });

        const recipes = this.game.recipes.filter(recipe => recipe.fixtureTag === this.recipeTag);
        /** @type {Recipe} */
        let recipe = null;
        /** @type {RoomItem[]} */
        let ingredients = [];
        // Check if there's a recipe whose ingredients matches items exactly.
        for (let i = 0; i < recipes.length; i++) {
            if (ingredientsMatch(items, recipes[i].ingredients)) {
                recipe = recipes[i];
                ingredients = items;
                break;
            }
        }
        // If no exact match was found, get all recipes that are satisfied by items.
        if (recipe === null) {
            /** @type {FindRecipeResult[]} */
            let matches = [];
            for (let i = 0; i < recipes.length; i++) {
                ingredients.length = 0;
                // Find all the items that match the ingredients in this recipe.
                for (let j = 0; j < recipes[i].ingredients.length; j++) {
                    const ingredient = recipes[i].ingredients[j];
                    for (let k = 0; k < items.length; k++) {
                        // Check if this item has the same prefab as the current ingredient and that it isn't already in the ingredients list.
                        if (items[k].prefab.id === ingredient.id && !ingredients.find(ingredient => ingredient.row === items[k].row)) {
                            ingredients.push(items[k]);
                            break;
                        }
                    }
                }
                if (recipes[i].ingredients.length === ingredients.length)
                    matches.push({ recipe: recipes[i], ingredients: [...ingredients] });
            }
            if (matches.length > 0) {
                // Sort matches by number of matched ingredients in decreasing order.
                matches.sort(function (a, b) {
                    return b.ingredients.length - a.ingredients.length;
                });
                // Recipe will be the first one, which has the highest number of matches.
                recipe = matches[0].recipe;
                ingredients = matches[0].ingredients;
            }
        }

        return { recipe: recipe, ingredients: ingredients };
    }

    /** @returns {string} */
    descriptionCell() {
        return this.game.constants.fixtureSheetDescriptionColumn + this.row;
    }
}

/**
 * Checks if items match ingredients.
 * @param {RoomItem[]} items
 * @param {Prefab[]} ingredients
 * @returns {boolean}
 */
function ingredientsMatch(items, ingredients) {
    if (items.length !== ingredients.length) return false;
    for (let i = 0; i < items.length; i++)
        if (items[i].prefab.id !== ingredients[i].id) return false;
    return true;
}

/**
 * Processes a recipe.
 * @param {Fixture} fixture
 * @param {Player} [player]
 */
function process(fixture, player) {
    /** @type {RemainingIngredient[]} */
    let remainingIngredients = [];
    // Make sure all the ingredients are still there.
    let stillThere = true;
    for (let i = 0; i < fixture.process.ingredients.length; i++) {
        const ingredient = fixture.process.ingredients[i];
        if (ingredient.quantity === 0) {
            stillThere = false;
            break;
        }
        for (let j = 0; j < fixture.process.recipe.products.length; j++) {
            const product = fixture.process.recipe.products[j];
            if (product.id === ingredient.prefab.id) {
                let decreaseUses = false;
                let nextStage = false;
                if (ingredient.uses - 1 === 0 && ingredient.prefab.nextStage !== null)
                    nextStage = true;
                else if (!isNaN(ingredient.uses))
                    decreaseUses = true;
                remainingIngredients.push({ ingredientIndex: i, productIndex: j, decreaseUses: decreaseUses, nextStage: nextStage });
                break;
            }
        }
    }
    if (stillThere) {
        // If there is only one ingredient in this, remember its quantity.
        const quantity = fixture.process.ingredients.length === 1 ? fixture.process.ingredients[0].quantity : 1;
        // Destroy the ingredients.
        for (let i = 0; i < fixture.process.ingredients.length; i++) {
            let destroy = true;
            for (let j = 0; j < remainingIngredients.length; j++) {
                if (remainingIngredients[j].ingredientIndex === i && !remainingIngredients[j].nextStage) {
                    destroy = false;
                    break;
                }
            }
            if (destroy && fixture.process.ingredients[i].quantity > 0) destroyItem(fixture.process.ingredients[i], quantity, true);
        }
        // Instantiate the products.
        for (let i = 0; i < fixture.process.recipe.products.length; i++) {
            let instantiate = true;
            let product = fixture.process.recipe.products[i];
            for (let j = 0; j < remainingIngredients.length; j++) {
                const ingredient = fixture.process.ingredients[remainingIngredients[j].ingredientIndex];
                if (remainingIngredients[j].productIndex === i && remainingIngredients[j].decreaseUses) {
                    instantiate = false;
                    ingredient.uses--;
                    if (ingredient.uses === 0) destroyItem(ingredient, ingredient.quantity, true);
                    break;
                }
                else if (remainingIngredients[j].productIndex === i && remainingIngredients[j].nextStage) {
                    product = ingredient.prefab.nextStage;
                    break;
                }
                else if (remainingIngredients[j].productIndex === i && isNaN(ingredient.uses)) {
                    instantiate = false;
                    break;
                }
            }
            if (instantiate) instantiateItem(product, fixture.location, fixture, "", quantity, new Map());
        }
        if (player && player.alive && player.location.id === fixture.location.id) player.sendDescription(fixture.process.recipe.completedDescription, fixture);
    }

    if (fixture.autoDeactivate)
        fixture.deactivate(null, true);
    else {
        fixture.process.timer.stop();
        fixture.process.duration = null;
        fixture.process.recipe = null;
        fixture.process.ingredients.length = 0;
    }
}
