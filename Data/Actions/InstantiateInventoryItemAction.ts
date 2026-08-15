// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import EquipmentSlot from "../EquipmentSlot.ts";
import InventoryItem from "../InventoryItem.ts";
import type InventorySlot from "../InventorySlot.ts";
import ItemInstance from "../ItemInstance.ts";
import Prefab from "../Prefab.ts";
import { parseProceduralSelections, type ContainedItem, parseInstantiateContainingString } from "../../Modules/stringDataExtractor.ts";
import { instantiateInventoryItem } from "../../Modules/itemManager.ts";
import { generateListString, makeCopyable } from "../../Modules/helpers.ts";
import { getErrorMessage } from "../../Modules/errorHandler.ts";

/**
 * Represents an instantiate inventory item action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#instantiate-inventory-item-action
 */
export default class InstantiateInventoryItemAction extends Action {
    /**
     * Performs an instantiate action for an inventory item.
     *
     * @param prefab - The prefab to instantiate as an inventory item.
     * @param equipmentSlotId - The ID of the equipment slot this inventory item will belong to.
     * @param container - The container to instantiate the item in.
     * @param inventorySlotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
     * @param quantity - The quantity to instantiate.
     * @param proceduralSelections - The manually selected procedural possibilities.
     * @param uses - The number of uses to instantiate the inventory item with. Defaults to the prefab's uses.
     * @param containedItems - The items to instantiate inside the inventory item in its first inventory slot. Defaults to an empty array.
     * @param notify - Whether or not to notify the player that the item was added to their inventory. Defaults to true.
     * @returns The instantiated {@link InventoryItem| inventory items}.
     */
    performInstantiateInventoryItem(prefab: Prefab, equipmentSlotId: string, container: InventoryItem, inventorySlotId: string, quantity: number, proceduralSelections: Map<string, string>, uses?: number, containedItems: ContainedItem[] = [], notify: boolean = true): InventoryItem[] {
        if (this.performed) return;
        super.perform();
        const createdItems: InventoryItem[] = [];
        // If the prefab has inventory slots, run the instantiate function quantity times so that it generates items with different identifiers.
        if (prefab.inventory.size > 0) {
            for (let i = 0; i < quantity; i++)
                createdItems.push(this.#instantiateInventoryItem(prefab, equipmentSlotId, container, inventorySlotId, 1, proceduralSelections, uses, notify));
        }
        else createdItems.push(this.#instantiateInventoryItem(prefab, equipmentSlotId, container, inventorySlotId, quantity, proceduralSelections, uses, notify));
        // Instantiate the contained items in the first inventory slot of each created item.
        if (containedItems.length > 0 && prefab.inventory.size !== 0) {
            for (const createdItem of createdItems) {
                for (const containedItem of containedItems) {
                    this.#instantiateInventoryItem(containedItem.prefab, equipmentSlotId, createdItem, createdItem.inventory.firstKey(), containedItem.quantity, containedItem.proceduralSelections, containedItem.uses, false);
                }
            }
        }

        const entityType = `inventory item${createdItems.length !== 1 ? `s` : ``}`;
        const itemsString = generateListString(createdItems.map(item => {
            let containedItemsString = ``;
            if (item.inventory.size > 0 && item.inventory.first().items.length > 0)
                containedItemsString = ` containing ${generateListString(item.inventory.first().items.map(containedItem => `${containedItem.quantity} ${makeCopyable(containedItem.getIdentifier())}`))}`;
            return `${makeCopyable(item.getIdentifier())}${containedItemsString}`;
        }));
        const containerString = container ? `${container.getPreposition()} ${this.player.name}'s ${inventorySlotId} of ${container.getIdentifier()}` : `to ${this.player.name}'s ${equipmentSlotId}`;
        this.successMessage = `Successfully instantiated ${entityType} ${itemsString} ${containerString}.`;
        return createdItems;
    }

    /**
     * Performs an instantiate action for an inventory item.
     *
     * @param prefab - The prefab to instantiate as an inventory item.
     * @param equipmentSlotId - The ID of the equipment slot this inventory item will belong to.
     * @param container - The container to instantiate the item in.
     * @param inventorySlotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
     * @param quantity - The quantity to instantiate.
     * @param proceduralSelections - The manually selected procedural possibilities.
     * @param uses - The number of uses to instantiate the inventory item with. Defaults to the prefab's uses.
     * @param notify - Whether or not to notify the player that the item was added to their inventory. Defaults to true.
     * @returns The instantiated {@link InventoryItem| inventory item}.
     */
    #instantiateInventoryItem(prefab: Prefab, equipmentSlotId: string, container: InventoryItem, inventorySlotId: string, quantity: number, proceduralSelections: Map<string, string>, uses?: number, notify: boolean = true): InventoryItem {
        const createdItem = instantiateInventoryItem(prefab, this.player, equipmentSlotId, container, inventorySlotId, quantity, uses, proceduralSelections);
        const equipmentSlot = this.player.inventory.get(equipmentSlotId);
        const inventorySlot = createdItem.container instanceof ItemInstance ? createdItem.container.inventory.get(inventorySlotId) : undefined;
        if (!container) {
            if (notify) this.getGame().narrationHandler.narrateInstantiateEquippedInventoryItem(this, createdItem, this.player);
            this.getGame().logHandler.logInstantiateEquippedInventoryItem(createdItem, this.player, equipmentSlot);
        }
        else
            this.getGame().logHandler.logInstantiateStashedInventoryItem(createdItem, quantity, this.player, container, inventorySlot);
        return createdItem;
    }

    /**
     * Finds the required entities to call performInstantiateInventoryItem
     *
     * @param args - The base args as strings.
     * @param prefabId - The ID of the prefab to instantiate.
     * @param quantityString - The quantity to instantiate the prefab with.
     * @param usesString - The number of uses to instantiate the prefab with.
     * @param proceduralSelectionsString - The procedural selections to instantiate the prefab with.
     * @param containedItemsString - The items to instantiate inside the inventory item in its first inventory slot.
     */
    parseInteractionArgs(args: string[], prefabId: string, quantityString: string, usesString: string, proceduralSelectionsString: string, containedItemsString: string): [Prefab, EquipmentSlot, InventoryItem, InventorySlot<InventoryItem>, number, string, number, string] {
        const equipmentSlotId = args[1];
        const equipmentSlot = this.player.getEquipmentSlot(equipmentSlotId);
        const containerIdentifier = args[2];
        const container = containerIdentifier ? this.getGame().entityFinder.getInventoryItem(containerIdentifier, this.player.name, undefined, equipmentSlotId, args[4]) ?? null : undefined;
        const inventorySlotId = args[3];
        const inventorySlot = inventorySlotId ? container?.inventory?.get(inventorySlotId) ?? null : undefined;
        const prefab = this.getGame().entityFinder.getPrefab(prefabId);
        const quantity = quantityString ? parseInt(quantityString) : 1;
        const uses = usesString ? parseInt(usesString) : undefined;
        return [prefab, equipmentSlot, container, inventorySlot, quantity, proceduralSelectionsString, uses, containedItemsString];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performInstantiateInventoryItem.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [Prefab, EquipmentSlot, InventoryItem, InventorySlot<InventoryItem>, number, string, number, string]): [Prefab, string, InventoryItem, string, number, Map<string, string>, number, ContainedItem[]] {
        const errorMessageGenerator = this.getGame().errorMessageGenerator;
        if (args.length !== 8) throw new Error(errorMessageGenerator.generateInsufficientArgumentsError());
        if (!args[0] || !(args[0] instanceof Prefab))
            throw new Error(errorMessageGenerator.generateInvalidEntityError("Prefab"));
        const prefab = args[0];
        if (!args[1] || !(args[1] instanceof EquipmentSlot))
            throw new Error(errorMessageGenerator.generateInvalidEntityError("EquipmentSlot"));
        const equipmentSlot = args[1];
        if (args[2] !== undefined && (!(args[2] instanceof InventoryItem) || args[2].prefab === null || args[2].quantity === 0))
            throw new Error(errorMessageGenerator.generateInvalidEntityError("ItemContainer"));
        const container = args[2];
        if (args[3] === null) throw new Error(errorMessageGenerator.generateInvalidEntityError("InventorySlot"));
        const inventorySlot = args[3];
        if (isNaN(args[4]) || args[4] < 1)
            throw new Error(errorMessageGenerator.generateCannotInstantiateWithInvalidQuantityError(prefab, args[4]));
        if (args[4] > 1 && !prefab.pluralContainingPhrase)
            throw new Error(errorMessageGenerator.generateNoPluralContainingPhraseError(prefab));
        const quantity = args[4];
        let proceduralSelections: Map<string, string> = new Map();
        if (args[5]) {
            try {
                proceduralSelections = parseProceduralSelections(args[5]);
            } catch (error) { throw new Error(getErrorMessage(error)); }
        }
        if (args[6] !== undefined && (isNaN(args[6]) || args[6] < 1))
            throw new Error(errorMessageGenerator.generateCannotInstantiateWithInvalidUsesError(prefab, args[6]));
        const uses = args[6];

        const context = "Moderator";
        const equipItem = container === undefined;
        if (equipItem) {
            if (equipmentSlot.equippedItem !== null) throw new Error(errorMessageGenerator.generateCannotEquipToOccupiedEquipmentSlotError(equipmentSlot, context, prefab));
            if (quantity !== 1) throw new Error(errorMessageGenerator.generateCannotInstantiateEquippedItemWithInvalidQuantityError());
        }
        else {
            if (container.player.name !== this.player.name) throw new Error(`${container.getIdentifier()} belongs to a different player.`);
            if (container.inventory.size === 0)
                throw new Error(errorMessageGenerator.generateCannotPutItemsInContainerError(container, context));
            if (inventorySlot.willBeOverFilledBy(prefab, quantity))
                throw new Error(errorMessageGenerator.generateItemWillNotFitInInventorySlotError(prefab, container, inventorySlot, context));
        }
        for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
            if (!prefab.proceduralOptions.has(proceduralName))
                throw new Error(errorMessageGenerator.generateProceduralNotFoundError(prefab, proceduralName));
            if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                throw new Error(errorMessageGenerator.generatePossibilityNotFoundError(prefab, proceduralName, proceduralValue));
        }
        let containedItems: ContainedItem[] = [];
        if (args[7]) {
            try {
                containedItems = parseInstantiateContainingString(this.getGame(), args[7]);
            } catch (error) { throw new Error(getErrorMessage(error)); }
        }
        if (containedItems.length > 0) {
            if (prefab.inventory.size === 0) throw new Error(errorMessageGenerator.generateCannotPutItemsInContainerError(prefab, context));
            if (prefab.inventory.size > 1) throw new Error(errorMessageGenerator.generateContainerHasMultipleInventorySlotsError(prefab, context));
            const totalSize = containedItems.reduce((size, item) => size + (item.quantity * item.prefab.size), 0);
            if (totalSize > prefab.inventory.first().capacity)
                throw new Error(errorMessageGenerator.generateItemsWillNotFitInInventorySlotError(containedItems.map(item => item.prefab), prefab, prefab.inventory.first(), context));
            for (const containedItem of containedItems) {
                for (const [proceduralName, proceduralValue] of containedItem.proceduralSelections.entries()) {
                    if (!containedItem.prefab.proceduralOptions.has(proceduralName))
                        throw new Error(errorMessageGenerator.generateProceduralNotFoundError(containedItem.prefab, proceduralName));
                    if (!containedItem.prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                        throw new Error(errorMessageGenerator.generatePossibilityNotFoundError(containedItem.prefab, proceduralName, proceduralValue));
                }
            }
        }
        return [prefab, equipmentSlot.id, container ?? null, inventorySlot?.id ?? null, quantity, proceduralSelections, uses, containedItems];
    }
}
