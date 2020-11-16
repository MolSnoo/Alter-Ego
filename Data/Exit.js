const settings = include('settings.json');

class Exit {
    constructor(name, pos, unlocked, dest, link, description, row) {
        this.name = name;
        this.pos = pos;
        this.unlocked = unlocked;
        this.dest = dest;
        this.link = link;
        this.description = description;
        this.row = row;
    }

    unlock() {
        this.unlocked = true;
    }

    lock() {
        this.unlocked = false;
    }

    unlockedCell() {
        return settings.roomSheetUnlockedColumn + this.row;
    }

    destinationCell() {
        return settings.roomSheetLeadsToColumn + this.row;
    }

    fromCell() {
        return settings.roomSheetFromColumn + this.row;
    }

    descriptionCell() {
        return settings.roomSheetDescriptionColumn + this.row;
    }
}

module.exports = Exit;
