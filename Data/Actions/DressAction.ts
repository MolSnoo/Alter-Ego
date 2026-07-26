// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { generateListString, getSortedItemsString, round } from "../../Modules/helpers.ts";
import Action from "../Action.ts";
import type EquipmentSlot from "../EquipmentSlot.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";
import type InventoryItem from "../InventoryItem.ts";
import InventorySlot from "../InventorySlot.ts";
import Puzzle from "../Puzzle.ts";
import RoomItem from "../RoomItem.ts";
import AttemptAction from "./AttemptAction.ts";

/**
 * Represents a dress action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#dress-action
 */
export default class DressAction extends Action {
    /**
     * Performs a dress action.
     *
     * @param items - All of the equippable items in the given container.
     * @param handEquipmentSlot - The hand equipment slot to use to take items.
     * @param container - The container to dress from.
     * @param inventorySlot - The inventory slot to dress from, if applicable.
     */
    performDress(items: RoomItem[], handEquipmentSlot: EquipmentSlot, container: RoomItemContainer, inventorySlot: InventorySlot<RoomItem>): void {
        if (this.performed) return;
        super.perform();
        const equippedItems: InventoryItem[] = [];
        for (const item of items) {
            // Player shouldn't be able to take items that they're not strong enough to carry.
            if (!this.forced && round(this.player.carryWeight + item.weight) > this.player.maxCarryWeight) continue;
            if (!inventorySlot && container instanceof RoomItem)
                inventorySlot = container.inventory.get(item.slot);
            for (const slotId of item.prefab.equipmentSlots) {
                if (this.player.inventory.has(slotId) && this.player.inventory.get(slotId).equippedItem === null) {
                    this.player.take(item, handEquipmentSlot, container, inventorySlot);
                    this.player.equip(handEquipmentSlot.equippedItem, this.player.inventory.get(slotId), handEquipmentSlot);
                    equippedItems.push(this.player.inventory.get(slotId).equippedItem);
                    // Container is a take puzzle.
                    if (container instanceof Puzzle && container.type === "take") {
                        const attemptAction = new AttemptAction(this.getGame(), undefined, this.player, this.location, this.forced);
                        attemptAction.performAttempt(container, item, item.getIdentifier(), "take", "");
                    }
                    break;
                }
            }
        }
        if (equippedItems.length === 0) {
            if (this.message) this.getGame().communicationHandler.reply(this.message, `${container.name} has no equippable items.`);
            return;
        }
        const interactables = this.#getInteractables(container);
        this.getGame().narrationHandler.narrateDress(this, equippedItems, container, this.player, interactables);
        this.getGame().logHandler.logDress(equippedItems, this.player, container, inventorySlot, this.forced);
        // Execute equipped commands.
        for (const equippedItem of equippedItems)
            equippedItem.executeEquippedCommands();
        // Container is a weight puzzle.
        if (container instanceof Puzzle && container.type === "weight") {
            const weight = container.getContainedItemsWeight();
            const attemptAction = new AttemptAction(this.getGame(), undefined, this.player, this.location, this.forced);
            attemptAction.performAttempt(container, undefined, String(weight), "take", "");
        }
        // Container is a container puzzle.
        else if (container instanceof Puzzle && container.type === "container") {
            const containerItems = container.getContainedItems().filter(item => !isNaN(item.quantity));
            const containerItemsString = getSortedItemsString(containerItems);
            const attemptAction = new AttemptAction(this.getGame(), undefined, this.player, this.location, this.forced);
            attemptAction.performAttempt(container, undefined, containerItemsString, "take", "");
        }
        const slotPhrase = inventorySlot ? `${inventorySlot.id} of ` : ``;
        this.successMessage = `Successfully dressed ${this.player.name} with ${generateListString(items.map(item => item.getIdentifier()))} from ${slotPhrase}${container.getEntityID()}.`;
    }

    #getInteractables(container: RoomItemContainer): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        const inspectables: Inspectable[] = [];
        if (container instanceof Puzzle && container.parentFixture) inspectables.push(container.parentFixture);
        else if (!(container instanceof Puzzle)) inspectables.push(container);
        interactables = interactables.concat(interactableManager.createInspectActionInteractable(inspectables, this.player, this.user));
        interactables = interactables.concat(interactableManager.getInventoryInteractables(this.player, this.user));
        return interactables;
    }
}
