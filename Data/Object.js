const constants = include('Configs/constants.json');

const Narration = include(`${constants.dataDir}/Narration.js`);

var moment = require('moment');
var timer = require('moment-timer');
moment().format();

/**
 * @typedef {object} Process
 * @property {Recipe | null} recipe - The recipe being processed.
 * @property {Item[]} ingredients - The ingredients used in the recipe.
 * @property {Duration | null} duration - The duration of the recipe.
 * @property {timer | null} timer - The timer used to track the duration of the recipe.
 */

/**
 * @typedef {object} FindRecipeResult
 * @property {Recipe | null} recipe - The recipe found.
 * @property {Item[]} ingredients - The ingredients used in the recipe.
 */

/**
 * @typedef {object} RemainingIngredient
 * @property {number} ingredientIndex - The index of the ingredient in the ingredients array.
 * @property {number} productIndex - The index of the product in the products array.
 * @property {boolean} decreaseUses - Whether to decrease the uses of the ingredient.
 * @property {boolean} nextStage - Whether to move to the next stage of the product.
 */

/**
 * @class Object
 * @classdesc Represents an object in the game.
 * @param {string} name - The name of the object.
 * @param {Room} location - The room the object is located in.
 * @param {boolean} accessible - Whether the object can be interacted with.
 * @param {string} childPuzzleName - Name of a puzzle that is associated with the object.
 * @param {string} recipeTag - A keyword or phrase assigned to an object's recipe that allows it to carry out recipies that require it.
 * @param {boolean} activatable - Whether the object can be activated or deactivated with the use command.
 * @param {boolean} activated - Whether the object is currently checking for and processing a recipe.
 * @param {boolean} autoDeactivate - Whether the object should automatically deactivate after processing a recipe.
 * @param {number} hidingSpotCapacity - Whole number indicating how many players can hide in this object.
 * @param {string} preposition - A preposition that can be used to refer to the object.
 * @param {string} description - A description of the object.
 * @param {number} row - The row number of the object in the sheet.
 */
class Object {
    /**
     * @param {string} name - The name of the object.
     * @param {Room} location - The room the object is located in.
     * @param {boolean} accessible - Whether the object can be interacted with.
     * @param {string} childPuzzleName - Name of a puzzle that is associated with the object.
     * @param {string} recipeTag - A keyword or phrase assigned to an object's recipe that allows it to carry out recipies that require it.
     * @param {boolean} activatable - Whether the object can be activated or deactivated with the use command.
     * @param {boolean} activated - Whether the object is currently checking for and processing a recipe.
     * @param {boolean} autoDeactivate - Whether the object should automatically deactivate after processing a recipe.
     * @param {number} hidingSpotCapacity - Whole number indicating how many players can hide in this object.
     * @param {string} preposition - A preposition that can be used to refer to the object.
     * @param {string} description - A description of the object.
     * @param {number} row - The row number of the object in the sheet.
     */
    constructor(name, location, accessible, childPuzzleName, recipeTag, activatable, activated, autoDeactivate, hidingSpotCapacity, preposition, description, row) {
        this.name = name;
        this.location = location;
        this.accessible = accessible;
        this.childPuzzleName = childPuzzleName;
        this.childPuzzle = null;
        this.recipeTag = recipeTag;
        this.activatable = activatable;
        this.activated = activated;
        this.autoDeactivate = autoDeactivate;
        this.hidingSpotCapacity = hidingSpotCapacity;
        this.preposition = preposition;
        this.description = description;
        this.row = row;

        /** @type {Process} */
        this.process = {recipe: null, ingredients: [], duration: null, timer: null};
        let object = this;
        /** @type {timer | null} */
        this.recipeInterval = this.recipeTag ? new moment.duration(1000).timer({start: true, loop: true}, function () {
            object.processRecipes(object);
        }) : null;
    }

    /**
     * Sets the object to be accessible.
     */
    setAccessible() {
        this.accessible = true;
    }

    /**
     * Sets the object to be inaccessible.
     */
    setInaccessible() {
        this.accessible = false;
    }

    /**
     * Makes the object start processing recipes.
     * @param {Game} game
     * @param {Player} player
     * @param {boolean} narrate
     */
    activate(game, player, narrate) {
        this.activated = true;
        if (narrate) {
            if (player) new Narration(game, player, game.rooms.find(room => room.name === this.location.name), `${player.displayName} turns on the ${this.name}.`).send();
            else new Narration(game, null, game.rooms.find(room => room.name === this.location.name), `${this.name} turns on.`).send();
        }

        /** @type {FindRecipeResult} */
        const result = this.findRecipe(game);
        if (result.recipe === null) {
            // If this is supposed to deactivate automatically and no recipe was found, turn it off after 1 minute.
            if (this.autoDeactivate) {
                this.process.duration = new moment.duration(1, 'm');
                let object = this;
                this.process.timer = new moment.duration(1000).timer({start: true, loop: true}, function () {
                    if (object.process.duration !== null) {
                        object.process.duration.subtract(1000, 'ms');
                        if (object.process.duration.asMilliseconds() <= 0)
                            object.deactivate(game, null, true);
                    }
                });
            }
            return;
        }

        this.process.recipe = result.recipe;
        this.process.ingredients = result.ingredients;
        if (player) player.sendDescription(game, this.process.recipe.initiatedDescription, this);
        this.process.duration = this.process.recipe.duration.clone();

        let object = this;
        object.process.timer = new moment.duration(1000).timer({start: true, loop: true}, function () {
            if (object.process.duration !== null) {
                object.process.duration.subtract(1000, 'ms');

                if (object.process.duration.asMilliseconds() <= 0)
                    process(game, object, player);
            }
        });
    }

    /**
     * Stops the object from processing recipes.
     * @param {Game} game
     * @param {Player} player
     * @param {boolean} narrate
     */
    deactivate(game, player, narrate) {
        this.activated = false;
        if (narrate) {
            if (player) new Narration(game, player, game.rooms.find(room => room.name === this.location.name), `${player.displayName} turns off the ${this.name}.`).send();
            else new Narration(game, null, game.rooms.find(room => room.name === this.location.name), `${this.name} turns off.`).send();
        }

        this.process.recipe = null;
        this.process.ingredients.length = 0;
        if (this.process.timer !== null)
            this.process.timer.stop();
        this.process.duration = null;
    }

    /**
     * Checks if the object is activated and processes its recipes if it is.
     * @param {Object} object
     */
    processRecipes(object) {
        if (object.activated) {
            /** @type {Game} */
            let game = include('game.json');
            const result = object.findRecipe(game);
            if (object.process.recipe === null && object.process.duration === null && result.recipe === null && object.autoDeactivate) {
                object.process.duration = new moment.duration(1, 'm');
                object.process.timer = new moment.duration(1000).timer({start: true, loop: true}, function () {
                    if (object.process.duration !== null) {
                        object.process.duration.subtract(1000, 'ms');
                        if (object.process.duration.asMilliseconds() <= 0)
                            object.deactivate(game, null, true);
                    }
                });
                return;
            }
            // If the current recipe being processed is no longer the one it found, cancel it.
            if (object.process.recipe !== null && result.recipe !== null && object.process.recipe.row !== result.recipe.row
                || object.process.recipe !== null && result.recipe === null) {
                object.process.recipe = null;
                object.process.ingredients.length = 0;
                if (object.process.timer !== null)
                    object.process.timer.stop();
                object.process.duration = null;
            }
            // Start a new process.
            if (object.process.recipe === null && result.recipe !== null) {
                object.process.recipe = result.recipe;
                object.process.ingredients = result.ingredients;
                object.process.duration = object.process.recipe.duration.clone();

                this.process.timer = new moment.duration(1000).timer({start: true, loop: true}, function () {
                    if (object.process.duration !== null) {
                        object.process.duration.subtract(1000, 'ms');

                        if (object.process.duration.asMilliseconds() <= 0)
                            process(game, object);
                    }
                });
            }
        }
    }

    /**
     * Finds recipes in the game object.
     * @param {Game} game
     * @returns {FindRecipeResult}
     */
    findRecipe(game) {
        // Get all the items contained within this object.
        let items = game.items.filter(item => item.containerName.startsWith("Object: ") && item.container instanceof Object && item.container.row === this.row && item.quantity > 0);
        const itemManager = include(`${constants.modulesDir}/itemManager.js`);
        for (let i = 0; i < items.length; i++)
            itemManager.getChildItems(items, items[i]);
        items.sort(function (a, b) {
            if (a.prefab.id < b.prefab.id) return -1;
            if (a.prefab.id > b.prefab.id) return 1;
            return 0;
        });

        const recipes = game.recipes.filter(recipe => recipe.objectTag === this.recipeTag);
        /** @type {Recipe | null} */
        let recipe = null;
        /** @type {Item[]} */
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
                    matches.push({recipe: recipes[i], ingredients: [...ingredients]});
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

        return {recipe: recipe, ingredients: ingredients};
    }

    /** @type {string} */
    descriptionCell() {
        return constants.objectSheetDescriptionColumn + this.row;
    }
}

/**
 * Checks if items match ingredients.
 * @param {Item[]} items
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
 * @param {Game} game
 * @param {Object} object
 * @param {Player} player
 */
function process(game, object, player) {
    /** @type {RemainingIngredient[]} */
    let remainingIngredients = [];
    // Make sure all the ingredients are still there.
    let stillThere = true;
    for (let i = 0; i < object.process.ingredients.length; i++) {
        const ingredient = object.process.ingredients[i];
        if (ingredient.quantity === 0) {
            stillThere = false;
            break;
        }
        for (let j = 0; j < object.process.recipe.products.length; j++) {
            const product = object.process.recipe.products[j];
            if (product.id === ingredient.prefab.id) {
                let decreaseUses = false;
                let nextStage = false;
                if (ingredient.uses - 1 === 0 && ingredient.prefab.nextStage !== null)
                    nextStage = true;
                else if (!isNaN(ingredient.uses))
                    decreaseUses = true;
                remainingIngredients.push({
                    ingredientIndex: i,
                    productIndex: j,
                    decreaseUses: decreaseUses,
                    nextStage: nextStage
                });
                break;
            }
        }
    }
    if (stillThere) {
        const itemManager = include(`${constants.modulesDir}/itemManager.js`);
        // If there is only one ingredient in this, remember its quantity.
        /** @type {number} */
        const quantity = object.process.ingredients.length === 1 ? object.process.ingredients[0].quantity : 1;
        // Destroy the ingredients.
        for (let i = 0; i < object.process.ingredients.length; i++) {
            let destroy = true;
            for (let j = 0; j < remainingIngredients.length; j++) {
                if (remainingIngredients[j].ingredientIndex === i && !remainingIngredients[j].nextStage) {
                    destroy = false;
                    break;
                }
            }
            if (destroy && object.process.ingredients[i].quantity > 0) itemManager.destroyItem(object.process.ingredients[i], quantity, true);
        }
        // Instantiate the products.
        for (let i = 0; i < object.process.recipe.products.length; i++) {
            let instantiate = true;
            let product = object.process.recipe.products[i];
            for (let j = 0; j < remainingIngredients.length; j++) {
                const ingredient = object.process.ingredients[remainingIngredients[j].ingredientIndex];
                if (remainingIngredients[j].productIndex === i && remainingIngredients[j].decreaseUses) {
                    instantiate = false;
                    ingredient.uses--;
                    if (ingredient.uses === 0) itemManager.destroyItem(ingredient, ingredient.quantity, true);
                    break;
                } else if (remainingIngredients[j].productIndex === i && remainingIngredients[j].nextStage) {
                    product = ingredient.prefab.nextStage;
                    break;
                } else if (remainingIngredients[j].productIndex === i && isNaN(ingredient.uses)) {
                    instantiate = false;
                    break;
                }
            }
            if (instantiate) itemManager.instantiateItem(product, object.location, object, "", quantity, new Map());
        }
        if (player && player.alive && player.location.name === object.location.name) player.sendDescription(game, object.process.recipe.completedDescription, object);
    }

    if (object.autoDeactivate)
        object.deactivate(game, null, true);
    else {
        object.process.timer.stop();
        object.process.duration = null;
        object.process.recipe = null;
        object.process.ingredients.length = 0;
    }
}

module.exports = Object;
