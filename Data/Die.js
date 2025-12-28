import Game from './Game.js';
import GameConstruct from './GameConstruct.js';
import Player from './Player.js';
import Status from './Status.js';

/**
 * @class Die
 * @classdesc Represents a die that can be rolled for a semi-random number.
 * @extends GameConstruct
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/die.html
 */
export default class Die extends GameConstruct {
    /**
     * The minimum possible base roll.
     * @type {number}
     */
    min;
    /**
     * The maximum possible base roll.
     * @type {number}
     */
    max;
    /**
     * The result of the die roll with no modifiers applied.
     * @type {number}
     */
    baseRoll;
    /**
     * The calculated number to add to the baseRoll.
     * @type {number}
     */
    modifier;
    /**
     * A string representation of all modifiers applied to the baseRoll, as well as the reasons they were applied.
     * @type {string}
     */
    modifierString;
    /**
     * The final result of the die roll.
     * @type {number}
     */
    result;

    /**
     * @constructor
     * @param {Game} game - The game context this roll is occuring in. 
     * @param {string} [stat] - The name of the stat to roll for. 
     * @param {Player} [attacker] - The active player to roll for. In other words, the player attempting an action.
     * @param {Player} [defender] - The passive player to roll for. Only used if the attacker is attempting to perform an action against another player.
     */
    constructor(game, stat, attacker, defender) {
        super(game);

        this.min = this.getGame().settings.diceMin;
        this.max = this.getGame().settings.diceMax;

        /** @type {number} */
        let baseRoll;
        if (attacker && attacker.hasBehaviorAttribute("all or nothing")) {
            // Make the base roll either the minimum or maximum possible.
            baseRoll = this.doBaseRoll(0, 1);
            baseRoll = baseRoll * (this.max - 1);
            baseRoll += this.min;
        }
        else baseRoll = this.doBaseRoll();
        this.baseRoll = baseRoll;

        let modifiers = this.calculateModifiers(stat, attacker, defender);
        this.modifier = modifiers.number;
        this.modifierString = modifiers.strings.join(", ");
        this.result = this.baseRoll + this.modifier;
    }

    /**
     * Roll a die with no modifiers.
     * @param {number} [min] - The minimum possible roll. Defaults to diceMin in the game's settings.
     * @param {number} [max] - The maximum possible roll. Defaults to diceMax in the game's settings.
     * @returns {number} A random number between min and max, inclusive.
     */
    doBaseRoll(min = this.min, max = this.max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Calculates the modifiers to apply to the base roll.
     * @param {string} [stat] - The stat which will modify the base roll.
     * @param {Player} [attacker]
     * @param {Player} [defender] 
     * @returns {ModifierResult}
     */
    calculateModifiers(stat, attacker, defender) {
        let modifier = 0;
        /** @type {string[]} */
        let modifierStrings = [];
        if (attacker) {
            if (attacker.hasBehaviorAttribute("coin flipper")) {
                let hasCoin = false;
                const rightHand = attacker.inventoryCollection.get("RIGHT HAND");
                const leftHand = attacker.inventoryCollection.get("LEFT HAND");
                if (rightHand && rightHand.equippedItem !== null && rightHand.equippedItem.name.includes("COIN")
                    || leftHand && leftHand.equippedItem !== null && leftHand.equippedItem.name.includes("COIN")) {
                    hasCoin = true;
                }
                if (hasCoin) {
                    const coinModifier = this.doBaseRoll(0, 1);
                    if (coinModifier === 1) {
                        modifier += coinModifier;
                        modifierStrings.push("+1 (coin flip)");
                    }
                }
            }

            /** @type {Status[]} */
            let tempStatuses = [];
            if (defender) {
                // If the attacker is attacking the defender with their strength, use the defender's dexterity stat determines how well they dodged it.
                if (stat === "str") {
                    const dexterityModifier = -1 * defender.getStatModifier(defender.dexterity);
                    modifier += dexterityModifier;
                    if (dexterityModifier > 0)
                        modifierStrings.push(`+${dexterityModifier} (-1 * stat modifier of ${defender.name}'s dexterity stat: ${defender.dexterity})`);
                    else if (dexterityModifier < 0)
                        modifierStrings.push(`${dexterityModifier} (-1 * stat modifier of ${defender.name}'s dexterity stat: ${defender.dexterity})`);
                }
                // Apply any of the defender's status effect modifiers that affect the attacker.
                for (let i = 0; i < defender.status.length; i++) {
                    for (let j = 0; j < defender.status[i].statModifiers.length; j++) {
                        const statModifier = defender.status[i].statModifiers[j];
                        // Get defender's modifiers that affect the attacker's roll.
                        if (!statModifier.modifiesSelf) {
                            const tempStatus = new Status(`${defender.name} ${defender.status[i].id}`, null, false, false, [], [], null, null, null, [{ modifiesSelf: true, stat: statModifier.stat, assignValue: statModifier.assignValue, value: statModifier.value }], [], "", "", -1, this.getGame());
                            tempStatuses.push(tempStatus);
                            attacker.inflict(tempStatus);
                        }
                    }
                }
            }

            // Apply attacker's stat modifier.
            if (stat) {
                let statValue = 0;
                if (stat === "str") statValue = attacker.strength;
                else if (stat === "per") statValue = attacker.perception;
                else if (stat === "dex") statValue = attacker.dexterity;
                else if (stat === "spd") statValue = attacker.speed;
                else if (stat === "sta") statValue = attacker.stamina;

                const statModifier = attacker.getStatModifier(statValue);
                modifier += statModifier;
                if (statModifier > 0)
                    modifierStrings.push(`+${statModifier} (stat modifier of ${attacker.name}'s ${stat} stat: ${statValue})`);
                else if (statModifier < 0)
                    modifierStrings.push(`${statModifier} (stat modifier of ${attacker.name}'s ${stat} stat: ${statValue})`);
            }

            // Cure attacker of all tempStatuses.
            for (let i = 0; i < tempStatuses.length; i++)
                attacker.cure(tempStatuses[i]);
        }

        return { number: modifier, strings: modifierStrings };
    }
}
