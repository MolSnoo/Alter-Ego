export function getRandomString (possibilities = []) {
	return possibilities[Math.floor(Math.random() * possibilities.length)];
}