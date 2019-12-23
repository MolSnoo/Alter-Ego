const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

const _ = require('lodash');

var game = include('game.json');
const queue = game.queue;

module.exports.pushQueue = async function (spreadsheetId) {
    this.cleanQueue();
    var requests = this.createRequests();
    if (requests.length > 0) await sendQueue(requests, spreadsheetId);
};

module.exports.cleanQueue = function () {
    // Group the queue by the range each entry is writing to.
    const groupedQueue = _.groupBy(queue, 'range');
    var deleteIndexes = new Array();
    _.forEach(groupedQueue, function (value) {
        const set = value;
        // In each set, sort queue entries by their timestamps.
        set.sort(function (a, b) {
            if (a.timestamp < b.timestamp) return -1;
            if (a.timestamp > b.timestamp) return 1;
            return 0;
        });
        // Add the index of each entry except the last one to the list of indexes to delete.
        for (let i = 0; i < set.length - 1; i++)
            deleteIndexes.push(queue.indexOf(set[i]));
    });
    // Sort the indexes to delete by decreasing value.
    deleteIndexes.sort((a, b) => b - a);
    // Now delete each one.
    for (let i = 0; i < deleteIndexes.length; i++) {
        const index = deleteIndexes[i];
        queue.splice(index, 1);
    }
    // Detect insertData entries and update subsequent rows accordingly.
    for (let i = 0; i < queue.length; i++) {
        // Get all of the insertData requests before this entry.
        const inserts = queue.filter(
            entry =>
                entry.type === "insertData" &&
                entry.range.substring(0, entry.range.indexOf('!')) === queue[i].range.substring(0, queue[i].range.indexOf('!')) &&
                entry.startingRow < queue[i].startingRow
        );
        if (inserts.length > 0) {
            console.log(queue[i]);
            let insertedRows = inserts.reduce(function (total, insert) {
                return total + insert.data.length;
            }, 0);
            console.log(insertedRows);
            // We need a regex that will match only the given number, not any numbers containing this number.
            let regex = "/(?<!\\d)" + queue[i].startingRow + "(?!\\d)/g";
            queue[i].range = queue[i].range.replace(eval(regex), queue[i].startingRow + insertedRows);
            console.log(queue[i]);
        }
    }
};

module.exports.createRequests = function () {
    var requests = [];
    for (let i = 0; i < queue.length; i++) {
        const sheetrangeArgs = queue[i].range.split('!');
        const sheetName = sheetrangeArgs[0];
        let sheetId;
        switch (sheetName) {
            case "Rooms":
                sheetId = settings.roomSheetID;
                break;
            case "Objects":
                sheetId = settings.objectSheetID;
                break;
            case "Prefabs":
                sheetId = settings.prefabSheetID;
                break;
            case "Items":
                sheetId = settings.itemSheetID;
                break;
            case "Puzzles":
                sheetId = settings.puzzleSheetID;
                break;
            case "Status Effects":
                sheetId = settings.statusEffectSheetID;
                break;
            case "Players":
                sheetId = settings.playerSheetID;
                break;
            case "Inventory Items":
                sheetId = settings.inventoryItemSheetID;
                break;
            default:
                sheetId = 0;
                break;
        }
        // Find the row number.
        let rowNumber;
        for (let j = sheetrangeArgs[1].length - 1; j >= 0; j--) {
            if (isNaN(parseInt(sheetrangeArgs[1].charAt(j)))) {
                rowNumber = parseInt(sheetrangeArgs[1].substring(j + 1)) - 1;
            }
        }
        // Find the column number. We do this by taking the index of the letter in the alphabet.
        let columnLetter = sheetrangeArgs[1].charAt(0);
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let columnNumber = alphabet.indexOf(columnLetter);
        if (columnNumber === -1) columnNumber = 0;

        if (queue[i].type === "updateCell") {
            requests.push({
                "pasteData": {
                    "data": queue[i].data.toString(),
                    "type": "PASTE_NORMAL",
                    "delimiter": "@@@",
                    "coordinate": {
                        "sheetId": sheetId,
                        "columnIndex": columnNumber,
                        "rowIndex": rowNumber
                    }
                }
            });
        }
        else if (queue[i].type === "updateRow") {
            requests.push({
                "pasteData": {
                    "data": queue[i].data.join("@@@"),
                    "type": "PASTE_NORMAL",
                    "delimiter": "@@@",
                    "coordinate": {
                        "sheetId": sheetId,
                        "columnIndex": columnNumber,
                        "rowIndex": rowNumber
                    }
                }
            });
        }
        else if (queue[i].type === "updateData") {
            for (let j = 0; j < queue[i].data.length; j++) {
                requests.push({
                    "pasteData": {
                        "data": queue[i].data[j].join("@@@"),
                        "type": "PASTE_NORMAL",
                        "delimiter": "@@@",
                        "coordinate": {
                            "sheetId": sheetId,
                            "columnIndex": columnNumber,
                            "rowIndex": rowNumber + j
                        }
                    }
                });
            }
        }
        else if (queue[i].type === "insertData") {
            requests.push({
                "insertRange": {
                    "range": {
                        "sheetId": sheetId,
                        "startRowIndex": rowNumber + 1,
                        "endRowIndex": rowNumber + 1 + queue[i].data.length
                    },
                    "shiftDimension": "ROWS"
                }
            });
            for (let j = 0; j < queue[i].data.length; j++) {
                requests.push({
                    "pasteData": {
                        "data": queue[i].data[j].join("@@@"),
                        "type": "PASTE_NORMAL",
                        "delimiter": "@@@",
                        "coordinate": {
                            "sheetId": sheetId,
                            "columnIndex": columnNumber,
                            "rowIndex": rowNumber + j + 1
                        }
                    }
                });
            }
        }
    }
    return requests;
};

function sendQueue(requests, spreadsheetId) {
    sheets.batchUpdate(requests, null, spreadsheetId);
    queue.length = 0;
}
