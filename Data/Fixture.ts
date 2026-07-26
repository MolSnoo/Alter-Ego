// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Duration } from "luxon";
import Timer from "../Classes/Timer.ts";
import { MessageDisplayType } from "../Modules/enums.ts";
import { getChildItems, combineProceduralSelections } from "../Modules/itemManager.ts";
import DeactivateAction from "./Actions/DeactivateAction.ts";
import InstantiateRoomItemAction from "./Actions/InstantiateRoomItemAction.ts";
import CollatedItem from "./CollatedItem.ts";
import type Game from "./Game.ts";
import HidingSpot from "./HidingSpot.ts";
import type ItemInstance from "./ItemInstance.ts";
import type Player from "./Player.ts";
import type Prefab from "./Prefab.ts";
import type Puzzle from "./Puzzle.ts";
import type Recipe from "./Recipe.ts";
import RecipeProcessor, { type Process } from "./RecipeProcessor.ts";
import type Room from "./Room.ts";
import type RoomItem from "./RoomItem.ts";
import { itemIdentifierMatches } from "../Modules/matchers.ts";

export type FixtureField = "name"|"location"|"accessible"|"childPuzzle"|"recipeTag"|"activatable"|"activated"|"autoDeactivate"|"hidingSpotCapacity"|"preposition"|"description";

interface FindRecipeResult {
    /** The recipe found. */
    recipe: Recipe | null;
    /** The ingredients used in the recipe. */
    ingredients: CollatedItem<RoomItem>[];
}

/**
 * Represents a fixed structure in a room that cannot be taken or moved by a player.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/fixture.html
 */
export default class Fixture extends RecipeProcessor implements PersistentGameEntity {
    /**
     * The name of the fixture.
     */
    readonly name: string;
    /**
     * The display name of the room the fixture is located in.
     */
    readonly locationDisplayName: string;
    /**
     * The room the fixture is located in.
     */
    location: Room;
    /**
     * Whether the fixture can be interacted with.
     */
    accessible: boolean;
    /**
     * The name of a puzzle that is associated with the fixture.
     */
    readonly childPuzzleName: string;
    /**
     * The puzzle that is associated with the fixture.
     */
    childPuzzle: Puzzle;
    /**
     * A keyword or phrase assigned to a fixture's recipe that allows it to carry out recipes that require it.
     */
    private _recipeTag: string;
    /**
     * Whether the fixture can be activated or deactivated with the use command.
     */
    activatable: boolean;
    /**
     * Whether the fixture is currently checking for and processing recipes.
     */
    activated: boolean;
    /**
     * Whether the fixture should automatically deactivate after processing a recipe.
     */
    autoDeactivate: boolean;
    /**
     * Whole number indicating how many players can hide in this fixture.
     */
    hidingSpotCapacity: number;
    /**
     * The hiding spot associated with this fixture. If this fixture is not a hiding spot, this is null.
     */
    hidingSpot: HidingSpot;
    /**
     * A preposition that will be used when a player drops an item in this fixture. If this blank, players cannot drop items into it.
     */
    preposition: string;
    /**
     * The current recipe being processed, the ingredients being processed, the products being instantiated, the recipe's duration, and a timer counting down until the recipe finishes.
     */
    process: Process<RoomItem>;
    /**
     * A timer that checks for recipes that the fixture can process every second.
     */
    recipeInterval: Timer;

    /**
     * @param name - The name of the fixture.
     * @param locationDisplayName - The display name of the room the fixture is located in.
     * @param accessible - Whether the fixture can be interacted with.
     * @param childPuzzleName - The name of a puzzle that is associated with the fixture.
     * @param recipeTag - A keyword or phrase assigned to an fixture's recipe that allows it to carry out recipes that require it.
     * @param activatable - Whether the fixture can be activated or deactivated with the use command.
     * @param activated - Whether the fixture is currently checking for and processing recipes.
     * @param autoDeactivate - Whether the fixture should automatically deactivate after processing a recipe.
     * @param hidingSpotCapacity - Whole number indicating how many players can hide in this fixture.
     * @param preposition - A preposition that will be used when a player drops an item in this fixture. If this blank, players cannot drop items into it.
     * @param description - A description of the fixture. Can contain an item list.
     * @param row - The row number of the fixture in the sheet.
     * @param game - The game this belongs to.
     */
    constructor(name: string, locationDisplayName: string, accessible: boolean, childPuzzleName: string,
        recipeTag: string, activatable: boolean, activated: boolean, autoDeactivate: boolean,
        hidingSpotCapacity: number, preposition: string, description: string, row: number, game: Game) {
        super(game, row, description);
        this.name = name;
        this.locationDisplayName = locationDisplayName;
        this.location = null;
        this.accessible = accessible;
        this.childPuzzleName = childPuzzleName;
        this.childPuzzle = null;
        this._recipeTag = recipeTag;
        this.activatable = activatable;
        this.activated = activated;
        this.autoDeactivate = autoDeactivate;
        this.hidingSpotCapacity = hidingSpotCapacity;
        this.hidingSpot = this.hidingSpotCapacity > 0 ? new HidingSpot(this, this.hidingSpotCapacity, this.row, this.getGame()) : null;
        this.preposition = preposition;

        this.process = { recipe: null, ingredients: [], products: [], satisfactoryProcessCount: 0, duration: null, timer: null };
        let fixture = this;
        this.recipeInterval = this.recipeTag ? new Timer(1000, { start: true, loop: true }, function () { if (fixture.activated) fixture.processRecipes(); }) : null;
    }

    /**
     * Sets the location.
     */
    setLocation(room: Room): void {
        this.location = room;
    }

    /**
     * Sets the child puzzle.
     */
    setChildPuzzle(puzzle: Puzzle): void {
        this.childPuzzle = puzzle;
    }

    /**
     * Sets the fixture to be accessible.
     */
    setAccessible(): void {
        this.accessible = true;
    }

    /**
     * Sets the fixture to be inaccessible.
     */
    setInaccessible(): void {
        this.accessible = false;
    }

    /** Gets the entity's location. */
    getLocation(): Room {
        return this.location;
    }

    /** A keyword or phrase assigned to an fixture's recipe that allows it to carry out recipes that require it. */
    get recipeTag(): string {
        return this._recipeTag;
    }

    /**
     * Sets the fixture's recipe tag. This will immediately stop any recipes the fixture is currently processing.
     * @param tag - The tag to set.
     */
    setRecipeTag(tag: string): void {
        this._clearProcess();
        this._recipeTag = tag?.trim();
    }

    /**
     * Returns the args for an ActionDirective that only needs to be able to look up this Fixture.
     * @returns [name, location]
     */
    getGeneralActionDirectiveArgs(): string[] {
        return [this.name, this.location.id];
    }

    /**
     * Returns the args for the Inspect ActionDirective for this fixture.
     * @returns ["F", fixture name, fixture location id]
     */
    getInspectActionDirectiveArgs(): [string, string, string] {
        return ["F", this.name, this.getLocation().id];
    }

    /**
     * Returns the args for the Activate or Deactivate ActionDirective for this fixture.
     * @returns [name, location, narrate]
     */
    getActivateOrDeactivateActionDirectiveArgs(narrate: boolean): [string, string, string] {
        return [this.name, this.getLocation().id, String(narrate)];
    }

    /**
     * Returns the args for the InstantiateRoomItem ActionDirective for this fixture.
     * @returns ["F", name, location, preposition]
     */
    getPartialInstantiateActionDirectiveArgs() {
        return ["F", this.name, this.location.displayName, this.getPreposition()];
    }

    /**
     * Returns the args for the DestroyRoomItem ActionDirective for this fixture.
     * @returns ["ALL", identifier, location, accessible, containerType, containerName, slotId]
     */
    getDestroyAllRoomItemActionDirectiveArgs(): [string, string, string, string, string, string, string] {
        return ["ALL", undefined, this.location.id, undefined, 'Fixture', this.name, undefined];
    }

    /**
     * Returns the args for the Find ActionDirective to get the contained items for this item container.
     */
    getFindChildItemsActionDirectiveArgs(inventorySlotID?: string): [string] {
        return [`RoomItems ${this.getPreposition()} ${this.getEntityID()} at ${this.getLocation().id}`];
    }

    /**
     * Returns true if the fixture is capable of containing items.
     */
    isItemContainer(): boolean {
        return this.preposition !== "" && this.childPuzzle === null;
    }

    /**
     * Returns true if the fixture is currently capable of being taken from/dropped into.
     * @param requireEmptySpace - Whether the container needs to be below max capacity. Defaults to true. Does nothing for fixtures.
     * @param bypassLimitations - Whether limitations should be bypassed. If true, the fixture can be processing items. Defaults to false.
     */
    canCurrentlyContainItems(requireEmptySpace = true, bypassLimitations = false): boolean {
        return (bypassLimitations || !this.isProcessingItems()) && (this.childPuzzle === null || this.childPuzzle.canCurrentlyContainItems());
    }

    /**
     * Gets all of the items this entity contains.
     */
    override getContainedItems(): RoomItem[] {
        return this.getGame().entityFinder.getRoomItems(undefined, this.location.id, undefined, 'Fixture', this.name);
    }

    /**
     * Gets all of the items that should appear in the fixture's item list.
     *
     * @param itemListName - The name of the item list. Unused.
     * @param player - The player the description is being sent to. Unused.
     */
    override getContainedItemsForItemList(itemListName?: string, player?: Player): RoomItem[] {
        return this.getGame().entityFinder.getRoomItems(undefined, this.location.id, true, 'Fixture', this.name);
    }

    /**
     * Returns true if this entity contains an item with the given identifier or prefab ID.
     * @param identifier - The identifier or prefab ID to search for.
     */
    override containsItem(identifier: string): boolean {
        const containedItems = this.getContainedItems();
        for (const item of containedItems) {
            if (itemIdentifierMatches(item, identifier, true)) return true;
        }
        return false;
    }

    /**
     * Returns the item contained inside of this container with the given identifier or prefab ID.
     * If no such item exists, returns undefined.
     * @param identifier - The identifier or prefab ID to search for.
     */
    override getContainedItem(identifier: string): ItemInstance {
        return this.getGame().entityFinder.getRoomItem(identifier, this.location.id, 'Fixture', this.name);
    }

    /**
     * Returns true if the fixture is activated and deactivates automatically.
     */
    isProcessingItems(): boolean {
        return this.autoDeactivate && this.activated;
    }

    /**
     * Sets the fixture's process with the recipe result's recipe and ingredients.
     *
     * @param recipeResult - A found recipe result.
     */
    #setProcess(recipeResult: FindRecipeResult): void {
        this.process.recipe = recipeResult.recipe;
        this.process.ingredients = recipeResult.ingredients;
    }

    /**
     * Sets the fixture's duration.
     *
     * @param duration - A duration object. Defaults to the duration of the recipe currently being processed.
     */
    #setProcessDuration(duration: Duration = this.process.recipe?.duration ?? null): void {
        this.process.duration = duration;
    }

    /**
     * Sets the fixture's process with the instantiated products.
     *
     * @param products - The products to set for the process.
     */
    #setProcessProducts(products: RoomItem[]): void {
        this.process.products = products;
    }

    /**
     * Starts the process timer, and executes the given callback when its timer expires.
     */
    #whenProcessTimerExpires(callback: () => void): void {
        const fixture = this;
        this.process.timer = new Timer(1000, { start: true, loop: true }, function () {
            if (fixture.process.duration !== null) {
                fixture.process.duration = fixture.process.duration.minus(1000);
                if (fixture.process.duration.as('milliseconds') <= 0) {
                    callback();
                }
            }
        });
    }

    /**
     * Starts the process timer when no recipe was found and the fixture is set to deactivate automatically.
     */
    #startProcessTimerForAutoDeactivateFixtureWithNoRecipe(): void {
        this.#setProcessDuration(Duration.fromObject({ minutes: 1 }));
        this.#whenProcessTimerExpires(() => {
            this.#performDeactivate();
        });
    }

    /**
     * Ends recipe processing. If `this.autoDeactivate` is true, deactivates the fixture. Otherwise, just clears the process.
     */
    #endProcess(): void {
        if (this.autoDeactivate) this.#performDeactivate();
        else this._clearProcess();
    }

    /**
     * Makes the fixture start processing recipes.
     *
     * @param player - The player who activated the fixture, if applicable.
     */
    activate(player?: Player): void {
        this.activated = true;

        const result = this.findRecipe();
        if (result.recipe === null) {
            // If this is supposed to deactivate automatically and no recipe was found, turn it off after 1 minute.
            if (this.autoDeactivate) return this.#startProcessTimerForAutoDeactivateFixtureWithNoRecipe();
        }

        this.#setProcess(result);
        this.#setProcessDuration();
        this.#whenProcessTimerExpires(() => {
            this.processRecipe(player);
            this.#endProcess();
        });
    }

    /**
     * Stops the fixture from processing recipes.
     */
    deactivate(): void {
        this.activated = false;
        this._clearProcess();
    }

    /**
     * Checks if the fixture is activated and processes its recipes if it is.
     */
    processRecipes(): void {
        const result = this.findRecipe();
        if (this.process.recipe === null && this.process.duration === null && result.recipe === null && this.autoDeactivate)
            return this.#startProcessTimerForAutoDeactivateFixtureWithNoRecipe();
        // If the current recipe being processed is no longer the one it found, cancel it.
        if (this.process.recipe !== null && (result.recipe === null || result.recipe !== null && this.process.recipe.row !== result.recipe.row))
            this._clearProcess();
        // Start a new process.
        if (this.process.recipe === null && result.recipe !== null) {
            this.#setProcess(result);
            this.#setProcessDuration();
            this.#whenProcessTimerExpires(() => {
                this.processRecipe();
                this.#endProcess();
            });
        }
    }

    /**
     * Processes a recipe. This destroys the process's ingredients and instantiates the products.
     *
     * @param player - The player who initiated the recipe, if any. If a player is given and they are still in the room, they will be sent the recipe's completedDescription.
     */
    private processRecipe(player?: Player): void {
        // Calculate how many times the fixture's ingredients satisfy the current recipe.
        this.process.satisfactoryProcessCount = this.process.recipe.getSatisfactoryProcessCount(this.process.ingredients);
        if (this.process.satisfactoryProcessCount < 1) return;
        const variableValues = this.process.recipe.getIngredientVariableValues(this.process.ingredients);
        const proceduralSelections = combineProceduralSelections(this.process.ingredients);
        this.destroyIngredients(this.process.recipe, this.process.ingredients, this.process.satisfactoryProcessCount);
        const instantiatedProducts = this.instantiateProducts<RoomItem>(this.process.recipe, this.process.satisfactoryProcessCount, variableValues, proceduralSelections, player);
        this.#setProcessProducts(instantiatedProducts);
        this.#sendRecipeCompletedDescription(player);
    }

    /**
     * Instantiates a room item in this fixture.
     *
     * @param prefab - The prefab to instantiate.
     * @param quantity - The quantity of the prefab to instantiate.
     * @param uses - The number of uses to instantiate the prefab with. Defaults to the prefab's number of uses.
     * @param proceduralSelections - The manually selected procedural possibilities.
     * @param container - The container to instantiate the prefab into. Defaults to the fixture itself.
     * @param inventorySlotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
     * @param player - The player who caused this instantiation, if applicable.
     * @returns The instantiated room item.
     */
    protected override instantiate(prefab: Prefab, quantity: number, uses: number = prefab.uses, proceduralSelections: Map<string, string> = new Map(), container: RoomItemContainer = this.childPuzzle ?? this, inventorySlotId: string = "", player?: Player): RoomItem[] {
        const instantiatingPlayer = player && player.alive && player.location.id === this.location.id ? player : undefined;
        const instantiateAction = new InstantiateRoomItemAction(this.getGame(), undefined, instantiatingPlayer, this.location, true);
        return instantiateAction.performInstantiateRoomItem(prefab, container, inventorySlotId, quantity, proceduralSelections, uses);
    }

    /**
     * Gets the actual ingredient item instance that was used as an ingredient in the currently processed recipe.
     * If no such item exists, returns the corresponding ingredient prefab of the currently processed recipe.
     * If no recipe is currently being processed, returns undefined.
     * @param prefabId - The prefab ID to search for.
     */
    public override getIngredientItem(prefabId: string): Prefab | RoomItem {
        for (const ingredient of this.process.ingredients) {
            if (itemIdentifierMatches(ingredient.items[0], prefabId, true)) return ingredient.items[0];
        }
        return this.process.recipe?.ingredientsFlat.find(ingredient => ingredient.prefab.id === prefabId)?.prefab;
    }

    /**
     * Gets the actual product item instance that was instantiated in the currently processed recipe.
     * If no such item exists, returns the corresponding product prefab of the currently processed recipe.
     * If no recipe is currently being processed, returns undefined.
     * @param prefabId - The prefab ID to search for.
     */
    public override getProductItem(prefabId: string): Prefab | RoomItem {
        for (const product of this.process.products) {
            if (itemIdentifierMatches(product, prefabId, true)) return product;
        }
        return this.process.recipe?.productsFlat.find(product => product.prefab.id === prefabId)?.prefab;
    }

    /**
     * If a player is given and they are still alive and in the same room as the fixture, sends them the processed recipe's completed description.
     *
     * @param player - The player to send the completed description to.
     */
    #sendRecipeCompletedDescription(player: Player): void {
        if (player && player.alive && player.location.id === this.location.id) {
            const completedDescription = this.process.recipe.completedDescription.parseFor(player, this);
            const messageDisplayType = this.process.recipe.completedDescription.messageDisplayType ?? MessageDisplayType.STANDARD;
            const interactables = this.getGame().clientContext.interactableManager.createInspectActionInteractable([this], player);
            player.sendDescription(completedDescription, this, messageDisplayType, interactables);
        }
    }

    /**
     * Creates a DeactivateAction and calls performDeactivate.
     *
     * @param player - The player who initiated the recipe, if any.
     */
    #performDeactivate(player?: Player): void {
        const deactivateAction = new DeactivateAction(this.getGame(), undefined, player, this.location, true);
        deactivateAction.performDeactivate(this, true);
    }

    /**
     * Finds a recipe that can currently be processed by this fixture. The fixture must contain all of the ingredients for this recipe.
     * If multiple recipes can be processed, it will choose the one with the highest number of matched ingredients.
     */
    findRecipe(): FindRecipeResult {
        // Get all the items contained within this fixture.
        const items = this.getGame().entityFinder.getRoomItems(undefined, this.location.id, undefined, this.childPuzzle ? "Puzzle" : "Fixture", this.childPuzzle ? this.childPuzzle.name : this.name);
        for (let i = 0; i < items.length; i++)
            getChildItems(items, items[i]);
        const collatedItems = CollatedItem.collate(items);

        const recipes = this.getGame().recipes.filter(recipe => recipe.fixtureTag === this.recipeTag);
        let recipe: Recipe = null;
        let ingredients: CollatedItem<RoomItem>[] = [];
        // Check if there's a recipe whose ingredients matches items exactly.
        for (let i = 0; i < recipes.length; i++) {
            if (recipes[i].ingredientsMatch(collatedItems)) {
                recipe = recipes[i];
                ingredients = collatedItems;
                break;
            }
        }
        // If no exact match was found, get all recipes that are satisfied by items.
        if (recipe === null) {
            let matches: FindRecipeResult[] = [];
            for (let i = 0; i < recipes.length; i++) {
                const matchedIngredients = recipes[i].getIngredientItems(collatedItems);
                if (matchedIngredients.length > 0) matches.push({ recipe: recipes[i], ingredients: [...matchedIngredients] });
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

    /**
     * Gets the fixture's name preceded by "the".
     * It will not be preceded by "the" if its name ends in a number.
     */
    getContainingPhrase(): string {
        return this.name.match(/.*\d+$/) ? this.name : `the ${this.name}`;
    }

    /**
     * Gets the fixture's preposition. If no preposition is set, returns "in".
     */
    getPreposition(): string {
        return this.preposition ? this.preposition : "in";
    }

    descriptionCell(): string {
        return this.getGame().constants.fixtureSheetDescriptionColumn + this.row;
    }

    getContainerIdentifier(): string {
        return this.getEntityID();
    }

    getContainerType(): string {
        return "Fixture";
    }

    getEntityID(): string {
        return this.name;
    }

    getLabel(field: FixtureField): string {
        switch (field) {
            case "name": return "Fixture Name";
            case "location": return "Location";
            case "accessible": return "Accessible?";
            case "childPuzzle": return "Child Puzzle";
            case "recipeTag": return "Recipe Tag";
            case "activatable": return "Activatable?";
            case "activated": return "Activated?";
            case "autoDeactivate": return "Deactivate Automatically?";
            case "hidingSpotCapacity": return "Hiding Spot Capacity";
            case "preposition": return "Preposition";
            case "description": return "Description";
        }
    }

    getValue(field: FixtureField): string {
        switch (field) {
            case "name": return this.name;
            case "location": return this.location.displayName;
            case "accessible": return this.accessible ? "TRUE" : "FALSE";
            case "childPuzzle": return this.childPuzzle?.name ?? "";
            case "recipeTag": return this.recipeTag;
            case "activatable": return this.activatable ? "TRUE" : "FALSE";
            case "activated": return this.activated ? "TRUE" : "FALSE";
            case "autoDeactivate": return this.autoDeactivate ? "TRUE" : "FALSE";
            case "hidingSpotCapacity": return String(this.hidingSpotCapacity);
            case "preposition": return this.preposition;
            case "description": return this.description.text;
        }
    }

    getViewField(field: FixtureField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): string {
        return "Fixture";
    }
}
