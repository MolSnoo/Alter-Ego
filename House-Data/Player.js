class Player {
    constructor(id, name, talent, clueLevel, alive, location, hidingSpot, status, inventory, row) {
        this.id = id;
        this.name = name;
        this.talent = talent;
        this.clueLevel = clueLevel;
        this.alive = alive;
        this.location = location;
        this.hidingSpot = hidingSpot;
        this.status = status;
        this.statusString = "";
        this.inventory = inventory;
        this.row = row;
    }

    playerCells() {
        return ("Players!A" + this.row + ":H" + this.row);
    }
    locationCell() {
        return ("Players!F" + this.row);
    }
    hidingSpotCell() {
        return ("Players!G" + this.row);
    }
    statusCell() {
        return ("Players!H" + this.row);
    }
}

module.exports = Player;