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
