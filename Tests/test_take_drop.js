const settings = include('settings.json');
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
    init();
    return;
};

function init() {
    // Clear all game data.
    game.rooms.length = 0;
    game.objects.length = 0;
    game.prefabs.length = 0;
    game.items.length = 0;
    game.puzzles.length = 0;
    game.whispers.length = 0;
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
    var objectCloset = new Object("CLOSET", roomBeachHouse, true, "", true, "in", "<desc><s>You open the closet and look inside.</s> <s>It's fairly large; someone could definitely fit in here.</s> <s>You find a variety of CLOTHES hanging from the rod.</s> <s>On the floor, you find <il><item>a SLINGSHOT</item> and <item>a TOOL BOX</item></il>.</s></desc>", 5);
    var objectClothes = new Object("CLOTHES", roomBeachHouse, true, "", false, "", "<desc><s>Examining the clothes, you find a variety of different garments.</s> <s>Sundresses, T-shirts, shorts, skirts - this closet seems to have everything you could think of.</s></desc>", 6);
    var objectHotTub = new Object("HOT TUB", roomBeachHouse, true, "", false, "", "<desc><s>You inspect the hot tub.</s> <s>It looks to be fairly spacious, with room for probably up to 3 people to use at once.</s> <s>It has a digital thermometer to increase the temperature up to 100 degrees Fahrenheit, and buttons to turn it on.</s> <s>In the middle, you find <il></il>.</s></desc>", 7);
    game.objects.push(objectFloor);
    game.objects.push(objectCouches);
    game.objects.push(objectTable);
    game.objects.push(objectCloset);
    game.objects.push(objectClothes);
    game.objects.push(objectHotTub);

    // Initialize puzzles.
    var puzzleChest = new Puzzle("CHEST", true, false, roomBeachHouse, "TABLE", "key lock", true, null, "", NaN, ["set accessible puzzle items chest beach-house"], ["set inaccessible puzzle items chest beach-house"], `<desc><s>You insert the key into the lock and turn it.</s> <s>It unlocks.</s> <var v="this.alreadySolvedDescription" /></desc>`, "<desc><s>You open the chest.</s> <s>Inside, you find <il><item>a bottle of PEPSI</item>, <item>a ROPE</item>, and <item>a KNIFE</item></il>.</s></desc>", "", "", "<desc><s>You can't seem to get the chest open. If only you had the key for it...</s></desc>", 2);
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
    var itemRoomHammer = new Item(prefabHammer, roomBeachHouse, true, "", 1, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 2);
    var itemGun = new Item(prefabGun, roomBeachHouse, true, "Object: COUCHES", 1, NaN, "<desc><s>You examine the gun.</s> <s>It appears to be just a simple handgun.</s> <s>It seems there are no bullets inside, but you could still dry fire if you wanted to make a loud noise.</s> <s>Perhaps you'll find bullets somewhere else?</s></desc>", 3);
    var itemPepsi = new Item(prefabPepsi, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the bottle.</s> <s>It's a simple glass bottle containing Pepsi.</s> <s>It looks to be fairly old.</s> <s>It might not be very good, but maybe you can do something with the bottle.</s></desc>", 4);
    var itemRope = new Item(prefabRope, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the rope.</s> <s>It looks fairly strong, and it's very long.</s> <s>You could use it for so many things.</s></desc>", 5);
    var itemKnife = new Item(prefabKnife, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the knife.</s> <s>It appears to be a very sharp kitchen knife.</s> <s>It's small enough that you could hide it, but large enough that you could do some real damage with it.</s></desc>", 6);
    var itemChestHammer = new Item(prefabHammer, roomBeachHouse, true, "Puzzle: CHEST", 1, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 7);
    var itemSlingshot = new Item(prefabSlingshot, roomBeachHouse, true, "Object: CLOSET", 1, NaN, "<desc><s>You examine the slingshot.</s> <s>It's relatively small.</s> <s>You could probably shoot just about any small, round object with this thing.</s> <s>With good aim, there's no telling what you could do.</s></desc>", 8);
    var itemToolBox = new Item(prefabToolBox, roomBeachHouse, true, "Object: CLOSET", 1, NaN, "<desc><s>You open the tool box and look inside.</s> <s>Various tools are inside: <il><item>a SKIRT</item>, <item>4 SCREWDRIVERS</item>, <item>2 HAMMERS</item>, and <item>4 WRENCHES</item></il>.</s></desc>", 9);
    var itemScrewdriver = new Item(prefabScrewdriver, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 4, NaN, "<desc><s>You examine the screwdriver.</s> <s>It looks to be a fairly standard Phillips screwdriver that you could use on most screws.</s></desc>", 10);
    var itemToolBoxHammer = new Item(prefabHammer, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 2, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 11);
    var itemWrench = new Item(prefabWrench, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 4, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 12);
    var itemViviansSkirt = new Item(prefabViviansSkirt, roomBeachHouse, true, "Item: TOOL BOX/TOOL BOX", 1, NaN, `<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name="LEFT POCKET"><item>a HAMMER</item></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"><item>a HAMMER</item></il>.</s></desc>`, 13);
    var itemSkirtLeftHammer = new Item(prefabHammer, roomBeachHouse, true, "Item: VIVIANS SKIRT/LEFT POCKET", 1, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 14);
    var itemSkirtRightHammer = new Item(prefabHammer, roomBeachHouse, true, "Item: VIVIANS SKIRT/RIGHT POCKET", 1, NaN, "<desc><s>You examine the hammer.</s> <s>It looks to be a fairly standard hammer for pounding in nails.</s></desc>", 15);

    game.items.push(itemRoomHammer);
    game.items.push(itemGun);
    game.items.push(itemPepsi);
    game.items.push(itemRope);
    game.items.push(itemKnife);
    game.items.push(itemChestHammer);
    game.items.push(itemSlingshot);
    game.items.push(itemToolBox);
    game.items.push(itemScrewdriver);
    game.items.push(itemToolBoxHammer);
    game.items.push(itemWrench);
    game.items.push(itemViviansSkirt);
    game.items.push(itemSkirtLeftHammer);
    game.items.push(itemSkirtRightHammer);

    // Set item containers.
    itemGun.container = objectCouches;
    itemPepsi.container = puzzleChest;
    itemRope.container = puzzleChest;
    itemKnife.container = puzzleChest;
    itemChestHammer.container = puzzleChest;
    itemSlingshot.container = objectCloset;
    itemToolBox.container = objectCloset;
    itemScrewdriver.container = itemToolBox; itemScrewdriver.slot = "TOOL BOX";
    itemToolBoxHammer.container = itemToolBox; itemToolBoxHammer.slot = "TOOL BOX";
    itemWrench.container = itemToolBox; itemWrench.slot = "TOOL BOX";
    itemViviansSkirt.container = itemToolBox; itemViviansSkirt.slot = "TOOL BOX";
    itemSkirtLeftHammer.container = itemViviansSkirt; itemSkirtLeftHammer.slot = "LEFT POCKET";
    itemSkirtRightHammer.container = itemViviansSkirt; itemSkirtRightHammer.slot = "RIGHT POCKET";

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
    var inventoryViviansSatchel = new InventoryItem(vivian, prefabViviansSatchel, "BAG", "", 1, NaN, "<desc><s>It's a beige satchel with a long strap to go over the shoulder.</s> <s>Inside, you find <il><item>a LAPTOP</item> and <item>a SMALL BAG</item></il>.</s></desc>", 19);
    var inventoryViviansShirt = new InventoryItem(vivian, prefabViviansShirt, "SHIRT", "", 1, NaN, "<desc><s>It's a short-sleeved, white dress shirt.</s> <s>The buttons are on the left side of the shirt, from the wearer's perspective.</s></desc>", 20);
    var inventoryViviansSweater = new InventoryItem(vivian, prefabViviansSweater, "JACKET", "", 1, NaN, "<desc><s>It's a salmon-colored pullover sweater.</s> <s>It looks quite warm.</s></desc>", 21);
    var inventoryViviansRightHand = new InventoryItem(vivian, null, "RIGHT HAND", "", null, null, "", 22);
    var inventoryViviansLeftHand = new InventoryItem(vivian, null, "LEFT HAND", "", null, null, "", 23);
    var inventoryViviansSkirt = new InventoryItem(vivian, prefabViviansSkirt, "PANTS", "", 1, NaN, `<desc><s>It's a plaid, blue, double-layered, ruffled skirt.</s> <s>Surprisingly, it has two pockets.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s></desc>`, 24);
    var inventoryViviansUnderwear = new InventoryItem(vivian, prefabViviansUnderwear, "UNDERWEAR", "", 1, NaN, "<desc><s>It's a pair of plain, pink panties.</s></desc>", 25);
    var inventoryViviansSocks = new InventoryItem(vivian, prefabViviansSocks, "SOCKS", "", 1, NaN, "<desc><s>It's a pair of black thigh high socks.</s></desc>", 26);
    var inventoryViviansShoes = new InventoryItem(vivian, prefabViviansShoes, "SHOES", "", 1, NaN, "<desc><s>It's a small pair of white tennis shoes with pink laces and soles.</s></desc>", 27);
    var inventoryViviansLaptop = new InventoryItem(vivian, prefabViviansLaptop, "BAG", "VIVIANS SATCHEL/SATCHEL", 1, NaN, `<desc><if cond="player.name === 'Vivian'"><s>This is your laptop.</s> <s>You take it with you everywhere you go.</s></if><if cond="player.name !== 'Vivian'"><s>This is a very expensive-looking laptop.</s> <s>The keyboard lights up when a key is pressed.</s> <s>The login screen is asking for a password for Vivian's account.</s></if></desc>`, 28);
    var inventoryViviansSmallBag = new InventoryItem(vivian, prefabSmallBag, "BAG", "VIVIANS SATCHEL/SATCHEL", 1, NaN, "<desc><s>It's a small bag.</s> <s>Inside, you find <il><item>a WRENCH</item></il>.</s></desc>", 29);
    var inventoryViviansWrench = new InventoryItem(vivian, prefabWrench, "BAG", "SMALL BAG/SMALL BAG", 1, NaN, "<desc><s>You examine the wrench.</s> <s>It looks to be a fairly standard wrench for turning nuts and bolts.</s></desc>", 30);
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
    game.inventoryItems.push(inventoryViviansSatchel);
    game.inventoryItems.push(inventoryViviansShirt);
    game.inventoryItems.push(inventoryViviansSweater);
    game.inventoryItems.push(inventoryViviansRightHand);
    game.inventoryItems.push(inventoryViviansLeftHand);
    game.inventoryItems.push(inventoryViviansSkirt);
    game.inventoryItems.push(inventoryViviansUnderwear);
    game.inventoryItems.push(inventoryViviansSocks);
    game.inventoryItems.push(inventoryViviansShoes);
    game.inventoryItems.push(inventoryViviansLaptop);
    game.inventoryItems.push(inventoryViviansSmallBag);
    game.inventoryItems.push(inventoryViviansWrench);

    // Set inventory item containers.
    inventoryViviansLaptop.container = inventoryViviansSatchel; inventoryViviansLaptop.slot = "SATCHEL";
    inventoryViviansSmallBag.container = inventoryViviansSatchel; inventoryViviansSmallBag.slot = "SATCHEL";
    inventoryViviansWrench.container = inventoryViviansSmallBag; inventoryViviansWrench.slot = "SMALL BAG";

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
    vivian.inventory[4].items.push(inventoryViviansSatchel);
    vivian.inventory[4].equippedItem = inventoryViviansSatchel;
    vivian.inventory[4].items.push(inventoryViviansLaptop);
    vivian.inventory[4].items.push(inventoryViviansSmallBag);
    vivian.inventory[4].items.push(inventoryViviansWrench);
    vivian.inventory[5].items.push(inventoryViviansShirt);
    vivian.inventory[5].equippedItem = inventoryViviansShirt;
    vivian.inventory[6].items.push(inventoryViviansSweater);
    vivian.inventory[6].equippedItem = inventoryViviansSweater;
    vivian.inventory[7].items.push(inventoryViviansRightHand);
    vivian.inventory[8].items.push(inventoryViviansLeftHand);
    vivian.inventory[9].items.push(inventoryViviansSkirt);
    vivian.inventory[9].equippedItem = inventoryViviansSkirt;
    vivian.inventory[10].items.push(inventoryViviansUnderwear);
    vivian.inventory[10].equippedItem = inventoryViviansUnderwear;
    vivian.inventory[11].items.push(inventoryViviansSocks);
    vivian.inventory[11].equippedItem = inventoryViviansSocks;
    vivian.inventory[12].items.push(inventoryViviansShoes);
    vivian.inventory[12].equippedItem = inventoryViviansShoes;

    // Insert inventory items.
    inventoryViviansSatchel.insertItem(inventoryViviansLaptop, inventoryViviansLaptop.slot);
    inventoryViviansSatchel.insertItem(inventoryViviansSmallBag, inventoryViviansSmallBag.slot);
    inventoryViviansSmallBag.insertItem(inventoryViviansWrench, inventoryViviansWrench.slot);
}