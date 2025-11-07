const constants = require('../Configs/constants.json');

/**
 * @typedef {object} Pos
 * @property {number} x - The x-coordinate of the position.
 * @property {number} y - The y-coordinate of the position.
 * @property {number} z - The z-coordinate of the position.
 */

/**
 * @class Exit
 * @classdesc Represents an exit in a room.
 * @constructor
 * @param {string} name - The name of the exit.
 * @param {Pos} pos - The position of the exit.
 * @param {boolean} unlocked - Whether the exit is unlocked.
 * @param {Room} dest - The destination room of the exit.
 * @param {string} link - The link to the destination room.
 * @param {string} description - The description of the exit.
 * @param {number} row - The row number of the exit in the sheet.
 */
class Exit {
    /**
     * @param {string} name - The name of the exit.
     * @param {Pos} pos - The position of the exit.
     * @param {boolean} unlocked - Whether the exit is unlocked.
     * @param {Room} dest - The destination room of the exit.
     * @param {string} link - The link to the destination room.
     * @param {string} description - The description of the exit.
     * @param {number} row - The row number of the exit in the sheet.
     */
    constructor(name, pos, unlocked, dest, link, description, row) {
        this.name = name;
        this.pos = pos;
        this.unlocked = unlocked;
        this.dest = dest;
        this.link = link;
        this.description = description;
        this.row = row;
    }

    /**
     * Unlocks the exit.
     */
    unlock() {
        this.unlocked = true;
    }

    /**
     * Locks the exit.
     */
    lock() {
        this.unlocked = false;
    }

    /** @returns {string} */
    descriptionCell() {
        return constants.roomSheetDescriptionColumn + this.row;
    }
}

module.exports = Exit;
