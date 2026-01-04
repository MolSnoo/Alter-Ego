import GameConstruct from './GameConstruct.js';
import Room from './Room.js';
import { addNarrationToWhisper } from '../Modules/messageHandler.js';
import { generatePlayerListString } from '../Modules/helpers.js';
import { Collection } from 'discord.js';

/** @typedef {import('./Game.js').default} Game */
/** @typedef {import('./Player.js').default} Player */
/** @typedef {import('discord.js').TextChannel} TextChannel */

/**
 * @class Whisper
 * @classdesc Represents a group of two or more players speaking quietly to each other such that no one else in the room can hear them.
 * @extends GameConstruct
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/whisper.html
 */
export default class Whisper extends GameConstruct {
    /**
     * The unique ID of the whisper.
     * Consists of the location ID, hiding spot name (if it exists), and a lowercase, alphabetized list of all the players' displayNames separated by hyphens.
     * @type {string}
     */
    id;
    /** 
     * The players in the whisper. Deprecated. Use playersCollection instead.
     * @deprecated
     * @type {Player[]}
     */
    players;
    /**
     * A collection of players in the whisper. The key for each entry is the player's name.
     * @type {Collection<string, Player>}
     */
    playersCollection;
    /**
     * The ID of the room the players are whispering in.
     * @readonly
     * @type {string}
     */
    locationId;
    /**
     * The room the players are whispering in.
     * @type {Room}
     */
    location;
    /**
     * The name of the hiding spot the whisper belongs to.
     * @type {string}
     */
    hidingSpotName;
    /**
     * The name that the whisper's channel will be set to.
     * Usually matches the ID, but capped to fit within Discord's channel name character limit.
     * @type {string}
     */
    channelName;
    /**
     * The Discord channel the whisper is occurring in.
     * @type {TextChannel}
     */
    channel;

    /**
     * @constructor
     * @param {Game} game - The game this whisper is occurring in. 
     * @param {Player[]} players - The players in the whisper.
     * @param {string} [hidingSpotName] - The name of the hiding spot the whisper belongs to. Optional.
     */
    constructor(game, players, hidingSpotName) {
        super(game);
        this.players = players;
        this.playersCollection = new Collection();
        for (const player of players)
            this.playersCollection.set(player.name, player);
        if (this.playersCollection.size > 0) {
            this.locationId = this.playersCollection.first().location.id;
            this.location = this.getGame().entityFinder.getRoom(this.locationId);
        } 
        if (hidingSpotName) this.hidingSpotName = hidingSpotName;
        this.id = Whisper.generateValidId(this.playersCollection.map(player => player), this.location, this.hidingSpotName)
        const discordChannelNameCharacterLimit = 100;
        this.channelName = this.id.substring(0, discordChannelNameCharacterLimit);
    }

    /**
     * Sets the location.
     * @param {Room} room
     */
    setLocation(room) {
        this.location = room;
    }

    /**
     * Generate a grammatically correct list of players in the whisper.
     * @param {Player[]} players - The list of players to include in the generated string. Defaults to all players in the whisper.
     * @returns {string}
     */
    generatePlayerListString(players = this.playersCollection.map(player => player)) {
        return generatePlayerListString(players);
    }

    /**
     * Generate a grammatically correct list of players in the whisper, excluding the given player.
     * @param {Player} player - The player to exclude.
     * @returns {string}
     */
    generatePlayerListStringExcluding(player) {
        return this.generatePlayerListString(this.playersCollection.filter(participant => participant.name !== player.name).map(player => player));
    }

    /**
     * Generate a grammatically correct list of players in the whisper, excluding any players with the given displayName.
     * @deprecated
     * @param {string} playerDisplayName - The displayName to exclude.
     * @returns {string}
     */
    generatePlayerListStringExcludingDisplayName(playerDisplayName) {
        return this.generatePlayerListString(this.playersCollection.filter(participant => participant.displayName !== playerDisplayName).map(player => player));
    }

    /**
     * Removes a player from the whisper. If the whisper has no more players after this, or the resulting whisper already exists, deletes the whisper entirely.
     * @param {Player} player - The player to remove.
     * @param {string} [narration] - The text of the narration to send in the whisper channel when the player is removed.
     */
    removePlayer(player, narration) {
        this.revokeChannelAccess(player);
        this.playersCollection.delete(player.name);
        const newId = Whisper.generateValidId(this.playersCollection.map(player => player), this.location, this.hidingSpotName);
        const deleteWhisper = this.playersCollection.size === 0 || this.getGame().whispersCollection.get(newId);
        if (!deleteWhisper) {
            this.getGame().entityLoader.updateWhisperId(this, newId);
            if (narration) addNarrationToWhisper(this, narration);
        }
        else this.getGame().entityLoader.deleteWhisper(this);
    }

    /**
     * Revoke access to the whisper channel for a player.
     * @param {Player} player
     */
    revokeChannelAccess(player) {
        if (!player.isNPC) this.channel.permissionOverwrites.delete(player.id);
    }

    /**
     * Generate an ID in all lowercase with 
     * @param {Player[]} players - The players in the whisper.
     * @param {Room} location - The location of the whisper.
     * @param {string} [hidingSpotName] - The name of the hiding spot associated with the whisper, if applicable.
     */
    static generateValidId(players, location, hidingSpotName) {
        const locationString = `${location.id}-`;
        const hidingSpotString = hidingSpotName ? `${hidingSpotName}-` : ``;
        const playerListString = players.map(player => player.displayName).sort().join('-');
        return Room.generateValidId(`${locationString}${hidingSpotString}${playerListString}`);
    }
}
