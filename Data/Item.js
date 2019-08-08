const settings = include('settings.json');

class Item {
    constructor(name, pluralName, location, sublocationName, accessible, requiresName, quantity, uses, discreet, effectsStrings, curesStrings, singleContainingPhrase, pluralContainingPhrase, row) {
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
