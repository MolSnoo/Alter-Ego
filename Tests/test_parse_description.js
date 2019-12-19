const settings = include('settings.json');
var parser = include(`${settings.modulesDir}/parser.js`);

const Exit = include(`${settings.dataDir}/Exit.js`);
const Room = include(`${settings.dataDir}/Room.js`);
const Object = include(`${settings.dataDir}/Object.js`);
const Prefab = include(`${settings.dataDir}/Prefab.js`);
const Item = include(`${settings.dataDir}/Item.js`);
const Puzzle = include(`${settings.dataDir}/Puzzle.js`);
const InventoryItem = include(`${settings.dataDir}/InventoryItem.js`);
const Status = include(`${settings.dataDir}/Status.js`);
//const Player = include(`${settings.dataDir}/Player.js`);

var assert = require('assert');

class Player {
    constructor(talent, intelligence) {
        this.talent = talent;
        this.intelligence = intelligence;
    }
}

exports.run = function () {
    test_parseDescription_0();
    test_parseDescription_1();
    test_parseDescription_2();
    test_parseDescription_3();
    test_parseDescription_4();
    test_parseDescription_5();
    test_parseDescription_6();
    test_parseDescription_7();
    test_parseDescription_8();
    test_parseDescription_9();
    test_parseDescription_10();
    test_parseDescription_11();
    test_parseDescription_12();
    test_parseDescription_13();
    test_parseDescription_14();
    test_parseDescription_15();
    test_parseDescription_16();
    test_parseDescription_17();
    test_parseDescription_18();
    test_parseDescription_19();
    test_parseDescription_20();
    test_parseDescription_21();
    test_parseDescription_22();
    test_parseDescription_23();
    test_parseDescription_24();
    test_parseDescription_25();
    test_parseDescription_26();
    test_parseDescription_27();
    return;
};

function test_parseDescription_0() {
    const text = `<s>The floor beneath you is soft and earthy.</s> <s>You find <il></il> haphazardly placed on it.</s>`;
    const player = new Player("", 5);

    const result = `The floor beneath you is soft and earthy.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_1() {
    const text = `<s>You look at the sink.</s> <s>It looks to be very clean.</s> <s>On the wall above it is a mirror.</s> <s>Under the sink, you find <il></il>.</s>`;
    const player = new Player("", 5);

    const result = `You look at the sink. It looks to be very clean. On the wall above it is a mirror.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_2() {
    const text = `<s>You open the locker.</s> <s>Inside, you find <il><item>a pair of SWIM TRUNKS</item></il>.</s>`;
    const player = new Player("", 5);

    const result = "You open the locker. Inside, you find a pair of SWIM TRUNKS.";
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_3() {
    const text = `<s>You inspect Joshua's body.</s> <if cond="player.intelligence >= 5"><s>He looks pretty emaciated, like he hasn't eaten or drank in days.</s> <s>You don't find any injuries except for a gash in his **NECK**.</s></if> <if cond="player.intelligence < 5"><s>Nothing seems out of the ordinary except for a gash in his **NECK**.</s></if>`;
    const player = new Player("", 5);

    const result = `You inspect Joshua's body. He looks pretty emaciated, like he hasn't eaten or drank in days. You don't find any injuries except for a gash in his **NECK**.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_4() {
    const text = `<s>You inspect Joshua's body.</s> <if cond="player.intelligence >= 5"><s>He looks pretty emaciated, like he hasn't eaten or drank in days.</s> <s>You don't find any injuries except for a gash in his **NECK**.</s></if> <if cond="player.intelligence < 5"><s>Nothing seems out of the ordinary except for a gash in his **NECK**.</s></if>`;
    const player = new Player("", 4);

    const result = `You inspect Joshua's body. Nothing seems out of the ordinary except for a gash in his **NECK**.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_5() {
    const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.intelligence >= 5"><s>In her pockets, you find <il><item>a CIGARETTE</item>, <item>a KNIFE</item>, and <item>a pair of NEEDLES</item></il>.</s></if>`;
    const player = new Player("", 5);

    const result = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE, a KNIFE, and a pair of NEEDLES.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_6() {
    const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.intelligence >= 5"><s>In her pockets, you find <il><item>a CIGARETTE</item>, <item>a KNIFE</item>, and <item>a pair of NEEDLES</item></il>.</s></if>`;
    const player = new Player("", 4);

    const result = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_7() {
    const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.intelligence >= 5"><s>In her pockets, you find <il></il>.</s></if>`;
    const player = new Player("", 5);

    const result = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_8() {
    const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <s>In her pockets, you find <il><item>a CIGARETTE</item><if cond="player.intelligence >= 5">, <item>a KNIFE</item>,</if> and <item>a pair of NEEDLES</item></il>.</s>`;
    const player = new Player("", 4);

    const result = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE and a pair of NEEDLES.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_9() {
    const text = `<s>You take a look at the nemu tree.</s> <s>It's unlike anything you've ever seen before.</s> <s>It has purple wood and blue leaves.</s> <s><if cond="player.talent === 'Ultimate Herbalist'">Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.</if></s>`;
    const player = new Player("Ultimate Herbalist", 5);

    const result = `You take a look at the nemu tree. It's unlike anything you've ever seen before. It has purple wood and blue leaves. Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_10() {
    const text = `<s>You take a look at the nemu tree.</s> <s>It's unlike anything you've ever seen before.</s> <s>It has purple wood and blue leaves.</s> <s><if cond="player.talent === 'Ultimate Herbalist'">Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.</if></s>`;
    const player = new Player("Ultimate Dancer", 5);

    const result = `You take a look at the nemu tree. It's unlike anything you've ever seen before. It has purple wood and blue leaves.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_11() {
    const text = `<desc><s>You examine the pool table.</s> <s>It seems to have everything you need to play a game of pool: <il><item>2 POOL STICKS</item>, <if cond="player.talent === 'Ultimate Tabletop Player'"><item>CHALK</item>,</if> <item>a TRIANGLE</item>, and <item>BALLS</item></il>.</s></desc>`;
    const player = new Player("", 5);

    const result = `You examine the pool table. It seems to have everything you need to play a game of pool: 2 POOL STICKS, a TRIANGLE, and BALLS.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_12() {
    const text = `<desc><desc><s>You open the locker.</s> <s>Inside, you find <il><item>a FIRST AID KIT</item>, <item>a bottle of PAINKILLERS</item>, <item>a PILL BOTTLE</item>, and <item>an OLD KEY</item></il>.</s></desc></desc>`;
    const player = new Player("", 5);

    const result = `You open the locker. Inside, you find a FIRST AID KIT, a bottle of PAINKILLERS, a PILL BOTTLE, and an OLD KEY.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_13() {
    const text = `<desc><s>You examine the shelves.</s> <s>There are a number of tools on them.</s> <s>In particular, you find <il><item>a SAW</item>, <if cond="player.talent === 'Ultimate Lumberjack'"><item>an AX</item></if>, and <item>a pair of HEDGE TRIMMERS</item></il>.</s></desc>`;
    const player = new Player("Ultimate Lumberjack", 5);

    const result = `You examine the shelves. There are a number of tools on them. In particular, you find a SAW, an AX, and a pair of HEDGE TRIMMERS.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_14() {
    const text = `<desc><s>You examine the shelves.</s> <s>There are a number of tools on them.</s> <s>In particular, you find <il><item>a SAW</item>, <if cond="player.talent === 'Ultimate Lumberjack'"><item>an AX</item></if>, and <item>a pair of HEDGE TRIMMERS</item></il>.</s></desc>`;
    const player = new Player("Ultimate Botanist", 5);

    const result = `You examine the shelves. There are a number of tools on them. In particular, you find a SAW and a pair of HEDGE TRIMMERS.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_15() {
    const text = `<desc><s>You open the locker.</s> <s>Inside, you find <il><if cond="player.talent === 'Ultimate Swimmer'"><item>a SWIMSUIT</item></if></il>.</s></desc>`;
    const player = new Player("Ultimate Botanist", 5);

    const result = `You open the locker.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_16() {
    const text = `<desc><s>You flip through the photo album.</s> <if cond="player.talent === 'Iris'"><s>It's full of pictures of your parents and all of the places they've gone.</s> <s>There are no pictures of you.</s></if><if cond="player.talent === 'Scarlet'"><s>It's full of pictures of Iris's parents in various places, but there are no pictures of Iris in here.</s></if><if cond="player.talent !== 'Iris' && player.talent !== 'Scarlet'"><s>It's full of pictures of a married couple in various places around the world.</s> <s>You've never seen these people before.</s></if></desc>`;
    const player = new Player("Monokuma", 5);

    const result = `You flip through the photo album. It's full of pictures of a married couple in various places around the world. You've never seen these people before.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

const codeRed = new Prefab("CODE RED MOUNTAIN DEW", "CODE RED MOUNTAIN DEW", "", "a bottle of CODE RED MOUNTAIN DEW", "bottles of CODE RED MOUNTAIN DEW", true, 1, 1, true, "drinks", 1, ["refreshed"], [], [], false, [], "", "", [], "", "", 2);
const player = new Player("Monokuma", 5);

function test_parseDescription_17() {
    const item = new InventoryItem(player, codeRed, "LEFT HAND", "", 1, 1, "", 2);
    const text = `<desc><s>It's a bottle of Code Red Mountain Dew, which has a cherry flavor.</s> <if cond="player.name === 'Veronica'"><s>This is your favorite flavor, naturally.</s></if><if cond="player.name !== 'Veronica'"><s>For some reason, when you hold it, you get the urge to play video games.</s></if> <s>The drink and label are both red.</s> <if cond="this.uses > 0"><s>It's nice and cold.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

    const result = `It's a bottle of Code Red Mountain Dew, which has a cherry flavor. For some reason, when you hold it, you get the urge to play video games. The drink and label are both red. It's nice and cold.`;
    const actual = parser.parseDescription(text, item, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_18() {
    const item = new InventoryItem(player, codeRed, "LEFT HAND", "", 1, 0, "", 2);
    const text = `<desc><s>It's a bottle of Code Red Mountain Dew, which has a cherry flavor.</s> <if cond="player.name === 'Veronica'"><s>This is your favorite flavor, naturally.</s></if><if cond="player.name !== 'Veronica'"><s>For some reason, when you hold it, you get the urge to play video games.</s></if> <s>The drink and label are both red.</s> <if cond="this.uses > 0"><s>It's nice and cold.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

    const result = `It's a bottle of Code Red Mountain Dew, which has a cherry flavor. For some reason, when you hold it, you get the urge to play video games. The drink and label are both red. It's empty.`;
    const actual = parser.parseDescription(text, item, player);
    assert.ok(
        actual === result,
        actual
    );
}

const breadsticks = new Prefab("BREADSTICKS", "BREADSTICKS", "", "a box of BREADSTICKS", "boxes of BREADSTICKS", true, 1, 1, true, "eats", 6, [], ["satisfied", "hungry", "famished", "starving"], [], false, [], "", "", [], "", "", 2);

function test_parseDescription_19() {
    const item = new InventoryItem(player, breadsticks, "LEFT HAND", "", 1, 6, "", 2);
    const text = `<desc><s>It's a box of frozen garlic breadsticks.</s> <s>There are <var v="this.uses" /> breadsticks inside.</s></desc>`;

    const result = `It's a box of frozen garlic breadsticks. There are 6 breadsticks inside.`;
    const actual = parser.parseDescription(text, item, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_20() {
    const item = new InventoryItem(player, breadsticks, "LEFT HAND", "", 1, 6, "", 2);
    const text = `<desc><s>It's a box of frozen garlic <var v="this.name">.</s> <if cond="this.uses > 1"><s>There are <var v="this.uses" /> <var v="this.name"> inside.</s></if><if cond="this.uses === 1"><s>There is only <var v="this.uses"> breadstick inside.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

    const result = `It's a box of frozen garlic BREADSTICKS. There are 6 BREADSTICKS inside.`;
    const actual = parser.parseDescription(text, item, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_21() {
    const item = new InventoryItem(player, breadsticks, "LEFT HAND", "", 1, 1, "", 2);
    const text = `<desc><s>It's a box of frozen garlic <var v="this.name">.</s> <if cond="this.uses > 1"><s>There are <var v="this.uses" /> <var v="this.name"> inside.</s></if><if cond="this.uses === 1"><s>There is only <var v="this.uses"> breadstick inside.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

    const result = `It's a box of frozen garlic BREADSTICKS. There is only 1 breadstick inside.`;
    const actual = parser.parseDescription(text, item, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_22() {
    const item = new InventoryItem(player, breadsticks, "LEFT HAND", "", 1, 0, "", 2);
    const text = `<desc><s>It's a box of frozen garlic <var v="this.name">.</s> <if cond="this.uses > 1"><s>There are <var v="this.uses" /> <var v="this.name"> inside.</s></if><if cond="this.uses === 1"><s>There is only <var v="this.uses"> breadstick inside.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

    const result = `It's a box of frozen garlic BREADSTICKS. It's empty.`;
    const actual = parser.parseDescription(text, item, player);
    assert.ok(
        actual === result,
        actual
    );
}

const chickenNuggets = new Prefab("CHICKEN NUGGETS", "CHICKEN NUGGETS", "", "a bag of CHICKEN NUGGETS", "bags of CHICKEN NUGGETS", true, 1, 1, true, "eats", 5, [], ["satisfied", "hungry", "famished", "starving"], [], false, [], "", "", [], "", "", 2);

function test_parseDescription_23() {
    const item = new InventoryItem(player, chickenNuggets, "LEFT HAND", "", 1, 5, "", 2);
    const text = `<desc><s>It's a bag of frozen chicken nuggets.</s> <s>Sadly, they don't come in fun shapes.</s> <if cond="this.uses > 0"><s>It looks like there are enough in here for <var v="this.uses" /> serving<if cond="this.uses > 1">s</if>, though.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

    const result = `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It looks like there are enough in here for 5 servings, though.`;
    const actual = parser.parseDescription(text, item, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_24() {
    const item = new InventoryItem(player, chickenNuggets, "LEFT HAND", "", 1, 1, "", 2);
    const text = `<desc><s>It's a bag of frozen chicken nuggets.</s> <s>Sadly, they don't come in fun shapes.</s> <if cond="this.uses > 0"><s>It looks like there are enough in here for <var v="this.uses" /> serving<if cond="this.uses > 1">s</if>, though.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

    const result = `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It looks like there are enough in here for 1 serving, though.`;
    const actual = parser.parseDescription(text, item, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_25() {
    const item = new InventoryItem(player, chickenNuggets, "LEFT HAND", "", 1, 0, "", 2);
    const text = `<desc><s>It's a bag of frozen chicken nuggets.</s> <s>Sadly, they don't come in fun shapes.</s> <if cond="this.uses > 0"><s>It looks like there are enough in here for <var v="this.uses" /> serving<if cond="this.uses > 1">s</if>, though.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`;

    const result = `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It's empty.`;
    const actual = parser.parseDescription(text, item, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_26() {
    const text = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`;

    const result = `It's a pair of long, purple pants with a checker pattern. There are four pockets altogether.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_27() {
    const text = `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"><item>a GUN</item></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"><item>3 pairs of DICE</item></il>.</s></desc>`;

    const result = `It's a pair of long, purple pants with a checker pattern. There are four pockets altogether. In the left pocket, you find a GUN. In the right back pocket, you find 3 pairs of DICE.`;
    const actual = parser.parseDescription(text, null, player);
    assert.ok(
        actual === result,
        actual
    );
}
