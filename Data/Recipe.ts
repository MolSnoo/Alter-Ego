import type { Duration } from "luxon";
import CollatedItem from "./CollatedItem.ts";
import Description from "./Description.ts";
import type Game from "./Game.ts";
import GameEntity from "./GameEntity.ts";
import type InventoryItem from "./InventoryItem.ts";
import type ItemInstance from "./ItemInstance.ts";
import type RecipeItem from "./RecipeItem.ts";
import type RoomItem from "./RoomItem.ts";

export type RecipeField = "ingredientsString"|"uncraftable"|"fixtureTag"|"durationString"|"productsString"|"initiatedDescription"|"completedDescription"|"uncraftedDescription";

/**
 * Allows players to transform items or inventory items into other items or inventory items.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/recipe.html
 */
export default class Recipe extends GameEntity implements PersistentGameEntity<RecipeField> {
    /**
     * The IDs of the ingredients required to carry out the recipe.
     */
    readonly ingredientsStrings: string[];
    /**
     * The ingredients required to carry out the recipe.
     */
    ingredients: RecipeItem[];
    /**
     * The ingredients required to carry out the recipe, as a flattened array.
     */
    ingredientsFlat: RecipeItem[];
    /**
     * Whether the product can be transformed back into its ingredients.
     */
    readonly uncraftable: boolean;
    /**
     * Phrase that allows an object with the matching recipeTag to process this recipe.
     *
     * @deprecated Use fixtureTag instead.
     */
    readonly objectTag: string;
    /**
     * Phrase that allows a fixture with the matching recipeTag to process this recipe.
     */
    readonly fixtureTag: string;
    /**
     * How long it takes to process the recipe. Accepted units: s, m, h, d, w, M, y.
     */
    readonly durationString: string;
    /**
     * How long it takes to process the recipe, as a duration object.
     */
    readonly duration: Duration<true>;
    /**
     * The IDs of the products produced by the recipe.
     */
    readonly productsStrings: string[];
    /**
     * The products produced by the recipe.
     */
    products: RecipeItem[];
    /**
     * The products produced by the recipe, as a flattened array.
     */
    productsFlat: RecipeItem[];
    /**
     * The description that indicates when a recipe has begun being processed.
     */
    readonly initiatedDescription: Description;
    /**
     * The description that indicates when a recipe has finished being processed or crafted.
     */
    readonly completedDescription: Description;
    /**
     * The description that indicates when a recipe has been uncrafted.
     */
    readonly uncraftedDescription: Description;

    /**
     * @param ingredientsStrings - The IDs of the ingredients required to carry out the recipe.
     * @param uncraftable - Whether the product can be transformed back into its ingredients.
     * @param fixtureTag - Phrase that allows a fixture with the matching recipeTag to process this recipe.
     * @param durationString - How long it takes to process the recipe. Accepted units: s, m, h, d, w, M, y.
     * @param duration - How long it takes to process the recipe, as a duration object.
     * @param productsStrings - The IDs of the products produced by the recipe.
     * @param initiatedDescription - The description that indicates when a recipe has begun being processed.
     * @param completedDescription - The description that indicates when a recipe has finished being processed or crafted.
     * @param uncraftedDescription - The description that indicates when a recipe has been uncrafted.
     * @param row - The row number of the recipe in the sheet.
     * @param game - The game this belongs to.
     */
    constructor(ingredientsStrings: string[], uncraftable: boolean, fixtureTag: string, durationString: string,
        duration: Duration, productsStrings: string[], initiatedDescription: string,
        completedDescription: string, uncraftedDescription: string, row: number, game: Game) {
        super(game, row);
        this.ingredientsStrings = ingredientsStrings;
        this.ingredients = new Array(this.ingredientsStrings.length);
        this.ingredientsFlat = [];
        this.uncraftable = uncraftable;
        this.fixtureTag = fixtureTag;
        this.objectTag = fixtureTag;
        this.durationString = durationString;
        this.duration = duration;
        this.productsStrings = productsStrings;
        this.products = new Array(this.productsStrings.length);
        this.productsFlat = [];
        this.initiatedDescription = new Description(initiatedDescription, this, game);
        this.completedDescription = new Description(completedDescription, this, game);
        this.uncraftedDescription = new Description(uncraftedDescription, this, game);
    }

    initiatedCell(): string {
        return this.getGame().constants.recipeSheetInitiatedColumn + this.row;
    }

    completedCell(): string {
        return this.getGame().constants.recipeSheetCompletedColumn + this.row;
    }

    uncraftedCell(): string {
        return this.getGame().constants.recipeSheetUncraftedColumn + this.row;
    }

    /**
     * Returns true if the given list of items matches the ingredients list exactly.
     * To be considered an exact match, all of the ingredient prefabs must match those of the given items,
     * and the given items must have a quantity greater than or equal to the required ingredient quantity.
     *
     * @param items - A list of items. This must be sorted alphabetically by prefab ID.
     */
    ingredientsMatch<T extends RoomItem | InventoryItem>(items: (CollatedItem<T> | ItemInstance)[]): boolean {
        if (items.length !== this.ingredientsFlat.length) return false;
        for (let [i, item] of items.entries()) {
            const ingredient = this.ingredientsFlat[i];
            if (item.prefab.id !== ingredient.prefab.id) return false;
            if (item.quantity < ingredient.quantity) return false;
			if (!isNaN(item.uses) && !isNaN(ingredient.uses) && item.uses < ingredient.uses) return false;
			if (!item.containerMatches(ingredient)) return false;
            if (item instanceof CollatedItem) item.setVariable(ingredient.quantityVariableName);
        }
        return true;
    }

    /**
     * Returns a subset of the given items which satisfy the recipe's ingredients list.
     * If the given items do not satisfy the recipe's ingredients list, returns an empty array.
     *
     * @param items - A list of items. This must be sorted alphabetically by prefab ID.
     */
    getIngredientItems<T extends RoomItem | InventoryItem>(items: CollatedItem<T>[]): CollatedItem<T>[] {
        let ingredients: CollatedItem<T>[] = [];
        for (const ingredient of this.ingredientsFlat) {
            for (const item of items) {
                // Check if this item has the same prefab as the current ingredient and has a sufficient quantity.
                if (item.prefab.id === ingredient.prefab.id && ingredient.quantitySatisfiedBy(item) && ingredient.usesSatisfiedBy(item) && item.containerMatches(ingredient)) {
                    ingredients.push(item);
                    item.setVariable(ingredient.quantityVariableName);
                    break;
                }
            }
        }
        if (this.ingredientsFlat.length !== ingredients.length) return [];
        else return ingredients;
    }

    /**
     * Calculates how many times the given list of ingredients satisfies this recipe.
     */
    getSatisfactoryProcessCount<T extends RoomItem | InventoryItem>(items: CollatedItem<T>[]): number {
        let satisfactoryItemsCounts: number[] = [];
        if (this.ingredientsFlat.length !== items.length) return 0;
		const allIngredientQuantitiesAreConstant = this.ingredientsFlat.filter(ingredient => !ingredient.quantityIsConstant).length === 0;
        for (let [i, item] of items.entries()) {
            const ingredient = this.ingredientsFlat[i];
            const ingredientIsAlsoProduct = this.isIngredientAndProduct(item);
            const ingredientUseCount = ingredientIsAlsoProduct ? item.uses : item.quantity;
            const itemSatisfiedQuantityCount = ingredient.getSatisfiedQuantityCount(ingredientUseCount);
            if (item.prefab.id !== ingredient.prefab.id || !item.containerMatches(ingredient) || !ingredient.quantitySatisfiedBy(item) || !ingredient.usesSatisfiedBy(item) || !ingredient.quantityIsConstant && itemSatisfiedQuantityCount === 0) return 0;
            if (!ingredient.quantityIsConstant) satisfactoryItemsCounts.push(itemSatisfiedQuantityCount);
        }
        // If EVERY value is NaN, we need to return 1, or else we return Infinity later on, and bad things can happen because of this.
        if (satisfactoryItemsCounts.every(satisfactoryItemCount => isNaN(satisfactoryItemCount))) return 1;
		if (allIngredientQuantitiesAreConstant) return 1;
        return Math.min(...satisfactoryItemsCounts.filter(satisfactoryItemsCount => !isNaN(satisfactoryItemsCount)));
    }

	/**
	 * Returns true if the given item is both an ingredient and a product. The given item must also match the container level (either top-level or contained).
	 */
	isIngredientAndProduct<T extends RoomItem | InventoryItem>(item: CollatedItem<T> | RecipeItem): boolean {
        const matchedIngredient = this.ingredientsFlat.find(ingredient => ingredient.prefab.id === item.prefab.id);
        if (!matchedIngredient) return false;
        const matchedProduct = this.productsFlat.find(product => product.prefab.id === item.prefab.id);
        if (!matchedProduct) return false;
        return matchedIngredient.container === matchedProduct.container && matchedIngredient.containedItemsString === matchedProduct.containedItemsString;
	}

    /**
     * Gets a map of all values associated with the given items.
     */
    getIngredientVariableValues<T extends RoomItem | InventoryItem>(items: CollatedItem<T>[]): Map<string, number> {
        const variableValues: Map<string, number> = new Map();
        for (const ingredient of this.ingredientsFlat) {
            for (const item of items) {
                if (ingredient.prefab.id !== item.prefab.id) continue;
                if (!ingredient.quantityIsConstant && ingredient.quantityVariableName !== "")
                    variableValues.set(ingredient.quantityVariableName, Math.floor(item.quantity / ingredient.quantity));
                if (!ingredient.usesIsConstant && ingredient.usesVariableName !== "")
                    variableValues.set(ingredient.usesVariableName, Math.floor(item.uses / ingredient.uses));
            }
        }
        return variableValues;
    }

    getEntityID(): string {
        return `${this.getEntityType()} on row ${this.row}`;
    }

    getLabel(field: RecipeField): string {
        switch (field) {
            case "ingredientsString": return "Ingredient Prefab(s)";
            case "uncraftable": return "Uncraftable?";
            case "fixtureTag": return "Fixture Tag";
            case "durationString": return "Process Duration";
            case "productsString": return "Produces Prefab(s)";
            case "initiatedDescription": return "Description When Initiated";
            case "completedDescription": return "Description When Completed";
            case "uncraftedDescription": return "Description When Uncrafted";
        }
    }

    getValue(field: RecipeField): string {
        switch (field) {
            case "ingredientsString": return this.ingredientsStrings.join(", ");
            case "uncraftable": return this.uncraftable ? "TRUE" : "FALSE";
            case "fixtureTag": return this.fixtureTag;
            case "durationString": return this.durationString;
            case "productsString": return this.productsStrings.join(", ");
            case "initiatedDescription": return this.initiatedDescription.text;
            case "completedDescription": return this.completedDescription.text;
            case "uncraftedDescription": return this.uncraftedDescription.text;
        }
    }

    getViewField(field: RecipeField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): string {
        return "Recipe";
    }
}
