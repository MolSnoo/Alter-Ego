// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import type EquipmentSlot from "../EquipmentSlot.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";
import type InventoryItem from "../InventoryItem.ts";
import type Player from "../Player.ts";
import { round } from "../../Modules/helpers.ts";

/**
 * Represents a give action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#give-action
 */
export default class GiveAction extends Action {
    /**
     * Performs a give action.
     *
     * @param item - The inventory item to give.
     * @param handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param recipient - The player to give the inventory item to.
     * @param recipientHandEquipmentSlot - The hand equipment slot of the recipient to put the item in.
     */
    performGive(item: InventoryItem, handEquipmentSlot: EquipmentSlot, recipient: Player, recipientHandEquipmentSlot: EquipmentSlot): void {
        if (this.performed) return;
        super.perform();
        const successful = this.forced || round(recipient.carryWeight + item.weight) <= recipient.maxCarryWeight;
        const interactables = successful ? this.#getInteractables(recipient) : [];
        this.getGame().narrationHandler.narrateGive(this, item, this.player, recipient, interactables);
        this.getGame().logHandler.logGive(item, this.player, recipient, successful, this.forced);
        if (successful) this.player.give(item, handEquipmentSlot, recipient, recipientHandEquipmentSlot);
        this.successMessage = `Successfully gave ${this.player.name}'s ${item.getIdentifier()} to ${recipient.name}.`;
    }

    #getInteractables(recipient: Player): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        interactables = interactables.concat(interactableManager.getInventoryInteractables(recipient));
        return interactables;
    }
}
