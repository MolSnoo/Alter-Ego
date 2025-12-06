import Game from "./Game.js";
import GameEntity from "./GameEntity.js";
import InventoryItem from "./InventoryItem.js";

/**
 * @class EquipmentSlot
 * @classdesc Represents a part of a player's body that they can equip inventory items to.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/equipment_slot.html
 */
export default class EquipmentSlot extends GameEntity {
    /**
     * The ID of this equipment slot. Must be unique only within the context of a single player.
     * @type {string}
     */
    id;
    /**
     * The inventory item currently equipped to this equipment slot. If nothing is equipped, this is `null`.
     * @type {InventoryItem | null}
     */
    equippedItem;
    /**
     * An array of inventory items within this equipment slot.
     * This includes the equippedItem, as well as any inventory items whose top-level parent is the equippedItem.
     * @type {InventoryItem[]}
     */
    items;

    /**
     * @constructor
     * @param {string} id - The ID of the equipment slot.
     * @param {number} row - The row number of the equipment slot in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(id, row, game) {
        super(game, row);
        this.id = id;
        this.equippedItem = null;
        this.items = [];
    }
}
