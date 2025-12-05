import Exit from "./Exit.js";
import { default as Fixture } from "./Object.js";
import Game from "./Game.js";
import GameEntity from "./GameEntity.js";
import InventoryItem from "./InventoryItem.js";
import Item from "./Item.js";
import Player from "./Player.js";
import Status from "./Status.js";

/**
 * @class Gesture
 * @classdesc Represents a form of body language that a player can use to communicate nonverbally.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/gesture.html
 */
export default class Gesture extends GameEntity {
    /**
     * The unique ID of the gesture.
     * @type {string}
     */
    id;
    /**
     * The name of the gesture. Deprecated. Use `id` instead.
     * @deprecated
     * @type {string}
     */
    name;
    /**
     * Data types the gesture can take as a target.
     * @type {string[]}
     */
    requires;
    /**
     * The string representation of status effects that prevent the gesture from being used.
     * @type {string[]}
     */
    disabledStatusesStrings;
    /**
     * Status effects that prevent the gesture from being used.
     * @type {Status[]}
     */
    disabledStatuses;
    /**
     * The description of the gesture shown in the list of gestures.
     * @type {string}
     */
    description;
    /**
     * Narration that will be parsed and sent to the player's room when the gesture is performed.
     * @type {string}
     */
    narration;
    /**
     * A string indicating the data type of the gesture's target.
     * This allows the gesture’s narration to contain conditional formatting based on the data type of the target.
     * @type {string}
     */
    targetType;
    /**
     * The game entity the player chose to target.
     * @type {Exit|Fixture|Item|Player|InventoryItem|null}
     */
    target;

    /**
     * @constructor
     * @param {string} id - The unique ID of the gesture.
     * @param {string[]} requires - Data types the gesture can take as a target.
     * @param {string[]} disabledStatusesStrings - The string representation of status effects that prevent the gesture from being used.
     * @param {string} description - The description of the gesture shown in the list of gestures.
     * @param {string} narration - Narration that will be parsed and sent to the player's room when the gesture is performed.
     * @param {number} row - The row number of the gesture on the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(id, requires, disabledStatusesStrings, description, narration, row, game) {
        super(game, row);
        this.id = id;
        this.name = id;
        this.requires = requires;
        this.disabledStatusesStrings = disabledStatusesStrings;
        this.disabledStatuses = [];
        this.description = description;
        this.narration = narration;

        this.targetType = "";
        this.target = null;
    }
}
