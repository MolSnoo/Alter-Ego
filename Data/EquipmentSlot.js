class EquipmentSlot {
    constructor(name, row) {
        this.name = name;
        this.equippedItem = null;
        this.items = [];
        this.row = row;
    }
}

module.exports = EquipmentSlot;