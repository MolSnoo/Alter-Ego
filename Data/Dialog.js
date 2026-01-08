import { Collection } from "discord.js";
import GameConstruct from "./GameConstruct.js";

/** @typedef {import("./Game.js").default} Game */
/** @typedef {import("./InventoryItem.js").default} InventoryItem */
/** @typedef {import("./Player.js").default} Player */
/** @typedef {import("./Room.js").default} Room */
/** @typedef {import("./Whisper.js").default} Whisper */

/** @typedef {import("discord.js").Attachment} Attachment */
/** @typedef {import("discord.js").Embed} Embed */

/**
 * @class Dialog
 * @classdesc Represents dialog spoken aloud by a player.
 * @extends GameConstruct
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/dialog.html
 */
export default class Dialog extends GameConstruct {
	/**
	 * The message that the dialog originated with.
	 * @type {UserMessage}
	 */
	message;
	/**
	 * The player who spoke the dialog.
	 * @type {Player}
	 */
	speaker;
	/**
	 * The room the dialog occurred in.
	 * @type {Room}
	 */
	location;
	/**
	 * Whether or not the dialog was made by a player in the announcement channel.
	 * @type {boolean}
	 */
	isAnnouncement;
	/**
	 * The whisper the dialog occurred in.
	 * If the dialog was not whispered, this is null.
	 * @type {Whisper}
	 */
	whisper;
	/**
	 * The text content of the message.
	 * @type {string}
	 */
	content;
	/**
	 * A collection of attachments sent with the original message.
	 * @type {Collection<string, Attachment>}
	 */
	attachments;
	/**
	 * An array of embeds sent with the original message.
	 * @type {Embed[]}
	 */
	embeds;
	/**
	 * The display name to represent the speaker.
	 * @type {string}
	 */
	speakerDisplayName;
	/**
	 * The avatar URL to represent the speaker in a webhook.
	 * @type {string}
	 */
	speakerDisplayIcon;
	/**
	 * The voice string that will be used to describe the player's voice to other players. By default, this is the player's voice string.
	 * If the player's voice string is the name of another player, this will instead by the original voice string of the mimicked player.
	 * @type {string}
	 */
	speakerVoiceString;
	/**
	 * The name that will be used to represent the player to other players with the `knows [Player]` behavior attribute. By default, this is the player's name.
	 * If this is not the name of another player, and the speaker's voice string is different from their original voice string, this is "unknown".
	 * @type {string}
	 */
	speakerRecognitionName;
	/**
	 * Whether or not this dialog is considered out-of-character, and thus not true dialog.
	 * @type {boolean}
	 */
	isOOCMessage;
	/**
	 * Whether or not this dialog is being shouted.
	 * If the contents of the message excluding emojis is in all capital letters, and the message contains at least two letters, it is considered shouted.
	 * If this is an OOC message, this is false.
	 * @type {boolean}
	 */
	isShouted;
	/**
	 * A list of adjacent rooms. Excludes any rooms with the `soundproof` tag and any unoccupied rooms.
	 * If the location itself has the `soundproof` tag, or this is an OOC message, this is empty.
	 * @type {Room[]}
	 */
	neighboringRooms;
	/**
	 * A list of rooms in which any occupants have the `acute hearing` behavior attribute.
	 * If this is a whisper, it contains only the dialog's location. Otherwise, it contains all adjacent rooms that don't have the `soundproof` tag.
	 * If this is an OOC message, this is empty.
	 * @type {Room[]}
	 */
	acuteHearingContext;
	/**
	 * Whether or not the location has the `audio surveilled` tag.
	 * If this is an OOC message, this is false.
	 * @type {boolean}
	 */
	locationIsAudioSurveilled;
	/**
	 * Whether or not the location has the `video surveilled` tag.
	 * If this is an OOC message, this is false.
	 * @type {boolean}
	 */
	locationIsVideoSurveilled;
	/**
	 * A list of rooms adjacent to the location with the `audio surveilled` tag.
	 * Any rooms with the `soundproof` tag are excluded.
	 * If this is an OOC message, this is empty.
	 * @type {Room[]}
	 */
	neighboringAudioSurveilledRooms;
	/**
	 * A list of occupied rooms with the `audio monitoring` tag.
	 * If the location or its neighboring rooms don't have the `audio surveilled` tag, or if this is an OOC message, this is empty.
	 * @type {Room[]}
	 */
	audioMonitoringRooms;
	/**
	 * A collection of inventory items that inflict the `receiver` behavior attribute. The key of each entry is the name of the player it belongs to.
	 * If the player doesn't have the `sender` behavior attribute, or if this is an OOC message, this is empty.
	 * @type {Collection<string, InventoryItem>}
	 */
	receivers;
	
	/**
	 * @constructor
	 * @param {Game} game - The game the dialog occurred in.
	 * @param {UserMessage} message - The message that this dialog originated with.
	 * @param {Player} player - The player who spoke the dialog.
	 * @param {Room} location - The room the dialog occurred in.
	 * @param {boolean} [isAnnouncement] - Whether or not the dialog was made by a player in the announcement channel. Defaults to false.
	 * @param {Whisper} [whisper] - The whisper the dialog occurred in. Defaults to null.
	 */
	constructor(game, message, player, location, isAnnouncement = false, whisper = null) {
		super(game);
		this.message = message;
		this.speaker = player;
		this.location = location;
		this.isAnnouncement = isAnnouncement;
		this.whisper = whisper;
		this.content = this.message.content;
		this.attachments = this.message.attachments;
		this.embeds = this.message.embeds;
		this.speakerDisplayName = this.speaker.displayName;
		this.speakerDisplayIcon = this.speaker.displayIcon ? this.speaker.displayIcon : this.speaker.member.displayAvatarURL();
		this.speakerVoiceString = this.speaker.voiceString;
		this.speakerRecognitionName = this.speaker.name;
		if (this.speaker.voiceString !== this.speaker.originalVoiceString) {
			const mimickedPlayer = game.entityFinder.getPlayer(this.speaker.voiceString);
			if (mimickedPlayer) {
				this.speakerVoiceString = mimickedPlayer.originalVoiceString;
				this.speakerRecognitionName = mimickedPlayer.name;
			}
			// If the player's voice descriptor is different but doesn't match the name of another player,
			// set their recognition name to unknown so that other players won't recognize their voice.
			if (this.speakerRecognitionName === this.speaker.name)
				this.speakerRecognitionName = "unknown";
		}
		this.isOOCMessage = message.cleanContent.startsWith('(');
		this.isShouted = false;
		this.neighboringRooms = [];
		this.acuteHearingContext = [];
		this.locationIsAudioSurveilled = false;
		this.locationIsVideoSurveilled = false;
		this.neighboringAudioSurveilledRooms = [];
		this.audioMonitoringRooms = [];
		this.receivers = new Collection();
		// The remaining properties only need to be initialized if the dialog isn't an out-of-character message.
		if (!this.isOOCMessage) {
			const contentWithoutEmotes = message.cleanContent.replace(/<?:.*?:\d*>?/g, '');
			this.isShouted = RegExp("[a-zA-Z](?=(.*)[a-zA-Z])", 'g').test(contentWithoutEmotes) && contentWithoutEmotes === contentWithoutEmotes.toLocaleUpperCase();
			this.neighboringRooms = [];
			if (!this.location.tags.has("soundproof")) {
				for (const exit of this.location.exitCollection.values()) {
					const neighboringRoom = exit.dest;
					// Prevent duplication when two rooms are connected by multiple exits.
					if (this.neighboringRooms.includes(neighboringRoom)) continue;
					if (!neighboringRoom.tags.has("soundproof") && neighboringRoom.occupants.length > 0 && neighboringRoom.id !== this.location.id) {
						this.neighboringRooms.push(neighboringRoom);
						if (neighboringRoom.tags.has("audio surveilled"))
							this.neighboringAudioSurveilledRooms.push(neighboringRoom);
						if (!this.whisper)
							this.acuteHearingContext.push(neighboringRoom);
					}
				}
			}
			if (this.whisper) this.acuteHearingContext.push(this.location);
			this.locationIsAudioSurveilled = this.location.tags.has("audio surveilled");
			this.locationIsVideoSurveilled = this.location.tags.has("video surveilled");
			if (this.locationIsAudioSurveilled || this.neighboringAudioSurveilledRooms.length > 0)
				this.audioMonitoringRooms = game.entityFinder.getRooms(undefined, "audio monitoring", true);
			if (this.speaker.hasBehaviorAttribute("sender")) {
				for (const livingPlayer of game.livingPlayersCollection.values()) {
					if (livingPlayer.hasBehaviorAttribute("receiver") && livingPlayer.name !== this.speaker.name) {
						for (const equipmentSlot of livingPlayer.inventoryCollection.values()) {
							if (equipmentSlot.equippedItem !== null && equipmentSlot.equippedItem.prefab.equippedCommands.join(',').toLowerCase().includes('receiver')) {
								this.receivers.set(livingPlayer.name, equipmentSlot.equippedItem);
							}
						}
					}
				}
			}
		}
	}
}