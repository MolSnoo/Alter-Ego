const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

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
        sheets.updateCell(this.unlockedCell(), "TRUE");
    }

    lock() {
        this.unlocked = false;
        sheets.updateCell(this.unlockedCell(), "FALSE");
    }

    unlockedCell() {
        return settings.roomSheetUnlockedColumn + this.row;
    }

    descriptionCell() {
        return settings.roomSheetDescriptionColumn + this.row;
    }
}

module.exports = Exit;
