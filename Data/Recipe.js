const constants = include('Configs/constants.json');

class Recipe {
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

    initiatedCell() {
        return constants.recipeSheetInitiatedColumn + this.row;
    }
    completedCell() {
        return constants.recipeSheetCompletedColumn + this.row;
    }
}

module.exports = Recipe;
