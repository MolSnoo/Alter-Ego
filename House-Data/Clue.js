class Clue {
    constructor(name, location, accessible, requires, row) {
        this.name = name;
        this.location = location;
        this.accessible = accessible;
        this.requires = requires;
        this.row = row;
    }

    level0DescriptionCell() {
        return ("Clues!E" + this.row);
    }
    level1DescriptionCell() {
        return ("Clues!F" + this.row);
    }
    level2DescriptionCell() {
        return ("Clues!G" + this.row);
    }
    level3DescriptionCell() {
        return ("Clues!H" + this.row);
    }
}

module.exports = Clue;