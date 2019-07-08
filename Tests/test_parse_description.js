const settings = include('settings.json');
var parser = include(`${settings.modulesDir}/parser.js`);

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
    return;
};

function test_parseDescription_0() {
    const text = `<s>The floor beneath you is soft and earthy.</s> <s>You find <il></il> haphazardly placed on it.</s>`;
    const player = new Player("", 5);

    const result = `The floor beneath you is soft and earthy.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_1() {
    const text = `<s>You look at the sink.</s> <s>It looks to be very clean.</s> <s>On the wall above it is a mirror.</s> <s>Under the sink, you find <il></il>.</s>`;
    const player = new Player("", 5);

    const result = `You look at the sink. It looks to be very clean. On the wall above it is a mirror.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_2() {
    const text = `<s>You open the locker.</s> <s>Inside, you find <il><item>a pair of SWIM TRUNKS</item></il>.</s>`;
    const player = new Player("", 5);

    const result = "You open the locker. Inside, you find a pair of SWIM TRUNKS.";
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_3() {
    const text = `<s>You inspect Joshua's body.</s> <if cond="player.intelligence >= 5"><s>He looks pretty emaciated, like he hasn't eaten or drank in days.</s> <s>You don't find any injuries except for a gash in his **NECK**.</s></if> <if cond="player.intelligence < 5"><s>Nothing seems out of the ordinary except for a gash in his **NECK**.</s></if>`;
    const player = new Player("", 5);

    const result = `You inspect Joshua's body. He looks pretty emaciated, like he hasn't eaten or drank in days. You don't find any injuries except for a gash in his **NECK**.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_4() {
    const text = `<s>You inspect Joshua's body.</s> <if cond="player.intelligence >= 5"><s>He looks pretty emaciated, like he hasn't eaten or drank in days.</s> <s>You don't find any injuries except for a gash in his **NECK**.</s></if> <if cond="player.intelligence < 5"><s>Nothing seems out of the ordinary except for a gash in his **NECK**.</s></if>`;
    const player = new Player("", 4);

    const result = `You inspect Joshua's body. Nothing seems out of the ordinary except for a gash in his **NECK**.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_5() {
    const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.intelligence >= 5"><s>In her pockets, you find <il><item>a CIGARETTE</item>, <item>a KNIFE</item>, and <item>a pair of NEEDLES</item></il>.</s></if>`;
    const player = new Player("", 5);

    const result = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE, a KNIFE, and a pair of NEEDLES.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_6() {
    const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.intelligence >= 5"><s>In her pockets, you find <il><item>a CIGARETTE</item>, <item>a KNIFE</item>, and <item>a pair of NEEDLES</item></il>.</s></if>`;
    const player = new Player("", 4);

    const result = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_7() {
    const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <if cond="player.intelligence >= 5"><s>In her pockets, you find <il></il>.</s></if>`;
    const player = new Player("", 5);

    const result = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_8() {
    const text = `<s>You find Veronica's body lying face up.</s> <s>Her arms are extended straight out with her palms facing up.</s> <s>There's a bloody WOUND on her chest, and the blood has soaked her shirt.</s> <s>In her pockets, you find <il><item>a CIGARETTE</item><if cond="player.intelligence >= 5">, <item>a KNIFE</item>,</if> and <item>a pair of NEEDLES</item></il>.</s>`;
    const player = new Player("", 4);

    const result = `You find Veronica's body lying face up. Her arms are extended straight out with her palms facing up. There's a bloody WOUND on her chest, and the blood has soaked her shirt. In her pockets, you find a CIGARETTE and a pair of NEEDLES.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_9() {
    const text = `<s>You take a look at the nemu tree.</s> <s>It's unlike anything you've ever seen before.</s> <s>It has purple wood and blue leaves.</s> <s><if cond="player.talent === 'Ultimate Herbalist'">Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.</if></s>`;
    const player = new Player("Ultimate Herbalist", 5);

    const result = `You take a look at the nemu tree. It's unlike anything you've ever seen before. It has purple wood and blue leaves. Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_10() {
    const text = `<s>You take a look at the nemu tree.</s> <s>It's unlike anything you've ever seen before.</s> <s>It has purple wood and blue leaves.</s> <s><if cond="player.talent === 'Ultimate Herbalist'">Supposedly if you boil a piece of bark from this it creates some kind of sleep medicine.</if></s>`;
    const player = new Player("Ultimate Dancer", 5);

    const result = `You take a look at the nemu tree. It's unlike anything you've ever seen before. It has purple wood and blue leaves.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_11() {
    const text = `<desc><s>You examine the pool table.</s> <s>It seems to have everything you need to play a game of pool: <il><item>2 POOL STICKS</item>, <if cond="player.talent === 'Ultimate Tabletop Player'"><item>CHALK</item>,</if> <item>a TRIANGLE</item>, and <item>BALLS</item></il>.</s></desc>`;
    const player = new Player("", 5);

    const result = `You examine the pool table. It seems to have everything you need to play a game of pool: 2 POOL STICKS, a TRIANGLE, and BALLS.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}

function test_parseDescription_12() {
    const text = `<desc><desc><s>You open the locker.</s> <s>Inside, you find <il><item>a FIRST AID KIT</item>, <item>a bottle of PAINKILLERS</item>, <item>a PILL BOTTLE</item>, and <item>an OLD KEY</item></il>.</s></desc></desc>`;
    const player = new Player("", 5);

    const result = `You open the locker. Inside, you find a FIRST AID KIT, a bottle of PAINKILLERS, a PILL BOTTLE, and an OLD KEY.`;
    const actual = parser.parseDescription(text, player);
    assert.ok(
        actual === result,
        actual
    );
}
