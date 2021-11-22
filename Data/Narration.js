const settings = include('settings.json');

class Narration {
    constructor(game, player, location, message) {
        this.game = game;
        this.player = player;
        this.location = location;
        this.message = message;
    }

    send() {
        if (!this.player || !this.player.hasAttribute("hidden") || this.message === `${this.player.displayName} comes out of the ${this.player.hidingSpot}.`) {
            for (let i = 0; i < this.location.occupants.length; i++) {
                let occupant = this.location.occupants[i];
                // Players with the see room attribute should receive all narrations besides their own via DM.
                if (occupant.hasAttribute("see room") && !occupant.hasAttribute("no sight") && !occupant.hasAttribute("hidden")) {
                    if (!this.player || occupant.name !== this.player.name)
                        occupant.notify(this.game, this.message, false);
                }
            }
            this.game.messageHandler.addNarration(this.location, this.message, true);
        }
        return;
    }
}

module.exports = Narration;
