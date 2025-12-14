import Game from './Game.js';
import GameEntity from './GameEntity.js';
import InventorySlot from './InventorySlot.js';
import Status from './Status.js';
import { Collection } from 'discord.js';

/**
 * @class Prefab
 * @classdesc Represents the concept of an item.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/prefab.html
 */
export default class Prefab extends GameEntity {
    /**
     * The unique identifier of the prefab.
     * @readonly
     * @type {string}
     */
    id;
    /**
     * The name of the prefab.
     * @readonly
     * @type {string}
     */
    name;
    /**
     * The plural name of the prefab.
     * @readonly
     * @type {string}
     */
    pluralName;
    /**
     * The phrase that will be inserted in/removed from item tags when an instance of this prefab is added to/removed from an item list.
     * @readonly
     * @type {string}
     */
    singleContainingPhrase;
    /**
     * The phrase that will be used in an item list when it contains multiple instances of prefabs with the same single containing phrase.
     * @readonly
     * @type {string}
     */
    pluralContainingPhrase;
    /**
     * Whether interactions with instances of this prefab are narrated or not.
     * @readonly
     * @type {boolean}
     */
    discreet;
    /**
     * How large the prefab is. Does not correspond with any particular unit of measurement.
     * @readonly
     * @type {number}
     */
    size;
    /**
     * How much the prefab weighs in kilograms.
     * @readonly
     * @type {number}
     */
    weight;
    /**
     * Whether the instances of the prefab can be used by a player to inflict or cure one or more status effects.
     * @readonly
     * @type {boolean}
     */
    usable;
    /**
     * The verb that will be used when a player uses an inventory item instance of this prefab.
     * @readonly
     * @type {string}
     */
    verb;
    /**
     * The number of uses the prefab has.
     * @readonly
     * @type {number}
     */
    uses;
    /**
     * A list of status effects that will be inflicted on the player when they use an inventory item instance of this prefab.
     * @readonly
     * @type {string[]}
     */
    effectsStrings;
    /** 
     * Status effects will be inflicted on the player when they use an inventory item instance of this prefab.
     * @type {Status[]}
     */
    effects;
    /**
     * A list of status effects that the player will be cured of when they use an inventory item instance of this prefab.
     * @readonly
     * @type {string[]}
     */
    curesStrings;
    /** 
     * Status effects that the player will be cured of when they use an inventory item instance of this prefab.
     * @type {Status[]} 
     */
    cures;
    /**
     * The ID of the prefab that instances of this prefab will turn into once they have no uses left.
     * @readonly
     * @type {string}
     */
    nextStageId;
    /**
     * The prefab that instances of this prefab will turn into once they have no uses left.
     * @type {Prefab}
     */
    nextStage;
    /**
     * Whether inventory item instances of this prefab can be equipped by a player.
     * @readonly
     * @type {boolean}
     */
    equippable;
    /**
     * The IDs of equipment slots that inventory item instances of this prefab can be equipped to.
     * @readonly
     * @type {string[]}
     */
    equipmentSlots;
    /**
     * The IDs of equipment slots that inventory item instances of this prefab will cover when equipped. This prevents any inventory items equipped to those equipment slots from appearing in the player's equipment description.
     * @readonly
     * @type {string[]}
     */
    coveredEquipmentSlots;
    /**
     * Forward slash separated list of comma-separated bot commands to be executed when the an inventory item instance of this prefab is equipped or unequipped.
     * @readonly
     * @type {string}
     */
    commandsString;
    /**
     * The bot commands to be executed when an inventory item instance of this prefab is equipped by a player.
     * @readonly
     * @type {string[]}
     */
    equipCommands;
    /**
     * The bot commands to be executed when an inventory item instance of this prefab is unequipped by a player.
     * @readonly
     * @type {string[]}
     */
    unequipCommands;
    /**
     * {@link InventorySlot|Inventory slots} that instances of this prefab will have. Deprecated. Use inventoryCollection instead.
     * @deprecated
     * @readonly
     * @type {InventorySlot[]}
     */
    inventory;
    /**
     * {@link InventorySlot|Inventory slots} that instances of this prefab will have. The key is the inventory slot's ID.
     * @readonly
     * @type {Collection<string, InventorySlot>}
     */
    inventoryCollection;
    /**
     * The preposition that will be used when a player puts an item into an instance of this prefab.
     * @readonly
     * @type {string}
     */
    preposition;
    /**
     * The description of the prefab. Can contain multiple item lists named after its inventory slots.
     * @readonly
     * @type {string}
     */
    description;

    /**
     * @constructor
     * @param {string} id - The unique identifier of the prefab.
     * @param {string} name - The name of the prefab.
     * @param {string} pluralName - The plural name of the prefab.
     * @param {string} singleContainingPhrase - The phrase that will be inserted in/removed from item tags when an instance of this prefab is added to/removed from an item list.
     * @param {string} pluralContainingPhrase - The phrase that will be used in an item list when it contains multiple instances of prefabs with the same single containing phrase.
     * @param {boolean} discreet - Whether interactions with instances of this prefab are narrated or not.
     * @param {number} size - How large the prefab is. Does not correspond with any particular unit of measurement.
     * @param {number} weight - How much the prefab weighs in kilograms.
     * @param {boolean} usable - Whether the instances of the prefab can be used by a player to inflict or cure one or more status effects.
     * @param {string} verb - The verb that will be used when a player uses an inventory item instance of this prefab.
     * @param {number} uses - The number of uses the prefab has.
     * @param {string[]} effectsStrings - A list of status effects that will be inflicted on the player when they use an inventory item instance of this prefab.
     * @param {string[]} curesStrings - A list of status effects that the player will be cured of when they use an inventory item instance of this prefab.
     * @param {string} nextStageId - The ID of the prefab that instances of this prefab will turn into once they have no uses left.
     * @param {boolean} equippable - Whether inventory item instances of this prefab can be equipped by a player.
     * @param {string[]} equipmentSlots - The IDs of equipment slots that inventory item instances of this prefab can be equipped to.
     * @param {string[]} coveredEquipmentSlots - The IDs of equipment slots that inventory item instances of this prefab will cover when equipped. This prevents any inventory items equipped to those equipment slots from appearing in the player's equipment description.
     * @param {string} commandsString - Forward slash separated list of comma-separated bot commands to be executed when the an inventory item instance of this prefab is equipped or unequipped.
     * @param {string[]} equipCommands - The bot commands to be executed when an inventory item instance of this prefab is equipped by a player.
     * @param {string[]} unequipCommands - The bot commands to be executed when an inventory item instance of this prefab is unequipped by a player.
     * @param {Collection<string, InventorySlot>} inventory - {@link InventorySlot|Inventory slots} that instances of this prefab will have.
     * @param {string} preposition - The preposition that will be used when a player puts an item into an instance of this prefab.
     * @param {string} description - The description of the prefab. Can contain multiple item lists named after its inventory slots.
     * @param {number} row - The row number of the prefab in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(id, name, pluralName, singleContainingPhrase, pluralContainingPhrase, discreet, size, weight, usable, verb, uses, effectsStrings, curesStrings, nextStageId, equippable, equipmentSlots, coveredEquipmentSlots, commandsString, equipCommands, unequipCommands, inventory, preposition, description, row, game) {
        super(game, row);
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
        this.effects = new Array(this.effectsStrings.length);
        this.curesStrings = curesStrings;
        this.cures = new Array(this.curesStrings.length);
        this.nextStageId = nextStageId;
        this.nextStage = null;
        this.equippable = equippable;
        this.equipmentSlots = equipmentSlots;
        this.coveredEquipmentSlots = coveredEquipmentSlots;
        this.commandsString = commandsString;
        this.equipCommands = equipCommands;
        this.unequipCommands = unequipCommands;
        this.inventory = [];
        this.inventoryCollection = inventory;
        this.preposition = preposition;
        this.description = description;
    }

    /**
     * Sets the next stage.
     * @param {Prefab} nextStage 
     */
    setNextStage(nextStage) {
        this.nextStage = nextStage;
    }

    /** @returns {string} */
    descriptionCell() {
        return this.game.constants.prefabSheetDescriptionColumn + this.row;
    }
}
