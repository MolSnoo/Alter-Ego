module.exports.toBeWithinRange = (actual, floor, ceiling) => {
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
      message: () =>
        `expected ${this.utils.printReceived(
          actual,
        )} not to be within range ${this.utils.printExpected(
          `${floor} - ${ceiling}`,
        )}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `expected ${this.utils.printReceived(
          actual,
        )} to be within range ${this.utils.printExpected(
          `${floor} - ${ceiling}`,
        )}`,
      pass: false,
    };
  }
};
