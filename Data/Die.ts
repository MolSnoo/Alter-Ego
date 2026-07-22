// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Game from "./Game.ts";
import GameConstruct from "./GameConstruct.ts";
import type Player from "./Player.ts";
import Status from "./Status.ts";

interface ModifierResult {
    /** The total modifier value. */
    number: number;
    /** The modifier strings. */
    strings: string[];
}

/**
 * Represents a die that can be rolled for a semi-random number.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/die.html
 */
export default class Die extends GameConstruct {
    /**
     * The minimum possible base roll.
     */
    min: number;
    /**
     * The maximum possible base roll.
     */
    max: number;
    /**
     * The result of the die roll with no modifiers applied.
     */
    baseRoll: number;
    /**
     * The calculated number to add to the baseRoll.
     */
    modifier: number;
    /**
     * A string representation of all modifiers applied to the baseRoll, as well as the reasons they were applied.
     */
    modifierString: string;
    /**
     * The final result of the die roll.
     */
    result: number;

    /**
     * @param game - The game context this roll is occurring in.
     * @param stat - The name of the stat to roll for.
     * @param attacker - The active player to roll for. In other words, the player attempting an action.
     * @param defender - The passive player to roll for. Only used if the attacker is attempting to perform an action against another player.
     * @param min - The minimum possible roll. Defaults to diceMin in the game's settings.
     * @param max - The maximum possible roll. Defaults to diceMax in the game's settings.
     */
    constructor(game: Game, stat?: string, attacker?: Player, defender?: Player, min: number = game.settings.diceMin, max: number = game.settings.diceMax) {
        super(game);

        this.min = min;
        this.max = max;

        let baseRoll: number;
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
     *
     * @param min - The minimum possible roll. Defaults to diceMin in the game's settings.
     * @param max - The maximum possible roll. Defaults to diceMax in the game's settings.
     * @returns A random number between min and max, inclusive.
     */
    doBaseRoll(min: number = this.min, max: number = this.max): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Calculates the modifiers to apply to the base roll.
     *
     * @param stat - The stat which will modify the base roll.
     * @param attacker - The active player to roll for. In other words, the player attempting an action.
     * @param defender - The passive player to roll for. Only used if the attacker is attempting to perform an action against another player.
     */
    calculateModifiers(stat?: string, attacker?: Player, defender?: Player): ModifierResult {
        let modifier = 0;
        let modifierStrings: string[] = [];
        if (attacker) {
            if (attacker.hasBehaviorAttribute("coin flipper")) {
                let hasCoin = false;
                const hands = this.getGame().entityFinder.getPlayerHands(attacker);
                for (const hand of hands) {
                    if (hand.equippedItem === null) continue;
                    if (hand.equippedItem.name.includes("COIN"))
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

            let tempStatuses: Status[] = [];
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
                for (const status of defender.status.values()) {
                    for (const modifier of status.statModifiers) {
                        // Get defender's modifiers that affect the attacker's roll.
                        if (!modifier.modifiesSelf) {
                            const tempStatus = new Status(`${defender.name} ${status.id}`, "", null, false, false, [], [], null, null, null, [{ modifiesSelf: true, stat: modifier.stat, assignValue: modifier.assignValue, value: modifier.value }], new Set(), "", "", -1, this.getGame());
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
