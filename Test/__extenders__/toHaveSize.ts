// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { randomUUID, type UUID } from "crypto";
import type { Collection } from "discord.js";

/**
 * Resize any given Map to the given size.
 * @param map - The map to resize.
 * @param size - The size to resize the map to.
 */
function resizeMap<K extends unknown, V extends unknown>(map: Map<K, V>, size: number): Map<K | UUID, V> {
    if (map.size === size) return map;
    let clone: Map<K | UUID, V>;
    if (map.constructor.name === "Collection") {
        clone = (map as Collection<K, V>).clone();
        clone.clear();
    }
    else if (map.constructor.name === "Map") clone = new Map();
    //else clone = new (map.constructor as Constructor<Map<K | UUID, V>>)();
    else clone = new Map();
    if (map.size > size) {
        let count = 0;
        for (const [key, value] of map) {
            if (count >= size) break;
            clone.set(key, value);
            count++;
        }
        return clone;
    }
    else if (map.size < size) {
        for (const [key, value] of map)
            clone.set(key, value);
        const needed = size - map.size;
        for (let i = 0; i < needed; i++) {
            let newKey: UUID;
            do {
                newKey = randomUUID();
            } while (clone.has(newKey) || newKey === undefined);
            clone.set(newKey, undefined);
        }
        return clone;
    }
}

export default (actual: Map<unknown, unknown>, size: number) => {
	if (!('size' in actual))
		throw new TypeError('This must have size attribute!');
	if (typeof actual.size !== 'number' || typeof size !== 'number')
		throw new TypeError('These must be of type number!');

	const pass = actual.size === size;
	if (pass) {
		return {
			message: () => `expected object not to have size ${size}, but received ${actual.size}`,
			pass: true,
		};
    } else {
        const expected = resizeMap(actual, size);
		return {
			message: () => `expected object to have size ${size}, but received ${actual.size}`,
            pass: false,
            actual: actual,
            expected: expected,
		};
	}
};
