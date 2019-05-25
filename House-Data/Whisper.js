class Whisper {
    constructor(players, location) {
        this.players = players;
        this.location = location;
        this.channelName = this.setChannelName(this.players, this.location);
    }

    setChannelName(players, location) {
        var playerList = new Array();
        for (var i = 0; i < players.length; i++) {
            playerList.push(players[i].name.toLowerCase());
        }
        playerList = playerList.sort().join('-');
        return (location + '-' + playerList);
    }
}

module.exports = Whisper;