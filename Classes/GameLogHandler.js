import EquipmentSlot from "../Data/EquipmentSlot.js";
import Exit from "../Data/Exit.js";
import Fixture from "../Data/Fixture.js";
import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import InventoryItem from "../Data/InventoryItem.js";
import InventorySlot from "../Data/InventorySlot.js";
import ItemInstance from "../Data/ItemInstance.js";
import Player from "../Data/Player.js";
import Puzzle from "../Data/Puzzle.js";
import Room from "../Data/Room.js";
import RoomItem from "../Data/RoomItem.js";
/** @typedef {import("../Data/Status.js").default} Status */
import { addLogMessage } from "../Modules/messageHandler.js";
import { generateListString } from "../Modules/helpers.js";

/** @typedef {import("../Data/HidingSpot.js").default} HidingSpot */

/**
 * @class GameLogHandler
 * @classdesc A set of functions to send messages to the game's log channel.
 */
export default class GameLogHandler {
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

	#getTime() {
		return new Date().toLocaleTimeString();
	}

	/** @param {boolean} forced */
	#getForcedString(forced) {
		return forced ? `forcibly ` : ``;
	}

	/**
	 * Sends the log message.
	 * @param {string} logText - The text of the log message. 
	 */
	#sendLogMessage(logText) {
		addLogMessage(this.game, logText);
	}

	/**
	 * Logs a gesture action.
	 * @param {Gesture} gesture - The gesture that was performed.
	 * @param {Exit|Fixture|RoomItem|Player|InventoryItem|null} target - The target of the gesture action.
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logGesture(gesture, target, player, forced) {
		let targetString = "";
		if (target instanceof ItemInstance) targetString = `to ${target.identifier ? target.identifier : target.prefab.id} `;
		else if (target instanceof Exit || target instanceof Fixture || target instanceof Player) targetString = `to ${target.name} `;
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}did gesture ${gesture.id} ${targetString}in ${player.location.channel}`)
	}

	/**
	 * Logs an inspect action.
	 * @param {Room|Fixture|RoomItem|InventoryItem|Player} target - The target of the inspect action.
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logInspect(target, player, forced) {
		let targetString = "";
		if (target instanceof Room) targetString = `the room`;
		else if (target instanceof Fixture || target instanceof Player) targetString = `${target.name}`;
		else if (target instanceof RoomItem) {
			const preposition = target.getContainerPreposition();
			const containerPhrase = target.getContainerPhrase();
			targetString = `${target.getIdentifier()} ${preposition} ${containerPhrase}`;
		}
		else if (target instanceof InventoryItem) {
			const ownerString = target.player.name === player.name ? player.originalPronouns.dpos : `${target.player.name}'s`;
			targetString = `${target.getIdentifier()} from ${ownerString} inventory`;
		}
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}inspected ${targetString} in ${player.location.channel}`);
	}

	/**
	 * Logs a knock action.
	 * @param {Exit} exit - The exit that was knocked on.
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logKnock(exit, player, forced) {
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}knocked on ${exit.name} in ${player.location.channel}`);
	}

	/**
	 * Logs a hide action.
	 * @param {HidingSpot} hidingSpot - The hiding spot the player hid in. 
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} successful - Whether or not the player was successful in hiding.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logHide(hidingSpot, player, successful, forced) {
		const actionVerb = successful ? `hid` : `attempted and failed to hide`;
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}${actionVerb} in ${hidingSpot.name} in ${player.location.channel}`);
	}

	/**
	 * Logs an unhide action.
	 * @param {HidingSpot} hidingSpot - The hiding spot the player came out of.
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logUnhide(hidingSpot, player, forced) {
		const hidingSpotName = hidingSpot ? hidingSpot.name : "hiding";
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}came out of ${hidingSpotName} in ${player.location.channel}`);
	}

	/**
	 * Logs an inflict action.
	 * @param {Status} status - The status that was inflicted.
	 * @param {Player} player - The player who performed the action.
	 */
	logInflict(status, player) {
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} became ${status.id} in ${player.location.channel}`);
	}

	/**
	 * Logs a use action.
	 * @param {InventoryItem} item - The item that was used.
	 * @param {Player} player - The player who performed the action.
	 * @param {Player} target - The player the item was used on.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logUse(item, player, target, forced) {
		const forcedString = this.#getForcedString(forced);
		const itemName = item.getIdentifier();
		const targetString = player.name === target.name ? `on ${target.name} ` : ``;
		const logText = `${this.#getTime()} - ${player.name} ${forcedString}used ${itemName} from ${player.originalPronouns.dpos} inventory ${targetString}in ${player.location.channel}`;
		this.#sendLogMessage(logText);
	}

	/**
	 * Logs a take action.
	 * @param {RoomItem} item - The item that was taken.
	 * @param {Player} player - The player who performed the action.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the item was taken from.
	 * @param {InventorySlot} inventorySlot - The inventory slot the item was taken from.
	 * @param {boolean} successful - Whether or not the player was successful in taking the item.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logTake(item, player, container, inventorySlot, successful, forced) {
		const containerPhrase = container instanceof RoomItem ? `${inventorySlot.id} of ${container.identifier}` : container.name;
		const actionVerb = successful ? `took` : `attempted and failed to take`;
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}${actionVerb} ${item.getIdentifier()} from ${containerPhrase} in ${player.location.channel}`);
	}

	/**
	 * Logs a steal action.
	 * @param {InventoryItem} item - The item that was stolen.
	 * @param {Player} player - The player who performed the action.
	 * @param {Player} victim - The player who was stolen from.
	 * @param {InventoryItem} container - The container the item was stolen from.
	 * @param {InventorySlot} inventorySlot - The inventory slot the item was stolen from.
	 * @param {boolean} successful - Whether or not the player was successful in stealing.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logSteal(item, player, victim, container, inventorySlot, successful, forced) {
		const forcedString = this.#getForcedString(forced);
		const actionVerb = successful ? `stole` : `attempted and failed to steal`;
		const logText = `${this.#getTime()} - ${player.name} ${forcedString}${actionVerb} ${item.getIdentifier()} from ${inventorySlot.id} of ${victim.name}'s ${container.getIdentifier()} in ${player.location.channel}`;
		this.#sendLogMessage(logText);
	}

	/**
	 * Logs a drop action.
	 * @param {InventoryItem} item - The item that was dropped.
	 * @param {Player} player - The player who performed the action.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the item was dropped into.
	 * @param {InventorySlot} inventorySlot - The inventory slot the item was dropped into.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logDrop(item, player, container, inventorySlot, forced) {
		const preposition = container.getPreposition() ? container.getPreposition() : "in";
		const containerPhrase = container instanceof RoomItem ? `${inventorySlot.id} of ${container.identifier}` : container.name;
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}dropped ${item.getIdentifier()} ${preposition} ${containerPhrase} in ${player.location.channel}`);
	}

	/**
	 * Logs a give action.
	 * @param {InventoryItem} item - The item that was given.
	 * @param {Player} player - The player who performed the action.
	 * @param {Player} recipient - The player who received the item.
	 * @param {boolean} successful - Whether or not the player was successful in giving the item.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logGive(item, player, recipient, successful, forced) {
		const actionVerb = successful ? `gave` : `attempted and failed to give`;
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}${actionVerb} ${item.getIdentifier()} to ${recipient.name} in ${player.location.channel}`);
	}

	/**
	 * Logs a stash action.
	 * @param {InventoryItem} item - The item that was stashed.
	 * @param {Player} player - The player who performed the action.
	 * @param {InventoryItem} container - The container the item was stashed in.
	 * @param {InventorySlot} inventorySlot - The inventory slot the item was stashed in.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logStash(item, player, container, inventorySlot, forced) {
		const forcedString = this.#getForcedString(forced);
		const itemIdentifier = item.getIdentifier();
		const preposition = container.getPreposition() ? container.getPreposition() : "in";
		const containerIdentifier = container.getIdentifier();
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${forcedString}stashed ${itemIdentifier} ${preposition} ${inventorySlot.id} of ${player.originalPronouns.dpos} ${containerIdentifier} in ${player.location.channel}`);
	}

	/**
	 * Logs an unstash action.
	 * @param {InventoryItem} item - The item that was unstashed.
	 * @param {Player} player - The player who performed the action.
	 * @param {InventoryItem} container - The container the item was unstashed from.
	 * @param {InventorySlot} inventorySlot - The inventory slot the item was unstashed from.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logUnstash(item, player, container, inventorySlot, forced) {
		const forcedString = this.#getForcedString(forced);
		const itemIdentifier = item.getIdentifier();
		const containerIdentifier = container.getIdentifier();
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${forcedString}unstashed ${itemIdentifier} from ${inventorySlot.id} of ${player.originalPronouns.dpos} ${containerIdentifier} in ${player.location.channel}`);
	}

	/**
	 * Logs an equip action.
	 * @param {InventoryItem} item - The item that was equipped.
	 * @param {Player} player - The player who performed the action.
	 * @param {EquipmentSlot} equipmentSlot - The equipment slot the item was equipped to.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logEquip(item, player, equipmentSlot, forced) {
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}equipped ${item.getIdentifier()} to ${equipmentSlot.id} in ${player.location.channel}`);
	}

	/**
	 * Logs an unequip action.
	 * @param {InventoryItem} item - The item that was unequipped.
	 * @param {Player} player - The player who performed the action.
	 * @param {EquipmentSlot} equipmentSlot - The equipment slot the item was unequipped from.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logUnequip(item, player, equipmentSlot, forced) {
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}unequipped ${item.getIdentifier()} from ${equipmentSlot.id} in ${player.location.channel}`);
	}

	/**
	 * Logs a dress action.
	 * @param {InventoryItem[]} items - The items the player put on.
	 * @param {Player} player - The player who performed the action.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the player dressed from.
	 * @param {InventorySlot<RoomItem>} inventorySlot - The inventory slot the player dressed from, if applicable.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logDress(items, player, container, inventorySlot, forced) {
		const containerPhrase = container instanceof RoomItem ? `${inventorySlot.id} of ${container.identifier}` : container.name;
		const itemList = generateListString(items.map(item => item.getIdentifier()));
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}dressed from ${containerPhrase}, putting on ${itemList} in ${player.location.channel}`);
	}

	/**
	 * Logs an undress action.
	 * @param {InventoryItem[]} items - The items the player took off.
	 * @param {Player} player - The player who performed the action.
	 * @param {Fixture|Puzzle|RoomItem} container - The container the player undressed into.
	 * @param {InventorySlot<RoomItem>} inventorySlot - The inventory slot the player undressed into, if applicable.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logUndress(items, player, container, inventorySlot, forced) {
		const preposition = container.getPreposition();
		const containerPhrase = container instanceof RoomItem ? `${inventorySlot.id} of ${container.identifier}` : container.name;
		const itemList = generateListString(items.map(item => item.getIdentifier()));
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}undressed, putting ${itemList} ${preposition} ${containerPhrase} in ${player.location.channel}`);
	}

	/**
	 * Logs a craft action.
	 * @param {string} item1Id - The identifier of the first ingredient.
	 * @param {string} item2Id - The identifier of the second ingredient.
	 * @param {CraftingResult} craftingResult - The result of the craft action.
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logCraft(item1Id, item2Id, craftingResult, player, forced) {
		let productPhrase = "";
		let product1Phrase = "";
		let product2Phrase = "";
		if (craftingResult.product1) product1Phrase = craftingResult.product1.getIdentifier();
		if (craftingResult.product2) product2Phrase = craftingResult.product2.getIdentifier();
		if (product1Phrase !== "" && product2Phrase !== "") productPhrase = `${product1Phrase} and ${product2Phrase}`;
		else if (product1Phrase !== "") productPhrase = product1Phrase;
		else if (product2Phrase !== "") productPhrase = product2Phrase;
		else productPhrase = "nothing";
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}crafted ${productPhrase} from ${item1Id} and ${item2Id} in ${player.location.channel}`);
	}

	/**
	 * Logs an uncraft action.
	 * @param {string} itemId - The identifier of the product.
	 * @param {UncraftingResult} uncraftingResult - The result of the uncraft action.
	 * @param {Player} player - The player who performed the action.
	 * @param {boolean} forced - Whether or not the player was forced to perform the action.
	 */
	logUncraft(itemId, uncraftingResult, player, forced) {
		let ingredientPhrase = "";
		let ingredient1Phrase = "";
		let ingredient2Phrase = "";
		if (uncraftingResult.ingredient1) ingredient1Phrase = uncraftingResult.ingredient1.getIdentifier();
		if (uncraftingResult.ingredient2) ingredient2Phrase = uncraftingResult.ingredient2.getIdentifier();
		if (ingredient1Phrase !== "" && ingredient2Phrase !== "") ingredientPhrase = `${ingredient1Phrase} and ${ingredient2Phrase}`;
		else if (ingredient1Phrase !== "") ingredientPhrase = ingredient1Phrase;
		else if (ingredient2Phrase !== "") ingredientPhrase = ingredient2Phrase;
		else ingredientPhrase = "nothing";
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} ${this.#getForcedString(forced)}uncrafted ${itemId} into ${ingredientPhrase} in ${player.location.channel}`);
	}

	/**
	 * Logs a die action.
	 * @param {Player} player - The player who died. 
	 */
	logDie(player) {
		this.#sendLogMessage(`${this.#getTime()} - ${player.name} died in ${player.location.channel}`);
	}
}