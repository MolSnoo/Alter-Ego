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

    descriptionCell() {
        return settings.roomSheetDescriptionColumn + this.row;
    }
}

module.exports = Exit;
