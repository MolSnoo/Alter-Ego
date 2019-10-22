const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

const _ = require('lodash');

var game = include('game.json');
const queue = game.queue;

module.exports.pushQueue = function (spreadsheetId) {
    this.cleanQueue();
    var requests = this.createRequests();
    if (requests.length > 0) sendQueue(requests, spreadsheetId);
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
};

module.exports.createRequests = function () {
    var requests = [];
    for (let i = 0; i < queue.length; i++) {
        if (queue[i].type === "updateCell")
            requests.push({
                "range": queue[i].range,
                "values": [[queue[i].data.toString()]]
            });
        else if (queue[i].type === "updateRow")
            requests.push({
                "range": queue[i].range,
                "values": [queue[i].data]
            });
        else if (queue[i].type === "updateData")
            requests.push({
                "range": queue[i].range,
                "values": queue[i].data
            });
    }
    return requests;
};

function sendQueue(requests, spreadsheetId) {
    sheets.batchUpdate(requests, null, spreadsheetId);
}
