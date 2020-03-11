const settings = include('settings.json');

const Narration = include(`${settings.dataDir}/Narration.js`);
const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

class Object {
    constructor(name, location, accessible, childPuzzleName, recipeTag, isHidingSpot, preposition, description, row) {
        this.name = name;
        this.location = location;
        this.accessible = accessible;
        this.childPuzzleName = childPuzzleName;
        this.childPuzzle = null;
        this.recipeTag = recipeTag;
        this.isHidingSpot = isHidingSpot;
        this.preposition = preposition;
        this.description = description;
        this.row = row;

        this.activated = false;
        this.duration = 0;
        this.timer = null;
    }

    setAccessible(game) {
        this.accessible = true;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.accessibleCell(), `Objects!${this.name}|${this.location.name}`, "TRUE"));
    }

    setInaccessible(game) {
        this.accessible = false;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.accessibleCell(), `Objects!${this.name}|${this.location.name}`, "FALSE"));
    }

    activate(game, player) {
        this.activated = true;
        if (player) new Narration(game, player, this.location, `${player.displayName} turns on the ${this.name}.`).send();
        else new Narration(game, null, this.location, `${this.name} turns on.`).send();

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

        // test if a recipe requiring two of the same prefab will use both of them
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
            if (recipe === null) return;
        }
        if (player) player.sendDescription(recipe.initiatedDescription, this);

        const timeInt = recipe.duration.substring(0, recipe.duration.length - 1);
        let time;
        if (recipe.duration.endsWith('s'))
            time = timeInt * 1000;
        else if (recipe.duration.endsWith('m'))
            time = timeInt * 60000;
        else if (recipe.duration.endsWith('h'))
            time = timeInt * 3600000;
        this.duration = time;

        let object = this;
        this.timer = setInterval(function () {
            object.duration -= 1000;

            if (object.duration <= 0) {
                clearInterval(object.timer);
                object.duration = 0;
                // Destroy the ingredients.
                for (let i = 0; i < ingredients.length; i++)
                    itemManager.destroyItem(ingredients[i]);
                // Instantiate the products.
                for (let i = 0; i < recipe.products.length; i++)
                    itemManager.instantiateItem(recipe.products[i], object.location, object, "", 1);
                if (player && player.location.name === object.location.name) player.sendDescription(recipe.completedDescription, object);
            }
        }, 1000);

        return;
    }

    deactivate(game, player) {
        this.activated = false;
        if (player) new Narration(game, player, this.location, `${player.displayName} turns off the ${this.name}.`).send();
        else new Narration(game, null, this.location, `${this.name} turns off.`).send();

        clearInterval(this.timer);
        this.duration = 0;

        return;
    }
    
    accessibleCell() {
        return settings.objectSheetAccessibleColumn + this.row;
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
