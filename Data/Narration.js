import Game from "./Game.js";
import Player from "./Player.js";
import Room from "./Room.js";
import Whisper from "./Whisper.js";
import { addNarration, addNarrationToWhisper } from "../Modules/messageHandler.js";

/**
 * @class Narration
 * @classdesc Represents a narration in the game. After instantiating a narration, the send method must be called.
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/narration.html
 */
export default class Narration {
    /**
     * The game this is for.
     * @readonly
     * @type {Game}
     */
    game;
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
    constructor(game, player, location, message) {
        this.game = game;
        this.player = player;
        this.location = location;
        this.message = message;
    }

    /**
     * Send the narration. This should always be called when instantiating a narration.
     */
    send() {
        if (!this.player || !this.player.hasAttribute("hidden") || this.message === `${this.player.displayName} comes out of the ${this.player.hidingSpot}.`) {
            for (let i = 0; i < this.location.occupants.length; i++) {
                let occupant = this.location.occupants[i];
                // Players with the see room attribute should receive all narrations besides their own via DM.
                if (occupant.hasAttribute("see room") && !occupant.hasAttribute("no sight") && !occupant.hasAttribute("hidden")) {
                    if (!this.player || occupant.name !== this.player.name)
                        occupant.notify(this.message, false);
                }
            }
            addNarration(this.location, this.message, true);

            if (this.location.tags.includes("video surveilled")) {
                let roomDisplayName = this.location.tags.includes("secret") ? "Surveillance feed" : this.location.id;
                let message = `\`[${roomDisplayName}] ${this.message}\``;
                for (let i = 0; i < this.game.rooms.length; i++) {
                    if (this.game.rooms[i].tags.includes("video monitoring") && this.game.rooms[i].occupants.length > 0 && this.game.rooms[i].id !== this.location.id) {
                        for (let j = 0; j < this.game.rooms[i].occupants.length; j++) {
                            let occupant = this.game.rooms[i].occupants[j];
                            if (occupant.hasAttribute("see room") && !occupant.hasAttribute("no sight") && !occupant.hasAttribute("hidden")) {
                                occupant.notify(message, false);
                            }
                        }
                        addNarration(this.game.rooms[i], message, true);
                    }
                }
            }
        }
        else if (this.player.hasAttribute("hidden")) {
            // Find the whisper channel the player is in, if there is one.
            /** @type {Whisper} */
            let whisper = null;
            for (let i = 0; i < this.game.whispers.length; i++) {
                for (let j = 0; j < this.game.whispers[i].players.length; j++) {
                    if (this.game.whispers[i].players[j].name === this.player.name) {
                        whisper = this.game.whispers[i];
                        break;
                    }
                }
                if (whisper !== null) break;
            }
            if (whisper) {
                for (let i = 0; i < whisper.players.length; i++) {
                    let occupant = whisper.players[i];
                    // Players who don't have access to the whisper channel should receive all narrations besides their own via DM.
                    if (!occupant.hasAttribute("no sight") && !occupant.isNPC && (occupant.hasAttribute("see room") || !occupant.member.permissionsIn(whisper.channel).has("ViewChannel"))) {
                        if (!this.player || occupant.name !== this.player.name)
                            occupant.notify(this.message, false);
                    }
                }
                addNarrationToWhisper(whisper, this.message, true);
            }
        }
        return;
    }
}
