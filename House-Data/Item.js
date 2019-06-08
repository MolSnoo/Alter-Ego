const settings = require("../settings.json");

class Item {
    constructor(name, pluralName, location, sublocation, accessible, requires, quantity, uses, discreet, effect, cures, singleContainingPhrase, pluralContainingPhrase, row) {
        this.name = name;
        this.pluralName = pluralName;
        this.location = location;
        this.sublocation = sublocation;
        this.accessible = accessible;
        this.requires = requires;
        this.quantity = quantity;
        this.uses = uses;
        this.discreet = discreet;
        this.effect = effect;
        this.cures = cures;
        this.singleContainingPhrase = singleContainingPhrase;
        this.pluralContainingPhrase = pluralContainingPhrase;
        this.row = row;
    }

    itemCells() {
        const descriptionColumn = settings.itemSheetDescriptionColumn.split('!');
        return settings.itemSheetNameColumn + this.row + ":" + descriptionColumn[1] + this.row;
    }

    quantityCell() {
        return settings.itemSheetQuantityColumn + this.row;
    }

    descriptionCell() {
        return settings.itemSheetDescriptionColumn + this.row;
    }
}

module.exports = Item;
