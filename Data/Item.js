const constants = include('Configs/constants.json');

class Item {
    constructor(prefab, identifier, location, accessible, containerName, quantity, uses, description, row) {
        this.prefab = prefab;
        this.identifier = identifier;
        this.name = prefab.name ? prefab.name : "";
        this.pluralName = prefab.pluralName ? prefab.pluralName : "";
        this.singleContainingPhrase = prefab.singleContainingPhrase ? prefab.singleContainingPhrase : "";
        this.pluralContainingPhrase = prefab.pluralContainingPhrase ? prefab.pluralContainingPhrase : "";
        this.location = location;
        this.accessible = accessible;
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
                    let matchedItem = this.inventory[i].item.find(inventoryItem =>
                        inventoryItem.prefab !== null && item.prefab !== null &&
                        inventoryItem.prefab.id === item.prefab.id &&
                        inventoryItem.identifier === item.identifier &&
                        inventoryItem.containerName === item.containerName &&
                        inventoryItem.slot === item.slot &&
                        (inventoryItem.uses === item.uses || isNaN(inventoryItem.uses) && isNaN(item.uses)) &&
                        inventoryItem.description === item.description
                    );
                    if (!matchedItem || isNaN(matchedItem.quantity)) this.inventory[i].item.push(item);
                    if (!isNaN(item.quantity)) {
                        this.inventory[i].weight += item.weight * item.quantity;
                        this.inventory[i].takenSpace += item.prefab.size * item.quantity;
                        this.weight += item.weight * item.quantity;
                    }
                }
            }
        }
    }

    removeItem(item, slot, removedQuantity) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].name === slot) {
                for (let j = 0; j < this.inventory[i].item.length; j++) {
                    if (this.inventory[i].item[j].name === item.name && this.inventory[i].item[j].description === item.description) {
                        if (item.quantity === 0) this.inventory[i].item.splice(j, 1);
                        this.inventory[i].weight -= item.weight * removedQuantity;
                        this.inventory[i].takenSpace -= item.prefab.size * removedQuantity;
                        this.weight -= item.weight * removedQuantity;
                        break;
                    }
                }
            }
        }
    }

    setAccessible() {
        this.accessible = true;
    }

    setInaccessible() {
        this.accessible = false;
    }

    descriptionCell() {
        return constants.itemSheetDescriptionColumn + this.row;
    }
}

module.exports = Item;
