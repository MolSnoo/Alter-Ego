// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Game from '../Data/Game.ts';
import { Collection } from 'discord.js';
import type { default as Prefab, PrefabPossibleNames } from '../Data/Prefab.ts';

/** An object representing an item to be instantiated within another item. */
export interface ContainedItem {
    /** The prefab to instantiate inside of the container. */
    prefab: Prefab;
    /** The quantity to instantiate the prefab with. */
    quantity: number;
    /** The number of uses to instantiate the prefab with. */
    uses: number;
    /** A map of procedural selections, where the key is the name of the procedural and the value is the name of the selected poss. */
    proceduralSelections: Map<string, string>;
}

/**
 * Converts a string representation of procedural selections into a map of procedural selections.
 * @param input - A string containing procedural selections. Must contain a string within parentheses. Multiple selections must be separated by a `+`. E.g. `(color=metal + species=upa)`
 * @throws {SyntaxError} If the input string does not contain a string within parentheses, or if the procedural selections are not formatted correctly.
 * @returns A map of procedural selections, where the key is the name of the procedural and the value is the name of the selected poss.
 */
export function parseProceduralSelections(input: string): Map<string, string> {
    const proceduralSelections = new Map<string, string>();
    if (!input.includes('(') || !input.includes(')') || input.indexOf('(') > input.indexOf(')'))
        throw new SyntaxError("Procedural selections must be contained inside parentheses.");
    const proceduralString = input.substring(input.indexOf('(') + 1, input.indexOf(')'));
    const proceduralList = proceduralString.split('+');
    for (const procedural of proceduralList) {
        const proceduralAssignment = parseProceduralAssignment(procedural);
        if (proceduralAssignment.length !== 2 || !proceduralAssignment[0] || !proceduralAssignment[1])
            throw new SyntaxError("Procedural options must be separated with `+`, and the name of the poss to select must be assigned to the name of its containing procedural with `=`.");
        proceduralSelections.set(proceduralAssignment[0], proceduralAssignment[1]);
    }
    return proceduralSelections;
}

/**
 * Converts a string representation of a single procedural assignment into an array consisting of a key and a value.
 * @param procedural - A string containing an `=` character.
 */
function parseProceduralAssignment(procedural: string): [string, string] {
    const proceduralAssignment = procedural.split('=');
    const key = proceduralAssignment[0]?.toLowerCase().trim() ?? undefined;
    const value = proceduralAssignment[1]?.toLowerCase().trim() ?? undefined;
    return [key, value];
}

/**
 * Parses a string representation of a list of items to instantiate separated by `+`, and returns an array of objects containing the prefab, quantity, uses, and procedural selections for each item.
 * @param game - The game to instantiate items in.
 * @param input - The string representation of the list of items to instantiate.
 * @throws {Error} If any of the prefabs in the list cannot be found in the game.
 * @throws {SyntaxError} If any of the procedural selections in the list are not formatted correctly.
 */
export function parseInstantiateContainingString(game: Game, input: string): ContainedItem[] {
    const containedItems: ContainedItem[] = [];
    const itemList = input.split(/\+(?![^(]*\))/).map(s => s.trim());
    for (let itemString of itemList) {
        let proceduralSelections: Map<string, string> = new Map();
        if (itemString.indexOf('(') < itemString.indexOf(')')) {
            proceduralSelections = parseProceduralSelections(itemString);
            itemString = itemString.substring(0, itemString.indexOf('(')).trim();
        }
        let quantity = 1;
        const quantityMatch = itemString.match(/^\d+(?=\s)/);
        if (quantityMatch) {
            quantity = parseInt(quantityMatch[0]);
            itemString = itemString.substring(quantityMatch[0].length).trim();
        }
        let prefab = game.entityFinder.getPrefab(itemString);
        if (!prefab) throw new Error(game.errorMessageGenerator.generateEntityNotFoundError("prefab", itemString));
        const uses = prefab.uses;
        containedItems.push({ prefab: prefab, quantity: quantity, uses: uses, proceduralSelections: proceduralSelections });
    }
    return containedItems;
}

/**
 * Creates an array of strings by splitting the given input by commas and trims the results.
 * @param input - A comma-separated list of strings.
 * @param normalize - Whether or not to normalize the results as valid game entity names. Defaults to false.
 */
export function parseAndTrimCommaSeparatedStrings(input: string, normalize = false): string[] {
    let results = input?.split(',') ?? [];
    for (let i = 0; i < results.length; i++) {
        if (normalize) results[i] = Game.generateValidEntityName(results[i]);
        else results[i] = results[i].trim();
    }
    return results;
}

/**
 * Converts a string representation of a prefab's possible names or containing phrases into a map,
 * where the key is a procedural selection and the value is the single name and plural name as an array.
 * @param input - A string in the form [procedural name=poss name: single name, plural name]
 * @param normalize - Whether or not to normalize the names as valid game entity names. Defaults to false.
 */
export function parsePrefabPossibleNames(input: string, normalize = false): PrefabPossibleNames {
    const possibleNames: PrefabPossibleNames = new Collection();
    const regex = /(\[((.*?): *(.*?))\],?)/g;
    if (input && !!input.match(regex)) {
        let match: RegExpExecArray;
        while (match = regex.exec(input)) {
            const possibleNameSet = match[2];

            const possibleNameKey = new Map<string, string>();
            const proceduralAssignment = parseProceduralAssignment(possibleNameSet.substring(0, possibleNameSet.lastIndexOf(':')).trim());
            possibleNameKey.set(proceduralAssignment[0], proceduralAssignment[1]);

            const names = parseAndTrimCommaSeparatedStrings(possibleNameSet.substring(possibleNameSet.lastIndexOf(':') + 1), normalize);
            possibleNames.set(possibleNameKey, [names[0], names[1] ?? undefined]);
        }
    }
    else {
        const names = parseAndTrimCommaSeparatedStrings(input, normalize);
        possibleNames.set(new Map<string, string>([[undefined, undefined]]), [names[0], names[1] ?? undefined]);
    }
    return possibleNames;
}
