// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const truncateProperties = new Set(["game", "guild", "member", "channel", "spectateChannel", "timer"]);

function isBasic(value: unknown): boolean {
    return (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "undefined" ||
        typeof value === "symbol" ||
        typeof value === "bigint"
    );
}

function prettyObject(object: any, level: number = 0) {
    if (level >= 2) return `<Truncated [Depth]>`;
    else if (isBasic(object)) return object;
    const clone = Object.create(Object.getPrototypeOf(object));
    if (Array.isArray(object)) {
        for (const item of object) {
            clone.push(prettyObject(item, level + 1));
        }
    } else
        for (const key of Object.keys(object)) {
            if (truncateProperties.has(key)) {
                clone[key] = `<Truncated [Filtered]>`;
            } else {
                if (object[key] && typeof object[key] === "object") {
                    if (object[key] instanceof Array) {
                        clone[key] = object[key].map((value) => prettyObject(value, level + 1));
                    } else if (object[key] instanceof Map) {
                        clone[key] = new Map();
                        for (const [k, v] of object[key]) {
                            clone[key].set(k, prettyObject(v, level + 1));
                        }
                    } else clone[key] = prettyObject(object[key], level + 1);
                } else clone[key] = object[key];
            }
        }
    return clone;
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
