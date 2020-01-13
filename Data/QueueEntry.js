class QueueEntry {
    constructor(timestamp, type, range, item, data) {
        this.timestamp = timestamp;
        this.type = type;
        this.range = range;
        this.item = item;
        this.data = data;
        this.startingRow = this.getStartingRow();
    }

    getStartingRow() {
        const sheetRangeArgs = this.range.split('!');
        let rowNumber;
        for (let j = sheetRangeArgs[1].length - 1; j >= 0; j--) {
            if (isNaN(parseInt(sheetRangeArgs[1].charAt(j))))
                rowNumber = parseInt(sheetRangeArgs[1].substring(j + 1));
        }
        return rowNumber;
    }
}

module.exports = QueueEntry;
