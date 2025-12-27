import Action from "../Action.js";
import Die from "../Die.js";
import EquipmentSlot from "../EquipmentSlot.js";
import InventoryItem from "../InventoryItem.js";
import InventorySlot from "../InventorySlot.js";
import Player from "../Player.js";

/**
 * @class StealAction
 * @classdesc Represents a steal action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/steal-action.html
 */
export default class StealAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Steal;

	/**
	 * Performs a steal action.
	 * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the inventory item in.
	 * @param {Player} victim - The player to steal from.
	 * @param {InventoryItem} container - An inventory item belonging to the victim that the player will attempt to steal from.
	 * @param {InventorySlot<InventoryItem>} inventorySlot - The {@link InventorySlot|inventory slot} that the player will attempt to steal from.
	 */
	performSteal(handEquipmentSlot, victim, container, inventorySlot) {
		if (this.performed) return;
		super.perform();
		const slotPhrase = container.inventoryCollection.size !== 1 ? `the ${inventorySlot.id} of ` : ``;
		// If there are no items in that slot, tell the player.
		if (inventorySlot.items.length === 0)
			return this.player.notify(this.getGame().notificationGenerator.generateStoleFromEmptyInventorySlotNotification(slotPhrase, container.name, victim.displayName));
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
		const failMax = Math.floor((this.getGame().settings.diceMax - this.getGame().settings.diceMin) / 3) + this.getGame().settings.diceMin;
		const partialMax = Math.floor(2 * (this.getGame().settings.diceMax - this.getGame().settings.diceMin) / 3) + this.getGame().settings.diceMin;
		let dieRoll = new Die(this.getGame(), "dex", this.player, victim);
		if (this.player.hasBehaviorAttribute("thief")) dieRoll.result = this.getGame().settings.diceMax;
		if (!item.prefab.discreet && dieRoll.result > partialMax) dieRoll.result = partialMax;

		if (dieRoll.result > failMax && item instanceof InventoryItem) {
			const victimAware = dieRoll.result <= partialMax && !victim.hasBehaviorAttribute("unconscious");
			this.getGame().narrationHandler.narrateSteal(item, this.player, victim, container, inventorySlot, victimAware);
			this.getGame().logHandler.logSteal(item, this.player, victim, container, inventorySlot, true, this.forced);
			this.player.steal(item, handEquipmentSlot, victim, container, inventorySlot);
		}
		else {
			this.player.notify(this.getGame().notificationGenerator.generateFailedStealNotification(item.singleContainingPhrase, slotPhrase, container.name, victim));
			victim.notify(this.getGame().notificationGenerator.generateFailedStolenFromNotification(this.player.displayName, slotPhrase, item.singleContainingPhrase, container.name));
			this.getGame().logHandler.logSteal(item, this.player, victim, container, inventorySlot, false, this.forced);
		}
	}
}