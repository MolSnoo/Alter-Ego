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
        return ("Items!A" + this.row + ":M" + this.row);
    }

    quantityCell() {
        return ("Items!G" + this.row);
    }

    descriptionCell() {
        return ("Items!M" + this.row);
    }
}

module.exports = Item;