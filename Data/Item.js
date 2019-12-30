const settings = include('settings.json');

const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

class Item {
    constructor(prefab, location, accessible, containerName, quantity, uses, description, row) {
        this.prefab = prefab;
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
                console.log(this.inventory[i]);
                for (let j = 0; j < this.inventory[i].item.length; j++) {
                    if (this.inventory[i].item[j].name === item.name && this.inventory[i].item[j].description === item.description) {
                        if (item.quantity === 0) this.inventory[i].item.splice(j, 1);
                        this.inventory[i].weight -= item.weight;
                        this.inventory[i].takenSpace -= item.prefab.size;
                        this.weight -= item.weight;
                        break;
                    }
                }
                console.log(this.inventory[i]);
            }
        }
    }

    setAccessible(game) {
        this.accessible = true;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.accessibleCell(), "TRUE"));
    }

    setInaccessible(game) {
        this.accessible = false;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.accessibleCell(), "FALSE"));
    }

    itemCells() {
        const descriptionColumn = settings.itemSheetDescriptionColumn.split('!');
        return settings.itemSheetPrefabColumn + this.row + ":" + descriptionColumn[1] + this.row;
    }

    accessibleCell() {
        return settings.itemSheetAccessibleColumn + this.row;
    }

    quantityCell() {
        return settings.itemSheetQuantityColumn + this.row;
    }

    usesCell() {
        return settings.playerSheetItemUsesColumn + this.row;
    }

    descriptionCell() {
        return settings.itemSheetDescriptionColumn + this.row;
    }
}

module.exports = Item;
