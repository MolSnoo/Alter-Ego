// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getSortedItemsString } from "../../Modules/helpers.ts";
import Action from "../Action.ts";
import type EquipmentSlot from "../EquipmentSlot.ts";
import Fixture from "../Fixture.ts";
import InventoryItem from "../InventoryItem.ts";
import InventorySlot from "../InventorySlot.ts";
import Puzzle from "../Puzzle.ts";
import RoomItem from "../RoomItem.ts";
import AttemptAction from "./AttemptAction.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";

/**
 * Represents a drop action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#drop-action
 */
export default class DropAction extends Action {
    /**
     * Performs a drop action.
     *
     * @param item - The inventory item to drop.
     * @param handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param container - The container to put the item in.
     * @param inventorySlot - The {@link InventorySlot|inventory slot} to put the item in.
     * @param notify - Whether or not to notify the player that they dropped the item. Defaults to true.
     */
    performDrop(item: InventoryItem, handEquipmentSlot: EquipmentSlot, container: RoomItemContainer, inventorySlot: InventorySlot<RoomItem>, notify: boolean = true): void {
        if (this.performed) return;
        super.perform();
        const interactables = this.#getInteractables(container, handEquipmentSlot);
        this.getGame().narrationHandler.narrateDrop(this, item, container, this.player, notify, interactables);
        this.getGame().logHandler.logDrop(item, this.player, container, inventorySlot, this.forced);
        this.player.drop(item, handEquipmentSlot, container, inventorySlot);
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
        // Container is a drop puzzle.
        else if (container instanceof Puzzle && container.type === "drop") {
            const attemptAction = new AttemptAction(this.getGame(), undefined, this.player, this.location, this.forced);
            attemptAction.performAttempt(container, item, item.getIdentifier(), "drop", "");
        }
        const preposition = container.getPreposition() ? container.getPreposition() : "in";
        const containerPhrase = container instanceof RoomItem ? `${inventorySlot.id} of ${container.identifier}` : container.name;
        this.successMessage = `Successfully dropped ${item.getIdentifier()} ${preposition} ${containerPhrase} for ${this.player.name}.`;
    }

    #getInteractables(container: RoomItemContainer, handEquipmentSlot: EquipmentSlot): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        interactables = interactables.concat(interactableManager.getUnstashInteractables(this.player, this.user, handEquipmentSlot));
        interactables = interactables.concat(interactableManager.getUnequipInteractables(this.player, this.user, handEquipmentSlot));
        const inspectables: Inspectable[] = [];
        if (container instanceof Puzzle && container.parentFixture) inspectables.push(container.parentFixture);
        else if (!(container instanceof Puzzle)) inspectables.push(container);
        interactables = interactables.concat(interactableManager.createInspectActionInteractable(inspectables, this.player, this.user));
        interactables = interactables.concat(interactableManager.getTakeInteractables(container, container.getContainedItems(), this.player, this.user));
        if (container instanceof Fixture)
            interactables = interactables.concat(interactableManager.getActivateOrDeactivateInteractables(container, this.player));
        interactables = interactables.concat(interactableManager.getInventoryInteractables(this.player, this.user));
        return interactables;
    }

    /**
     * Finds the required inventory item to call performDrop.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [InventoryItem, EquipmentSlot, Puzzle | Fixture | RoomItem, InventorySlot<RoomItem>] {
        const hand = this.getGame().entityFinder.getPlayerHandHoldingItem(this.player, args[0], args[7]);
        let container: Puzzle | Fixture | RoomItem;
        if (args[2] === 'Fixture') container = this.getGame().entityFinder.getFixture(args[3], args[5]);
        if (args[2] === 'Puzzle') container = this.getGame().entityFinder.getPuzzle(args[3], args[5]);
        if (args[2] === 'RoomItem') container = this.getGame().entityFinder.getRoomItem(args[3], args[5], undefined, undefined, args[6]);
        let inventorySlot: InventorySlot<RoomItem>;
        if (container instanceof RoomItem) inventorySlot = container.inventory.get(args[4]);
        return [hand?.equippedItem, hand, container, inventorySlot];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performDrop.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [InventoryItem, EquipmentSlot, Puzzle | Fixture | RoomItem, InventorySlot<RoomItem>]): [InventoryItem, EquipmentSlot, Puzzle | Fixture | RoomItem, InventorySlot<RoomItem>] {
        const errorMessageGenerator = this.getGame().errorMessageGenerator;
        if (args.length !== 4) throw new Error(errorMessageGenerator.generateInsufficientArgumentsError());
        if (!args[0] || !(args[0] instanceof InventoryItem)) throw new Error(errorMessageGenerator.generateInvalidEntityError("InventoryItem"));
        const item = args[0];
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("drop");
        if (disabledStatusEffects.length > 0)
            throw new Error(errorMessageGenerator.generateCommandDisabledError(disabledStatusEffects[0]));
        const context = this.forced ? "Moderator" : "Player";
        if (!args[1] || args[1].equippedItem === null)
            throw new Error(errorMessageGenerator.generateNoHeldItemError(this.player, item?.name ?? "", context, true, "drop"));
        const hand = args[1];
        if (!args[2])
            throw new Error(errorMessageGenerator.generateInvalidEntityError("ItemContainer"));
        if (args[2].getLocation().id !== this.player.location.id) throw new Error(errorMessageGenerator.generatePlayerLocationMismatchError());
        const container = args[2];
        let topContainer: Fixture | Puzzle;
        if (container instanceof RoomItem)
            topContainer = container.getTopContainer();
        else topContainer = container;
        if (topContainer instanceof Puzzle)
            topContainer = topContainer.parentFixture;
        if (topContainer) {
            const hiddenStatusEffects = this.player.getBehaviorAttributeStatusEffects("hidden");
            if (hiddenStatusEffects.length > 0 && this.player.hidingSpot !== topContainer.name)
                throw new Error(errorMessageGenerator.generateCommandDisabledError(hiddenStatusEffects[0]));
            if (topContainer.isProcessingItems())
                throw new Error(errorMessageGenerator.generateCannotChangeItemsInActivatedFixtureError(topContainer, "drop", context));
        }
        const inventorySlot = args[3];
        if (inventorySlot && inventorySlot.willBeOverFilledBy(item))
            throw new Error(errorMessageGenerator.generateItemWillNotFitInInventorySlotError(item, container as RoomItem, inventorySlot, context));
        // That should be all the container validation we need. This is a failsafe.
        if (!container.canCurrentlyContainItems(true, this.forced))
            throw new Error(errorMessageGenerator.generateCannotPutItemsInContainerError(container, context));
        return [item, hand, container, inventorySlot];
    }
}
