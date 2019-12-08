const settings = include('settings.json');

const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

class Item {
    constructor(prefab, location, accessible, containerName, quantity, uses, description, row) {
        this.prefab = prefab;
        this.name = prefab ? prefab.name : "";
        this.location = location;
        this.accessible = accessible;
        this.containerName = containerName;
        this.container = null;
        this.slot = "";
        this.quantity = quantity;
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
                if (!isNaN(item.quantity)) {
                    this.inventory[i].weight += item.weight * item.quantity;
                    this.inventory[i].takenSpace += item.prefab.size * item.quantity;
                    this.weight += item.weight * item.quantity;
                }
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
        const usesColumn = settings.itemSheetUsesColumn.split('!');
        return settings.itemSheetPrefabColumn + this.row + ":" + usesColumn[1] + this.row;
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
}

module.exports = Item;
