const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

const _ = require('lodash');

var game = include('game.json');
const queue = game.queue;

module.exports.pushQueue = async function (spreadsheetId, dataOperation) {
    const queuer = this;
    return new Promise(async (resolve, reject) => {
        queuer.cleanQueue();
        var requests = queuer.createRequests();
        if (requests.length > 0) {
            try {
                await sendQueue(requests, spreadsheetId, dataOperation);
                resolve();
            }
            catch (err) {
                reject(err);
            }
        }
        resolve();
    });
};

module.exports.cleanQueue = function () {
    var deleteIndexes = new Array();
    // Combine any subsequent insertData entries.
    for (let i = queue.length - 2; i >= 0; i--) {
        if (queue[i].type === "insertData" && queue[i + 1].type === "insertData" &&
            queue[i].range.substring(0, queue[i].range.indexOf('!')) === queue[i + 1].range.substring(0, queue[i + 1].range.indexOf('!')) &&
            queue[i].startingRow === queue[i + 1].startingRow - 1) {
            queue[i].data = queue[i].data.concat(queue[i + 1].data);
            deleteIndexes.push(i + 1);
        }
    }
    // Group the queue by the range each entry is writing to.
    const groupedQueue = _.groupBy(queue, 'range');
    _.forEach(groupedQueue, function (value) {
        const set = value;
        if (set[0].type !== "insertData") {
            // In each set, sort queue entries by their timestamps.
            set.sort(function (a, b) {
                if (a.timestamp < b.timestamp) return -1;
                if (a.timestamp > b.timestamp) return 1;
                return 0;
            });
            // Add the index of each entry except the last one to the list of indexes to delete.
            for (let i = 0; i < set.length - 1; i++) {
                if (set[i + 1] && set[i].item === set[i + 1].item)
                    deleteIndexes.push(queue.indexOf(set[i]));
            }
        }
    });
    
    // Sort the indexes to delete by decreasing value.
    deleteIndexes.sort((a, b) => b - a);
    // Now delete each one.
    for (let i = 0; i < deleteIndexes.length; i++) {
        const index = deleteIndexes[i];
        queue.splice(index, 1);
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
            case "Recipes":
                sheetId = settings.recipeSheetID;
                break;
            case "Items":
                sheetId = settings.itemSheetID;
                break;
            case "Puzzles":
                sheetId = settings.puzzleSheetID;
                break;
            case "Events":
                sheetId = settings.eventSheetID;
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
            case "Gestures":
                sheetid = settings.gestureSheetID;
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

function sendQueue(requests, spreadsheetId, dataOperation) {
    return new Promise(async (resolve, reject) => {
        try {
            await sheets.batchUpdate(requests, dataOperation, spreadsheetId);
            queue.length = 0;
            resolve();
        }
        catch (err) {
            reject(err);
        }
    });
}
