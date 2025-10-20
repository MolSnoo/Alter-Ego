const test = require('node:test');
const assert = require("node:assert");
const {localize} = require("./index");
const {localizeFormat} = require("./index");

test('synchronous passing test', (t) => {
    assert.strictEqual(1, 1);
})

test('test localize', (t) => {
    assert.strictEqual(localize("TestString"), "Hello World!");
})

test('test localizeFormat', (t) => {
    assert.strictEqual(localizeFormat(
            "TestStringWithArgs",
            ["Amy", "a pencil", "her"]),
        "Amy puts a pencil in her pockets and ties her shoelaces together.")
})
