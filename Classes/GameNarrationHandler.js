import Fixture from "../Data/Fixture.js";
import InventoryItem from "../Data/InventoryItem.js";
import Narration from "../Data/Narration.js";
import Room from "../Data/Room.js";
import RoomItem from "../Data/RoomItem.js";
import { parseDescription } from "../Modules/parser.js";
import { generateListString } from "../Modules/helpers.js";

/** @typedef {import("../Data/Action.js").default} Action */
/** @typedef {import("../Data/Exit.js").default} Exit */
/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("../Data/Gesture.js").default} Gesture */
/** @typedef {import("../Data/Player.js").default} Player */
/** @typedef {import("../Data/Puzzle.js").default} Puzzle */
/** @typedef {import("../Data/Prefab.js").default} Prefab */
/** @typedef {import("../Data/Recipe.js").default} Recipe */
/** @typedef {import("../Data/Event.js").default} Event */
/** @typedef {import("../Data/HidingSpot.js").default} HidingSpot */
/** @typedef {import("../Data/InventorySlot.js").default} InventorySlot */
/** @typedef {import("../Data/ItemInstance.js").default} ItemInstance */
/** @typedef {import("../Data/Status.js").default} Status */
/** @typedef {import("../Data/Whisper.js").default} Whisper */

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
	 * @param {Action} action - The action being narrated.
	 * @param {Player} player - The player whose action is being narrated.
	 * @param {string} narrationText - The text of the narration.
	 * @param {Room} [location] - The location in which the narration is occurring. Defaults to the player's location.
	 */
	#sendNarration(action, player, narrationText, location = player.location) {
		// Capitalize the first letter, if necessary.
		if (narrationText.charAt(0) === narrationText.charAt(0).toLocaleLowerCase())
			narrationText = narrationText.charAt(0).toLocaleUpperCase() + narrationText.substring(1);
		new Narration(this.#game, action, player, location, narrationText).send();
	}

	/**
	 * Narrates a whisper action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Whisper} whisper - The whisper that was created.
	 * @param {Player} player - The player performing the whisper action.
	 */
	narrateWhisper(action, whisper, player) {
		const playerListString = whisper.generatePlayerListStringExcluding(player);
		const notification = this.#game.notificationGenerator.generateWhisperNotification(player, true, playerListString);
		const narration = this.#game.notificationGenerator.generateWhisperNotification(player, false, playerListString);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrations a gesture action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Gesture} gesture - The gesture being narrated.
	 * @param {Player} player - The player performing the gesture action.
	 */
	narrateGesture(action, gesture, player) {
		const narration = parseDescription(gesture.narration, gesture, player);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a start move action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {boolean} isRunning - Whether or not the player is running.
	 * @param {Exit} exit - The exit the player is moving toward. 
	 * @param {Player} player - The player performing the start move action. 
	 */
	narrateStartMove(action, isRunning, exit, player) {
		const notification = this.#game.notificationGenerator.generateStartMoveNotification(player, true, isRunning, exit.name);
		const narration = this.#game.notificationGenerator.generateStartMoveNotification(player, false, isRunning, exit.name);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates the player depleting half of their stamina.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Player} player - The player who has depleted half of their stamina.
	 */
	narrateReachedHalfStamina(action, player) {
		const notification = this.#game.notificationGenerator.generateHalfStaminaNotification(player, true);
		const narration = this.#game.notificationGenerator.generateHalfStaminaNotification(player, false);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates the player becoming weary.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Player} player - The player who became weary.
	 */
	narrateWeary(action, player) {
		const wearyStatus = this.#game.entityFinder.getStatusEffect("weary");
		const narration = this.#game.notificationGenerator.generateWearyNotification(player);
		player.sendDescription(wearyStatus.inflictedDescription, wearyStatus);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a player exiting a room.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Room} currentRoom - The room the player is currently in.
	 * @param {Exit} exit - The exit the player will leave their current room through.
	 * @param {Player} player - The player performing the move action.
	 */
	narrateExit(action, currentRoom, exit, player) {
		const appendString = player.createMoveAppendString();
		const playerCanMoveFreely = !player.isNPC && !!player.member.roles.cache.has(this.#game.guildContext.freeMovementRole.id);
		const notification = playerCanMoveFreely ? this.#game.notificationGenerator.generateSuddenExitNotification(player, true, currentRoom.displayName, appendString)
			: this.#game.notificationGenerator.generateExitNotification(player, true, exit.name, appendString);
		const narration = playerCanMoveFreely ? this.#game.notificationGenerator.generateSuddenExitNotification(player, false, currentRoom.displayName, appendString)
			: this.#game.notificationGenerator.generateExitNotification(player, false, exit.name, appendString);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration, currentRoom);
	}

	/**
	 * Narrates a player entering a room.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Room} destinationRoom  The room the player is moving to.
	 * @param {Exit} entrance - The exit the player will enter the destination room from.
	 * @param {Player} player - The player performing the move action.
	 */
	narrateEnter(action, destinationRoom, entrance, player) {
		const appendString = player.createMoveAppendString();
		const playerCanMoveFreely = !player.isNPC && !!player.member.roles.cache.has(this.#game.guildContext.freeMovementRole.id);
		const narration = playerCanMoveFreely ? this.#game.notificationGenerator.generateSuddenEnterNotification(player, false, destinationRoom.displayName, appendString)
			: this.#game.notificationGenerator.generateEnterNotification(player, false, entrance.name, appendString);
		this.#sendNarration(action, player, narration, destinationRoom);
		if (player.hasBehaviorAttribute("no sight")) {
			const notification = this.#game.notificationGenerator.generateNoSightEnterNotification();
			this.#game.communicationHandler.notifyPlayer(player, action, notification);
		}
		else {
			const description = entrance ? entrance.description : destinationRoom.description;
			player.sendDescription(description, destinationRoom);
		}
	}

	/**
	 * Narrates a stop action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Player} player - The player performing the stop action.
	 * @param {boolean} exitLocked - Whether or not the action was initiated because the destination exit was locked.
	 * @param {Exit} [exit] - The exit the player tried to move to, if applicable.
	 */
	narrateStop(action, player, exitLocked, exit) {
		const notification = exitLocked ? this.#game.notificationGenerator.generateExitLockedNotification(player, true, exit.getNamePhrase())
			: this.#game.notificationGenerator.generateStopNotification(player, true);
		const narration = exitLocked ? this.#game.notificationGenerator.generateExitLockedNotification(player, false, exit.getNamePhrase())
			: this.#game.notificationGenerator.generateStopNotification(player, false);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates an inspect action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Room|Fixture|RoomItem|InventoryItem|Player} target - The target to inspect.
	 * @param {Player} player - The player performing the inspect action.
	 */
	narrateInspect(action, target, player) {
		let narration = "";
		if (target instanceof Room)
			narration = this.#game.notificationGenerator.generateInspectRoomNotification(player, false);
		else if (target instanceof Fixture) {
			narration = this.#game.notificationGenerator.generateInspectFixtureNotification(player, false, target.getContainingPhrase());
			// If there are any players hidden in the fixture, notify them that they were found, and notify the player who found them.
			// However, don't notify anyone if the player is inspecting the fixture that they're hiding in.
			// Also ensure that the fixture isn't locked.
			if (target instanceof Fixture && !player.hasBehaviorAttribute("hidden") && player.hidingSpot !== target.name
			&&  (target.childPuzzle === null || !target.childPuzzle.type.endsWith("lock") || target.childPuzzle.solved)) {
				for (const occupant of target.hidingSpot.occupants) {
					const notification = this.#game.notificationGenerator.generateHiddenPlayerFoundNotification(occupant.hasBehaviorAttribute("no sight") ? "someone" : player.displayName);
					this.#game.communicationHandler.notifyPlayer(occupant, action, notification);
				}
				const hiddenPlayersList = target.hidingSpot.generateOccupantsString(player.hasBehaviorAttribute("no sight"));
				if (hiddenPlayersList) {
					const notification = this.#game.notificationGenerator.generateFoundHiddenPlayersNotification(hiddenPlayersList, target.hidingSpot.getContainingPhrase());
					this.#game.communicationHandler.notifyPlayer(player, action, notification);
				}
			}
		}
		else if (target instanceof RoomItem && !target.prefab.discreet) {
			const preposition = target.getContainerPreposition();
			const containerPhrase = target.getContainerPhrase();
			narration = this.#game.notificationGenerator.generateInspectRoomItemNotification(player, false, target.singleContainingPhrase, preposition, containerPhrase);
		}
		else if (target instanceof InventoryItem && !target.prefab.discreet && target.player.name === player.name)
			narration = this.#game.notificationGenerator.generateInspectInventoryItemNotification(player, false, target.singleContainingPhrase);
		if (narration !== "")
			this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a knock action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Exit} exit - The exit to knock on.
	 * @param {Player} player - The player performing the knock action.
	 */
	narrateKnock(action, exit, player) {
		const exitPhrase = exit.getNamePhrase();
		const notification = this.#game.notificationGenerator.generateKnockNotification(player, true, exitPhrase);
		const roomNarration = this.#game.notificationGenerator.generateKnockNotification(player, false, exitPhrase);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, roomNarration);
		const destination = exit.dest;
		if (destination.id === player.location.id) return;
		const hearingPlayers = destination.occupants.filter(occupant => !occupant.hasBehaviorAttribute("no hearing"));
		const destinationNarration = this.#game.notificationGenerator.generateKnockDestinationNotification(destination.exitCollection.get(exit.link).getNamePhrase());
		// If the number of hearing players is the same as the number of occupants in the room, send the message to the room.
		if (hearingPlayers.length !== 0 && hearingPlayers.length === destination.occupants.length)
			this.#sendNarration(action, player, destinationNarration, destination);
		else {
			for (const hearingPlayer of hearingPlayers)
				this.#game.communicationHandler.notifyPlayer(hearingPlayer, action, destinationNarration);
		}
	}

	/**
	 * Narrates a hide action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {HidingSpot} hidingSpot - The hiding spot the player is hiding in.
	 * @param {Player} player - The player performing the hide action.
	 */
	narrateHide(action, hidingSpot, player) {
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
		this.#game.communicationHandler.notifyPlayer(player, action, playerNotification);
		this.#sendNarration(action, player, narration);
		for (const occupant of hidingSpot.occupants) {
			const occupantNotification = hidingSpot.occupants.length + 1 > hidingSpot.capacity ? this.#game.notificationGenerator.generateFoundInFullHidingSpotNotification(occupant, player)
			: this.#game.notificationGenerator.generateFoundInOccupiedHidingSpotNotification(occupant, player);
			this.#game.communicationHandler.notifyPlayer(occupant, action, occupantNotification);
		}
	}

	/**
	 * Narrates an unhide action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {HidingSpot} hidingSpot - The hiding spot the player is coming out from.
	 * @param {Player} player - The player performing the unhide action.
	 */
	narrateUnhide(action, hidingSpot, player) {
		const hidingSpotPhrase = hidingSpot ? hidingSpot.getContainingPhrase() : "hiding";
		const notification = this.#game.notificationGenerator.generateUnhideNotification(player, true, hidingSpotPhrase);
		const narration = this.#game.notificationGenerator.generateUnhideNotification(player, false, hidingSpotPhrase);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates an inflict action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Status} status - The status being inflicted.
	 * @param {Player} player - The player performing the inflict action.
	 */
	narrateInflict(action, status, player) {
		let narration = "";
		if (status.id === "asleep") narration = this.#game.notificationGenerator.generateFallAsleepNotification(player.displayName);
		else if (status.id === "blacked out") narration = this.#game.notificationGenerator.generateBlackOutNotification(player.displayName);
		else if (status.behaviorAttributes.has("unconscious")) narration = this.#game.notificationGenerator.generateUnconsciousNotification(player.displayName);
		if (narration) this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a cure action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Status} status - The status being cured.
	 * @param {Player} player - The player performing the cure action.
	 * @param {InventoryItem} [item] - The inventory item that caused the status to be cured, if applicable.
	 */
	narrateCure(action, status, player, item) {
		if (status.behaviorAttributes.has("concealed")) {
			const maskName = item ? item.name : "MASK";
			const unmaskedNarration = this.#game.notificationGenerator.generateConcealedCuredNotification(maskName, player.displayName);
			this.#sendNarration(action, player, unmaskedNarration);
		}
		else if (status.behaviorAttributes.has("unconscious")) {
			let awakenNarration = "";
			if (status.id === "asleep" || status.id === "blacked out") awakenNarration = this.#game.notificationGenerator.generateWakeUpNotification(player.displayName);
			else awakenNarration = this.#game.notificationGenerator.generateRegainConsciousnessNotification(player.displayName);
			this.#sendNarration(action, player, awakenNarration);
		}
	}

	/**
	 * Narrates a use action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The inventory item to use.
	 * @param {Player} player - The player performing the use action.
	 * @param {Player} target - The target player of the use action.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	narrateUse(action, item, player, target, customNarration) {
		if (customNarration)
			this.#sendNarration(action, player, customNarration);
		else {
			const verb = item.prefab.verb ? item.prefab.verb : `uses`;
			const targetPhrase = target.name !== player.name ? ` on ${target.displayName}` : ``;
			this.#sendNarration(action, player, `${player.displayName} ${verb} ${item.singleContainingPhrase}${targetPhrase}.`);
		}
	}

	/**
	 * Narrates a take action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {RoomItem} item - The item to take.
	 * @param {Player} player - The player performing the take action.
	 * @param {boolean} [notify] - Whether or not to notify the player that they took the item. Defaults to true.
	 */
	narrateTake(action, item, player, notify = true) {
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
		if (notify) this.#game.communicationHandler.notifyPlayer(player, action, notification);
		if (!item.prefab.discreet)
			this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a steal action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The item being stolen.
	 * @param {Player} thief - The player performing the steal action.
	 * @param {Player} victim - The player being stolen from.
	 * @param {InventoryItem} container - The container the item was stolen from.
	 * @param {InventorySlot} inventorySlot - The inventory slot the item was stolen from.
	 * @param {boolean} notifyVictim - Whether or not to notify the victim who was stolen from.
	 */
	narrateSteal(action, item, thief, victim, container, inventorySlot, notifyVictim) {
		const slotPhrase = container.getSlotPhrase(inventorySlot);
		const thiefNotification = this.#game.notificationGenerator.generateSuccessfulStealNotification(thief, true, item.singleContainingPhrase, slotPhrase, container.name, victim, notifyVictim);
		this.#game.communicationHandler.notifyPlayer(thief, action, thiefNotification);
		if (notifyVictim) {
			const victimNotification = this.#game.notificationGenerator.generateSuccessfulStolenFromNotification(thief.displayName, slotPhrase, item.singleContainingPhrase, container.name);
			this.#game.communicationHandler.notifyPlayer(victim, action, victimNotification);
		}
		if (!item.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateSuccessfulStealNotification(thief, false, item.singleContainingPhrase, slotPhrase, container.name, victim, notifyVictim)
			this.#sendNarration(action, thief, narration);
		}
	}

	/**
	 * Narrates a drop action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The item to drop.
	 * @param {Fixture|Puzzle|RoomItem} container - The container to drop the item into.
	 * @param {Player} player - The player performing the take action.
	 * @param {boolean} [notify] - Whether or not to notify the player that they dropped the item. Defaults to true.
	 */
	narrateDrop(action, item, container, player, notify = true) {
		const preposition = container.getPreposition();
		const containerPhrase = container.getContainingPhrase();
		const notification = this.#game.notificationGenerator.generateDropNotification(player, true, item.singleContainingPhrase, preposition, containerPhrase);
		if (notify) this.#game.communicationHandler.notifyPlayer(player, action, notification);
		if (!item.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateDropNotification(player, false, item.singleContainingPhrase, preposition, containerPhrase)
			this.#sendNarration(action, player, narration);
		}
	}

	/**
	 * Narrates a give action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The item to give.
	 * @param {Player} player - The player performing the give action.
	 * @param {Player} recipient - The player receiving the item.
	 */
	narrateGive(action, item, player, recipient) {
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
		this.#game.communicationHandler.notifyPlayer(player, action, playerNotification);
		this.#game.communicationHandler.notifyPlayer(recipient, action, recipientNotification);
		if (!item.prefab.discreet)
			this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a stash action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The item being stashed.
	 * @param {InventoryItem} container - The container to stash the item in.
	 * @param {InventorySlot} inventorySlot - The inventory slot to stash the item in.
	 * @param {Player} player - The player performing the stash action.
	 */
	narrateStash(action, item, container, inventorySlot, player) {
		const preposition = container.getPreposition();
		const slotPhrase = container.getSlotPhrase(inventorySlot);
		const notification = this.#game.notificationGenerator.generateStashNotification(player, true, item.singleContainingPhrase, preposition, slotPhrase, container.name);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		if (!item.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateStashNotification(player, false, item.singleContainingPhrase, preposition, slotPhrase, container.name)
			this.#sendNarration(action, player, narration);
		}
	}

	/**
	 * Narrates an unstash action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The item being unstashed.
	 * @param {InventoryItem} container - The container to unstash the item from.
	 * @param {InventorySlot} inventorySlot - The inventory slot to unstash the item from.
	 * @param {Player} player - The player performing the unstash action.
	 */
	narrateUnstash(action, item, container, inventorySlot, player) {
		const slotPhrase = container.getSlotPhrase(inventorySlot);
		const notification = this.#game.notificationGenerator.generateUnstashNotification(player, true, item.singleContainingPhrase, slotPhrase, container.name);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		if (!item.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateUnstashNotification(player, false, item.singleContainingPhrase, slotPhrase, container.name);
			this.#sendNarration(action, player, narration);
		}
	}

	/**
	 * Narrates an equip action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The item being equipped.
	 * @param {Player} player - The player performing the equip action.
	 * @param {boolean} [notify] - Whether or not to notify the player that they equipped the item. Defaults to true.
	 */
	narrateEquip(action, item, player, notify = true) {
		if (notify) {
			const notification = this.#game.notificationGenerator.generateEquipNotification(player, true, item.singleContainingPhrase);
			this.#game.communicationHandler.notifyPlayer(player, action, notification);
		}
		const narration = this.#game.notificationGenerator.generateEquipNotification(player, false, item.singleContainingPhrase);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates an unequip action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The item being unequipped.
	 * @param {Player} player - The player performing the unequip action.
	 * @param {boolean} [notify] - Whether or not to notify the player that they unequipped the item. Defaults to true.
	 */
	narrateUnequip(action, item, player, notify = true) {
		if (notify) {
			const notification = this.#game.notificationGenerator.generateUnequipNotification(player, true, item.singleContainingPhrase);
			this.#game.communicationHandler.notifyPlayer(player, action, notification);
		}
		const narration = this.#game.notificationGenerator.generateUnequipNotification(player, false, item.singleContainingPhrase);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a dress action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem[]} items - The items the player is putting on.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the player is dressing from.
	 * @param {Player} player - The player performing the dress action.
	 */
	narrateDress(action, items, container, player) {
		const itemPhrases = items.map(item => item.singleContainingPhrase);
		const itemList = generateListString(itemPhrases);
		const notification = this.#game.notificationGenerator.generateDressNotification(player, true, container.name, itemList);
		const narration = this.#game.notificationGenerator.generateDressNotification(player, false, container.name, itemList);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates an undress action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem[]} items - The items the player is taking off.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the player is undressing into.
	 * @param {Player} player - The player performing the undress action.
	 */
	narrateUndress(action, items, container, player) {
		const preposition = container.getPreposition();
		const containerPhrase = container.getContainingPhrase();
		const itemPhrases = items.map(item => item.singleContainingPhrase);
		const itemList = generateListString(itemPhrases);
		const notification = this.#game.notificationGenerator.generateUndressNotification(player, true, preposition, containerPhrase, itemList);
		const narration = this.#game.notificationGenerator.generateUndressNotification(player, false, preposition, containerPhrase, itemList);
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates an instantiate action when the item is an inventory item equipped to a player's equipment slot.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The item that is being instantiated.
	 * @param {Player} player - The player the inventory item is being equipped to.
	 */
	narrateInstantiateEquippedInventoryItem(action, item, player) {
		let notification = "";
		let narration = "";
		if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") {
			notification = this.#game.notificationGenerator.generateTakeNotification(player, true, item.singleContainingPhrase);
			narration = this.#game.notificationGenerator.generateTakeNotification(player, false, item.singleContainingPhrase);
		}
		else {
			notification = this.#game.notificationGenerator.generateEquipNotification(player, true, item.singleContainingPhrase);
			narration = this.#game.notificationGenerator.generateEquipNotification(player, false, item.singleContainingPhrase);
		}
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a destroy action when the item is an inventory item equipped to a player's equipment slot.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {InventoryItem} item - The item that is being destroyed.
	 * @param {Player} player - The player the inventory item belongs to.
	 */
	narrateDestroyEquippedInventoryItem(action, item, player) {
		let notification = "";
		let narration = "";
		if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") {
			notification = this.#game.notificationGenerator.generateDropNotification(player, true, item.singleContainingPhrase);
			narration = this.#game.notificationGenerator.generateDropNotification(player, false, item.singleContainingPhrase);
		}
		else {
			notification = this.#game.notificationGenerator.generateUnequipNotification(player, true, item.singleContainingPhrase);
			narration = this.#game.notificationGenerator.generateUnequipNotification(player, false, item.singleContainingPhrase);
		}
		this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a craft action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {CraftingResult} craftingResult - The result of the craft action.
	 * @param {Player} player - The player performing the craft action.
	 */
	narrateCraft(action, craftingResult, player) {
		if (craftingResult.product1 && !craftingResult.product1.prefab.discreet || craftingResult.product2 && !craftingResult.product2.prefab.discreet) {
			const narration = this.#game.notificationGenerator.generateCraftNotification(player, false, craftingResult);
			this.#sendNarration(action, player, narration);
		}
	}

	/**
	 * Narrates an uncraft action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Recipe} recipe - The recipe used to uncraft the item.
	 * @param {Prefab} originalItemPrefab - The prefab of the original item.
	 * @param {InventoryItem} item - The item being uncrafted.
	 * @param {UncraftingResult} uncraftingResult - The result of the uncraft action.
	 * @param {Player} player - The player performing the uncraft action.
	 */
	narrateUncraft(action, recipe, originalItemPrefab, item, uncraftingResult, player) {
		if (!originalItemPrefab.discreet || !recipe.ingredients[0].discreet || !recipe.ingredients[1].discreet) {
			const originalItemPhrase = originalItemPrefab.singleContainingPhrase;
			const itemPhrase = item.singleContainingPhrase;
			const narration = this.#game.notificationGenerator.generateUncraftNotification(player, false, recipe, originalItemPhrase, itemPhrase, uncraftingResult);
			this.#sendNarration(action, player, narration);
		}
	}

	/**
	 * Narrates an activate action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Fixture} fixture - The fixture being activated.
	 * @param {Player} [player] - The player performing the activate action.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	narrateActivate(action, fixture, player, customNarration = "") {
		const fixturePhrase = fixture.getContainingPhrase();
		let notification = customNarration;
		let narration = customNarration;
		if (player && !customNarration) {
			notification = this.#game.notificationGenerator.generateActivateNotification(fixturePhrase, player, true);
			narration = this.#game.notificationGenerator.generateActivateNotification(fixturePhrase, player, false);
		}
		else if (!customNarration) narration = this.#game.notificationGenerator.generateActivateNotification(fixturePhrase);
		if (notification) this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration, fixture.location);
	}

	/**
	 * Narrates a deactivate action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Fixture} fixture - The fixture being deactivated.
	 * @param {Player} [player] - The player performing the deactivate action.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	narrateDeactivate(action, fixture, player, customNarration = "") {
		const fixturePhrase = fixture.getContainingPhrase();
		let notification = customNarration;
		let narration = customNarration;
		if (player && !customNarration) {
			notification = this.#game.notificationGenerator.generateDeactivateNotification(fixturePhrase, player, true);
			narration = this.#game.notificationGenerator.generateDeactivateNotification(fixturePhrase, player, false);
		}
		else if (!customNarration) narration = this.#game.notificationGenerator.generateDeactivateNotification(fixturePhrase);
		if (notification) this.#game.communicationHandler.notifyPlayer(player, action, notification);
		this.#sendNarration(action, player, narration, fixture.location);
	}

	/**
	 * Narrates an attempt action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Puzzle} puzzle - The puzzle being attempted.
	 * @param {Player} player - The player performing the action.
	 * @param {string} description - The description to send to the player.
	 * @param {string} [narration] - The narration to send. If none is supplied, uses the default puzzle interact notification.
	 */
	narrateAttempt(action, puzzle, player, description, narration = this.#game.notificationGenerator.generateAttemptPuzzleDefaultNotification(player.displayName, puzzle.getContainingPhrase())) {
		if (description !== "") {
			if (description.includes("<desc>")) player.sendDescription(description, puzzle);
			else this.#game.communicationHandler.notifyPlayer(player, action, description);
		}
		if (narration  !== "") this.#sendNarration(action, player, narration);
	}

	/**
	 * Narrates a solve action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Puzzle} puzzle - The puzzle being attempted.
	 * @param {string} outcome - The outcome the puzzle was solved with.
	 * @param {Player} [player] - The player performing the action. Optional.
	 * @param {ItemInstance} [item] - The item that was used to solve the puzzle. Optional.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	narrateSolve(action, puzzle, outcome, player, item, customNarration = "") {
		let narration = customNarration;
		if (player && !customNarration)
			narration = this.#game.notificationGenerator.generateSolvePuzzleNotification(player, false, puzzle, outcome, item);
		if (player) player.sendDescription(puzzle.correctDescription, puzzle);
		if (narration !== "") this.#sendNarration(action, player, narration, puzzle.location);
	}

	/**
	 * Narrates an unsolve action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Puzzle} puzzle - The puzzle being attempted.
	 * @param {Player} [player] - The player performing the action. Optional.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	narrateUnsolve(action, puzzle, player, customNarration = "") {
		let narration = customNarration;
		let notification = this.#game.notificationGenerator.generateUnsolvePuzzleNotification(player, true, puzzle);
		if (player && !customNarration)
			narration = this.#game.notificationGenerator.generateUnsolvePuzzleNotification(player, false, puzzle);
		if (player && notification !== "") {
			if (notification.includes("<desc>")) player.sendDescription(notification, puzzle);
			else this.#game.communicationHandler.notifyPlayer(player, action, notification);
		}
		if (narration !== "") this.#sendNarration(action, player, narration, puzzle.location);
	}

	/**
	 * Narrates a die action.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {Player} player - The player performing the die action. 
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	narrateDie(action, player, customNarration) {
		this.#game.communicationHandler.notifyPlayer(player, action, this.#game.notificationGenerator.generateDieNotification(player, true));
		if (!player.hasBehaviorAttribute("hidden")) {
			if (customNarration) this.#sendNarration(action, player, customNarration);
			else {
				const narration = this.#game.notificationGenerator.generateDieNotification(player, false);
				this.#sendNarration(action, player, narration);
			}
		}
	}

	/**
	 * Narrates an exit being unlocked.
	 * @param {Room} room - The room the exit is in.
	 * @param {Exit} exit - The exit being unlocked.
	 */
	narrateUnlock(room, exit) {
		const narration = this.#game.notificationGenerator.generateUnlockNotification(exit);
		this.#sendNarration(undefined, undefined, narration, room);
	}

	/**
	 * Narrates an exit being locked.
	 * @param {Room} room - The room the exit is in.
	 * @param {Exit} exit - The exit being locked.
	 */
	narrateLock(room, exit) {
		const narration = this.#game.notificationGenerator.generateLockNotification(exit);
		this.#sendNarration(undefined, undefined, narration, room);
	}

	/**
	 * Narrates an event being triggered.
	 * @param {Event} event - The event being triggered.
	 */
	narrateTrigger(event) {
		// Send the triggered narration to all rooms with occupants.
		if (event.triggeredNarration !== "") {
			const narrationText = parseDescription(event.triggeredNarration, event, undefined);
			const rooms = this.#game.entityFinder.getRooms(null, event.roomTag, false);
			for (let room of rooms)
				this.#sendNarration(undefined, undefined, narrationText, room);
		}
	}

	/**
	 * Narrates an event being ended.
	 * @param {Event} event - The event being ended.
	 */
	narrateEnd(event) {
		// Send the ended narration to all rooms with occupants.
		if (event.endedNarration !== "") {
			const narrationText = parseDescription(event.endedNarration, event, undefined);
			const rooms = this.#game.entityFinder.getRooms(null, event.roomTag, false);
			for (let room of rooms)
				this.#sendNarration(undefined, undefined, narrationText, room);
		}
	}
}