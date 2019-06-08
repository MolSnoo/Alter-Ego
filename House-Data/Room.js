const settings = require("../settings.json");
const sheets = require('./sheets.js');

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

    addPlayer(player, entrance) {
        player.location = this;
        let entranceMessage;
        let descriptionCell;
        if (entrance) {
            entranceMessage = player.name + " enters from " + entrance.name + ".";
            descriptionCell = entrance.descriptionCell();
        }
        else {
            entranceMessage = player.name + " suddenly appears.";
            descriptionCell = this.parsedDescriptionCell();
        }
        this.channel.send(entranceMessage);
        this.joinChannel(player);

        // Send the room description of the entrance the player enters from.
        sheets.getData(descriptionCell, function (response) {
            player.member.send(response.data.values[0][0]);
        });

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
    removePlayer(player, exit) {
        let exitMessage;
        if (exit) exitMessage = player.name + " exits into " + exit.name + ".";
        else exitMessage = player.name + " suddenly disappears.";
        this.channel.send(exitMessage);
        this.leaveChannel(player);
        this.occupants.splice(this.occupants.indexOf(player), 1);
        this.occupantsString = this.occupants.map(player => player.name).join(", ");
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
