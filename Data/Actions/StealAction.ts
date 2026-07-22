// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MessageDisplayType } from "../../Modules/enums.ts";
import Action from "../Action.ts";
import Die from "../Die.ts";
import type EquipmentSlot from "../EquipmentSlot.ts";
import InventoryItem from "../InventoryItem.ts";
import InventorySlot from "../InventorySlot.ts";
import type Player from "../Player.ts";

/**
 * Represents a steal action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#steal-action
 */
export default class StealAction extends Action {
    /**
     * Performs a steal action.
     *
     * @param handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param victim - The player to steal from.
     * @param container - An inventory item belonging to the victim that the player will attempt to steal from.
     * @param inventorySlot - The {@link InventorySlot|inventory slot} that the player will attempt to steal from.
     */
    performSteal(handEquipmentSlot: EquipmentSlot, victim: Player, container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>): void {
        if (this.performed) return;
        super.perform();
        const slotPhrase = container.inventory.size !== 1 ? `the ${inventorySlot.id} of ` : ``;
        // If there are no items in that slot, tell the player.
        if (inventorySlot.items.length === 0) {
            const notification = this.getGame().notificationGenerator.generateStoleFromEmptyInventorySlotNotification(slotPhrase, container.name, victim.displayName);
            return this.getGame().narrationHandler.sendNotification(this.player, this, notification, MessageDisplayType.STANDARD, true);
        }
        // There might be multiple of the same item, so we need to make an array where each item's index is inserted as many times as its quantity.
        let actualItems: number[] = [];
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
        let dieRoll = this.getGame().rollDie("dex", this.player, victim);
        if (this.player.hasBehaviorAttribute("thief")) dieRoll.result = this.getGame().settings.diceMax;
        if (!item.prefab.discreet && dieRoll.result > partialMax) dieRoll.result = partialMax;

        if (dieRoll.result > failMax && item instanceof InventoryItem) {
            const victimAware = dieRoll.result <= partialMax && !victim.isConscious();
            this.getGame().narrationHandler.narrateSteal(this, item, this.player, victim, container, inventorySlot, victimAware);
            this.getGame().logHandler.logSteal(item, this.player, victim, container, inventorySlot, true, this.forced);
            this.player.steal(item, handEquipmentSlot, victim, container, inventorySlot);
        }
        else {
            const failedStealNotification = this.getGame().notificationGenerator.generateFailedStealNotification(item.singleContainingPhrase, slotPhrase, container.name, victim);
            this.getGame().narrationHandler.sendNotification(this.player, this, failedStealNotification, MessageDisplayType.ALERT, true);
            const failedStolenFromNotification = this.getGame().notificationGenerator.generateFailedStolenFromNotification(this.player.displayName, slotPhrase, item.singleContainingPhrase, container.name);
            this.getGame().narrationHandler.sendNotification(victim, this, failedStolenFromNotification, MessageDisplayType.ALERT, true);
            this.getGame().logHandler.logSteal(item, this.player, victim, container, inventorySlot, false, this.forced);
        }
    }
}
