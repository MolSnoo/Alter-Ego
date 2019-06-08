var assert = require('assert');

const Clue = require("../House-Data/Clue.js");
const Exit = require("../House-Data/Exit.js");
const InventoryItem = require("../House-Data/InventoryItem.js");
const Item = require("../House-Data/Item.js");
const Object = require("../House-Data/Object.js");
const Player = require("../House-Data/Player.js");
const Puzzle = require("../House-Data/Puzzle.js");
const Room = require("../House-Data/Room.js");
const Status = require("../House-Data/Status.js");


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
    const exit = new Exit("PATH 1", "path-1", "PARK", 17);

    assert.ok(exit.formattedDescriptionCell() === "Rooms!G17", exit.formattedDescriptionCell());
    assert.ok(exit.parsedDescriptionCell() === "Rooms!H17", exit.parsedDescriptionCell());
}

function test_InventoryItem() {
    const inventoryItem = new InventoryItem("BALL", "BALLS", NaN, true, "", "", "a BALL", "BALLS", 42);

    assert.ok(inventoryItem.itemCells() === "Players!I42:P42", inventoryItem.itemCells());
    assert.ok(inventoryItem.usesCell() === "Players!K42", inventoryItem.usesCell());
    assert.ok(inventoryItem.descriptionCell() === "Players!P42", inventoryItem.descriptionCell());
}

function test_Item() {
    const item = new Item("BALL", "BALLS", "basketball-court", "BASKET", true, "", 10, NaN, true, "", "", "a BALL", "BALLS", 136);

    assert.ok(item.itemCells() === "Items!A136:M136", item.itemCells());
    assert.ok(item.quantityCell() === "Items!G136", item.quantityCell());
    assert.ok(item.descriptionCell() === "Items!M136", item.descriptionCell());
}

function test_Object() {
    const object = new Object("DESK", "office", true, "", false, "on", 7);

    assert.ok(object.formattedDescriptionCell() === "Objects!G7", object.formattedDescriptionCell());
    assert.ok(object.parsedDescriptionCell() === "Objects!H7", object.parsedDescriptionCell());
}

function test_Player() {
    const player = new Player("", null, "Nero", "Nero", "", 2, true, "park", "", "", null, 5);

    assert.ok(player.playerCells() === "Players!A5:H5", player.playerCells());
    assert.ok(player.hidingSpotCell() === "Players!G5", player.hidingSpotCell());
    assert.ok(player.statusCell() === "Players!H5", player.statusCell());
}

function test_Puzzle() {
    const puzzle = new Puzzle("LOCK", false, false, "carousel", "LOCK", "key lock", true, "Item: KEY", "", NaN, "", 72);

    assert.ok(puzzle.solvedCell() === "Puzzles!B72", puzzle.solvedCell());
    assert.ok(puzzle.accessibleCell() === "Puzzles!G72", puzzle.accessibleCell());
    assert.ok(puzzle.attemptsCell() === "Puzzles!J72", puzzle.attemptsCell());
    assert.ok(puzzle.correctCell() === "Puzzles!L72", puzzle.correctCell());
    assert.ok(puzzle.formattedAlreadySolvedCell() === "Puzzles!M72", puzzle.formattedAlreadySolvedCell());
    assert.ok(puzzle.parsedAlreadySolvedCell() === "Puzzles!N72", puzzle.parsedAlreadySolvedCell());
    assert.ok(puzzle.incorrectCell() === "Puzzles!O72", puzzle.incorrectCell());
    assert.ok(puzzle.noMoreAttemptsCell() === "Puzzles!P72", puzzle.noMoreAttemptsCell());
    assert.ok(puzzle.requirementsNotMetCell() === "Puzzles!Q72", puzzle.requirementsNotMetCell());
}

function test_Room() {
    const room = new Room("path-2", true, null, null, 23);

    assert.ok(room.accessibilityCell() === "Rooms!B23", room.accessibilityCell());
    assert.ok(room.formattedDescriptionCell() === "Rooms!G23", room.formattedDescriptionCell());
    assert.ok(room.parsedDescriptionCell() === "Rooms!H23", room.parsedDescriptionCell());
}

function test_Status() {
    const status = new Status("heated", null, false, "", "", "", 0, 204);

    assert.ok(status.inflictedCell() === "Status Effects!J204", status.inflictedCell());
    assert.ok(status.curedCell() === "Status Effects!K204", status.curedCell());
}
