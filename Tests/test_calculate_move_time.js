const settings = include('settings.json');

var assert = require('assert');

const Exit = include(`${settings.dataDir}/Exit.js`);
const Player = include(`${settings.dataDir}/Player.js`);

const player = new Player(
    "578764435766640640",
    null,
    "Nero",
    "Nero",
    "",
    settings.defaultStats,
    true,
    null,
    "",
    new Array(),
    new Array(),
    3
);
player.pos.x = 400;
player.pos.y = 10;
player.pos.z = 445;

const exit = new Exit(
    "BOTANICAL GARDEN",
    {
        x: 400,
        y: 10,
        z: 575
    },
    true,
    null,
    null,
    28
);

exports.run = function () {
    test_speed_1();
    test_speed_2();
    test_speed_3();
    test_speed_4();
    test_speed_5();
    test_speed_6();
    test_speed_7();
    test_speed_8();
    test_speed_9();
    test_speed_10();

    test_speed_5_slope_10();
    test_speed_5_slope_20();
    test_speed_5_slope_30();
    test_speed_5_slope_40();
    test_speed_5_slope_50();
    test_speed_5_slope_60();
    test_speed_5_slope_70();
    test_speed_5_slope_80();
    test_speed_5_slope_90();
    return;
};

function test_speed_1() {
    player.speed = 1;

    const result = 36.1;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_2() {
    player.speed = 2;

    const result = 32.5;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_3() {
    player.speed = 3;

    const result = 29.5;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_4() {
    player.speed = 4;

    const result = 27.1;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5() {
    player.speed = 5;

    const result = 23.2;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_6() {
    player.speed = 6;

    const result = 20.3;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_7() {
    player.speed = 7;

    const result = 18.1;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_8() {
    player.speed = 8;

    const result = 15.5;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_9() {
    player.speed = 9;

    const result = 13.5;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_10() {
    player.speed = 10;

    const result = 11.6;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5_slope_10() {
    player.speed = 5;
    exit.pos.y = 11;

    const result = 25;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5_slope_20() {
    player.speed = 5;
    exit.pos.y = 12;

    const result = 29.5;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5_slope_30() {
    player.speed = 5;
    exit.pos.y = 13;

    const result = 32.5;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5_slope_40() {
    player.speed = 5;
    exit.pos.y = 14;

    const result = 40.6;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5_slope_50() {
    player.speed = 5;
    exit.pos.y = 15;

    const result = 46.4;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5_slope_60() {
    player.speed = 5;
    exit.pos.y = 16;

    const result = 54.2;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5_slope_70() {
    player.speed = 5;
    exit.pos.y = 17;

    const result = 81.3;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5_slope_80() {
    player.speed = 5;
    exit.pos.y = 18;

    const result = 108;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}

function test_speed_5_slope_90() {
    player.speed = 5;
    exit.pos.y = 19;

    const result = 325;
    const actual = parseFloat((player.calculateMoveTime(exit) / 1000).toPrecision(3));
    assert.ok(
        actual === result,
        actual
    );
}
