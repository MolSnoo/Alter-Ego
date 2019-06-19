const settings = include('settings.json');

class Clue {
    constructor(name, location, accessible, requires, row) {
        this.name = name;
        this.location = location;
        this.accessible = accessible;
        this.requires = requires;
        this.row = row;
    }

    level0DescriptionCell() {
        return settings.clueSheetLevel0DescriptionColumn + this.row;
    }
    level1DescriptionCell() {
        return settings.clueSheetLevel1DescriptionColumn + this.row;
    }
    level2DescriptionCell() {
        return settings.clueSheetLevel2DescriptionColumn + this.row;
    }
    level3DescriptionCell() {
        return settings.clueSheetLevel3DescriptionColumn + this.row;
    }
}

module.exports = Clue;
