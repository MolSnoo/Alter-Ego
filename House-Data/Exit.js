const settings = require("../settings.json");

const sheets = require('./sheets.js');

class Exit {
    constructor(name, unlocked, dest, link, row) {
        this.name = name;
        this.unlocked = unlocked;
        this.dest = dest;
        this.link = link;
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

    formattedDescriptionCell() {
        return settings.roomSheetFormattedDescriptionColumn + this.row;
    }
    parsedDescriptionCell() {
        return settings.roomSheetParsedDescriptionColumn + this.row;
    }
}

module.exports = Exit;
