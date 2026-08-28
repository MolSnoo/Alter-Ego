// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getSortedItems } from "../Modules/helpers.ts";
import { getChildItems, combineProceduralSelections } from "../Modules/itemManager.ts";
import DestroyInventoryItemAction from "./Actions/DestroyInventoryItemAction.ts";
import DestroyRoomItemAction from "./Actions/DestroyRoomItemAction.ts";
import InstantiateInventoryItemAction from "./Actions/InstantiateInventoryItemAction.ts";
import InstantiateRoomItemAction from "./Actions/InstantiateRoomItemAction.ts";

import Fixture from "./Fixture.ts";
import InventoryItem from "./InventoryItem.ts";
import ItemInstance from "./ItemInstance.ts";
import type Player from "./Player.ts";
import type Prefab from "./Prefab.ts";
import Puzzle from "./Puzzle.ts";
import type RecipeItem from "./RecipeItem.ts";
import type Room from "./Room.ts";
import RoomItem from "./RoomItem.ts";

type ContainerOf<T extends ItemInstance | RoomItem | InventoryItem> =
    T extends RoomItem ? RoomItemContainer
    : T extends InventoryItem ? InventoryItem
    : never;

/**
 * Represents a list of room items that are instances of the same prefab in the same location and container.
 *
 * @typeParam T - The type of the items collated together. Must be either a {@link RoomItem} or {@link InventoryItem}.
 */
export default class CollatedItem<T extends ItemInstance | RoomItem | InventoryItem> {
    /**
     * The items collated together.
     */
    items: T[];
    /**
     * The prefab these items all have.
     */
    prefab: Prefab;
    /**
     * The name these items all have.
     */
    name: string;
    /**
     * The plural name these items all have.
     */
    pluralName: string;
    /**
     * The single containing phrase these items all have.
     */
    singleContainingPhrase: string;
    /**
     * The plural containing phrase these items all have.
     */
    pluralContainingPhrase: string;
    /**
     * The location these items all have.
     */
    location: Room;
    /**
     * The player these items all have, if they are inventory items. Will be null if these are room items.
     */
    player: Player;
    /**
     * The equipment slot these items all have, if they are inventory items in an equipment slot.
     */
    equipmentSlotId: string;
    /**
     * The container these items all have.
     */
    container: ContainerOf<RoomItem | InventoryItem>;
    /**
     * The ID of the inventory slot these items can be found in.
     */
    slot: string;
    /**
     * The total quantity of the items collated together.
     */
    quantity: number;
    /**
     * The total uses of the items collated together.
     */
    uses: number;
    /**
     * The recipe variable this is associated with.
     */
    variable: string;
    /**
     * A map of procedurals and the possibilities assigned to them. Consists of the procedural selections of all collated items joined together.
     */
    proceduralSelections: Map<string, string>;

    /**
     * @param items - The items to collate.
     */
    constructor(items: T[]) {
        this.items = items;
        this.prefab = items[0].prefab;
        this.name = items[0].name;
        this.pluralName = items[0].pluralName;
        this.singleContainingPhrase = items[0].singleContainingPhrase;
        this.pluralContainingPhrase = items[0].pluralContainingPhrase;
        this.location = items[0].getLocation();
        this.player = items[0] instanceof InventoryItem ? items[0].player : null;
        this.equipmentSlotId = items[0] instanceof InventoryItem ? items[0].equipmentSlot : null;
        this.container = items[0].container as ContainerOf<T>;
        this.slot = items[0].slot;
        this.quantity = this.items.reduce((quantity, item) => quantity + (isNaN(item.quantity) ? NaN : item.quantity), 0);
        this.uses = this.items.reduce((uses, item) => uses + (isNaN(item.uses) ? NaN : item.quantity * item.uses), 0);
        this.proceduralSelections = combineProceduralSelections(this.items);
    }

    /**
     * Returns an array of collated items.
     * Items are collated if they have the same identifier, container, and procedural selections.
     * @param items - The items to collate.
     */
    static collate<T extends RoomItem | InventoryItem>(items: T[]): CollatedItem<T>[] {
        const childItems: T[] = [];
        for (const item of items)
            getChildItems(childItems, item);
        for (const childItem of childItems) {
            if (!items.includes(childItem))
                items.push(childItem);
        }
        items = getSortedItems(items);
        const collatedItems: CollatedItem<T>[] = [];
        const itemsMap: Map<string, T[]> = new Map();
        for (const item of items) {
            const key = `${item.getIdentifier()}-${item.containerType}-${item.containerName}-${JSON.stringify([...item.proceduralSelections])}`;
            if (itemsMap.has(key)) itemsMap.get(key).push(item);
            else itemsMap.set(key, [item]);
        }
        for (const itemGroup of itemsMap.values())
            collatedItems.push(new CollatedItem(itemGroup));
        return collatedItems;
    }

    /**
     * Returns an array of collated items.
     * Items are collated if they have the same prefab ID, single containing phrase, and plural containing phrase.
     * @param items - The items to collate.
     */
    static collateForItemList<T extends ItemInstance>(items: T[]): CollatedItem<T>[] {
        const collatedItems: CollatedItem<T>[] = [];
        const itemsMap: Map<string, T[]> = new Map();
        for (const item of items) {
            const key = `${item.prefab.id}-${item.singleContainingPhrase}-${item.pluralContainingPhrase}`;
            if (itemsMap.has(key)) itemsMap.get(key).push(item);
            else itemsMap.set(key, [item]);
        }
        for (const itemGroup of itemsMap.values())
            collatedItems.push(new CollatedItem(itemGroup));
        return collatedItems;
    }

    /**
     * Sets the collated room item's variable for recipe processing.
     *
     * @param variable - The variable to set.
     */
    setVariable(variable: string): void {
        this.variable = variable;
    }

    /**
     * Recalculates uses and quantity stats.
     */
    #recalculate(): void {
        this.quantity = this.items.reduce((quantity, item) => quantity + (isNaN(item.quantity) ? NaN : item.quantity), 0);
        this.uses = this.items.reduce((uses, item) => uses + (isNaN(item.uses) ? NaN : item.quantity * item.uses), 0);
    }

    /**
     * Returns true if the collated items' container matches the given recipe item's container.
     */
    containerMatches(recipeItem: RecipeItem): boolean {
        if (recipeItem.container === null) return !(this.container instanceof ItemInstance);
        else return this.container instanceof ItemInstance && this.container.prefab.id === recipeItem.container.prefab.id;
    }

    /**
     * Returns true if all of the collated items have infinite uses.
     */
    allItemsHaveInfiniteUses(): boolean {
        return this.items.filter(item => !isNaN(item.uses)).length === 0;
    }

    /**
     * Decreases the collated room items' uses.
     *
     * @param ingredientUseCount - The number of times to use the item.
     */
    decreaseUses(ingredientUseCount: number): void {
        // If all items have infinite uses, don't do anything.
        if (this.allItemsHaveInfiniteUses()) return;
        // Sort collated items by lowest number of uses to highest, sorting within use by lowest quantity to highest.
        this.items.sort((a, b) => a.uses !== b.uses ? a.uses - b.uses : a.quantity - b.quantity);
        while (ingredientUseCount > 0) {
            // Early exit if total uses or total quantity is equal to zero.
            if (this.uses === 0 || this.quantity === 0) return;
            for (const item of this.items) {
                // Return if ingredientUseCount is 0.
                if (ingredientUseCount === 0) return;
                // If, somehow, the entire collated item has had its quantity reduced to zero but still has uses left, return to prevent an infinite loop.
                if (this.quantity === 0) return;
                // Continue to next item if uses is 0 or NaN or if quantity is 0.
                if (item.uses === 0 || item.quantity === 0 || isNaN(item.uses)) continue;
                // Define step as the lowest of either item.uses or ⌊ingredientUseCount/item.quantity⌋.
                const step = Math.min(Math.floor(ingredientUseCount / item.quantity), item.uses);
                // If step === 0, then we're on an item whose quantity prevents clean division of ingredientUseCount.
                if (step === 0) {
                    // First, check if there's an item that *doesn't* have this issue; if there is, continue.
                    if (this.items.find((findItem) => Math.min(Math.floor(ingredientUseCount / findItem.quantity), findItem.uses) > 0) !== undefined) continue;
                    // Next, check if we could simply consume one item off this stack to handle the remainder.
                    if (ingredientUseCount === item.uses) {
                        // Decrement quantity by 1 and decrement ingredientUseCount by item.uses.
                        item.quantity -= 1;
                        ingredientUseCount -= item.uses;
                        // Store nextStage.
                        const nextStage = item.prefab.nextStage;
                        if (nextStage)
                            // If we have a nextStage, we should instantiate it accordingly.
                            this.instantiate(nextStage, 1);
                        // Re-sort.
                        this.items.sort((a, b) => a.uses !== b.uses ? a.uses - b.uses : a.quantity - b.quantity);
                        // Re-calculate stats.
                        this.#recalculate();
                        // Break, to refresh this for loop.
                        break;
                    }
                    // Otherwise, split one item off of this stack.
                    item.quantity -= 1;
                    // To prevent it from being collated by the itemManager, it's necessary to instantiate it with a unique number of uses.
                    const split = this.instantiate(item.prefab, 1, NaN)[0];
                    // Manually set the newly split item's uses to be equal to the current stack's uses.
                    split.uses = item.uses;
                    this.items.push(split);
                    // Sort the collated items again so that the newly-split item is positioned properly.
                    this.items.sort((a, b) => a.uses !== b.uses ? a.uses - b.uses : a.quantity - b.quantity);
                    // Re-calculate stats.
                    this.#recalculate();
                    // Break so that we immediately re-enter the loop.
                    break;
                }
                // We go here if step is greater than zero.
                // First, decrement the item's uses, the collated uses, and the ingredientUseCount by the current step.
                item.uses -= step;
                ingredientUseCount -= step * item.quantity;
                // Check if the item uses is equal to zero.
                if (item.uses === 0) {
                    // Grab references now so we don't lose them when the item is destroyed.
                    const nextStage = item.prefab.nextStage;
                    const quantity = item.quantity;
                    // Destroy the item.
                    this.#destroyItem(item);
                    if (nextStage)
                        // If we have a nextStage, we should instantiate it accordingly.
                        this.instantiate(nextStage, quantity);
                    // Re-sort.
                    this.items.sort((a, b) => a.uses !== b.uses ? a.uses - b.uses : a.quantity - b.quantity);
                    // Re-calculate stats.
                    this.#recalculate();
                    // Break, on the off-chance this is the last loop we need.
                    break;
                }
                // Re-calculate stats.
                this.#recalculate();
            }
        }
    }

    /**
     * Destroys the given quantity of this item.
     *
     * @param ingredientDestroyCount - The quantity to destroy. Defaults to the item's total quantity.
     */
    destroy(ingredientDestroyCount: number = this.quantity): void {
        // If the given quantity is finite but all items have an infinite quantity, don't do anything.
        if (!isNaN(ingredientDestroyCount) && this.items.filter(item => !isNaN(item.quantity)).length === 0) return;
        // Sort collated items by lowest quantity to highest.
        this.items.sort((a, b) => a.quantity - b.quantity);
        while (ingredientDestroyCount > 0) {
            // Early exit if total quantity is equal to zero.
            if (this.quantity === 0) return;
            for (const item of this.items) {
                // Return if ingredientDestroyCount is 0.
                if (ingredientDestroyCount === 0) return;
                // Continue to the next item if quantity is 0 or NaN.
                if (item.quantity === 0 || isNaN(item.quantity)) continue;
                // If ingredientDestroyCount is Infinity, destroy the whole item.
                if (ingredientDestroyCount === Infinity)
                    this.#destroyItem(item);
                // If ingredientDestroyCount is greater than the current item's quantity, we have to destroy this one and move on to the next.
                else if (ingredientDestroyCount > item.quantity) {
                    ingredientDestroyCount -= item.quantity;
                    this.#destroyItem(item);
                }
                // If ingredientDestroyCount is less than or equal to the current item's quantity, we just need to destroy ingredientDestroyCount instances of this item.
                else if (ingredientDestroyCount <= item.quantity) {
                    this.#destroyItem(item, ingredientDestroyCount);
                    ingredientDestroyCount -= ingredientDestroyCount;
                }
                // Re-sort.
                this.items.sort((a, b) => a.quantity - b.quantity);
                // Re-calculate stats.
                this.#recalculate();
                // Break, to refresh this for loop.
                break;
            }
            // Re-calculate stats before repeating the while loop.
            this.#recalculate();
        }
    }

    /**
     * Destroys the given item.
     *
     * @param item - The item to destroy.
     * @param quantity - The quantity to destroy. Defaults to the item's total quantity.
     */
    #destroyItem(item: T, quantity: number = item.quantity): void {
        if (item instanceof RoomItem) {
            const destroyAction = new DestroyRoomItemAction(item.getGame(), undefined, this.player, item.getLocation(), true);
            destroyAction.performDestroyRoomItem(item, quantity, true);
        }
        else if (item instanceof InventoryItem) {
            const destroyAction = new DestroyInventoryItemAction(item.getGame(), undefined, this.player, item.getLocation(), true);
            destroyAction.performDestroyInventoryItem(item, quantity, true, false);
        }
    }

    /**
     * Instantiates the given prefab in the collated room item's container.
     *
     * @param prefab - The prefab to instantiate.
     * @param quantity - The quantity to instantiate it with.
     * @param uses - The number of uses to instantiate it with. Defaults to the prefab's uses.
     */
    instantiate(prefab: Prefab, quantity: number, uses: number = prefab.uses): T[] {
        if (this.container instanceof Fixture || this.container instanceof Puzzle || this.container instanceof RoomItem) {
            const instantiateAction = new InstantiateRoomItemAction(prefab.getGame(), undefined, this.player, this.location, true);
            return instantiateAction.performInstantiateRoomItem(prefab, this.container, this.slot, quantity, this.proceduralSelections, uses) as T[];
        }
        else if (this.container instanceof InventoryItem || this.container === null) {
            const instantiateAction = new InstantiateInventoryItemAction(prefab.getGame(), undefined, this.player, this.location, true);
            return instantiateAction.performInstantiateInventoryItem(prefab, this.equipmentSlotId, this.container, this.slot, quantity, this.proceduralSelections, uses, [], false) as T[];
        }
    }

    /**
     * Outputs a string to insert into an item list in a description.
     * If the given quantity is 1, returns the prefab's single containing phrase.
     * If the quantity is not 1, returns the prefab's quantity followed by its plural containing phrase.
     * If the quantity is infinite, returns only the prefab's plural containing phrase.
     */
    toSingleOrPluralContainingPhrase(): string {
        if (isNaN(this.quantity)) return this.pluralContainingPhrase;
        else if (this.quantity !== 1) return `${this.quantity} ${this.pluralContainingPhrase}`;
        else return this.singleContainingPhrase;
    }
}
