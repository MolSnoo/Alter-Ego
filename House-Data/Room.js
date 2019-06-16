const settings = require("../settings.json");
const sheets = require('./sheets.js');
const Narration = require('./Narration.js');

class Room {
    constructor(name, accessible, channel, exit, row) {
        this.name = name;
        this.accessible = accessible;
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
            if (entrance) descriptionCell = entrance.parsedDescriptionCell();
            else descriptionCell = this.parsedDescriptionCell();
            // Send the room description of the entrance the player enters from.
            sheets.getData(descriptionCell, function (response) {
                player.member.send(response.data.values[0][0]);
            });
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
    accessibilityCell() {
        return settings.roomSheetAccessibilityColumn + this.row;
    }
    formattedDescriptionCell() {
        return settings.roomSheetFormattedDescriptionColumn + this.row;
    }
    parsedDescriptionCell() {
        return settings.roomSheetParsedDescriptionColumn + this.row;
    }
}

module.exports = Room;
