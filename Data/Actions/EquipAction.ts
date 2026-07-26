// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import EquipmentSlot from "../EquipmentSlot.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";
import InventoryItem from "../InventoryItem.ts";

/**
 * Represents an equip action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#equip-action
 */
export default class EquipAction extends Action {
    /**
     * Performs an equip action.
     *
     * @param item - The inventory item to equip.
     * @param equipmentSlot - The equipment slot to equip the inventory item to.
     * @param handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param notify - Whether or not to notify the player that they equipped the inventory item. Defaults to true.
     */
    performEquip(item: InventoryItem, equipmentSlot: EquipmentSlot, handEquipmentSlot: EquipmentSlot, notify: boolean = true): void {
        if (this.performed) return;
        super.perform();
        const interactables = this.#getInteractables();
        this.getGame().narrationHandler.narrateEquip(this, item, this.player, notify, interactables);
        this.getGame().logHandler.logEquip(item, this.player, equipmentSlot, this.forced);
        this.player.equip(item, equipmentSlot, handEquipmentSlot);
        equipmentSlot.equippedItem.executeEquippedCommands();
        this.successMessage = `Successfully equipped ${item.getIdentifier()} to ${this.player.name}'s ${equipmentSlot.id}.`;
    }

    #getInteractables(): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        interactables = interactables.concat(interactableManager.getInventoryInteractables(this.player, this.user));
        return interactables;
    }

    /**
     * Finds the required inventory item and equipment slot to call performEquip.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [InventoryItem, EquipmentSlot, EquipmentSlot] {
        const hand = this.getGame().entityFinder.getPlayerHandHoldingItem(this.player, args[0], args[3]);
        const equipmentSlot = this.player.inventory.get(args[1]);
        return [hand?.equippedItem, equipmentSlot, hand];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performEquip.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [InventoryItem, EquipmentSlot, EquipmentSlot]): [InventoryItem, EquipmentSlot, EquipmentSlot] | [] {
        if (args.length !== 3) return [];
        if (!args[0] || !(args[0] instanceof InventoryItem) || args[0].prefab === null) return [];
        const item = args[0];
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("equip");
        if (disabledStatusEffects.length > 0) return [];
        if (!args[1] || !(args[1] instanceof EquipmentSlot)) return [];
        const equipmentSlot = args[1];
        if (!args[2] || !(args[2] instanceof EquipmentSlot) || args[2].equippedItem === null) return [];
        const hand = args[2];
        if (hand.equippedItem !== item) return [];
        if (item.player.name !== this.player.name) return [];
        if (equipmentSlot.equippedItem !== null) return [];
        if (!item.prefab.equippable || !item.prefab.equipmentSlots.includes(equipmentSlot.id)) return [];
        return [item, equipmentSlot, hand];
    }
}
