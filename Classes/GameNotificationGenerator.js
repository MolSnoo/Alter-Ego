import Game from "../Data/Game.js";

/**
 * @class GameNotificationGenerator
 * @classdesc A set of functions to generate notification messages to send to players.
 */
export default class GameNotificationGenerator {
	/**
	 * The game this belongs to.
	 * @readonly
	 * @type {Game}
	 */
	game;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 */
	constructor(game) {
		this.game = game;
	}

	/**
	 * Generates a text action notification.
	 * @param {string} messageText - The text content of the text message.
	 * @param {string} senderName - The name of the sender.
	 * @param {string} [recipientName] - The name of the recipient, if needed.
	 */
	generateTextNotification(messageText, senderName, recipientName) {
		if (messageText.length > 1900) messageText = messageText.substring(0, 1897) + "...";
		const recipientDisplay = recipientName ? ` -> ${recipientName}` : ``;
		return `\`[ ${senderName}${recipientDisplay} ]\` ${messageText}`;
	}

	/**
	 * Generates a notification indicating a hidden player was found in their hiding spot.
	 * @param {string} playerDisplayName - The display name of the player who found them.
	 */
	generateHiddenPlayerFoundNotification(playerDisplayName) {
		return `You've been found by ${playerDisplayName}!`;
	}

	/**
	 * Generates a notification indicating the player found players hidden in a fixture.
	 * @param {string} hiddenPlayersList - A list of hidden players.
	 * @param {string} fixtureName - The name of the fixture the players were hiding in.
	 */
	generateFoundHiddenPlayersNotification(hiddenPlayersList, fixtureName) {
		return `You find ${hiddenPlayersList} hiding in the ${fixtureName}!`;
	}
}