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
    test_removeItem_20();
    test_removeItem_21();
    test_removeItem_22();
    test_removeItem_23();
    test_removeItem_24();
    test_removeItem_25();
    test_removeItem_26();

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

    const result = "<desc><s>In the bottom drawer, you find <il><item>14 PENCILS</item> and <item>a stack of PAPER</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_0() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const item = new Item("ISOPROPYL ALCOHOL", 0, "a bottle of ISOPROPYL ALCOHOL");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_1() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const item = new Item("LAXATIVES", 0, "a bottle of LAXATIVES");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>3 bottles of ZZZQUIL</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_2() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of ZZZQUIL</item></il>.</s></desc>";
    const item = new Item("ZZZQUIL", 0, "a bottle of ZZZQUIL", "bottles of ZZZQUIL");

    const result = "<desc><s>On these shelves is <il><item>a bottle of PAINKILLERS</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_3() {
    const text = "<desc><s><il><item>A bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "<desc><s><il><item>A bottle of LAXATIVES</item></il> is on these shelves.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_4() {
    const text = "<desc><s><il><item>A bottle of PAINKILLERS</item>, <item>a bottle of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "<desc><s><il><item>A bottle of ZZZQUIL</item> and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_5() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const item = new Item("PAINKILLERS", 0, "a bottle of PAINKILLERS");

    const result = "<desc><s>On these shelves is <il><item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_6() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>a bottle of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const item = new Item("ZZZQUIL", 0, "a bottle of ZZZQUIL", "bottles of ZZZQUIL");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_7() {
    const text = `<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>`;
    const item = new Item("LAXATIVES", 0, "a bottle of LAXATIVES");

    const result = `<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>`;
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
    const text = "<desc><s>You find various cooking tools on them, including <il><item>3 POTS</item>, <item>2 PANS</item>, <item>a CUTTING BOARD</item>, and various other things</il>.</s></desc>";
    const item = new Item("CUTTING BOARD", 0, "a CUTTING BOARD", "CUTTING BOARDS");

    const result = "<desc><s>You find various cooking tools on them, including <il><item>3 POTS</item>, <item>2 PANS</item>, and various other things</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_14() {
    const text = `<desc><s>The cupboards are wooden and filled with kitchen accessories and a few food items.</s> <s>When you pull open the doors, you notice one of them seems a little bit loose.</s> <s>The shelves are lined with <il><item>2 bags of POTATOES</item>, <item>a bag of RICE</item>, different ingredients for baking, and dough mixes</il>.</s> <s>There are LINENS on the shelves on top, and there is even a shelf dedicated to COOKBOOKS alone.</s></desc>`;
    const item = new Item("RICE", 0, "a bag of RICE", "bags of RICE");

    const result = `<desc><s>The cupboards are wooden and filled with kitchen accessories and a few food items.</s> <s>When you pull open the doors, you notice one of them seems a little bit loose.</s> <s>The shelves are lined with <il><item>2 bags of POTATOES</item>, different ingredients for baking, and dough mixes</il>.</s> <s>There are LINENS on the shelves on top, and there is even a shelf dedicated to COOKBOOKS alone.</s></desc>`;
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_15() {
    const text = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>a bottle of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const item = new Item("ZZZQUIL", 0, "a bottle of ZZZQUIL", "bottles of ZZZQUIL");

    const result = "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_16() {
    const text = "<desc><s>A few grab your attention though: <il>ROSE OF SHARON, PINK LACEFLOWER, and <item>a MIRACLE FLOWER</item></il>.</s></desc>";
    const item = new Item("MIRACLE FLOWER", 0, "a MIRACLE FLOWER");

    const result = "<desc><s>A few grab your attention though: <il>ROSE OF SHARON and PINK LACEFLOWER</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_17() {
    const text = "<desc><s>However, you do find <il>a wooden ruler and <item>a KEYBOARD</item></il>.</s></desc>";
    const item = new Item("KEYBOARD", 0, "a KEYBOARD");

    const result = "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_18() {
    const text = "<desc><s>However, you do find <il><item>a KEYBOARD</item> and a wooden ruler</il>.</s></desc>";
    const item = new Item("KEYBOARD", 0, "a KEYBOARD");

    const result = "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_19() {
    const text = "<desc><s>In and around the bushes, you find <il><item>an EASTER EGG</item>, RED BERRIES, PURPLE BERRIES, and MUSHROOMS</il>.</s></desc>";
    const item = new Item("EASTER EGG", 0, "an EASTER EGG", "EASTER EGGS");

    const result = "<desc><s>In and around the bushes, you find <il>RED BERRIES, PURPLE BERRIES, and MUSHROOMS</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_20() {
    const text = "<desc><s>There are <il><item>CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>";
    const item = new Item("CLARINET", 0, "a CLARINET", "CLARINETS");

    const result = "<desc><s>There are <il>a PIANO and some SNARE DRUMS</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_21() {
    const text = "<desc><s>There is <il><item>a rather large TARP</item></il> on the FLOOR.</s></desc>";
    const item = new Item("TARP", 0, "a rather large TARP");

    const result = "<desc><s>There is <il></il> on the FLOOR.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_22() {
    const text = "<desc><s>You find various cooking tools on them, including <il><item>3 POTS</item>, <item>2 PANS</item>, <item>a CUTTING BOARD</item>, and various other things</il>.</s></desc>";
    const item = new Item("CUTTING BOARD", 0, "a CUTTING BOARD", "CUTTING BOARDS");

    const result = "<desc><s>You find various cooking tools on them, including <il><item>3 POTS</item>, <item>2 PANS</item>, and various other things</il>.</s></desc>";
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_23() {
    const text = `<desc><s>You examine the pool table.</s> <s>It seems to have everything you need to play a game of pool: <il><item>2 POOL STICKS</item>, <if cond="player.talent === 'Ultimate Tabletop Player'"><item>CHALK</item>,</if> <item>a TRIANGLE</item>, and <item>BALLS</item></il>.</s></desc>`;
    const item = new Item("CHALK", 0, "CHALK");

    const result = `<desc><s>You examine the pool table.</s> <s>It seems to have everything you need to play a game of pool: <il><item>2 POOL STICKS</item>, <item>a TRIANGLE</item>, and <item>BALLS</item></il>.</s></desc>`;
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_24() {
    const text = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"><item>a GUN</item></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`;
    const item = new Item("GUN", 0, "a GUN");

    const result = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`;
    const actual = parser.removeItem(text, item, "RIGHT POCKET");
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_25() {
    const text = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"><item>a GUN</item></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"><item>a GUN</item></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"><item>a GUN</item></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"><item>a GUN</item></il>.</s></desc>`;
    const item = new Item("GUN", 0, "a GUN");

    const result = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"><item>a GUN</item></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"><item>a GUN</item></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"><item>a GUN</item></il>.</s></desc>`;
    const actual = parser.removeItem(text, item, "LEFT BACK POCKET");
    assert.ok(
        actual === result,
        actual
    );
}

function test_removeItem_26() {
    const text = `<desc><s>This looks like a run of the mill blender.</s> <s>You could use this to blend fruit or possibly other things.</s> <s>In it are <il><item>an APPLE BANANA SMOOTHIE</item> and <item>an APPLE</item></il>.</s></desc>`;
    const item = new Item("APPLE", 0, "an APPLE");

    const result = `<desc><s>This looks like a run of the mill blender.</s> <s>You could use this to blend fruit or possibly other things.</s> <s>In it is <il><item>an APPLE BANANA SMOOTHIE</item></il>.</s></desc>`;
    const actual = parser.removeItem(text, item);
    assert.ok(
        actual === result,
        actual
    );
}
