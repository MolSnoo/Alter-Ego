var assert = require('assert');
var parser = require('../House-Data/parser.js');

exports.run = function() {
    test_increaseQuantity_0();
    test_increaseQuantity_1();
    test_increaseQuantity_2();
    test_decreaseQuantity_0();
    test_decreaseQuantity_1();
    test_decreaseQuantity_2();

    test_addToInfiniteItems();

    test_addItem_1();
    test_addItem_2();
    test_addItem_3();
    test_addItem_4();
    test_addItem_5();
    test_addItem_6();
    test_addItem_7();
    test_addItem_8();
    test_addItem_9();
    test_addItem_10();
    test_addItem_11();
    test_addItem_12();

    test_removeItem_1();
    test_removeItem_2();
    test_removeItem_3();
    test_removeItem_4();
    test_removeItem_5();
    test_removeItem_6();
    test_removeItem_7();
    test_removeItem_8();
    test_removeItem_9();
    test_removeItem_10();
    test_removeItem_11();
    test_removeItem_12();
    test_removeItem_13();
    test_removeItem_14();
    test_removeItem_15();
    test_removeItem_16();
    test_removeItem_17();
    test_removeItem_18();
    test_removeItem_19();
    test_removeItem_20();
    return;
};

class Item {
    constructor(name, quantity, singleContainingPhrase, pluralContainingPhrase) {
        this.name = name;
        this.pluralName = pluralContainingPhrase;
        this.quantity = quantity;
        this.singleContainingPhrase = singleContainingPhrase;
        this.pluralContainingPhrase = pluralContainingPhrase;
    }
}

function test_increaseQuantity_0() {
    const text = "In the bottom drawer, you find <{15 PENCILS} and {a stack of PAPER.}>";
    const item = new Item("PENCIL", 16, "a PENCIL", "PENCILS");

    const result = "In the bottom drawer, you find <{16 PENCILS} and {a stack of PAPER.}>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_increaseQuantity_1() {
    const text = "In the bottom drawer, you find <{9 PENCILS} and {a stack of PAPER.}>";
    const item = new Item("PENCIL", 10, "a PENCIL", "PENCILS");

    const result = "In the bottom drawer, you find <{10 PENCILS} and {a stack of PAPER.}>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_increaseQuantity_2() {
    const text = "In the bottom drawer, you find <{a PENCIL} and {a stack of PAPER.}>";
    const item = new Item("PENCIL", 2, "a PENCIL", "PENCILS");

    const result = "In the bottom drawer, you find <{2 PENCILS} and {a stack of PAPER.}>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_decreaseQuantity_0() {
    const text = "In the bottom drawer, you find <{15 PENCILS} and {a stack of PAPER.}>";
    const item = new Item("PENCIL", 14, "a PENCIL", "PENCILS");

    const result = "In the bottom drawer, you find <{14 PENCILS} and {a stack of PAPER.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_decreaseQuantity_1() {
    const text = "In the bottom drawer, you find <{10 PENCILS} and {a stack of PAPER.}>";
    const item = new Item("PENCIL", 9, "a PENCIL", "PENCILS");

    const result = "In the bottom drawer, you find <{9 PENCILS} and {a stack of PAPER.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_decreaseQuantity_2() {
    const text = "In the bottom drawer, you find <{2 PENCILS} and {a stack of PAPER.}>";
    const item = new Item("PENCIL", 1, "a PENCIL", "PENCILS");

    const result = "In the bottom drawer, you find <{a PENCIL} and {a stack of PAPER.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addToInfiniteItems() {
    const text = "There are <a large number of COINS> in the fountain.";
    const item = new Item("COIN", NaN, "a COIN", "COINS");

    const result = "There are <a large number of COINS> in the fountain.";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_1() {
    const text = "On these shelves are <{3 bottles of ZZZQUIL,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>";
    const item = new Item("PAINKILLERS", 1, "a bottle of PAINKILLERS");

    const result = "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_2() {
    const text = "On these shelves are <{a bottle of LAXATIVES} and {a bottle of ISOPROPYL ALCOHOL.}>";
    const item = new Item("PAINKILLERS", 1, "a bottle of PAINKILLERS");

    const result = "On these shelves are <{a bottle of PAINKILLERS,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_3() {
    const text = "However, you do find <{a MOUSE,} a wooden ruler, and {a KEYBOARD.}>";
    const item = new Item("FLASH DRIVE", 1, "a FLASH DRIVE");

    const result = "However, you do find <{a FLASH DRIVE,} {a MOUSE,} a wooden ruler, and {a KEYBOARD.}>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_4() {
    const text = "On these shelves is <{a bottle of ISOPROPYL ALCOHOL.}>";
    const item = new Item("PAINKILLERS", 1, "a bottle of PAINKILLERS");

    const result = "On these shelves are <{a bottle of PAINKILLERS} and {a bottle of ISOPROPYL ALCOHOL.}>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_5() {
    const text = "There are <{3 CLARINETS,} a PIANO, and some SNARE DRUMS.>";
    const item = new Item("DRUM STICKS", 1, "a set of DRUM STICKS");

    const result = "There are <{a set of DRUM STICKS,} {3 CLARINETS,} a PIANO, and some SNARE DRUMS.>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_6() {
    const text = "There are <{3 CLARINETS} and a PIANO.>";
    const item = new Item("DRUM STICKS", 1, "a set of DRUM STICKS");

    const result = "There are <{a set of DRUM STICKS,} {3 CLARINETS,} and a PIANO.>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_7() {
    const text = "However, you do find <a wooden ruler and {a KEYBOARD.}>";
    const item = new Item("MOUSE", 1, "a MOUSE");

    const result = "However, you do find <{a MOUSE,} a wooden ruler, and {a KEYBOARD.}>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_8() {
    const text = "There are <BASKETBALLS, SOCCER BALLS, and BASEBALLS.>";
    const item = new Item("TENNIS BALL", 1, "a TENNIS BALL");

    const result = "There are <{a TENNIS BALL,} BASKETBALLS, SOCCER BALLS, and BASEBALLS.>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_9() {
    const text = "There are <SOCCER BALLS and BASEBALLS.>";
    const item = new Item("TENNIS BALL", 1, "a TENNIS BALL");

    const result = "There are <{a TENNIS BALL,} SOCCER BALLS, and BASEBALLS.>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_10() {
    const text = "Looking under the beds, you find <.>";
    const item = new Item("BASKETBALL", 1, "a BASKETBALL");

    const result = "Looking under the beds, you find <{a BASKETBALL.}>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_11() {
    const text = "However, you do find <a wooden ruler.>";
    const item = new Item("KEYBOARD", 1, "a KEYBOARD");

    const result = "However, you do find <{a KEYBOARD} and a wooden ruler.>";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_12() {
    const text = "You find <> haphazardly placed on it.";
    const item = new Item("TOWEL", 1, "a TOWEL");

    const result = "You find <{a TOWEL}> haphazardly placed on it.";
    const actual = parser.addItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_1() {
    const text = "{On one of the desks is a FIRST AID KIT} and {hung on the wall behind the desks is a MEDICINE CABINET.}";
    const item = new Item("FIRST AID KIT", 0, "a FIRST AID KIT");

    const result = "{Hung on the wall behind the desks is a MEDICINE CABINET.}";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_2() {
    const text = "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>";
    const item = new Item("ISOPROPYL ALCOHOL", 0, "a bottle of ISOPROPYL ALCOHOL");

    const result = "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} and {a bottle of LAXATIVES.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_3() {
    const text = "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} and {a bottle of LAXATIVES.}>";
    const item = new Item("LAXATIVES", 0, "a bottle of LAXATIVES");

    const result = "On these shelves are <{a bottle of PAINKILLERS} and {3 bottles of ZZZQUIL.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_4() {
    const text = "On these shelves are <{a bottle of PAINKILLERS} and {3 bottles of ZZZQUIL.}>";
    const item = new Item("ZZZQUIL", 0, "a bottle of ZZZQUIL", "bottles of ZZZQUIL");

    const result = "On these shelves is <{a bottle of PAINKILLERS.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_5() {
    const text = "<{A bottle of PAINKILLERS} and {a bottle of LAXATIVES}> are on these shelves.";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "<{A bottle of LAXATIVES}> is on these shelves.";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_6() {
    const text = "<{A bottle of PAINKILLERS,} {a bottle of ZZZQUIL,} and {a bottle of LAXATIVES}> are on these shelves.";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "<{A bottle of ZZZQUIL} and {a bottle of LAXATIVES}> are on these shelves.";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_7() {
    const text = "On these shelves are <{a bottle of PAINKILLERS} and {a bottle of LAXATIVES.}>";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "On these shelves is <{a bottle of LAXATIVES.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_8() {
    const text = "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} and {a bottle of LAXATIVES.}>";
    const item = new Item("ZZZQUIL", 0, "a bottle of ZZZQUIL", "bottles of ZZZQUIL");

    const result = "On these shelves are <{a bottle of PAINKILLERS} and {a bottle of LAXATIVES.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_9() {
    const text = "On these shelves are <{a bottle of PAINKILLERS,} {a bottle of ZZZQUIL,} and {a bottle of LAXATIVES.}>";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "On these shelves are <{a bottle of ZZZQUIL} and {a bottle of LAXATIVES.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_10() {
    const text = "On the counters, you can see <{a few KNIVES,} {a BUTCHERS KNIFE,} and a RACK of skewers.>";
    const item = new Item("KNIFE", 0, "a KNIFE", "KNIVES");

    const result = "On the counters, you can see <{a BUTCHERS KNIFE} and a RACK of skewers.>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_11() {
    const text = "On the counters, you can see <{a few KNIVES,} {a BUTCHERS KNIFE,} and a RACK of skewers.>";
    const item = new Item("BUTCHERS KNIFE", 0, "a BUTCHERS KNIFE");

    const result = "On the counters, you can see <{a few KNIVES} and a RACK of skewers.>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_12() {
    const text = "However, you do find <{a MOUSE,} a wooden ruler, and {a KEYBOARD.}>";
    const item = new Item("MOUSE", 0, "a MOUSE");

    const result = "However, you do find <a wooden ruler and {a KEYBOARD.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_13() {
    const text = "However, you do find <{a MOUSE,} a wooden ruler, and {a KEYBOARD.}>";
    const item = new Item("KEYBOARD", 0, "a KEYBOARD");

    const result = "However, you do find <{a MOUSE} and a wooden ruler.>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_14() {
    const text = "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>";
    const item = new Item("ZZZQUIL", 0, "a bottle of ZZZQUIL", "bottles of ZZZQUIL");

    const result = "On these shelves are <{a bottle of PAINKILLERS,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_15() {
    const text = "However, you do find <a wooden ruler and {a KEYBOARD.}>";
    const item = new Item("KEYBOARD", 0, "a KEYBOARD");

    const result = "However, you do find <a wooden ruler.>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_16() {
    const text = "{On one of the desks is a FIRST AID KIT} and hung on the wall behind the desks is a MEDICINE CABINET.";
    const item = new Item("FIRST AID KIT", 0, "a FIRST AID KIT");

    const result = "Hung on the wall behind the desks is a MEDICINE CABINET.";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_17() {
    const text = "However, you do find <{a KEYBOARD} and a wooden ruler.>";
    const item = new Item("KEYBOARD", 0, "a KEYBOARD");

    const result = "However, you do find <a wooden ruler.>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_18() {
    const text = "There are <{CLARINETS,} a PIANO, and some SNARE DRUMS.>";
    const item = new Item("CLARINET", 0, "a CLARINET", "CLARINETS");

    const result = "There are <a PIANO and some SNARE DRUMS.>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_19() {
    const text = "The second one from the bottom has <{a WALKIE TALKIE.}>";
    const item = new Item("WALKIE TALKIE", 0, "a WALKIE TALKIE");

    const result = "The second one from the bottom has <.>";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_20() {
    const text = "{There is a rather large TARP on the FLOOR.}";
    const item = new Item("TARP", 0, "a rather large TARP");

    const result = "";
    const actual = parser.removeItem(text, item)[0];
    assert.ok(
        actual === result,
        actual
    );
}
