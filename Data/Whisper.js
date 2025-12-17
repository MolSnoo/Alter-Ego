import Game from './Game.js';
import Narration from '../Data/Narration.js';
import Player from './Player.js';
import Room from './Room.js';
import { addLogMessage, addNarrationToWhisper } from '../Modules/messageHandler.js';
import { ChannelType, TextChannel } from 'discord.js';

/**
 * @class Whisper
 * @classdesc Represents a group of two or more players speaking quietly to each other such that no one else in the room can hear them.
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/whisper.html
 */
export default class Whisper {
    /**
     * The game context this whisper is occuring in. 
     * @readonly
     * @type {Game}
     */
    game;
    /** 
     * The players in the whisper.
     * @type {Player[]}
     */
    players;
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
     * The name that the whisper's channel will be set to. A lowercase, alphabetized list of all the players' displayNames separated by hyphens.
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
     * @param {Game} game - The game context this whisper is occuring in. 
     * @param {Player[]} players - The players in the whisper.
     * @param {string} locationId - The ID of the room the players are whispering in.
     * @param {Room} location - The room the players are whispering in.
     */
    constructor(game, players, locationId, location) {
        this.game = game;
        this.players = players;
        this.locationId = locationId;
        this.location = location;
    }

    /**
     * Sets the location.
     * @param {Room} room
     */
    setLocation(room) {
        this.location = room;
    }
    
    /**
     * Initializes the whisper by creating a channel for it and sending a message to each player in the whisper.
     */
    async init() {
        this.channelName = this.makeChannelName();
        this.channel = await this.createChannel(this.channelName, this.players);

        const playerListString = this.makePlayersSentenceGroup();
        new Narration(this.game, this.players[0], this.location, `${playerListString} begin whispering.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(this.game, `${time} - ${playerListString} began whispering in ${this.location.channel}`);
    }

    /**
     * Makes the channel name for the whisper.
     * @returns {string}
     */
    makeChannelName() {
        /** @type {string[]} */
        let playerList = [];
        for (let i = 0; i < this.players.length; i++)
            playerList.push(this.players[i].displayName.toLowerCase().replace(/ /g, '-'));
        let playerListString = playerList.sort().join('-');
        return `${this.location.id}-${playerListString}`;
    }

    /**
     * Generate a gramatically correct list of players in the whisper.
     * @returns {string}
     */
    makePlayersSentenceGroup() {
        let playerListString = this.players[0].displayName;
        if (this.players.length === 2)
            playerListString += ` and ${this.players[1].displayName}`;
        else if (this.players.length !== 1) {
            for (let i = 1; i < this.players.length - 1; i++)
                playerListString += `, ${this.players[i].displayName}`;
            playerListString += `, and ${this.players[this.players.length - 1].displayName}`;
        }
        return playerListString;
    }

    /**
     * Generate a gramatically correct list of players in the whisper, excluding any players with the given displayName.
     * @param {string} playerDisplayName - The displayName to exclude.
     * @returns {string}
     */
    makePlayersSentenceGroupExcluding(playerDisplayName) {
        const players = this.players.filter(participant => participant.displayName !== playerDisplayName);
        let playerListString = players[0].displayName;
        if (players.length === 2)
            playerListString += ` and ${players[1].displayName}`;
        else if (players.length > 2) {
            for (let i = 1; i < players.length - 1; i++)
                playerListString += `, ${players[i].displayName}`;
            playerListString += `, and ${players[players.length - 1].displayName}`;
        }
        return playerListString;
    }

    /**
     * Creates a channel for the whisper.
     * @param {string} name - The name to give the new channel.
     * @param {Player[]} players - The players who should be given permission to view the channel.
     * @returns {Promise<TextChannel>}
     */
    createChannel(name, players) {
        return new Promise((resolve) => {
            this.game.guildContext.guild.channels.create({
                name: name,
                type: ChannelType.GuildText,
                parent: this.game.guildContext.whisperCategoryId
            }).then(channel => {
                for (let i = 0; i < players.length; i++) {
                    let noChannel = false;
                    if (players[i].hasBehaviorAttribute("hidden") && players[i].getBehaviorAttributeStatusEffects("no channel").length > 1
                        || !players[i].hasBehaviorAttribute("hidden") && players[i].hasBehaviorAttribute("no channel")
                        || players[i].hasBehaviorAttribute("no hearing"))
                        noChannel = true;
                    if (!noChannel && !players[i].isNPC) {
                        channel.permissionOverwrites.create(players[i].id, {
                            ViewChannel: true,
                            ReadMessageHistory: true
                        });
                    }
                }
                resolve(channel);
            });
        });
    }

    /**
     * Removes a player from the whisper.
     * @param {number} index - The index of the player to remove in the whisper's array of players.
     * @param {string} [narration] - The text of the narration to send in the whisper channel when the player is removed.
     * @returns {boolean} Whether the whisper should be deleted.
     */
    removePlayer(index, narration) {
        // Remove the player at index from the whisper.
        this.revokeAccess(this.players[index]);
        this.players.splice(index, 1);
        const newChannelName = this.makeChannelName();

        let deleteWhisper = false;
        if (this.players.length === 0)
            deleteWhisper = true;
        else {
            // Make sure a group with the same set of people doesn't already exist, then rename the channel. If it does exist, just delete this one.
            for (let i = 0; i < this.game.whispers.length; i++) {
                if (this.game.whispers[i].channelName === newChannelName) {
                    deleteWhisper = true;
                    this.channel.lockPermissions();
                    break;
                }
            }
        }
        if (!deleteWhisper) {
            this.channelName = newChannelName;
            this.channel.edit({ name: newChannelName });
            if (narration) addNarrationToWhisper(this, narration);
        }
        return deleteWhisper;
    }

    /**
     * Revoke access to the whisper channel for a player.
     * @param {Player} player
     */
    revokeAccess(player) {
        if (!player.isNPC) {
            this.channel.permissionOverwrites.create(player.id, {
                ViewChannel: null,
                ReadMessageHistory: null
            });
        }
    }

    /**
     * Deletes a whisper.
     * @param {number} index - The index of the whisper in the game's array of whispers.
     */
    delete(index) {
        if (this.game.settings.autoDeleteWhisperChannels) this.channel.delete();
        else {
            this.channel.edit({ name: `archived-${this.location.id}` }).then(channel => {
                channel.lockPermissions();
            });
        }

        this.players.length = 0;
        this.game.whispers.splice(index, 1);
    }
}
