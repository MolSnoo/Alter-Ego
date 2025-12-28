import Exit from "../Data/Exit.js";
import Fixture from "../Data/Fixture.js";
import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import InventoryItem from "../Data/InventoryItem.js";
import InventorySlot from "../Data/InventorySlot.js";
import Narration from "../Data/Narration.js";
import Player from "../Data/Player.js";
/** @typedef {import("../Data/Prefab.js").default} Prefab */
import Puzzle from "../Data/Puzzle.js";
/** @typedef {import("../Data/Recipe.js").default} Recipe */
import Room from "../Data/Room.js";
import RoomItem from "../Data/RoomItem.js";
/** @typedef {import("../Data/Status.js").default} Status */
import { parseDescription } from "../Modules/parser.js";
import { generateListString } from "../Modules/helpers.js";

/** @typedef {import("../Data/HidingSpot.js").default} HidingSpot */

/**
 * @class GameNarrationHandler
 * @classdesc A set of functions to send narrations.
 */
export default class GameNarrationHandler {
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
	 * Sends the narration.
	 * @param {Player} player - The player whose action is being narrated.
	 * @param {string} narrationText - The text of the narration.
	 * @param {Room} [location] - The location in which the narration is occurring. Defaults to the player's location.
	 */
	#sendNarration(player, narrationText, location = player.location) {
		new Narration(this.#game, player, location, narrationText).send();
	}

	/**
	 * Narrations a gesture action.
	 * @param {Gesture} gesture - The gesture being narrated.
	 * @param {Player} player - The player performing the gesture action.
	 */
	narrateGesture(gesture, player) {
		const narration = parseDescription(gesture.narration, gesture, player);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates a start move action.
	 * @param {boolean} isRunning - Whether or not the player is running.
	 * @param {Exit} exit - The exit the player is moving toward. 
	 * @param {Player} player - The player performing the start move action. 
	 */
	narrateStartMove(isRunning, exit, player) {
		const notification = this.#game.notificationGenerator.generateStartMoveNotification(player, true, isRunning, exit.name);
		const narration = this.#game.notificationGenerator.generateStartMoveNotification(player, false, isRunning, exit.name);
		player.notify(notification);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates the player depleting half of their stamina.
	 * @param {Player} player - The player who has depleted half of their stamina.
	 */
	narrateReachedHalfStamina(player) {
		const notification = this.#game.notificationGenerator.generateHalfStaminaNotification(player, true);
		const narration = this.#game.notificationGenerator.generateHalfStaminaNotification(player, false);
		player.notify(notification);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates the player becoming weary.
	 * @param {Player} player - The player who became weary.
	 */
	narrateWeary(player) {
		const wearyStatus = this.#game.entityFinder.getStatusEffect("weary");
		const narration = this.#game.notificationGenerator.generateWearyNotification(player);
		player.sendDescription(wearyStatus.inflictedDescription, wearyStatus);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates a player exiting a room.
	 * @param {Room} currentRoom - The room the player is currently in.
	 * @param {Exit} exit - The exit the player will leave their current room through.
	 * @param {Player} player - The player performing the move action.
	 */
	narrateExit(currentRoom, exit, player) {
		const appendString = player.createMoveAppendString();
		const playerCanMoveFreely = !player.isNPC && !!player.member.roles.resolve(this.#game.guildContext.freeMovementRole);
		const exitNotification = playerCanMoveFreely ? this.#game.notificationGenerator.generateSuddenExitNotification(player, true, currentRoom.displayName, appendString)
			: this.#game.notificationGenerator.generateExitNotification(player, true, exit.name, appendString);
		const exitNarration = playerCanMoveFreely ? this.#game.notificationGenerator.generateSuddenExitNotification(player, false, currentRoom.displayName, appendString)
			: this.#game.notificationGenerator.generateExitNotification(player, false, exit.name, appendString);
		player.notify(exitNotification);
		this.#sendNarration(player, exitNarration, currentRoom);
	}

	/**
	 * Narrates a player entering a room.
	 * @param {Room} destinationRoom  The room the player is moving to.
	 * @param {Exit} entrance - The exit the player will enter the destination room from.
	 * @param {Player} player - The player performing the move action.
	 */
	narrateEnter(destinationRoom, entrance, player) {
		const appendString = player.createMoveAppendString();
		const playerCanMoveFreely = !player.isNPC && !!player.member.roles.resolve(this.#game.guildContext.freeMovementRole);
		const enterNarration = playerCanMoveFreely ? this.#game.notificationGenerator.generateSuddenEnterNotification(player, false, destinationRoom.displayName, appendString)
			: this.#game.notificationGenerator.generateEnterNotification(player, false, entrance.name, appendString);
		this.#sendNarration(player, enterNarration, destinationRoom);
		if (player.hasBehaviorAttribute("no sight")) {
			const enterNotification = this.#game.notificationGenerator.generateNoSightEnterNotification();
			player.notify(enterNotification);
		}
		else {
			const description = entrance ? entrance.description : destinationRoom.description;
			player.sendDescription(description, destinationRoom);
		}
	}

	/**
	 * Narrates a stop action.
	 * @param {Player} player - The player performing the stop action.
	 * @param {boolean} exitLocked - Whether or not the action was initiated because the destination exit was locked.
	 * @param {Exit} [exit] - The exit the player tried to move to, if applicable.
	 */
	narrateStop(player, exitLocked, exit) {
		const notification = exitLocked ? this.#game.notificationGenerator.generateExitLockedNotification(player, true, exit.getNamePhrase())
			: this.#game.notificationGenerator.generateStopNotification(player, true);
		const narration = exitLocked ? this.#game.notificationGenerator.generateExitLockedNotification(player, false, exit.getNamePhrase())
			: this.#game.notificationGenerator.generateStopNotification(player, false);
		player.notify(notification);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates an inspect action.
	 * @param {Room|Fixture|RoomItem|InventoryItem|Player} target - The target to inspect.
	 * @param {Player} player - The player performing the inspect action.
	 */
	narrateInspect(target, player) {
		let narration = "";
		if (target instanceof Room)
			narration = `${player.displayName} begins looking around the room.`;
		else if (target instanceof Fixture) {
			narration = `${player.displayName} begins inspecting the ${target.name}.`;
			// If there are any players hidden in the fixture, notify them that they were found, and notify the player who found them.
			// However, don't notify anyone if the player is inspecting the fixture that they're hiding in.
			// Also ensure that the fixture isn't locked.
			if (target instanceof Fixture && !player.hasBehaviorAttribute("hidden") && player.hidingSpot !== target.name
			&&  (target.childPuzzle === null || !target.childPuzzle.type.endsWith("lock") || target.childPuzzle.solved)) {
				for (const occupant of target.hidingSpot.occupants)
					occupant.notify(this.#game.notificationGenerator.generateHiddenPlayerFoundNotification(occupant.hasBehaviorAttribute("no sight") ? "someone" : player.displayName));
				const hiddenPlayersList = target.hidingSpot.generateOccupantsString(player.hasBehaviorAttribute("no sight"));
				if (hiddenPlayersList) player.notify(this.#game.notificationGenerator.generateFoundHiddenPlayersNotification(hiddenPlayersList, target.hidingSpot.getContainingPhrase()));
			}
		}
		else if (target instanceof RoomItem && !target.prefab.discreet) {
			const preposition = target.getContainerPreposition();
			const containerPhrase = target.getContainerPhrase();
			narration = `${player.displayName} begins inspecting ${target.singleContainingPhrase} ${preposition} ${containerPhrase}.`;
		}
		else if (target instanceof InventoryItem && !target.prefab.discreet && target.player.name === player.name)
			narration = `${player.displayName} takes out ${target.singleContainingPhrase} and begins inspecting it.`;
		if (narration !== "")
			this.#sendNarration(player, narration);
	}

	/**
	 * Narrates a knock action.
	 * @param {Exit} exit - The exit to knock on.
	 * @param {Player} player - The player performing the knock action.
	 */
	narrateKnock(exit, player) {
		const roomNarration = `${player.displayName} knocks on ${exit.getNamePhrase()}.`;
		this.#sendNarration(player, roomNarration);
		const destination = exit.dest;
		if (destination.id === player.location.id) return;
		const hearingPlayers = destination.occupants.filter(occupant => !occupant.hasBehaviorAttribute("no hearing"));
		const destinationNarration = `There is a knock on ${destination.exitCollection.get(exit.link).getNamePhrase()}.`;
		// If the number of hearing players is the same as the number of occupants in the room, send the message to the room.
		if (hearingPlayers.length !== 0 && hearingPlayers.length === destination.occupants.length)
			this.#sendNarration(player, destinationNarration, destination);
		else {
			for (const hearingPlayer of hearingPlayers)
				hearingPlayer.notify(destinationNarration);
		}
	}

	/**
	 * Narrates a hide action.
	 * @param {HidingSpot} hidingSpot - The hiding spot the player is hiding in.
	 * @param {Player} player - The player performing the hide action.
	 */
	narrateHide(hidingSpot, player) {
		const hidingSpotPhrase = hidingSpot.getContainingPhrase();
		let playerNotification = "";
		const narration = this.#game.notificationGenerator.generateHideNotification(player, false, hidingSpotPhrase);
		const hiddenPlayersList = hidingSpot.generateOccupantsString(player.hasBehaviorAttribute("no sight"));
		if (hidingSpot.occupants.length + 1 > hidingSpot.capacity)
			playerNotification = this.#game.notificationGenerator.generateHidingSpotFullNotification(hidingSpotPhrase, hiddenPlayersList);
		else {
			if (hidingSpot.occupants.length > 0) playerNotification = this.#game.notificationGenerator.generateHidingSpotOccupiedNotification(hidingSpotPhrase, hiddenPlayersList);
			else playerNotification = this.#game.notificationGenerator.generateHideNotification(player, true, hidingSpotPhrase);
		}
		player.notify(playerNotification);
		this.#sendNarration(player, narration);
		for (const occupant of hidingSpot.occupants) {
			const occupantNotification = hidingSpot.occupants.length + 1 > hidingSpot.capacity ? this.#game.notificationGenerator.generateFoundInFullHidingSpotNotification(occupant, player)
			: this.#game.notificationGenerator.generateFoundInOccupiedHidingSpotNotification(occupant, player);
			occupant.notify(occupantNotification);
		}
	}

	/**
	 * Narrates an unhide action.
	 * @param {HidingSpot} hidingSpot - The hiding spot the player is coming out from.
	 * @param {Player} player - The player performing the unhide action.
	 */
	narrateUnhide(hidingSpot, player) {
		const hidingSpotPhrase = hidingSpot ? hidingSpot.getContainingPhrase() : "hiding";
		const notification = this.#game.notificationGenerator.generateUnhideNotification(player, true, hidingSpotPhrase);
		const narration = this.#game.notificationGenerator.generateUnhideNotification(player, false, hidingSpotPhrase);
		player.notify(notification);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates an inflict action.
	 * @param {Status} status - The status being inflicted.
	 * @param {Player} player - The player performing the inflict action.
	 */
	narrateInflict(status, player) {
		let narration = "";
		if (status.id === "asleep") narration = this.#game.notificationGenerator.generateFallAsleepNotification(player.displayName);
		else if (status.id === "blacked out") narration = this.#game.notificationGenerator.generateBlackOutNotification(player.displayName);
		else if (status.behaviorAttributes.includes("unconscious")) narration = this.#game.notificationGenerator.generateUnconsciousNotification(player.displayName);
		if (narration) this.#sendNarration(player, narration);
	}

	/**
	 * Narrates a cure action.
	 * @param {Status} status - The status being cured.
	 * @param {Player} player - The player performing the cure action.
	 * @param {InventoryItem} [item] - The inventory item that caused the status to be cured, if applicable.
	 */
	narrateCure(status, player, item) {
		if (status.behaviorAttributes.includes("concealed")) {
			const maskName = item ? item.name : "MASK";
			const unmaskedNarration = this.#game.notificationGenerator.generateConcealedCuredNotification(maskName, player.displayName);
			this.#sendNarration(player, unmaskedNarration);
		}
		else if (status.behaviorAttributes.includes("unconscious")) {
			let awakenNarration = "";
			if (status.id === "asleep" || status.id === "blacked out") awakenNarration = this.#game.notificationGenerator.generateWakeUpNotification(player.displayName);
			else awakenNarration = this.#game.notificationGenerator.generateRegainConsciousnessNotification(player.displayName);
			this.#sendNarration(player, awakenNarration);
		}
	}

	/**
	 * Narrates a use action.
	 * @param {InventoryItem} item - The inventory item to use.
	 * @param {Player} player - The player performing the use action.
	 * @param {Player} target - The target player of the use action.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	narrateUse(item, player, target, customNarration) {
		if (customNarration)
			this.#sendNarration(player, customNarration);
		else {
			const verb = item.prefab.verb ? item.prefab.verb : `uses`;
			const targetPhrase = target.name !== player.name ? ` on ${target.displayName}` : ``;
			this.#sendNarration(player, `${player.displayName} ${verb} ${item.singleContainingPhrase}${targetPhrase}.`);
		}
	}

	/**
	 * Narrates a take action.
	 * @param {RoomItem} item - The item to take.
	 * @param {Player} player - The player performing the take action.
	 * @param {boolean} [notify] - Whether or not to notify the player that they took the item. Defaults to true.
	 */
	narrateTake(item, player, notify = true) {
		const containerPhrase = item.getContainerPhrase();
		let notification = this.#game.notificationGenerator.generateTakeNotification(player, true, item.singleContainingPhrase, containerPhrase);
		let narration = this.#game.notificationGenerator.generateTakeNotification(player, false, item.singleContainingPhrase, containerPhrase);
		if (item.weight > player.maxCarryWeight) {
			notification = this.#game.notificationGenerator.generateTakeTooHeavyNotification(player, true, item.singleContainingPhrase, containerPhrase);
			narration = this.#game.notificationGenerator.generateTakeTooHeavyNotification(player, false, item.singleContainingPhrase, containerPhrase);
		}
		else if (player.carryWeight + item.weight > player.maxCarryWeight) {
			notification = this.#game.notificationGenerator.generateTakeTooMuchWeightNotification(player, true, item.singleContainingPhrase, containerPhrase);
			narration = this.#game.notificationGenerator.generateTakeTooMuchWeightNotification(player, false, item.singleContainingPhrase, containerPhrase);
		}
		if (notify) player.notify(notification);
		if (!item.prefab.discreet)
			this.#sendNarration(player, narration);
	}

	/**
	 * Narrates a steal action.
	 * @param {InventoryItem} item - The item being stolen.
	 * @param {Player} thief - The player performing the steal action.
	 * @param {Player} victim - The player being stolen from.
	 * @param {InventoryItem} container - The container the item was stolen from.
	 * @param {InventorySlot} inventorySlot - The inventory slot the item was stolen from.
	 * @param {boolean} notifyVictim - Whether or not to notify the victim who was stolen from.
	 */
	narrateSteal(item, thief, victim, container, inventorySlot, notifyVictim) {
		const slotPhrase = container.getSlotPhrase(inventorySlot);
		const thiefNotification = this.#game.notificationGenerator.generateSuccessfulStealNotification(thief, true, item.singleContainingPhrase, slotPhrase, container.name, victim, notifyVictim);
		thief.notify(thiefNotification);
		if (notifyVictim) {
			const victimNotification = this.#game.notificationGenerator.generateSuccessfulStolenFromNotification(thief.displayName, slotPhrase, item.singleContainingPhrase, container.name);
			victim.notify(victimNotification);
		}
		if (!item.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateSuccessfulStealNotification(thief, false, item.singleContainingPhrase, slotPhrase, container.name, victim, notifyVictim)
			this.#sendNarration(thief, narration);
		}
	}

	/**
	 * Narrates a drop action.
	 * @param {InventoryItem} item - The item to drop.
	 * @param {Fixture|Puzzle|RoomItem} container - The container to drop the item into.
	 * @param {Player} player - The player performing the take action.
	 * @param {boolean} [notify] - Whether or not to notify the player that they dropped the item. Defaults to true.
	 */
	narrateDrop(item, container, player, notify = true) {
		const preposition = container.getPreposition();
		const containerPhrase = container.getContainingPhrase();
		const notification = this.#game.notificationGenerator.generateDropNotification(player, true, item.singleContainingPhrase, preposition, containerPhrase);
		if (notify) player.notify(notification);
		if (!item.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateDropNotification(player, false, item.singleContainingPhrase, preposition, containerPhrase)
			this.#sendNarration(player, narration);
		}
	}

	/**
	 * Narrates a give action.
	 * @param {InventoryItem} item - The item to give.
	 * @param {Player} player - The player performing the give action.
	 * @param {Player} recipient - The player receiving the item.
	 */
	narrateGive(item, player, recipient) {
		let playerNotification = this.#game.notificationGenerator.generateGiveNotification(player, true, item.singleContainingPhrase, recipient.displayName);
		let recipientNotification = this.#game.notificationGenerator.generateReceiveNotification(item.singleContainingPhrase, player.displayName);
		let narration = this.#game.notificationGenerator.generateGiveNotification(player, false, item.singleContainingPhrase, recipient.displayName);
		if (item.weight > recipient.maxCarryWeight) {
			playerNotification = this.#game.notificationGenerator.generateGiveTooHeavyNotification(player, true, item.singleContainingPhrase, recipient);
			recipientNotification = this.#game.notificationGenerator.generateReceiveTooHeavyNotification(item.singleContainingPhrase, player.displayName);
			narration = this.#game.notificationGenerator.generateGiveTooHeavyNotification(player, false, item.singleContainingPhrase, recipient)
		}
		else if (recipient.carryWeight + item.weight > recipient.maxCarryWeight) {
			playerNotification = this.#game.notificationGenerator.generateGiveTooMuchWeightNotification(player, true, item.singleContainingPhrase, recipient);
			recipientNotification = this.#game.notificationGenerator.generateReceiveTooMuchWeightNotification(item.singleContainingPhrase, player.displayName);
			narration = this.#game.notificationGenerator.generateGiveTooMuchWeightNotification(player, false, item.singleContainingPhrase, recipient);
		}
		player.notify(playerNotification);
		recipient.notify(recipientNotification);
		if (!item.prefab.discreet)
			this.#sendNarration(player, narration);
	}

	/**
	 * Narrates a stash action.
	 * @param {InventoryItem} item - The item being stashed.
	 * @param {InventoryItem} container - The container to stash the item in.
	 * @param {InventorySlot} inventorySlot - The inventory slot to stash the item in.
	 * @param {Player} player - The player performing the stash action.
	 */
	narrateStash(item, container, inventorySlot, player) {
		const preposition = container.getPreposition();
		const slotPhrase = container.getSlotPhrase(inventorySlot);
		const notification = this.#game.notificationGenerator.generateStashNotification(player, true, item.singleContainingPhrase, preposition, slotPhrase, container.name);
		player.notify(notification);
		if (!item.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateStashNotification(player, false, item.singleContainingPhrase, preposition, slotPhrase, container.name)
			this.#sendNarration(player, narration);
		}
	}

	/**
	 * Narrates an unstash action.
	 * @param {InventoryItem} item - The item being unstashed.
	 * @param {InventoryItem} container - The container to unstash the item from.
	 * @param {InventorySlot} inventorySlot - The inventory slot to unstash the item from.
	 * @param {Player} player - The player performing the unstash action.
	 */
	narrateUnstash(item, container, inventorySlot, player) {
		const slotPhrase = container.getSlotPhrase(inventorySlot);
		const notification = this.#game.notificationGenerator.generateUnstashNotification(player, true, item.singleContainingPhrase, slotPhrase, container.name);
		player.notify(notification);
		if (!item.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateUnstashNotification(player, false, item.singleContainingPhrase, slotPhrase, container.name);
			this.#sendNarration(player, narration);
		}
	}

	/**
	 * Narrates an equip action.
	 * @param {InventoryItem} item - The item being equipped.
	 * @param {Player} player - The player performing the equip action.
	 * @param {boolean} [notify] - Whether or not to notify the player that they equipped the item. Defaults to true.
	 */
	narrateEquip(item, player, notify = true) {
		if (notify) {
			const notification = this.#game.notificationGenerator.generateEquipNotification(player, true, item.singleContainingPhrase);
			player.notify(notification);
		}
		const narration = this.#game.notificationGenerator.generateEquipNotification(player, false, item.singleContainingPhrase);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates an unequip action.
	 * @param {InventoryItem} item - The item being unequipped.
	 * @param {Player} player - The player performing the unequip action.
	 * @param {boolean} [notify] - Whether or not to notify the player that they unequipped the item. Defaults to true.
	 */
	narrateUnequip(item, player, notify = true) {
		if (notify) {
			const notification = this.#game.notificationGenerator.generateUnequipNotification(player, true, item.singleContainingPhrase);
			player.notify(notification);
		}
		const narration = this.#game.notificationGenerator.generateUnequipNotification(player, false, item.singleContainingPhrase);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates a dress action.
	 * @param {InventoryItem[]} items - The items the player is putting on.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the player is dressing from.
	 * @param {Player} player - The player performing the dress action.
	 */
	narrateDress(items, container, player) {
		const itemPhrases = items.map(item => item.singleContainingPhrase);
		const itemList = generateListString(itemPhrases);
		const notification = this.#game.notificationGenerator.generateDressNotification(player, true, container.name, itemList);
		const narration = this.#game.notificationGenerator.generateDressNotification(player, false, container.name, itemList);
		player.notify(notification);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates an undress action.
	 * @param {InventoryItem[]} items - The items the player is taking off.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the player is undressing into.
	 * @param {Player} player - The player performing the undress action.
	 */
	narrateUndress(items, container, player) {
		const preposition = container.getPreposition();
		const containerPhrase = container.getContainingPhrase();
		const itemPhrases = items.map(item => item.singleContainingPhrase);
		const itemList = generateListString(itemPhrases);
		const notification = this.#game.notificationGenerator.generateUndressNotification(player, true, preposition, containerPhrase, itemList);
		const narration = this.#game.notificationGenerator.generateUndressNotification(player, false, preposition, containerPhrase, itemList);
		player.notify(notification);
		this.#sendNarration(player, narration);
	}

	/**
	 * Narrates a craft action.
	 * @param {CraftingResult} craftingResult - The result of the craft action.
	 * @param {Player} player - The player performing the craft action.
	 */
	narrateCraft(craftingResult, player) {
		if (craftingResult.product1 && !craftingResult.product1.prefab.discreet || craftingResult.product2 && !craftingResult.product2.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateCraftNotification(player, false, craftingResult);
			this.#sendNarration(player, narration);
		}
	}

	/**
	 * Narrates an uncraft action.
	 * @param {Recipe} recipe - The recipe used to uncraft the item.
	 * @param {Prefab} originalItemPrefab - The prefab of the original item.
	 * @param {InventoryItem} item - The item being uncrafted.
	 * @param {UncraftingResult} uncraftingResult - The result of the uncraft action.
	 * @param {Player} player - The player performing the uncraft action.
	 */
	narrateUncraft(recipe, originalItemPrefab, item, uncraftingResult, player) {
		if (!originalItemPrefab.discreet || !recipe.ingredients[0].discreet || !recipe.ingredients[1].discreet) {
			const originalItemPhrase = originalItemPrefab.singleContainingPhrase;
			const itemPhrase = item.singleContainingPhrase;
			const narration = this.#game.notificationGenerator.generateUncraftNotification(player, false, recipe, originalItemPhrase, itemPhrase, uncraftingResult);
			this.#sendNarration(player, narration);
		}
	}

	/**
	 * Narrates a die action.
	 * @param {Player} player - The player performing the die action. 
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	narrateDie(player, customNarration) {
		player.notify(this.#game.notificationGenerator.generateDieNotification(player, true));
		if (!player.hasBehaviorAttribute("hidden")) {
			if (customNarration) this.#sendNarration(player, customNarration);
			else {
				const narration = this.#game.notificationGenerator.generateDieNotification(player, false);
				this.#sendNarration(player, narration);
			}
		}
	}
}