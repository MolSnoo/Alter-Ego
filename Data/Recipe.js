const settings = include('settings.json');

class Recipe {
    constructor(ingredients, objectTag, duration, products, initiatedDescription, completedDescription, row) {
        this.ingredients = ingredients;
        this.objectTag = objectTag;
        this.duration = duration;
        this.products = products;
        this.initiatedDescription = initiatedDescription;
        this.completedDescription = completedDescription;
        this.row = row;
    }

    initiatedCell() {
        return settings.recipeSheetInitiatedColumn + this.row;
    }
    completedCell() {
        return settings.recipeSheetCompletedColumn + this.row;
    }
}

module.exports = Recipe;
