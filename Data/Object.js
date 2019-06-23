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

    formattedDescriptionCell() {
        return settings.objectSheetFormattedDescriptionColumn + this.row;
    }

    parsedDescriptionCell() {
        return settings.objectSheetParsedDescriptionColumn + this.row;
    }
}

module.exports = Object;
