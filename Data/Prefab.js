const constants = include('Configs/constants.json');

class Prefab {
    constructor(id, name, pluralName, singleContainingPhrase, pluralContainingPhrase, discreet, size, weight, usable, verb, uses, effectsStrings, curesStrings, nextStageName, equippable, equipmentSlots, coveredEquipmentSlots, equipCommands, unequipCommands, inventory, preposition, description, row) {
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
        this.nextStageName = nextStageName;
        this.nextStage = null;
        this.equippable = equippable;
        this.equipmentSlots = equipmentSlots;
        this.coveredEquipmentSlots = coveredEquipmentSlots;
        this.equipCommands = equipCommands;
        this.unequipCommands = unequipCommands;
        this.inventory = inventory;
        this.preposition = preposition;
        this.description = description;
        this.row = row;
    }

    descriptionCell() {
        return constants.prefabSheetDescriptionColumn + this.row;
    }
}

module.exports = Prefab;
