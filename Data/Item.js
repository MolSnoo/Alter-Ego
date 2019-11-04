const settings = include('settings.json');

const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

class Item {
    constructor(name, pluralName, location, sublocationName, accessible, requiresName, quantity, uses, discreet, effectsStrings, curesStrings, singleContainingPhrase, pluralContainingPhrase, description, row) {
        this.name = name;
        this.pluralName = pluralName;
        this.location = location;
        this.sublocationName = sublocationName;
        this.sublocation = null;
        this.accessible = accessible;
        this.requiresName = requiresName;
        this.requires = null;
        this.quantity = quantity;
        this.uses = uses;
        this.discreet = discreet;
        this.effectsStrings = effectsStrings;
        this.effects = [...effectsStrings];
        this.curesStrings = curesStrings;
        this.cures = [...curesStrings];
        this.singleContainingPhrase = singleContainingPhrase;
        this.pluralContainingPhrase = pluralContainingPhrase;
        this.description = description;
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
        const descriptionColumn = settings.itemSheetDescriptionColumn.split('!');
        return settings.itemSheetNameColumn + this.row + ":" + descriptionColumn[1] + this.row;
    }

    accessibleCell() {
        return settings.itemSheetAccessibleColumn + this.row;
    }

    quantityCell() {
        return settings.itemSheetQuantityColumn + this.row;
    }

    descriptionCell() {
        return settings.itemSheetDescriptionColumn + this.row;
    }
}

module.exports = Item;
