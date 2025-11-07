const settings = require('../Configs/settings.json');
const constants = require('../Configs/constants.json');
const serverconfig = require('../Configs/serverconfig.json');

const Narration = require('./Narration.js');

const {ChannelType, TextChannel} = require("../node_modules/discord-api-types/v10");

/**
 * @class Whisper
 * @classdesc Represents a whisper between two or more players.
 * @param {Player[]} players - The players in the whisper.
 * @param {Room} location - The location of the whisper.
 */
class Whisper {
    /**
     * @param {Player[]} players - The players in the whisper.
     * @param {Room} location - The location of the whisper.
     */
    constructor(players, location) {
        this.players = players;
        this.location = location;
    }

    /**
     * Initializes the whisper by creating a channel for it and sending a message to each player in the whisper.
     * @param {Game} game
     * @returns {Promise<void>}
     */
    async init(game) {
        this.channelName = this.makeChannelName();
        this.channel = await this.createChannel(game, this.channelName, this.players);

        let playerListString = this.makePlayersSentenceGroup();
        new Narration(game, this.players[0], this.location, `${playerListString} begin whispering.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${playerListString} began whispering in ${this.location.channel}`);
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
        return `${this.location.name}-${playerListString}`;
    }

    /**
     * Makes a sentence group of the players in the whisper.
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
     * Makes a sentence group of the players in the whisper, excluding the given player.
     * @param {string} playerName
     * @returns {string}
     */
    makePlayersSentenceGroupExcluding(playerName) {
        const players = this.players.filter(participant => participant.displayName !== playerName);
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
     * @param {Game} game
     * @param {string} name
     * @param {Player[]} players
     * @returns {Promise<TextChannel>}
     */
    createChannel(game, name, players) {
        return new Promise((resolve) => {
            game.guild.channels.create({
                name: name,
                type: ChannelType.GuildText,
                parent: serverconfig.whisperCategory
            }).then(channel => {
                for (let i = 0; i < players.length; i++) {
                    let noChannel = false;
                    if (players[i].statusString.includes("hidden") && players[i].getAttributeStatusEffects("no channel").length > 1
                        || !players[i].statusString.includes("hidden") && players[i].hasAttribute("no channel")
                        || players[i].hasAttribute("no hearing"))
                        noChannel = true;
                    if (!noChannel && players[i].talent !== "NPC") {
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
     * @param {Game} game
     * @param {number} index
     * @param {string} message
     * @returns {boolean} - Whether the whisper should be deleted.
     */
    removePlayer(game, index, message) {
        // Remove the player at index from the whisper.
        this.revokeAccess(this.players[index]);
        this.players.splice(index, 1);
        let newName = this.channelName;

        // Make sure a group with the same set of people doesn't already exist, then rename the channel. If it does exist, just delete this one.
        let deleteWhisper = false;
        if (this.players.length === 0)
            deleteWhisper = true;
        else {
            newName = this.makeChannelName();
            for (let i = 0; i < game.whispers.length; i++) {
                if (game.whispers[i].channelName === newName) {
                    deleteWhisper = true;
                    this.channel.lockPermissions();
                    break;
                }
            }
        }
        if (!deleteWhisper) {
            this.channelName = newName;
            this.channel.edit({name: newName});
            if (message) game.messageHandler.addNarrationToWhisper(this, message);
        }
        return deleteWhisper;
    }

    /**
     * Revoke access to the whisper channel for a player.
     * @param {Player} player
     */
    revokeAccess(player) {
        if (player.talent !== "NPC") {
            this.channel.permissionOverwrites.create(player.id, {
                ViewChannel: null,
                ReadMessageHistory: null
            });
        }
    }

    /**
     * Deletes a whisper.
     * @param {Game} game
     * @param {number} index
     */
    delete(game, index) {
        if (settings.autoDeleteWhisperChannels) this.channel.delete();
        else {
            this.channel.edit({name: `archived-${this.location.name}`}).then(channel => {
                channel.lockPermissions();
            });
        }

        this.players.length = 0;
        game.whispers.splice(index, 1);
    }
}

module.exports = Whisper;
