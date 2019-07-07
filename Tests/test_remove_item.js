const settings = include('settings.json');
var parser = include(`${settings.modulesDir}/parser.js`);

var assert = require('assert');

class Item {
    constructor(name, quantity, singleContainingPhrase, pluralContainingPhrase) {
        this.name = name;
        this.pluralName = pluralContainingPhrase;
        this.quantity = quantity;
        this.singleContainingPhrase = singleContainingPhrase;
        this.pluralContainingPhrase = pluralContainingPhrase;
    }
}

exports.run = function () {
    test_decreaseQuantity_0();
    test_decreaseQuantity_1();
    test_decreaseQuantity_2();

    test_removeItem_0();
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
    return;
};

function test_decreaseQuantity_0() {
    const text = "<desc><s>In the bottom drawer, you find <il><item>15 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const item = new Item("PENCIL", 14, "a PENCIL", "PENCILS");

    const result = "<desc><s>In the bottom drawer, you find <il><item>14 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_decreaseQuantity_1() {
    const text = "<desc><s>In the bottom drawer, you find <il><item>10 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const item = new Item("PENCIL", 9, "a PENCIL", "PENCILS");

    const result = "<desc><s>In the bottom drawer, you find <il><item>9 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_decreaseQuantity_2() {
    const text = "<desc><s>In the bottom drawer, you find <il><item>15 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const item = new Item("PENCIL", 1, "a PENCIL", "PENCILS");

    const result = "<desc><s>In the bottom drawer, you find <il><item>a PENCIL</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_0() {
    const text = "<desc><s><il><item>On one of the desks is a FIRST AID KIT</item> and <item>hung on the wall behind the desks is a MEDICINE CABINET</item></il>.</s></desc>";
    const item = new Item("FIRST AID KIT", 0, "a FIRST AID KIT");

    const result = "<desc><s><il><item>Hung on the wall behind the desks is a MEDICINE CABINET</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_1() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const item = new Item("ISOPROPYL ALCOHOL", 0, "a bottle of ISOPROPYL ALCOHOL");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_2() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const item = new Item("LAXATIVES", 0, "a bottle of LAXATIVES");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>3 bottles of ZZZQUIL</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_3() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>3 bottles of ZZZQUIL</item></il>.</s></desc>";
    const item = new Item("ZZZQUIL", 0, "a bottle of ZZZQUIL", "bottles of ZZZQUIL");

    const result = "<desc><s>On these shelves is <il><item>a bottle of PAINKILLERS</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_4() {
    const text = "<desc><s><il><item>A bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "<desc><s><il><item>A bottle of LAXATIVES</item></il> is on these shelves.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_5() {
    const text = "<desc><s><il><item>A bottle of PAINKILLERS</item>, <item>a bottle of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "<desc><s><il><item>A bottle of ZZZQUIL</item> and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_6() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "<desc><s>On these shelves is <il><item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_7() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const item = new Item("ZZZQUIL", 0, "a bottle of ZZZQUIL", "bottles of ZZZQUIL");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_8() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>a bottle of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "<desc><s>On these shelves are <il><item>a bottle of ZZZQUIL</item> and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_9() {
    const text = "<desc><s>On the counters, you can see <il><item>a few KNIVES</item>, <item>a BUTCHERS KNIFE</item>, and a RACK of skewers</il>.</s></desc>";
    const item = new Item("KNIFE", 0, "a KNIFE", "KNIVES");

    const result = "<desc><s>On the counters, you can see <il><item>a BUTCHERS KNIFE</item> and a RACK of skewers</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_10() {
    const text = "<desc><s>On the counters, you can see <il><item>a few KNIVES</item>, <item>a BUTCHERS KNIFE</item>, and a RACK of skewers</il>.</s></desc>";
    const item = new Item("BUTCHERS KNIFE", 0, "a BUTCHERS KNIFE");

    const result = "<desc><s>On the counters, you can see <il><item>a few KNIVES</item> and a RACK of skewers</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_11() {
    const text = "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>";
    const item = new Item("MOUSE", 0, "a MOUSE");

    const result = "<desc><s>However, you do find <il>a wooden ruler and <item>a KEYBOARD</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_12() {
    const text = "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>";
    const item = new Item("KEYBOARD", 0, "a KEYBOARD");

    const result = "<desc><s>However, you do find <il><item>a MOUSE</item> and a wooden ruler</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_13() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const item = new Item("ZZZQUIL", 0, "a bottle of ZZZQUIL", "bottles of ZZZQUIL");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_14() {
    const text = "<desc><s>A few grab your attention though: <il>ROSE OF SHARON, PINK LACEFLOWER, and <item>a MIRACLE FLOWER</item></il>.</s></desc>";
    const item = new Item("MIRACLE FLOWER", 0, "a MIRACLE FLOWER");

    const result = "<desc><s>A few grab your attention though: <il>ROSE OF SHARON and PINK LACEFLOWER</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_15() {
    const text = "<desc><s>However, you do find <il>a wooden ruler and <item>a KEYBOARD</item></il>.</s></desc>";
    const item = new Item("KEYBOARD", 0, "a KEYBOARD");

    const result = "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_16() {
    const text = "<desc><s><il><item>On one of the desks is a FIRST AID KIT</item> and hung on the wall behind the desks is a MEDICINE CABINET</il>.</s></desc>";
    const item = new Item("FIRST AID KIT", 0, "a FIRST AID KIT");

    const result = "<desc><s><il>Hung on the wall behind the desks is a MEDICINE CABINET</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_17() {
    const text = "<desc><s>However, you do find <il><item>a KEYBOARD</item> and a wooden ruler</il>.</s></desc>";
    const item = new Item("KEYBOARD", 0, "a KEYBOARD");

    const result = "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_18() {
    const text = "<desc><s>There are <il><item>CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>";
    const item = new Item("CLARINET", 0, "a CLARINET", "CLARINETS");

    const result = "<desc><s>There are <il>a PIANO and some SNARE DRUMS</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_19() {
    const text = "<desc><s><il><item>There is a rather large TARP on the FLOOR.</item></il></s></desc>";
    const item = new Item("TARP", 0, "a rather large TARP");

    const result = "<desc><s><il></il></s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}
