const settings = include('settings.json');

const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

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

    setAccessible(game) {
        this.accessible = true;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.accessibleCell(), "TRUE"));
    }

    setInaccessible(game) {
        this.accessible = false;
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.accessibleCell(), "FALSE"));
    }

    accessibleCell() {
        return settings.objectSheetAccessibleColumn + this.row;
    }

    descriptionCell() {
        return settings.objectSheetDescriptionColumn + this.row;
    }
}

module.exports = Object;
