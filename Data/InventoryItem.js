const settings = include('settings.json');

class InventoryItem {
    constructor(player, prefab, equipmentSlot, containerName, uses, description, row) {
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
        this.uses = uses;
        this.weight = 0;
        this.inventory = [];
        this.description = description;
        this.row = row;
    }

    insertItem(item, slot) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].name === slot) {
                this.inventory[i].item.push(item);
                this.inventory[i].weight += item.weight;
                this.inventory[i].takenSpace += item.prefab.size;
                this.weight += item.weight;
            }
        }
    }

    /*itemCells() {
        const descriptionColumn = settings.playerSheetItemDescriptionColumn.split('!');
        return settings.playerSheetItemNameColumn + this.row + ":" + descriptionColumn[1] + this.row;
    }*/

    usesCell() {
        return settings.inventorySheetUsesColumn + this.row;
    }

    descriptionCell() {
        return settings.inventorySheetDescriptionColumn + this.row;
    }
}

module.exports = InventoryItem;
