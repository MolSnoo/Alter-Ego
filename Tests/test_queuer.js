const settings = include('settings.json');
const queuer = include(`${settings.modulesDir}/queuer.js`);
const sheets = include(`${settings.modulesDir}/sheets.js`);

var game = include('game.json');
const queue = game.queue;

var assert = require('assert');

const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

exports.run = async function () {
    test_constructor();
    test_cleanQueue_0();
    test_cleanQueue_1();
    test_cleanQueue_2();
    test_cleanQueue_3();
    test_cleanQueue_4();

    test_createRequests_0();
    
    //await test_pushQueue_0();
    //await test_pushQueue_1();
    return;
};

function test_constructor() {
    const timestamp = Date.now();
    const entry = new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test");
    
    assert.ok(entry.timestamp === timestamp, entry.timestamp);
    assert.ok(entry.type === "updateCell", entry.type);
    assert.ok(entry.range === "Sheet1!A1", entry.range);
    assert.ok(entry.data === "Test", entry.data);
}

function test_cleanQueue_0() {
    queue.length = 0;
    const timestamp = Date.now();
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test1"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "", "Test A"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test2"));

    const result = [
        new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "", "Test A"),
        new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test2")
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
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test1"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "", "Test A"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test2"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "", "Test B"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test3"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A3", "", "Test"));

    const result = [
        new QueueEntry(timestamp, "updateCell", "Sheet1!A2", "", "Test B"),
        new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test3"),
        new QueueEntry(timestamp, "updateCell", "Sheet1!A3", "", "Test")
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
    queue.push(new QueueEntry(timestamp, "updateData", "Sheet1!A1", "", "Test1"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test2"));

    const result = [
        new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test2")
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
    queue.push(new QueueEntry(timestamp, "updateData", "Sheet1!A1:B1", "", [["Test A", "Test B"]]));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test2"));

    const result = [
        new QueueEntry(timestamp, "updateData", "Sheet1!A1:B1", "", [["Test A", "Test B"]]),
        new QueueEntry(timestamp, "updateCell", "Sheet1!A1", "", "Test2")
    ];
    queuer.cleanQueue();
    assert.ok(
        arraysEqual(queue, result),
        queue
    );
}

function test_cleanQueue_4() {
    queue.length = 0;
    const timestamp = Date.now();
    queue.push(new QueueEntry(timestamp, "updateRow", "Inventory Items!A23:G23", "Inventory Items!|Vivian|LEFT HAND|", ["Vivian", "NULL", "LEFT HAND", "", "", "", "", ""]));
    queue.push(new QueueEntry(timestamp, "insertData", "Items!A12:G12", "Items!WRENCH|beach-house|Item: TOOL BOX/TOOL BOX", [["SMALL BAG 2", "beach-house", true, "Object: FLOOR", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>"]]));
    queue.push(new QueueEntry(timestamp, "insertData", "Items!A13:G13", "Items!SMALL BAG 2|beach-house|Object: FLOOR", [["WRENCH", "beach-house", true, "Item: SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"]]));
    queue.push(new QueueEntry(timestamp, "insertData", "Items!A14:G14", "Items!SCREWDRIVER|beach-house|Item: SMALL BAG 2/SMALL BAG", [["SCREWDRIVER", "beach-house", true, "Item: SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"]]));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!G13", "Items!SMALL BAG 2|beach-house|Object: FLOOR", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!E13", "Items!SMALL BAG 2|beach-house|Object: FLOOR", 0));
    queue.push(new QueueEntry(timestamp, "updateCell", "Objects!G2", "Objects!FLOOR|beach-house", "<desc><s>The floor beneath you is smooth and wooden.</s> <s>There's a rug underneath the COUCHES and TABLE.</s> <s>You find <il></il> haphazardly placed on the floor.</s></desc>"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!E14", "Items!SCREWDRIVER|beach-house|Item: SMALL BAG 2/SMALL BAG", "0"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!G8", "Items!TOOL BOX|beach-house|Object: CLOSET", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SMALL BAG</item>, <item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Inventory Items!E28", "Inventory Items!WRENCH|Vivian|LEFT HAND|SMALL BAG 2/SMALL BAG", "0"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Inventory Items!E29", "Inventory Items!WRENCH|Vivian|LEFT HAND|SMALL BAG 2/SMALL BAG", "0"));
    queue.push(new QueueEntry(timestamp, "insertData", "Items!A11:G11", "Items!WRENCH|beach-house|Item: TOOL BOX/TOOL BOX", [["SMALL BAG 2", "beach-house", true, "Item: TOOL BOX/TOOL BOX", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"]]));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!E8", "Items!TOOL BOX|beach-house|Object: CLOSET", 0));
    queue.push(new QueueEntry(timestamp, "updateCell", "Objects!G5", "Objects!CLOSET|beach-house", "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il><item>a SLINGSHOT</item></il>.</s></desc>"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!E9", "Items!SCREWDRIVER|beach-house|Item: TOOL BOX/TOOL BOX", "0"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!E10", "Items!HAMMER|beach-house|Item: TOOL BOX/TOOL BOX", "0"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!E11", "Items!WRENCH|beach-house|Item: TOOL BOX/TOOL BOX", "0"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!E12", "Items!SMALL BAG 2|beach-house|Item: TOOL BOX/TOOL BOX", "0"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!E15", "Items!WRENCH|beach-house|Item: SMALL BAG 2/SMALL BAG", "0"));
    queue.push(new QueueEntry(timestamp, "updateCell", "Items!E16", "Items!SCREWDRIVER|beach-house|Item: SMALL BAG 2/SMALL BAG", "0"));
    queue.push(new QueueEntry(timestamp, "updateRow", "Inventory Items!A22:G22", "Inventory Items!|Vivian|RIGHT HAND|", ["Vivian", "TOOL BOX", "RIGHT HAND", "", 1, "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SMALL BAG</item>, <item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>"]));

    const result = [
        new QueueEntry(timestamp, "updateRow", "Inventory Items!A23:G23", "Inventory Items!|Vivian|LEFT HAND|", ["Vivian", "NULL", "LEFT HAND", "", "", "", "", ""]),
        new QueueEntry(timestamp, "insertData", "Items!A12:G12", "Items!WRENCH|beach-house|Item: TOOL BOX/TOOL BOX", [
            ["SMALL BAG 2", "beach-house", true, "Object: FLOOR", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>"],
            ["WRENCH", "beach-house", true, "Item: SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
            ["SCREWDRIVER", "beach-house", true, "Item: SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"]
        ]),
        new QueueEntry(timestamp, "updateCell", "Items!G13", "Items!SMALL BAG 2|beach-house|Object: FLOOR", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"),
        new QueueEntry(timestamp, "updateCell", "Items!E13", "Items!SMALL BAG 2|beach-house|Object: FLOOR", 0),
        new QueueEntry(timestamp, "updateCell", "Objects!G2", "Objects!FLOOR|beach-house", "<desc><s>The floor beneath you is smooth and wooden.</s> <s>There's a rug underneath the COUCHES and TABLE.</s> <s>You find <il></il> haphazardly placed on the floor.</s></desc>"),
        new QueueEntry(timestamp, "updateCell", "Items!E14", "Items!SCREWDRIVER|beach-house|Item: SMALL BAG 2/SMALL BAG", "0"),
        new QueueEntry(timestamp, "updateCell", "Items!G8", "Items!TOOL BOX|beach-house|Object: CLOSET", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SMALL BAG</item>, <item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>"),
        new QueueEntry(timestamp, "updateCell", "Inventory Items!E28", "Inventory Items!WRENCH|Vivian|LEFT HAND|SMALL BAG 2/SMALL BAG", "0"),
        new QueueEntry(timestamp, "updateCell", "Inventory Items!E29", "Inventory Items!WRENCH|Vivian|LEFT HAND|SMALL BAG 2/SMALL BAG", "0"),
        new QueueEntry(timestamp, "insertData", "Items!A11:G11", "Items!WRENCH|beach-house|Item: TOOL BOX/TOOL BOX", [["SMALL BAG 2", "beach-house", true, "Item: TOOL BOX/TOOL BOX", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"]]),
        new QueueEntry(timestamp, "updateCell", "Items!E8", "Items!TOOL BOX|beach-house|Object: CLOSET", 0),
        new QueueEntry(timestamp, "updateCell", "Objects!G5", "Objects!CLOSET|beach-house", "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il><item>a SLINGSHOT</item></il>.</s></desc>"),
        new QueueEntry(timestamp, "updateCell", "Items!E9", "Items!SCREWDRIVER|beach-house|Item: TOOL BOX/TOOL BOX", "0"),
        new QueueEntry(timestamp, "updateCell", "Items!E10", "Items!HAMMER|beach-house|Item: TOOL BOX/TOOL BOX", "0"),
        new QueueEntry(timestamp, "updateCell", "Items!E11", "Items!WRENCH|beach-house|Item: TOOL BOX/TOOL BOX", "0"),
        new QueueEntry(timestamp, "updateCell", "Items!E12", "Items!SMALL BAG 2|beach-house|Item: TOOL BOX/TOOL BOX", "0"),
        new QueueEntry(timestamp, "updateCell", "Items!E15", "Items!WRENCH|beach-house|Item: SMALL BAG 2/SMALL BAG", "0"),
        new QueueEntry(timestamp, "updateCell", "Items!E16", "Items!SCREWDRIVER|beach-house|Item: SMALL BAG 2/SMALL BAG", "0"),
        new QueueEntry(timestamp, "updateRow", "Inventory Items!A22:G22", "Inventory Items!|Vivian|RIGHT HAND|", ["Vivian", "TOOL BOX", "RIGHT HAND", "", 1, "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SMALL BAG</item>, <item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>"]),
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
    queue.push(new QueueEntry(timestamp, "updateData", "Sheet1!A1:B2", "", [["Test A", "Test B"], ["Test C", "Test D"]]));
    queue.push(new QueueEntry(timestamp, "updateRow", "Sheet1!C1:E1", "", ["Test E", "Test F", "Test G"]));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!D1", "", 1));

    const result = [
        {
            "pasteData": {
                "data": "Test A@@@Test B",
                "type": "PASTE_NORMAL",
                "delimiter": "@@@",
                "coordinate": {
                    "sheetId": 0,
                    "columnIndex": 0,
                    "rowIndex": 0
                }
            }
        },
        {
            "pasteData": {
                "data": "Test C@@@Test D",
                "type": "PASTE_NORMAL",
                "delimiter": "@@@",
                "coordinate": {
                    "sheetId": 0,
                    "columnIndex": 0,
                    "rowIndex": 1
                }
            }
        },
        {
            "pasteData": {
                "data": "Test E@@@Test F@@@Test G",
                "type": "PASTE_NORMAL",
                "delimiter": "@@@",
                "coordinate": {
                    "sheetId": 0,
                    "columnIndex": 2,
                    "rowIndex": 0
                }
            }
        },
        {
            "pasteData": {
                "data": "1",
                "type": "PASTE_NORMAL",
                "delimiter": "@@@",
                "coordinate": {
                    "sheetId": 0,
                    "columnIndex": 3,
                    "rowIndex": 0
                }
            }
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
    queue.push(new QueueEntry(timestamp, "updateData", "Sheet1!A1:B2", "", [["Test A", "Test B"], ["Test C", "Test D"]]));
    queue.push(new QueueEntry(timestamp, "updateRow", "Sheet1!C1:E1", "", ["Test E", "Test F", "Test G"]));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!A4", "", 1));

    queuer.pushQueue("13z3_2ZYUfmB1CiSAxmK70S3viR-LxlaDKvCwo-Bkqeg");
}

async function test_pushQueue_1() {
    queue.length = 0;
    const timestamp = Date.now();

    queue.push(new QueueEntry(timestamp, "updateRow", "Sheet1!A9:G9", "", ["Nero", "TOOL BOX", "RIGHT HAND", "", 1, "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SKIRT</item>, <item>4 SCREWDRIVERS</item>, <item>2 HAMMERS</item>, and <item>4 WRENCHES</item></il>.</s></desc>"]));
    queue.push(new QueueEntry(timestamp, "updateCell", "Sheet1!G19", "", "<desc><s>It's a beige satchel with a long strap to go over the shoulder.</s> <s>Inside, you find <il><item>a LAPTOP</item> and <item>a SMALL BAG</item></il>.</s></desc>"));
    let data =
        [
            ["Nero", "SCREWDRIVER", "RIGHT HAND", "TOOL BOX/TOOL BOX", 4, "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
            ["Nero", "HAMMER", "RIGHT HAND", "TOOL BOX/TOOL BOX", 2, "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
            ["Nero", "WRENCH", "RIGHT HAND", "TOOL BOX/TOOL BOX", 4, "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
            ["Nero", "VIVIANS SKIRT", "RIGHT HAND", "TOOL BOX/TOOL BOX", 1, "", "<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"><item>a HAMMER</item></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"><item>a HAMMER</item></il>.</s></desc>"],
            ["Nero", "HAMMER", "RIGHT HAND", "VIVIANS SKIRT/LEFT POCKET", 1, "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
            ["Nero", "HAMMER", "RIGHT HAND", "VIVIANS SKIRT/RIGHT POCKET", 1, "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"]
        ];
    queue.push(new QueueEntry(timestamp, "insertData", "Sheet1!A14:G14", "", data));

    data =
        [
            ["Vivian", "VIVIANS LAPTOP", "BAG", "VIVIANS SATCHEL/SATCHEL", 1, "", "<desc><if cond=\"player.name === 'Vivian'\"><s>This is your laptop.</s> <s>You take it with you everywhere you go.</s></if><if cond=\"player.name !== 'Vivian'\"><s>This is a very expensive-looking laptop.</s> <s>The keyboard lights up when a key is pressed.</s> <s>The login screen is asking for a password for Vivian's account.</s></if></desc>"],
            ["Vivian", "SMALL BAG", "BAG", "VIVIANS SATCHEL/SATCHEL", 1, "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>"],
            ["Vivian", "WRENCH", "BAG", "SMALL BAG/SMALL BAG", 1, "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"]
        ];
    queue.push(new QueueEntry(timestamp, "insertData", "Sheet1!A33:G33", "", data));

    await queuer.pushQueue("1Jff929xJkpABqIHns4ZWPalNiq4sB8AiVur7ApuamPc");

    const result = [
        ["Nero", "NULL", "HAT"],
        ["Nero", "NEROS GLASSES", "GLASSES", "", "1", "", "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>"],
        ["Nero", "NULL", "FACE"],
        ["Nero", "NULL", "NECK"],
        ["Nero", "NULL", "BAG"],
        ["Nero", "NEROS SHIRT", "SHIRT", "", "1", "", "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>"],
        ["Nero", "NEROS BLAZER", "JACKET", "", "1", "", "<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name=\"BREAST POCKET\"></il>.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
        ["Nero", "TOOL BOX", "RIGHT HAND", "", "1", "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SKIRT</item>, <item>4 SCREWDRIVERS</item>, <item>2 HAMMERS</item>, and <item>4 WRENCHES</item></il>.</s></desc>"],
        ["Nero", "NULL", "LEFT HAND"],
        ["Nero", "NEROS PANTS", "PANTS", "", "1", "", "<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s> <s>In the left back pocket, you find <il name=\"LEFT BACK POCKET\"></il>.</s> <s>In the right back pocket, you find <il name=\"RIGHT BACK POCKET\"></il>.</s></desc>"],
        ["Nero", "NEROS UNDERWEAR", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of black, plaid boxers.</s></desc>"],
        ["Nero", "NEROS SOCKS", "SOCKS", "", "1", "", "<desc><s>It's a pair of plain, black ankle socks.</s></desc>"],
        ["Nero", "NEROS SHOES", "SHOES", "", "1", "", "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>"],
        ["Nero", "SCREWDRIVER", "RIGHT HAND", "TOOL BOX/TOOL BOX", "4", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
        ["Nero", "HAMMER", "RIGHT HAND", "TOOL BOX/TOOL BOX", "2", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
        ["Nero", "WRENCH", "RIGHT HAND", "TOOL BOX/TOOL BOX", "4", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
        ["Nero", "VIVIANS SKIRT", "RIGHT HAND", "TOOL BOX/TOOL BOX", "1", "", "<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"><item>a HAMMER</item></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"><item>a HAMMER</item></il>.</s></desc>"],
        ["Nero", "HAMMER", "RIGHT HAND", "VIVIANS SKIRT/LEFT POCKET", "1", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
        ["Nero", "HAMMER", "RIGHT HAND", "VIVIANS SKIRT/RIGHT POCKET", "1", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
        ["Vivian", "NULL", "HAT"],
        ["Vivian", "VIVIANS GLASSES", "GLASSES", "", "1", "", "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>"],
        ["Vivian", "NULL", "FACE"],
        ["Vivian", "NULL", "NECK"],
        ["Vivian", "VIVIANS SATCHEL", "BAG", "", "1", "", "<desc><s>It's a beige satchel with a long strap to go over the shoulder.</s> <s>Inside, you find <il><item>a LAPTOP</item> and <item>a SMALL BAG</item></il>.</s></desc>"],
        ["Vivian", "VIVIANS SHIRT", "SHIRT", "", "1", "", "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>"],
        ["Vivian", "VIVIANS SWEATER", "JACKET", "", "1", "", "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>"],
        ["Vivian", "NULL", "RIGHT HAND"],
        ["Vivian", "NULL", "LEFT HAND"],
        ["Vivian", "VIVIANS SKIRT", "PANTS", "", "1", "", "<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
        ["Vivian", "VIVIANS UNDERWEAR", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of plain, pink panties.</s></desc>"],
        ["Vivian", "VIVIANS SOCKS", "SOCKS", "", "1", "", "<desc><s>It's a pair of black thigh high socks.</s></desc>"],
        ["Vivian", "VIVIANS SHOES", "SHOES", "", "1", "", "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>"],
        ["Vivian", "VIVIANS LAPTOP", "BAG", "VIVIANS SATCHEL/SATCHEL", "1", "", "<desc><if cond=\"player.name === 'Vivian'\"><s>This is your laptop.</s> <s>You take it with you everywhere you go.</s></if><if cond=\"player.name !== 'Vivian'\"><s>This is a very expensive-looking laptop.</s> <s>The keyboard lights up when a key is pressed.</s> <s>The login screen is asking for a password for Vivian's account.</s></if></desc>"],
        ["Vivian", "SMALL BAG", "BAG", "VIVIANS SATCHEL/SATCHEL", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>"],
        ["Vivian", "WRENCH", "BAG", "SMALL BAG/SMALL BAG", "1", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"]
    ];
    
    setTimeout(function () {
        sheets.getData("Sheet1!A1:G", function (response) {
            const sheet = response.data.values;
            for (let i = 1; i < sheet.length; i++) {
                assert.ok(
                    arraysEqual(result[i - 1], sheet[i]),
                    `Row ${i + 1}: ` + sheet[i].join(',')
                );
            }
        }, "1Jff929xJkpABqIHns4ZWPalNiq4sB8AiVur7ApuamPc");
    }, 2000);
    
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
