const settings = require("../settings.json");

class Player {
    constructor(id, member, name, displayName, talent, clueLevel, alive, location, hidingSpot, status, inventory, row) {
        this.id = id;
        this.member = member;
        this.name = name;
        this.displayName = displayName;
        this.talent = talent;
        this.clueLevel = clueLevel;
        this.alive = alive;
        this.location = location;
        this.hidingSpot = hidingSpot;
        this.status = status;
        this.statusString = "";
        this.attributes;
        this.attributeString = "";
        this.inventory = inventory;
        this.row = row;
    }

    playerCells() {
        const statusColumn = settings.playerSheetStatusColumn.split('!');
        return settings.playerSheetIDColumn + this.row + ":" + statusColumn[1] + this.row;
    }
    locationCell() {
        return settings.playerSheetLocationColumn + this.row;
    }
    hidingSpotCell() {
        return settings.playerSheetHidingSpotColumn + this.row;
    }
    statusCell() {
        return settings.playerSheetStatusColumn + this.row;
    }
}

module.exports = Player;
