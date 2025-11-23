module.exports.getRandomString = function (possibilities = []) {
	return possibilities[Math.floor(Math.random() * possibilities.length)];
};