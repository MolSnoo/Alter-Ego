class InventoryItem {
    constructor(name, pluralName, uses, discreet, effect, cures, singleContainingPhrase, pluralContainingPhrase, row) {
        this.name = name;
        this.pluralName = pluralName;
        this.uses = uses;
        this.discreet = discreet;
        this.effect = effect;
        this.cures = cures;
        this.singleContainingPhrase = singleContainingPhrase;
        this.pluralContainingPhrase = pluralContainingPhrase
        this.row = row;
    }

    itemCells() {
        return ("Players!I" + this.row + ":P" + this.row);
    }

    usesCell() {
        return ("Players!K" + this.row);
    }

    descriptionCell() {
        return ("Players!P" + this.row);
    }
}

module.exports = InventoryItem;