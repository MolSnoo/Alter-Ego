const settings = include('settings.json');

const Narration = include(`${settings.dataDir}/Narration.js`);
const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

class Object {
    constructor(name, location, accessible, childPuzzleName, recipeTag, activatable, activated, autoDeactivate, isHidingSpot, preposition, description, row) {
        this.name = name;
        this.location = location;
        this.accessible = accessible;
        this.childPuzzleName = childPuzzleName;
        this.childPuzzle = null;
        this.recipeTag = recipeTag;
        this.activatable = activatable;
        this.activated = activated;
        this.autoDeactivate = autoDeactivate;
        this.isHidingSpot = isHidingSpot;
        this.preposition = preposition;
        this.description = description;
        this.row = row;

        this.duration = 0;
        this.process = { recipe: null, ingredients: [], duration: 0, timer: null };
        let object = this;
        this.recipeInterval = setInterval(function () { object.processRecipes(object); }, 1000);
    }

    setAccessible(game) {
        this.accessible = true;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.accessibleCell(), `Objects!${this.name}|${this.location.name}`, "TRUE"));
    }

    setInaccessible(game) {
        this.accessible = false;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.accessibleCell(), `Objects!${this.name}|${this.location.name}`, "FALSE"));
    }

    activate(game, player, narrate) {
        this.activated = true;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.activatedCell(), `Objects!${this.name}|${this.location.name}`, "TRUE"));
        if (narrate) {
            if (player) new Narration(game, player, this.location, `${player.displayName} turns on the ${this.name}.`).send();
            else new Narration(game, null, this.location, `${this.name} turns on.`).send();
        }

        const result = this.findRecipe(game);
        if (result.recipe === null) {
            // If this is supposed to deactivate automatically and no recipe was found, turn it off after 1 minute.
            if (this.autoDeactivate) {
                this.process.duration = 60000;
                let object = this;
                this.process.timer = setInterval(function () {
                    object.process.duration -= 1000;
                    if (object.process.duration <= 0) {
                        object.deactivate(game, null, true);
                    }
                }, 1000);
            }
            return;
        }

        this.process.recipe = result.recipe;
        this.process.ingredients = result.ingredients;
        if (player) player.sendDescription(this.process.recipe.initiatedDescription, this);

        const timeInt = this.process.recipe.duration.substring(0, this.process.recipe.duration.length - 1);
        let time;
        if (this.process.recipe.duration.endsWith('s'))
            time = timeInt * 1000;
        else if (this.process.recipe.duration.endsWith('m'))
            time = timeInt * 60000;
        else if (this.process.recipe.duration.endsWith('h'))
            time = timeInt * 3600000;
        this.process.duration = time;

        let object = this;
        object.process.timer = setInterval(function () {
            object.process.duration -= 1000;

            if (object.process.duration <= 0) {
                // Make sure all the ingredients are still there.
                let stillThere = true;
                for (let i = 0; i < object.process.ingredients.length; i++) {
                    if (object.process.ingredients[i].quantity === 0) {
                        stillThere = false;
                        break;
                    }
                }
                if (stillThere) {
                    const itemManager = include(`${settings.modulesDir}/itemManager.js`);
                    // Destroy the ingredients.
                    for (let i = 0; i < object.process.ingredients.length; i++)
                        itemManager.destroyItem(object.process.ingredients[i]);
                    // Instantiate the products.
                    for (let i = 0; i < object.process.recipe.products.length; i++)
                        itemManager.instantiateItem(object.process.recipe.products[i], object.location, object, "", 1);
                    if (player && player.location.name === object.location.name) player.sendDescription(object.process.recipe.completedDescription, object);
                }

                if (object.autoDeactivate)
                    object.deactivate(game, null, true);
                else {
                    clearInterval(object.process.timer);
                    object.process.duration = 0;
                    object.process.recipe = null;
                    object.process.ingredients.length = 0;
                }
            }
        }, 1000);

        return;
    }

    deactivate(game, player, narrate) {
        this.activated = false;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.activatedCell(), `Objects!${this.name}|${this.location.name}`, "FALSE"));
        if (narrate) {
            if (player) new Narration(game, player, this.location, `${player.displayName} turns off the ${this.name}.`).send();
            else new Narration(game, null, this.location, `${this.name} turns off.`).send();
        }

        this.process.recipe = null;
        this.process.ingredients.length = 0;
        clearInterval(this.process.timer);
        this.process.duration = 0;

        return;
    }

    processRecipes(object) {
        if (object.activated) {
            var game = include('game.json');
            const result = object.findRecipe(game);
            if (object.process.recipe === null && object.process.duration === 0 && result.recipe === null && object.autoDeactivate) {
                object.process.duration = 60000;
                object.process.timer = setInterval(function () {
                    object.process.duration -= 1000;
                    if (object.process.duration <= 0) {
                        object.deactivate(game, null, true);
                    }
                }, 1000);
                return;
            }
            // If the current recipe being processed is no longer the one it found, cancel it.
            if (object.process.recipe !== null && result.recipe !== null && object.process.recipe.row !== result.recipe.row
                || object.process.recipe !== null && result.recipe === null) {
                object.process.recipe = null;
                object.process.ingredients.length = 0;
                clearInterval(object.process.timer);
                object.process.duration = 0;
            }
            // Start a new process.
            if (object.process.recipe === null && result.recipe !== null) {
                object.process.recipe = result.recipe;
                object.process.ingredients = result.ingredients;

                const timeInt = object.process.recipe.duration.substring(0, object.process.recipe.duration.length - 1);
                let time;
                if (object.process.recipe.duration.endsWith('s'))
                    time = timeInt * 1000;
                else if (object.process.recipe.duration.endsWith('m'))
                    time = timeInt * 60000;
                else if (object.process.recipe.duration.endsWith('h'))
                    time = timeInt * 3600000;
                object.process.duration = time;

                this.process.timer = setInterval(function () {
                    object.process.duration -= 1000;

                    if (object.process.duration <= 0) {
                        // Make sure all the ingredients are still there.
                        let stillThere = true;
                        for (let i = 0; i < object.process.ingredients.length; i++) {
                            if (object.process.ingredients[i].quantity === 0) {
                                stillThere = false;
                                break;
                            }
                        }
                        if (stillThere) {
                            const itemManager = include(`${settings.modulesDir}/itemManager.js`);
                            // Destroy the ingredients.
                            for (let i = 0; i < object.process.ingredients.length; i++)
                                itemManager.destroyItem(object.process.ingredients[i]);
                            // Instantiate the products.
                            for (let i = 0; i < object.process.recipe.products.length; i++)
                                itemManager.instantiateItem(object.process.recipe.products[i], object.location, object, "", 1);
                        }

                        if (object.autoDeactivate)
                            object.deactivate(game, null, true);
                        else {
                            clearInterval(object.process.timer);
                            object.process.duration = 0;
                            object.process.recipe = null;
                            object.process.ingredients.length = 0;
                        }
                    }
                }, 1000);
            }
        }

        return;
    }

    findRecipe(game) {
        // Get all the items contained within this object.
        var items = game.items.filter(item => item.containerName.startsWith("Object: ") && item.container.row === this.row && item.quantity > 0);
        const itemManager = include(`${settings.modulesDir}/itemManager.js`);
        for (let i = 0; i < items.length; i++)
            itemManager.getChildItems(items, items[i]);
        items.sort(function (a, b) {
            if (a.prefab.id < b.prefab.id) return -1;
            if (a.prefab.id > b.prefab.id) return 1;
            return 0;
        });

        const recipes = game.recipes.filter(recipe => recipe.objectTag === this.recipeTag);
        var recipe = null;
        var ingredients = [];
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
            let matches = [];
            for (let i = 0; i < recipes.length; i++) {
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
                else ingredients.length = 0;
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
    
    accessibleCell() {
        return settings.objectSheetAccessibleColumn + this.row;
    }

    activatedCell() {
        return settings.objectSheetActivatedColumn + this.row;
    }

    descriptionCell() {
        return settings.objectSheetDescriptionColumn + this.row;
    }
}

function ingredientsMatch(items, ingredients) {
    if (items.length !== ingredients.length) return false;
    for (let i = 0; i < items.length; i++)
        if (items[i].prefab.id !== ingredients[i].id) return false;
    return true;
}

module.exports = Object;
