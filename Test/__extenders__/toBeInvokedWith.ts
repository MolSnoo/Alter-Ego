// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const truncateProperties = new Set(["game", "guild", "member", "channel", "spectateChannel", "timer"]);

function isBasic(value: unknown): value is null | undefined | string | number | boolean | symbol | bigint | Function {
    return (
        value === null ||
        typeof value !== "object"
    );
}

// we make the decision here to reuse the constructors of certain arbitrary objects simply to prevent some painful breakages...
// notably, with collections, or any surprise subclasses of Set, Map, Array, et cetera...
function prettyObject<T extends any>(object: T, level: number = 0): T | string {
    if (level >= 2) return `<Truncated [Depth]>`;
    else if (isBasic(object)) return object;
    else if (Array.isArray(object)) {
        const ctor = object.constructor as Constructor<T & any[]>;
        const clone = new ctor();
        for (const item of object)
            clone.push(prettyObject(item, level + 1));
        return clone;
    } else if (object instanceof Set) {
        const ctor = object.constructor as Constructor<T & Set<any>>;
        const clone = new ctor();
        for (const value of object)
            clone.add(prettyObject(value, level + 1));
        return clone;
    } else if (object instanceof Map) {
        const ctor = object.constructor as Constructor<T & Map<any, any>>;
        const clone = new ctor();
        for (const [key, value] of object)
            clone.set(key, prettyObject(value, level + 1));
        return clone;
    } else {
        const clone: T = Object.create(Object.getPrototypeOf(object));
        for (const key of Object.keys(object)) {
            if (truncateProperties.has(key)) {
                clone[key] = `<Truncated [Filtered]>`;
            } else {
                if (object[key] && typeof object[key] === "object") {
                    if (object[key] instanceof Array) {
                        clone[key] = object[key].map((value) => prettyObject(value, level + 1));
                    } else if (object[key] instanceof Set) {
                        const ctor = object[key].constructor as Constructor<T & Set<any>>;
                        clone[key] = new ctor();
                        object[key].forEach(val => clone[key].add(prettyObject(val, level + 1)));
                    } else if (object[key] instanceof Map) {
                        const ctor = object[key].constructor as Constructor<T & Map<any, any>>;
                        clone[key] = new ctor();
                        for (const [k, v] of object[key])
                            clone[key].set(k, prettyObject(v, level + 1));
                    } else clone[key] = prettyObject(object[key], level + 1);
                } else clone[key] = prettyObject(object[key], level + 1);
            }
        }
        return clone;
    }
}

function isMock(obj: unknown): obj is import("vitest").Mock {
    return typeof obj === "function" && "_isMockFunction" in obj && obj._isMockFunction === true;
}

function isAsymmetric(obj: unknown): obj is {asymmetricMatch: (actual: any) => boolean} {
    // @ts-ignore
    return obj && typeof obj === "object" && typeof obj?.asymmetricMatch === "function";
}

function deepEqual(actual: unknown, expected: unknown): boolean {
    if (isAsymmetric(expected)) {
        try {
            return expected.asymmetricMatch(actual);
        } catch {
            return false;
        }
    } else
        try {
            assert.deepEqual(actual, expected);
        } catch {
            return false;
        }
    return true;
}

function getFirstMismatchIndex(actual: unknown[], expected: unknown[]): number {
    if (actual.length !== expected.length) {
        return -1;
    }
    for (let i = 0; i < actual.length; i++) {
        if (!deepEqual(actual[i], expected[i])) {
            return i;
        }
    }
    return -2;
}

export default function toBeInvokedWith<E extends any[]>(received: unknown, ...args: E) {
    if (isMock(received)) {
        if (received.mock.calls.length === 0) {
            return { pass: false, message: () => `Mock was never called` };
        }
        let firstMismatchedIndex = -2;
        let firstExpected: E;
        let firstActual: E[number];
        for (const callArgs of received.mock.calls) {
            const mismatchIndex = getFirstMismatchIndex(callArgs, args);
            if (mismatchIndex === -2) {
                return { pass: true, message: () => `Arguments meet expectations` };
            }
            if (firstMismatchedIndex === -2) {
                if (mismatchIndex === -1) {
                    firstExpected = args;
                    firstActual = callArgs;
                } else {
                    firstExpected = args[mismatchIndex];
                    firstActual = callArgs[mismatchIndex];
                }
                firstMismatchedIndex = mismatchIndex;
            }
        }
        return {
            pass: false,
            message: () =>
                firstMismatchedIndex > -1
                    ? `Arguments differ from expected on index ${firstMismatchedIndex}`
                    : `Expected arguments array was of incorrect size`,
            actual: prettyObject(firstActual),
            expected: prettyObject(firstExpected),
        };
    } else {
        return {
            pass: false,
            message: () => `Expected a vi.fn() mock, received ${typeof received}`,
        };
    }
}
