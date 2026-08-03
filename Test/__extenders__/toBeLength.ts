// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export default (actual: Array<unknown>, length: number) => {
    if (!('length' in actual)) throw new TypeError('This must have size attribute!');
    if (typeof actual.length !== 'number' || typeof length !== 'number') throw new TypeError('These must be of type number!');

    const pass = actual.length === length;
    if (pass) {
        return {
            message: () => `expected array not to have length ${length}, but received ${actual.length}`,
            pass: true,
        };
    } else {
        return {
            message: () => `expected array to have length ${length}, but received ${actual.length}`,
            pass: false,
            actual: actual,
            expected: actual.slice(0, length),
        };
    }
};
