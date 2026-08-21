// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Description from "./Description.ts";
import type Game from "./Game.ts";
import GameEntity from "./GameEntity.ts";
import type Room from "./Room.ts";

export type ExitField = "name"|"phrase"|"tags"|"x"|"y"|"z"|"unlocked"|"dest"|"link"|"description";

/**
 * Represents an exit in a room.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/exit.html
 */
export default class Exit extends GameEntity implements PersistentGameEntity<ExitField> {
    /**
     * The name of the exit.
     */
    name: string;
    /**
     * A phrase used to refer to the exit in narrations.
     */
    phrase: string;
    /**
     * The tags associated with the exit.
     *
     * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/exit.html#tags
     */
    tags: Set<string>;
    /**
     * The position of the exit.
     */
    pos: Pos;
    /**
     * Whether or not the exit is unlocked.
     */
    unlocked: boolean;
    /**
     * The display name of the room that the exit leads to.
     */
    destDisplayName: string;
    /**
     * The room that the exit leads to.
     */
    dest: Room;
    /**
     * The name of the exit in the destination room that this exit links to.
     */
    link: string;
    /**
     * The description of the room when a player enters from this exit.
     */
    readonly description: Description;

    /**
     * @param name - The name of the exit.
     * @param phrase - A phrase used to refer to the exit in narrations.
     * @param tags - The tags associated with the exit. {@link https://msvblank.github.io/Alter-Ego/reference/data_structures/exit.html#tags}
     * @param pos - The position of the exit.
     * @param unlocked - Whether or not the exit is unlocked.
     * @param destDisplayName - The display name of the room that the exit leads to.
     * @param link - The name of the exit in the destination room that this exit links to.
     * @param description - The description of the room when a player enters from this exit.
     * @param row - The row number of the exit in the sheet.
     * @param game - The game this belongs to.
     */
    constructor(name: string, phrase: string, tags: Set<string>, pos: Pos, unlocked: boolean, destDisplayName: string,
        link: string, description: string, row: number, game: Game) {
        super(game, row);
        this.name = name;
        this.phrase = phrase;
        this.tags = tags;
        this.pos = pos;
        this.unlocked = unlocked;
        this.destDisplayName = destDisplayName;
        this.link = link;
        this.description = new Description(description, this, game);
    }

    /**
     * Gets the exit in the destination room that this exit links to.
     */
    getLinkedExit(): Exit {
        return this.getGame().entityFinder.getExit(this.dest, this.link);
    }

    /**
     * Unlocks the exit.
     */
    unlock(): void {
        this.unlocked = true;
    }

    /**
     * Locks the exit.
     */
    lock(): void {
        this.unlocked = false;
    }

    /**
     * Sets the exit's destination.
     *
     * @param room - The room this exit should lead to.
     * @param exit - The exit in the destination room this exit should lead to.
     */
    setDest(room: Room, exit: Exit): void {
        this.dest = room;
        this.destDisplayName = room.displayName;
        this.link = exit.name;
    }

    /**
     * Gets the args for moving to this exit for an action directive.
     *
     * @param currentLocation - The player's current location.
     * @param isRunning - Whether not the player is running.
     * @returns [currentLocationId, isRunning, exitName]
     */
    getQueueMoveActionDirectiveArgs(currentLocation: Room, isRunning: boolean): [string, string, string] {
        return [currentLocation.id, String(isRunning), this.name];
    }

    /**
     * Gets a phrase to refer to the exit in narrations.
     */
    getNamePhrase(): string {
        if (this.phrase !== "") return this.phrase;
        return this.name.match(/.*\d+$/) ? this.name : `the ${this.name}`;
    }

    /**
     * Gets a phrase to refer to the door in narrations.
     */
    getDoorPhrase(): string {
        const namePhrase = this.getNamePhrase();
        const prefix = namePhrase.match(/.*\d+$/) || namePhrase.toLocaleUpperCase().includes("DOOR") || this.hasTag("not knockable") ? `` : `the door to `;
        return `${prefix}${namePhrase}`;
    }

    /**
     * Returns true if the exit has the given tag.
     */
    hasTag(tag: string): boolean {
        return this.tags.has(tag);
    }

    descriptionCell(): string {
        return this.getGame().constants.roomSheetDescriptionColumn + this.row;
    }

    getEntityID(): string {
        return this.name;
    }

    getLabel(field: ExitField): string {
        switch (field) {
            case "name": return "Exit Name";
            case "phrase": return "Exit Phrase";
            case "tags": return "Exit Tags";
            case "x": return "X";
            case "y": return "Y";
            case "z": return "Z";
            case "unlocked": return "Unlocked?";
            case "dest": return "Leads To Room";
            case "link": return "From Exit";
            case "description": return "Description When Entering From This Exit";
        }
    }

    getValue(field: ExitField): string {
        switch (field) {
            case "name": return this.name;
            case "phrase": return this.phrase;
            case "tags": return Array.from(this.tags).join(", ");
            case "x": return String(this.pos.x);
            case "y": return String(this.pos.y);
            case "z": return String(this.pos.z);
            case "unlocked": return this.unlocked ? "TRUE" : "FALSE";
            case "dest": return this.dest.displayName;
            case "link": return this.link;
            case "description": return this.description.text;
        }
    }

    getViewField(field: ExitField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): "Exit" {
        return "Exit";
    }
}
