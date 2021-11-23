const settings = include('settings.json');

const Narration = include(`${settings.dataDir}/Narration.js`);

class Whisper {
    constructor(players, location) {
        this.players = players;
        this.location = location;
    }
    
    async init(game) {
        this.channelName = this.makeChannelName();
        this.channel = await this.createChannel(game, this.channelName, this.players);

        let playerListString = this.makePlayersSentenceGroup();
        new Narration(game, this.players[0], this.location, `${playerListString} begin whispering.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${playerListString} began whispering in ${this.location.channel}`);
    }

    makeChannelName() {
        var playerList = new Array();
        for (var i = 0; i < this.players.length; i++)
            playerList.push(this.players[i].displayName.toLowerCase());
        playerList = playerList.sort().join('-');
        return `${this.location.name}-${playerList}`;
    }

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

    createChannel(game, name, players) {
        return new Promise((resolve) => {
            game.guild.channels.create(name, {
                type: 'text',
                parent: settings.whisperCategory
            }).then(channel => {
                for (let i = 0; i < players.length; i++) {
                    if (players[i].talent !== "NPC") {
                        channel.createOverwrite(players[i].id, {
                            VIEW_CHANNEL: true,
                            READ_MESSAGE_HISTORY: true
                        });
                    }
                }
                resolve(channel);
            });
        });
    }

    removePlayer(game, index, message) {
        // Remove the player at index from the whisper.
        this.revokeAccess(this.players[index]);
        this.players.splice(index, 1);

        // Make sure a group with the same set of people doesn't already exist, then rename the channel. If it does exist, just delete this one.
        var deleteWhisper = false;
        if (this.players.length === 0)
            deleteWhisper = true;
        else {
            var newName = this.makeChannelName();
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
            this.channel.edit({ name: newName });
            if (message) game.messageHandler.addNarrationToWhisper(this, message);
        }
        return deleteWhisper;
    }

    revokeAccess(player) {
        if (player.talent !== "NPC") {
            this.channel.createOverwrite(player.id, {
                VIEW_CHANNEL: null,
                READ_MESSAGE_HISTORY: null
            });
        }
        return;
    }

    delete(game, index) {
        if (settings.autoDeleteWhisperChannels) this.channel.delete();
        else {
            this.channel.edit({ name: `archived-${this.location.name}` }).then(channel => {
                channel.lockPermissions();
            });
        }

        this.players.length = 0;
        game.whispers.splice(index, 1);
        return;
    }
}

module.exports = Whisper;
