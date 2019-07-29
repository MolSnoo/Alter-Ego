const settings = include('settings.json');

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

    descriptionCell() {
        return settings.objectSheetDescriptionColumn + this.row;
    }
}

module.exports = Object;
