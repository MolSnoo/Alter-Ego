const constants = include('Configs/constants.json');

/**
 * @import {Duration} from "../bot.js"
 */

/**
 * @typedef {object} StatModifier
 * @property {boolean} modifiesSelf - Whether the stat modifier modifies the player's own stat.
 * @property {string} stat - The stat to modify.
 * @property {boolean} assignValue - Whether it assigns the value or adds to it.
 * @property {number} value - The value to assign or add.
 */

/**
 * @class Status
 * @classdesc Represents a status effect in the game.
 * @constructor
 * @param {string} name - The name of the status.
 * @param {Duration} duration - The duration of the status.
 * @param {boolean} fatal - Whether the status is fatal.
 * @param {boolean} visible - Whether the status is visible.
 * @param {Status[]} overriders - Statuses that override this status.
 * @param {Status[] | null} cures - Statuses that cure this status.
 * @param {Status | null} nextStage - The next stage of the status.
 * @param {Status | null} duplicatedStatus - The Status that an instance of this Status will develop into if it is inflicted on a Player who already has an instance of this Status Effect.
 * @param {Status | null} curedCondition - Status that an instance of this Status will develop into if it is cured.
 * @param {StatModifier[]} statModifiers - Stat modifiers to apply to the player.
 * @param {string} attributes - The behavior attributes to apply to the player.
 * @param {string} inflictedDescription - The description of the status when inflicted.
 * @param {string} curedDescription - The description of the status when cured.
 * @param {number} row - The row number of the status in the sheet.
 */
class Status {
    /**
     * @param {string} name - The name of the status.
     * @param {Duration} duration - The duration of the status.
     * @param {boolean} fatal - Whether the status is fatal.
     * @param {boolean} visible - Whether the status is visible.
     * @param {Status[]} overriders - Statuses that override this status.
     * @param {Status[] | null} cures - Statuses that cure this status.
     * @param {Status | null} nextStage - The next stage of the status.
     * @param {Status | null} duplicatedStatus - The Status that an instance of this Status will develop into if it is inflicted on a Player who already has an instance of this Status Effect.
     * @param {Status | null} curedCondition - Status that an instance of this Status will develop into if it is cured.
     * @param {StatModifier[]} statModifiers - Stat modifiers to apply to the player.
     * @param {string} attributes - The behavior attributes to apply to the player.
     * @param {string} inflictedDescription - The description of the status when inflicted.
     * @param {string} curedDescription - The description of the status when cured.
     * @param {number} row - The row number of the status in the sheet.
     */
    constructor(name, duration, fatal, visible, overriders, cures, nextStage, duplicatedStatus, curedCondition, statModifiers, attributes, inflictedDescription, curedDescription, row) {
        this.name = name;
        this.duration = duration;
        this.remaining = null;
        this.fatal = fatal;
        this.visible = visible;
        this.overriders = overriders;
        this.cures = cures;
        this.nextStage = nextStage;
        this.duplicatedStatus = duplicatedStatus;
        this.curedCondition = curedCondition;
        this.statModifiers = statModifiers;
        this.attributes = attributes;
        this.inflictedDescription = inflictedDescription;
        this.curedDescription = curedDescription;
        this.row = row;

        /** @type {Duration | null} */
        this.timer = null;
    }

    /** @returns {string} */
    inflictedCell() {
        return constants.statusSheetInflictedColumn + this.row;
    }

    /** @returns {string} */
    curedCell() {
        return constants.statusSheetCuredColumn + this.row;
    }
}

module.exports = Status;
