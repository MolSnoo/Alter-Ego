const settings = include('settings.json');

class Prefab {
    constructor(id, name, pluralName, discreet, uses, effectsStrings, curesStrings, nextStageStrings, singleContainingPhrase, pluralContainingPhrase, description, row) {
        this.id = id;
        this.name = name;
        this.pluralName = pluralName;
        this.discreet = discreet;
        this.uses = uses;
        this.effectsStrings = effectsStrings;
        this.effects = [...effectsStrings];
        this.curesStrings = curesStrings;
        this.cures = [...curesStrings];
        this.nextStageStrings = nextStageStrings;
        this.nextStage = [...nextStageStrings];
        this.singleContainingPhrase = singleContainingPhrase;
        this.pluralContainingPhrase = pluralContainingPhrase;
        this.description = description;
        this.row = row;
    }

    descriptionCell() {
        return settings.prefabSheetDescriptionColumn + this.row;
    }
}

module.exports = Prefab;
