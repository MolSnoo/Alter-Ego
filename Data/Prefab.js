﻿const settings = include('settings.json');

class Prefab {
    constructor(id, name, pluralName, singleContainingPhrase, pluralContainingPhrase, discreet, size, weight, usable, verb, uses, effectsStrings, curesStrings, nextStageStrings, equippable, equipmentSlots, equipCommands, unequipCommands, inventory, preposition, description, row) {
        this.id = id;
        this.name = name;
        this.pluralName = pluralName;
        this.singleContainingPhrase = singleContainingPhrase;
        this.pluralContainingPhrase = pluralContainingPhrase;
        this.discreet = discreet;
        this.size = size;
        this.weight = weight;
        this.usable = usable;
        this.verb = verb;
        this.uses = uses;
        this.effectsStrings = effectsStrings;
        this.effects = [...effectsStrings];
        this.curesStrings = curesStrings;
        this.cures = [...curesStrings];
        this.nextStageStrings = nextStageStrings;
        this.nextStage = [...nextStageStrings];
        this.equippable = equippable;
        this.equipmentSlots = equipmentSlots;
        this.equipCommands = equipCommands;
        this.unequipCommands = unequipCommands;
        this.inventory = inventory;
        this.preposition = preposition;
        this.description = description;
        this.row = row;
    }

    descriptionCell() {
        return settings.prefabSheetDescriptionColumn + this.row;
    }
}

module.exports = Prefab;