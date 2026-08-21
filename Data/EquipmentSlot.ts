import type Game from "./Game.ts";
import GameEntity from "./GameEntity.ts";
import InventoryItem from "./InventoryItem.ts";

/**
 * Represents a part of a player's body that they can equip inventory items to.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/equipment_slot.html
 */
export default class EquipmentSlot extends GameEntity {
    /**
     * The ID of this equipment slot. Must be unique only within the context of a single player.
     */
    readonly id: string;
    /**
     * The name of this equipment slot. Deprecated. Use `id` instead.
     * @deprecated
     */
    readonly name: string;
    /**
     * The inventory item currently equipped to this equipment slot. If nothing is equipped, this is `null`.
     */
    equippedItem: InventoryItem | null;
    /**
     * An array of inventory items within this equipment slot.
     * This includes the equippedItem, as well as any inventory items whose top-level parent is the equippedItem.
     */
    items: InventoryItem[];

    /**
     * @param id - The ID of the equipment slot.
     * @param row - The row number of the equipment slot in the sheet.
     * @param game - The game this belongs to.
     */
    constructor(id: string, row: number, game: Game) {
        super(game, row);
        this.id = id;
        this.name = id;
        this.equippedItem = null;
        this.items = [];
    }

    /**
     * Equips the given item and inserts it into the equipment slot's items list.
     * The previously equipped item will be replaced with the new equipped item in the game's list of inventory items.
     *
     * @param item - The inventory item to equip.
     */
    equipItem(item: InventoryItem): void {
        this.equippedItem = item.prefab !== null ? item : null;
        this.items.length = 0;
        this.insertItem(item);
        this.#replaceInventoryItemEntry(item);
    }

    /**
     * Unequips the given item and replaces it with a null inventory item that will be inserted into the equipment slot's items list.
     * The previously equipped item will be replaced with the null inventory item in the game's list of inventory items.
     *
     * @param item - The inventory item to unequip.
     */
    unequipItem(item: InventoryItem): void {
        const nullItem = new InventoryItem(
            item.player.name,
            "",
            "",
            this.id,
            "",
            "",
            null,
            null,
            "",
            this.row,
            this.getGame()
        );
        nullItem.prefab = null;
        nullItem.setPlayer(item.player);
        this.equippedItem = null;
        this.items.length = 0;
        this.insertItem(nullItem);
        this.#replaceInventoryItemEntry(nullItem);
    }

    /**
     * Replace the previously equipped item in the game's list of inventory items with the new equipped item.
     *
     * @param item - The newly equipped item.
     */
    #replaceInventoryItemEntry(item: InventoryItem): void {
        for (let i = 0; i < this.getGame().inventoryItems.length; i++) {
            if (this.getGame().inventoryItems[i].row === item.row) {
                this.getGame().inventoryItems.splice(i, 1, item);
                break;
            }
        }
    }

    /**
     * Inserts an inventory item into the equipment slot's list of items.
     *
     * @param item - The inventory item to insert.
     */
    insertItem(item: InventoryItem): void {
        if (item.quantity !== 0) {
            this.items.push(item);
        }
    }

    /**
     * Removes an inventory item from the equipment slot's list of items.
     *
     * @param item - The inventory item to remove.
     */
    removeItem(item: InventoryItem): void {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].row === item.row) {
                this.items.splice(i, 1);
                break;
            }
        };
    }

    /**
     * Returns true if the equipment slot contains no items.
     */
    containsNoItems(): boolean {
        return this.equippedItem === null;
    }

    /**
     * Returns the args for the InstantiateInventoryItem ActionDirective for this equipment slot.
     *
     * @returns ["II", id, undefined, undefined, undefined]
     */
    getPartialInstantiateActionDirectiveArgs(): [string, string, string, string, string] {
        return ["II", this.id, undefined, undefined, undefined];
    }

    override getEntityType(): "EquipmentSlot" {
        return "EquipmentSlot";
    }
}
