const settings = require("../settings.json");

class Exit {
    constructor(name, dest, link, row) {
        this.name = name;
        this.dest = dest;
        this.link = link;
        this.row = row;
    }

    formattedDescriptionCell() {
        return settings.roomSheetFormattedDescriptionColumn + this.row;
    }
    parsedDescriptionCell() {
        return settings.roomSheetParsedDescriptionColumn + this.row;
    }
}

module.exports = Exit;
