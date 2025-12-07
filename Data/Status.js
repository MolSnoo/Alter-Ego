import Game from './Game.js';
import GameEntity from './GameEntity.js';
import timer from 'moment-timer';

/**
 * @class Status
 * @classdesc Also referred to as a StatusEffect. Represents a condition that can be applied to a player.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/status.html
 */
export default class Status extends GameEntity {
    /**
     * The unique ID of the status.
     * @readonly
     * @type {string}
     */
    id;
    /**
     * The name of the status. Deprecated. Use `id` instead.
     * @deprecated
     * @readonly
     * @type {string}
     */
    name;
    /**
     * The duration representing how long it takes for the status to expire after it is inflicted. Accepted units: s, m, h, d, w, M, y. If there is none, this is `null`.
     * @readonly
     * @type {import('moment').Duration}
     */
    duration;
    /** 
     * The amount of time remaining until the status expires. If the status has no duration, this is `null`.
     * @type {import('moment').Duration} 
     */
    remaining;
    /**
     * Whether the status kills an inflicted player when it expires. If the status has a nextStage, this is never checked.
     * @readonly
     * @type {boolean}
     */
    fatal;
    /**
     * Whether the status is visible to the player.
     * @readonly
     * @type {boolean}
     */
    visible;
    /**
     * The IDs of statuses that prevent this status from being inflicted.
     * @readonly
     * @type {string[]}
     */
    overridersStrings;
    /**
     * Statuses that prevent this status from being inflicted.
     * @type {Status[]}
     */
    overriders;
    /**
     * The IDs of statuses that cure this status when they are inflicted.
     * @readonly
     * @type {string[]}
     */
    curesStrings;
    /**
     * Statuses that cure this status when they are inflicted.
     * @type {Status[]}
     */
    cures;
    /**
     * The ID of the status that will be inflicted on the player when this one expires.
     * @readonly
     * @type {string}
     */
    nextStageId;
    /**
     * The status that will be inflicted on the player when this one expires.
     * @type {Status}
     */
    nextStage;
    /**
     * The ID of the status that this Status will turn into if it is inflicted on a player who already has it.
     * @readonly
     * @type {string}
     */
    duplicatedStatusId;
    /**
     * The status that this Status will turn into if it is inflicted on a player who already has it.
     * @type {Status}
     */
    duplicatedStatus;
    /**
     * The ID of the status that will be inflicted on the player if this one is cured.
     * @readonly
     * @type {string}
     */
    curedConditionId;
    /**
     * The status that will be inflicted on the player if this one is cured.
     * @type {Status}
     */
    curedCondition;
    /**
     * Stat modifiers to apply to the player.
     * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/status.html#stat-modifiers
     * @readonly
     * @type {StatModifier[]}
     */
    statModifiers;
    /**
     * The behavior attributes this status applies to the player.
     * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/status.html#behavior-attributes
     * @readonly
     * @type {string[]}
     */
    attributes;
    /**
     * The description of the status when a player is inflicted with it.
     * @readonly
     * @type {string}
     */
    inflictedDescription;
    /**
     * The description of the status when a player is cured of it.
     * @readonly
     * @type {string}
     */
    curedDescription;
    /** 
     * A timer counting down every second until the status expires.
     * @type {timer} 
     */
    timer;

    /**
     * @constructor
     * @param {string} id - The unique ID of the status.
     * @param {import('moment').Duration} duration - The duration representing how long it takes for the status to expire after it is inflicted. Accepted units: s, m, h, d, w, M, y.
     * @param {boolean} fatal - Whether the status kills an inflicted player when it expires. If the status has a nextStage, this is never checked.
     * @param {boolean} visible - Whether the status is visible to the player.
     * @param {string[]} overridersStrings - The IDs of statuses that prevent this status from being inflicted.
     * @param {string[]} curesStrings - The IDs of statuses that cure this status when they are inflicted.
     * @param {string} nextStageId - The ID of the status that will be inflicted on the player when this one expires.
     * @param {string} duplicatedStatusId - The ID of the status that this Status will turn into if it is inflicted on a player who already has it.
     * @param {string} curedConditionId - The ID of the status that will be inflicted on the player if this one is cured.
     * @param {StatModifier[]} statModifiers - Stat modifiers to apply to the player. {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/status.html#stat-modifiers}
     * @param {string[]} attributes - The behavior attributes this status applies to the player. {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/status.html#behavior-attributes}
     * @param {string} inflictedDescription - The description of the status when a player is inflicted with it.
     * @param {string} curedDescription - The description of the status when a player is cured of it.
     * @param {number} row - The row number of the status in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(id, duration, fatal, visible, overridersStrings, curesStrings, nextStageId, duplicatedStatusId, curedConditionId, statModifiers, attributes, inflictedDescription, curedDescription, row, game) {
        super(game, row);
        this.id = id;
        this.name = id;
        this.duration = duration;
        this.remaining = null;
        this.fatal = fatal;
        this.visible = visible;
        this.overridersStrings = overridersStrings;
        this.overriders = new Array(this.overridersStrings.length);
        this.curesStrings = curesStrings;
        this.cures = new Array(this.curesStrings.length);
        this.nextStageId = nextStageId;
        this.duplicatedStatusId = duplicatedStatusId;
        this.curedConditionId = curedConditionId;
        this.statModifiers = statModifiers;
        this.attributes = attributes;
        this.inflictedDescription = inflictedDescription;
        this.curedDescription = curedDescription;

        this.timer = null;
    }


    inflictedCell() {
        return this.game.constants.statusSheetInflictedColumn + this.row;
    }

    curedCell() {
        return this.game.constants.statusSheetCuredColumn + this.row;
    }

    /**
     * Generate a name in all lowercase.
     * @param {string} name 
     */
    static generateValidId(name) {
        return name.toLowerCase().trim();
    }
}
