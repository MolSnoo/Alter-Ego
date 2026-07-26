// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";
import InventoryItem from "../InventoryItem.ts";
import Player from "../Player.ts";

/**
 * Represents a use action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#use-action
 */
export default class UseAction extends Action {
    /**
     * Performs a use action.
     * @param item - The inventory item to use.
     * @param target - The target the player should use the inventory item on. Defaults to themself.
     * @param customNarration - The custom text of the narration. Optional.
     */
    async performUse(item: InventoryItem, target: Player = this.player, customNarration?: string): Promise<void> {
        if (this.performed) return;
        super.perform();
        const interactables = this.#getInteractables();
        this.getGame().narrationHandler.narrateUse(this, item, this.player, target, customNarration, interactables);
        this.getGame().logHandler.logUse(item, this.player, target, this.forced);
        const itemIdentifier = item.getIdentifier();
        await this.player.use(item, target);
        const targetString = target.name !== this.player.name ? `on ${target.name} ` : ``;
        this.successMessage = `Successfully used ${itemIdentifier} ${targetString}for ${this.player.name}.`;
    }

    #getInteractables(): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        interactables = interactables.concat(interactableManager.getInventoryInteractables(this.player, this.user));
        return interactables;
    }

    /**
     * Finds the required inventory item and target to call performUse.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [InventoryItem, Player] {
        const hand = this.getGame().entityFinder.getPlayerHandHoldingItem(this.player, args[0], args[2]);
        const player = this.getGame().entityFinder.getLivingPlayer(args[1]);
        return [hand?.equippedItem, player];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performUse.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [InventoryItem, Player]): [InventoryItem, Player] | [] {
        if (args.length !== 2) return [];
        if (!args[0] || !(args[0] instanceof InventoryItem) || args[0].prefab === null) return [];
        const item = args[0];
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("use");
        if (disabledStatusEffects.length > 0) return [];
        if (!args[1] || !(args[1] instanceof Player)) return [];
        const target = args[1];
        if (item.container !== null) return [];
        if (item.player.name !== this.player.name) return [];
        if (target.location.id !== this.player.location.id) return [];
        if (item.uses === 0 || !item.prefab.usable || !item.usableOn(target)) return [];
        return [item, target];
    }
}
