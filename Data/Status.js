import GameEntity from './GameEntity.js';

/** @typedef {import('./Game.js').default} Game */
/** @typedef {import('../Classes/Timer.js').default} Timer */

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
     * @type {import('luxon').Duration}
     */
    duration;
    /** 
     * The amount of time remaining until the status expires. If the status has no duration, this is `null`.
     * @type {import('luxon').Duration} 
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
     * The behavior attributes this status applies to the player. Deprecated. Use behaviorAttributes instead.
     * @deprecated
     * @readonly
     * @type {string[]}
     */
    attributes;
    /**
     * The behavior attributes this status applies to the player.
     * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/status.html#behavior-attributes
     * @readonly
     * @type {Set<string>}
     */
    behaviorAttributes;
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
     * @type {Timer} 
     */
    timer;

    /**
     * @constructor
     * @param {string} id - The unique ID of the status.
     * @param {import('luxon').Duration} duration - The duration representing how long it takes for the status to expire after it is inflicted. Accepted units: s, m, h, d, w, M, y.
     * @param {boolean} fatal - Whether the status kills an inflicted player when it expires. If the status has a nextStage, this is never checked.
     * @param {boolean} visible - Whether the status is visible to the player.
     * @param {string[]} overridersStrings - The IDs of statuses that prevent this status from being inflicted.
     * @param {string[]} curesStrings - The IDs of statuses that cure this status when they are inflicted.
     * @param {string} nextStageId - The ID of the status that will be inflicted on the player when this one expires.
     * @param {string} duplicatedStatusId - The ID of the status that this Status will turn into if it is inflicted on a player who already has it.
     * @param {string} curedConditionId - The ID of the status that will be inflicted on the player if this one is cured.
     * @param {StatModifier[]} statModifiers - Stat modifiers to apply to the player. {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/status.html#stat-modifiers}
     * @param {Set<string>} behaviorAttributes - The behavior attributes this status applies to the player. {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/status.html#behavior-attributes}
     * @param {string} inflictedDescription - The description of the status when a player is inflicted with it.
     * @param {string} curedDescription - The description of the status when a player is cured of it.
     * @param {number} row - The row number of the status in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(id, duration, fatal, visible, overridersStrings, curesStrings, nextStageId, duplicatedStatusId, curedConditionId, statModifiers, behaviorAttributes, inflictedDescription, curedDescription, row, game) {
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
        this.nextStage = null;
        this.duplicatedStatusId = duplicatedStatusId;
        this.duplicatedStatus = null;
        this.curedConditionId = curedConditionId;
        this.curedCondition = null;
        this.statModifiers = statModifiers;
        this.behaviorAttributes = behaviorAttributes;
        this.attributes = Array.from(behaviorAttributes);
        this.inflictedDescription = inflictedDescription;
        this.curedDescription = curedDescription;

        this.timer = null;
    }

    /**
     * Sets the next stage.
     * @param {Status} nextStage 
     */
    setNextStage(nextStage) {
        this.nextStage = nextStage;
    }

    /**
     * Sets the duplicated status.
     * @param {Status} duplicatedStatus 
     */
    setDuplicatedStatus(duplicatedStatus) {
        this.duplicatedStatus = duplicatedStatus;
    }

    /**
     * Sets the cured condition.
     * @param {Status} curedCondition 
     */
    setCuredCondition(curedCondition) {
        this.curedCondition = curedCondition;
    }

    inflictedCell() {
        return this.getGame().constants.statusSheetInflictedColumn + this.row;
    }

    curedCell() {
        return this.getGame().constants.statusSheetCuredColumn + this.row;
    }

    /**
     * Generate an ID in all lowercase.
     * @param {string} id 
     */
    static generateValidId(id) {
        return id.toLowerCase().trim();
    }
}
