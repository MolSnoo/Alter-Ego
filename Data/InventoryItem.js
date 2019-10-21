const settings = include('settings.json');

class InventoryItem {
    constructor(name, pluralName, uses, discreet, effectsStrings, curesStrings, singleContainingPhrase, pluralContainingPhrase, description, row) {
        this.name = name;
        this.pluralName = pluralName;
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
