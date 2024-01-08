const constants = include('Configs/constants.json');

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
        return constants.recipeSheetInitiatedColumn + this.row;
    }
    completedCell() {
        return constants.recipeSheetCompletedColumn + this.row;
    }
}

module.exports = Recipe;
