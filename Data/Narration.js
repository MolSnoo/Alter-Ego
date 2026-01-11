import GameConstruct from "./GameConstruct.js";
import Player from "./Player.js";
import UnhideAction from "./Actions/UnhideAction.js";

/** @typedef {import("./Action.js").default} Action */
/** @typedef {import("./Game.js").default} Game */
/** @typedef {import("./Room.js").default} Room */
/** @typedef {import("./Whisper.js").default} Whisper */
/** @typedef {import("discord.js").GuildMember} GuildMember */

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
     * The player whose action is being narrated.
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
     * The whisper the narration is intended for. If the narration is not intended for a whisper, this is null.
     * @readonly
     * @type {Whisper}
     */
    whisper;
    /**
     * The text content for the narration.
     * @type {string}
     */
    content;
    /**
     * The message that the narration originated with, if applicable. If the narration didn't originate with a message, this is null.
     * @readonly
     * @type {UserMessage}
     */
    message;
    /**
     * The player or guild member who wrote the narration, if applicable. If the narration didn't originate with a message, this is null.
     * @readonly
     * @type {Player|GuildMember}
     */
    narrator;
    /**
     * The display name to represent the narrator in a webhook.
     * @readonly
     * @type {string}
     */
    narratorDisplayName;
    /**
     * The avatar URL to represent the narrator in a webhook.
     * @readonly
     * @type {string}
     */
    narratorDisplayIcon;
    /**
	 * Whether or not this narration is considered out-of-character, and thus not a true narration.
	 * @type {boolean}
	 */
    isOOCMessage;
    /**
     * Whether or not the location has the `video surveilled` tag.
     * If this is an OOC message, this is false.
     * @type {boolean}
     */
    locationIsVideoSurveilled;
    /**
	 * A list of occupied rooms with the `video monitoring` tag.
	 * If the location doesn't have the `video surveilled` tag, or if this is an OOC message, this is empty.
	 * @type {Room[]}
	 */
    videoMonitoringRooms;

    /**
     * @constructor
     * @param {Game} game - The game this is for.
     * @param {Action} action - The action being narrated.
     * @param {Player} player - The player whose action is being narrated.
     * @param {Room} location - The room the narration is intended for.
     * @param {string} content - The text content for the narration.
     * @param {Whisper} [whisper] - The whisper the narration is intended for. Defaults to null.
     * @param {UserMessage} [message] - The message that the narration originated with. Defaults to null.
     * @param {Player|GuildMember} [narrator] - The player or guild member who wrote the narration. Defaults to null.
     */
    constructor(game, action, player, location, content, whisper = null, message = null, narrator = null) {
        super(game);
        this.action = action;
        this.player = player;
        this.location = location;
        // Capitalize the first letter of the content, if necessary.
        if (content.charAt(0) === content.charAt(0).toLocaleLowerCase())
			content = content.charAt(0).toLocaleUpperCase() + content.substring(1);
        this.content = content;
        // If no whisper was provided but the player is hidden, find the whisper associated with their hiding spot.
        if (!whisper && this.player && this.player.isHidden()) {
            const hidingSpotFixture = game.entityFinder.getFixture(this.player.hidingSpot, this.player.location.id);
            if (hidingSpotFixture) whisper = hidingSpotFixture.hidingSpot.whisper;
        }
        this.whisper = whisper;
        this.message = message;
        this.isOOCMessage = false;
        this.narrator = narrator;
        if (this.narrator) {
            this.narratorDisplayName = this.narrator.displayName;
            if (this.narrator instanceof Player)
                this.narratorDisplayIcon = this.narrator.displayIcon ? this.narrator.displayIcon : this.narrator.member.displayAvatarURL();
            else this.narratorDisplayIcon = this.narrator.displayAvatarURL();
            this.isOOCMessage = this.content.startsWith('(');
        }
        this.locationIsVideoSurveilled = false;
        this.videoMonitoringRooms = [];
        if (!this.isOOCMessage) {
            this.locationIsVideoSurveilled = this.location.tags.has("video surveilled");
            if (this.locationIsVideoSurveilled)
                this.videoMonitoringRooms = game.entityFinder.getRooms(undefined, "video monitoring", true);
        }
    }

    /**
     * Send the narration. This should always be called when instantiating a narration.
     * @deprecated
     */
    send() {
        if (!this.player || !this.player.isHidden() || this.action instanceof UnhideAction) {
            for (const occupant of this.location.occupants) {
                // Players with the see room attribute should receive all narrations besides their own via DM.
                if (occupant.hasBehaviorAttribute("see room") && occupant.canSee() && !occupant.isHidden()) {
                    if (!this.player || occupant.name !== this.player.name)
                        this.getGame().communicationHandler.notifyPlayer(occupant, this.action, this.content, false);
                }
            }
            this.getGame().communicationHandler.narrateInRoom(this);

            if (this.location.tags.has("video surveilled")) {
                let roomDisplayName = this.location.tags.has("secret") ? "Surveillance feed" : this.location.id;
                this.content = `\`[${roomDisplayName}] ${this.content}\``;
                const rooms = this.getGame().entityFinder.getRooms(null, "video monitoring", true);
                for (let room of rooms) {
                    if (room.id !== this.location.id) {
                        for (let occupant of room.occupants) {
                            if (occupant.hasBehaviorAttribute("see room") && occupant.canSee() && !occupant.isHidden()) {
                                this.getGame().communicationHandler.notifyPlayer(occupant, this.action, this.content, false);
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
                            this.getGame().communicationHandler.notifyPlayer(occupant, this.action, this.content, false);
                    }
                }
                this.getGame().communicationHandler.narrateInWhisper(whisper, this.action, this.content);
            }
        }
    }
}
