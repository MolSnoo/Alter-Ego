const settings = include('settings.json');

const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

class Item {
    constructor(prefab, location, sublocationName, accessible, requiresName, quantity, uses, row) {
        this.prefab = prefab;
        this.location = location;
        this.sublocationName = sublocationName;
        this.sublocation = null;
        this.accessible = accessible;
        this.requiresName = requiresName;
        this.requires = null;
        this.quantity = quantity;
        this.uses = uses;
        this.row = row;
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
}

module.exports = Item;
