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
    test_increaseQuantity_0();
    test_increaseQuantity_1();
    test_increaseQuantity_2();
    
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
    test_addItem_13();
    return;
};

function test_increaseQuantity_0() {
    const text = "<desc><s>In the bottom drawer, you find <il><item>15 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const item = new Item("PENCIL", 16, "a PENCIL", "PENCILS");

    const result = "<desc><s>In the bottom drawer, you find <il><item>16 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_increaseQuantity_1() {
    const text = "<desc><s>In the bottom drawer, you find <il><item>9 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const item = new Item("PENCIL", 10, "a PENCIL", "PENCILS");

    const result = "<desc><s>In the bottom drawer, you find <il><item>10 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_increaseQuantity_2() {
    const text = "<desc><s>In the bottom drawer, you find <il><item>a PENCIL</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const item = new Item("PENCIL", 2, "a PENCIL", "PENCILS");

    const result = "<desc><s>In the bottom drawer, you find <il><item>2 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addToInfiniteItems() {
    const text = "<desc><s>There are <il>a large number of COINS</il> in the fountain.</s></desc>";
    const item = new Item("COIN", NaN, "a COIN", "COINS");

    const result = "<desc><s>There are <il>a large number of COINS</il> in the fountain.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_1() {
    const text = "<desc><s>On these shelves are <il><item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const item = new Item("PAINKILLERS", 1, "a bottle of PAINKILLERS");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_2() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of LAXATIVES</item> and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const item = new Item("PAINKILLERS", 1, "a bottle of PAINKILLERS");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_3() {
    const text = "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>";
    const item = new Item("FLASH DRIVE", 1, "a FLASH DRIVE");

    const result = "<desc><s>However, you do find <il><item>a FLASH DRIVE</item>, <item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_4() {
    const text = "<desc><s>On these shelves is <il><item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const item = new Item("PAINKILLERS", 1, "a bottle of PAINKILLERS");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_5() {
    const text = "<desc><s>There are <il><item>3 CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>";
    const item = new Item("DRUM STICKS", 1, "a set of DRUM STICKS");

    const result = "<desc><s>There are <il><item>a set of DRUM STICKS</item>, <item>3 CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_6() {
    const text = "<desc><s>There are <il><item>3 CLARINETS</item> and a PIANO</il>.</s></desc>";
    const item = new Item("DRUM STICKS", 1, "a set of DRUM STICKS");

    const result = "<desc><s>There are <il><item>a set of DRUM STICKS</item>, <item>3 CLARINETS</item>, and a PIANO</il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_7() {
    const text = "<desc><s>However, you do find <il>a wooden ruler and <item>a KEYBOARD</item></il>.</s></desc>";
    const item = new Item("MOUSE", 1, "a MOUSE");

    const result = "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_8() {
    const text = "<desc><s>There are <il>BASKETBALLS, SOCCER BALLS, and BASEBALLS</il>.</s></desc>";
    const item = new Item("TENNIS BALL", 1, "a TENNIS BALL");

    const result = "<desc><s>There are <il><item>a TENNIS BALL</item>, BASKETBALLS, SOCCER BALLS, and BASEBALLS</il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_9() {
    const text = "<desc><s>There are <il>SOCCER BALLS and BASEBALLS</il>.</s></desc>";
    const item = new Item("TENNIS BALL", 1, "a TENNIS BALL");

    const result = "<desc><s>There are <il><item>a TENNIS BALL</item>, SOCCER BALLS, and BASEBALLS</il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_10() {
    const text = "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>";
    const item = new Item("KEYBOARD", 1, "a KEYBOARD");

    const result = "<desc><s>However, you do find <il><item>a KEYBOARD</item> and a wooden ruler</il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_11() {
    const text = "<desc><s>Looking under the beds, you find <il></il>.</s></desc>";
    const item = new Item("BASKETBALL", 1, "a BASKETBALL");

    const result = "<desc><s>Looking under the beds, you find <il><item>a BASKETBALL</item></il>.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_12() {
    const text = "<desc><s>You find <il></il> haphazardly placed on it.</s></desc>";
    const item = new Item("TOWEL", 1, "a TOWEL");

    const result = "<desc><s>You find <il><item>a TOWEL</item></il> haphazardly placed on it.</s></desc>";
    const actual = parser.addItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_addItem_13() {
    const text = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`;
    const item = new Item("GUN", 1, "a GUN");

    const result = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"><item>a GUN</item></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`;
    const actual = parser.addItem(text, item, "RIGHT POCKET");
    assert.ok(
        actual === result,
        actual
    );
}
