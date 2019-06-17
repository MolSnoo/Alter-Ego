const settings = require("../settings.json");

class Die {
    constructor(attacker, defender) {
        this.min = settings.diceMin;
        this.max = settings.diceMax;

        let baseRoll;
        if (attacker && attacker.hasAttribute("all or nothing")) {
            // Make the base roll either the minimum or maximum possible.
            baseRoll = this.doBaseRoll(0, 1);
            baseRoll = baseRoll * (this.max - 1);
            baseRoll += this.min;
        }
        else baseRoll = this.doBaseRoll();
        this.baseRoll = baseRoll;

        let modifiers = this.calculateModifiers(attacker, defender);
        this.modifier = modifiers.number;
        this.modifierString = modifiers.strings.join(", ");
        this.result = this.baseRoll + this.modifier;
    }

    doBaseRoll(min, max) {
        if (min === null || min === undefined) min = this.min;
        if (max === null || max === undefined) max = this.max;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    calculateModifiers(attacker, defender) {
        var modifier = 0;
        var modifierStrings = [];
        if (attacker) {
            if (attacker.hasAttribute("coin flipper")) {
                let hasCoin = false;
                for (let i = 0; i < attacker.inventory.length; i++) {
                    if (attacker.inventory[i].name === "COIN") {
                        hasCoin = true;
                        break;
                    }
                }
                if (hasCoin) {
                    const coinModifier = this.doBaseRoll(0, 1);
                    if (coinModifier === 1) {
                        modifier += coinModifier;
                        modifierStrings.push("+1 (coin flip)");
                    }
                }
            }

            // Get attacker's modifiers.
            for (let i = 0; i < attacker.status.length; i++) {
                if (attacker.status[i].modifiesSelf) {
                    modifier += attacker.status[i].rollModifier;
                    if (attacker.status[i].rollModifier > 0)
                        modifierStrings.push(`+${attacker.status[i].rollModifier} (${attacker.status[i].name})`);
                    else if (attacker.status[i].rollModifier < 0)
                        modifierStrings.push(`${attacker.status[i].rollModifier} (${attacker.status[i].name})`);
                }
            }

            if (defender) {
                for (let i = 0; i < defender.status.length; i++) {
                    // Get defender's modifiers that affect the attacker's roll.
                    if (!defender.status[i].modifiesSelf) {
                        modifier += defender.status[i].rollModifier;
                        if (defender.status[i].rollModifier > 0)
                            modifierStrings.push(`+${defender.status[i].rollModifier} (${defender.name} ${defender.status[i].name})`);
                        else if (defender.status[i].rollModifier < 0)
                            modifierStrings.push(`${defender.status[i].rollModifier} (${defender.name} ${defender.status[i].name})`);
                    }
                    // Now invert any of the defender's modifiers and add them to the attacker's roll.
                    else {
                        modifier += -1 * defender.status[i].rollModifier;
                        if (defender.status[i].rollModifier > 0)
                            modifierStrings.push(`${-1 * defender.status[i].rollModifier} (${defender.name} ${defender.status[i].name})`);
                        else if (defender.status[i].rollModifier < 0)
                            modifierStrings.push(`+${-1 * defender.status[i].rollModifier} (${defender.name} ${defender.status[i].name})`);
                    }
                }
            }
        }

        return { number: modifier, strings: modifierStrings };
    }
}

module.exports = Die;
