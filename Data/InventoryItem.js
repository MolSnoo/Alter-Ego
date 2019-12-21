const settings = include('settings.json');

class InventoryItem {
    constructor(player, prefab, equipmentSlot, containerName, quantity, uses, description, row) {
        this.player = player;
        this.prefab = prefab;
        this.name = prefab ? prefab.name : "";
        this.pluralName = prefab ? prefab.pluralName : "";
        this.singleContainingPhrase = prefab ? prefab.singleContainingPhrase : "";
        this.pluralContainingPhrase = prefab ? prefab.pluralContainingPhrase : "";
        this.equipmentSlot = equipmentSlot;
        this.foundEquipmentSlot = false;
        this.containerName = containerName;
        this.container = null;
        this.slot = "";
        this.quantity = quantity;
        this.uses = uses;
        this.weight = prefab ? prefab.weight : 0;
        this.inventory = [];
        this.description = description;
        this.row = row;
    }

    insertItem(item, slot) {
        if (item.quantity !== 0) {
            for (let i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i].name === slot) {
                    this.inventory[i].item.push(item);
                    if (!isNaN(item.quantity)) {
                        this.inventory[i].weight += item.weight * item.quantity;
                        this.inventory[i].takenSpace += item.prefab.size * item.quantity;
                        this.weight += item.weight * item.quantity;
                    }
                }
            }
        }
    }

    removeItem(item, slot) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].name === slot) {
                for (let j = 0; j < this.inventory[i].item.length; j++) {
                    if (this.inventory[i].item[j].name === item.name && this.inventory[i].item[j].description === item.description) {
                        if (item.quantity === 0) this.inventory[i].item.splice(j, 1);
                        this.inventory[i].weight -= item.weight;
                        this.inventory[i].takenSpace -= item.prefab.size;
                        this.weight -= item.weight;
                        break;
                    }
                }
            }
        }
    }

    itemCells() {
        const descriptionColumn = settings.inventorySheetDescriptionColumn.split('!');
        return settings.itemSheetPrefabColumn + this.row + ":" + descriptionColumn[1] + this.row;
    }

    usesCell() {
        return settings.inventorySheetUsesColumn + this.row;
    }

    descriptionCell() {
        return settings.inventorySheetDescriptionColumn + this.row;
    }
}

module.exports = InventoryItem;
