var settings = include('settings.json');
var game = include('game.json');
const loader = include(`${settings.modulesDir}/loader.js`);
const finder = include(`${settings.modulesDir}/finder.js`);

var assert = require('assert');

exports.run = async function (bot) {
    await init(bot);
    test_findRoom();
    test_findObject();
    test_findPrefab();
    test_findItem();
    test_findPuzzle();
    test_findEvent();
    test_findStatusEffect();
    test_findPlayer();
    test_findLivingPlayer();
    test_findDeadPlayer();
    test_findInventoryItem();
    return;
};

function init(bot) {
    return new Promise(async (resolve) => {
        game.guild = bot.guilds.cache.first();
        game.commandChannel = game.guild.channels.cache.find(channel => channel.id === settings.commandChannel);
        game.logChannel = game.guild.channels.cache.find(channel => channel.id === settings.logChannel);
        await loader.loadRooms(game, false);
        await loader.loadObjects(game, false);
        await loader.loadPrefabs(game, false);
        await loader.loadRecipes(game, false);
        await loader.loadItems(game, false);
        await loader.loadPuzzles(game, false);
        await loader.loadEvents(game, false);
        await loader.loadStatusEffects(game, false);
        await loader.loadPlayers(game, false);
        await loader.loadInventories(game, false);
        resolve(game);
    });
}

function test_findRoom() {
    const beachHouse = finder.findRoom("beach-house");
    assert(beachHouse !== undefined);
    assert.ok(beachHouse.name === "beach-house", beachHouse.name);

    const womensLockerRoom = finder.findRoom("WOMENS LOCKER ROOM");
    assert(womensLockerRoom !== undefined);
    assert.ok(womensLockerRoom.name === "womens-locker-room", womensLockerRoom.name);

    const undefinedRoom = finder.findRoom("dorm-4");
    assert(undefinedRoom === undefined);
}

function test_findObject() {
    const path1Floor = finder.findObject("FLOOR");
    assert(path1Floor !== undefined);
    assert.ok(path1Floor.name === "FLOOR" && path1Floor.location.name === "path-1", path1Floor.location.name);

    const parkFloor = finder.findObject("fl'oor", "PARK");
    assert(parkFloor !== undefined);
    assert.ok(parkFloor.name === "FLOOR" && parkFloor.location.name === "park", parkFloor.location.name);

    const undefinedFloor = finder.findObject("FLOOR", "house");
    assert(undefinedFloor === undefined);

    const undefinedHouse = finder.findObject("HOUSE");
    assert(undefinedHouse === undefined);
}

function test_findPrefab() {
    const butchersKnife = finder.findPrefab("butcher's knife");
    assert(butchersKnife !== undefined);
    assert.ok(butchersKnife.id === "BUTCHERS KNIFE", butchersKnife.id);
}

function test_findItem() {
    const caveSword = finder.findItem("sword");
    assert(caveSword !== undefined);
    assert.ok(caveSword.prefab.id === "SWORD" && caveSword.location.name === "cave", caveSword.location.name);

    const summitSword = finder.findItem("SWORD", "summit");
    assert(summitSword !== undefined);
    assert.ok(summitSword.prefab.id === "SWORD" && summitSword.location.name === "summit", summitSword.location.name);

    const locker2Swimsuit = finder.findItem("SWIMSUIT", "WOMENS LOCKER ROOM");
    assert(locker2Swimsuit !== undefined);
    assert.ok(locker2Swimsuit.prefab.id === "SWIMSUIT" && locker2Swimsuit.location.name === "womens-locker-room" && locker2Swimsuit.containerName === "Object: LOCKER 2",
        locker2Swimsuit.containerName);

    const locker6Swimsuit = finder.findItem("SWIMSUIT", "WOMENS LOCKER ROOM", "Object: locker 6");
    assert(locker6Swimsuit !== undefined);
    assert.ok(locker6Swimsuit.prefab.id === "SWIMSUIT" && locker6Swimsuit.location.name === "womens-locker-room" && locker6Swimsuit.containerName === "Object: LOCKER 6",
        locker6Swimsuit.containerName);

    const pot1 = finder.findItem("POT", "kitchen");
    assert(pot1 !== undefined);
    assert.ok(pot1.identifier === "POT 1", pot1.identifier);

    const pot3 = finder.findItem("pot 3");
    assert(pot3 !== undefined);
    assert.ok(pot3.identifier === "POT 3", pot3.identifier);

    const undefinedFirstAidKit = finder.findItem("full first aid kit", "mens locker room", "Object: FLOOR");
    assert(undefinedFirstAidKit === undefined);
}

function test_findPuzzle() {
    const womensLock = finder.findPuzzle("lock");
    assert(womensLock !== undefined);
    assert.ok(womensLock.name === "LOCK" && womensLock.location.name === "womens-locker-room", womensLock.location.name);

    const mensShower1 = finder.findPuzzle("shower 1", "MEN'S LOCKER ROOM");
    assert(mensShower1 !== undefined);
    assert.ok(mensShower1.name === "SHOWER 1" && mensShower1.location.name === "mens-locker-room", mensShower1.location.name);

    const undefinedShower = finder.findPuzzle("SHOWER 4");
    assert(undefinedShower === undefined);
}

function test_findEvent() {
    const sunrise = finder.findEvent("SUNRISE");
    assert(sunrise !== undefined);
    assert.ok(sunrise.name === "SUNRISE", sunrise.name);

    const sunriseWindows = finder.findEvent("sunrise windows");
    assert(sunriseWindows !== undefined);
    assert.ok(sunriseWindows.name === "SUNRISE WINDOWS", sunriseWindows.name);

    const undefinedLoudBang = finder.findEvent("LOUD BANG");
    assert(undefinedLoudBang === undefined);
}

function test_findStatusEffect() {
    const hungry = finder.findStatusEffect("HUNGRY");
    assert(hungry !== undefined);
    assert.ok(hungry.name === "hungry", hungry.name);

    const undefinedParched = finder.findStatusEffect("parched");
    assert(undefinedParched === undefined);
}

function test_findPlayer() {
    const nero = finder.findPlayer("nero");
    assert(nero !== undefined);
    assert.ok(nero.name === "Nero", nero.name);

    const undefinedEvad = finder.findPlayer("Evad");
    assert(undefinedEvad === undefined);
}

function test_findLivingPlayer() {
    const vivian = finder.findLivingPlayer("Vivian");
    assert(vivian !== undefined);
    assert.ok(vivian.name === "Vivian", vivian.name);

    const undefinedKeiko = finder.findPlayer("keiko");
    assert(undefinedKeiko === undefined);
}

function test_findDeadPlayer() {
    const undefinedNero = finder.findDeadPlayer("Nero");
    assert(undefinedNero === undefined);
}

function test_findInventoryItem() {
    let nerosShirt = finder.findInventoryItem("nero's shirt");
    assert(nerosShirt !== undefined);
    assert.ok(nerosShirt.prefab.id === "NEROS SHIRT" && nerosShirt.player.name === "Nero" && nerosShirt.containerName === "" && nerosShirt.equipmentSlot === "SHIRT",
        `${nerosShirt.prefab.id} ${nerosShirt.player.name} ${nerosShirt.containerName} ${nerosShirt.equipmentSlot}`);

    nerosShirt = finder.findInventoryItem("nero's shirt", "Nero");
    assert(nerosShirt !== undefined);
    assert.ok(nerosShirt.prefab.id === "NEROS SHIRT" && nerosShirt.player.name === "Nero" && nerosShirt.containerName === "" && nerosShirt.equipmentSlot === "SHIRT",
        `${nerosShirt.prefab.id} ${nerosShirt.player.name} ${nerosShirt.containerName} ${nerosShirt.equipmentSlot}`);

    nerosShirt = finder.findInventoryItem("NEROS SHIRT", "Nero", "");
    assert(nerosShirt !== undefined);
    assert.ok(nerosShirt.prefab.id === "NEROS SHIRT" && nerosShirt.player.name === "Nero" && nerosShirt.containerName === "" && nerosShirt.equipmentSlot === "SHIRT",
        `${nerosShirt.prefab.id} ${nerosShirt.player.name} ${nerosShirt.containerName} ${nerosShirt.equipmentSlot}`);

    nerosShirt = finder.findInventoryItem("NEROS SHIRT", "Nero", "", "shirt");
    assert(nerosShirt !== undefined);
    assert.ok(nerosShirt.prefab.id === "NEROS SHIRT" && nerosShirt.player.name === "Nero" && nerosShirt.containerName === "" && nerosShirt.equipmentSlot === "SHIRT",
        `${nerosShirt.prefab.id} ${nerosShirt.player.name} ${nerosShirt.containerName} ${nerosShirt.equipmentSlot}`);

    let viviansLaptop = finder.findInventoryItem("vivian's laptop");
    assert(viviansLaptop !== undefined);
    assert.ok(viviansLaptop.prefab.id === "VIVIANS LAPTOP" && viviansLaptop.player.name === "Vivian" && viviansLaptop.containerName === "VIVIANS SATCHEL/SATCHEL" && viviansLaptop.equipmentSlot === "BAG",
        `${viviansLaptop.prefab.id} ${viviansLaptop.player.name} ${viviansLaptop.containerName} ${viviansLaptop.equipmentSlot}`);

    viviansLaptop = finder.findInventoryItem("vivian's laptop", "Vivian");
    assert(viviansLaptop !== undefined);
    assert.ok(viviansLaptop.prefab.id === "VIVIANS LAPTOP" && viviansLaptop.player.name === "Vivian" && viviansLaptop.containerName === "VIVIANS SATCHEL/SATCHEL" && viviansLaptop.equipmentSlot === "BAG",
        `${viviansLaptop.prefab.id} ${viviansLaptop.player.name} ${viviansLaptop.containerName} ${viviansLaptop.equipmentSlot}`);

    viviansLaptop = finder.findInventoryItem("VIVIANS LAPTOP", "Vivian", "vivian's satchel/satchel");
    assert(viviansLaptop !== undefined);
    assert.ok(viviansLaptop.prefab.id === "VIVIANS LAPTOP" && viviansLaptop.player.name === "Vivian" && viviansLaptop.containerName === "VIVIANS SATCHEL/SATCHEL" && viviansLaptop.equipmentSlot === "BAG",
        `${viviansLaptop.prefab.id} ${viviansLaptop.player.name} ${viviansLaptop.containerName} ${viviansLaptop.equipmentSlot}`);

    viviansLaptop = finder.findInventoryItem("VIVIANS LAPTOP", "Vivian", "VIVIANS SATCHEL/SATCHEL", "bag");
    assert(viviansLaptop !== undefined);
    assert.ok(viviansLaptop.prefab.id === "VIVIANS LAPTOP" && viviansLaptop.player.name === "Vivian" && viviansLaptop.containerName === "VIVIANS SATCHEL/SATCHEL" && viviansLaptop.equipmentSlot === "BAG",
        `${viviansLaptop.prefab.id} ${viviansLaptop.player.name} ${viviansLaptop.containerName} ${viviansLaptop.equipmentSlot}`);

    const undefinedDefaultShoes = finder.findInventoryItem("DEFAULT SHOES");
    assert(undefinedDefaultShoes === undefined);
}
