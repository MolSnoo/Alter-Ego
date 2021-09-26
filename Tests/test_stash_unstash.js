var settings = include('settings.json');
var game = include('game.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

var assert = require('assert');

const Room = include(`${settings.dataDir}/Room.js`);
const Object = include(`${settings.dataDir}/Object.js`);
const Prefab = include(`${settings.dataDir}/Prefab.js`);
const Item = include(`${settings.dataDir}/Item.js`);
const Puzzle = include(`${settings.dataDir}/Puzzle.js`);
const EquipmentSlot = include(`${settings.dataDir}/EquipmentSlot.js`);
const Player = include(`${settings.dataDir}/Player.js`);
const InventoryItem = include(`${settings.dataDir}/InventoryItem.js`);

exports.run = async function () {
    init_0();
    test_stash_item_0();
    test_unstash_item_0();
    await test_push_queue_0();
    return;
};

function init_0() {
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
    var roomBeachHouse = new Room("beach-house", null, [], [], "", 2);
    game.rooms.push(roomBeachHouse);

    // Initialize objects;
    var objectFloor = new Object("FLOOR", roomBeachHouse, true, "", "", false, false, false, false, "on", "<desc><s>The floor beneath you is smooth and wooden.</s> <s>There's a rug underneath the COUCHES and TABLE.</s> <s>You find <il></il> haphazardly placed on the floor.</s></desc>", 2);
    var objectCouches = new Object("COUCHES", roomBeachHouse, true, "", "", false, false, false, false, "in", "<desc><s>You inspect the couches.</s> <s>They are soft and comfortable, and each is lined with a few pillows.</s> <s>Looking underneath the cushions, you find <il><item>a GUN</item></il>.</s></desc>", 3);
    var objectTable = new Object("TABLE", roomBeachHouse, true, "CHEST", "", false, false, false, false, "in", `<desc><s>You examine the table.</s> <if cond="game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === true"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open, but it seems to be unlocked.</s> <var v=" game.puzzles.find(puzzle => puzzle.name === 'CHEST').alreadySolvedDescription" /></if><if cond="game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === false"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open.</s></if></desc>`, 4);
    var objectCloset = new Object("CLOSET", roomBeachHouse, true, "", "", false, false, false, true, "in", "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il><item>a SLINGSHOT</item></il>.</s></desc>", 5);
    var objectClothes = new Object("CLOTHES", roomBeachHouse, true, "", "", false, false, false, false, "", "<desc><s>Examining the clothes, you find a variety of different garments.</s> <s>Sundresses, T-shirts, shorts, skirts - this closet seems to have everything you could think of.</s></desc>", 6);
    var objectHotTub = new Object("HOT TUB", roomBeachHouse, true, "", "", false, false, false, false, "", "<desc><s>You inspect the hot tub.</s> <s>It looks to be fairly spacious, with room for probably up to 3 people to use at once.</s> <s>It has a digital thermometer to increase the temperature up to 100 degrees Fahrenheit, and buttons to turn it on.</s> <s>In the middle, you find <il></il>.</s></desc>", 7);
    game.objects.push(objectFloor);
    game.objects.push(objectCouches);
    game.objects.push(objectTable);
    game.objects.push(objectCloset);
    game.objects.push(objectClothes);
    game.objects.push(objectHotTub);

    // Initialize puzzles.
    var puzzleChest = new Puzzle("CHEST", true, false, roomBeachHouse, "TABLE", "key lock", true, null, "", NaN, ["set accessible puzzle items chest beach-house"], ["set inaccessible puzzle items chest beach-house"], `<desc><s>You insert the key into the lock and turn it.</s> <s>It unlocks.</s> <var v="this.alreadySolvedDescription" /></desc>`, "<desc><s>You open the chest.</s> <s>Inside, you find <il><item>a HAMMER</item>, <item>a bottle of PEPSI</item>, <item>a ROPE</item>, and <item>a KNIFE</item></il>.</s></desc>", "", "", "<desc><s>You can't seem to get the chest open. If only you had the key for it...</s></desc>", 2);
    game.puzzles.push(puzzleChest);

    // Link objects and puzzles.
    objectTable.childPuzzle = puzzleChest;
    puzzleChest.parentObject = objectTable;

    // Initialize prefabs.
    var prefabGun = new Prefab("GUN", "GUN", "", "a GUN", "", true, 2, 2, false, "", NaN, [], [], "", false, [], [], [], [], [], "", "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>", 2);
    var prefabPepsi = new Prefab("PEPSI", "PEPSI", "", "a bottle of PEPSI", "", true, 2, 3, true, "drinks", 1, ["refreshed"], [], "GLASS BOTTLE", false, [], [], [], [], [], "", "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>", 3);
    var prefabGlassBottle = new Prefab("GLASS BOTTLE", "GLASS BOTTLE", "", "a GLASS BOTTLE", "", true, 2, 2, false, "", NaN, [], [], "", false, [], [], [], [], [], "", "<desc><s>You examine the bottle.</s> <s>It appears to be an old Pepsi bottle, but there's nothing inside it anymore.</s></desc>", 4);
    var prefabRope = new Prefab("ROPE", "ROPE", "", "a ROPE", "", true, 6, 2, false, "", NaN, [], [], "", false, [], [], [], [], [], "", "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>", 5);
    var prefabKnife = new Prefab("KNIFE", "KNIFE", "", "a KNIFE", "", true, 2, 2, false, "", NaN, [], [], "", false, [], [], [], [], [], "", "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>", 6);
    var prefabSlingshot = new Prefab("SLINGSHOT", "SLINGSHOT", "", "a SLINGSHOT", "", true, 2, 1, false, "", NaN, [], [], "", false, [], [], [], [], [], "", "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>", 7);
    var prefabToolBox = new Prefab("TOOL BOX", "TOOL BOX", "", "a TOOL BOX", "", false, 4, 5, false, "", NaN, [], [], "", false, [], [], [], [], [{ name: "TOOL BOX", capacity: 20, takenSpace: 0, weight: 0, item: [] }], "in", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il></il>.</s></desc>", 8);
    var prefabScrewdriver = new Prefab("SCREWDRIVER", "SCREWDRIVER", "SCREWDRIVERS", "a SCREWDRIVER", "SCREWDRIVERS", true, 1, 1, false, "", NaN, [], [], "", false, [], [], [], [], [], "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 9);
    var prefabHammer = new Prefab("HAMMER", "HAMMER", "HAMMERS", "a HAMMER", "HAMMERS", true, 1, 2, false, "", NaN, [], [], "", false, [], [], [], [], [], "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 10);
    var prefabWrench = new Prefab("WRENCH", "WRENCH", "WRENCHES", "a WRENCH", "WRENCHES", true, 1, 2, false, "", NaN, [], [], "", false, [], [], [], [], [], "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 11);
    var prefabViviansGlasses = new Prefab("VIVIANS GLASSES", "GLASSES", "", "a pair of GLASSES", "pairs of GLASSES", true, 1, 1, false, "", NaN, [], [], "", true, ["GLASSES"], [], [], [], [], "", "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>", 12);
    var prefabViviansShirt = new Prefab("VIVIANS SHIRT", "DRESS SHIRT", "DRESS SHIRTS", "a DRESS SHIRT", "DRESS SHIRTS", true, 5, 1, false, "", NaN, [], [], "", true, ["SHIRT"], [], [], [], [], "", "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>", 13);
    var prefabViviansSweater = new Prefab("VIVIANS SWEATER", "SWEATER", "SWEATERS", "a SWEATER", "SWEATERS", true, 5, 2, false, "", NaN, [], [], "", true, ["JACKET"], [], [], [], [], "", "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>", 14);
    var prefabViviansSatchel = new Prefab("VIVIANS SATCHEL", "SATCHEL", "SATCHELS", "a SATCHEL", "SATCHELS", true, 6, 1, false, "", NaN, [], [], "", true, ["BAG"], [], [], [], [{ name: "SATCHEL", capacity: 6, takenSpace: 0, weight: 0, item: [] }], "in", "<desc><s>It's a beige satchel with a long strap to go over the shoulder.</s> <s>Inside, you find <il></il>.</s></desc>", 15);
    var prefabViviansSkirt = new Prefab("VIVIANS SKIRT", "SKIRT", "SKIRTS", "a SKIRT", "SKIRTS", true, 4, 1, false, "", NaN, [], [], "", true, ["PANTS"], ["UNDERWEAR"], [], [], [{ name: "LEFT POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }, { name: "RIGHT POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }], "in", `<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 16);
    var prefabViviansUnderwear = new Prefab("VIVIANS UNDERWEAR", "PANTIES", "", "a pair of PANTIES", "pairs of PANTIES", true, 1, 0, false, "", NaN, [], [], "", true, ["UNDERWEAR"], [], [], [], [], "", "<desc><s>It's a pair of plain, pink panties.</s></desc>", 17);
    var prefabViviansSocks = new Prefab("VIVIANS SOCKS", "THIGH HIGHS", "", "a pair of THIGH HIGHS", "pairs of THIGH HIGHS", true, 5, 1, false, "", NaN, [], [], "", true, ["SOCKS"], [], [], [], [], "", "<desc><s>It's a pair of black thigh high socks.</s></desc>", 18);
    var prefabViviansShoes = new Prefab("VIVIANS SHOES", "TENNIS SHOES", "", "a pair of TENNIS SHOES", "pairs of TENNIS SHOES", true, 2, 1, false, "", NaN, [], [], "", true, ["SHOES"], [], [], [], [], "", "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>", 19);
    var prefabViviansLaptop = new Prefab("VIVIANS LAPTOP", "LAPTOP", "LAPTOPS", "a LAPTOP", "LAPTOPS", false, 4, 2, false, "", NaN, [], [], "", false, [], [], [], [], [], "", `<desc><if cond="player.name === 'Vivian'"><s>This is your laptop.</s> <s>You take it with you everywhere you go.</s></if><if cond="player.name !== 'Vivian'"><s>This is a very expensive-looking laptop.</s> <s>The keyboard lights up when a key is pressed.</s> <s>The login screen is asking for a password for Vivian's account.</s></if></desc>`, 20);
    var prefabNerosGlasses = new Prefab("NEROS GLASSES", "GLASSES", "", "a pair of GLASSES", "pairs of GLASSES", true, 1, 1, false, "", NaN, [], [], "", true, ["GLASSES"], [], [], [], [], "", "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>", 21);
    var prefabNerosShirt = new Prefab("NEROS SHIRT", "DRESS SHIRT", "DRESS SHIRTS", "a DRESS SHIRT", "DRESS SHIRTS", true, 5, 1, false, "", NaN, [], [], "", true, ["SHIRT"], [], [], [], [], "", "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>", 22);
    var prefabNerosBlazer = new Prefab("NEROS BLAZER", "BLAZER", "BLAZERS", "a BLAZER", "BLAZERS", true, 5, 1, false, "", NaN, [], [], "", true, ["JACKET"], [], [], [], [{ name: "BREAST POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }, { name: "LEFT POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }, { name: "RIGHT POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }], "in", `<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name="BREAST POCKET"></il>.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 23);
    var prefabNerosPants = new Prefab("NEROS PANTS", "PANTS", "", "a pair of PANTS", "pairs of PANTS", true, 5, 1, false, "", NaN, [], "", [], true, ["PANTS"], ["UNDERWEAR", "SOCKS"], [], [], [{ name: "LEFT POCKET", capacity: 3, takenSpace: 0, weight: 0, item: [] }, { name: "RIGHT POCKET", capacity: 3, takenSpace: 0, weight: 0, item: [] }, { name: "LEFT BACK POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }, { name: "RIGHT BACK POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }], "in", `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`, 24);
    var prefabNerosUnderwear = new Prefab("NEROS UNDERWEAR", "BOXERS", "", "a pair of BOXERS", "pairs of BOXERS", true, 2, 0, false, "", NaN, [], [], "", true, ["UNDERWEAR"], [], [], [], [], "", "<desc><s>It's a pair of black, plaid boxers.</s></desc>", 25);
    var prefabNerosSocks = new Prefab("NEROS SOCKS", "SOCKS", "", "a pair of SOCKS", "pairs of SOCKS", true, 1, 0, false, "", NaN, [], [], "", true, ["SOCKS"], [], [], [], [], "", "<desc><s>It's a pair of plain, black ankle socks.</s></desc>", 26);
    var prefabNerosShoes = new Prefab("NEROS SHOES", "TENNIS SHOES", "", "a pair of TENNIS SHOES", "pairs of TENNIS SHOES", true, 3, 1, false, "", NaN, [], [], "", true, ["SHOES"], [], [], [], [], "", "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>", 27);
    var prefabSmallBag = new Prefab("SMALL BAG", "SMALL BAG", "", "a SMALL BAG", "", true, 2, 1, false, "", NaN, [], [], "", false, [], [], [], [], [{ name: "SMALL BAG", capacity: 2, takenSpace: 0, weight: 0, item: [] }], "in", "<desc><s>It's a small bag.</s> <s>Inside, you find <il></il>.</s></desc>", 28);

    game.prefabs.push(prefabGun);
    game.prefabs.push(prefabPepsi);
    game.prefabs.push(prefabGlassBottle);
    game.prefabs.push(prefabRope);
    game.prefabs.push(prefabKnife);
    game.prefabs.push(prefabSlingshot);
    game.prefabs.push(prefabToolBox);
    game.prefabs.push(prefabScrewdriver);
    game.prefabs.push(prefabHammer);
    game.prefabs.push(prefabWrench);
    game.prefabs.push(prefabViviansGlasses);
    game.prefabs.push(prefabViviansShirt);
    game.prefabs.push(prefabViviansSweater);
    game.prefabs.push(prefabViviansSatchel);
    game.prefabs.push(prefabViviansSkirt);
    game.prefabs.push(prefabViviansUnderwear);
    game.prefabs.push(prefabViviansSocks);
    game.prefabs.push(prefabViviansShoes);
    game.prefabs.push(prefabViviansLaptop);
    game.prefabs.push(prefabNerosGlasses);
    game.prefabs.push(prefabNerosShirt);
    game.prefabs.push(prefabNerosBlazer);
    game.prefabs.push(prefabNerosPants);
    game.prefabs.push(prefabNerosUnderwear);
    game.prefabs.push(prefabNerosSocks);
    game.prefabs.push(prefabNerosShoes);
    game.prefabs.push(prefabSmallBag);

    // Initialize items.
    var itemGun = new Item(prefabGun, "", roomBeachHouse, true, "Object: COUCHES", 1, NaN, "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>", 2);
    var itemPepsi = new Item(prefabPepsi, "", roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>", 3);
    var itemRope = new Item(prefabRope, "", roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>", 4);
    var itemKnife = new Item(prefabKnife, "", roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>", 5);
    var itemSlingshot = new Item(prefabSlingshot, "", roomBeachHouse, true, "Object: CLOSET", 1, NaN, "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>", 6);
    var itemToolBox = new Item(prefabToolBox, "TOOL BOX", roomBeachHouse, true, "Object: CLOSET", 0, NaN, "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SMALL BAG</item>, <item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>", 7);
    var itemScrewdriver = new Item(prefabScrewdriver, "", roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 0, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 8);
    var itemHammer = new Item(prefabHammer, "", roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 0, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 9);
    var itemWrench = new Item(prefabWrench, "", roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 0, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 10);
    var itemSmallBag = new Item(prefabSmallBag, "SMALL BAG 2", roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 0, NaN, "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>", 11);
    var itemSmallBagWrench = new Item(prefabWrench, "", roomBeachHouse, true, "Item: SMALL BAG 2/SMALL BAG", 0, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 12);
    var itemSmallBagScrewdriver = new Item(prefabScrewdriver, "", roomBeachHouse, true, "Item: SMALL BAG 2/SMALL BAG", 0, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 13);

    game.items.push(itemGun);
    game.items.push(itemPepsi);
    game.items.push(itemRope);
    game.items.push(itemKnife);
    game.items.push(itemSlingshot);
    game.items.push(itemToolBox);
    game.items.push(itemScrewdriver);
    game.items.push(itemHammer);
    game.items.push(itemWrench);
    game.items.push(itemSmallBag);
    game.items.push(itemSmallBagWrench);
    game.items.push(itemSmallBagScrewdriver);

    // Set item containers.
    itemGun.container = objectCouches;
    itemPepsi.container = puzzleChest;
    itemRope.container = puzzleChest;
    itemKnife.container = puzzleChest;
    itemSlingshot.container = objectCloset;
    itemToolBox.container = objectCloset;
    itemScrewdriver.container = itemToolBox; itemScrewdriver.slot = "TOOL BOX";
    itemHammer.container = itemToolBox; itemToolBox.slot = "TOOL BOX";
    itemWrench.container = itemToolBox; itemWrench.slot = "TOOL BOX";
    itemSmallBag.container = itemToolBox; itemSmallBag.slot = "TOOL BOX";
    itemSmallBagWrench.container = itemSmallBag; itemSmallBagWrench.slot = "SMALL BAG";
    itemSmallBagScrewdriver.container = itemSmallBag; itemSmallBagScrewdriver.slot = "SMALL BAG";

    // Set item weights and inventories.
    for (let i = 0; i < game.items.length; i++) {
        const prefab = game.items[i].prefab;
        game.items[i].weight = prefab.weight;
        for (let j = 0; j < prefab.inventory.length; j++)
            game.items[i].inventory.push({ name: prefab.inventory[j].name, capacity: prefab.inventory[j].capacity, takenSpace: prefab.inventory[j].takenSpace, weight: prefab.inventory[j].weight, item: [] });
    }

    // Insert inventory items.
    itemToolBox.insertItem(itemScrewdriver, itemScrewdriver.slot);
    itemToolBox.insertItem(itemHammer, itemHammer.slot);
    itemToolBox.insertItem(itemWrench, itemWrench.slot);
    itemToolBox.insertItem(itemSmallBag, itemSmallBag.slot);
    itemSmallBag.insertItem(itemSmallBagWrench, itemSmallBagWrench.slot);
    itemSmallBag.insertItem(itemSmallBagScrewdriver, itemSmallBagScrewdriver.slot);

    // Run some tests.
    assert.ok(itemSmallBag.weight === 1, itemSmallBag.weight);
    assert.ok(itemSmallBag.inventory[0].takenSpace === 0, itemSmallBag.inventory[0].takenSpace);
    assert.ok(itemToolBox.weight === 5, itemToolBox.weight);
    assert.ok(itemToolBox.inventory[0].takenSpace === 0, itemToolBox.inventory[0].takenSpace);

    // Initialize players.
    var vivian = new Player("621550382253998081", null, "Vivian", "Vivian", "Ultimate Programmer", "female", { strength: 3, intelligence: 10, dexterity: 2, speed: 4, stamina: 4 }, true, roomBeachHouse, "", [], `<desc><s>You examine <var v="this.displayName"/>.</s> <if cond="this.hasAttribute('concealed')"><s><var v="this.pronouns.Sbj"/> <if cond="this.pronouns.plural">are</if><if cond="!this.pronouns.plural">is</if> about average height, but <var v="this.pronouns.dpos"/> face is concealed.</s></if><if cond="!this.hasAttribute('concealed')"><s>She's about average height with a light skin tone, shoulder-length dark purple hair that poofs out slightly at the sides, and light purple eyes.</s> <s>She has a seemingly permanent scowl, making her look a little intimidating, but her size makes her appear relatively harmless.</s></if> <s><var v="this.pronouns.Sbj"/> wear<if cond="!this.pronouns.plural">s</if> <il name="equipment"><item>a pair of HEELYS</item>, <item>a SATCHEL</item>, <item>a SKIRT</item>, <item>a pair of GLASSES</item>, <item>a DRESS SHIRT</item>, <item>a SWEATER</item>, and <item>a pair of THIGH HIGHS</item></il>.</s> <s>You see <var v="this.pronouns.obj"/> carrying <il name="hands"></il>.</s></desc>`, [], 3);
    var nero = new Player("578764435766640640", null, "Nero", "Nero", "Ultimate Lucky Student", "male", { strength: 7, intelligence: 7, dexterity: 7, speed: 7, stamina: 7 }, true, roomBeachHouse, "", [], `<desc><s>You examine <var v="this.displayName"/>.</s> <if cond="this.hasAttribute('concealed')"><s><var v="this.pronouns.Sbj"/> <if cond="this.pronouns.plural">are</if><if cond="!this.pronouns.plural">is</if> rather tall, but <var v="this.pronouns.dpos"/> face is concealed.</s></if><if cond="!this.hasAttribute('concealed')"><s>He's rather tall with a light skin tone, shoulder-length dark purple hair, and light purple eyes.</s> <s>He's fairly attractive with a rather cool aura about him, giving you the feeling that he's easy to get along with.</s></if> <s><var v="this.pronouns.Sbj"/> wear<if cond="!this.pronouns.plural">s</if> <il name="equipment"><item>a pair of GLASSES</item>, <item>a DRESS SHIRT</item>, <item>a BLAZER</item>, <item>a pair of PANTS</item>, and <item>a pair of TENNIS SHOES</item></il>.</s> <s>You see <var v="this.pronouns.obj"/> carrying <il name="hands"></il>.</s></desc>`, [], 4);
    game.players.push(vivian); game.players_alive.push(vivian);
    game.players.push(nero); game.players_alive.push(nero);

    // Initialize inventory items.
    var inventoryNerosHat = new InventoryItem(nero, null, "", "HAT", "", null, null, "", 2);
    var inventoryNerosGlasses = new InventoryItem(nero, prefabNerosGlasses, "", "GLASSES", "", 1, NaN, "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>", 3);
    var inventoryNerosFace = new InventoryItem(nero, null, "", "FACE", "", null, null, "", 4);
    var inventoryNerosNeck = new InventoryItem(nero, null, "", "NECK", "", null, null, "", 5);
    var inventoryNerosBag = new InventoryItem(nero, null, "", "BAG", "", null, null, "", 6);
    var inventoryNerosShirt = new InventoryItem(nero, prefabNerosShirt, "", "SHIRT", "", 1, NaN, "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>", 7);
    var inventoryNerosBlazer = new InventoryItem(nero, prefabNerosBlazer, "NEROS BLAZER", "JACKET", "", 1, NaN, `<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name="BREAST POCKET"></il>.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 8);
    var inventoryNerosRightHand = new InventoryItem(nero, null, "", "RIGHT HAND", "", null, null, "", 9);
    var inventoryNerosLeftHand = new InventoryItem(nero, null, "", "LEFT HAND", "", null, null, "", 10);
    var inventoryNerosPants = new InventoryItem(nero, prefabNerosPants, "NEROS PANTS", "PANTS", "", 1, NaN, `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`, 11);
    var inventoryNerosUnderwear = new InventoryItem(nero, prefabNerosUnderwear, "", "UNDERWEAR", "", 1, NaN, "<desc><s>It's a pair of black, plaid boxers.</s></desc>", 12);
    var inventoryNerosSocks = new InventoryItem(nero, prefabNerosSocks, "", "SOCKS", "", 1, NaN, "<desc><s>It's a pair of plain, black ankle socks.</s></desc>", 13);
    var inventoryNerosShoes = new InventoryItem(nero, prefabNerosShoes, "", "SHOES", "", 1, NaN, "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>", 14);
    var inventoryViviansHat = new InventoryItem(vivian, null, "", "HAT", "", null, null, "", 15);
    var inventoryViviansGlasses = new InventoryItem(vivian, prefabViviansGlasses, "", "GLASSES", "", 1, NaN, "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>", 16);
    var inventoryViviansFace = new InventoryItem(vivian, null, "", "FACE", "", null, null, "", 17);
    var inventoryViviansNeck = new InventoryItem(vivian, null, "", "NECK", "", null, null, "", 18);
    var inventoryViviansBag = new InventoryItem(vivian, null, "", "BAG", "", null, null, "", 19);
    var inventoryViviansShirt = new InventoryItem(vivian, prefabViviansShirt, "", "SHIRT", "", 1, NaN, "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>", 20);
    var inventoryViviansSweater = new InventoryItem(vivian, prefabViviansSweater, "", "JACKET", "", 1, NaN, "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>", 21);
    var inventoryViviansToolBox = new InventoryItem(vivian, prefabToolBox, "TOOL BOX", "RIGHT HAND", "", 1, NaN, "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SMALL BAG</item>, <item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>", 22);
    var inventoryViviansLeftHand = new InventoryItem(vivian, null, "", "LEFT HAND", "", null, null, "", 23);
    var inventoryViviansSkirt = new InventoryItem(vivian, prefabViviansSkirt, "VIVIANS SKIRT", "PANTS", "", 1, NaN, `<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 24);
    var inventoryViviansUnderwear = new InventoryItem(vivian, prefabViviansUnderwear, "", "UNDERWEAR", "", 1, NaN, "<desc><s>It's a pair of plain, pink panties.</s></desc>", 25);
    var inventoryViviansSocks = new InventoryItem(vivian, prefabViviansSocks, "", "SOCKS", "", 1, NaN, "<desc><s>It's a pair of black thigh high socks.</s></desc>", 26);
    var inventoryViviansShoes = new InventoryItem(vivian, prefabViviansShoes, "", "SHOES", "", 1, NaN, "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>", 27);
    var inventoryViviansScrewDriverLeftHand = new InventoryItem(vivian, prefabScrewdriver, "", "LEFT HAND", "TOOL BOX/TOOL BOX", 0, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 28);
    var inventoryViviansHammerLeftHand = new InventoryItem(vivian, prefabHammer, "", "LEFT HAND", "TOOL BOX/TOOL BOX", 0, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 29);
    var inventoryViviansWrenchLeftHand = new InventoryItem(vivian, prefabWrench, "", "LEFT HAND", "TOOL BOX/TOOL BOX", 0, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 30);
    var inventoryViviansSmallBagLeftHand = new InventoryItem(vivian, prefabSmallBag, "SMALL BAG 2", "LEFT HAND", "TOOL BOX/TOOL BOX", 0, NaN, "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>", 31);
    var inventoryViviansScrewdriverRightHand = new InventoryItem(vivian, prefabScrewdriver, "", "RIGHT HAND", "TOOL BOX/TOOL BOX", 3, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 32);
    var inventoryViviansHammerRightHand = new InventoryItem(vivian, prefabHammer, "", "RIGHT HAND", "TOOL BOX/TOOL BOX", 3, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 33);
    var inventoryViviansWrenchRightHand = new InventoryItem(vivian, prefabWrench, "", "RIGHT HAND", "TOOL BOX/TOOL BOX", 2, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 34);
    var inventoryViviansSmallBagRightHand = new InventoryItem(vivian, prefabSmallBag, "SMALL BAG 2", "RIGHT HAND", "TOOL BOX/TOOL BOX", 1, NaN, "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>", 35);
    var inventoryViviansSmallBagRightHandWrench = new InventoryItem(vivian, prefabWrench, "", "RIGHT HAND", "SMALL BAG 2/SMALL BAG", 1, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 36);
    var inventoryViviansSmallBagRightHandScrewdriver = new InventoryItem(vivian, prefabScrewdriver, "", "RIGHT HAND", "SMALL BAG 2/SMALL BAG", 1, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 37);
    var inventoryViviansSmallBagLeftHandWrench = new InventoryItem(vivian, prefabWrench, "", "LEFT HAND", "SMALL BAG 2/SMALL BAG", 0, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 38);
    var inventoryViviansSmallBagLeftHandScrewdriver = new InventoryItem(vivian, prefabScrewdriver, "", "LEFT HAND", "SMALL BAG 2/SMALL BAG", 0, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 39);

    game.inventoryItems.push(inventoryNerosHat);
    game.inventoryItems.push(inventoryNerosGlasses);
    game.inventoryItems.push(inventoryNerosFace);
    game.inventoryItems.push(inventoryNerosNeck);
    game.inventoryItems.push(inventoryNerosBag);
    game.inventoryItems.push(inventoryNerosShirt);
    game.inventoryItems.push(inventoryNerosBlazer);
    game.inventoryItems.push(inventoryNerosRightHand);
    game.inventoryItems.push(inventoryNerosLeftHand);
    game.inventoryItems.push(inventoryNerosPants);
    game.inventoryItems.push(inventoryNerosUnderwear);
    game.inventoryItems.push(inventoryNerosSocks);
    game.inventoryItems.push(inventoryNerosShoes);
    game.inventoryItems.push(inventoryViviansHat);
    game.inventoryItems.push(inventoryViviansGlasses);
    game.inventoryItems.push(inventoryViviansFace);
    game.inventoryItems.push(inventoryViviansNeck);
    game.inventoryItems.push(inventoryViviansBag);
    game.inventoryItems.push(inventoryViviansShirt);
    game.inventoryItems.push(inventoryViviansSweater);
    game.inventoryItems.push(inventoryViviansToolBox);
    game.inventoryItems.push(inventoryViviansLeftHand);
    game.inventoryItems.push(inventoryViviansSkirt);
    game.inventoryItems.push(inventoryViviansUnderwear);
    game.inventoryItems.push(inventoryViviansSocks);
    game.inventoryItems.push(inventoryViviansShoes);
    game.inventoryItems.push(inventoryViviansScrewDriverLeftHand);
    game.inventoryItems.push(inventoryViviansHammerLeftHand);
    game.inventoryItems.push(inventoryViviansWrenchLeftHand);
    game.inventoryItems.push(inventoryViviansSmallBagLeftHand);
    game.inventoryItems.push(inventoryViviansScrewdriverRightHand);
    game.inventoryItems.push(inventoryViviansHammerRightHand);
    game.inventoryItems.push(inventoryViviansWrenchRightHand);
    game.inventoryItems.push(inventoryViviansSmallBagRightHand);
    game.inventoryItems.push(inventoryViviansSmallBagRightHandWrench);
    game.inventoryItems.push(inventoryViviansSmallBagRightHandScrewdriver);
    game.inventoryItems.push(inventoryViviansSmallBagLeftHandWrench);
    game.inventoryItems.push(inventoryViviansSmallBagLeftHandScrewdriver); 

    // Create EquipmentSlots for each player.
    for (let i = 0; i < game.players_alive.length; i++) {
        let inventory = [];
        let equipmentItems = game.inventoryItems.filter(item => item.player instanceof Player && item.player.name === game.players_alive[i].name && item.equipmentSlot !== "" && item.containerName === "");
        for (let j = 0; j < equipmentItems.length; j++)
            inventory.push(new EquipmentSlot(equipmentItems[j].equipmentSlot, equipmentItems[j].row));
        game.players_alive[i].inventory = inventory;
    }

    // Set item weights and inventories.
    for (let i = 0; i < game.inventoryItems.length; i++) {
        const prefab = game.inventoryItems[i].prefab;
        if (prefab) {
            game.inventoryItems[i].weight = prefab.weight;
            game.inventoryItems[i].foundEquipmentSlot = true;
            for (let j = 0; j < prefab.inventory.length; j++)
                game.inventoryItems[i].inventory.push({ name: prefab.inventory[j].name, capacity: prefab.inventory[j].capacity, takenSpace: prefab.inventory[j].takenSpace, weight: prefab.inventory[j].weight, item: [] });
        }
    }

    inventoryViviansScrewDriverLeftHand.container = null; inventoryViviansScrewDriverLeftHand.slot = "TOOL BOX";
    inventoryViviansHammerLeftHand.container = null; inventoryViviansHammerLeftHand.slot = "TOOL BOX";
    inventoryViviansWrenchLeftHand.container = null; inventoryViviansWrenchLeftHand.slot = "TOOL BOX";
    inventoryViviansSmallBagLeftHand.container = null; inventoryViviansSmallBagLeftHand.slot = "TOOL BOX";
    inventoryViviansScrewdriverRightHand.container = inventoryViviansToolBox; inventoryViviansScrewdriverRightHand.slot = "TOOL BOX";
    inventoryViviansHammerRightHand.container = inventoryViviansToolBox; inventoryViviansHammerRightHand.slot = "TOOL BOX";
    inventoryViviansWrenchRightHand.container = inventoryViviansToolBox; inventoryViviansWrenchRightHand.slot = "TOOL BOX";
    inventoryViviansSmallBagRightHand.container = inventoryViviansToolBox; inventoryViviansSmallBagRightHand.slot = "TOOL BOX";
    inventoryViviansSmallBagRightHandWrench.container = inventoryViviansSmallBagRightHand; inventoryViviansSmallBagRightHandWrench.slot = "SMALL BAG";
    inventoryViviansSmallBagRightHandScrewdriver.container = inventoryViviansSmallBagRightHand; inventoryViviansSmallBagRightHandScrewdriver.slot = "SMALL BAG";
    inventoryViviansSmallBagLeftHandWrench.container = null; inventoryViviansSmallBagLeftHandWrench.slot = "SMALL BAG";
    inventoryViviansSmallBagLeftHandScrewdriver.container = null; inventoryViviansSmallBagLeftHandScrewdriver.slot = "SMALL BAG";

    inventoryViviansSmallBagRightHand.insertItem(inventoryViviansSmallBagRightHandWrench, inventoryViviansSmallBagRightHandWrench.slot);
    inventoryViviansSmallBagRightHand.insertItem(inventoryViviansSmallBagRightHandScrewdriver, inventoryViviansSmallBagRightHandScrewdriver.slot);
    inventoryViviansToolBox.insertItem(inventoryViviansScrewdriverRightHand, inventoryViviansScrewdriverRightHand.slot);
    inventoryViviansToolBox.insertItem(inventoryViviansHammerRightHand, inventoryViviansHammerRightHand.slot);
    inventoryViviansToolBox.insertItem(inventoryViviansWrenchRightHand, inventoryViviansWrenchRightHand.slot);
    inventoryViviansToolBox.insertItem(inventoryViviansSmallBagRightHand, inventoryViviansSmallBagRightHand.slot);

    // Assign items to inventory slots.
    nero.inventory[0].items.push(inventoryNerosHat);
    nero.inventory[1].items.push(inventoryNerosGlasses);
    nero.inventory[1].equippedItem = inventoryNerosGlasses;
    nero.inventory[2].items.push(inventoryNerosFace);
    nero.inventory[3].items.push(inventoryNerosNeck);
    nero.inventory[4].items.push(inventoryNerosBag);
    nero.inventory[5].items.push(inventoryNerosShirt);
    nero.inventory[5].equippedItem = inventoryNerosShirt;
    nero.inventory[6].items.push(inventoryNerosBlazer);
    nero.inventory[6].equippedItem = inventoryNerosBlazer;
    nero.inventory[7].items.push(inventoryNerosRightHand);
    nero.inventory[8].items.push(inventoryNerosLeftHand);
    nero.inventory[9].items.push(inventoryNerosPants);
    nero.inventory[9].equippedItem = inventoryNerosPants;
    nero.inventory[10].items.push(inventoryNerosUnderwear);
    nero.inventory[10].equippedItem = inventoryNerosUnderwear;
    nero.inventory[11].items.push(inventoryNerosSocks);
    nero.inventory[11].equippedItem = inventoryNerosSocks;
    nero.inventory[12].items.push(inventoryNerosShoes);
    nero.inventory[12].equippedItem = inventoryNerosShoes;
    vivian.inventory[0].items.push(inventoryViviansHat);
    vivian.inventory[1].items.push(inventoryViviansGlasses);
    vivian.inventory[1].equippedItem = inventoryViviansGlasses;
    vivian.inventory[2].items.push(inventoryViviansFace);
    vivian.inventory[3].items.push(inventoryViviansNeck);
    vivian.inventory[4].items.push(inventoryViviansBag);
    vivian.inventory[4].equippedItem = inventoryViviansBag;
    vivian.inventory[5].items.push(inventoryViviansShirt);
    vivian.inventory[5].equippedItem = inventoryViviansShirt;
    vivian.inventory[6].items.push(inventoryViviansSweater);
    vivian.inventory[6].equippedItem = inventoryViviansSweater;
    vivian.inventory[7].items.push(inventoryViviansToolBox);
    vivian.inventory[7].items.push(inventoryViviansScrewdriverRightHand);
    vivian.inventory[7].items.push(inventoryViviansHammerRightHand);
    vivian.inventory[7].items.push(inventoryViviansWrenchRightHand);
    vivian.inventory[7].items.push(inventoryViviansSmallBagRightHand);
    vivian.inventory[7].equippedItem = inventoryViviansToolBox;
    vivian.inventory[8].items.push(inventoryViviansLeftHand);
    vivian.inventory[9].items.push(inventoryViviansSkirt);
    vivian.inventory[9].equippedItem = inventoryViviansSkirt;
    vivian.inventory[10].items.push(inventoryViviansUnderwear);
    vivian.inventory[10].equippedItem = inventoryViviansUnderwear;
    vivian.inventory[11].items.push(inventoryViviansSocks);
    vivian.inventory[11].equippedItem = inventoryViviansSocks;
    vivian.inventory[12].items.push(inventoryViviansShoes);
    vivian.inventory[12].equippedItem = inventoryViviansShoes;

    // Run some tests.
    assert.ok(inventoryViviansToolBox.weight === 22, inventoryViviansToolBox.weight);
    assert.ok(inventoryViviansToolBox.inventory[0].takenSpace === 10, inventoryViviansToolBox.inventory[0].takenSpace);
    assert.ok(inventoryViviansSmallBagRightHand.weight === 4, inventoryViviansSmallBagRightHand.weight);
    assert.ok(inventoryViviansSmallBagRightHand.inventory[0].takenSpace === 2, inventoryViviansSmallBagRightHand.inventory[0].takenSpace);

    return;
}

function test_stash_item_0() {
    var vivian = game.players[0];
    var itemGun = game.items[0];
    var hand = "LEFT HAND";
    vivian.take(game, itemGun, hand, itemGun.container, "");
    var leftHand = vivian.inventory[8];
    var inventorySkirt = game.inventoryItems[22];
    var slot = "LEFT POCKET";
    vivian.stash(game, leftHand.equippedItem, hand, inventorySkirt, slot);

    var itemSlingshot = game.items[4];
    vivian.take(game, itemSlingshot, hand, itemSlingshot.container, "");
    var inventoryLeftHand = game.inventoryItems[21];
    slot = "RIGHT POCKET";
    vivian.stash(game, leftHand.equippedItem, hand, inventorySkirt, slot);

    // Test that all of the data was converted properly.
    var pants = vivian.inventory[9];
    assert.ok(pants.equippedItem.name === "SKIRT", pants.equippedItem);
    assert.ok(pants.equippedItem.weight === 4, pants.equippedItem.weight);
    assert.ok(pants.equippedItem.inventory[0].takenSpace === 2, pants.equippedItem.inventory[0].takenSpace);
    assert.ok(pants.equippedItem.inventory[1].takenSpace === 2, pants.equippedItem.inventory[1].takenSpace);
    assert.ok(pants.items.length === 3, pants.items.length);
    assert.ok(
        pants.items[1].name === "GUN" &&
        pants.items[1].pluralName === "" &&
        pants.items[1].singleContainingPhrase === "a GUN" &&
        pants.items[1].pluralContainingPhrase === "" &&
        pants.items[1].equipmentSlot === "PANTS" &&
        pants.items[1].containerName === "VIVIANS SKIRT/LEFT POCKET" &&
        pants.items[1].container.name === "SKIRT" &&
        pants.items[1].slot === "LEFT POCKET" &&
        pants.items[1].quantity === 1 &&
        isNaN(pants.items[1].uses) &&
        pants.items[1].weight === 2 &&
        pants.items[1].inventory.length === 0 &&
        pants.items[1].row === 28,
        pants.items[1]
    );
    assert.ok(
        pants.items[2].name === "SLINGSHOT" &&
        pants.items[2].pluralName === "" &&
        pants.items[2].singleContainingPhrase === "a SLINGSHOT" &&
        pants.items[2].pluralContainingPhrase === "" &&
        pants.items[2].equipmentSlot === "PANTS" &&
        pants.items[2].containerName === "VIVIANS SKIRT/RIGHT POCKET" &&
        pants.items[2].container.name === "SKIRT" &&
        pants.items[2].slot === "RIGHT POCKET" &&
        pants.items[2].quantity === 1 &&
        isNaN(pants.items[2].uses) &&
        pants.items[2].weight === 1 &&
        pants.items[2].inventory.length === 0 &&
        pants.items[2].row === 29,
        pants.items[2]
    );

    // Test that all of the inventoryItem row numbers were updated properly.
    for (let i = 0; i < game.inventoryItems.length; i++)
        assert.ok(game.inventoryItems[i].row === i + 2, game.inventoryItems[i].row);

    // Test that all of the inventoryItems and Player inventory items have the same row numbers.
    for (let i = 0; i < vivian.inventory.length; i++) {
        for (let j = 0; j < vivian.inventory[i].items.length; j++) {
            const match = game.inventoryItems.find(item => item.player.name === vivian.name && (item.prefab === null && vivian.inventory[i].items[j].prefab === null || item.prefab !== null && vivian.inventory[i].items[j].prefab !== null && item.prefab.id === vivian.inventory[i].items[j].prefab.id) && item.equipmentSlot === vivian.inventory[i].items[j].equipmentSlot && item.containerName === vivian.inventory[i].items[j].containerName);
            assert.ok(match !== null && match !== undefined, vivian.inventory[i].items[j].row);
            assert.ok(vivian.inventory[i].items[j].row === match.row);
        }
    }

    return;
}

function test_unstash_item_0() {
    var vivian = game.players[0];
    var rightHand = vivian.inventory[7];
    var inventoryViviansSmallBag = rightHand.items[4];
    var hand = "LEFT HAND";
    var inventoryViviansToolBox = rightHand.items[0];
    var slot = "";

    vivian.unstash(game, inventoryViviansSmallBag, hand, inventoryViviansToolBox, "TOOL BOX");

    // Test that all of the data was converted properly.
    var leftHand = vivian.inventory[8];
    assert.ok(rightHand.items.length === 4, rightHand.items.length);
    assert.ok(
        leftHand.items[0].name === "SMALL BAG" &&
        leftHand.items[0].pluralName === "" &&
        leftHand.items[0].singleContainingPhrase === "a SMALL BAG" &&
        leftHand.items[0].pluralContainingPhrase === "" &&
        leftHand.items[0].equipmentSlot === "LEFT HAND" &&
        leftHand.items[0].containerName === "" &&
        leftHand.items[0].container === null &&
        leftHand.items[0].slot === "" &&
        leftHand.items[0].quantity === 1 &&
        isNaN(leftHand.items[0].uses) &&
        leftHand.items[0].weight === 4 &&
        leftHand.items[0].inventory.length > 0 &&
        leftHand.items[0].row === 23,
        leftHand.items[0]
    );
    assert.ok(
        leftHand.items[1].name === "WRENCH" &&
        leftHand.items[1].pluralName === "WRENCHES" &&
        leftHand.items[1].singleContainingPhrase === "a WRENCH" &&
        leftHand.items[1].pluralContainingPhrase === "WRENCHES" &&
        leftHand.items[1].equipmentSlot === "LEFT HAND" &&
        leftHand.items[1].containerName === "SMALL BAG 2/SMALL BAG" &&
        leftHand.items[1].container.name === "SMALL BAG" &&
        leftHand.items[1].slot === "SMALL BAG" &&
        leftHand.items[1].quantity === 1 &&
        isNaN(leftHand.items[1].uses) &&
        leftHand.items[1].weight === 2 &&
        leftHand.items[1].inventory.length === 0 &&
        leftHand.items[1].row === 40,
        leftHand.items[1]
    );
    assert.ok(
        leftHand.items[2].name === "SCREWDRIVER" &&
        leftHand.items[2].pluralName === "SCREWDRIVERS" &&
        leftHand.items[2].singleContainingPhrase === "a SCREWDRIVER" &&
        leftHand.items[2].pluralContainingPhrase === "SCREWDRIVERS" &&
        leftHand.items[2].equipmentSlot === "LEFT HAND" &&
        leftHand.items[2].containerName === "SMALL BAG 2/SMALL BAG" &&
        leftHand.items[2].container.name === "SMALL BAG" &&
        leftHand.items[2].slot === "SMALL BAG" &&
        leftHand.items[2].quantity === 1 &&
        isNaN(leftHand.items[2].uses) &&
        leftHand.items[2].weight === 1 &&
        leftHand.items[2].inventory.length === 0 &&
        leftHand.items[2].row === 41,
        leftHand.items[2]
    );

    // Test that all of the inventoryItem row numbers were updated properly.
    for (let i = 0; i < game.items.length; i++)
        assert.ok(game.items[i].row === i + 2, game.items[i].row);

    // Test that all of the inventoryItems and Player inventory items have the same row numbers.
    for (let i = 0; i < vivian.inventory.length; i++) {
        for (let j = 0; j < vivian.inventory[i].items.length; j++) {
            const match = game.inventoryItems.find(item => item.player.name === vivian.name && (item.prefab === null && vivian.inventory[i].items[j].prefab === null || item.prefab !== null && vivian.inventory[i].items[j].prefab !== null && item.prefab.id === vivian.inventory[i].items[j].prefab.id) && item.equipmentSlot === vivian.inventory[i].items[j].equipmentSlot && item.containerName === vivian.inventory[i].items[j].containerName);
            assert.ok(match !== null && match !== undefined, vivian.inventory[i].items[j].row);
            assert.ok(vivian.inventory[i].items[j].row === match.row);
        }
    }

    return;
}

function test_push_queue_0() {
    return new Promise((resolve) => {
        /*queuer.pushQueue("1oZxppuByy64QTb9pOJ-G1m2PEoVCO-egL0gycKVDjFU", function (response) {
            var errors = [];

            const objectData = [
                ["FLOOR", "beach-house", "TRUE", "", "", "FALSE", "", "", "FALSE", "on", "<desc><s>The floor beneath you is smooth and wooden.</s> <s>There's a rug underneath the COUCHES and TABLE.</s> <s>You find <il></il> haphazardly placed on the floor.</s></desc>"],
                ["COUCHES", "beach-house", "TRUE", "", "", "FALSE", "", "", "FALSE", "in", "<desc><s>You inspect the couches.</s> <s>They are soft and comfortable, and each is lined with a few pillows.</s> <s>Looking underneath the cushions, you find <il></il>.</s></desc>"],
                ["TABLE", "beach-house", "TRUE", "CHEST", "", "FALSE", "", "", "FALSE", "in", "<desc><s>You examine the table.</s> <if cond=\"game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === true\"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open, but it seems to be unlocked.</s> <var v=\" game.puzzles.find(puzzle => puzzle.name === 'CHEST').alreadySolvedDescription\" /></if><if cond=\"game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === false\"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open.</s></if></desc>"],
                ["CLOSET", "beach-house", "TRUE", "", "", "FALSE", "", "", "TRUE", "in", "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il></il>.</s></desc>"],
                ["CLOTHES", "beach-house", "TRUE", "", "", "FALSE", "", "", "FALSE", "", "<desc><s>Examining the clothes, you find a variety of different garments.</s> <s>Sundresses, T-shirts, shorts, skirts - this closet seems to have everything you could think of.</s></desc>"],
                ["HOT TUB", "beach-house", "TRUE", "", "", "FALSE", "", "", "FALSE", "in", "<desc><s>You inspect the hot tub.</s> <s>It looks to be fairly spacious, with room for probably up to 3 people to use at once.</s> <s>It has a digital thermometer to increase the temperature up to 100 degrees Fahrenheit, and buttons to turn it on.</s> <s>In the middle, you find <il></il>.</s></desc>"]
            ];
            sheets.getData("Objects!A1:K", function (response) {
                const sheet = response.data.values;
                for (let i = 1; i < sheet.length && i < objectData.length; i++) {
                    if (!arraysEqual(objectData[i - 1], sheet[i]))
                        errors.push(`Objects Row ${i + 1}: ` + sheet[i].join(','));

                    assert.ok(errors.length === 0, errors.join('\n'));
                }
            });

            const itemData = [
                ["GUN", "", "beach-house", "TRUE", "Object: COUCHES", "0", "", "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>"],
                ["PEPSI", "", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>"],
                ["ROPE", "", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>"],
                ["KNIFE", "", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>"],
                ["SLINGSHOT", "", "beach-house", "TRUE", "Object: CLOSET", "0", "", "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>"],
                ["TOOL BOX", "TOOL BOX", "beach-house", "TRUE", "Object: CLOSET", "0", "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SMALL BAG</item>, <item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>"],
                ["SCREWDRIVER", "", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["HAMMER", "", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["WRENCH", "", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["SMALL BAG", "SMALL BAG 2", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"],
                ["WRENCH", "", "beach-house", "TRUE", "Item: SMALL BAG 2/SMALL BAG", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["SCREWDRIVER", "", "beach-house", "TRUE", "Item: SMALL BAG 2/SMALL BAG", "0", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"]
            ];
            sheets.getData("Items!A1:H", function (response) {
                const sheet = response.data.values;
                for (let i = 1; i < sheet.length && i < itemData.length; i++) {
                    if (!arraysEqual(itemData[i - 1], sheet[i]))
                        errors.push(`Items Row ${i + 1}: ` + sheet[i].join(','));

                    assert.ok(errors.length === 0, errors.join('\n'));
                }
            });

            const inventoryData = [
                ["Nero", "NULL", "", "HAT"],
                ["Nero", "NEROS GLASSES", "", "GLASSES", "", "1", "", "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>"],
                ["Nero", "NULL", "", "FACE"],
                ["Nero", "NULL", "", "NECK"],
                ["Nero", "NULL", "", "BAG"],
                ["Nero", "NEROS SHIRT", "", "SHIRT", "", "1", "", "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>"],
                ["Nero", "NEROS BLAZER", "NEROS BLAZER", "JACKET", "", "1", "", "<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name=\"BREAST POCKET\"></il>.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
                ["Nero", "NULL", "", "RIGHT HAND"],
                ["Nero", "NULL", "", "LEFT HAND"],
                ["Nero", "NEROS PANTS", "NEROS PANTS", "PANTS", "", "1", "", "<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s> <s>In the left back pocket, you find <il name=\"LEFT BACK POCKET\"></il>.</s> <s>In the right back pocket, you find <il name=\"RIGHT BACK POCKET\"></il>.</s></desc>"],
                ["Nero", "NEROS UNDERWEAR", "", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of black, plaid boxers.</s></desc>"],
                ["Nero", "NEROS SOCKS", "", "SOCKS", "", "1", "", "<desc><s>It's a pair of plain, black ankle socks.</s></desc>"],
                ["Nero", "NEROS SHOES", "", "SHOES", "", "1", "", "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>"],
                ["Vivian", "NULL", "", "HAT"],
                ["Vivian", "VIVIANS GLASSES", "", "GLASSES", "", "1", "", "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>"],
                ["Vivian", "NULL", "", "FACE"],
                ["Vivian", "NULL", "", "NECK"],
                ["Vivian", "NULL", "", "BAG"],
                ["Vivian", "VIVIANS SHIRT", "", "SHIRT", "", "1", "", "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>"],
                ["Vivian", "VIVIANS SWEATER", "", "JACKET", "", "1", "", "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>"],
                ["Vivian", "TOOL BOX", "TOOL BOX", "RIGHT HAND", "", "1", "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>"],
                ["Vivian", "SMALL BAG", "SMALL BAG 2", "LEFT HAND", "", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"],
                ["Vivian", "VIVIANS SKIRT", "VIVIANS SKIRT", "PANTS", "", "1", "", "<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"><item>a GUN</item></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"><item>a SLINGSHOT</item></il>.</s></desc>"],
                ["Vivian", "VIVIANS UNDERWEAR", "", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of plain, pink panties.</s></desc>"],
                ["Vivian", "VIVIANS SOCKS", "", "SOCKS", "", "1", "", "<desc><s>It's a pair of black thigh high socks.</s></desc>"],
                ["Vivian", "VIVIANS SHOES", "", "SHOES", "", "1", "", "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>"],
                ["Vivian", "GUN", "", "PANTS", "VIVIANS SKIRT/LEFT POCKET", "1", "", "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>"],
                ["Vivian", "SLINGSHOT", "", "PANTS", "VIVIANS SKIRT/RIGHT POCKET", "1", "", "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>"],
                ["Vivian", "SCREWDRIVER", "", "LEFT HAND", "TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["Vivian", "HAMMER", "", "LEFT HAND", "TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["Vivian", "WRENCH", "", "LEFT HAND", "TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["Vivian", "SMALL BAG", "SMALL BAG 2", "LEFT HAND", "TOOL BOX/TOOL BOX", "0", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"],
                ["Vivian", "SCREWDRIVER", "", "RIGHT HAND", "TOOL BOX/TOOL BOX", "3", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["Vivian", "HAMMER", "", "RIGHT HAND", "TOOL BOX/TOOL BOX", "3", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["Vivian", "WRENCH", "", "RIGHT HAND", "TOOL BOX/TOOL BOX", "2", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["Vivian", "SMALL BAG", "SMALL BAG 2", "RIGHT HAND", "TOOL BOX/TOOL BOX", "0", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"],
                ["Vivian", "WRENCH", "", "RIGHT HAND", "SMALL BAG 2/SMALL BAG", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["Vivian", "SCREWDRIVER", "", "RIGHT HAND", "SMALL BAG 2/SMALL BAG", "0", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["Vivian", "WRENCH", "", "LEFT HAND", "SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["Vivian", "SCREWDRIVER", "", "LEFT HAND", "SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"]
            ];
            sheets.getData("Inventory Items!A1:H", function (response) {
                const sheet = response.data.values;
                for (let i = 1; i < sheet.length && i < inventoryData.length; i++) {
                    if (!arraysEqual(inventoryData[i - 1], sheet[i]))
                        errors.push(`Inventory Items Row ${i + 1}: ` + sheet[i].join(','));

                    assert.ok(errors.length === 0, errors.join('\n'));
                }
            });

            resolve();
        });*/
    });
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a.length !== b.length) return false;

    // Make copies before sorting both arrays so as not to modify the original arrays.
    let c = a.slice(), d = b.slice();
    c.sort();
    d.sort();

    // Now check if both have the same elements.
    for (let i = 0; i < c.length; i++) {
        if (c[i] !== d[i]) return false;
    }
    return true;
}
