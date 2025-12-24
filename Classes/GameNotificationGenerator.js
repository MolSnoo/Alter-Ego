import Game from "../Data/Game.js";
import Player from "../Data/Player.js";

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
	#game;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 */
	constructor(game) {
		this.#game = game;
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

	/**
	 * Generates a notification indicating the player took an item.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerPhrase - The entire phrase of the container.
	 */
	generateTakeNotification(itemPhrase, containerPhrase) {
		return `You take ${itemPhrase} from ${containerPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player tried to steal from an empty inventory slot.
	 * @param {string} slotPhrase - A phrase to refer to the slot the player tried to steal from.
	 * @param {string} containerName - The name of the container the player tried to steal from.
	 * @param {string} victimDisplayName - The display name of the victim the player tried to steal from.
	 */
	generateStoleFromEmptyInventorySlotNotification(slotPhrase, containerName, victimDisplayName) {
		return `You try to steal from ${slotPhrase}${victimDisplayName}'s ${containerName}, but it's empty.`;
	}

	/**
	 * Generates a notification indicating the player successfully stole an item from someone.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item was stolen from.
	 * @param {string} containerName - The name of the container the item was stolen from.
	 * @param {Player} victim - The victim who was stolen from.
	 * @param {boolean} victimAware - Whether or not the victim noticed that they were stolen from.
	 */
	generateSuccessfulStealNotification(itemPhrase, slotPhrase, containerName, victim, victimAware) {
		const successDisplay = victimAware ? `, but ${victim.pronouns.sbj} ${victim.pronouns.plural ? `seem` : `seems`} to notice.`
			: ` without ${victim.pronouns.obj} noticing!`;
		return `You steal ${itemPhrase} from ${slotPhrase}${victim.displayName}'s ${containerName}${successDisplay}`;
	}

	/**
	 * Generates a notification indicating the player failed to steal an item from someone.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item they attempted to steal.
	 * @param {string} containerName - The name of the container they attempted to steal from.
	 * @param {Player} victim - The victim who they attempted to steal from.
	 */
	generateFailedStealNotification(itemPhrase, slotPhrase, containerName, victim) {
		return `You try to steal ${itemPhrase} from ${slotPhrase}${victim.displayName}'s ${containerName}, but ${victim.pronouns.sbj} ${victim.pronouns.plural ? `notice` : `notices`} before you can.`;
	}

	/**
	 * Generates a notification indicating the player was stolen from.
	 * @param {string} thiefDisplayName - The display name of the thief who stole the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item was stolen from.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerName - The name of the container the item was stolen from.
	 */
	generateSuccessfulStolenFromNotification(thiefDisplayName, slotPhrase, itemPhrase, containerName) {
		return `${thiefDisplayName} steals ${itemPhrase} from ${slotPhrase}your ${containerName}!`;
	}

	/**
	 * Generates a notification indicating someone attempted to steal an item from the player.
	 * @param {string} thiefDisplayName - The display name of the thief who stole the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item was stolen from.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerName - The name of the container the item was stolen from.
	 */
	generateFailedStolenFromNotification(thiefDisplayName, slotPhrase, itemPhrase, containerName) {
		return `${thiefDisplayName} attempts to steal ${itemPhrase} from ${slotPhrase}your${containerName}, but you notice in time!`;
	}

	/**
	 * Generates a notification indicating the player dropped an item.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} preposition - The preposition of the container.
	 * @param {string} containerPhrase - The entire phrase of the container.
	 */
	generateDropNotification(itemPhrase, preposition, containerPhrase) {
		return `You put ${itemPhrase} ${preposition} ${containerPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player has died.
	 */
	generateDieNotification() {
		return `You have died. When your body is discovered, you will be given the ${this.#game.guildContext.deadRole.name} role. Until then, please do not speak on the server or to other players.`;
	}
}