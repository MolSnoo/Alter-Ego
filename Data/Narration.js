import GameConstruct from "./GameConstruct.js";

/** @typedef {import("./Action.js").default} Action */
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
     * The action being narrated.
     * @readonly
     * @type {Action}
     */
    action;
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
     * @type {string}
     */
    message;

    /**
     * @constructor
     * @param {Game} game - The game this is for.
     * @param {Action} action - The action being narrated.
     * @param {Player} player - The player who triggered the narration.
     * @param {Room} location - The room the narration is intended for.
     * @param {string} message - The text content for the narration.
     */
    constructor(game, action, player, location, message) {
        super(game);
        this.action = action;
        this.player = player;
        this.location = location;
        this.message = message;
    }

    /**
     * Send the narration. This should always be called when instantiating a narration.
     */
    send() {
        if (!this.player || !this.player.isHidden() || this.message === `${this.player.displayName} comes out of the ${this.player.hidingSpot}.`) {
            for (let occupant of this.location.occupants) {
                // Players with the see room attribute should receive all narrations besides their own via DM.
                if (occupant.hasBehaviorAttribute("see room") && occupant.canSee() && !occupant.isHidden()) {
                    if (!this.player || occupant.name !== this.player.name)
                        this.getGame().communicationHandler.notifyPlayer(occupant, this.action, this.message, false);
                }
            }
            this.getGame().communicationHandler.narrateInRoom(this);

            if (this.location.tags.has("video surveilled")) {
                let roomDisplayName = this.location.tags.has("secret") ? "Surveillance feed" : this.location.id;
                this.message = `\`[${roomDisplayName}] ${this.message}\``;
                const rooms = this.getGame().entityFinder.getRooms(null, "video monitoring", true);
                for (let room of rooms) {
                    if (room.id !== this.location.id) {
                        for (let occupant of room.occupants) {
                            if (occupant.hasBehaviorAttribute("see room") && occupant.canSee() && !occupant.isHidden()) {
                                this.getGame().communicationHandler.notifyPlayer(occupant, this.action, this.message, false);
                            }
                        }
                        this.getGame().communicationHandler.narrateInRoom(this);
                    }
                }
            }
        }
        else if (this.player.isHidden()) {
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
                    if (occupant.canSee() && !occupant.isNPC
                        && (occupant.hasBehaviorAttribute("see room") || !occupant.member.permissionsIn(whisper.channel).has("ViewChannel"))) {
                        if (!this.player || occupant.name !== this.player.name)
                            this.getGame().communicationHandler.notifyPlayer(occupant, this.action, this.message, false);
                    }
                }
                this.getGame().communicationHandler.narrateInWhisper(whisper, this.action, this.message);
            }
        }
    }
}
