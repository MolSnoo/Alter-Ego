// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ButtonInteraction } from "discord.js";
import Action from "../Action.ts";
import type Event from "../Event.ts";
import Fixture from "../Fixture.ts";
import type Flag from "../Flag.ts";
import type Gesture from "../Gesture.ts";
import InventoryItem from "../InventoryItem.ts";
import ItemInstance from "../ItemInstance.ts";
import Player from "../Player.ts";
import type Prefab from "../Prefab.ts";
import Puzzle from "../Puzzle.ts";
import Recipe from "../Recipe.ts";
import type Room from "../Room.ts";
import RoomItem from "../RoomItem.ts";
import type Status from "../Status.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";
import { table } from "table";

type GameEntityFields = {
    row: 'Row',
    id?: 'ID',
    name?: 'Name',
    displayName?: 'Display Name',
    location?: 'Location',
    ingredients?: 'Ingredients',
    products?: 'Products',
    containerName?: 'Container',
    player?: 'Player',
    equipmentSlot?: 'Equip. Slot'
};

/**
 * Represents a find action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#find-action
 */
export default class FindAction extends Action {
    static readonly dataTypeRegex = /^((?<Room>room(?! ?item)s?)|(?<Fixture>objects?|fixtures?)|(?<Prefab>prefabs?)|(?<Recipe>recipes?)|(?<RoomItem>(room ?)?items?)|(?<Puzzle>puzzles?)|(?<Event>events?)|(?<Status>status(?:es)? ?(?:effects?)?)|(?<Player>players?)|(?<InventoryItem>inventory(?: ?items?)?)|(?<Gesture>gestures?)|(?<Flag>flags?))(?<search>.*)/i;
    #fields: GameEntityFields;

    /**
     * Performs a find action.
     *
     * @param query - A user-entered query to determine what game entities to find.
     */
    performFind(query: string): void {
        if (this.performed) return;
        super.perform();
        const dataTypeMatch = query.match(FindAction.dataTypeRegex);
        if (!dataTypeMatch || !dataTypeMatch.groups) throw new Error(`Couldn't find a valid data type in "${query}".`);
        if (dataTypeMatch.groups.search) query = query.substring(query.indexOf(dataTypeMatch.groups.search)).trim();
        else query = '';
        let results: PersistentGameEntity<any>[] = [];
        if (dataTypeMatch.groups.Room) results = this.#getRoomResults(query);
        else if (dataTypeMatch.groups.Fixture) results = this.#getFixtureResults(query);
        else if (dataTypeMatch.groups.Prefab) results = this.#getPrefabResults(query);
        else if (dataTypeMatch.groups.Recipe) results = this.#getRecipeResults(query);
        else if (dataTypeMatch.groups.RoomItem) results = this.#getRoomItemResults(query);
        else if (dataTypeMatch.groups.Puzzle) results = this.#getPuzzleResults(query);
        else if (dataTypeMatch.groups.Event) results = this.#getEventResults(query);
        else if (dataTypeMatch.groups.Status) results = this.#getStatusResults(query);
        else if (dataTypeMatch.groups.Player) results = this.#getPlayerResults(query);
        else if (dataTypeMatch.groups.InventoryItem) results = this.#getInventoryItemResults(query);
        else if (dataTypeMatch.groups.Gesture) results = this.#getGestureResults(query);
        else if (dataTypeMatch.groups.Flag) results = this.#getFlagResults(query);
        if (results.length === 0) return this.getGame().communicationHandler.sendToCommandChannel(`Found 0 results.`);
        this.#sendResultListMessage(results);
    }

    /**
     * Finds the required args to call performFind.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [string] {
        return [args[0]];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performFind.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [string]): string {
        if (args.length !== 1) throw new Error("Insufficient arguments.");
        if (!args[0]) throw new Error("Invalid query.");
        return args[0];
    }

    /**
     * Gets the room results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getRoomResults(query: string): Room[] {
        this.#fields = { row: 'Row', displayName: 'Display Name' };
        if (!query) return this.getGame().entityFinder.getRooms();
        else return this.getGame().entityFinder.getRooms(query, undefined, undefined, true);
    }

    /**
     * Gets the fixture results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getFixtureResults(query: string): Fixture[] {
        this.#fields = { row: 'Row', name: 'Name', location: 'Location' };
        if (!query) return this.getGame().entityFinder.getFixtures();
        else {
            let name: string, location: string;
            const locationRegex = /((?:^| )at (?<location>.+?$))/i;
            const locationMatch = query.match(locationRegex);
            if (locationMatch?.groups?.location) {
                location = locationMatch.groups.location;
                query = query.substring(0, query.indexOf(locationMatch[0])).trim();
            }
            if (query !== '') name = query;
            return this.getGame().entityFinder.getFixtures(name, location, undefined, undefined, true);
        }
    }

    /**
     * Gets the prefab results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getPrefabResults(query: string): Prefab[] {
        this.#fields = { row: 'Row', id: 'ID' };
        if (!query) return this.getGame().entityFinder.getPrefabs();
        else return this.getGame().entityFinder.getPrefabs(query, undefined, undefined, undefined, true);
    }

    /**
     * Gets the recipe results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getRecipeResults(query: string): Recipe[] {
        this.#fields = { row: 'Row', ingredients: 'Ingredients', products: 'Products' };
        if (!query) return this.getGame().entityFinder.getRecipes();
        else {
            let type: string, ingredients: string, products: string;
            const typeRegex = /(?<type>^crafting|uncraftable|processing)/i;
            const typeMatch = query.match(typeRegex);
            if (typeMatch?.groups?.type) {
                type = typeMatch.groups.type;
                query = query.substring(typeMatch.groups.type.length).trim();
            }
            const productsRegex = /(producing (?<products>.+?)$)/i;
            const productsMatch = query.match(productsRegex);
            if (productsMatch?.groups?.products) {
                products = productsMatch.groups.products;
                query = query.substring(0, query.indexOf(productsMatch[0])).trim();
            }
            const ingredientsRegex = /((?:using )?(?<ingredients>.+?)$)/i;
            const ingredientsMatch = query.match(ingredientsRegex);
            if (ingredientsMatch?.groups?.ingredients) {
                ingredients = ingredientsMatch.groups.ingredients;
            }
            return this.getGame().entityFinder.getRecipes(type, undefined, ingredients, products);
        }
    }

    /**
     * Gets the room item results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getRoomItemResults(query: string): RoomItem[] {
        if (!query) {
            this.#fields = { row: 'Row', id: 'ID', location: 'Location', containerName: 'Container' };
            return this.getGame().entityFinder.getRoomItems();
        }
        else {
            this.#fields = { row: 'Row', id: 'ID' };
            const locationField = { location: 'Location' };
            const containerField = { containerName: 'Container' };

            let id: string, location: string, containerName: string, slot: string;
            const locationRegex = /(?:^|.* )(at (?<location>.+?$))/i;
            const locationMatch = query.match(locationRegex);
            if (locationMatch?.groups?.location) {
                location = locationMatch.groups.location;
                query = query.substring(0, query.indexOf(locationMatch[1])).trim();
            }
            const containerSlotRegex = /([^\s]+? (?<slot>.+?) of (?<container>.+))/i;
            const containerRegex = /(?:^|.* )((?:in|on|under|behind|beneath|above|among|with) (?<container>.+))/i;
            const containerSlotMatch = query.match(containerSlotRegex);
            const containerMatch = query.match(containerRegex);
            if (containerSlotMatch?.groups?.slot && containerSlotMatch?.groups?.container) {
                slot = containerSlotMatch.groups.slot;
                containerName = containerSlotMatch.groups.container;
                query = query.substring(0, query.indexOf(containerSlotMatch[0])).trim();
            }
            else if (containerMatch?.groups?.container) {
                containerName = containerMatch.groups.container;
                query = query.substring(0, query.indexOf(containerMatch[1])).trim();
            }
            if (query !== '') id = query;
            // If the user specified a location and a containerName, don't include the location.
            // That way, they're more likely to see the entire containerName, which is searched, and not an exact match.
            if (location && containerName)
                this.#fields = Object.assign(this.#fields, containerField);
            else Object.assign(this.#fields, locationField, containerField);
            return this.getGame().entityFinder.getRoomItems(id, location, undefined, undefined, containerName, slot, undefined, true);
        }
    }

    /**
     * Gets the puzzle results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getPuzzleResults(query: string): Puzzle[] {
        this.#fields = { row: 'Row', name: 'Name', location: 'Location' };
        if (!query) return this.getGame().entityFinder.getPuzzles();
        else {
            let name: string, location: string;
            const locationRegex = /((?:^| )at (?<location>.+?$))/i;
            const locationMatch = query.match(locationRegex);
            if (locationMatch?.groups?.location) {
                location = locationMatch.groups.location;
                query = query.substring(0, query.indexOf(locationMatch[0])).trim();
            }
            if (query !== '') name = query;
            return this.getGame().entityFinder.getPuzzles(name, location, undefined, undefined, true);
        }
    }

    /**
     * Gets the event results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getEventResults(query: string): Event[] {
        this.#fields = { row: 'Row', id: 'ID' };
        if (!query) return this.getGame().entityFinder.getEvents();
        else return this.getGame().entityFinder.getEvents(query, undefined, undefined, undefined, undefined, true);
    }

    /**
     * Gets the status results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getStatusResults(query: string): Status[] {
        this.#fields = { row: 'Row', id: 'ID' };
        if (!query) return this.getGame().entityFinder.getStatusEffects();
        else return this.getGame().entityFinder.getStatusEffects(query, undefined, undefined, true);
    }

    /**
     * Gets the player results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getPlayerResults(query: string): Player[] {
        this.#fields = { row: 'Row', name: 'Name' };
        if (!query) return this.getGame().entityFinder.getPlayers();
        else return this.getGame().entityFinder.getPlayers(query, undefined, true);
    }

    /**
     * Gets the inventory item results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getInventoryItemResults(query: string): InventoryItem[] {
        if (!query) {
            this.#fields = { row: 'Row', player: 'Player', id: 'ID', containerName: 'Container' };
            return this.getGame().entityFinder.getInventoryItems();
        }
        else {
            this.#fields = { row: 'Row', id: 'ID' };
            const playerField = { player: 'Player' };
            const equipmentSlotField = { equipmentSlot: 'Equip. Slot' };
            const containerField = { containerName: 'Container' };

            let id: string, player: string, containerName: string, slot: string, equipmentSlot: string;
            const containerSlotRegex = /((?:in|on|under|behind|beneath|above|among|with) (?:(?<player>[^\s]+?)'s )?(?<slot>.+?) of (?<container>.+))/i;
            const equipmentSlotRegex = /(?:^|.* )((?:in|on) (?:(?<player>[^\s]+?)'s )?(?<equipmentSlot>(?:right|left) hand|[^\s]+))$/i;
            const containerRegex = /(?:^|.* )((?:in|on|under|behind|beneath|above|among|with) (?:(?<player>[^\s]+?)'s )?(?<container>.+))/i;
            const containerSlotMatch = query.match(containerSlotRegex);
            const equipmentSlotMatch = query.match(equipmentSlotRegex);
            const containerMatch = query.match(containerRegex);
            if (containerSlotMatch?.groups?.slot && containerSlotMatch?.groups?.container) {
                slot = containerSlotMatch.groups.slot;
                containerName = containerSlotMatch.groups.container;
                if (containerSlotMatch.groups.player) player = containerSlotMatch.groups.player;
                query = query.substring(0, query.indexOf(containerSlotMatch[0])).trim();
            }
            else if (equipmentSlotMatch?.groups?.equipmentSlot) {
                equipmentSlot = equipmentSlotMatch.groups.equipmentSlot;
                if (equipmentSlotMatch.groups.player) player = equipmentSlotMatch.groups.player;
                query = query.substring(0, query.indexOf(equipmentSlotMatch[0])).trim();
            }
            else if (containerMatch?.groups?.container) {
                containerName = containerMatch.groups.container;
                if (containerMatch.groups.player) player = containerMatch.groups.player;
                query = query.substring(0, query.indexOf(containerMatch[0])).trim();
            }
            const playerRegex = /((?<player>[^\s]+?)'s)/i;
            const playerMatch = query.match(playerRegex);
            if (!player && playerMatch?.groups?.player) {
                player = playerMatch.groups.player;
                query = query.substring(playerMatch[0].length).trim();
            }
            if (query !== '') id = query;
            // Exclude unneeded fields.
            if (player && (equipmentSlot || containerName))
                this.#fields = Object.assign(this.#fields, containerField);
            else if (player)
                this.#fields = Object.assign(this.#fields, equipmentSlotField, containerField);
            else if (equipmentSlot)
                this.#fields = Object.assign(this.#fields, playerField, containerField);
            else this.#fields = Object.assign(this.#fields, playerField, equipmentSlotField, containerField);
            return this.getGame().entityFinder.getInventoryItems(id, player, containerName, slot, equipmentSlot, undefined, true);
        }
    }

    /**
     * Gets the gesture results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getGestureResults(query: string): Gesture[] {
        this.#fields = { row: 'Row', id: 'ID' };
        if (!query) return this.getGame().entityFinder.getGestures();
        else return this.getGame().entityFinder.getGestures(query, true);
    }

    /**
     * Gets the flag results from the given search query. Also sets the appropriate fields.
     * @param query - The search query to narrow down the results.
     */
    #getFlagResults(query: string): Flag[] {
        this.#fields = { row: 'Row', id: 'ID' };
        if (!query) return this.getGame().entityFinder.getFlags();
        else return this.getGame().entityFinder.getFlags(query, true);
    }

    /**
     * Divides all of the results into pages to be displayed as a table.
     * Ensures that the length of the table will never exceed Discord's maximum character limit.
     * @param results - An array of rows and columns to convert into a table.
     */
    #createResultPages<T = PersistentGameEntity<any>>(results: T[]): string[][][] {
        // Divide the results into pages.
        const pages: string[][][] = [];
        let page: string[][] = [];
        const header: string[] = [];
        const headerEntryLength: number[] = [];
        const fieldCount = Object.keys(this.#fields).length;
        const cellCharacterLimit =
            fieldCount <= 2 ? 80
            : fieldCount === 3 ? 37
            : fieldCount === 4 ? 26
            : 20;
        Object.values(this.#fields).forEach(value => {
            header.push(value);
            headerEntryLength.push(value.length);
        });
        page.push(header);

        const widestEntryLength = [...headerEntryLength];

        for (let i = 0, pageNo = 0; i < results.length; i++) {
            // Create a new row.
            const row: string[] = [];
            Object.keys(this.#fields).forEach((key, j) => {
                // Some fields require special access to get a string value. Handle those here.
                let cellContents = "";
                const result = results[i];
                if (key === 'location' && (result instanceof Fixture || result instanceof RoomItem || result instanceof Player || result instanceof Puzzle))
                    cellContents = result.location.displayName;
                else if (key === 'player' && result instanceof InventoryItem)
                    cellContents = result.player.name;
                else if (key === 'id' && result instanceof ItemInstance)
                    cellContents = result.getIdentifier();
                else if (key === 'ingredients' && result instanceof Recipe)
                    cellContents = result.ingredients.map(ingredient =>
                        ingredient.prefab.id + (ingredient.containedItems.length !== 0 ? ` (${ingredient.containedItems.map(containedItem => containedItem.prefab.id).join('+')})` : ``)
                    ).join(',');
                else if (key === 'products' && result instanceof Recipe)
                    cellContents = result.products.map(product =>
                        product.prefab.id + (product.containedItems.length !== 0 ? ` (${product.containedItems.map(containedItem => containedItem.prefab.id).join('+')})` : ``)
                    ).join(',');
                else
                    cellContents = String(result[key as keyof T]);
                // If the cellContents exceed the preset character limit, truncate it.
                if (cellContents.length >= cellCharacterLimit)
                    cellContents = cellContents.substring(0, cellCharacterLimit) + '…';
                // If the cellContents would make this the widest entry for this column, update the widestEntryLength.
                if (cellContents.length > widestEntryLength[j])
                    widestEntryLength[j] = cellContents.length;
                row.push(cellContents);
            });
            // If the new row would cause the current page to exceed 15 entries per page or Discord's message character limit of 2000, make a new page.
            // Here, rowLength is multiplied by the number of rows in the current page plus 3: one new row, one divider per row, plus a top and bottom border.
            const rowLength = this.#calculateRowLength(widestEntryLength);
            if (page.length >= 15 || rowLength * (2 * page.length + 3) > 2000 - 50) {
                pages.push(page);
                pageNo++;
                page = [];
                page.push(header);
                for (let k = 0; k < widestEntryLength.length; k++) {
                    if (widestEntryLength[k] < headerEntryLength[k]) widestEntryLength[k] = headerEntryLength[k];
                }
            }
            page.push(row);
        }
        pages.push(page);
        return pages;
    }

    /**
     * Calculates the length of the row in terms of character count.
     * @param widestEntryLength - The current widest entry of each row in every column.
     */
    #calculateRowLength(widestEntryLength: number[]) {
        const cellPadding = 2;
        const cellBorders = widestEntryLength.length + 1;
        const newLine = 1;
        let rowLength = 0;
        for (const entry of widestEntryLength)
            rowLength += entry + cellPadding;
        return rowLength + cellBorders + newLine;
    }

    /**
     * Sends the result list message and edits it when the user requests the next or previous page.
     */
    #sendResultListMessage<T extends PersistentGameEntity<any>>(results: T[]): void {
        const pages = this.#createResultPages(results);
        let page = 0;
        const resultCountString = `Found ${results.length} result${results.length === 1 ? '' : 's'}.`;
        let pageString = pages.length > 1 ? ` Showing page ${page + 1}/${pages.length}.\n` : '\n';
        let resultsDisplay = '```' + table(pages[page]) + '```';

        let interactables: Interactable[] = [];
        if (pages.length > 1) {
            const prevPageCallback = (interaction: BotInteraction) => {
                if (!interaction.isButton()) return;
                if (page > 0)
                    page--;
                pageString = ` Showing page ${page + 1}/${pages.length}.\n`;
                resultsDisplay = '```' + table(pages[page]) + '```';
                interaction.update(resultCountString + pageString + resultsDisplay);
            };
            const nextPageCallback = (interaction: BotInteraction) => {
                if (!interaction.isButton()) return;
                if (page < pages.length - 1)
                    page++;
                pageString = ` Showing page ${page + 1}/${pages.length}.\n`;
                resultsDisplay = '```' + table(pages[page]) + '```';
                interaction.update(resultCountString + pageString + resultsDisplay);
            };
            interactables = interactables.concat(this.getGame().clientContext.interactableManager.createPaginationInteractables(this, prevPageCallback, nextPageCallback));
        }
        else {
            interactables = interactables.concat(this.#getInteractables(results));
        }
        this.getGame().communicationHandler.sendToChannel(this.getGame().guildContext.commandChannel, resultCountString + pageString + resultsDisplay, [], interactables);
    }

    #getInteractables<T extends PersistentGameEntity<any>>(results: T[]): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        interactables = interactableManager.getViewInteractables(undefined, [], results, this.user);
        if (results.every(result => result instanceof Fixture || result instanceof RoomItem || result instanceof Puzzle)) {
            interactables = interactables.concat(interactableManager.getInstantiateRoomItemInteractables(results, this.user));
            interactables = interactables.concat(interactableManager.getDestroyRoomItemInteractables(results, this.user));
        }
        else if (results.every(result => result instanceof InventoryItem)) {
            interactables = interactables.concat(interactableManager.getInstantiateInventoryItemInteractables(undefined, this.user, [], results));
            interactables = interactables.concat(interactableManager.createDestroyInventoryItemActionInteractables(results, undefined, this.user));
        }
        return interactables;
    }
}
