const settings = include('settings.json');

class InventoryItem {
    constructor(name, pluralName, uses, discreet, effects, cures, singleContainingPhrase, pluralContainingPhrase, row) {
        this.name = name;
        this.pluralName = pluralName;
        this.uses = uses;
        this.discreet = discreet;
        this.effects = effects;
        this.cures = cures;
        this.singleContainingPhrase = singleContainingPhrase;
        this.pluralContainingPhrase = pluralContainingPhrase;
        this.row = row;
    }

    itemCells() {
        const descriptionColumn = settings.playerSheetItemDescriptionColumn.split('!');
        return settings.playerSheetItemNameColumn + this.row + ":" + descriptionColumn[1] + this.row;
    }

    usesCell() {
        return settings.playerSheetItemUsesColumn + this.row;
    }

    descriptionCell() {
        return settings.playerSheetItemDescriptionColumn + this.row;
    }
}

module.exports = InventoryItem;
