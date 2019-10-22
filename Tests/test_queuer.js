const settings = include('settings.json');
const queuer = include(`${settings.modulesDir}/queuer.js`);

var game = include('game.json');
const queue = game.queue;

var assert = require('assert');

const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

exports.run = function () {
    test_constructor();
    test_cleanQueue_0();
    test_cleanQueue_1();
    test_cleanQueue_2();
    test_cleanQueue_3();

    test_createRequests_0();

    test_pushQueue_0();
    return;
};

function test_constructor() {
    const timestamp = Date.now();
    const entry = new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test");
    
    assert.ok(entry.timestamp === timestamp, entry.timestamp);
    assert.ok(entry.type === "updateCell", entry.type);
    assert.ok(entry.range === "Sheet1!A1", entry.range);
    assert.ok(entry.data === "Test", entry.data);
}

function test_cleanQueue_0() {
    queue.length = 0;
    const timestamp = Date.now();
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test1"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "Test A"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test2"));

    const result = [
        new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "Test A"),
        new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test2")
    ];
    queuer.cleanQueue();
    assert.ok(
        arraysEqual(queue, result),
        queue
    );
}

function test_cleanQueue_1() {
    queue.length = 0;
    const timestamp = Date.now();
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test1"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "Test A"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test2"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "Test B"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test3"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A3", "Test"));

    const result = [
        new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "Test B"),
        new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test3"),
        new QueueEntry(timestamp, "updateCell", "Sheet1!A3", "Test")
    ];
    queuer.cleanQueue();
    assert.ok(
        arraysEqual(queue, result),
        queue
    );
}

function test_cleanQueue_2() {
    queue.length = 0;
    const timestamp = Date.now();
    queue.push(new QueueEntry(timestamp, "updateData", "Sheet1!A1", "Test1"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test2"));

    const result = [
        new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test2")
    ];
    queuer.cleanQueue();
    assert.ok(
        arraysEqual(queue, result),
        queue
    );
}

function test_cleanQueue_3() {
    queue.length = 0;
    const timestamp = Date.now();
    queue.push(new QueueEntry(timestamp, "updateData", "Sheet1!A1:B1", [["Test A", "Test B"]]));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test2"));

    const result = [
        new QueueEntry(timestamp, "updateData", "Sheet1!A1:B1", [["Test A", "Test B"]]),
        new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "Test2")
    ];
    queuer.cleanQueue();
    assert.ok(
        arraysEqual(queue, result),
        queue
    );
}

function test_createRequests_0() {
    queue.length = 0;
    const timestamp = Date.now();
    queue.push(new QueueEntry(timestamp, "updateData", "Sheet1!A1:B2", [["Test A", "Test B"], ["Test C", "Test D"]]));
    queue.push(new QueueEntry(timestamp, "updateRow", "Sheet1!C1:C3", ["Test E", "Test F", "Test G"]));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!D1", 1));

    const result = [
        {
            "range": "Sheet1!A1:B2",
            "values": [["Test A", "Test B"], ["Test C", "Test D"]]
        },
        {
            "range": "Sheet1!C1:C3",
            "values": [["Test E", "Test F", "Test G"]]
        },
        {
            "range": "Sheet1!D1",
            "values": [["1"]]
        }
    ];
    const actual = queuer.createRequests();
    assert.ok(
        arraysEqual(result, actual),
        actual
    );
}

function test_pushQueue_0() {
    queue.length = 0;
    const timestamp = Date.now();
    queue.push(new QueueEntry(timestamp, "updateData", "Sheet1!A1:B2", [["Test A", "Test B"], ["Test C", "Test D"]]));
    queue.push(new QueueEntry(timestamp, "updateRow", "Sheet1!C1:E1", ["Test E", "Test F", "Test G"]));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A4", 1));

    queuer.pushQueue("13z3_2ZYUfmB1CiSAxmK70S3viR-LxlaDKvCwo-Bkqeg");
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (typeof a[i] === "object" && typeof b[i] === "object" && !objectsEqual(a[i], b[i])) return false;
        else if (Array.isArray(a[i]) && Array.isArray(b[i]) && !arraysEqual(a[i], b[i])) return false;
        else if (typeof a[i] !== "object" && !Array.isArray(a[i]) && a[i] !== b[i]) return false;
    }
    return true;
}

function objectsEqual(x, y) {
    var equal = true;
    for (var propertyName in x) {
        if (typeof x[propertyName] === "object" && typeof y[propertyName] === "object") {
            if (!objectsEqual(x[propertyName], y[propertyName])) {
                equal = false;
                break;
            }
        }
        else if (Array.isArray(x[propertyName]) && Array.isArray(y[propertyName])) {
            if (!arraysEqual(x[propertyName], y[propertyName])) {
                equal = false;
                break;
            }
        }
        else if (x[propertyName] !== y[propertyName]) {
            equal = false;
            break;
        }
    }
    return equal;
}
