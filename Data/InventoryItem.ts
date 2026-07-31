// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "discord.js";
import { replaceInventoryItem } from "../Modules/itemManager.ts";
import Description from "./Description.ts";
import type EquipmentSlot from "./EquipmentSlot.ts";
import type Game from "./Game.ts";
import InventorySlot from "./InventorySlot.ts";
import ItemInstance from "./ItemInstance.ts";
import type Player from "./Player.ts";
import type RoomItem from "./RoomItem.ts";
import { itemIdentifierMatches } from "../Modules/matchers.ts";

export type InventoryItemField = "player"|"prefab"|"identifier"|"names"|"containingPhrases"|"equipmentSlot"|"container"|"quantity"|"uses"|"description"|"proceduralSelections";

/**
 * Represents an item that is currently possessed by a player.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/inventory_item.html
 */
export default class InventoryItem extends ItemInstance implements PersistentGameEntity {
    /**
     * The name of the player who has this inventory item.
     */
    playerName: string;
    /**
     * The player who has this inventory item.
     */
    player: Player;
    /**
     * The ID of the equipment slot the inventory item or its top-level container is equipped to.
     */
    equipmentSlot: string;
    /**
     * The inventory item's actual container.
     */
    override container: InventoryItem = null;
    /**
     * A collection of {@link InventorySlot|inventory slots} the item has. The key is the inventory slot's ID.
     */
    override inventory: Collection<string, InventorySlot<InventoryItem>> = new Collection();

    /**
     * @param playerName - The name of the player who has this inventory item.
     * @param prefabId - The ID of the prefab this inventory item is an instance of.
     * @param identifier - The unique identifier given to the inventory item if it is capable of containing other inventory items.
     * @param equipmentSlot - The ID of the equipment slot the inventory item or its top-level container is equipped to.
     * @param containerType - The type of the item's container. The only acceptable option is "InventoryItem" or an empty string.
     * @param containerName - The identifier of the container the inventory item can be found in, and the ID of the {@link InventorySlot|inventory slot} it belongs to, separated by a forward slash.
     * @param quantity - How many identical instances of this inventory item are in the given container.
     * @param uses - The number of times this inventory item can be used.
     * @param description - The description of the inventory item. Can contain multiple item lists named after its inventory slots.
     * @param row - The row number of the inventory item in the sheet.
     * @param game - The game this belongs to.
     */
    constructor(playerName: string, prefabId: string, identifier: string, equipmentSlot: string, containerType: string,
        containerName: string, quantity: number, uses: number, description: string, row: number, game: Game) {
        super(game, row, description, prefabId, identifier, containerType, containerName, quantity, uses);
        this.playerName = playerName;
        this.equipmentSlot = equipmentSlot;
        this.inventory = new Collection();
    }

    /**
     * Sets the player.
     */
    setPlayer(player: Player): void {
        this.player = player;
    }

    /**
     * Sets the container.
     */
    setContainer(container: InventoryItem): void {
        this.container = container;
    }

    /**
     * Creates instances of all of the prefab's {@link InventorySlot|inventory slots} and inserts them into this instance's inventory.
     */
    initializeInventory(): void {
        this.prefab.inventory.forEach(prefabInventorySlot => {
            const items: InventoryItem[] = [];
            const inventorySlot = new InventorySlot(
                prefabInventorySlot.id,
                prefabInventorySlot.capacity,
                prefabInventorySlot.takenSpace,
                prefabInventorySlot.weight,
                items,
                this.row,
                this.getGame()
            );
            this.inventory.set(inventorySlot.id, inventorySlot);
        });
    }

    /**
     * Decreases the number of uses this inventory item has left. If it runs out of uses, instantiates its nextStage in its place, if it has one.
     */
    override decreaseUses(): void {
        this.uses--;
        if (this.uses === 0) {
            const nextStage = this.prefab.nextStage;
            const container = this.container !== null ? this.container : this.player;
            const slot = this.container !== null ? this.slot :
                this.equipmentSlot === "RIGHT HAND" || this.equipmentSlot === "LEFT HAND" ? "hands" : "equipment";
            replaceInventoryItem(this, nextStage);
        }
    }

    /**
     * Inserts an inventory item into the specified slot.
     *
     * @param item - The item to insert.
     * @param slotId - The ID of the inventory slot to insert it in.
     */
    insertItem(item: InventoryItem, slotId: string): void {
        if (item.quantity !== 0) {
            const inventorySlot = this.inventory.get(slotId);
            if (inventorySlot) inventorySlot.insertItem(item);
            if (!isNaN(item.quantity)) this.addWeight(item.weight * item.quantity);
        }
    }

    /**
     * Removes an inventory item from the specified slot.
     *
     * @param item - The item to remove.
     * @param slotId - The ID of the inventory slot to remove it from.
     * @param removedQuantity - The quantity of this item to remove.
     */
    removeItem(item: InventoryItem, slotId: string, removedQuantity: number): void {
        const inventorySlot = this.inventory.get(slotId);
        if (inventorySlot) inventorySlot.removeItem(item, removedQuantity);
        if (!isNaN(item.quantity)) this.subtractWeight(item.weight * removedQuantity);
    }

    /** Gets the entity's location. */
    getLocation() {
        return this.player.location;
    }

    /** Gets the item's container. */
    getContainer() {
        return this.container;
    }

    /**
     * Returns the args for the Inspect ActionDirective for this inventory item.
     */
    getInspectActionDirectiveArgs() {
        return ["II", this.getIdentifier(), this.player.name, this.containerName, this.equipmentSlot, this.proceduralSelectionsString];
    }

    /**
     * Returns the args for the Drop ActionDirective for this inventory item.
     *
     * @param containerType - The type of container to drop the inventory item into.
     * @param container - The container to drop the inventory item into.
     * @param inventorySlot - The inventory slot to drop the inventory item into.
     */
    getDropActionDirectiveArgs(containerType: 'Fixture' | 'RoomItem' | 'Puzzle', container: RoomItemContainer, inventorySlot: InventorySlot<RoomItem>): [string, string, string, string, string, string, string, string] {
        let containerName = container.name;
        let containerProceduralSelectionsString = "";
        if (container instanceof ItemInstance) {
            containerName = container.getIdentifier();
            containerProceduralSelectionsString = container.proceduralSelectionsString;
        }
        return [this.getIdentifier(), this.equipmentSlot, containerType, containerName, inventorySlot?.id ?? undefined, container.location.id, containerProceduralSelectionsString, this.proceduralSelectionsString];
    }

	/**
	 * Returns the args for the Stash ActionDirective for this inventory item.
     *
	 * @param container - The container to stash the inventory item into.
	 * @param inventorySlot - The inventory slot to stash the inventory item into.
	 */
	getStashActionDirectiveArgs(container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>): [string, string, string, string, string, string, string, string] {
		return [this.getIdentifier(), this.equipmentSlot, container.getIdentifier(), inventorySlot?.id ?? undefined, container.containerName, container.equipmentSlot, container.proceduralSelectionsString, this.proceduralSelectionsString];
	}

	/**
	 * Returns the args for the Unstash ActionDirective for this inventory item.
     *
     * @returns [identifier, containerName, equipmentSlot, proceduralSelectionsString]
	 */
	getUnstashActionDirectiveArgs(): [string, string, string, string] {
		return [this.getIdentifier(), this.containerName, this.equipmentSlot, this.proceduralSelectionsString];
	}

    /**
     * Returns the args for the Equip ActionDirective for this inventory item.
     *
     * @param equipmentSlot - The equipment slot to equip the inventory item to.
     * @returns [identifier, equipmentSlot, handEquipmentSlot]
     */
    getEquipActionDirectiveArgs(equipmentSlot: EquipmentSlot): [string, string, string, string] {
        return [this.getIdentifier(), equipmentSlot.id, this.equipmentSlot, this.proceduralSelectionsString];
    }

    /**
     * Returns the args for the Unequip ActionDirective for this inventory item.
     *
     * @returns [identifier, equipmentSlot, proceduralSelectionsString]
     */
    getUnequipActionDirectiveArgs(): [string, string, string] {
        return [this.getIdentifier(), this.equipmentSlot, this.proceduralSelectionsString];
    }

    /**
     * Returns the args for the Use ActionDirective for this inventory item.
     *
     * @param target - The player to use the inventory item on.
     * @returns [identifier, targetName]
     */
    getUseActionDirectiveArgs(target: Player): [string, string, string] {
        return [this.getIdentifier(), target.name, this.proceduralSelectionsString];
    }

    /**
     * Returns the args for the InstantiateInventoryItem ActionDirective for this inventory item.
     * @param inventorySlot - The inventory slot to instantiate the inventory item into.
     * @returns ["II", equipmentSlot, identifier, inventorySlot.id, proceduralSelectionsString]
     */
    getPartialInstantiateActionDirectiveArgs(inventorySlot: InventorySlot<InventoryItem>): [string, string, string, string, string] {
        return ["II", this.equipmentSlot, this.getIdentifier(), inventorySlot?.id ?? undefined, this.proceduralSelectionsString];
    }

    /**
     * Returns the args for the DestroyInventoryItem ActionDirective for this inventory item.
     * @returns ["II", identifier, containerName, equipmentSlot, proceduralSelectionsString]
     */
    getDestroyActionDirectiveArgs(): [string, string, string, string, string] {
        return ["II", this.getIdentifier(), this.containerName, this.equipmentSlot, this.proceduralSelectionsString];
    }

    /**
     * Returns the args for the Find ActionDirective to get the contained items for this item container.
     */
    getFindChildItemsActionDirectiveArgs(inventorySlotID?: string): [string] {
        const slotPhrase = inventorySlotID ? `${inventorySlotID} of ` : ``;
        return [`InventoryItems ${this.getPreposition()} ${this.player.name}'s ${slotPhrase}${this.getEntityID()}`];
    }

    /**
     * Returns true if the owner of this item instance is the given player.
     * @param player - The player to check ownership against.
     */
    override ownerIs(player: Player): boolean {
        return this.player.name === player.name;
    }

    /**
     * Gets all of the items this entity contains.
     */
    override getContainedItems(): InventoryItem[] {
        if (this.inventory.size === 0) return [];
        return this.getGame().entityFinder.getInventoryItems(undefined, this.player.name, this.identifier);
    }

    /**
	 * Gets all of the items that should appear in the given item list.
     *
	 * @param itemListName - The name of the item list. Only required if there is more than one item list.
	 * @param player - The player the description is being sent to. Optional.
	 */
	override getContainedItemsForItemList(itemListName?: string, player?: Player): InventoryItem[] {
        if (player && player.name !== this.player.name) return [];
        return this.getGame().entityFinder.getInventoryItems(undefined, this.player.name, this.identifier, itemListName);
	}

    /**
     * Returns true if this entity contains an item with the given identifier or prefab ID.
     * @param identifier - The identifier or prefab ID to search for.
     */
    override containsItem(identifier: string): boolean {
        const containedItems = this.getContainedItems();
        for (const item of containedItems) {
            if (itemIdentifierMatches(item, identifier, true)) return true;
        }
        return false;
    }

    /**
     * Returns the item contained inside of this container with the given identifier or prefab ID.
     * If no such item exists, returns undefined.
     * @param identifier - The identifier or prefab ID to search for.
     */
    override getContainedItem(identifier: string): ItemInstance {
        const containedItems = this.getContainedItems();
        for (const item of containedItems) {
            if (itemIdentifierMatches(item, identifier, true)) return item;
        }
        return undefined;
    }

    /**
     * Executes the inventory item's equipped commands.
     */
    executeEquippedCommands(): void {
        this.getGame().clientContext.commandHandler.parseAndExecuteBotCommands(this.prefab.equippedCommands, this.getGame(), this, this.player);
    }

    /**
     * Executes the inventory item's unequipped commands.
     */
    executeUnequippedCommands(): void {
        this.getGame().clientContext.commandHandler.parseAndExecuteBotCommands(this.prefab.unequippedCommands, this.getGame(), this, this.player);
    }

    /**
     * Returns true if the item is usable on the given player.
     */
    usableOn(player: Player): boolean {
        let canEffect = false, canCure = false;
		for (const effect of this.prefab.effects) {
			if ((!player.hasStatus(effect.id) || effect.duplicatedStatus !== null) && effect.overriders.every(overrider => !player.hasStatus(overrider.id)))
                canEffect = true;
		}
		for (const cure of this.prefab.cures) {
			if (player.hasStatus(cure.id))
                canCure = true;
		}
        if (!canEffect && !canCure) return false;
        return true;
    }

    /**
     * Returns true if the item is covered by an equipped inventory item. Also returns true if it's stashed.
     */
    isCoveredByEquippedItem(): boolean {
        if (this.container) return true;
        for (const equipmentSlot of this.player.inventory.values()) {
            if (equipmentSlot.equippedItem === null || equipmentSlot.id === "RIGHT HAND" || equipmentSlot.id === "LEFT HAND") continue;
            if (equipmentSlot.equippedItem.prefab.coveredEquipmentSlots.includes(this.equipmentSlot)) return true;
        }
        return false;
    }

    /**
     * Sets the description.
     *
     * @param description - The description to set.
     */
    setDescription(description: Description): void {
        this.description = new Description(description.text, this, this.getGame());
        this.setProceduralSelections();
    }

    descriptionCell(): string {
        return this.getGame().constants.inventorySheetDescriptionColumn + this.row;
    }

    getContainerIdentifier(): string {
        return this.getIdentifier();
    }

    getContainerType(): string {
        return "InventoryItem";
    }

    getEntityID(): string {
        return this.getIdentifier();
    }

    getLabel(field: InventoryItemField): string {
        switch (field) {
            case "player": return "Player Name";
            case "prefab": return "Prefab";
            case "identifier": return "Container Identifier";
            case "names": return "Names";
            case "containingPhrases": return "Containing Phrases";
            case "equipmentSlot": return "Equipment Slot";
            case "container": return "Container";
            case "quantity": return "Quantity";
            case "uses": return "Uses";
            case "description": return "Description";
            case "proceduralSelections": return "Procedural Selections";
        }
    }

    getValue(field: InventoryItemField): string {
        switch (field) {
            case "player": return this.player.name;
            case "prefab": return this.prefab?.id ?? "NULL";
            case "identifier": return this.identifier;
            case "names": return this.pluralName ? [this.name, this.pluralName].join(", ") : this.name;
            case "containingPhrases": return this.pluralContainingPhrase ? [this.singleContainingPhrase, this.pluralContainingPhrase].join(", ") : this.singleContainingPhrase;
            case "equipmentSlot": return this.equipmentSlot;
            case "container": return this.containerName;
            case "quantity": return isNaN(this.quantity) ? "Infinity" : this.quantity !== null ? String(this.quantity) : "";
            case "uses": return isNaN(this.uses) && this.prefab?.usable ? "Infinity" : isNaN(this.uses) || this.uses === null ? "" : String(this.uses);
            case "description": return this.description.text;
            case "proceduralSelections": return this.proceduralSelectionsString;
        }
    }

    getViewField(field: InventoryItemField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): string {
        return "InventoryItem";
    }
}
