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
        else if (this.player.hasAttribute("hidden")) {
            // Find the whisper channel the player is in, if there is one.
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
                    if (!occupant.hasAttribute("no sight") && occupant.talent !== "NPC" && (occupant.hasAttribute("see room") || !occupant.member.permissionsIn(whisper.channel).has("ViewChannel"))) {
                        if (!this.player || occupant.name !== this.player.name)
                            occupant.notify(this.game, this.message, false);
                    }
                }
                this.game.messageHandler.addNarrationToWhisper(whisper, this.message, true);
            }
        }
        return;
    }
}

module.exports = Narration;
