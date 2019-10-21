const settings = include('settings.json');

class Object {
    constructor(name, location, accessible, childPuzzleName, isHidingSpot, preposition, description, row) {
        this.name = name;
        this.location = location;
        this.accessible = accessible;
        this.childPuzzleName = childPuzzleName;
        this.childPuzzle = null;
        this.isHidingSpot = isHidingSpot;
        this.preposition = preposition;
        this.description = description;
        this.row = row;
    }

    descriptionCell() {
        return settings.objectSheetDescriptionColumn + this.row;
    }
}

module.exports = Object;
