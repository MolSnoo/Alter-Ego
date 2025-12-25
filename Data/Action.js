import Die from "./Die.js";
import EquipmentSlot from "./EquipmentSlot.js";
import Exit from "./Exit.js";
import Fixture from "./Fixture.js";
import Game from "./Game.js";
import Gesture from "./Gesture.js";
import InventoryItem from "./InventoryItem.js";
import InventorySlot from "./InventorySlot.js";
import Player from "./Player.js";
import Puzzle from "./Puzzle.js";
import Room from "./Room.js";
import RoomItem from "./RoomItem.js";
import Whisper from "./Whisper.js";
import { addDirectNarrationWithAttachments } from "../Modules/messageHandler.js";
import { generatePlayerListString, getSortedItemsString } from "../Modules/helpers.js";

/**
 * @class Action
 * @classdesc Represents an action taken by a player.
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/action.html
 */
export default class Action {
	/**
	 * The game this belongs to.
	 * @readonly
	 * @type {Game}
	 */
	#game;
	/**
	 * The unique ID of this action.
	 * @readonly
	 * @type {string}
	 */
	id;
	/**
	 * The type of action being performed.
	 * @readonly
	 * @type {ActionType}
	 */
	type;
	/**
	 * The message that initiated the action.
	 * @readonly
	 * @type {UserMessage}
	 */
	message;
	/**
	 * The player performing the action.
	 * @readonly
	 * @type {Player}
	 */
	player;
	/**
	 * The location where this action is being performed.
	 * @readonly
	 * @type {Room}
	 */
	location;
	/**
	 * Whether or not the action was performed by someone other than the player themselves.
	 * @readonly
	 * @type {boolean}
	 */
	forced;
	/**
	 * The whisper where this action is being performed, if applicable.
	 * @readonly
	 * @type {Whisper}
	 */
	whisper;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 * @param {ActionType} type - The type of action being performed.
	 * @param {UserMessage} message - The message that initiated the action. 
	 * @param {Player} player - The player performing the action.
	 * @param {Room} location - The location where this action is being performed.
	 * @param {boolean} forced - Whether or not the action was performed by someone other than the player themselves.
	 * @param {Whisper} [whisper] - The whisper where this action is being performed, if applicable.
	 */
	constructor(game, type, message, player, location, forced, whisper) {
		this.#game = game;
		this.type = type;
		this.message = message;
		this.player = player;
		this.location = location;
		this.forced = forced;
		this.whisper = whisper;
		this.id = this.#generateId();
	}

	#generateId() {
		const id =  this.message ? this.message.id : String(Math.floor(Math.random() * 999999999999999));
		return `${this.player}-${this.type}-${id}`;
	}

	/**
	 * Performs a text action.
	 * @param {Player} recipient - The player who will receive the text.
	 * @param {string} messageText - The text content of the text message.
	 */
	performText(recipient, messageText) {
		if (this.type !== ActionType.Text) return;
		const senderText = this.#game.notificationGenerator.generateTextNotification(messageText, this.player.name, recipient.name);
		const recipientText = this.#game.notificationGenerator.generateTextNotification(messageText, this.player.name);
		addDirectNarrationWithAttachments(this.player, senderText, this.message.attachments);
		addDirectNarrationWithAttachments(recipient, recipientText, this.message.attachments);
	}

	/**
	 * Performs a gesture action.
	 * @param {Gesture} gesture - The gesture to perform.
	 * @param {string} targetType - The type of entity to target.
	 * @param {Exit|Fixture|RoomItem|Player|InventoryItem|null} target - The entity to target.
	 */
	performGesture(gesture, targetType, target) {
		if (this.type !== ActionType.Gesture) return;
		let newGesture = new Gesture(gesture.id, [...gesture.requires], [...gesture.disabledStatusesStrings], gesture.description, gesture.narration, gesture.row, this.#game);
		newGesture.targetType = targetType;
		newGesture.target = target;
		this.#game.narrationHandler.narrateGesture(newGesture, this.player);
		this.#game.logHandler.logGesture(gesture, target, this.player, this.forced);
	}

	/**
	 * Performs a stop action.
	 */
	performStop() {
		if (this.type !== ActionType.Stop) return;
		this.player.stopMoving();
		this.#game.narrationHandler.narrateStop(this.player);
	}

	/**
	 * Performs an inspect action.
	 * @param {Room|Fixture|RoomItem|InventoryItem|Player} target - The entity to inspect.
	 */
	performInspect(target) {
		if (this.type !== ActionType.Inspect) return;
		this.#game.narrationHandler.narrateInspect(target, this.player);
		let description = target.description;
		// If the player is inspecting an inventory item that belongs to another player, remove the contents of all il tags before parsing it.
		if (target instanceof InventoryItem && target.player.name !== this.player.name)
			description = description.replace(/(<(il)(\s[^>]+?)*>)[\s\S]+?(<\/\2>)/g, "$1$4");
		this.player.sendDescription(description, target);

		// If there are any players hidden in the fixture, notify them that they were found, and notify the player who found them.
		// However, don't notify anyone if the player is inspecting the fixture that they're hiding in.
		// Also ensure that the fixture isn't locked.
		if (target instanceof Fixture && !this.player.hasBehaviorAttribute("hidden") && this.player.hidingSpot !== target.name
		&&  (target.childPuzzle === null || !target.childPuzzle.type.endsWith("lock") || target.childPuzzle.solved)) {
			const hiddenPlayers = this.#game.entityFinder.getLivingPlayers(undefined, undefined, this.player.location.id, target.name);
			for (const hiddenPlayer of hiddenPlayers)
				hiddenPlayer.notify(this.#game.notificationGenerator.generateHiddenPlayerFoundNotification(this.player.displayName));
			const hiddenPlayersString = generatePlayerListString(hiddenPlayers);
			if (hiddenPlayersString) this.player.notify(this.#game.notificationGenerator.generateFoundHiddenPlayersNotification(hiddenPlayersString, target.name));
		}
		this.#game.logHandler.logInspect(target, this.player, this.forced);
	}

	/**
	 * Performs a knock action.
	 * @param {Exit} exit - The exit to knock on.
	 */
	performKnock(exit) {
		if (this.type !== ActionType.Knock) return;
		this.#game.narrationHandler.narrateKnock(exit, this.player);
		this.#game.logHandler.logKnock(exit, this.player, this.forced);
	}

	/**
	 * Performs a use action.
	 * @param {InventoryItem} item - The inventory item to use.
	 * @param {Player} [target] - The target the player should use the inventory item on. Defaults to themself.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	performUse(item, target = this.player, customNarration) {
		if (this.type !== ActionType.Use) return;
		this.#game.narrationHandler.narrateUse(item, this.player, target, customNarration);
		this.#game.logHandler.logUse(item, this.player, target, this.forced);
		this.player.use(item, target);
	}

	/**
	 * Performs a take action.
	 * @param {RoomItem} item - The room item to take. 
	 * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the item in.
     * @param {Puzzle|Fixture|RoomItem} container - The item's current container.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} the item is currently in.
     * @param {boolean} [notify] - Whether or not to notify the player that they took the item. Defaults to true.
	 */
	performTake(item, handEquipmentSlot, container, inventorySlot, notify = true) {
		if (this.type !== ActionType.Take) return;
		const successful = this.forced || this.player.carryWeight + item.weight <= this.player.carryWeight;
		this.#game.narrationHandler.narrateTake(item, this.player, notify);
		this.#game.logHandler.logTake(item, this.player, container, inventorySlot, successful, this.forced);
		if (!successful) return;
		this.player.take(item, handEquipmentSlot, container, inventorySlot);
		// Container is a weight puzzle.
		if (container instanceof Puzzle && container.type === "weight") {
			const containerItems = this.#game.roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
			const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
			this.player.attemptPuzzle(container, item, weight.toString(), "take", "");
		}
		// Container is a container puzzle.
		else if (container instanceof Puzzle && container.type === "container") {
			const containerItems = this.#game.roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
			const containerItemsString = getSortedItemsString(containerItems);
			this.player.attemptPuzzle(container, item, containerItemsString, "take", "");
		}
	}

	/**
	 * Performs a steal action.
	 * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param {Player} victim - The player to steal from.
     * @param {InventoryItem} container - An inventory item belonging to the victim that the player will attempt to steal from.
     * @param {InventorySlot<InventoryItem>} inventorySlot - The {@link InventorySlot|inventory slot} that the player will attempt to steal from.
	 */
	performSteal(handEquipmentSlot, victim, container, inventorySlot) {
		const slotPhrase = container.inventoryCollection.size !== 1 ? `the ${inventorySlot.id} of ` : ``;
		// If there are no items in that slot, tell the player.
		if (inventorySlot.items.length === 0)
			return this.player.notify(this.#game.notificationGenerator.generateStoleFromEmptyInventorySlotNotification(slotPhrase, container.name, victim.displayName));
		// There might be multiple of the same item, so we need to make an array where each item's index is inserted as many times as its quantity.
		/** @type {number[]} */
		let actualItems = [];
		for (let item of inventorySlot.items) {
			for (let i = 0; i < item.quantity; i++)
				actualItems.push(i);
		}
		const actualItemsIndex = Math.floor(Math.random() * actualItems.length);
		const index = actualItems[actualItemsIndex];
		const item = inventorySlot.items[index];

		// Determine how successful the player is.
		const failMax = Math.floor((this.#game.settings.diceMax - this.#game.settings.diceMin) / 3) + this.#game.settings.diceMin;
		const partialMax = Math.floor(2 * (this.#game.settings.diceMax - this.#game.settings.diceMin) / 3) + this.#game.settings.diceMin;
		let dieRoll = new Die(this.#game, "dex", this.player, victim);
		if (this.player.hasBehaviorAttribute("thief")) dieRoll.result = this.#game.settings.diceMax;
		if (!item.prefab.discreet && dieRoll.result > partialMax) dieRoll.result = partialMax;

		if (dieRoll.result > failMax && item instanceof InventoryItem) {
			const victimAware = dieRoll.result <= partialMax && !victim.hasBehaviorAttribute("unconscious");
			this.#game.narrationHandler.narrateSteal(item, this.player, victim, container, inventorySlot, victimAware);
			this.#game.logHandler.logSteal(item, this.player, victim, container, inventorySlot, true, this.forced);
			this.player.steal(item, handEquipmentSlot, victim, container, inventorySlot);
		}
		else {
			this.player.notify(this.#game.notificationGenerator.generateFailedStealNotification(item.singleContainingPhrase, slotPhrase, container.name, victim));
			victim.notify(this.#game.notificationGenerator.generateFailedStolenFromNotification(this.player.displayName, slotPhrase, item.singleContainingPhrase, container.name));
			this.#game.logHandler.logSteal(item, this.player, victim, container, inventorySlot, false, this.forced);
		}
	}

	/**
	 * Performs a drop action.
	 * @param {InventoryItem} item - The inventory item to drop. 
	 * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {Puzzle|Fixture|RoomItem} container - The container to put the item in.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} to put the item in.
     * @param {boolean} [notify] - Whether or not to notify the player that they dropped the item. Defaults to true.
	 */
	performDrop(item, handEquipmentSlot, container, inventorySlot, notify = true) {
		if (this.type !== ActionType.Drop) return;
		this.#game.narrationHandler.narrateDrop(item, container, this.player, notify);
		this.#game.logHandler.logDrop(item, this.player, container, inventorySlot, this.forced);
		this.player.drop(item, handEquipmentSlot, container, inventorySlot);
		// Container is a weight puzzle.
        if (container instanceof Puzzle && container.type === "weight") {
            const containerItems = this.#game.roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
            const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            this.player.attemptPuzzle(container, item, weight.toString(), "drop", "");
        }
        // Container is a container puzzle.
        else if (container instanceof Puzzle && container.type === "container") {
            const containerItems = this.#game.roomItems.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
			const containerItemsString = getSortedItemsString(containerItems);
            this.player.attemptPuzzle(container, item, containerItemsString, "drop", "");
        }
	}

	/**
	 * Performs a give action.
	 * @param {InventoryItem} item - The inventory item to give.
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {Player} recipient - The player to give the inventory item to.
     * @param {EquipmentSlot} recipientHandEquipmentSlot - The hand equipment slot of the recipient to put the item in.
	 */
	performGive(item, handEquipmentSlot, recipient, recipientHandEquipmentSlot) {
		if (this.type !== ActionType.Give) return;
		const successful = this.forced || recipient.carryWeight + item.weight <= recipient.maxCarryWeight;
		this.#game.narrationHandler.narrateGive(item, this.player, recipient);
		this.#game.logHandler.logGive(item, this.player, recipient, successful, this.forced);
		if (successful) this.player.give(item, handEquipmentSlot, recipient, recipientHandEquipmentSlot);
	}

	/**
	 * Performs a stash action.
	 * @param {InventoryItem} item - The inventory item to stash. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {InventoryItem} container - The container to stash the inventory item in.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} to stash the inventory item in.
	 */
	performStash(item, handEquipmentSlot, container, inventorySlot) {
		if (this.type !== ActionType.Stash) return;
		this.#game.narrationHandler.narrateStash(item, container, inventorySlot, this.player);
		this.#game.logHandler.logStash(item, this.player, container, inventorySlot, this.forced);
		this.player.stash(item, handEquipmentSlot, container, inventorySlot);
	}

	/**
     * Performs an unstash action.
     * @param {InventoryItem} item - The inventory item to unstash. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param {InventoryItem} container - The inventory item's current container.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} the inventory item is currently in.
     */
	performUnstash(item, handEquipmentSlot, container, inventorySlot) {
		if (this.type !== ActionType.Unstash) return;
		this.#game.narrationHandler.narrateUnstash(item, container, inventorySlot, this.player);
		this.#game.logHandler.logUnstash(item, this.player, container, inventorySlot, this.forced);
		this.player.unstash(item, handEquipmentSlot, container, inventorySlot);
	}

	/**
     * Performs an equip action.
     * @param {InventoryItem} item - The inventory item to equip.
     * @param {EquipmentSlot} equipmentSlot - The equipment slot to equip the inventory item to. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {boolean} [notify=true] - Whether or not to notify the player that they equipped the inventory item. Defaults to true.
     */
	performEquip(item, equipmentSlot, handEquipmentSlot, notify = true) {
		if (this.type !== ActionType.Equip) return;
		this.#game.narrationHandler.narrateEquip(item, this.player, notify);
		this.#game.logHandler.logEquip(item, this.player, equipmentSlot, this.forced);
		this.player.equip(item, equipmentSlot, handEquipmentSlot);
	}

	/**
     * Performs an unequip action.
     * @param {InventoryItem} item - The inventory item to unequip.
     * @param {EquipmentSlot} equipmentSlot - The equipment slot the inventory item is currently equipped to. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param {boolean} [notify=true] - Whether or not to notify the player that they unequipped the inventory item. Defaults to true.
     */
	performUnequip(item, equipmentSlot, handEquipmentSlot, notify = true) {
		if (this.type !== ActionType.Unequip) return;
		this.#game.narrationHandler.narrateUnequip(item, this.player, notify);
		this.#game.logHandler.logUnequip(item, this.player, equipmentSlot, this.forced);
		this.player.unequip(item, equipmentSlot, handEquipmentSlot);
	}

	/**
	 * Performs a die action.
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	performDie(customNarration) {
		if (this.type !== ActionType.Die) return;
		this.#game.narrationHandler.narrateDie(this.player, customNarration);
		this.#game.logHandler.logDie(this.player);
		this.player.die();
	}
}