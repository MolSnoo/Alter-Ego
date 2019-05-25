class Object {
    constructor(name, location, accessible, requires, isHidingSpot, preposition, row) {
        this.name = name;
        this.location = location;
        this.accessible = accessible;
        this.requires = requires;
        this.isHidingSpot = isHidingSpot;
        this.preposition = preposition;
        this.row = row;
    }

    formattedDescriptionCell() {
        return ("Objects!G" + this.row);
    }

    descriptionCell() {
        return ("Objects!H" + this.row);
    }
}

module.exports = Object;