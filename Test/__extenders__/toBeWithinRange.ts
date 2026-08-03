// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export default (actual: number, floor: number, ceiling: number) => {
  if (
    typeof actual !== 'number' ||
    typeof floor !== 'number' ||
    typeof ceiling !== 'number'
  ) {
    throw new TypeError('These must be of type number!');
  }

  const pass = actual >= floor && actual <= ceiling;
  if (pass) {
    return {
      message: () => `expected ${actual} not to be within range ${floor} - ${ceiling}`,
      pass: true,
    };
  } else {
    return {
      message: () => `expected ${actual} to be within range ${floor} - ${ceiling}`,
      pass: false,
    };
  }
};
