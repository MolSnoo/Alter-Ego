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
 * Represents an unstash action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#unstash-action
 */
export default class UnstashAction extends Action {
    /**
     * Performs an unstash action.
     *
     * @param item - The inventory item to unstash.
     * @param handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param container - The inventory item's current container.
     * @param inventorySlot - The {@link InventorySlot|inventory slot} the inventory item is currently in.
     */
    performUnstash(item: InventoryItem, handEquipmentSlot: EquipmentSlot, container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>): void {
        if (this.performed) return;
        super.perform();
        const interactables = this.#getInteractables();
        this.getGame().narrationHandler.narrateUnstash(this, item, container, inventorySlot, this.player, interactables);
        this.getGame().logHandler.logUnstash(item, this.player, container, inventorySlot, this.forced);
        this.player.unstash(item, handEquipmentSlot, container, inventorySlot);
        this.successMessage = `Successfully unstashed ${item.getIdentifier()} from ${inventorySlot.id} of ${container.identifier} for ${this.player.name}.`;
    }

    #getInteractables(): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        interactables = interactables.concat(interactableManager.getInventoryInteractables(this.player, this.user));
        return interactables;
    }

    /**
     * Finds the required inventory item to call performUnstash.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [InventoryItem] {
        const item = this.getGame().entityFinder.getInventoryItem(args[0], this.player.name, args[1], args[2], args[3]);
        return [item];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performUnstash.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [InventoryItem]): [InventoryItem, EquipmentSlot, InventoryItem, InventorySlot<InventoryItem>] | [] {
        if (args.length !== 1) return [];
        if (!args[0] || !(args[0] instanceof InventoryItem) || args[0].prefab === null) return [];
        const item = args[0];
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("unstash");
        if (disabledStatusEffects.length > 0) return [];
        if (item.quantity === 0) return [];
        const freeHand = this.getGame().entityFinder.getPlayerFreeHand(this.player);
        if (!freeHand) return [];
        const container = item.container;
        if (!container || container === null || container.prefab === null) return [];
        const inventorySlot = container.inventory.get(item.slot);
        if (!inventorySlot || !inventorySlot.items.includes(item)) return [];
        if (item.player.name !== this.player.name) return [];
        return [item, freeHand, container, inventorySlot];
    }
}
