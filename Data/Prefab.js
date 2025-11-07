const constants = require('../Configs/constants.json');
const Status = require("./Status");

/**
 * @import {Object} from "./Object.js"
 */

/**
 * @class Prefab
 * @classdesc Represents a prefab in the game.
 * @constructor
 * @param {string} id - The unique identifier of the prefab.
 * @param {string} name - The name of the prefab.
 * @param {string} pluralName - The plural name of the prefab.
 * @param {string} singleContainingPhrase - The phrase that will be inserted in/removed from item tags when an Item or Inventory Item using this Prefab is added to/removed from an item list.
 * @param {string} pluralContainingPhrase - The optional phrase that will be used in an item list when it contains multiple instances of Prefabs with the same single containing phrase.
 * @param {boolean} discreet - Whether interactions with this prefab are narrated or not.
 * @param {number} size - How large the prefab is.
 * @param {number} weight - How much the prefab weighs in kilograms.
 * @param {boolean} usable - Whether the prefab can be used to cure a status effect.
 * @param {string} verb - The verb that will be used to describe the prefab.
 * @param {number} uses - The number of uses the prefab has.
 * @param {string[]} effectsStrings - The status effects that will be inflicted on the player when the prefab is used.
 * @param {string[]} curesStrings - The status effects that will be cured on the player when the prefab is used.
 * @param {string} nextStageName - The name of the InventoryItem this prefab will turn into once its uses are exhausted.
 * @param {boolean} equippable - Whether the prefab can be equipped by the player.
 * @param {string[]} equipmentSlots - The equipment slots that the prefab can be equipped in.
 * @param {string[]} coveredEquipmentSlots - The equipment slots that the prefab will cover when equipped.
 * @param {string[]} equipCommands - Bot commands that will be executed when the prefab is equipped.
 * @param {string[]} unequipCommands - Bot commands that will be executed when the prefab is unequipped.
 * @param {InventorySlot[]} inventory - The inventory items that will be added to the player's inventory when the prefab is used.'
 * @param {string} preposition - The preposition that will be used to describe the prefab in an item list.
 * @param {string} description - The description of the prefab.
 * @param {number} row - The row number of the prefab in the sheet.
 */
class Prefab {
    /**
     * @param {string} id - The unique identifier of the prefab.
     * @param {string} name - The name of the prefab.
     * @param {string} pluralName - The plural name of the prefab.
     * @param {string} singleContainingPhrase - The phrase that will be inserted in/removed from item tags when an Item or Inventory Item using this Prefab is added to/removed from an item list.
     * @param {string} pluralContainingPhrase - The optional phrase that will be used in an item list when it contains multiple instances of Prefabs with the same single containing phrase.
     * @param {boolean} discreet - Whether interactions with this prefab are narrated or not.
     * @param {number} size - How large the prefab is.
     * @param {number} weight - How much the prefab weighs in kilograms.
     * @param {boolean} usable - Whether the prefab can be used to cure a status effect.
     * @param {string} verb - The verb that will be used to describe the prefab.
     * @param {number} uses - The number of uses the prefab has.
     * @param {string[]} effectsStrings - The status effects that will be inflicted on the player when the prefab is used.
     * @param {string[]} curesStrings - The status effects that will be cured on the player when the prefab is used.
     * @param {string} nextStageName - The name of the InventoryItem this prefab will turn into once its uses are exhausted.
     * @param {boolean} equippable - Whether the prefab can be equipped by the player.
     * @param {string[]} equipmentSlots - The equipment slots that the prefab can be equipped in.
     * @param {string[]} coveredEquipmentSlots - The equipment slots that the prefab will cover when equipped.
     * @param {string[]} equipCommands - Bot commands that will be executed when the prefab is equipped.
     * @param {string[]} unequipCommands - Bot commands that will be executed when the prefab is unequipped.
     * @param {InventorySlot[]} inventory - The inventory items that will be added to the player's inventory when the prefab is used.
     * @param {string} preposition - The preposition that will be used to describe the prefab in an item list.
     * @param {string} description - The description of the prefab.
     * @param {number} row - The row number of the prefab in the sheet.
     */
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
        /** @type {string[] | Status[]} */
        this.effects = [...effectsStrings];
        this.curesStrings = curesStrings;
        /** @type {string[] | Status[]} */
        this.cures = [...curesStrings];
        this.nextStageName = nextStageName;
        /** @type {Prefab | null} */
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

    /** @returns {string} */
    descriptionCell() {
        return constants.prefabSheetDescriptionColumn + this.row;
    }
}

module.exports = Prefab;
