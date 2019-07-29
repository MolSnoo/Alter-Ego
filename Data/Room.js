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
        this.occupantsString = "";
    }

    addPlayer(game, player, entrance, entranceMessage, sendDescription) {
        player.location = this;
        if (entranceMessage) new Narration(game, player, this, entranceMessage).send();
        
        if (player.getAttributeStatusEffects("no channel").length === 0)  
            this.joinChannel(player);

        if (sendDescription) {
            let descriptionCell;
            if (entrance) descriptionCell = entrance.descriptionCell();
            else descriptionCell = this.descriptionCell();
            // Send the room description of the entrance the player enters from.
            player.sendDescription(descriptionCell);
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
        this.occupantsString = this.occupants.map(player => player.name).join(", ");
    }
    removePlayer(game, player, exit, exitMessage) {
        if (exitMessage) new Narration(game, player, this, exitMessage).send();
        this.leaveChannel(player);
        this.occupants.splice(this.occupants.indexOf(player), 1);
        this.occupantsString = this.occupants.map(player => player.name).join(", ");
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

    descriptionCell() {
        return settings.roomSheetDescriptionColumn + this.row;
    }
}

module.exports = Room;
