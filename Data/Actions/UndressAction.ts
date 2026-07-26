// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { generateListString, getSortedItemsString } from "../../Modules/helpers.ts";
import Action from "../Action.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";
import type InventoryItem from "../InventoryItem.ts";
import InventorySlot from "../InventorySlot.ts";
import Puzzle from "../Puzzle.ts";
import type RoomItem from "../RoomItem.ts";
import AttemptAction from "./AttemptAction.ts";
import DropAction from "./DropAction.ts";

/**
 * Represents an undress action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#undress-action
 */
export default class UndressAction extends Action {
    /**
     * Performs an undress action.
     *
     * @param container - The container to put the items in.
     * @param inventorySlot - The inventory slot to put the items in, if applicable.
     */
    performUndress(container: RoomItemContainer, inventorySlot: InventorySlot<RoomItem>): void {
        if (this.performed) return;
        super.perform();
        // First, drop the items in the player's hands.
        const hands = this.getGame().entityFinder.getPlayerHands(this.player);
        for (const hand of hands) {
            if (hand.equippedItem !== null) {
                const dropAction = new DropAction(this.getGame(), undefined, this.player, this.location, this.forced);
                dropAction.performDrop(hand.equippedItem, hand, container, inventorySlot, true);
            }
        }
        const dominantHand = hands[0];
        const droppedItems: InventoryItem[] = [];
        for (const equipmentSlot of this.player.inventory.values()) {
            if (equipmentSlot.equippedItem !== null && equipmentSlot.equippedItem.prefab.equippable) {
                const droppedItem = equipmentSlot.equippedItem;
                droppedItems.push(droppedItem);
                this.player.unequip(equipmentSlot.equippedItem, equipmentSlot, dominantHand);
                this.player.drop(dominantHand.equippedItem, dominantHand, container, inventorySlot);
                // Container is a drop puzzle.
                if (container instanceof Puzzle && container.type === "drop") {
                    const attemptAction = new AttemptAction(this.getGame(), undefined, this.player, this.location, this.forced);
                    attemptAction.performAttempt(container, droppedItem, droppedItem.getIdentifier(), "drop", "");
                }
            }
        }
        const interactables = this.#getInteractables(container);
        this.getGame().narrationHandler.narrateUndress(this, droppedItems, container, this.player, interactables);
        this.getGame().logHandler.logUndress(droppedItems, this.player, container, inventorySlot, this.forced);
        // Execute unequipped commands.
        for (const droppedItem of droppedItems)
            droppedItem.executeUnequippedCommands();
        // Container is a weight puzzle.
        if (container instanceof Puzzle && container.type === "weight") {
            const weight = container.getContainedItemsWeight();
            const attemptAction = new AttemptAction(this.getGame(), undefined, this.player, this.location, this.forced);
            attemptAction.performAttempt(container, undefined, String(weight), "drop", "");
        }
        // Container is a container puzzle.
        else if (container instanceof Puzzle && container.type === "container") {
            const containerItems = container.getContainedItems().filter(item => !isNaN(item.quantity));
            const containerItemsString = getSortedItemsString(containerItems);
            const attemptAction = new AttemptAction(this.getGame(), undefined, this.player, this.location, this.forced);
            attemptAction.performAttempt(container, undefined, containerItemsString, "drop", "");
        }
        const slotPhrase = inventorySlot ? `${inventorySlot.id} of ` : ``;
        this.successMessage = `Successfully undressed ${this.player.name}, putting ${generateListString(droppedItems.map(item => item.getIdentifier()))} in ${slotPhrase}${container.getEntityID()}.`;
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
