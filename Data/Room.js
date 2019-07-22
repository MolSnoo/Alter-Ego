const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

const Narration = include(`${settings.dataDir}/Narration.js`);

class Room {
    constructor(name, channel, exit, row) {
        this.name = name;
        this.channel = channel;
        this.exit = exit;
        this.row = row;

        this.occupants = new Array();
    }

    addPlayer(game, player, entrance, entranceMessage, sendDescription) {
        player.location = this;
        if (entranceMessage) new Narration(game, player, this, entranceMessage).send();
        
        if (player.getAttributeStatusEffects("no channel").length === 0)  
            this.joinChannel(player);

        if (sendDescription) {
            if (player.hasAttribute("no sight"))
                player.member.send("Fumbling against the wall, you make your way to the next room over.");
            else {
                let descriptionCell;
                if (entrance) descriptionCell = entrance.parsedDescriptionCell();
                else descriptionCell = this.parsedDescriptionCell();
                // Send the room description of the entrance the player enters from.
                sheets.getData(descriptionCell, function (response) {
                    player.member.send(response.data.values[0][0]);
                });
            }
        }
        if (player.hasAttribute("see occupants") && !player.hasAttribute("no sight") && this.occupants.length > 0) {
            let occupants = new Array();
            for (let i = 0; i < this.occupants.length; i++) {
                if (!this.occupants[i].hasAttribute("hidden"))
                    occupants.push(this.occupants[i]);
            }
            if (occupants.length > 0) {
                let occupantsString = occupants.map(player => player.displayName).join(", ");
                player.member.send(`Players in the room: ${occupantsString}.`);
            }
        }
        else if (!player.hasAttribute("no sight") && this.occupants.length > 0) {
            let concealedPlayers = new Array();
            for (let i = 0; i < this.occupants.length; i++) {
                if (this.occupants[i].hasAttribute("concealed") && !this.occupants[i].hasAttribute("hidden"))
                    concealedPlayers.push(this.occupants[i]);
            }
            if (concealedPlayers.length > 0) {
                let concealedPlayersString = concealedPlayers.map(player => player.displayName).join(", ");
                player.member.send(`In this room you see: ${concealedPlayersString}.`);
            }
        }

        // Update the player's location on the spreadsheet.
        sheets.updateCell(player.locationCell(), this.name);

        this.occupants.push(player);
        this.occupants.sort(function (a, b) {
            var nameA = a.name.toLowerCase();
            var nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
    }
    removePlayer(game, player, exit, exitMessage) {
        if (exitMessage) new Narration(game, player, this, exitMessage).send();
        this.leaveChannel(player);
        this.occupants.splice(this.occupants.indexOf(player), 1);
        player.removeFromWhispers(game, `${player.displayName} leaves the room.`);
    }

    joinChannel(player) {
        this.channel.overwritePermissions(player.member, { VIEW_CHANNEL: true });
    }

    leaveChannel(player) {
        this.channel.overwritePermissions(player.member, { VIEW_CHANNEL: null });
    }

    unlock(game, index) {
        this.exit[index].unlock();
        if (this.occupants.length > 0) new Narration(game, null, this, `${this.exit[index].name} unlocks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.exit[index].name} in ${this.channel} was unlocked.`);
    }

    lock(game, index) {
        this.exit[index].lock();
        if (this.occupants.length > 0) new Narration(game, null, this, `${this.exit[index].name} locks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.exit[index].name} in ${this.channel} was locked.`);
    }

    formattedDescriptionCell() {
        return settings.roomSheetFormattedDescriptionColumn + this.row;
    }
    parsedDescriptionCell() {
        return settings.roomSheetParsedDescriptionColumn + this.row;
    }
}

module.exports = Room;
