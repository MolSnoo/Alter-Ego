module.exports.toHaveSize = (actual, size) => {
	if (!'size' in actual)
		throw new TypeError('This must have size attribute!');
	if (typeof actual.size !== 'number' || typeof size !== 'number')
		throw new TypeError('These must be of type number!');

	const pass = actual.size === size;
	if (pass) {
		return {
		message: () =>
			`expected ${this.utils.printReceived(
			actual,
			)} not to have size ${this.utils.printExpected(
			`${size}`,
			)}`,
		pass: true,
		};
	} else {
		return {
		message: () =>
			`expected ${this.utils.printReceived(
			actual,
			)} to have size ${this.utils.printExpected(
			`${size}`,
			)}`,
		pass: false,
		};
	}
};
