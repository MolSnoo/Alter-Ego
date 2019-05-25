class Room {
    constructor(name, accessible, exit, row) {
        this.name = name;
        this.accessible = accessible;
        this.exit = exit;
        this.row = row;

        this.occupants = new Array();
        this.occupantsString = "";
    }

    addPlayer(player) {
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
    removePlayer(player) {
        this.occupants.splice(this.occupants.indexOf(player), 1);
        this.occupantsString = this.occupants.map(player => player.name).join(", ");
    }
    accessibilityCell() {
        return ("Rooms!B" + this.row);
    }
    formattedDescriptionCell() {
        return ("Rooms!G" + this.row);
    }
    descriptionCell() {
        return ("Rooms!H" + this.row);
    }
}

module.exports = Room;