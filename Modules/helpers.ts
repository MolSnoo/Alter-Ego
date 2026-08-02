// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ItemInstance from '../Data/ItemInstance.ts';
import { Duration } from 'luxon';
import type Player from '../Data/Player.ts';
import type { DurationObjectUnits } from 'luxon';

/**
 * Rounds the given value to a specified number of decimal places.
 * @param value - The number to round.
 * @param decimalPlaces - The number of decimal places to keep. If not provided, the number will be rounded to 3 decimal places.
 */
export function round(value: number, decimalPlaces: number = 3): number {
    if (isNaN(value)) return value;
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Divides two numbers, throwing an error if the denominator is zero.
 * Useful for bot commands, the division operator `/` is used to denote an alternate set of commands, meaning it can't be used.
 * @param numerator - The number to be divided.
 * @param denominator - The number to divide by. Must not be zero.
 */
export function divide(numerator: number, denominator: number): number {
    if (denominator === 0) throw new Error("Cannot divide by zero.");
    return numerator / denominator;
}

/**
 * Clamps a number between a minimum and maximum value, inclusive.
 * @param value - The number to clamp.
 * @param min - The minimum value to clamp to.
 * @param max - The maximum value to clamp to.
 */
export function clamp(value: number, min: number, max: number): number {
    if (min > max) throw new Error("Minimum cannot be greater than maximum.");
    return Math.min(Math.max(value, min), max);
}

/**
 * Gets a random number between min and max, inclusive.
 * @param min - The minimum possible number.
 * @param max - The maximum possible number.
 * @returns A random number between min and max, inclusive.
 */
export function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets a random string out of an array of possibilities.
 * @param possibilities - A list of strings to choose from.
 * @returns A randomly chosen entry from possibilities.
 */
export function getRandomString(possibilities: string[] = []): string {
    return possibilities[Math.floor(Math.random() * possibilities.length)];
}

/**
 * Returns true only 1/x of the time.
 * @param chance - The denominator of the probability. Defaults to 100. If this is 100, returns true 1/100th of the time.
 */
export function doWithChance(chance = 100): boolean {
    if (typeof chance !== 'number' || chance <= 0) return false;
    if (chance <= 1) return true;
    return Math.floor(Math.random() * chance) === 0;
}

/**
 * Returns true only 1/x of the time, but the x is divided by a given number if the given player has the given status effect.
 * @param baseChance - The denominator of the probability. Defaults to 100. If this is 100, returns true 1/100th of the time.
 * @param player - The player whose status we want to check.
 * @param statusId - The ID of the status to look for on the player.
 * @param statusDivisor - The number that the base chance will be divided by if the player has the given status effect. For example, if the base chance is 100, and this is 5, the new chance will be 1/20.
 */
export function doWithChanceModifiedByPlayerStatus(baseChance = 100, player: Player, statusId: string, statusDivisor: number): boolean {
    if (typeof baseChance !== 'number' || baseChance <= 0) return false;
    if (!player || !statusId || typeof statusDivisor !== 'number') return false;
    let chance = baseChance;
    if (player.hasStatus(statusId)) chance /= statusDivisor;
    return doWithChance(chance);
}

/**
 * Sorts a list of players alphabetically by their display names.
 * @param players - A list of players.
 */
export function sortPlayersByDisplayName(players: Player[]) {
    players.sort((a, b) => {
        const nameA = a.displayName.toLowerCase();
        const nameB = b.displayName.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
}

/**
 * Generates a grammatically correct list of players, sorted alphabetically by display name.
 * @param players - A list of players.
 */
export function generatePlayerListString(players: Player[]) {
    sortPlayersByDisplayName(players);
    const playerList = players.map(player => player.displayName);
    return generateListString(playerList);
}

/**
 * Generates a grammatically correct list.
 * @param list
 */
export function generateListString(list: string[]): string {
    let listString = "";
    if (list.length === 1) listString = list[0];
    else if (list.length === 2)
        listString += `${list[0]} and ${list[1]}`;
    else if (list.length >= 3) {
        for (let i = 0; i < list.length - 1; i++)
            listString += `${list[i]}, `;
        listString += `and ${list[list.length - 1]}`;
    }
    return listString;
}

/**
 * Makes the given string easier to copy with Discord's markdown.
 * @param string
 */
export function makeCopyable(string: string): string {
    if (string.length === 0) return string;
    return '`' + string + '`';
}

/**
 * Sorts the list of items alphabetically by prefab ID.
 * @param items - A list of room items.
 * @returns A copy of the list of items, sorted alphabetically by prefab ID.
 */
export function getSortedItems<T extends ItemInstance>(items: T[]): T[] {
    return items.toSorted(function (a, b) {
        if (a.prefab.id < b.prefab.id) return -1;
        if (a.prefab.id > b.prefab.id) return 1;
        return 0;
    });
}

/**
 * Generates a comma-separated list of items, sorted alphabetically by prefab ID.
 * @param items - A list of room items.
 */
export function getSortedItemsString<T extends ItemInstance>(items: T[]): string {
    return getSortedItems(items).map(item => item.prefab.id).join(',');
}

/**
 * Returns the given string with the first letter capitalized.
 * @param string
 */
export function capitalizeFirstLetter(string: string): string {
    if (string.length === 0) return string;
    const uppercaseFirstLetter = string.charAt(0).toLocaleUpperCase();
    const remainingString = string.length > 1 ? string.substring(1) : '';
    return `${uppercaseFirstLetter}${remainingString}`;
}

/**
 * Returns the given string with the first letter converted to lowercase.
 * @param string
 */
export function lowercaseFirstLetter(string: string): string {
    if (string.length === 0) return string;
    const lowercaseFirstLetter = string.charAt(0).toLocaleLowerCase();
    const remainingString = string.length > 1 ? string.substring(1) : '';
    return `${lowercaseFirstLetter}${remainingString}`;
}

/**
 * Returns true if the given string ends with a punctuation mark.
 * Ignores formatting characters like *, _, ~, |, and ` that come after the punctuation mark.
 * @param string
 */
export function endsWithPunctuation(string: string): boolean {
    return !!string.match(/[.!?][_*~|`]*$/);
}

/**
 * Parses a duration string and returns a duration object.
 * @param durationString - An integer and a unit. Acceptable units: y, M, w, d, h, m, s.
 * @returns A duration object.
 */
export function parseDuration(durationString: string): Duration<true> | Duration<false> {
    let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
    let durationUnit = durationString.charAt(durationString.length - 1);
    let durationInput: import("luxon").DurationLikeObject = {};
    if (durationString) {
        switch (durationUnit) {
            case 'y':
                durationInput.years = durationInt;
                break;
            case 'M':
                durationInput.months = durationInt;
                break;
            case 'w':
                durationInput.weeks = durationInt;
                break;
            case 'd':
                durationInput.days = durationInt;
                break;
            case 'h':
                durationInput.hours = durationInt;
                break;
            case 'm':
                durationInput.minutes = durationInt;
                break;
            case 's':
                durationInput.seconds = durationInt;
                break;
            default:
                return Duration.invalid("created with duration string using invalid unit", `"${durationUnit}" is an invalid unit`);
        }
    } else return Duration.invalid("created with duration string using invalid duration string", `"${durationString}" is not a valid duration string`);
    if (!isFinite(durationInt)) return Duration.invalid("created with duration string using invalid period", `"${durationInt}" is not a valid duration period`);
    return Duration.fromObject(durationInput);
}

/**
 * Converts a time string to a luxon duration input object.
 * @param timeString - The string to convert. The format is `D? HH:mm:ss`, e.g. `1 23:59:59`.
 * @returns The input object to pass into the duration constructor.
 */
export function convertTimeStringToDurationUnits(timeString: string): DurationObjectUnits | undefined {
    const timeRegex = /^(?<days>\d+)? ?(?<hours>\d{2}):(?<minutes>\d{2}):(?<seconds>\d{2})$/;
    const timeMatch = timeString.match(timeRegex);
    if (timeMatch?.groups) {
        const daysValue = timeMatch.groups.days ? parseInt(timeMatch.groups.days) : 0;
        const hoursValue = timeMatch.groups.hours ? parseInt(timeMatch.groups.hours) : 0;
        const minutesValue = timeMatch.groups.minutes ? parseInt(timeMatch.groups.minutes) : 0;
        const secondsValue = timeMatch.groups.seconds ? parseInt(timeMatch.groups.seconds) : 0;
        return {
            days: daysValue,
            hours: hoursValue,
            minutes: minutesValue,
            seconds: secondsValue
        };
    }
}

/**
 * Determines if a given object is a valid luxon duration object or not.
 * @param input - The object to test.
 * @returns Whether or not the input object is a valid luxon duration object.
 */
export function validateDuration(input: unknown): boolean {
    return Duration.isDuration(input) && input.isValid;
}

/**
 * Divides an array into pages of a given size. The last page may be smaller than the given size if the original array's length isn't a multiple of the page size.
 * @param pages - An array to put the pages into. This is passed in so that the function can be used repeatedly if needed. This will be modified by the function to contain the newly-created pages.
 * @param array - The array to paginate.
 * @param pageSize - The maximum number of items that can be on each page. Defaults to 5.
 * @returns An array of pages, where each page is an array of items from the original array.
 */
export function addPages<T>(pages: T[][], array: T[], pageSize = 5): void {
    let pageNo = pages.length;
    if (pages[pageNo] && pages[pageNo].length > 0) pageNo++;
    // Divide the fields into pages. Split them up by type.
    for (let i = 0; i < array.length; i++) {
        // Divide the menu into groups of pageSize.
        if (i % pageSize === 0) {
            pages.push([]);
            if (i !== 0) pageNo++;
        }
        pages[pageNo].push(array[i]);
    }
}

/**
 * Get the error message from any arbitrary error. It is safe to pass the output of try-catch into this function.
 * @param error - The error to get the message from.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    else return String(error);
}

/**
 * Get an error from any arbitrary error. It is safe to pass the output of try-catch into this function.
 * @param error - The error to return from.
 */
export function convertToError(error: unknown): Error {
    if (error instanceof Error) return error;
    else return new Error(String(error));
}
