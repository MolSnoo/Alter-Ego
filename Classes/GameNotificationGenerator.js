/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("../Data/Player.js").default} Player */
/** @typedef {import("../Data/Recipe.js").default} Recipe */

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
	 * Generates a notification indicating the player can no longer whisper
	 * because they were inflicted with a status effect with the `no channel` behavior attribute.
	 * @param {Player} player - The player referred to in this notification. 
	 * @param {string} statusId - The ID of the status effect that made the player unable to whisper.
	 */
	generateNoChannelLeaveWhisperNotification(player, statusId) {
		return `${player.displayName} can no longer whisper because ${player.originalPronouns.sbj} ${player.originalPronouns.plural ? `are` : `is`} ${statusId}.`;
	}

	/**
	 * Generates a notification indicating the player can no longer whisper
	 * because they were inflicted with a status effect with the `no hearing` behavior attribute.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateNoHearingLeaveWhisperNotification(playerDisplayName) {
		return `${playerDisplayName} can no longer hear.`;
	}

	/**
	 * Generates a notification indicating the player was inflicted with a status effect with the ID `asleep`.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateFallAsleepNotification(playerDisplayName) {
		return `${playerDisplayName} falls asleep.`;
	}

	/**
	 * Generates a notification indicating the player was inflicted with a status effect with the ID `blacked out`.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateBlackOutNotification(playerDisplayName) {
		return `${playerDisplayName} blacks out.`;
	}

	/**
	 * Generates a notification indicating the player was inflicted with a status effect with the `unconscious` behavior attribute.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateUnconsciousNotification(playerDisplayName) {
		return `${playerDisplayName} goes unconscious.`;
	}

	/**
	 * Generates a notification indicating the player hide in a fixture.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} hidingSpotName - The name of the hiding spot.
	 */
	generateHideNotification(player, secondPerson, hidingSpotName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `hide` : `hides`;
		return `${subject} ${verb} in the ${hidingSpotName}.`;
	}

	/**
	 * Generates a notification indicating the player took an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerPhrase - The entire phrase of the container.
	 */
	generateTakeNotification(player, secondPerson, itemPhrase, containerPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `take` : `takes`;
		return `${subject} ${verb} ${itemPhrase} from ${containerPhrase}.`;
	}

	/**
	 * Generates a string notification indicating the player couldn't take an item because it is too heavy.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerPhrase - The entire phrase of the container.
	 */
	generateTakeTooHeavyNotification(player, secondPerson, itemPhrase, containerPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `try` : `tries`;
		const obj = secondPerson ? `you` : player.pronouns.obj;
		return `${subject} ${verb} to take ${itemPhrase} from ${containerPhrase}, but it is too heavy for ${obj} to lift.`;
	}

	/**
	 * Generates a string notification indicating the player couldn't take an item because they are carrying too much weight.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerPhrase - The entire phrase of the container.
	 */
	generateTakeTooMuchWeightNotification(player, secondPerson, itemPhrase, containerPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `try` : `tries`;
		const sbj = secondPerson ? `you` : player.pronouns.sbj;
		const contraction = secondPerson || player.pronouns.plural ? `'re` : `'s`;
		return `${subject} ${verb} to take ${itemPhrase} from ${containerPhrase}, but ${sbj}${contraction} carrying too much weight.`;
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
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item was stolen from.
	 * @param {string} containerName - The name of the container the item was stolen from.
	 * @param {Player} victim - The victim who was stolen from.
	 * @param {boolean} victimAware - Whether or not the victim noticed that they were stolen from.
	 */
	generateSuccessfulStealNotification(player, secondPerson, itemPhrase, slotPhrase, containerName, victim, victimAware) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `steal` : `steals`;
		const successDisplay = secondPerson ? `.`
			: victimAware ? `, but ${victim.pronouns.sbj} ${victim.pronouns.plural ? `seem` : `seems`} to notice.`
			: ` without ${victim.pronouns.obj} noticing!`;
		return `${subject} ${verb} ${itemPhrase} from ${slotPhrase}${victim.displayName}'s ${containerName}${successDisplay}`;
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
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} preposition - The preposition of the container.
	 * @param {string} containerPhrase - The entire phrase of the container.
	 */
	generateDropNotification(player, secondPerson, itemPhrase, preposition, containerPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `put` : `puts`;
		return `${subject} ${verb} ${itemPhrase} ${preposition} ${containerPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player gave an item to someone.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} recipientDisplayName - The display name of the recipient.
	 */
	generateGiveNotification(player, secondPerson, itemPhrase, recipientDisplayName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `give` : `gives`;
		return `${subject} ${verb} ${itemPhrase} to ${recipientDisplayName}.`;
	}

	/**
	 * Generates a notification indicating the player couldn't give an item to someone because it is too heavy.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {Player} recipient - The recipient of the item.
	 */
	generateGiveTooHeavyNotification(player, secondPerson, itemPhrase, recipient) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `try` : `tries`;
		return `${subject} ${verb} to give ${recipient.displayName} ${itemPhrase}, but it is too heavy for ${recipient.pronouns.obj} to lift.`;
	}

	/**
	 * Generates a notification indicating the player couldn't give an item to someone because they are carrying too much weight.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {Player} recipient - The recipient of the item.
	 */
	generateGiveTooMuchWeightNotification(player, secondPerson, itemPhrase, recipient) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `try` : `tries`;
		const contraction = secondPerson || player.pronouns.plural ? `'re` : `'s`;
		return `${subject} ${verb} to give ${recipient.displayName} ${itemPhrase}, but ${recipient.pronouns.sbj}${contraction} carrying too much weight.`;
	}

	/**
	 * Generates a notification indicating the player received an item from someone.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} giverDisplayName - The display name of the giver.
	 */
	generateReceiveNotification(itemPhrase, giverDisplayName) {
		return `${giverDisplayName} gives you ${itemPhrase}!`;
	}

	/**
	 * Generates a notification indicating the player couldn't receive an item from someone because it is too heavy.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} giverDisplayName - The display name of the player giving them the item.
	 */
	generateReceiveTooHeavyNotification(itemPhrase, giverDisplayName) {
		return `${giverDisplayName} tries to give you ${itemPhrase}, but it is too heavy for you to lift.`;
	}

	/**
	 * Generates a notification indicating the player couldn't receive an item to someone because they are carrying too much weight.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} giverDisplayName - The display name of the player giving them the item.
	 */
	generateReceiveTooMuchWeightNotification(itemPhrase, giverDisplayName) {
		return `${giverDisplayName} tries to give you ${itemPhrase}, but you're carrying too much weight.`;
	}

	/**
	 * Generates a notification indicating the player stashed an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} preposition - The preposition of the container.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item is being stashed in.
	 * @param {string} containerName - The name of the container the item is being stashed in.
	 */
	generateStashNotification(player, secondPerson, itemPhrase, preposition, slotPhrase, containerName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `stash` : `stashes`;
		const dpos = secondPerson ? `your` : player.pronouns.dpos;
		return `${subject} ${verb} ${itemPhrase} ${preposition} ${slotPhrase}${dpos} ${containerName}.`;
	}

	/**
	 * Generates a notification indicating the player unstashed an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item is being unstashed from.
	 * @param {string} containerName - The name of the container the item is being unstashed from.
	 */
	generateUnstashNotification(player, secondPerson, itemPhrase, slotPhrase, containerName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `take` : `takes`;
		const dpos = secondPerson ? `your` : player.pronouns.dpos;
		return `${subject} ${verb} ${itemPhrase} out of ${slotPhrase}${dpos} ${containerName}.`;
	}

	/**
	 * Generates a notification indicating the player equipped an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 */
	generateEquipNotification(player, secondPerson, itemPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `put on` : `puts on`;
		return `${subject} ${verb} ${itemPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player unequipped an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemName - The name of the item.
	 */
	generateUnequipNotification(player, secondPerson, itemName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `take off` : `takes off`;
		const dpos = secondPerson ? `your` : player.pronouns.dpos;
		return `${subject} ${verb} ${dpos} ${itemName}.`;
	}

	/**
	 * Generates a notification indicating the player dressed.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} containerName - The name of the container the player is dressing from.
	 * @param {string} itemList - A list of items the player put on.
	 */
	generateDressNotification(player, secondPerson, containerName, itemList) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `dress` : `dresses`;
		return `${subject} ${verb} from the ${containerName}, putting on ${itemList}.`;
	}

	/**
	 * Generates a notification indicating the player undressed.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} preposition - The preposition of the container.
	 * @param {string} containerPhrase - The entire phrase of the container the player is undressing into.
	 * @param {string} itemList - A list of items the player took off.
	 */
	generateUndressNotification(player, secondPerson, preposition, containerPhrase, itemList) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `undress` : `undresses`;
		return `${subject} ${verb}, putting ${itemList} ${preposition} ${containerPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player crafted an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {CraftingResult} craftingResult - The result of the craft action.
	 */
	generateCraftNotification(player, secondPerson, craftingResult) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `craft` : `crafts`;
		let productPhrase = "";
		let product1Phrase = "";
		let product2Phrase = "";
		if (craftingResult.product1 && !craftingResult.product1.prefab.discreet)
			product1Phrase = craftingResult.product1.singleContainingPhrase;
		if (craftingResult.product2 && !craftingResult.product2.prefab.discreet)
			product2Phrase = craftingResult.product2.singleContainingPhrase;
		if (product1Phrase !== "" && product2Phrase !== "") productPhrase = `${product1Phrase} and ${product2Phrase}`;
		else if (product1Phrase !== "") productPhrase = product1Phrase;
		else if (product2Phrase !== "") productPhrase = product2Phrase;
		else productPhrase = "nothing";
		return `${subject} ${verb} ${productPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player uncrafted an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {Recipe} recipe - The recipe used to uncraft the item.
	 * @param {string} originalItemPhrase - The original single containing phrase of the item.
	 * @param {string} itemPhrase - The single containing phrase of the item, which may have changed from its original value.
	 * @param {UncraftingResult} uncraftingResult - The result of the uncraft action.
	 */
	generateUncraftNotification(player, secondPerson, recipe, originalItemPhrase, itemPhrase, uncraftingResult) {
		const subject = secondPerson ? `You` : player.displayName;
		// If only one ingredient is discreet, the first ingredient should be the discreet one.
        // This will result in more natural sounding notifications.
		const oneDiscreet = !recipe.ingredients[0].discreet && recipe.ingredients[1].discreet || recipe.ingredients[0].discreet && !recipe.ingredients[1].discreet;
        let ingredient1 = oneDiscreet && recipe.ingredients[0].discreet ? recipe.ingredients[0] : recipe.ingredients[1];
        let ingredient2 = oneDiscreet && recipe.ingredients[0].discreet ? recipe.ingredients[1] : recipe.ingredients[0];
		let ingredientPhrase = "";
		let ingredient1Phrase = "";
		let ingredient2Phrase = "";
		let verb = "removes";
		let preposition = "from";
		if (!uncraftingResult.ingredient1.prefab.discreet) {
			if (uncraftingResult.ingredient1.singleContainingPhrase !== originalItemPhrase || uncraftingResult.ingredient1.singleContainingPhrase !== itemPhrase)
				ingredient1Phrase = ingredient1.singleContainingPhrase;
		}
		if (!uncraftingResult.ingredient2.prefab.discreet) {
			if (ingredient2.singleContainingPhrase !== originalItemPhrase || uncraftingResult.ingredient2.singleContainingPhrase !== itemPhrase)
				ingredient2Phrase = uncraftingResult.ingredient2.singleContainingPhrase;
		}
		if (ingredient1Phrase !== "" && ingredient2Phrase !== "") {
			itemPhrase = originalItemPhrase;
			ingredientPhrase = `${ingredient1Phrase} and ${ingredient2Phrase}`;
			verb = "separates";
			preposition = "into";
		}
		else if (ingredient1Phrase !== "") ingredientPhrase = ingredient1Phrase;
		else if (ingredient2Phrase !== "") ingredientPhrase = ingredient2Phrase;
		if (ingredientPhrase !== "") ingredientPhrase = ` ${preposition} ${ingredientPhrase}`;
		return `${subject} ${verb} ${itemPhrase}${ingredientPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player has died.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 */
	generateDieNotification(player, secondPerson) {
		const message = secondPerson
			? `You have died. When your body is discovered, you will be given the ${this.#game.guildContext.deadRole.name} role. Until then, your death must remain a secret to the server and to other players.`
			: `${player.displayName} dies.`;
		return message;
	}
}