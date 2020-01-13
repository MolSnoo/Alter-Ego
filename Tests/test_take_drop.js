var settings = include('settings.json');
var game = include('game.json');
const queuer = include(`${settings.modulesDir}/queuer.js`);
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
const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

exports.run = async function () {
    init_0();
    //test_take_item_0();
    //test_take_item_1();
    //test_drop_item_0();
    //await test_push_queue_0();
    init_1();
    test_take_drop_item_0();
    await test_push_queue_1();
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
    game.queue.length = 0;

    // Initialize room.
    var roomBeachHouse = new Room("beach-house", null, [], "", 2);
    game.rooms.push(roomBeachHouse);

    // Initialize objects;
    var objectFloor = new Object("FLOOR", roomBeachHouse, true, "", false, "on", "<desc><s>The floor beneath you is smooth and wooden.</s> <s>There's a rug underneath the COUCHES and TABLE.</s> <s>You find <il><item>a SKIRT</item></il> haphazardly placed on the floor.</s></desc>", 2);
    var objectCouches = new Object("COUCHES", roomBeachHouse, true, "", false, "in", "<desc><s>You inspect the couches.</s> <s>They are soft and comfortable, and each is lined with a few pillows.</s> <s>Looking underneath the cushions, you find <il><item>a GUN</item></il>.</s></desc>", 3);
    var objectTable = new Object("TABLE", roomBeachHouse, true, "CHEST", false, "in", `<desc><s>You examine the table.</s> <if cond="game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === true"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open, but it seems to be unlocked.</s> <var v=" game.puzzles.find(puzzle => puzzle.name === 'CHEST').alreadySolvedDescription" /></if><if cond="game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === false"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open.</s></if></desc>`, 4);
    var objectCloset = new Object("CLOSET", roomBeachHouse, true, "", true, "in", "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il><item>a SLINGSHOT</item>, <item>a TOOL BOX</item>, and <item>a SATCHEL</item></il>.</s></desc>", 5);
    var objectClothes = new Object("CLOTHES", roomBeachHouse, true, "", false, "", "<desc><s>Examining the clothes, you find a variety of different garments.</s> <s>Sundresses, T-shirts, shorts, skirts - this closet seems to have everything you could think of.</s></desc>", 6);
    var objectHotTub = new Object("HOT TUB", roomBeachHouse, true, "", false, "", "<desc><s>You inspect the hot tub.</s> <s>It looks to be fairly spacious, with room for probably up to 3 people to use at once.</s> <s>It has a digital thermometer to increase the temperature up to 100 degrees Fahrenheit, and buttons to turn it on.</s> <s>In the middle, you find <il></il>.</s></desc>", 7);
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
    var prefabGun = new Prefab("GUN", "GUN", "", "a GUN", "", true, 2, 2, false, "", NaN, [], [], [], false, [], [], [], [], "", "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>", 2);
    var prefabPepsi = new Prefab("PEPSI", "PEPSI", "", "a bottle of PEPSI", "", true, 2, 3, true, "drinks", 1, ["refreshed"], [], ["GLASS BOTTLE"], false, [], [], [], [], "", "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>", 3);
    var prefabGlassBottle = new Prefab("GLASS BOTTLE", "GLASS BOTTLE", "", "a GLASS BOTTLE", "", true, 2, 2, false, "", NaN, [], [], [], false, [], [], [], [], "", "<desc><s>You examine the bottle.</s> <s>It appears to be an old Pepsi bottle, but there's nothing inside it anymore.</s></desc>", 4);
    var prefabRope = new Prefab("ROPE", "ROPE", "", "a ROPE", "", true, 6, 2, false, "", NaN, [], [], [], false, [], [], [], [], "", "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>", 5);
    var prefabKnife = new Prefab("KNIFE", "KNIFE", "", "a KNIFE", "", true, 2, 2, false, "", NaN, [], [], [], false, [], [], [], [], "", "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>", 6);
    var prefabSlingshot = new Prefab("SLINGSHOT", "SLINGSHOT", "", "a SLINGSHOT", "", true, 2, 1, false, "", NaN, [], [], [], false, [], [], [], [], "", "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>", 7);
    var prefabToolBox = new Prefab("TOOL BOX", "TOOL BOX", "", "a TOOL BOX", "", false, 4, 5, false, "", NaN, [], [], [], false, [], [], [], [{ name: "TOOL BOX", capacity: 20, takenSpace: 0, weight: 0, item: [] }], "in", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il></il>.</s></desc>", 8);
    var prefabScrewdriver = new Prefab("SCREWDRIVER", "SCREWDRIVER", "SCREWDRIVERS", "a SCREWDRIVER", "SCREWDRIVERS", true, 1, 1, false, "", NaN, [], [], [], false, [], [], [], [], "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 9);
    var prefabHammer = new Prefab("HAMMER", "HAMMER", "HAMMERS", "a HAMMER", "HAMMERS", true, 1, 2, false, "", NaN, [], [], [], false, [], [], [], [], "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 10);
    var prefabWrench = new Prefab("WRENCH", "WRENCH", "WRENCHES", "a WRENCH", "WRENCHES", true, 1, 2, false, "", NaN, [], [], [], false, [], [], [], [], "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 11);
    var prefabViviansGlasses = new Prefab("VIVIANS GLASSES", "GLASSES", "", "a pair of GLASSES", "pairs of GLASSES", true, 1, 1, false, "", NaN, [], [], [], true, ["GLASSES"], [], [], [], "", "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>", 12);
    var prefabViviansShirt = new Prefab("VIVIANS SHIRT", "DRESS SHIRT", "DRESS SHIRTS", "a DRESS SHIRT", "DRESS SHIRTS", true, 5, 1, false, "", NaN, [], [], [], true, ["SHIRT"], [], [], [], "", "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>", 13);
    var prefabViviansSweater = new Prefab("VIVIANS SWEATER", "SWEATER", "SWEATERS", "a SWEATER", "SWEATERS", true, 5, 2, false, "", NaN, [], [], [], true, ["JACKET"], [], [], [], "", "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>", 14);
    var prefabViviansSatchel = new Prefab("VIVIANS SATCHEL", "SATCHEL", "SATCHELS", "a SATCHEL", "SATCHELS", true, 6, 1, false, "", NaN, [], [], [], true, ["BAG"], [], [], [{ name: "SATCHEL", capacity: 6, takenSpace: 0, weight: 0, item: [] }], "in", "<desc><s>It's a beige satchel with a long strap to go over the shoulder.</s> <s>Inside, you find <il></il>.</s></desc>", 15);
    var prefabViviansSkirt = new Prefab("VIVIANS SKIRT", "SKIRT", "SKIRTS", "a SKIRT", "SKIRTS", true, 4, 1, false, "", NaN, [], [], [], true, ["PANTS"], [], [], [{ name: "LEFT POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }, { name: "RIGHT POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }], "in", `<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 16);
    var prefabViviansUnderwear = new Prefab("VIVIANS UNDERWEAR", "PANTIES", "", "a pair of PANTIES", "pairs of PANTIES", true, 1, 0, false, "", NaN, [], [], [], true, ["UNDERWEAR"], [], [], [], "", "<desc><s>It's a pair of plain, pink panties.</s></desc>", 17);
    var prefabViviansSocks = new Prefab("VIVIANS SOCKS", "THIGH HIGHS", "", "a pair of THIGH HIGHS", "pairs of THIGH HIGHS", true, 5, 1, false, "", NaN, [], [], [], true, ["SOCKS"], [], [], [], "", "<desc><s>It's a pair of black thigh high socks.</s></desc>", 18);
    var prefabViviansShoes = new Prefab("VIVIANS SHOES", "TENNIS SHOES", "", "a pair of TENNIS SHOES", "pairs of TENNIS SHOES", true, 2, 1, false, "", NaN, [], [], [], true, ["SHOES"], [], [], [], "", "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>", 19);
    var prefabViviansLaptop = new Prefab("VIVIANS LAPTOP", "LAPTOP", "LAPTOPS", "a LAPTOP", "LAPTOPS", false, 4, 2, false, "", NaN, [], [], [], false, [], [], [], [], "", `<desc><if cond="player.name === 'Vivian'"><s>This is your laptop.</s> <s>You take it with you everywhere you go.</s></if><if cond="player.name !== 'Vivian'"><s>This is a very expensive-looking laptop.</s> <s>The keyboard lights up when a key is pressed.</s> <s>The login screen is asking for a password for Vivian's account.</s></if></desc>`, 20);
    var prefabNerosGlasses = new Prefab("NEROS GLASSES", "GLASSES", "", "a pair of GLASSES", "pairs of GLASSES", true, 1, 1, false, "", NaN, [], [], [], true, ["GLASSES"], [], [], [], "", "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>", 21);
    var prefabNerosShirt = new Prefab("NEROS SHIRT", "DRESS SHIRT", "DRESS SHIRTS", "a DRESS SHIRT", "DRESS SHIRTS", true, 5, 1, false, "", NaN, [], [], [], true, ["SHIRT"], [], [], [], "", "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>", 22);
    var prefabNerosBlazer = new Prefab("NEROS BLAZER", "BLAZER", "BLAZERS", "a BLAZER", "BLAZERS", true, 5, 1, false, "", NaN, [], [], [], true, ["JACKET"], [], [], [{ name: "BREAST POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }, { name: "LEFT POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }, { name: "RIGHT POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }], "in", `<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name="BREAST POCKET"></il>.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 23);
    var prefabNerosPants = new Prefab("NEROS PANTS", "PANTS", "", "a pair of PANTS", "pairs of PANTS", true, 5, 1, false, "", NaN, [], [], [], true, ["PANTS"], [], [], [{ name: "LEFT POCKET", capacity: 3, takenSpace: 0, weight: 0, item: [] }, { name: "RIGHT POCKET", capacity: 3, takenSpace: 0, weight: 0, item: [] }, { name: "LEFT BACK POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }, { name: "RIGHT BACK POCKET", capacity: 2, takenSpace: 0, weight: 0, item: [] }], "in", `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`, 24);
    var prefabNerosUnderwear = new Prefab("NEROS UNDERWEAR", "BOXERS", "", "a pair of BOXERS", "pairs of BOXERS", true, 2, 0, false, "", NaN, [], [], [], true, ["UNDERWEAR"], [], [], [], "", "<desc><s>It's a pair of black, plaid boxers.</s></desc>", 25);
    var prefabNerosSocks = new Prefab("NEROS SOCKS", "SOCKS", "", "a pair of SOCKS", "pairs of SOCKS", true, 1, 0, false, "", NaN, [], [], [], true, ["SOCKS"], [], [], [], "", "<desc><s>It's a pair of plain, black ankle socks.</s></desc>", 26);
    var prefabNerosShoes = new Prefab("NEROS SHOES", "TENNIS SHOES", "", "a pair of TENNIS SHOES", "pairs of TENNIS SHOES", true, 3, 1, false, "", NaN, [], [], [], true, ["SHOES"], [], [], [], "", "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>", 27);
    var prefabSmallBag = new Prefab("SMALL BAG", "SMALL BAG", "", "a SMALL BAG", "", true, 2, 1, false, "", NaN, [], [], [], false, [], [], [], [{ name: "SMALL BAG", capacity: 2, takenSpace: 0, weight: 0, item: [] }], "in", "<desc><s>It's a small bag.</s> <s>Inside, you find <il></il>.</s></desc>", 28);
    var prefabSmallBag2 = new Prefab("SMALL BAG 2", "SMALL BAG", "", "a SMALL BAG", "", true, 2, 1, false, "", NaN, [], [], [], false, [], [], [], [{ name: "SMALL BAG", capacity: 2, takenSpace: 0, weight: 0, item: [] }], "in", "<desc><s>It's a small bag.</s> <s>Inside, you find <il></il>.</s></desc>", 29);

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
    game.prefabs.push(prefabSmallBag2);

    // Initialize items.
    var itemRoomHammer = new Item(prefabHammer, roomBeachHouse, true, "", 1, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 2);
    var itemGun = new Item(prefabGun, roomBeachHouse, true, "Object: COUCHES", 1, NaN, "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>", 3);
    var itemPepsi = new Item(prefabPepsi, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>", 4);
    var itemRope = new Item(prefabRope, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>", 5);
    var itemKnife = new Item(prefabKnife, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>", 6);
    var itemChestHammer = new Item(prefabHammer, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 7);
    var itemSlingshot = new Item(prefabSlingshot, roomBeachHouse, true, "Object: CLOSET", 1, NaN, "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>", 8);
    var itemToolBox = new Item(prefabToolBox, roomBeachHouse, true, "Object: CLOSET", 1, NaN, "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SKIRT</item>, <item>4 SCREWDRIVERS</item>, <item>2 HAMMERS</item>, and <item>4 WRENCHES</item></il>.</s></desc>", 9);
    var itemSatchel = new Item(prefabViviansSatchel, roomBeachHouse, true, "Object: CLOSET", 1, NaN, "<desc><s>It's a beige satchel with a long strap to go over the shoulder.</s> <s>Inside, you find <il><item>a LAPTOP</item> and <item>a SMALL BAG</item></il>.</s></desc>", 10);
    var itemScrewdriver = new Item(prefabScrewdriver, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 4, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 11);
    var itemToolBoxHammer = new Item(prefabHammer, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 2, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 12);
    var itemWrench = new Item(prefabWrench, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 4, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 13);
    var itemViviansSkirt = new Item(prefabViviansSkirt, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 1, NaN, `<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name="LEFT POCKET"><item>a HAMMER</item></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"><item>a HAMMER</item></il>.</s></desc>`, 14);
    var itemSkirtLeftHammer = new Item(prefabHammer, roomBeachHouse, true, "Item: VIVIANS SKIRT/LEFT POCKET", 1, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 15);
    var itemSkirtRightHammer = new Item(prefabHammer, roomBeachHouse, true, "Item: VIVIANS SKIRT/RIGHT POCKET", 1, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 16);
    var itemLaptop = new Item(prefabViviansLaptop, roomBeachHouse, true, "Item: VIVIANS SATCHEL/SATCHEL", 1, NaN, `<desc><if cond="player.name === 'Vivian'"><s>This is your laptop.</s> <s>You take it with you everywhere you go.</s></if><if cond="player.name !== 'Vivian'"><s>This is a very expensive-looking laptop.</s> <s>The keyboard lights up when a key is pressed.</s> <s>The login screen is asking for a password for Vivian's account.</s></if></desc>`, 17);
    var itemSmallBag = new Item(prefabSmallBag, roomBeachHouse, true, "Item: VIVIANS SATCHEL/SATCHEL", 1, NaN, "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>", 18);
    var itemSmallBagWrench = new Item(prefabWrench, roomBeachHouse, true, "Item: SMALL BAG/SMALL BAG", 1, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 19);

    game.items.push(itemRoomHammer);
    game.items.push(itemGun);
    game.items.push(itemPepsi);
    game.items.push(itemRope);
    game.items.push(itemKnife);
    game.items.push(itemChestHammer);
    game.items.push(itemSlingshot);
    game.items.push(itemToolBox);
    game.items.push(itemSatchel);
    game.items.push(itemScrewdriver);
    game.items.push(itemToolBoxHammer);
    game.items.push(itemWrench);
    game.items.push(itemViviansSkirt);
    game.items.push(itemSkirtLeftHammer);
    game.items.push(itemSkirtRightHammer);
    game.items.push(itemLaptop);
    game.items.push(itemSmallBag);
    game.items.push(itemSmallBagWrench);

    // Set item containers.
    itemGun.container = objectCouches;
    itemPepsi.container = puzzleChest;
    itemRope.container = puzzleChest;
    itemKnife.container = puzzleChest;
    itemChestHammer.container = puzzleChest;
    itemSlingshot.container = objectCloset;
    itemToolBox.container = objectCloset;
    itemSatchel.container = objectCloset;
    itemScrewdriver.container = itemToolBox; itemScrewdriver.slot = "TOOL BOX";
    itemToolBoxHammer.container = itemToolBox; itemToolBoxHammer.slot = "TOOL BOX";
    itemWrench.container = itemToolBox; itemWrench.slot = "TOOL BOX";
    itemViviansSkirt.container = itemToolBox; itemViviansSkirt.slot = "TOOL BOX";
    itemSkirtLeftHammer.container = itemViviansSkirt; itemSkirtLeftHammer.slot = "LEFT POCKET";
    itemSkirtRightHammer.container = itemViviansSkirt; itemSkirtRightHammer.slot = "RIGHT POCKET";
    itemLaptop.container = itemSatchel; itemLaptop.slot = "SATCHEL";
    itemSmallBag.container = itemSatchel; itemSmallBag.slot = "SATCHEL";
    itemSmallBagWrench.container = itemSmallBag; itemSmallBagWrench.slot = "SMALL BAG";

    // Set item weights and inventories.
    for (let i = 0; i < game.items.length; i++) {
        const prefab = game.items[i].prefab;
        game.items[i].weight = prefab.weight;
        for (let j = 0; j < prefab.inventory.length; j++)
            game.items[i].inventory.push({ name: prefab.inventory[j].name, capacity: prefab.inventory[j].capacity, takenSpace: prefab.inventory[j].takenSpace, weight: prefab.inventory[j].weight, item: [] });
    }

    // Insert inventory items.
    itemViviansSkirt.insertItem(itemSkirtLeftHammer, itemSkirtLeftHammer.slot);
    itemViviansSkirt.insertItem(itemSkirtRightHammer, itemSkirtRightHammer.slot);
    itemToolBox.insertItem(itemScrewdriver, itemScrewdriver.slot);
    itemToolBox.insertItem(itemToolBoxHammer, itemToolBoxHammer.slot);
    itemToolBox.insertItem(itemWrench, itemWrench.slot);
    itemToolBox.insertItem(itemViviansSkirt, itemViviansSkirt.slot);
    itemSatchel.insertItem(itemLaptop, itemLaptop.slot);
    itemSmallBag.insertItem(itemSmallBagWrench, itemSmallBagWrench.slot);
    itemSatchel.insertItem(itemSmallBag, itemSmallBag.slot);

    // Run some tests.
    assert.ok(itemSmallBag.weight === 3, itemSmallBag.weight);
    assert.ok(itemSmallBag.inventory[0].takenSpace === 1, itemSmallBag.inventory[0].takenSpace);
    assert.ok(itemSatchel.weight === 6, itemSatchel.weight);
    assert.ok(itemSatchel.inventory[0].takenSpace === 6, itemSatchel.inventory[0].takenSpace);

    // Initialize players.
    var vivian = new Player("621550382253998081", null, "Vivian", "Vivian", "Ultimate Programmer", { strength: 3, intelligence: 10, dexterity: 2, speed: 4, stamina: 4 }, true, roomBeachHouse, "", [], [], 3);
    var nero = new Player("578764435766640640", null, "Nero", "Nero", "Ultimate Lucky Student", { strength: 7, intelligence: 7, dexterity: 7, speed: 7, stamina: 7 }, true, roomBeachHouse, "", [], [], 4);
    game.players.push(vivian); game.players_alive.push(vivian);
    game.players.push(nero); game.players_alive.push(nero);

    // Initialize inventory items.
    var inventoryNerosHat = new InventoryItem(nero, null, "HAT", "", null, null, "", 2);
    var inventoryNerosGlasses = new InventoryItem(nero, prefabNerosGlasses, "GLASSES", "", 1, NaN, "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>", 3);
    var inventoryNerosFace = new InventoryItem(nero, null, "FACE", "", null, null, "", 4);
    var inventoryNerosNeck = new InventoryItem(nero, null, "NECK", "", null, null, "", 5);
    var inventoryNerosBag = new InventoryItem(nero, null, "BAG", "", null, null, "", 6);
    var inventoryNerosShirt = new InventoryItem(nero, prefabNerosShirt, "SHIRT", "", 1, NaN, "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>", 7);
    var inventoryNerosBlazer = new InventoryItem(nero, prefabNerosBlazer, "JACKET", "", 1, NaN, `<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name="BREAST POCKET"></il>.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 8);
    var inventoryNerosRightHand = new InventoryItem(nero, null, "RIGHT HAND", "", null, null, "", 9);
    var inventoryNerosLeftHand = new InventoryItem(nero, null, "LEFT HAND", "", null, null, "", 10);
    var inventoryNerosPants = new InventoryItem(nero, prefabNerosPants, "PANTS", "", 1, NaN, `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`, 11);
    var inventoryNerosUnderwear = new InventoryItem(nero, prefabNerosUnderwear, "UNDERWEAR", "", 1, NaN, "<desc><s>It's a pair of black, plaid boxers.</s></desc>", 12);
    var inventoryNerosSocks = new InventoryItem(nero, prefabNerosSocks, "SOCKS", "", 1, NaN, "<desc><s>It's a pair of plain, black ankle socks.</s></desc>", 13);
    var inventoryNerosShoes = new InventoryItem(nero, prefabNerosShoes, "SHOES", "", 1, NaN, "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>", 14);
    var inventoryViviansHat = new InventoryItem(vivian, null, "HAT", "", null, null, "", 15);
    var inventoryViviansGlasses = new InventoryItem(vivian, prefabViviansGlasses, "GLASSES", "", 1, NaN, "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>", 16);
    var inventoryViviansFace = new InventoryItem(vivian, null, "FACE", "", null, null, "", 17);
    var inventoryViviansNeck = new InventoryItem(vivian, null, "NECK", "", null, null, "", 18);
    var inventoryViviansBag = new InventoryItem(vivian, null, "BAG", "", null, null, "", 19);
    var inventoryViviansShirt = new InventoryItem(vivian, prefabViviansShirt, "SHIRT", "", 1, NaN, "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>", 20);
    var inventoryViviansSweater = new InventoryItem(vivian, prefabViviansSweater, "JACKET", "", 1, NaN, "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>", 21);
    var inventoryViviansRightHand = new InventoryItem(vivian, null, "RIGHT HAND", "", null, null, "", 22);
    var inventoryViviansSmallBag = new InventoryItem(vivian, prefabSmallBag2, "LEFT HAND", "", 1, NaN, "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>", 23);
    var inventoryViviansSkirt = new InventoryItem(vivian, prefabViviansSkirt, "PANTS", "", 1, NaN, `<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 24);
    var inventoryViviansUnderwear = new InventoryItem(vivian, prefabViviansUnderwear, "UNDERWEAR", "", 1, NaN, "<desc><s>It's a pair of plain, pink panties.</s></desc>", 25);
    var inventoryViviansSocks = new InventoryItem(vivian, prefabViviansSocks, "SOCKS", "", 1, NaN, "<desc><s>It's a pair of black thigh high socks.</s></desc>", 26);
    var inventoryViviansShoes = new InventoryItem(vivian, prefabViviansShoes, "SHOES", "", 1, NaN, "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>", 27);
    var inventoryViviansWrench = new InventoryItem(vivian, prefabWrench, "LEFT HAND", "SMALL BAG 2", 1, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 28);

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
    game.inventoryItems.push(inventoryViviansRightHand);
    game.inventoryItems.push(inventoryViviansSmallBag);
    game.inventoryItems.push(inventoryViviansSkirt);
    game.inventoryItems.push(inventoryViviansUnderwear);
    game.inventoryItems.push(inventoryViviansSocks);
    game.inventoryItems.push(inventoryViviansShoes);
    game.inventoryItems.push(inventoryViviansWrench);

    // Create EquipmentSlots for each player.
    for (let i = 0; i < game.players_alive.length; i++) {
        let inventory = [];
        let equipmentItems = game.inventoryItems.filter(item => item.player instanceof Player && item.player.id === game.players_alive[i].id && item.equipmentSlot !== "" && item.containerName === "");
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

    inventoryViviansWrench.container = inventoryViviansSmallBag; inventoryViviansWrench.slot = "SMALL BAG";
    inventoryViviansSmallBag.insertItem(inventoryViviansWrench, inventoryViviansWrench.slot);

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
    vivian.inventory[7].items.push(inventoryViviansRightHand);
    vivian.inventory[8].items.push(inventoryViviansSmallBag);
    vivian.inventory[8].equippedItem = inventoryViviansSmallBag;
    vivian.inventory[9].items.push(inventoryViviansSkirt);
    vivian.inventory[9].equippedItem = inventoryViviansSkirt;
    vivian.inventory[10].items.push(inventoryViviansUnderwear);
    vivian.inventory[10].equippedItem = inventoryViviansUnderwear;
    vivian.inventory[11].items.push(inventoryViviansSocks);
    vivian.inventory[11].equippedItem = inventoryViviansSocks;
    vivian.inventory[12].items.push(inventoryViviansShoes);
    vivian.inventory[12].equippedItem = inventoryViviansShoes;
    
    // Run some tests.
    assert.ok(itemViviansSkirt.weight === 5, itemViviansSkirt.weight);
    assert.ok(itemViviansSkirt.inventory[0].takenSpace === 1, itemViviansSkirt.inventory[0].takenSpace);
    assert.ok(itemViviansSkirt.inventory[1].takenSpace === 1, itemViviansSkirt.inventory[1].takenSpace);
    assert.ok(itemToolBox.weight === 26, itemToolBox.weight);
    assert.ok(itemToolBox.inventory[0].takenSpace === 14, itemToolBox.inventory[0].takenSpace);
    assert.ok(inventoryViviansSmallBag.weight === 3, inventoryViviansSmallBag.weight);
    assert.ok(inventoryViviansSmallBag.inventory[0].takenSpace === 1, inventoryViviansSmallBag.inventory[0].takenSpace);

    // Add some entries to the queue.
    const timestamp = Date.now();
    game.queue.push(new QueueEntry(timestamp, "updateRow", "Inventory Items!A26:G26", "Inventory Items!VIVIANS SOCKS|Vivian|SOCKS|", ["Vivian", "VIVIANS SOCKS", "SOCKS", "", 1, "", "<desc><s>It's a pair of gray thigh high socks.</s></desc>"]));
    game.queue.push(new QueueEntry(timestamp, "updateCell", "Inventory Items!E27", "Inventory Items!VIVIANS SHOES|Vivian|SHOES|", 2)); // Set quantity of Vivian's shoes to 2.
    game.queue.push(new QueueEntry(timestamp, "updateRow", "Inventory Items!A15:G15", "Inventory Items!NULL|Vivian|HAT|", ["Vivian", "NULL", "HAT", "", "", "", ""]));

    return;
}

function test_take_item_0() {
    var nero = game.players[1];
    var itemToolBox = game.items[7];
    var hand = "RIGHT HAND";
    var container = itemToolBox.container;
    var slot = "";

    nero.take(game, itemToolBox, hand, container, slot);

    // Test that all of the data was converted properly.
    var rightHand = nero.inventory[7];
    assert.ok(rightHand.equippedItem.name === "TOOL BOX", rightHand.equippedItem);
    assert.ok(rightHand.equippedItem.weight === 26, rightHand.equippedItem.weight);
    assert.ok(rightHand.equippedItem.inventory[0].takenSpace === 14, rightHand.equippedItem.inventory[0].takenSpace);
    assert.ok(rightHand.items.length === 7, rightHand.items.length);
    assert.ok(
        rightHand.items[0].name === "TOOL BOX" &&
        rightHand.items[0].pluralName === "" &&
        rightHand.items[0].singleContainingPhrase === "a TOOL BOX" &&
        rightHand.items[0].pluralContainingPhrase === "" &&
        rightHand.items[0].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[0].containerName === "" &&
        rightHand.items[0].container === null &&
        rightHand.items[0].slot === "" &&
        rightHand.items[0].quantity === 1 &&
        isNaN(rightHand.items[0].uses) &&
        rightHand.items[0].weight === 26 &&
        rightHand.items[0].inventory.length > 0 &&
        rightHand.items[0].row === 9,
        rightHand.items[0]
    );
    assert.ok(
        rightHand.items[1].name === "SCREWDRIVER" &&
        rightHand.items[1].pluralName === "SCREWDRIVERS" &&
        rightHand.items[1].singleContainingPhrase === "a SCREWDRIVER" &&
        rightHand.items[1].pluralContainingPhrase === "SCREWDRIVERS" &&
        rightHand.items[1].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[1].containerName === "TOOL BOX/TOOL BOX" &&
        rightHand.items[1].container.name === "TOOL BOX" &&
        rightHand.items[1].slot === "TOOL BOX" &&
        rightHand.items[1].quantity === 4 &&
        isNaN(rightHand.items[1].uses) &&
        rightHand.items[1].weight === 1 &&
        rightHand.items[1].inventory.length === 0 &&
        rightHand.items[1].row === 15,
        rightHand.items[1]
    );
    assert.ok(
        rightHand.items[2].name === "HAMMER" &&
        rightHand.items[2].pluralName === "HAMMERS" &&
        rightHand.items[2].singleContainingPhrase === "a HAMMER" &&
        rightHand.items[2].pluralContainingPhrase === "HAMMERS" &&
        rightHand.items[2].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[2].containerName === "TOOL BOX/TOOL BOX" &&
        rightHand.items[2].container.name === "TOOL BOX" &&
        rightHand.items[2].slot === "TOOL BOX" &&
        rightHand.items[2].quantity === 2 &&
        isNaN(rightHand.items[2].uses) &&
        rightHand.items[2].weight === 2 &&
        rightHand.items[2].inventory.length === 0 &&
        rightHand.items[2].row === 16,
        rightHand.items[2]
    );
    assert.ok(
        rightHand.items[3].name === "WRENCH" &&
        rightHand.items[3].pluralName === "WRENCHES" &&
        rightHand.items[3].singleContainingPhrase === "a WRENCH" &&
        rightHand.items[3].pluralContainingPhrase === "WRENCHES" &&
        rightHand.items[3].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[3].containerName === "TOOL BOX/TOOL BOX" &&
        rightHand.items[3].container.name === "TOOL BOX" &&
        rightHand.items[3].slot === "TOOL BOX" &&
        rightHand.items[3].quantity === 4 &&
        isNaN(rightHand.items[3].uses) &&
        rightHand.items[3].weight === 2 &&
        rightHand.items[3].inventory.length === 0 &&
        rightHand.items[3].row === 17,
        rightHand.items[3]
    );
    assert.ok(
        rightHand.items[4].name === "SKIRT" &&
        rightHand.items[4].pluralName === "SKIRTS" &&
        rightHand.items[4].singleContainingPhrase === "a SKIRT" &&
        rightHand.items[4].pluralContainingPhrase === "SKIRTS" &&
        rightHand.items[4].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[4].containerName === "TOOL BOX/TOOL BOX" &&
        rightHand.items[4].container.name === "TOOL BOX" &&
        rightHand.items[4].slot === "TOOL BOX" &&
        rightHand.items[4].quantity === 1 &&
        isNaN(rightHand.items[4].uses) &&
        rightHand.items[4].weight === 5 &&
        rightHand.items[4].inventory.length > 0 &&
        rightHand.items[4].row === 18,
        rightHand.items[4]
    );
    assert.ok(
        rightHand.items[5].name === "HAMMER" &&
        rightHand.items[5].pluralName === "HAMMERS" &&
        rightHand.items[5].singleContainingPhrase === "a HAMMER" &&
        rightHand.items[5].pluralContainingPhrase === "HAMMERS" &&
        rightHand.items[5].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[5].containerName === "VIVIANS SKIRT/LEFT POCKET" &&
        rightHand.items[5].container.name === "SKIRT" &&
        rightHand.items[5].slot === "LEFT POCKET" &&
        rightHand.items[5].quantity === 1 &&
        isNaN(rightHand.items[5].uses) &&
        rightHand.items[5].weight === 2 &&
        rightHand.items[5].inventory.length === 0 &&
        rightHand.items[5].row === 19,
        rightHand.items[5]
    );
    assert.ok(
        rightHand.items[6].name === "HAMMER" &&
        rightHand.items[6].pluralName === "HAMMERS" &&
        rightHand.items[6].singleContainingPhrase === "a HAMMER" &&
        rightHand.items[6].pluralContainingPhrase === "HAMMERS" &&
        rightHand.items[6].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[6].containerName === "VIVIANS SKIRT/RIGHT POCKET" &&
        rightHand.items[6].container.name === "SKIRT" &&
        rightHand.items[6].slot === "RIGHT POCKET" &&
        rightHand.items[6].quantity === 1 &&
        isNaN(rightHand.items[6].uses) &&
        rightHand.items[6].weight === 2 &&
        rightHand.items[6].inventory.length === 0 &&
        rightHand.items[6].row === 20,
        rightHand.items[6]
    );

    // Test that all of the inventoryItem row numbers were updated properly.
    for (let i = 0; i < game.inventoryItems.length; i++)
        assert.ok(game.inventoryItems[i].row === i + 2, game.inventoryItems[i].row);

    // Test that all of the inventoryItems and Player inventory items have the same row numbers.
    for (let i = 0; i < nero.inventory.length; i++) {
        for (let j = 0; j < nero.inventory[i].items.length; j++) {
            const match = game.inventoryItems.find(item => item.player.id === nero.id && (item.prefab === null && nero.inventory[i].items[j].prefab === null || item.prefab !== null && nero.inventory[i].items[j].prefab !== null && item.prefab.id === nero.inventory[i].items[j].prefab.id) && item.equipmentSlot === nero.inventory[i].items[j].equipmentSlot && item.containerName === nero.inventory[i].items[j].containerName );
            assert.ok(match !== null && match !== undefined, nero.inventory[i].items[j].row);
            assert.ok(nero.inventory[i].items[j].row === match.row);
        }
    }

    return;
}

function test_take_item_1() {
    var vivian = game.players[0];
    var itemSatchel = game.items[8];
    var hand = "RIGHT HAND";
    var container = itemSatchel.container;
    var slot = "";

    vivian.take(game, itemSatchel, hand, container, slot);

    // Test that all of the data was converted properly.
    var rightHand = vivian.inventory[7];
    assert.ok(rightHand.equippedItem.name === "SATCHEL", rightHand.equippedItem);
    assert.ok(rightHand.equippedItem.weight === 6, rightHand.equippedItem.weight);
    assert.ok(rightHand.equippedItem.inventory[0].takenSpace === 6, rightHand.equippedItem.inventory[0].takenSpace);
    assert.ok(rightHand.items.length === 4, rightHand.items.length);
    assert.ok(
        rightHand.items[0].name === "SATCHEL" &&
        rightHand.items[0].pluralName === "SATCHELS" &&
        rightHand.items[0].singleContainingPhrase === "a SATCHEL" &&
        rightHand.items[0].pluralContainingPhrase === "SATCHELS" &&
        rightHand.items[0].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[0].containerName === "" &&
        rightHand.items[0].container === null &&
        rightHand.items[0].slot === "" &&
        rightHand.items[0].quantity === 1 &&
        isNaN(rightHand.items[0].uses) &&
        rightHand.items[0].weight === 6 &&
        rightHand.items[0].inventory.length > 0 &&
        rightHand.items[0].row === 28,
        rightHand.items[0]
    );
    assert.ok(
        rightHand.items[1].name === "LAPTOP" &&
        rightHand.items[1].pluralName === "LAPTOPS" &&
        rightHand.items[1].singleContainingPhrase === "a LAPTOP" &&
        rightHand.items[1].pluralContainingPhrase === "LAPTOPS" &&
        rightHand.items[1].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[1].containerName === "VIVIANS SATCHEL/SATCHEL" &&
        rightHand.items[1].container.name === "SATCHEL" &&
        rightHand.items[1].slot === "SATCHEL" &&
        rightHand.items[1].quantity === 1 &&
        isNaN(rightHand.items[1].uses) &&
        rightHand.items[1].weight === 2 &&
        rightHand.items[1].inventory.length === 0 &&
        rightHand.items[1].row === 34,
        rightHand.items[1]
    );
    assert.ok(
        rightHand.items[2].name === "SMALL BAG" &&
        rightHand.items[2].pluralName === "" &&
        rightHand.items[2].singleContainingPhrase === "a SMALL BAG" &&
        rightHand.items[2].pluralContainingPhrase === "" &&
        rightHand.items[2].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[2].containerName === "VIVIANS SATCHEL/SATCHEL" &&
        rightHand.items[2].container.name === "SATCHEL" &&
        rightHand.items[2].slot === "SATCHEL" &&
        rightHand.items[2].quantity === 1 &&
        isNaN(rightHand.items[2].uses) &&
        rightHand.items[2].weight === 3 &&
        rightHand.items[2].inventory.length > 0 &&
        rightHand.items[2].row === 35,
        rightHand.items[2]
    );
    assert.ok(
        rightHand.items[3].name === "WRENCH" &&
        rightHand.items[3].pluralName === "WRENCHES" &&
        rightHand.items[3].singleContainingPhrase === "a WRENCH" &&
        rightHand.items[3].pluralContainingPhrase === "WRENCHES" &&
        rightHand.items[3].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[3].containerName === "SMALL BAG/SMALL BAG" &&
        rightHand.items[3].container.name === "SMALL BAG" &&
        rightHand.items[3].slot === "SMALL BAG" &&
        rightHand.items[3].quantity === 1 &&
        isNaN(rightHand.items[3].uses) &&
        rightHand.items[3].weight === 2 &&
        rightHand.items[3].inventory.length === 0 &&
        rightHand.items[3].row === 36,
        rightHand.items[3]
    );

    // Test that all of the inventoryItem row numbers were updated properly.
    for (let i = 0; i < game.inventoryItems.length; i++)
        assert.ok(game.inventoryItems[i].row === i + 2, game.inventoryItems[i].row);

    // Test that all of the inventoryItems and Player inventory items have the same row numbers.
    for (let i = 0; i < vivian.inventory.length; i++) {
        for (let j = 0; j < vivian.inventory[i].items.length; j++) {
            const match = game.inventoryItems.find(item => item.player.id === vivian.id && (item.prefab === null && vivian.inventory[i].items[j].prefab === null || item.prefab !== null && vivian.inventory[i].items[j].prefab !== null && item.prefab.id === vivian.inventory[i].items[j].prefab.id) && item.equipmentSlot === vivian.inventory[i].items[j].equipmentSlot && item.containerName === vivian.inventory[i].items[j].containerName);
            assert.ok(match !== null && match !== undefined, vivian.inventory[i].items[j].row);
            assert.ok(vivian.inventory[i].items[j].row === match.row);
        }
    }

    return;
}

function test_drop_item_0() {
    var vivian = game.players[0];
    var leftHand = vivian.inventory[8];
    var inventoryViviansSmallBag = leftHand.items[0];
    var hand = "LEFT HAND";
    var objectCloset = game.objects[3];
    var slot = "";

    vivian.drop(game, inventoryViviansSmallBag, hand, objectCloset, slot);

    // Test that all of the data was converted properly.
    assert.ok(leftHand.equippedItem === null, leftHand.equippedItem);
    assert.ok(
        game.items[9].name === "SMALL BAG" &&
        game.items[9].pluralName === "" &&
        game.items[9].singleContainingPhrase === "a SMALL BAG" &&
        game.items[9].pluralContainingPhrase === "" &&
        game.items[9].location.name === "beach-house" &&
        game.items[9].accessible &&
        game.items[9].containerName === "Object: CLOSET" &&
        game.items[9].container.name === "CLOSET" &&
        game.items[9].slot === "" &&
        game.items[9].quantity === 1 &&
        isNaN(game.items[9].uses) &&
        game.items[9].weight === 3 &&
        game.items[9].inventory.length > 0 &&
        game.items[9].row === 11,
        game.items[9]
    );
    assert.ok(
        game.items[10].name === "WRENCH" &&
        game.items[10].pluralName === "WRENCHES" &&
        game.items[10].singleContainingPhrase === "a WRENCH" &&
        game.items[10].pluralContainingPhrase === "WRENCHES" &&
        game.items[10].location.name === "beach-house" &&
        game.items[10].accessible &&
        game.items[10].containerName === "Item: SMALL BAG 2/SMALL BAG" &&
        game.items[10].container.name === "SMALL BAG" &&
        game.items[10].slot === "SMALL BAG" &&
        game.items[10].quantity === 1 &&
        isNaN(game.items[10].uses) &&
        game.items[10].weight === 2 &&
        game.items[10].inventory.length === 0 &&
        game.items[10].row === 12,
        game.items[10]
    );

    // Test that all of the inventoryItem row numbers were updated properly.
    for (let i = 0; i < game.items.length; i++)
        assert.ok(game.items[i].row === i + 2, game.items[i].row);

    // Test that all of the inventoryItems and Player inventory items have the same row numbers.
    for (let i = 0; i < vivian.inventory.length; i++) {
        for (let j = 0; j < vivian.inventory[i].items.length; j++) {
            const match = game.inventoryItems.find(item => item.player.id === vivian.id && (item.prefab === null && vivian.inventory[i].items[j].prefab === null || item.prefab !== null && vivian.inventory[i].items[j].prefab !== null && item.prefab.id === vivian.inventory[i].items[j].prefab.id) && item.equipmentSlot === vivian.inventory[i].items[j].equipmentSlot && item.containerName === vivian.inventory[i].items[j].containerName);
            assert.ok(match !== null && match !== undefined, vivian.inventory[i].items[j].row);
            assert.ok(vivian.inventory[i].items[j].row === match.row);
        }
    }

    return;
}

function test_push_queue_0() {
    return new Promise((resolve) => {
        queuer.pushQueue("1oZxppuByy64QTb9pOJ-G1m2PEoVCO-egL0gycKVDjFU", function (response) {
            var errors = [];

            const objectData = [
                ["FLOOR", "beach-house", "TRUE", "", "FALSE", "on", "<desc><s>The floor beneath you is smooth and wooden.</s> <s>There's a rug underneath the COUCHES and TABLE.</s> <s>You find <il><item>a SKIRT</item></il> haphazardly placed on the floor.</s></desc>"],
                ["COUCHES", "beach-house", "TRUE", "", "FALSE", "in", "<desc><s>You inspect the couches.</s> <s>They are soft and comfortable, and each is lined with a few pillows.</s> <s>Looking underneath the cushions, you find <il><item>a GUN</item></il>.</s></desc>"],
                ["TABLE", "beach-house", "TRUE", "CHEST", "FALSE", "in", "<desc><s>You examine the table.</s> <if cond=\"game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === true\"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open, but it seems to be unlocked.</s> <var v=\" game.puzzles.find(puzzle => puzzle.name === 'CHEST').alreadySolvedDescription\" /></if><if cond=\"game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === false\"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open.</s></if></desc>"],
                ["CLOSET", "beach-house", "TRUE", "", "TRUE", "in", "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il><item>a SMALL BAG</item> and <item>a SLINGSHOT</item></il>.</s></desc>"],
                ["CLOTHES", "beach-house", "TRUE", "", "FALSE", "", "<desc><s>Examining the clothes, you find a variety of different garments.</s> <s>Sundresses, T-shirts, shorts, skirts - this closet seems to have everything you could think of.</s></desc>"],
                ["HOT TUB", "beach-house", "TRUE", "", "FALSE", "in", "<desc><s>You inspect the hot tub.</s> <s>It looks to be fairly spacious, with room for probably up to 3 people to use at once.</s> <s>It has a digital thermometer to increase the temperature up to 100 degrees Fahrenheit, and buttons to turn it on.</s> <s>In the middle, you find <il></il>.</s></desc>"]
            ];
            sheets.getData("Objects!A1:G", function (response) {
                const sheet = response.data.values;
                for (let i = 1; i < sheet.length && i < objectData.length; i++) {
                    if (!arraysEqual(objectData[i - 1], sheet[i]))
                        errors.push(`Objects Row ${i + 1}: ` + sheet[i].join(','));

                    assert.ok(errors.length === 0, errors.join('\n'));
                }
            });

            const itemData = [
                ["HAMMER", "beach-house", "TRUE", "", "1", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["GUN", "beach-house", "TRUE", "Object: COUCHES", "1", "", "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>"],
                ["PEPSI", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>"],
                ["ROPE", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>"],
                ["KNIFE", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>"],
                ["HAMMER", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["SLINGSHOT", "beach-house", "TRUE", "Object: CLOSET", "1", "", "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>"],
                ["TOOL BOX", "beach-house", "TRUE", "Object: CLOSET", "0", "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SKIRT</item>, <item>4 SCREWDRIVERS</item>, <item>2 HAMMERS</item>, and <item>4 WRENCHES</item></il>.</s></desc>"],
                ["VIVIANS SATCHEL", "beach-house", "TRUE", "Object: CLOSET", "0", "", "<desc><s>It's a beige satchel with a long strap to go over the shoulder.</s> <s>Inside, you find <il><item>a LAPTOP</item> and <item>a SMALL BAG</item></il>.</s></desc>"],
                ["SMALL BAG 2", "beach-house", "TRUE", "Object: CLOSET", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>"],
                ["WRENCH", "beach-house", "TRUE", "Item: SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["SCREWDRIVER", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["HAMMER", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["WRENCH", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["VIVIANS SKIRT", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"><item>a HAMMER</item></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"><item>a HAMMER</item></il>.</s></desc>"],
                ["HAMMER", "beach-house", "TRUE", "Item: VIVIANS SKIRT/LEFT POCKET", "0", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["HAMMER", "beach-house", "TRUE", "Item: VIVIANS SKIRT/RIGHT POCKET", "0", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["VIVIANS LAPTOP", "beach-house", "TRUE", "Item: VIVIANS SATCHEL/SATCHEL", "0", "", "<desc><if cond=\"player.name === 'Vivian'\"><s>This is your laptop.</s> <s>You take it with you everywhere you go.</s></if><if cond=\"player.name !== 'Vivian'\"><s>This is a very expensive-looking laptop.</s> <s>The keyboard lights up when a key is pressed.</s> <s>The login screen is asking for a password for Vivian's account.</s></if></desc>"],
                ["SMALL BAG", "beach-house", "TRUE", "Item: VIVIANS SATCHEL/SATCHEL", "0", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>"],
                ["WRENCH", "beach-house", "TRUE", "Item: SMALL BAG/SMALL BAG", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"]
            ];
            sheets.getData("Items!A1:G", function (response) {
                const sheet = response.data.values;
                for (let i = 1; i < sheet.length && i < itemData.length; i++) {
                    if (!arraysEqual(itemData[i - 1], sheet[i]))
                        errors.push(`Items Row ${i + 1}: ` + sheet[i].join(','));

                    assert.ok(errors.length === 0, errors.join('\n'));
                }
            });

            const inventoryData = [
                ["Nero", "NULL", "HAT"],
                ["Nero", "NEROS GLASSES", "GLASSES", "", "1", "", "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>"],
                ["Nero", "NULL", "FACE"],
                ["Nero", "NULL", "NECK"],
                ["Nero", "NULL", "BAG"],
                ["Nero", "NEROS SHIRT", "SHIRT", "", "1", "", "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>"],
                ["Nero", "NEROS BLAZER", "JACKET", "", "1", "", "<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name=\"BREAST POCKET\"></il>.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
                ["Nero", "TOOL BOX", "RIGHT HAND", "", "1", "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SKIRT</item>, <item>4 SCREWDRIVERS</item>, <item>2 HAMMERS</item>, and <item>4 WRENCHES</item></il>.</s></desc>"],
                ["Nero", "NULL", "LEFT HAND"],
                ["Nero", "NEROS PANTS", "PANTS", "", "1", "", "<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s> <s>In the left back pocket, you find <il name=\"LEFT BACK POCKET\"></il>.</s> <s>In the right back pocket, you find <il name=\"RIGHT BACK POCKET\"></il>.</s></desc>"],
                ["Nero", "NEROS UNDERWEAR", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of black, plaid boxers.</s></desc>"],
                ["Nero", "NEROS SOCKS", "SOCKS", "", "1", "", "<desc><s>It's a pair of plain, black ankle socks.</s></desc>"],
                ["Nero", "NEROS SHOES", "SHOES", "", "1", "", "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>"],
                ["Nero", "SCREWDRIVER", "RIGHT HAND", "TOOL BOX/TOOL BOX", "4", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["Nero", "HAMMER", "RIGHT HAND", "TOOL BOX/TOOL BOX", "2", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["Nero", "WRENCH", "RIGHT HAND", "TOOL BOX/TOOL BOX", "4", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["Nero", "VIVIANS SKIRT", "RIGHT HAND", "TOOL BOX/TOOL BOX", "1", "", "<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"><item>a HAMMER</item></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"><item>a HAMMER</item></il>.</s></desc>"],
                ["Nero", "HAMMER", "RIGHT HAND", "VIVIANS SKIRT/LEFT POCKET", "1", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["Nero", "HAMMER", "RIGHT HAND", "VIVIANS SKIRT/RIGHT POCKET", "1", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["Vivian", "NULL", "HAT"],
                ["Vivian", "VIVIANS GLASSES", "GLASSES", "", "1", "", "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>"],
                ["Vivian", "NULL", "FACE"],
                ["Vivian", "NULL", "NECK"],
                ["Vivian", "NULL", "BAG"],
                ["Vivian", "VIVIANS SHIRT", "SHIRT", "", "1", "", "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>"],
                ["Vivian", "VIVIANS SWEATER", "JACKET", "", "1", "", "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>"],
                ["Vivian", "VIVIANS SATCHEL", "RIGHT HAND", "", "1", "", "<desc><s>It's a beige satchel with a long strap to go over the shoulder.</s> <s>Inside, you find <il><item>a LAPTOP</item> and <item>a SMALL BAG</item></il>.</s></desc>"],
                ["Vivian", "NULL", "LEFT HAND"],
                ["Vivian", "VIVIANS SKIRT", "PANTS", "", "1", "", "<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
                ["Vivian", "VIVIANS UNDERWEAR", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of plain, pink panties.</s></desc>"],
                ["Vivian", "VIVIANS SOCKS", "SOCKS", "", "1", "", "<desc><s>It's a pair of gray thigh high socks.</s></desc>"],
                ["Vivian", "VIVIANS SHOES", "SHOES", "", "2", "", "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>"],
                ["Vivian", "VIVIANS LAPTOP", "RIGHT HAND", "VIVIANS SATCHEL/SATCHEL", "1", "", "<desc><if cond=\"player.name === 'Vivian'\"><s>This is your laptop.</s> <s>You take it with you everywhere you go.</s></if><if cond=\"player.name !== 'Vivian'\"><s>This is a very expensive-looking laptop.</s> <s>The keyboard lights up when a key is pressed.</s> <s>The login screen is asking for a password for Vivian's account.</s></if></desc>"],
                ["Vivian", "SMALL BAG", "RIGHT HAND", "VIVIANS SATCHEL/SATCHEL", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>"],
                ["Vivian", "WRENCH", "RIGHT HAND", "SMALL BAG/SMALL BAG", "1", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["Vivian", "WRENCH", "LEFT HAND", "SMALL BAG 2/SMALL BAG", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"]
            ];
            sheets.getData("Inventory Items!A1:G", function (response) {
                const sheet = response.data.values;
                for (let i = 1; i < sheet.length && i < inventoryData.length; i++) {
                    if (!arraysEqual(inventoryData[i - 1], sheet[i]))
                        errors.push(`Inventory Items Row ${i + 1}: ` + sheet[i].join(','));

                    assert.ok(errors.length === 0, errors.join('\n'));
                }
            });

            resolve();
        });
    });
}

function init_1() {
    // Clear game data.
    game.items.length = 0;
    game.inventoryItems.length = 0;
    game.queue.length = 0;

    // Initialize room.
    var roomBeachHouse = game.rooms[0];

    // Initialize objects;
    var objectFloor = game.objects[0];
    var objectCouches = game.objects[1];
    var objectTable = game.objects[2];
    var objectCloset = game.objects[3];
    var objectClothes = game.objects[4];
    var objectHotTub = game.objects[5];

    objectFloor.description = "<desc><s>The floor beneath you is smooth and wooden.</s> <s>There's a rug underneath the COUCHES and TABLE.</s> <s>You find <il></il> haphazardly placed on the floor.</s></desc>";
    objectCloset.description = "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il><item>a TOOL BOX</item> and <item>a SLINGSHOT</item></il>.</s></desc>";

    // Initialize puzzles.
    var puzzleChest = game.puzzles[0];

    puzzleChest.alreadySolvedDescription = "<desc><s>You open the chest.</s> <s>Inside, you find <il><item>a bottle of PEPSI</item>, <item>a ROPE</item>, and <item>a KNIFE</item></il>.</s></desc>";

    // Initialize prefabs.
    var prefabGun = game.prefabs[0];
    var prefabPepsi = game.prefabs[1];
    var prefabGlassBottle = game.prefabs[2];
    var prefabRope = game.prefabs[3];
    var prefabKnife = game.prefabs[4];
    var prefabSlingshot = game.prefabs[5];
    var prefabToolBox = game.prefabs[6];
    var prefabScrewdriver = game.prefabs[7];
    var prefabHammer = game.prefabs[8];
    var prefabWrench = game.prefabs[9];
    var prefabViviansGlasses = game.prefabs[10];
    var prefabViviansShirt = game.prefabs[11];
    var prefabViviansSweater = game.prefabs[12];
    var prefabViviansSatchel = game.prefabs[13];
    var prefabViviansSkirt = game.prefabs[14];
    var prefabViviansUnderwear = game.prefabs[15];
    var prefabViviansSocks = game.prefabs[16];
    var prefabViviansShoes = game.prefabs[17];
    var prefabViviansLaptop = game.prefabs[18];
    var prefabNerosGlasses = game.prefabs[19];
    var prefabNerosShirt = game.prefabs[20];
    var prefabNerosBlazer = game.prefabs[21];
    var prefabNerosPants = game.prefabs[22];
    var prefabNerosUnderwear = game.prefabs[23];
    var prefabNerosSocks = game.prefabs[24];
    var prefabNerosShoes = game.prefabs[25];
    var prefabSmallBag = game.prefabs[26];
    var prefabSmallBag2 = game.prefabs[27];

    // Initialize items.
    var itemRoomHammer = new Item(prefabHammer, roomBeachHouse, true, "", 1, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 2);
    var itemGun = new Item(prefabGun, roomBeachHouse, true, "Object: COUCHES", 1, NaN, "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>", 3);
    var itemPepsi = new Item(prefabPepsi, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>", 4);
    var itemRope = new Item(prefabRope, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>", 5);
    var itemKnife = new Item(prefabKnife, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>", 6);
    var itemSlingshot = new Item(prefabSlingshot, roomBeachHouse, true, "Object: CLOSET", 1, NaN, "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>", 7);
    var itemToolBox = new Item(prefabToolBox, roomBeachHouse, true, "Object: CLOSET", 1, NaN, "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>", 8);
    var itemScrewdriver = new Item(prefabScrewdriver, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 3, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 9);
    var itemToolBoxHammer = new Item(prefabHammer, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 3, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 10);
    var itemWrench = new Item(prefabWrench, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 2, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 11);

    game.items.push(itemRoomHammer);
    game.items.push(itemGun);
    game.items.push(itemPepsi);
    game.items.push(itemRope);
    game.items.push(itemKnife);
    game.items.push(itemSlingshot);
    game.items.push(itemToolBox);
    game.items.push(itemScrewdriver);
    game.items.push(itemToolBoxHammer);
    game.items.push(itemWrench);

    // Set item containers.
    itemGun.container = objectCouches;
    itemPepsi.container = puzzleChest;
    itemRope.container = puzzleChest;
    itemKnife.container = puzzleChest;
    itemSlingshot.container = objectCloset;
    itemToolBox.container = objectCloset;
    itemScrewdriver.container = itemToolBox; itemScrewdriver.slot = "TOOL BOX";
    itemToolBoxHammer.container = itemToolBox; itemToolBoxHammer.slot = "TOOL BOX";
    itemWrench.container = itemToolBox; itemWrench.slot = "TOOL BOX";

    // Set item weights and inventories.
    for (let i = 0; i < game.items.length; i++) {
        const prefab = game.items[i].prefab;
        game.items[i].weight = prefab.weight;
        for (let j = 0; j < prefab.inventory.length; j++)
            game.items[i].inventory.push({ name: prefab.inventory[j].name, capacity: prefab.inventory[j].capacity, takenSpace: prefab.inventory[j].takenSpace, weight: prefab.inventory[j].weight, item: [] });
    }

    // Insert inventory items.
    itemToolBox.insertItem(itemScrewdriver, itemScrewdriver.slot);
    itemToolBox.insertItem(itemToolBoxHammer, itemToolBoxHammer.slot);
    itemToolBox.insertItem(itemWrench, itemWrench.slot);

    // Run some tests.
    assert.ok(itemToolBox.weight === 18, itemToolBox.weight);
    assert.ok(itemToolBox.inventory[0].takenSpace === 8, itemToolBox.inventory[0].takenSpace);

    // Initialize players.
    var vivian = game.players[0];
    var nero = game.players[1];

    // Initialize inventory items.
    var inventoryNerosHat = new InventoryItem(nero, null, "HAT", "", null, null, "", 2);
    var inventoryNerosGlasses = new InventoryItem(nero, prefabNerosGlasses, "GLASSES", "", 1, NaN, "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>", 3);
    var inventoryNerosFace = new InventoryItem(nero, null, "FACE", "", null, null, "", 4);
    var inventoryNerosNeck = new InventoryItem(nero, null, "NECK", "", null, null, "", 5);
    var inventoryNerosBag = new InventoryItem(nero, null, "BAG", "", null, null, "", 6);
    var inventoryNerosShirt = new InventoryItem(nero, prefabNerosShirt, "SHIRT", "", 1, NaN, "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>", 7);
    var inventoryNerosBlazer = new InventoryItem(nero, prefabNerosBlazer, "JACKET", "", 1, NaN, `<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name="BREAST POCKET"></il>.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 8);
    var inventoryNerosRightHand = new InventoryItem(nero, null, "RIGHT HAND", "", null, null, "", 9);
    var inventoryNerosLeftHand = new InventoryItem(nero, null, "LEFT HAND", "", null, null, "", 10);
    var inventoryNerosPants = new InventoryItem(nero, prefabNerosPants, "PANTS", "", 1, NaN, `<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s></desc>`, 11);
    var inventoryNerosUnderwear = new InventoryItem(nero, prefabNerosUnderwear, "UNDERWEAR", "", 1, NaN, "<desc><s>It's a pair of black, plaid boxers.</s></desc>", 12);
    var inventoryNerosSocks = new InventoryItem(nero, prefabNerosSocks, "SOCKS", "", 1, NaN, "<desc><s>It's a pair of plain, black ankle socks.</s></desc>", 13);
    var inventoryNerosShoes = new InventoryItem(nero, prefabNerosShoes, "SHOES", "", 1, NaN, "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>", 14);
    var inventoryViviansHat = new InventoryItem(vivian, null, "HAT", "", null, null, "", 15);
    var inventoryViviansGlasses = new InventoryItem(vivian, prefabViviansGlasses, "GLASSES", "", 1, NaN, "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>", 16);
    var inventoryViviansFace = new InventoryItem(vivian, null, "FACE", "", null, null, "", 17);
    var inventoryViviansNeck = new InventoryItem(vivian, null, "NECK", "", null, null, "", 18);
    var inventoryViviansBag = new InventoryItem(vivian, null, "BAG", "", null, null, "", 19);
    var inventoryViviansShirt = new InventoryItem(vivian, prefabViviansShirt, "SHIRT", "", 1, NaN, "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>", 20);
    var inventoryViviansSweater = new InventoryItem(vivian, prefabViviansSweater, "JACKET", "", 1, NaN, "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>", 21);
    var inventoryViviansScrewdriver = new InventoryItem(vivian, prefabScrewdriver, "RIGHT HAND", "", 1, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 22);
    var inventoryViviansSmallBag = new InventoryItem(vivian, prefabSmallBag2, "LEFT HAND", "", 1, NaN, "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>", 23);
    var inventoryViviansSkirt = new InventoryItem(vivian, prefabViviansSkirt, "PANTS", "", 1, NaN, `<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 24);
    var inventoryViviansUnderwear = new InventoryItem(vivian, prefabViviansUnderwear, "UNDERWEAR", "", 1, NaN, "<desc><s>It's a pair of plain, pink panties.</s></desc>", 25);
    var inventoryViviansSocks = new InventoryItem(vivian, prefabViviansSocks, "SOCKS", "", 1, NaN, "<desc><s>It's a pair of black thigh high socks.</s></desc>", 26);
    var inventoryViviansShoes = new InventoryItem(vivian, prefabViviansShoes, "SHOES", "", 1, NaN, "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>", 27);
    var inventoryViviansWrench = new InventoryItem(vivian, prefabWrench, "LEFT HAND", "SMALL BAG 2", 1, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 28);

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
    game.inventoryItems.push(inventoryViviansScrewdriver);
    game.inventoryItems.push(inventoryViviansSmallBag);
    game.inventoryItems.push(inventoryViviansSkirt);
    game.inventoryItems.push(inventoryViviansUnderwear);
    game.inventoryItems.push(inventoryViviansSocks);
    game.inventoryItems.push(inventoryViviansShoes);
    game.inventoryItems.push(inventoryViviansWrench);

    // Create EquipmentSlots for each player.
    for (let i = 0; i < game.players_alive.length; i++) {
        let inventory = [];
        let equipmentItems = game.inventoryItems.filter(item => item.player instanceof Player && item.player.id === game.players_alive[i].id && item.equipmentSlot !== "" && item.containerName === "");
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

    inventoryViviansWrench.container = inventoryViviansSmallBag; inventoryViviansWrench.slot = "SMALL BAG";
    inventoryViviansSmallBag.insertItem(inventoryViviansWrench, inventoryViviansWrench.slot);

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
    vivian.inventory[7].items.push(inventoryViviansScrewdriver);
    vivian.inventory[7].equippedItem = inventoryViviansScrewdriver;
    vivian.inventory[8].items.push(inventoryViviansSmallBag);
    vivian.inventory[8].equippedItem = inventoryViviansSmallBag;
    vivian.inventory[9].items.push(inventoryViviansSkirt);
    vivian.inventory[9].equippedItem = inventoryViviansSkirt;
    vivian.inventory[10].items.push(inventoryViviansUnderwear);
    vivian.inventory[10].equippedItem = inventoryViviansUnderwear;
    vivian.inventory[11].items.push(inventoryViviansSocks);
    vivian.inventory[11].equippedItem = inventoryViviansSocks;
    vivian.inventory[12].items.push(inventoryViviansShoes);
    vivian.inventory[12].equippedItem = inventoryViviansShoes;

    // Run some tests.
    assert.ok(inventoryViviansSmallBag.weight === 3, inventoryViviansSmallBag.weight);
    assert.ok(inventoryViviansSmallBag.inventory[0].takenSpace === 1, inventoryViviansSmallBag.inventory[0].takenSpace);
    
    // Re-initialize the sheet.
    /*return new Promise((resolve) => {
        const objectData = [
            ["FLOOR", "beach-house", "TRUE", "", "FALSE", "on", "<desc><s>The floor beneath you is smooth and wooden.</s> <s>There's a rug underneath the COUCHES and TABLE.</s> <s>You find <il></il> haphazardly placed on the floor.</s></desc>"],
            ["COUCHES", "beach-house", "TRUE", "", "FALSE", "in", "<desc><s>You inspect the couches.</s> <s>They are soft and comfortable, and each is lined with a few pillows.</s> <s>Looking underneath the cushions, you find <il><item>a GUN</item></il>.</s></desc>"],
            ["TABLE", "beach-house", "TRUE", "CHEST", "FALSE", "in", "<desc><s>You examine the table.</s> <if cond=\"game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === true\"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open, but it seems to be unlocked.</s> <var v=\" game.puzzles.find(puzzle => puzzle.name === 'CHEST').alreadySolvedDescription\" /></if><if cond=\"game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === false\"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open.</s></if></desc>"],
            ["CLOSET", "beach-house", "TRUE", "", "TRUE", "in", "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il><item>a TOOL BOX</item> and <item>a SLINGSHOT</item></il>.</s></desc>"],
            ["CLOTHES", "beach-house", "TRUE", "", "FALSE", "", "<desc><s>Examining the clothes, you find a variety of different garments.</s> <s>Sundresses, T-shirts, shorts, skirts - this closet seems to have everything you could think of.</s></desc>"],
            ["HOT TUB", "beach-house", "TRUE", "", "FALSE", "in", "<desc><s>You inspect the hot tub.</s> <s>It looks to be fairly spacious, with room for probably up to 3 people to use at once.</s> <s>It has a digital thermometer to increase the temperature up to 100 degrees Fahrenheit, and buttons to turn it on.</s> <s>In the middle, you find <il></il>.</s></desc>"]
        ];
        sheets.updateData("Objects!A2:G", objectData);

        const itemData = [
            ["HAMMER", "beach-house", "TRUE", "", "1", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
            ["GUN", "beach-house", "TRUE", "Object: COUCHES", "1", "", "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>"],
            ["PEPSI", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>"],
            ["ROPE", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>"],
            ["KNIFE", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>"],
            ["SLINGSHOT", "beach-house", "TRUE", "Object: CLOSET", "1", "", "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>"],
            ["TOOL BOX", "beach-house", "TRUE", "Object: CLOSET", "1", "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>"],
            ["SCREWDRIVER", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "3", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
            ["HAMMER", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "3", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
            ["WRENCH", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "2", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""]
        ];
        sheets.updateData("Items!A2:G", itemData);

        const puzzleData = [
            ["CHEST", "TRUE", "FALSE", "beach-house", "TABLE", "key lock", "TRUE", "", "Item: OLD KEY", "", "set accessible puzzle items chest beach-house / set inaccessible puzzle items chest beach-house", "<desc><s>You open the chest.</s> <s>Inside, you find <il><item>a bottle of PEPSI</item>, <item>a ROPE</item>, and <item>a KNIFE</item></il>.</s></desc>", "", "", "<desc><s>You can't seem to get the chest open. If only you had the key for it...</s></desc>"]
        ];
        sheets.updateData("Puzzles!A2:P", puzzleData);

        const inventoryData = [
            ["Nero", "NULL", "HAT", "", "", "", ""],
            ["Nero", "NEROS GLASSES", "GLASSES", "", "1", "", "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>"],
            ["Nero", "NULL", "FACE", "", "", "", ""],
            ["Nero", "NULL", "NECK", "", "", "", ""],
            ["Nero", "NULL", "BAG", "", "", "", ""],
            ["Nero", "NEROS SHIRT", "SHIRT", "", "1", "", "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>"],
            ["Nero", "NEROS BLAZER", "JACKET", "", "1", "", "<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name=\"BREAST POCKET\"></il>.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
            ["Nero", "NULL", "RIGHT HAND", "", "", "", ""],
            ["Nero", "NULL", "LEFT HAND", "", "", "", ""],
            ["Nero", "NEROS PANTS", "PANTS", "", "1", "", "<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s> <s>In the left back pocket, you find <il name=\"LEFT BACK POCKET\"></il>.</s> <s>In the right back pocket, you find <il name=\"RIGHT BACK POCKET\"></il>.</s></desc>"],
            ["Nero", "NEROS UNDERWEAR", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of black, plaid boxers.</s></desc>"],
            ["Nero", "NEROS SOCKS", "SOCKS", "", "1", "", "<desc><s>It's a pair of plain, black ankle socks.</s></desc>"],
            ["Nero", "NEROS SHOES", "SHOES", "", "1", "", "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>"],
            ["Vivian", "NULL", "HAT", "", "", "", ""],
            ["Vivian", "VIVIANS GLASSES", "GLASSES", "", "1", "", "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>"],
            ["Vivian", "NULL", "FACE", "", "", "", ""],
            ["Vivian", "NULL", "NECK", "", "", "", ""],
            ["Vivian", "NULL", "BAG", "", "", "", ""],
            ["Vivian", "VIVIANS SHIRT", "SHIRT", "", "1", "", "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>"],
            ["Vivian", "VIVIANS SWEATER", "JACKET", "", "1", "", "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>"],
            ["Vivian", "SCREWDRIVER", "RIGHT HAND", "", "1", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
            ["Vivian", "SMALL BAG 2", "LEFT HAND", "", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>"],
            ["Vivian", "VIVIANS SKIRT", "PANTS", "", "1", "", "<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
            ["Vivian", "VIVIANS UNDERWEAR", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of plain, pink panties.</s></desc>"],
            ["Vivian", "VIVIANS SOCKS", "SOCKS", "", "1", "", "<desc><s>It's a pair of black thigh high socks.</s></desc>"],
            ["Vivian", "VIVIANS SHOES", "SHOES", "", "1", "", "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>"],
            ["Vivian", "WRENCH", "LEFT HAND", "SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""],
            ["", "", "", "", "", "", ""]
        ];
        sheets.updateData("Inventory Items!A2:G", inventoryData);

        resolve();
    });*/
}

function test_take_drop_item_0() {
    var vivian = game.players[0];
    var rightHand = vivian.inventory[7];
    var leftHand = vivian.inventory[8];
    var inventoryViviansScrewdriver = rightHand.items[0];
    var inventoryViviansSmallBag = leftHand.items[0];
    var objectFloor = game.objects[0];
    var objectCloset = game.objects[3];

    // Drop screwdriver on floor.
    vivian.drop(game, inventoryViviansScrewdriver, "RIGHT HAND", objectFloor, "");
    assert.ok(rightHand.equippedItem === null, rightHand.equippedItem);
    assert.ok(
        game.items[10].name === "SCREWDRIVER" &&
        game.items[10].pluralName === "SCREWDRIVERS" &&
        game.items[10].singleContainingPhrase === "a SCREWDRIVER" &&
        game.items[10].pluralContainingPhrase === "SCREWDRIVERS" &&
        game.items[10].location.name === "beach-house" &&
        game.items[10].accessible &&
        game.items[10].containerName === "Object: FLOOR" &&
        game.items[10].container.name === "FLOOR" &&
        game.items[10].slot === "" &&
        game.items[10].quantity === 1 &&
        isNaN(game.items[10].uses) &&
        game.items[10].weight === 1 &&
        game.items[10].inventory.length === 0 &&
        game.items[10].row === 12,
        game.items[10]
    );

    // Drop small bag on floor.
    vivian.drop(game, inventoryViviansSmallBag, "LEFT HAND", objectFloor, "");
    assert.ok(leftHand.equippedItem === null, leftHand.equippedItem);
    assert.ok(
        game.items[11].name === "SMALL BAG" &&
        game.items[11].pluralName === "" &&
        game.items[11].singleContainingPhrase === "a SMALL BAG" &&
        game.items[11].pluralContainingPhrase === "" &&
        game.items[11].location.name === "beach-house" &&
        game.items[11].accessible &&
        game.items[11].containerName === "Object: FLOOR" &&
        game.items[11].container.name === "FLOOR" &&
        game.items[11].slot === "" &&
        game.items[11].quantity === 1 &&
        isNaN(game.items[11].uses) &&
        game.items[11].weight === 3 &&
        game.items[11].inventory.length > 0 &&
        game.items[11].row === 13,
        game.items[11]
    );
    assert.ok(
        game.items[12].name === "WRENCH" &&
        game.items[12].pluralName === "WRENCHES" &&
        game.items[12].singleContainingPhrase === "a WRENCH" &&
        game.items[12].pluralContainingPhrase === "WRENCHES" &&
        game.items[12].location.name === "beach-house" &&
        game.items[12].accessible &&
        game.items[12].containerName === "Item: SMALL BAG 2/SMALL BAG" &&
        game.items[12].container.name === "SMALL BAG" &&
        game.items[12].slot === "SMALL BAG" &&
        game.items[12].quantity === 1 &&
        isNaN(game.items[12].uses) &&
        game.items[12].weight === 2 &&
        game.items[12].inventory.length === 0 &&
        game.items[12].row === 14,
        game.items[12]
    );
    // Check that all the item references refer to the same item.
    game.items[12].quantity++;
    assert.ok(game.items[12].quantity === 2, game.items[12].quantity);
    assert.ok(game.items[12].container.inventory[0].item[0].quantity === 2, game.items[12].container.inventory[0].item[0].quantity);
    assert.ok(game.items[11].inventory[0].item[0].quantity === 2, game.items[11].inventory[0].item[0].quantity);
    game.items[12].quantity--;

    // Take screwdriver from floor.
    var itemScrewdriver = game.items[10];
    vivian.take(game, itemScrewdriver, "RIGHT HAND", objectFloor, "");
    assert.ok(
        game.items[10].name === "SCREWDRIVER" &&
        game.items[10].pluralName === "SCREWDRIVERS" &&
        game.items[10].singleContainingPhrase === "a SCREWDRIVER" &&
        game.items[10].pluralContainingPhrase === "SCREWDRIVERS" &&
        game.items[10].location.name === "beach-house" &&
        game.items[10].accessible &&
        game.items[10].containerName === "Object: FLOOR" &&
        game.items[10].container.name === "FLOOR" &&
        game.items[10].slot === "" &&
        game.items[10].quantity === 0 &&
        isNaN(game.items[10].uses) &&
        game.items[10].weight === 1 &&
        game.items[10].inventory.length === 0 &&
        game.items[10].row === 12,
        game.items[10]
    );
    assert.ok(rightHand.equippedItem !== null && rightHand.equippedItem.name === "SCREWDRIVER", rightHand.equippedItem);
    assert.ok(
        rightHand.items[0].name === "SCREWDRIVER" &&
        rightHand.items[0].pluralName === "SCREWDRIVERS" &&
        rightHand.items[0].singleContainingPhrase === "a SCREWDRIVER" &&
        rightHand.items[0].pluralContainingPhrase === "SCREWDRIVERS" &&
        rightHand.items[0].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[0].containerName === "" &&
        rightHand.items[0].container === null &&
        rightHand.items[0].slot === "" &&
        rightHand.items[0].quantity === 1 &&
        isNaN(rightHand.items[0].uses) &&
        rightHand.items[0].weight === 1 &&
        rightHand.items[0].inventory.length === 0 &&
        rightHand.items[0].row === 22,
        rightHand.items[0]
    );
    // Check that all the item references refer to the same item.
    rightHand.items[0].quantity++;
    assert.ok(rightHand.items[0].quantity === 2, rightHand.items[0].quantity);
    assert.ok(rightHand.equippedItem.quantity === 2, rightHand.equippedItem.quantity);
    assert.ok(game.inventoryItems[20].quantity === 2, game.inventoryItems[20].quantity);
    rightHand.items[0].quantity--;

    // Drop screwdriver in small bag.
    var itemSmallBag = game.items[11];
    vivian.drop(game, inventoryViviansScrewdriver, "RIGHT HAND", itemSmallBag, "SMALL BAG");
    assert.ok(rightHand.equippedItem === null, rightHand.equippedItem);
    assert.ok(
        game.items[11].name === "SMALL BAG" &&
        game.items[11].pluralName === "" &&
        game.items[11].singleContainingPhrase === "a SMALL BAG" &&
        game.items[11].pluralContainingPhrase === "" &&
        game.items[11].location.name === "beach-house" &&
        game.items[11].accessible &&
        game.items[11].containerName === "Object: FLOOR" &&
        game.items[11].container.name === "FLOOR" &&
        game.items[11].slot === "" &&
        game.items[11].quantity === 1 &&
        isNaN(game.items[11].uses) &&
        game.items[11].weight === 4 &&
        game.items[11].inventory.length > 0 &&
        game.items[11].row === 13,
        game.items[11]
    );
    assert.ok(
        game.items[13].name === "SCREWDRIVER" &&
        game.items[13].pluralName === "SCREWDRIVERS" &&
        game.items[13].singleContainingPhrase === "a SCREWDRIVER" &&
        game.items[13].pluralContainingPhrase === "SCREWDRIVERS" &&
        game.items[13].location.name === "beach-house" &&
        game.items[13].accessible &&
        game.items[13].containerName === "Item: SMALL BAG 2/SMALL BAG" &&
        game.items[13].container.name === "SMALL BAG" &&
        game.items[13].slot === "SMALL BAG" &&
        game.items[13].quantity === 1 &&
        isNaN(game.items[13].uses) &&
        game.items[13].weight === 1 &&
        game.items[13].inventory.length === 0 &&
        game.items[13].row === 15,
        game.items[13]
    );
    // Check that all the item references refer to the same item.
    game.items[13].quantity++;
    assert.ok(game.items[13].quantity === 2, game.items[13].quantity);
    assert.ok(game.items[13].container.inventory[0].item[1].quantity === 2, game.items[12].container.inventory[0].item[1].quantity);
    assert.ok(game.items[11].inventory[0].item[1].quantity === 2, game.items[11].inventory[0].item[1].quantity);
    game.items[13].quantity--;

    // Take small bag from floor.
    vivian.take(game, itemSmallBag, "RIGHT HAND", objectFloor, "");
    assert.ok(
        game.items[11].name === "SMALL BAG" &&
        game.items[11].pluralName === "" &&
        game.items[11].singleContainingPhrase === "a SMALL BAG" &&
        game.items[11].pluralContainingPhrase === "" &&
        game.items[11].location.name === "beach-house" &&
        game.items[11].accessible &&
        game.items[11].containerName === "Object: FLOOR" &&
        game.items[11].container.name === "FLOOR" &&
        game.items[11].slot === "" &&
        game.items[11].quantity === 0 &&
        isNaN(game.items[11].uses) &&
        game.items[11].weight === 4 &&
        game.items[11].inventory.length > 0 &&
        game.items[11].row === 13,
        game.items[11]
    );
    assert.ok(
        game.items[12].name === "WRENCH" &&
        game.items[12].pluralName === "WRENCHES" &&
        game.items[12].singleContainingPhrase === "a WRENCH" &&
        game.items[12].pluralContainingPhrase === "WRENCHES" &&
        game.items[12].location.name === "beach-house" &&
        game.items[12].accessible &&
        game.items[12].containerName === "Item: SMALL BAG 2/SMALL BAG" &&
        game.items[12].container.name === "SMALL BAG" &&
        game.items[12].slot === "SMALL BAG" &&
        game.items[12].quantity === 0 &&
        isNaN(game.items[12].uses) &&
        game.items[12].weight === 2 &&
        game.items[12].inventory.length === 0 &&
        game.items[12].row === 14,
        game.items[12]
    );
    assert.ok(
        game.items[13].name === "SCREWDRIVER" &&
        game.items[13].pluralName === "SCREWDRIVERS" &&
        game.items[13].singleContainingPhrase === "a SCREWDRIVER" &&
        game.items[13].pluralContainingPhrase === "SCREWDRIVERS" &&
        game.items[13].location.name === "beach-house" &&
        game.items[13].accessible &&
        game.items[13].containerName === "Item: SMALL BAG 2/SMALL BAG" &&
        game.items[13].container.name === "SMALL BAG" &&
        game.items[13].slot === "SMALL BAG" &&
        game.items[13].quantity === 0 &&
        isNaN(game.items[13].uses) &&
        game.items[13].weight === 1 &&
        game.items[13].inventory.length === 0 &&
        game.items[13].row === 15,
        game.items[13]
    );
    assert.ok(game.items[11].inventory[0].item[0].quantity === 0, game.items[11].inventory[0].item[0].quantity);
    assert.ok(game.items[11].inventory[0].item[1].quantity === 0, game.items[11].inventory[0].item[1].quantity);
    assert.ok(rightHand.equippedItem !== null && rightHand.equippedItem.name === "SMALL BAG", rightHand.equippedItem);
    assert.ok(
        rightHand.items[0].name === "SMALL BAG" &&
        rightHand.items[0].pluralName === "" &&
        rightHand.items[0].singleContainingPhrase === "a SMALL BAG" &&
        rightHand.items[0].pluralContainingPhrase === "" &&
        rightHand.items[0].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[0].containerName === "" &&
        rightHand.items[0].container === null &&
        rightHand.items[0].slot === "" &&
        rightHand.items[0].quantity === 1 &&
        isNaN(rightHand.items[0].uses) &&
        rightHand.items[0].weight === 4 &&
        rightHand.items[0].inventory.length > 0 &&
        rightHand.items[0].row === 22,
        rightHand.items[0]
    );
    assert.ok(
        rightHand.items[1].name === "WRENCH" &&
        rightHand.items[1].pluralName === "WRENCHES" &&
        rightHand.items[1].singleContainingPhrase === "a WRENCH" &&
        rightHand.items[1].pluralContainingPhrase === "WRENCHES" &&
        rightHand.items[1].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[1].containerName === "SMALL BAG 2/SMALL BAG" &&
        rightHand.items[1].container.name === "SMALL BAG" &&
        rightHand.items[1].slot === "SMALL BAG" &&
        rightHand.items[1].quantity === 1 &&
        isNaN(rightHand.items[1].uses) &&
        rightHand.items[1].weight === 2 &&
        rightHand.items[1].inventory.length === 0 &&
        rightHand.items[1].row === 28,
        rightHand.items[1]
    );
    // Check that all the item references refer to the same item.
    rightHand.items[1].quantity++;
    assert.ok(rightHand.items[1].quantity === 2, rightHand.items[1].quantity);
    assert.ok(rightHand.equippedItem.inventory[0].item[0].quantity === 2, rightHand.equippedItem.inventory[0].item[0].quantity);
    assert.ok(rightHand.items[0].inventory[0].item[0].quantity === 2, rightHand.items[0].inventory[0].item[0].quantity);
    assert.ok(game.inventoryItems[26].quantity === 2, game.inventoryItems[26].quantity);
    rightHand.items[1].quantity--;
    rightHand.items[2].quantity++;
    assert.ok(rightHand.items[2].quantity === 2, rightHand.items[2].quantity);
    assert.ok(rightHand.equippedItem.inventory[0].item[1].quantity === 2, rightHand.equippedItem.inventory[0].item[1].quantity);
    assert.ok(rightHand.items[0].inventory[0].item[1].quantity === 2, rightHand.items[0].inventory[0].item[1].quantity);
    assert.ok(game.inventoryItems[27].quantity === 2, game.inventoryItems[27].quantity);
    rightHand.items[2].quantity--;

    // Drop small bag in tool box.
    inventoryViviansSmallBag = rightHand.items[0];
    var itemToolBox = game.items[6];
    vivian.drop(game, inventoryViviansSmallBag, "RIGHT HAND", itemToolBox, "TOOL BOX");
    assert.ok(rightHand.equippedItem === null, rightHand.equippedItem);
    assert.ok(rightHand.items.length === 1, rightHand.items.length);
    assert.ok(
        game.items[6].name === "TOOL BOX" &&
        game.items[6].pluralName === "" &&
        game.items[6].singleContainingPhrase === "a TOOL BOX" &&
        game.items[6].pluralContainingPhrase === "" &&
        game.items[6].location.name === "beach-house" &&
        game.items[6].accessible &&
        game.items[6].containerName === "Object: CLOSET" &&
        game.items[6].container.name === "CLOSET" &&
        game.items[6].slot === "" &&
        game.items[6].quantity === 1 &&
        isNaN(game.items[6].uses) &&
        game.items[6].weight === 22 &&
        game.items[6].inventory.length > 0 &&
        game.items[6].row === 8,
        game.items[6]
    );
    assert.ok(
        game.items[10].name === "SMALL BAG" &&
        game.items[10].pluralName === "" &&
        game.items[10].singleContainingPhrase === "a SMALL BAG" &&
        game.items[10].pluralContainingPhrase === "" &&
        game.items[10].location.name === "beach-house" &&
        game.items[10].accessible &&
        game.items[10].containerName === "Item: TOOL BOX/TOOL BOX" &&
        game.items[10].container.name === "TOOL BOX" &&
        game.items[10].slot === "TOOL BOX" &&
        game.items[10].quantity === 1 &&
        isNaN(game.items[10].uses) &&
        game.items[10].weight === 4 &&
        game.items[10].inventory.length > 0 &&
        game.items[10].row === 12,
        game.items[10]
    );
    assert.ok(
        game.items[13].name === "WRENCH" &&
        game.items[13].pluralName === "WRENCHES" &&
        game.items[13].singleContainingPhrase === "a WRENCH" &&
        game.items[13].pluralContainingPhrase === "WRENCHES" &&
        game.items[13].location.name === "beach-house" &&
        game.items[13].accessible &&
        game.items[13].containerName === "Item: SMALL BAG 2/SMALL BAG" &&
        game.items[13].container.name === "SMALL BAG" &&
        game.items[13].slot === "SMALL BAG" &&
        game.items[13].quantity === 1 &&
        isNaN(game.items[13].uses) &&
        game.items[13].weight === 2 &&
        game.items[13].inventory.length === 0 &&
        game.items[13].row === 15,
        game.items[13]
    );
    assert.ok(
        game.items[14].name === "SCREWDRIVER" &&
        game.items[14].pluralName === "SCREWDRIVERS" &&
        game.items[14].singleContainingPhrase === "a SCREWDRIVER" &&
        game.items[14].pluralContainingPhrase === "SCREWDRIVERS" &&
        game.items[14].location.name === "beach-house" &&
        game.items[14].accessible &&
        game.items[14].containerName === "Item: SMALL BAG 2/SMALL BAG" &&
        game.items[14].container.name === "SMALL BAG" &&
        game.items[14].slot === "SMALL BAG" &&
        game.items[14].quantity === 1 &&
        isNaN(game.items[14].uses) &&
        game.items[14].weight === 1 &&
        game.items[14].inventory.length === 0 &&
        game.items[14].row === 16,
        game.items[14]
    );
    // Check that all the item references refer to the same item.
    game.items[13].quantity++;
    assert.ok(game.items[13].quantity === 2, game.items[13].quantity);
    assert.ok(game.items[13].container.inventory[0].item[0].quantity === 2, game.items[13].container.inventory[0].item[0].quantity);
    assert.ok(game.items[10].inventory[0].item[0].quantity === 2, game.items[10].inventory[0].item[0].quantity);
    assert.ok(game.items[6].inventory[0].item[3].inventory[0].item[0].quantity === 2, game.items[6].inventory[0].item[3].inventory[0].item[0].quantity);
    game.items[13].quantity--;
    game.items[14].quantity++;
    assert.ok(game.items[14].quantity === 2, game.items[14].quantity);
    assert.ok(game.items[14].container.inventory[0].item[1].quantity === 2, game.items[14].container.inventory[0].item[1].quantity);
    assert.ok(game.items[10].inventory[0].item[1].quantity === 2, game.items[10].inventory[0].item[1].quantity);
    assert.ok(game.items[6].inventory[0].item[3].inventory[0].item[1].quantity === 2, game.items[6].inventory[0].item[3].inventory[0].item[1].quantity);
    game.items[14].quantity--;

    // Take tool box from closet.
    vivian.take(game, itemToolBox, "RIGHT HAND", objectCloset, "");
    assert.ok(
        game.items[6].name === "TOOL BOX" &&
        game.items[6].pluralName === "" &&
        game.items[6].singleContainingPhrase === "a TOOL BOX" &&
        game.items[6].pluralContainingPhrase === "" &&
        game.items[6].location.name === "beach-house" &&
        game.items[6].accessible &&
        game.items[6].containerName === "Object: CLOSET" &&
        game.items[6].container.name === "CLOSET" &&
        game.items[6].slot === "" &&
        game.items[6].quantity === 0 &&
        isNaN(game.items[6].uses) &&
        game.items[6].weight === 22 &&
        game.items[6].inventory.length > 0 &&
        game.items[6].row === 8,
        game.items[6]
    );
    assert.ok(
        game.items[7].name === "SCREWDRIVER" &&
        game.items[7].pluralName === "SCREWDRIVERS" &&
        game.items[7].singleContainingPhrase === "a SCREWDRIVER" &&
        game.items[7].pluralContainingPhrase === "SCREWDRIVERS" &&
        game.items[7].location.name === "beach-house" &&
        game.items[7].accessible &&
        game.items[7].containerName === "Item: TOOL BOX/TOOL BOX" &&
        game.items[7].container.name === "TOOL BOX" &&
        game.items[7].slot === "TOOL BOX" &&
        game.items[7].quantity === 0 &&
        isNaN(game.items[7].uses) &&
        game.items[7].weight === 1 &&
        game.items[7].inventory.length === 0 &&
        game.items[7].row === 9,
        game.items[7]
    );
    assert.ok(
        game.items[8].name === "HAMMER" &&
        game.items[8].pluralName === "HAMMERS" &&
        game.items[8].singleContainingPhrase === "a HAMMER" &&
        game.items[8].pluralContainingPhrase === "HAMMERS" &&
        game.items[8].location.name === "beach-house" &&
        game.items[8].accessible &&
        game.items[8].containerName === "Item: TOOL BOX/TOOL BOX" &&
        game.items[8].container.name === "TOOL BOX" &&
        game.items[8].slot === "TOOL BOX" &&
        game.items[8].quantity === 0 &&
        isNaN(game.items[8].uses) &&
        game.items[8].weight === 2 &&
        game.items[8].inventory.length === 0 &&
        game.items[8].row === 10,
        game.items[8]
    );
    assert.ok(
        game.items[9].name === "WRENCH" &&
        game.items[9].pluralName === "WRENCHES" &&
        game.items[9].singleContainingPhrase === "a WRENCH" &&
        game.items[9].pluralContainingPhrase === "WRENCHES" &&
        game.items[9].location.name === "beach-house" &&
        game.items[9].accessible &&
        game.items[9].containerName === "Item: TOOL BOX/TOOL BOX" &&
        game.items[9].container.name === "TOOL BOX" &&
        game.items[9].slot === "TOOL BOX" &&
        game.items[9].quantity === 0 &&
        isNaN(game.items[9].uses) &&
        game.items[9].weight === 2 &&
        game.items[9].inventory.length === 0 &&
        game.items[9].row === 11,
        game.items[9]
    );
    assert.ok(
        game.items[10].name === "SMALL BAG" &&
        game.items[10].pluralName === "" &&
        game.items[10].singleContainingPhrase === "a SMALL BAG" &&
        game.items[10].pluralContainingPhrase === "" &&
        game.items[10].location.name === "beach-house" &&
        game.items[10].accessible &&
        game.items[10].containerName === "Item: TOOL BOX/TOOL BOX" &&
        game.items[10].container.name === "TOOL BOX" &&
        game.items[10].slot === "TOOL BOX" &&
        game.items[10].quantity === 0 &&
        isNaN(game.items[10].uses) &&
        game.items[10].weight === 4 &&
        game.items[10].inventory.length > 0 &&
        game.items[10].row === 12,
        game.items[10]
    );
    assert.ok(
        game.items[13].name === "WRENCH" &&
        game.items[13].pluralName === "WRENCHES" &&
        game.items[13].singleContainingPhrase === "a WRENCH" &&
        game.items[13].pluralContainingPhrase === "WRENCHES" &&
        game.items[13].location.name === "beach-house" &&
        game.items[13].accessible &&
        game.items[13].containerName === "Item: SMALL BAG 2/SMALL BAG" &&
        game.items[13].container.name === "SMALL BAG" &&
        game.items[13].slot === "SMALL BAG" &&
        game.items[13].quantity === 0 &&
        isNaN(game.items[13].uses) &&
        game.items[13].weight === 2 &&
        game.items[13].inventory.length === 0 &&
        game.items[13].row === 15,
        game.items[13]
    );
    assert.ok(
        game.items[14].name === "SCREWDRIVER" &&
        game.items[14].pluralName === "SCREWDRIVERS" &&
        game.items[14].singleContainingPhrase === "a SCREWDRIVER" &&
        game.items[14].pluralContainingPhrase === "SCREWDRIVERS" &&
        game.items[14].location.name === "beach-house" &&
        game.items[14].accessible &&
        game.items[14].containerName === "Item: SMALL BAG 2/SMALL BAG" &&
        game.items[14].container.name === "SMALL BAG" &&
        game.items[14].slot === "SMALL BAG" &&
        game.items[14].quantity === 0 &&
        isNaN(game.items[14].uses) &&
        game.items[14].weight === 1 &&
        game.items[14].inventory.length === 0 &&
        game.items[14].row === 16,
        game.items[14]
    );
    assert.ok(game.items[10].inventory[0].item[0].quantity === 0, game.items[10].inventory[0].item[0].quantity);
    assert.ok(game.items[10].inventory[0].item[1].quantity === 0, game.items[10].inventory[0].item[1].quantity);
    assert.ok(game.items[6].inventory[0].item[0].quantity === 0, game.items[6].inventory[0].item[0].quantity);
    assert.ok(game.items[6].inventory[0].item[1].quantity === 0, game.items[6].inventory[0].item[1].quantity);
    assert.ok(game.items[6].inventory[0].item[2].quantity === 0, game.items[6].inventory[0].item[2].quantity);
    assert.ok(game.items[6].inventory[0].item[3].quantity === 0, game.items[6].inventory[0].item[3].quantity);
    assert.ok(rightHand.equippedItem !== null && rightHand.equippedItem.name === "TOOL BOX", rightHand.equippedItem);
    assert.ok(
        rightHand.items[0].name === "TOOL BOX" &&
        rightHand.items[0].pluralName === "" &&
        rightHand.items[0].singleContainingPhrase === "a TOOL BOX" &&
        rightHand.items[0].pluralContainingPhrase === "" &&
        rightHand.items[0].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[0].containerName === "" &&
        rightHand.items[0].container === null &&
        rightHand.items[0].slot === "" &&
        rightHand.items[0].quantity === 1 &&
        isNaN(rightHand.items[0].uses) &&
        rightHand.items[0].weight === 22 &&
        rightHand.items[0].inventory.length > 0 &&
        rightHand.items[0].row === 22,
        rightHand.items[0]
    );
    assert.ok(
        rightHand.items[1].name === "SCREWDRIVER" &&
        rightHand.items[1].pluralName === "SCREWDRIVERS" &&
        rightHand.items[1].singleContainingPhrase === "a SCREWDRIVER" &&
        rightHand.items[1].pluralContainingPhrase === "SCREWDRIVERS" &&
        rightHand.items[1].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[1].containerName === "TOOL BOX/TOOL BOX" &&
        rightHand.items[1].container.name === "TOOL BOX" &&
        rightHand.items[1].slot === "TOOL BOX" &&
        rightHand.items[1].quantity === 3 &&
        isNaN(rightHand.items[1].uses) &&
        rightHand.items[1].weight === 1 &&
        rightHand.items[1].inventory.length === 0 &&
        rightHand.items[1].row === 28,
        rightHand.items[1]
    );
    assert.ok(
        rightHand.items[2].name === "HAMMER" &&
        rightHand.items[2].pluralName === "HAMMERS" &&
        rightHand.items[2].singleContainingPhrase === "a HAMMER" &&
        rightHand.items[2].pluralContainingPhrase === "HAMMERS" &&
        rightHand.items[2].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[2].containerName === "TOOL BOX/TOOL BOX" &&
        rightHand.items[2].container.name === "TOOL BOX" &&
        rightHand.items[2].slot === "TOOL BOX" &&
        rightHand.items[2].quantity === 3 &&
        isNaN(rightHand.items[2].uses) &&
        rightHand.items[2].weight === 2 &&
        rightHand.items[2].inventory.length === 0 &&
        rightHand.items[2].row === 29,
        rightHand.items[2]
    );
    assert.ok(
        rightHand.items[3].name === "WRENCH" &&
        rightHand.items[3].pluralName === "WRENCHES" &&
        rightHand.items[3].singleContainingPhrase === "a WRENCH" &&
        rightHand.items[3].pluralContainingPhrase === "WRENCHES" &&
        rightHand.items[3].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[3].containerName === "TOOL BOX/TOOL BOX" &&
        rightHand.items[3].container.name === "TOOL BOX" &&
        rightHand.items[3].slot === "TOOL BOX" &&
        rightHand.items[3].quantity === 2 &&
        isNaN(rightHand.items[3].uses) &&
        rightHand.items[3].weight === 2 &&
        rightHand.items[3].inventory.length === 0 &&
        rightHand.items[3].row === 30,
        rightHand.items[3]
    );
    assert.ok(
        rightHand.items[4].name === "SMALL BAG" &&
        rightHand.items[4].pluralName === "" &&
        rightHand.items[4].singleContainingPhrase === "a SMALL BAG" &&
        rightHand.items[4].pluralContainingPhrase === "" &&
        rightHand.items[4].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[4].containerName === "TOOL BOX/TOOL BOX" &&
        rightHand.items[4].container.name === "TOOL BOX" &&
        rightHand.items[4].slot === "TOOL BOX" &&
        rightHand.items[4].quantity === 1 &&
        isNaN(rightHand.items[4].uses) &&
        rightHand.items[4].weight === 4 &&
        rightHand.items[4].inventory.length > 0 &&
        rightHand.items[4].row === 31,
        rightHand.items[4]
    );
    assert.ok(
        rightHand.items[5].name === "WRENCH" &&
        rightHand.items[5].pluralName === "WRENCHES" &&
        rightHand.items[5].singleContainingPhrase === "a WRENCH" &&
        rightHand.items[5].pluralContainingPhrase === "WRENCHES" &&
        rightHand.items[5].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[5].containerName === "SMALL BAG 2/SMALL BAG" &&
        rightHand.items[5].container.name === "SMALL BAG" &&
        rightHand.items[5].slot === "SMALL BAG" &&
        rightHand.items[5].quantity === 1 &&
        isNaN(rightHand.items[5].uses) &&
        rightHand.items[5].weight === 2 &&
        rightHand.items[5].inventory.length === 0 &&
        rightHand.items[5].row === 32,
        rightHand.items[5]
    );
    assert.ok(
        rightHand.items[6].name === "SCREWDRIVER" &&
        rightHand.items[6].pluralName === "SCREWDRIVERS" &&
        rightHand.items[6].singleContainingPhrase === "a SCREWDRIVER" &&
        rightHand.items[6].pluralContainingPhrase === "SCREWDRIVERS" &&
        rightHand.items[6].equipmentSlot === "RIGHT HAND" &&
        rightHand.items[6].containerName === "SMALL BAG 2/SMALL BAG" &&
        rightHand.items[6].container.name === "SMALL BAG" &&
        rightHand.items[6].slot === "SMALL BAG" &&
        rightHand.items[6].quantity === 1 &&
        isNaN(rightHand.items[6].uses) &&
        rightHand.items[6].weight === 1 &&
        rightHand.items[6].inventory.length === 0 &&
        rightHand.items[6].row === 33,
        rightHand.items[6]
    );
    // Check that all the item references refer to the same item.
    rightHand.items[1].quantity++;
    assert.ok(rightHand.items[1].quantity === 4, rightHand.items[1].quantity);
    assert.ok(rightHand.equippedItem.inventory[0].item[0].quantity === 4, rightHand.equippedItem.inventory[0].item[0].quantity);
    assert.ok(rightHand.items[0].inventory[0].item[0].quantity === 4, rightHand.items[0].inventory[0].item[0].quantity);
    assert.ok(game.inventoryItems[26].quantity === 4, game.inventoryItems[26].quantity);
    rightHand.items[1].quantity--;
    rightHand.items[2].quantity++;
    assert.ok(rightHand.items[2].quantity === 4, rightHand.items[2].quantity);
    assert.ok(rightHand.equippedItem.inventory[0].item[1].quantity === 4, rightHand.equippedItem.inventory[0].item[1].quantity);
    assert.ok(rightHand.items[0].inventory[0].item[1].quantity === 4, rightHand.items[0].inventory[0].item[1].quantity);
    assert.ok(game.inventoryItems[27].quantity === 4, game.inventoryItems[27].quantity);
    rightHand.items[2].quantity--;
    rightHand.items[3].quantity++;
    assert.ok(rightHand.items[3].quantity === 3, rightHand.items[3].quantity);
    assert.ok(rightHand.equippedItem.inventory[0].item[2].quantity === 3, rightHand.equippedItem.inventory[0].item[2].quantity);
    assert.ok(rightHand.items[0].inventory[0].item[2].quantity === 3, rightHand.items[0].inventory[0].item[2].quantity);
    assert.ok(game.inventoryItems[28].quantity === 3, game.inventoryItems[28].quantity);
    rightHand.items[3].quantity--;
    rightHand.items[4].quantity++;
    assert.ok(rightHand.items[4].quantity === 2, rightHand.items[4].quantity);
    assert.ok(rightHand.equippedItem.inventory[0].item[3].quantity === 2, rightHand.equippedItem.inventory[0].item[3].quantity);
    assert.ok(rightHand.items[0].inventory[0].item[3].quantity === 2, rightHand.items[0].inventory[0].item[3].quantity);
    assert.ok(game.inventoryItems[29].quantity === 2, game.inventoryItems[29].quantity);
    rightHand.items[4].quantity--;
    rightHand.items[5].quantity++;
    assert.ok(rightHand.items[5].quantity === 2, rightHand.items[5].quantity);
    assert.ok(game.inventoryItems[30].quantity === 2, game.inventoryItems[30].quantity);
    assert.ok(game.inventoryItems[30].container.inventory[0].item[0].quantity === 2, game.inventoryItems[30].container.inventory[0].item[0].quantity);
    assert.ok(rightHand.equippedItem.inventory[0].item[3].inventory[0].item[0].quantity === 2, rightHand.equippedItem.inventory[0].item[3].inventory[0].item[0].quantity);
    assert.ok(rightHand.items[4].inventory[0].item[0].quantity === 2, rightHand.items[4].inventory[0].item[0].quantity);
    assert.ok(game.inventoryItems[29].inventory[0].item[0].quantity === 2, game.inventoryItems[29].inventory[0].item[0].quantity);
    assert.ok(game.inventoryItems[20].inventory[0].item[3].inventory[0].item[0].quantity === 2, game.inventoryItems[20].inventory[0].item[3].inventory[0].item[0].quantity);
    rightHand.items[5].quantity--;
    rightHand.items[6].quantity++;
    assert.ok(rightHand.items[6].quantity === 2, rightHand.items[6].quantity);
    assert.ok(game.inventoryItems[31].quantity === 2, game.inventoryItems[31].quantity);
    assert.ok(game.inventoryItems[31].container.inventory[0].item[1].quantity === 2, game.inventoryItems[31].container.inventory[0].item[1].quantity);
    assert.ok(rightHand.equippedItem.inventory[0].item[3].inventory[0].item[1].quantity === 2, rightHand.equippedItem.inventory[0].item[3].inventory[0].item[1].quantity);
    assert.ok(rightHand.items[4].inventory[0].item[1].quantity === 2, rightHand.items[4].inventory[0].item[1].quantity);
    assert.ok(game.inventoryItems[29].inventory[0].item[1].quantity === 2, game.inventoryItems[29].inventory[0].item[1].quantity);
    assert.ok(game.inventoryItems[20].inventory[0].item[3].inventory[0].item[1].quantity === 2, game.inventoryItems[20].inventory[0].item[3].inventory[0].item[1].quantity);
    rightHand.items[6].quantity--;

    // Test that all of the item row numbers were updated properly.
    for (let i = 0; i < game.items.length; i++)
        assert.ok(game.items[i].row === i + 2, game.items[i].row);

    // Test that all of the inventoryItem row numbers were updated properly.
    for (let i = 0; i < game.inventoryItems.length; i++)
        assert.ok(game.inventoryItems[i].row === i + 2, game.inventoryItems[i].row);

    // Test that all of the inventoryItems and Player inventory items have the same row numbers.
    for (let i = 0; i < vivian.inventory.length; i++) {
        for (let j = 0; j < vivian.inventory[i].items.length; j++) {
            const match = game.inventoryItems.find(item => item.player.id === vivian.id && (item.prefab === null && vivian.inventory[i].items[j].prefab === null || item.prefab !== null && vivian.inventory[i].items[j].prefab !== null && item.prefab.id === vivian.inventory[i].items[j].prefab.id) && item.equipmentSlot === vivian.inventory[i].items[j].equipmentSlot && item.containerName === vivian.inventory[i].items[j].containerName);
            assert.ok(match !== null && match !== undefined, vivian.inventory[i].items[j].row);
            assert.ok(vivian.inventory[i].items[j].row === match.row);
        }
    }
}

function test_push_queue_1() {
    return new Promise((resolve) => {
        queuer.pushQueue("1oZxppuByy64QTb9pOJ-G1m2PEoVCO-egL0gycKVDjFU", function (response) {
            var errors = [];

            const objectData = [
                ["FLOOR", "beach-house", "TRUE", "", "FALSE", "on", "<desc><s>The floor beneath you is smooth and wooden.</s> <s>There's a rug underneath the COUCHES and TABLE.</s> <s>You find <il></il> haphazardly placed on the floor.</s></desc>"],
                ["COUCHES", "beach-house", "TRUE", "", "FALSE", "in", "<desc><s>You inspect the couches.</s> <s>They are soft and comfortable, and each is lined with a few pillows.</s> <s>Looking underneath the cushions, you find <il><item>a GUN</item></il>.</s></desc>"],
                ["TABLE", "beach-house", "TRUE", "CHEST", "FALSE", "in", "<desc><s>You examine the table.</s> <if cond=\"game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === true\"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open, but it seems to be unlocked.</s> <var v=\" game.puzzles.find(puzzle => puzzle.name === 'CHEST').alreadySolvedDescription\" /></if><if cond=\"game.puzzles.find(puzzle => puzzle.name === 'CHEST').solved === false\"><s>Looking closely, you can see that it's not a table at all, but a chest!</s> <s>It looks like it requires an old key to open.</s></if></desc>"],
                ["CLOSET", "beach-house", "TRUE", "", "TRUE", "in", "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il><item>a SLINGSHOT</item></il>.</s></desc>"],
                ["CLOTHES", "beach-house", "TRUE", "", "FALSE", "", "<desc><s>Examining the clothes, you find a variety of different garments.</s> <s>Sundresses, T-shirts, shorts, skirts - this closet seems to have everything you could think of.</s></desc>"],
                ["HOT TUB", "beach-house", "TRUE", "", "FALSE", "in", "<desc><s>You inspect the hot tub.</s> <s>It looks to be fairly spacious, with room for probably up to 3 people to use at once.</s> <s>It has a digital thermometer to increase the temperature up to 100 degrees Fahrenheit, and buttons to turn it on.</s> <s>In the middle, you find <il></il>.</s></desc>"]
            ];
            sheets.getData("Objects!A1:G", function (response) {
                const sheet = response.data.values;
                for (let i = 1; i < sheet.length && i < objectData.length; i++) {
                    if (!arraysEqual(objectData[i - 1], sheet[i]))
                        errors.push(`Objects Row ${i + 1}: ` + sheet[i].join(','));

                    assert.ok(errors.length === 0, errors.join('\n'));
                }
            });

            const itemData = [
                ["HAMMER", "beach-house", "TRUE", "", "1", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["GUN", "beach-house", "TRUE", "Object: COUCHES", "1", "", "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>"],
                ["PEPSI", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>"],
                ["ROPE", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>"],
                ["KNIFE", "beach-house", "TRUE", "Puzzle: CHEST", "1", "", "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>"],
                ["SLINGSHOT", "beach-house", "TRUE", "Object: CLOSET", "1", "", "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>"],
                ["TOOL BOX", "beach-house", "TRUE", "Object: CLOSET", "0", "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SMALL BAG</item>, <item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>"],
                ["SCREWDRIVER", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["HAMMER", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["WRENCH", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["SMALL BAG 2", "beach-house", "TRUE", "Item: TOOL BOX/TOOL BOX", "0", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"],
                ["SCREWDRIVER", "beach-house", "TRUE", "Object: FLOOR", "0", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["SMALL BAG 2", "beach-house", "TRUE", "Object: FLOOR", "0", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"],
                ["WRENCH", "beach-house", "TRUE", "Item: SMALL BAG 2/SMALL BAG", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["SCREWDRIVER", "beach-house", "TRUE", "Item: SMALL BAG 2/SMALL BAG", "0", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"]
            ];
            sheets.getData("Items!A1:G", function (response) {
                const sheet = response.data.values;
                for (let i = 1; i < sheet.length && i < itemData.length; i++) {
                    if (!arraysEqual(itemData[i - 1], sheet[i]))
                        errors.push(`Items Row ${i + 1}: ` + sheet[i].join(','));

                    assert.ok(errors.length === 0, errors.join('\n'));
                }
            });

            const inventoryData = [
                ["Nero", "NULL", "HAT"],
                ["Nero", "NEROS GLASSES", "GLASSES", "", "1", "", "<desc><s>It's a pair of glasses with a black frame only on the top of the lenses and the bridge.</s> <s>The lenses themselves are rounded at the bottom.</s></desc>"],
                ["Nero", "NULL", "FACE"],
                ["Nero", "NULL", "NECK"],
                ["Nero", "NULL", "BAG"],
                ["Nero", "NEROS SHIRT", "SHIRT", "", "1", "", "<desc><s>It's a long-sleeved, white dress shirt with a slight purple tinge.</s> <s>The collar is rather large.</s> <s>The buttons are on the right side of the shirt, from the wearer's perspective.</s></desc>"],
                ["Nero", "NEROS BLAZER", "JACKET", "", "1", "", "<desc><s>It's a long-sleeved, purple blazer with two gold buttons on the right side, from the wearer's perspective.</s> <s>The lapels have white borders.</s> <s>It has three pockets: a breast pocket on the left side, and two pockets lower down on the left and right.</s> <s>In the breast pocket, you find <il name=\"BREAST POCKET\"></il>.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
                ["Nero", "NULL", "RIGHT HAND"],
                ["Nero", "NULL", "LEFT HAND"],
                ["Nero", "NEROS PANTS", "PANTS", "", "1", "", "<desc><s>It's a pair of long, purple pants with a checker pattern.</s> <s>There are four pockets altogether.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s> <s>In the left back pocket, you find <il name=\"LEFT BACK POCKET\"></il>.</s> <s>In the right back pocket, you find <il name=\"RIGHT BACK POCKET\"></il>.</s></desc>"],
                ["Nero", "NEROS UNDERWEAR", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of black, plaid boxers.</s></desc>"],
                ["Nero", "NEROS SOCKS", "SOCKS", "", "1", "", "<desc><s>It's a pair of plain, black ankle socks.</s></desc>"],
                ["Nero", "NEROS SHOES", "SHOES", "", "1", "", "<desc><s>It's a large pair of black tennis shoes with white laces and soles.</s></desc>"],
                ["Vivian", "NULL", "HAT"],
                ["Vivian", "VIVIANS GLASSES", "GLASSES", "", "1", "", "<desc><s>It's a pair of black glasses with squarish frames.</s></desc>"],
                ["Vivian", "NULL", "FACE"],
                ["Vivian", "NULL", "NECK"],
                ["Vivian", "NULL", "BAG"],
                ["Vivian", "VIVIANS SHIRT", "SHIRT", "", "1", "", "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>"],
                ["Vivian", "VIVIANS SWEATER", "JACKET", "", "1", "", "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>"],
                ["Vivian", "TOOL BOX", "RIGHT HAND", "", "1", "", "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SMALL BAG</item>, <item>3 SCREWDRIVERS</item>, <item>3 HAMMERS</item>, and <item>2 WRENCHES</item></il>.</s></desc>"],
                ["Vivian", "NULL", "LEFT HAND"],
                ["Vivian", "VIVIANS SKIRT", "PANTS", "", "1", "", "<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name=\"LEFT POCKET\"></il>.</s> <s>In the right pocket, you find <il name=\"RIGHT POCKET\"></il>.</s></desc>"],
                ["Vivian", "VIVIANS UNDERWEAR", "UNDERWEAR", "", "1", "", "<desc><s>It's a pair of plain, pink panties.</s></desc>"],
                ["Vivian", "VIVIANS SOCKS", "SOCKS", "", "1", "", "<desc><s>It's a pair of black thigh high socks.</s></desc>"],
                ["Vivian", "VIVIANS SHOES", "SHOES", "", "1", "", "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>"],
                ["Vivian", "SCREWDRIVER", "RIGHT HAND", "TOOL BOX/TOOL BOX", "3", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["Vivian", "HAMMER", "RIGHT HAND", "TOOL BOX/TOOL BOX", "3", "", "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>"],
                ["Vivian", "WRENCH", "RIGHT HAND", "TOOL BOX/TOOL BOX", "2", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["Vivian", "SMALL BAG 2", "RIGHT HAND", "TOOL BOX/TOOL BOX", "1", "", "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a SCREWDRIVER</item> and <item>a WRENCH</item></il>.</s></desc>"],
                ["Vivian", "WRENCH", "RIGHT HAND", "SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["Vivian", "SCREWDRIVER", "RIGHT HAND", "SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["Vivian", "WRENCH", "RIGHT HAND", "SMALL BAG 2/SMALL BAG", "0", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"],
                ["Vivian", "SCREWDRIVER", "RIGHT HAND", "SMALL BAG 2/SMALL BAG", "0", "", "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>"],
                ["Vivian", "WRENCH", "LEFT HAND", "SMALL BAG 2/SMALL BAG", "1", "", "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>"]
            ];
            sheets.getData("Inventory Items!A1:G", function (response) {
                const sheet = response.data.values;
                for (let i = 1; i < sheet.length && i < inventoryData.length; i++) {
                    if (!arraysEqual(inventoryData[i - 1], sheet[i]))
                        errors.push(`Inventory Items Row ${i + 1}: ` + sheet[i].join(','));

                    assert.ok(errors.length === 0, errors.join('\n'));
                }
            });

            resolve();
        });
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
