var settings = include('settings.json');
var game = include('game.json');

var assert = require('assert');

const Room = include(`${settings.dataDir}/Room.js`);
const Status = include(`${settings.dataDir}/Status.js`);
const Player = include(`${settings.dataDir}/Player.js`);

exports.run = async function (bot) {
    game.guild = bot.guilds.first();
    game.logChannel = game.guild.channels.find(channel => channel.id === settings.logChannel);

    init();
    test_inflict_0();
    test_cure_0();
    test_inflict_1();
    test_cure_1();
    test_inflict_2();
    test_cure_2();
    test_inflict_3();
    test_cure_3();
    return;
};

function init() {
    // Clear all game data.
    game.rooms.length = 0;
    game.objects.length = 0;
    game.prefabs.length = 0;
    game.items.length = 0;
    game.puzzles.length = 0;
    game.statusEffects.length = 0;
    game.players.length = 0;
    game.players_alive.length = 0;
    game.players_dead.length = 0;
    game.inventoryItems.length = 0;
    game.whispers.length = 0;

    // Initialize room.
    var beachHouse = new Room("beach-house", game.guild.channels.find(channel => channel.name === "beach-house"), [], [], "", 2);
    game.rooms.push(beachHouse);

    // Initialize status effects.
    var injured = new Status("injured", "24h", false, true, [], [], "", "", "", ["str-1", "dex-1", "spd-1", "sta-1"], "", "", "", 2);
    var mortallyWounded = new Status("mortally wounded", "20m", true, true, [], [injured], "", "", injured, ["str-2", "dex-2", "spd-2", "sta-2"], "", "", "", 3);
    var asleep = new Status("asleep", "", false, true, [], [], "", "", "", ["dex=1"], "disable all, unconscious, enable help, enable status", "", "", 4);
    var unconscious = new Status("unconscious", "2h", false, true, [], [], "", "", "", ["dex=0"], "disable all, unconscious, enable help, enable status", "", "", 5);
    var defensive = new Status("defensive", "24h", false, true, [], [], "", "", "", ["@str-2", "dex+2"], "", "", "", 6);
    var intelligent = new Status("intelligent", "", false, true, [], [], "", "", "", ["int+2"], "", "", "", 7);
    var safe = new Status("safe", "", false, true, [], [], "", "", "", ["@str=0", "dex+9"], "", "", "", 8);
    var energized = new Status("energized", "", false, true, [], [], "", "", "", ["dex+1", "spd+1", "sta+1"], "", "", "", 9);
    var starving = new Status("starving", "168h", true, true, [], [], "", "", "", ["str-5", "int-3", "dex-5", "spd-5", "sta-5"], "", "", "", 10);
    var delirious = new Status("delirious", "24h", false, true, [], [], asleep, "", "", ["int-5", "dex-5", "spd-4", "sta-5"], "disable whisper, no speech", "", "", 11);

    game.statusEffects.push(injured);
    game.statusEffects.push(mortallyWounded);
    game.statusEffects.push(asleep);
    game.statusEffects.push(unconscious);
    game.statusEffects.push(defensive);
    game.statusEffects.push(intelligent);
    game.statusEffects.push(safe);
    game.statusEffects.push(energized);
    game.statusEffects.push(starving);
    game.statusEffects.push(delirious);

    for (let i = 0; i < game.statusEffects.length; i++) {
        let modifierStrings = game.statusEffects[i].statModifiers;
        let modifiers = [];
        for (let j = 0; j < modifierStrings.length; j++) {
            modifierStrings[j] = modifierStrings[j].toLowerCase().trim();

            let modifiesSelf = true;
            if (modifierStrings[j].charAt(0) === '@') {
                modifiesSelf = false;
                modifierStrings[j] = modifierStrings[j].substring(1);
            }

            let stat = null;
            let assignValue = false;
            let value = null;
            if (modifierStrings[j].includes('+')) {
                stat = modifierStrings[j].substring(0, modifierStrings[j].indexOf('+'));
                value = parseInt(modifierStrings[j].substring(stat.length));
            }
            else if (modifierStrings[j].includes('-')) {
                stat = modifierStrings[j].substring(0, modifierStrings[j].indexOf('-'));
                value = parseInt(modifierStrings[j].substring(stat.length));
            }
            else if (modifierStrings[j].includes('=')) {
                stat = modifierStrings[j].substring(0, modifierStrings[j].indexOf('='));
                assignValue = true;
                value = parseInt(modifierStrings[j].substring(stat.length + 1));
            }

            if (stat === "strength") stat = "str";
            else if (stat === "intelligence") stat = "int";
            else if (stat === "dexterity") stat = "dex";
            else if (stat === "speed") stat = "spd";
            else if (stat === "stamina") stat = "sta";

            game.statusEffects[i].statModifiers[j] = { modifiesSelf: modifiesSelf, stat: stat, assignValue: assignValue, value: value };
        }
    }

    // Initialize player.
    var nero = new Player("578764435766640640", null, "Nero", "Nero", "Ultimate Lucky Student", "male", { strength: 7, intelligence: 7, dexterity: 7, speed: 7, stamina: 7 }, true, beachHouse, "", [], [], 3);
    game.players.push(nero); game.players_alive.push(nero);

    return;
}

function test_inflict_0() {
    var nero = game.players[0];

    nero.inflict(game, "injured", false, false, false);
    assert.ok(nero.strength === 6, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 6, nero.dexterity);
    assert.ok(nero.speed === 6, nero.speed);
    assert.ok(nero.maxStamina === 6, nero.maxStamina);

    nero.inflict(game, "mortally wounded", false, false, false);
    assert.ok(nero.strength === 4, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 4, nero.dexterity);
    assert.ok(nero.speed === 4, nero.speed);
    assert.ok(nero.maxStamina === 4, nero.maxStamina);
}

function test_cure_0() {
    var nero = game.players[0];

    nero.cure(game, "injured", false, false, false);
    assert.ok(nero.strength === 5, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 5, nero.dexterity);
    assert.ok(nero.speed === 5, nero.speed);
    assert.ok(nero.maxStamina === 5, nero.maxStamina);

    nero.cure(game, "mortally wounded", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 7, nero.dexterity);
    assert.ok(nero.speed === 7, nero.speed);
    assert.ok(nero.maxStamina === 7, nero.maxStamina);
}

function test_inflict_1() {
    var nero = game.players[0];

    nero.inflict(game, "injured", false, false, false);
    assert.ok(nero.strength === 6, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 6, nero.dexterity);
    assert.ok(nero.speed === 6, nero.speed);
    assert.ok(nero.maxStamina === 6, nero.maxStamina);

    nero.inflict(game, "mortally wounded", false, true, false);
    assert.ok(nero.strength === 5, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 5, nero.dexterity);
    assert.ok(nero.speed === 5, nero.speed);
    assert.ok(nero.maxStamina === 5, nero.maxStamina);
}

function test_cure_1() {
    var nero = game.players[0];

    nero.cure(game, "mortally wounded", false, true, false);
    assert.ok(nero.strength === 6, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 6, nero.dexterity);
    assert.ok(nero.speed === 6, nero.speed);
    assert.ok(nero.maxStamina === 6, nero.maxStamina);

    nero.cure(game, "injured", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 7, nero.dexterity);
    assert.ok(nero.speed === 7, nero.speed);
    assert.ok(nero.maxStamina === 7, nero.maxStamina);
}

function test_inflict_2() {
    var nero = game.players[0];

    nero.inflict(game, "asleep", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 1, nero.dexterity);
    assert.ok(nero.speed === 7, nero.speed);
    assert.ok(nero.maxStamina === 7, nero.maxStamina);

    nero.inflict(game, "unconscious", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 0, nero.dexterity);
    assert.ok(nero.speed === 7, nero.speed);
    assert.ok(nero.maxStamina === 7, nero.maxStamina);

    nero.inflict(game, "defensive", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 0, nero.dexterity);
    assert.ok(nero.speed === 7, nero.speed);
    assert.ok(nero.maxStamina === 7, nero.maxStamina);

    nero.inflict(game, "safe", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 0, nero.dexterity);
    assert.ok(nero.speed === 7, nero.speed);
    assert.ok(nero.maxStamina === 7, nero.maxStamina);

    nero.stamina = 3.5;

    nero.inflict(game, "mortally wounded", false, false, false);
    assert.ok(nero.strength === 5, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 0, nero.dexterity);
    assert.ok(nero.speed === 5, nero.speed);
    assert.ok(nero.maxStamina === 5, nero.maxStamina);
    assert.ok(nero.stamina === 2.5, nero.stamina);

    nero.inflict(game, "energized", false, false, false);
    assert.ok(nero.strength === 5, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 0, nero.dexterity);
    assert.ok(nero.speed === 6, nero.speed);
    assert.ok(nero.maxStamina === 6, nero.maxStamina);
    assert.ok(nero.stamina === 3, nero.stamina);

    nero.inflict(game, "intelligent", false, false, false);
    assert.ok(nero.strength === 5, nero.strength);
    assert.ok(nero.intelligence === 9, nero.intelligence);
    assert.ok(nero.dexterity === 0, nero.dexterity);
    assert.ok(nero.speed === 6, nero.speed);
    assert.ok(nero.maxStamina === 6, nero.maxStamina);
    assert.ok(nero.stamina === 3, nero.stamina);
}

function test_cure_2() {
    var nero = game.players[0];

    nero.cure(game, "unconscious", false, false, false);
    assert.ok(nero.strength === 5, nero.strength);
    assert.ok(nero.intelligence === 9, nero.intelligence);
    assert.ok(nero.dexterity === 1, nero.dexterity);
    assert.ok(nero.speed === 6, nero.speed);
    assert.ok(nero.maxStamina === 6, nero.maxStamina);
    assert.ok(nero.stamina === 3, nero.stamina);

    nero.cure(game, "asleep", false, false, false);
    assert.ok(nero.strength === 5, nero.strength);
    assert.ok(nero.intelligence === 9, nero.intelligence);
    assert.ok(nero.dexterity === 10, nero.dexterity);
    assert.ok(nero.speed === 6, nero.speed);
    assert.ok(nero.maxStamina === 6, nero.maxStamina);
    assert.ok(nero.stamina === 3, nero.stamina);
    
    nero.cure(game, "defensive", false, false, false);
    assert.ok(nero.strength === 5, nero.strength);
    assert.ok(nero.intelligence === 9, nero.intelligence);
    assert.ok(nero.dexterity === 10, nero.dexterity);
    assert.ok(nero.speed === 6, nero.speed);
    assert.ok(nero.maxStamina === 6, nero.maxStamina);
    assert.ok(nero.stamina === 3, nero.stamina);

    nero.cure(game, "safe", false, false, false);
    assert.ok(nero.strength === 5, nero.strength);
    assert.ok(nero.intelligence === 9, nero.intelligence);
    assert.ok(nero.dexterity === 6, nero.dexterity);
    assert.ok(nero.speed === 6, nero.speed);
    assert.ok(nero.maxStamina === 6, nero.maxStamina);
    assert.ok(nero.stamina === 3, nero.stamina);

    nero.stamina = 6;

    nero.cure(game, "mortally wounded", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 9, nero.intelligence);
    assert.ok(nero.dexterity === 8, nero.dexterity);
    assert.ok(nero.speed === 8, nero.speed);
    assert.ok(nero.maxStamina === 8, nero.maxStamina);
    assert.ok(nero.stamina === 8, nero.stamina);

    nero.cure(game, "energized", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 9, nero.intelligence);
    assert.ok(nero.dexterity === 7, nero.dexterity);
    assert.ok(nero.speed === 7, nero.speed);
    assert.ok(nero.maxStamina === 7, nero.maxStamina);
    assert.ok(nero.stamina === 7, nero.stamina);

    nero.cure(game, "intelligent", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 7, nero.dexterity);
    assert.ok(nero.speed === 7, nero.speed);
    assert.ok(nero.maxStamina === 7, nero.maxStamina);
    assert.ok(nero.stamina === 7, nero.stamina);
}

function test_inflict_3() {
    var nero = game.players[0];

    nero.inflict(game, "starving", false, false, false);
    assert.ok(nero.strength === 2, nero.strength);
    assert.ok(nero.intelligence === 4, nero.intelligence);
    assert.ok(nero.dexterity === 2, nero.dexterity);
    assert.ok(nero.speed === 2, nero.speed);
    assert.ok(nero.maxStamina === 2, nero.maxStamina);

    nero.inflict(game, "delirious", false, false, false);
    assert.ok(nero.strength === 2, nero.strength);
    assert.ok(nero.intelligence === 1, nero.intelligence);
    assert.ok(nero.dexterity === 1, nero.dexterity);
    assert.ok(nero.speed === 1, nero.speed);
    assert.ok(nero.maxStamina === 1, nero.maxStamina);
}

function test_cure_3() {
    var nero = game.players[0];

    nero.cure(game, "delirious", false, false, false);
    assert.ok(nero.strength === 2, nero.strength);
    assert.ok(nero.intelligence === 4, nero.intelligence);
    assert.ok(nero.dexterity === 2, nero.dexterity);
    assert.ok(nero.speed === 2, nero.speed);
    assert.ok(nero.maxStamina === 2, nero.maxStamina);

    nero.cure(game, "starving", false, false, false);
    assert.ok(nero.strength === 7, nero.strength);
    assert.ok(nero.intelligence === 7, nero.intelligence);
    assert.ok(nero.dexterity === 7, nero.dexterity);
    assert.ok(nero.speed === 7, nero.speed);
    assert.ok(nero.maxStamina === 7, nero.maxStamina);
}
