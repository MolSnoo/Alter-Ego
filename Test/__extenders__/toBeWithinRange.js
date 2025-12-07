export default (actual, floor, ceiling) => {
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
