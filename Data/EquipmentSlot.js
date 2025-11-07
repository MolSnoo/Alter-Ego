/**
 * @class EquipmentSlot
 * @classdesc Represents an equipment slot in the game.
 * @constructor
 * @param {string} name - The name of the equipment slot.
 * @param {number} row - The row number of the equipment slot in the sheet.
 */
class EquipmentSlot {
    /**
     * @param {string} name - The name of the equipment slot.
     * @param {number} row - The row number of the equipment slot in the sheet.
     */
    constructor(name, row) {
        this.name = name;
        /** @type {InventoryItem | null} */
        this.equippedItem = null;
        /** @type {InventoryItem[]} */
        this.items = [];
        this.row = row;
    }
}

module.exports = EquipmentSlot;
