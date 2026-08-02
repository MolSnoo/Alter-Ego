// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import Fixture from "../Fixture.ts";
import type InventorySlot from "../InventorySlot.ts";
import ItemInstance from "../ItemInstance.ts";
import Prefab from "../Prefab.ts";
import Puzzle from "../Puzzle.ts";
import RoomItem from "../RoomItem.ts";
import { parseProceduralSelections } from "../../Modules/stringDataExtractor.ts";
import { instantiateRoomItem } from "../../Modules/itemManager.ts";
import { generateListString, getErrorMessage, makeCopyable } from "../../Modules/helpers.ts";

/**
 * Represents an instantiate room item action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#instantiate-room-item-action
 */
export default class InstantiateRoomItemAction extends Action {
    /**
     * Performs an instantiate action for a room item.
     *
     * @param prefab - The prefab to instantiate as an item.
     * @param container - The container to instantiate the item in.
     * @param inventorySlotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
     * @param quantity - The quantity to instantiate.
     * @param proceduralSelections - The manually selected procedural possibilities.
     * @param uses - The number of uses to instantiate the room item with. Defaults to the prefab's uses.
     * @returns The instantiated {@link RoomItem| room items}.
     */
    performInstantiateRoomItem(prefab: Prefab, container: RoomItemContainer, inventorySlotId: string, quantity: number, proceduralSelections: Map<string, string>, uses: number = prefab.uses): RoomItem[] {
        if (this.performed) return;
        super.perform();
        const createdItems: RoomItem[] = [];
        // If the prefab has inventory slots, run the instantiate function quantity times so that it generates items with different identifiers.
        if (prefab.inventory.size > 0) {
            for (let i = 0; i < quantity; i++)
                createdItems.push(this.#instantiateRoomItem(prefab, container, inventorySlotId, 1, proceduralSelections, uses));
        }
        else createdItems.push(this.#instantiateRoomItem(prefab, container, inventorySlotId, quantity, proceduralSelections, uses));

        const entityType = `room item${createdItems.length !== 1 ? `s` : ``}`;
        const itemsString = generateListString(createdItems.map(item => makeCopyable(item.getIdentifier())));
        const slotPhrase = inventorySlotId ? `${inventorySlotId} of ` : ``;
        const containerString = `${container.getPreposition()} ${slotPhrase}${container.getContainerIdentifier()}`;
		this.successMessage = `Successfully instantiated ${entityType} ${itemsString} ${containerString} at ${container.location.getEntityID()}.`;
        return createdItems;
    }

    /**
     * Instantiates the room item.
     * @param prefab - The prefab to instantiate as an item.
     * @param container - The container to instantiate the item in.
     * @param inventorySlotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
     * @param quantity - The quantity to instantiate.
     * @param proceduralSelections - The manually selected procedural possibilities.
     * @param uses - The number of uses to instantiate the room item with.
     * @returns The instantiated {@link RoomItem| room item}.
     */
    #instantiateRoomItem(prefab: Prefab, container: RoomItemContainer, inventorySlotId: string, quantity: number, proceduralSelections: Map<string, string>, uses: number): RoomItem {
        const createdItem = instantiateRoomItem(prefab, this.location ?? container.location, container, inventorySlotId, quantity, uses, proceduralSelections, this.player);
        const inventorySlot = createdItem.container instanceof ItemInstance ? createdItem.container.inventory.get(inventorySlotId) : undefined;
        this.getGame().logHandler.logInstantiateRoomItem(createdItem, quantity, container, inventorySlot);
        return createdItem;
    }

    /**
     * Finds the required entities to call performInstantiateRoomItem.
     * 
     * @param args - The base args as strings. 
     * @param prefabId - The ID of the prefab to instantiate.
     * @param quantityString - The quantity to instantiate the prefab with.
     * @param usesString - The number of uses to instantiate the prefab with.
     * @param proceduralSelectionsString - The procedural selections to instantiate the prefab with.
     */
    parseInteractionArgs(args: string[], prefabId: string, quantityString: string, usesString: string, proceduralSelectionsString: string): [Prefab, RoomItemContainer, InventorySlot<RoomItem>, number, string, number] {
        const containerIdentifier = args[1];
        const locationId = args[2];
        let container: RoomItemContainer;
        let inventorySlot: InventorySlot<RoomItem>;
        if (args.length === 5 && args[0] === "F")
            container = this.getGame().entityFinder.getFixture(containerIdentifier, locationId);
        else if (args.length === 6 && args[0] === "PZ") {
            const type = args[4];
            container = this.getGame().entityFinder.getPuzzle(containerIdentifier, locationId, type);
        }
        else if (args.length === 9 && args[0] === "RI") {
            const containerType = args[4];
            const containerName = args[5];
            const inventorySlotId = args[6];
            const containerProceduralSelections = args[7];
            container = this.getGame().entityFinder.getRoomItem(containerIdentifier, locationId, containerType, containerName, containerProceduralSelections);
            inventorySlot = inventorySlotId ? container?.inventory?.get(inventorySlotId) ?? null : undefined;
        }
        const prefab = this.getGame().entityFinder.getPrefab(prefabId);
        const quantity = quantityString ? parseInt(quantityString) : 1;
        const uses = usesString ? parseInt(usesString) : undefined;
        return [prefab, container, inventorySlot, quantity, proceduralSelectionsString, uses];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performInstantiateRoomItem.
     * 
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [Prefab, RoomItemContainer, InventorySlot<RoomItem>, number, string, number]): [Prefab, RoomItemContainer, string, number, Map<string, string>, number] {
        if (args.length !== 6) throw new Error("Insufficient arguments.");
        if (!args[0] || !(args[0] instanceof Prefab)) throw new Error("Invalid prefab.");
        const prefab = args[0];
        if (!args[1] || !(args[1] instanceof Fixture) && !(args[1] instanceof RoomItem) && !(args[1] instanceof Puzzle)) throw new Error("Invalid container.");
        if (args[1] instanceof RoomItem && (args[1].prefab === null || args[1].quantity === 0)) throw new Error("Invalid container.");
        if (!args[1].isItemContainer()) throw new Error(`${args[1].getContainerIdentifier()} cannot contain items.`);
        if (!args[1].canCurrentlyContainItems(false, true)) throw new Error(`Items cannot be instantiated in ${args[1].getContainerIdentifier()} right now.`);
        const container = args[1];
        if (args[2] === null) throw new Error("Invalid inventory slot.");
        const inventorySlot = args[2];
        if (isNaN(args[3])) throw new Error("The given quantity is not a number.");
        if (args[3] < 1) throw new Error("The given quantity must be greater than or equal to 1.");
        if (args[3] > 1 && !prefab.pluralContainingPhrase) throw new Error(`The given quantity is greater than 1, but ${prefab.id} has no plural containing phrase.`);
        const quantity = args[3];
        let proceduralSelections: Map<string, string> = new Map();
        if (args[4]) {
            try {
                proceduralSelections = parseProceduralSelections(args[4]);
            } catch (error) { throw new Error(getErrorMessage(error)); }
        }
        if (args[5] !== undefined && isNaN(args[5])) throw new Error("The given uses is not a number.");
        if (args[5] !== undefined && args[5] < 1) throw new Error("The given uses must be greater than or equal to 1.");
        const uses = args[5];
        if (inventorySlot && inventorySlot.capacityIsSmallerThan(prefab, quantity)) throw new Error(`${prefab.id} will not fit in ${inventorySlot.id} of ${container.getContainerIdentifier()} because it is too large.`);
        if (inventorySlot && inventorySlot.willBeOverFilledBy(prefab, quantity)) throw new Error(`${prefab.id} will not fit in ${inventorySlot.id} of ${container.getContainerIdentifier()} because there isn't enough space left.`);
        for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
            if (!prefab.proceduralOptions.has(proceduralName))
                throw new Error(`${prefab.id} does not have procedural "${proceduralName}".`);
            if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                throw new Error(`${prefab.id}'s procedural "${proceduralName}" does not have possibility "${proceduralValue}".`);
        }
        return [prefab, container, inventorySlot?.id, quantity, proceduralSelections, uses];
    }
}
