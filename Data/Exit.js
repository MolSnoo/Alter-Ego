import Game from './Game.js';
import GameEntity from './GameEntity.js';
import Room from './Room.js';

/**
 * @class Exit
 * @classdesc Represents an exit in a room.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/exit.html
 */
export default class Exit extends GameEntity {
    /** 
     * The name of the exit.
     * @type {string}
     */
    name;
    /**
     * The position of the exit.
     * @type {Pos}
     */
    pos;
    /**
     * Whether or not the exit is unlocked.
     * @type {boolean}
     */
    unlocked;
    /**
     * The display name of the room that the exit leads to.
     * @type {string}
     */
    destDisplayName;
    /**
     * The room that the exit leads to.
     * @type {Room}
     */
    dest;
    /**
     * The name of the exit in the destination room that this exit links to.
     * @type {string}
     */
    link;
    /**
     * The description of the room when a player enters from this exit.
     * @type {string}
     */
    description;

    /**
     * @constructor
     * @param {string} name - The name of the exit.
     * @param {Pos} pos - The position of the exit.
     * @param {boolean} unlocked - Whether or not the exit is unlocked.
     * @param {string} destDisplayName - The display name of the room that the exit leads to.
     * @param {string} link - The name of the exit in the destination room that this exit links to.
     * @param {string} description - The description of the room when a player enters from this exit.
     * @param {number} row - The row number of the exit in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(name, pos, unlocked, destDisplayName, link, description, row, game) {
        super(game, row);
        this.name = name;
        this.pos = pos;
        this.unlocked = unlocked;
        this.destDisplayName = destDisplayName;
        this.link = link;
        this.description = description;
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

    /**
     * Gets a phrase to refer to the exit in narrations.
     */
    getNamePhrase() {
        return this.name === "DOOR" ? `the DOOR` : this.name.includes("DOOR") ? this.name : `the door to ${this.name}`;
    }

    /** @returns {string} */
    descriptionCell() {
        return this.getGame().constants.roomSheetDescriptionColumn + this.row;
    }

    /**
     * Make any string a valid Exit name.
     * @param {string} name - A string, preferably the name of an exit.
     */
    static generateValidName(name) {
        return name.toUpperCase().trim();
    }
}
