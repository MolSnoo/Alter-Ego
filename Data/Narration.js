import { addNarration, addNarrationToWhisper } from "../Modules/messageHandler.js";
import GameConstruct from "./GameConstruct.js";

/** @typedef {import("./Game.js").default} Game */
/** @typedef {import("./Player.js").default} Player */
/** @typedef {import("./Room.js").default} Room */
/** @typedef {import("./Whisper.js").default} Whisper */

/**
 * @class Narration
 * @classdesc Represents a narration in the game. After instantiating a narration, the send method must be called.
 * @extends GameConstruct
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/narration.html
 */
export default class Narration extends GameConstruct {
    /**
     * The player who triggered the narration.
     * @readonly
     * @type {Player}
     */
    player;
    /**
     * The room the narration is intended for.
     * @readonly
     * @type {Room}
     */
    location;
    /**
     * The text content for the narration.
     * @readonly
     * @type {string}
     */
    message;

    /**
     * @constructor
     * @param {Game} game - The game this is for.
     * @param {Player} player - The player who triggered the narration.
     * @param {Room} location - The room the narration is intended for.
     * @param {string} message - The text content for the narration.
     */
^    constructor(game, player, location, message) {
        super(game);
^        this.player = player;
^        this.location = location;
^        this.message = message;
^    }
^
    /**
     * Send the narration. This should always be called when instantiating a narration.
     */
^    send() {
        if (!this.player || !this.player.hasBehaviorAttribute("hidden") || this.message === `${this.player.displayName} comes out of the ${this.player.hidingSpot}.`) {
            for (let occupant of this.location.occupants) {
^                // Players with the see room attribute should receive all narrations besides their own via DM.
                if (occupant.hasBehaviorAttribute("see room") && !occupant.hasBehaviorAttribute("no sight") && !occupant.hasBehaviorAttribute("hidden")) {
                    if (!this.player || occupant.name !== this.player.name)
                        occupant.notify(this.message, false);
^                }
^            }
            addNarration(this.location, this.message, true);

            if (this.location.tags.includes("video surveilled")) {
                let roomDisplayName = this.location.tags.includes("secret") ? "Surveillance feed" : this.location.id;
                let message = `\`[${roomDisplayName}] ${this.message}\``;
                const rooms = this.getGame().entityFinder.getRooms(null, "video monitoring", true);
                for (let room of rooms) {
                    if (room.id !== this.location.id) {
                        for (let occupant of room.occupants) {
                            if (occupant.hasBehaviorAttribute("see room") && !occupant.hasBehaviorAttribute("no sight") && !occupant.hasBehaviorAttribute("hidden")) {
                                occupant.notify(message, false);
                            }
                        }
                        addNarration(room, message, true);
                    }
                }
            }
^        }
        else if (this.player.hasBehaviorAttribute("hidden")) {
            // Find the whisper channel the player is in, if there is one.
            /** @type {Whisper} */
            let whisper = null;
            for (let gameWhisper of this.getGame().whispersCollection.values()) {
                for (let occupant of gameWhisper.playersCollection.values()) {
                    if (occupant.name === this.player.name) {
                        whisper = gameWhisper;
                        break;
                    }
                }
                if (whisper !== null) break;
            }
            if (whisper) {
                for (let occupant of whisper.playersCollection.values()) {
                    // Players who don't have access to the whisper channel should receive all narrations besides their own via DM.
                    if (!occupant.hasBehaviorAttribute("no sight") && !occupant.isNPC
                        && (occupant.hasBehaviorAttribute("see room") || !occupant.member.permissionsIn(whisper.channel).has("ViewChannel"))) {
                        if (!this.player || occupant.name !== this.player.name)
                            occupant.notify(this.message, false);
                    }
                }
                addNarrationToWhisper(whisper, this.message, true);
            }
        }
^    }
^}
