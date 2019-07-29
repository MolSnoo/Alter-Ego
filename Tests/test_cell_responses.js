const settings = include('settings.json');

var assert = require('assert');

const Exit = include(`${settings.dataDir}/Exit.js`);
const Room = include(`${settings.dataDir}/Room.js`);
const Object = include(`${settings.dataDir}/Object.js`);
const Clue = include(`${settings.dataDir}/Clue.js`);
const Item = include(`${settings.dataDir}/Item.js`);
const Puzzle = include(`${settings.dataDir}/Puzzle.js`);
const InventoryItem = include(`${settings.dataDir}/InventoryItem.js`);
const Status = include(`${settings.dataDir}/Status.js`);
const Player = include(`${settings.dataDir}/Player.js`);

exports.run = function () {
    test_Clue();
    test_Exit();
    test_InventoryItem();
    test_Item();
    test_Object();
    test_Player();
    test_Puzzle();
    test_Room();
    test_Status();
    return;
};

function test_Clue() {
    const clue = new Clue("NEROS BODY", "gift-shop", true, "", 1);

    assert.ok(clue.level0DescriptionCell() === "Clues!E1", clue.level0DescriptionCell());
    assert.ok(clue.level1DescriptionCell() === "Clues!F1", clue.level1DescriptionCell());
    assert.ok(clue.level2DescriptionCell() === "Clues!G1", clue.level2DescriptionCell());
    assert.ok(clue.level3DescriptionCell() === "Clues!H1", clue.level3DescriptionCell());
}

function test_Exit() {
    const exit = new Exit("PATH 1", true, "path-1", "PARK", 17);

    assert.ok(exit.unlockedCell() === "Rooms!D17", exit.unlockedCell());
    assert.ok(exit.descriptionCell() === "Rooms!G17", exit.descriptionCell());
}

function test_InventoryItem() {
    const inventoryItem = new InventoryItem("BALL", "BALLS", NaN, true, "", "", "a BALL", "BALLS", 42);

    assert.ok(inventoryItem.itemCells() === "Players!L42:S42", inventoryItem.itemCells());
    assert.ok(inventoryItem.usesCell() === "Players!N42", inventoryItem.usesCell());
    assert.ok(inventoryItem.descriptionCell() === "Players!S42", inventoryItem.descriptionCell());
}

function test_Item() {
    const item = new Item("BALL", "BALLS", "basketball-court", "BASKET", true, "", 10, NaN, true, "", "", "a BALL", "BALLS", 136);

    assert.ok(item.itemCells() === "Items!A136:M136", item.itemCells());
    assert.ok(item.quantityCell() === "Items!G136", item.quantityCell());
    assert.ok(item.descriptionCell() === "Items!M136", item.descriptionCell());
}

function test_Object() {
    const object = new Object("DESK", "office", true, "", false, "on", 7);

    assert.ok(object.descriptionCell() === "Objects!G7", object.descriptionCell());
}

function test_Player() {
    const player = new Player("", null, "Nero", "Nero", "", 2, true, "park", "", "", null, 5);

    assert.ok(player.playerCells() === "Players!A5:K5", player.playerCells());
    assert.ok(player.hidingSpotCell() === "Players!J5", player.hidingSpotCell());
    assert.ok(player.statusCell() === "Players!K5", player.statusCell());
}

function test_Puzzle() {
    const puzzle = new Puzzle("LOCK", false, false, "carousel", "LOCK", "key lock", true, "Item: KEY", "", NaN, "", "", 72);

    assert.ok(puzzle.solvedCell() === "Puzzles!B72", puzzle.solvedCell());
    assert.ok(puzzle.accessibleCell() === "Puzzles!G72", puzzle.accessibleCell());
    assert.ok(puzzle.attemptsCell() === "Puzzles!J72", puzzle.attemptsCell());
    assert.ok(puzzle.correctCell() === "Puzzles!L72", puzzle.correctCell());
    assert.ok(puzzle.alreadySolvedCell() === "Puzzles!M72", puzzle.alreadySolvedCell());
    assert.ok(puzzle.incorrectCell() === "Puzzles!N72", puzzle.incorrectCell());
    assert.ok(puzzle.noMoreAttemptsCell() === "Puzzles!O72", puzzle.noMoreAttemptsCell());
    assert.ok(puzzle.requirementsNotMetCell() === "Puzzles!P72", puzzle.requirementsNotMetCell());
}

function test_Room() {
    const room = new Room("path-2", null, null, 23);

    assert.ok(room.descriptionCell() === "Rooms!G23", room.descriptionCell());
}

function test_Status() {
    const status = new Status("heated", null, false, "", "", "", 0, true, "", 204);

    assert.ok(status.inflictedCell() === "Status Effects!J204", status.inflictedCell());
    assert.ok(status.curedCell() === "Status Effects!K204", status.curedCell());
}
