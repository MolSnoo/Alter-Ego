// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import type EquipmentSlot from "../EquipmentSlot.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";
import InventoryItem from "../InventoryItem.ts";
import InventorySlot from "../InventorySlot.ts";

/**
 * Represents a stash action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#stash-action
 */
export default class StashAction extends Action {
    /**
     * Performs a stash action.
     *
     * @param item - The inventory item to stash.
     * @param handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param container - The container to stash the inventory item in.
     * @param inventorySlot - The {@link InventorySlot|inventory slot} to stash the inventory item in.
     */
    performStash(item: InventoryItem, handEquipmentSlot: EquipmentSlot, container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>): void {
        if (this.performed) return;
        super.perform();
        const interactables = this.#getInteractables();
        this.getGame().narrationHandler.narrateStash(this, item, container, inventorySlot, this.player, interactables);
        this.getGame().logHandler.logStash(item, this.player, container, inventorySlot, this.forced);
        this.player.stash(item, handEquipmentSlot, container, inventorySlot);
        this.successMessage = `Successfully stashed ${item.getIdentifier()} ${container.getPreposition()} ${inventorySlot.id} of ${container.identifier} for ${this.player.name}.`;
    }

    #getInteractables(): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        interactables = interactables.concat(interactableManager.getInventoryInteractables(this.player, this.user));
        return interactables;
    }

    /**
     * Finds the required inventory item to call performStash.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [InventoryItem, EquipmentSlot, InventoryItem, InventorySlot<InventoryItem>] {
        const hand = this.getGame().entityFinder.getPlayerHandHoldingItem(this.player, args[0], args[7]);
        const container = this.getGame().entityFinder.getInventoryItem(args[2], this.player.name, args[4], args[5], args[6]);
        let inventorySlot: InventorySlot<InventoryItem>;
        if (container instanceof InventoryItem) inventorySlot = container.inventory.get(args[3]);
        return [hand?.equippedItem, hand, container, inventorySlot];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performStash.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [InventoryItem, EquipmentSlot, InventoryItem, InventorySlot<InventoryItem>]): [InventoryItem, EquipmentSlot, InventoryItem, InventorySlot<InventoryItem>] | [] {
        if (args.length !== 4) return [];
        if (!args[0] || !(args[0] instanceof InventoryItem) || args[0].prefab === null) return [];
        const item = args[0];
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("stash");
        if (disabledStatusEffects.length > 0) return [];
        if (!args[1] || args[1].equippedItem === null) return [];
        const hand = args[1];
        if (!args[2] || !(args[2] instanceof InventoryItem) || args[2].prefab === null || args[2].quantity === 0 || args[2].inventory.size === 0) return [];
        if (args[2].player.name !== this.player.name) return [];
        const container = args[2];
        // Ensure an inventory item can't be stashed inside an inventory item that it contains.
        let nextContainer = container.container;
        while (nextContainer !== null) {
            if (nextContainer.row === item.row) return [];
            nextContainer = nextContainer.container;
        }
        const inventorySlot = args[3];
        if (inventorySlot && inventorySlot.willBeOverFilledBy(item)) return [];
        return [item, hand, container, inventorySlot];
    }
}
