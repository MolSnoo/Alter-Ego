/**
 * @class Gesture
 * @classdesc Represents a gesture in the game.
 * @constructor
 * @param {string} name - The name of the gesture.
 * @param {string[]} requires - Data types the gesture can take as a target.
 * @param {string[]} disabledStatusesStrings - Statuses that prevent the gesture from being used.
 * @param {string} description - The description of the gesture.
 * @param {string} narration - Narration that will be parsed and sent to the player's room when the gesture is performed.
 * @param {number} row - The row number of the gesture in the sheet.
 */
class Gesture {
    /**
     * @param {string} name - The name of the gesture.
     * @param {string[]} requires - Data types the gesture can take as a target.
     * @param {string[]} disabledStatusesStrings - Statuses that prevent the gesture from being used.
     * @param {string} description - The description of the gesture.
     * @param {string} narration - Narration that will be parsed and sent to the player's room when the gesture is performed.
     * @param {number} row - The row number of the gesture in the sheet.
     */
    constructor(name, requires, disabledStatusesStrings, description, narration, row) {
        this.name = name;
        this.requires = requires;
        this.disabledStatusesStrings = disabledStatusesStrings;
        /** @type {string[] | Status[]} */
        this.disabledStatuses = [...disabledStatusesStrings];
        this.description = description;
        this.narration = narration;
        this.row = row;

        /** @type {string} */
        this.targetType = "";
        this.target = null;
    }
}

module.exports = Gesture;
