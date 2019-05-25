class Exit {
    constructor(name, dest, link, row) {
        this.name = name;
        this.dest = dest;
        this.link = link;
        this.row = row;
    }

    formattedDescriptionCell() {
        return ("Rooms!G" + this.row);
    }
    descriptionCell() {
        return ("Rooms!H" + this.row);
    }
}

module.exports = Exit;