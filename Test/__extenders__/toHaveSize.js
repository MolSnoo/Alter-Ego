module.exports.toHaveSize = (actual, size) => {
	if (!'size' in actual)
		throw new TypeError('This must have size attribute!');
	if (typeof actual.size !== 'number' || typeof size !== 'number')
		throw new TypeError('These must be of type number!');

	const pass = actual.size === size;
	if (pass) {
		return {
			message: () => `expected ${actual} not to have size ${size}`,
			pass: true,
		};
	} else {
		return {
			message: () => `expected ${actual} to have size ${size}`,
			pass: false,
		};
	}
};
