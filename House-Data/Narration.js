const settings = require("../settings.json");

class Narration {
    constructor(game, player, location, message) {
        this.game = game;
        this.player = player;
        this.location = location;
        this.message = message;
    }

    send() {
        this.location.channel.send(this.message);
        return;
    }
}

module.exports = Narration;
