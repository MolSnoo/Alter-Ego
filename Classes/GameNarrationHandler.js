import Exit from "../Data/Exit.js";
import Fixture from "../Data/Fixture.js";
import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import InventoryItem from "../Data/InventoryItem.js";
import InventorySlot from "../Data/InventorySlot.js";
import Narration from "../Data/Narration.js";
import Player from "../Data/Player.js";
import Puzzle from "../Data/Puzzle.js";
import Room from "../Data/Room.js";
import RoomItem from "../Data/RoomItem.js";
import { parseDescription } from "../Modules/parser.js";

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
	 * Narrates a stop action.
	 * @param {Player} player - The player performing the stop action.
	 */
	narrateStop(player) {
		const narration = `${player.displayName} stops moving.`;
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
		else if (target instanceof Fixture)
			narration = `${player.displayName} begins inspecting the ${target.name}.`;
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
		let notification = this.#game.notificationGenerator.generateTakeNotification(item.singleContainingPhrase, containerPhrase);
		let narration = `${player.displayName} takes ${item.singleContainingPhrase} from ${containerPhrase}.`;
		if (item.weight > player.maxCarryWeight) {
			notification = this.#game.notificationGenerator.generateTakeTooHeavyNotification(item.singleContainingPhrase, containerPhrase);
			narration = `${player.displayName} tries to take ${item.singleContainingPhrase} from ${containerPhrase}, but it is too heavy for ${player.pronouns.obj} to lift.`;
		}
		else if (player.carryWeight + item.weight > player.maxCarryWeight) {
			notification = this.#game.notificationGenerator.generateTakeTooMuchWeightNotification(item.singleContainingPhrase, containerPhrase);
			narration = `${player.displayName} tries to take ${item.singleContainingPhrase} from ${containerPhrase}, but ${player.pronouns.sbj} ${player.pronouns.plural ? `are` : `is`} carrying too much weight.`;
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
		const thiefNotification = this.#game.notificationGenerator.generateSuccessfulStealNotification(item.singleContainingPhrase, slotPhrase, container.name, victim, notifyVictim);
		thief.notify(thiefNotification);
		if (notifyVictim) {
			const victimNotification = this.#game.notificationGenerator.generateSuccessfulStolenFromNotification(thief.displayName, slotPhrase, item.singleContainingPhrase, container.name);
			victim.notify(victimNotification);
		}
		if (!item.prefab.discreet)
			this.#sendNarration(thief, `${thief.displayName} steals ${item.singleContainingPhrase} from ${slotPhrase}${victim.displayName}'s ${container.name}.`);
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
		if (notify) player.notify(this.#game.notificationGenerator.generateDropNotification(item.singleContainingPhrase, preposition, containerPhrase));
		if (!item.prefab.discreet)
			this.#sendNarration(player, `${player.displayName} puts ${item.singleContainingPhrase} ${preposition} ${containerPhrase}.`);
	}

	/**
	 * Narrates a give action.
	 * @param {InventoryItem} item - The item to give.
	 * @param {Player} player - The player performing the give action.
	 * @param {Player} recipient - The player receiving the item.
	 */
	narrateGive(item, player, recipient) {
		let playerNotification = this.#game.notificationGenerator.generateGiveNotification(item.singleContainingPhrase, recipient.displayName);
		let recipientNotification = this.#game.notificationGenerator.generateReceiveNotification(item.singleContainingPhrase, player.displayName);
		let narration = `${player.displayName} gives ${item.singleContainingPhrase} to ${recipient.displayName}.`;
		if (item.weight > recipient.maxCarryWeight) {
			playerNotification = this.#game.notificationGenerator.generateGiveTooHeavyNotification(item.singleContainingPhrase, recipient);
			recipientNotification = this.#game.notificationGenerator.generateReceiveTooHeavyNotification(item.singleContainingPhrase, player.displayName);
			narration = `${player.displayName} tries to give ${item.singleContainingPhrase} to ${recipient.displayName}, but it is too heavy for ${recipient.pronouns.obj} to lift.`;
		}
		else if (recipient.carryWeight + item.weight > recipient.maxCarryWeight) {
			playerNotification = this.#game.notificationGenerator.generateGiveTooMuchWeightNotification(item.singleContainingPhrase, recipient);
			recipientNotification = this.#game.notificationGenerator.generateReceiveTooMuchWeightNotification(item.singleContainingPhrase, player.displayName);
			narration = `${player.displayName} tries to give ${item.singleContainingPhrase} to ${recipient.displayName}, but ${recipient.pronouns.sbj} ${recipient.pronouns.plural ? `are` : `is`} carrying too much weight.`;
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
		player.notify(this.#game.notificationGenerator.generateStashNotification(item.singleContainingPhrase, preposition, slotPhrase, container.name));
		if (!item.prefab.discreet)
			this.#sendNarration(player, `${player.displayName} stashes ${item.singleContainingPhrase} ${preposition} ${slotPhrase}${player.pronouns.dpos} ${container.name}.`);
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
		player.notify(this.#game.notificationGenerator.generateUnstashNotification(item.singleContainingPhrase, slotPhrase, container.name));
		if (!item.prefab.discreet)
			this.#sendNarration(player, `${player.displayName} takes ${item.singleContainingPhrase} out of ${slotPhrase}${player.pronouns.dpos} ${container.name}.`);
	}

	/**
	 * Narrates a die action.
	 * @param {Player} player - The player performing the die action. 
	 * @param {string} [customNarration] - The custom text of the narration. Optional.
	 */
	narrateDie(player, customNarration) {
		player.notify(this.#game.notificationGenerator.generateDieNotification());
		if (!player.hasBehaviorAttribute("hidden")) {
			if (customNarration) this.#sendNarration(player, customNarration);
			else this.#sendNarration(player, `${player.displayName} dies.`);
		}
	}
}