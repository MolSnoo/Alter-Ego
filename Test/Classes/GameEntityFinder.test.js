import Room from "../../Data/Room.js";
import RoomItem from "../../Data/RoomItem.js";
import Fixture from "../../Data/Fixture.js";
import Prefab from "../../Data/Prefab.js";
import Puzzle from "../../Data/Puzzle.js";
import Event from "../../Data/Event.js";
import Status from "../../Data/Status.js";
import Player from "../../Data/Player.js";
import InventoryItem from "../../Data/InventoryItem.js";
import Gesture from "../../Data/Gesture.js";
import Flag from "../../Data/Flag.js";
import Exit from "../../Data/Exit.js";
import EquipmentSlot from "../../Data/EquipmentSlot.js";

describe("GameEntityFinder test", () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    beforeEach(() => {
    });

    describe("getRoom test", () => {
        test("Get valid room", () => {
            let room = game.entityFinder.getRoom("lobby");
            expect(room).toBeInstanceOf(Room);
            expect(room.id).toBe("lobby");
        });
        test("Get valid room with non-exact id", () => {
            let room = game.entityFinder.getRoom("Floor 1 Hall 3");
            expect(room).toBeInstanceOf(Room);
            expect(room.id).toBe("floor-1-hall-3");
        });
        test("Get valid room with whitespace", () => {
            let room = game.entityFinder.getRoom(" lobby ");
            expect(room).toBeInstanceOf(Room);
            expect(room.id).toBe("lobby");
        });
        test("Get valid room with mixed case", () => {
            let room = game.entityFinder.getRoom("LoBby");
            expect(room).toBeInstanceOf(Room);
            expect(room.id).toBe("lobby");
        });
        test("Get invalid room", () => {
            let room = game.entityFinder.getRoom("INVALID");
            expect(room).toBeUndefined();
        });
        test("Get empty room", () => {
            let room = game.entityFinder.getRoom("");
            expect(room).toBeUndefined();
        });
    });

    describe("getExit test", () => {
        test("Get valid exit", () => {
            let room = game.entityFinder.getRoom("lobby");
            let exit = game.entityFinder.getExit(room, "REVOLVING DOOR 1");
            expect(exit).toBeInstanceOf(Exit);
            expect(exit.name).toBe("REVOLVING DOOR 1");
        });
        test("Get valid exit with non-exact id", () => {
            let room = game.entityFinder.getRoom("trial-grounds");
            let exit = game.entityFinder.getExit(room, "WINNER'S HALL");
            expect(exit).toBeInstanceOf(Exit);
            expect(exit.name).toBe("WINNERS HALL");
        });
        test("Get valid exit with whitespace", () => {
            let room = game.entityFinder.getRoom("punishment-room");
            let exit = game.entityFinder.getExit(room, " DOOR ");
            expect(exit).toBeInstanceOf(Exit);
            expect(exit.name).toBe("DOOR");
        });
        test("Get valid exit with mixed case", () => {
            let room = game.entityFinder.getRoom("winners-hall");
            let exit = game.entityFinder.getExit(room, "eLeVaToR");
            expect(exit).toBeInstanceOf(Exit);
            expect(exit.name).toBe("ELEVATOR");
        });
        test("Get invalid exit", () => {
            let room = game.entityFinder.getRoom("lobby");
            let exit = game.entityFinder.getExit(room, "INVALID");
            expect(exit).toBeUndefined();
        });
        test("Get empty exit", () => {
            let room = game.entityFinder.getRoom("lobby");
            let exit = game.entityFinder.getExit(room, "");
            expect(exit).toBeUndefined();
        });
    });

    describe("getFixture test", () => {
        test("Get valid fixture", () => {
            let fixture = game.entityFinder.getFixture("RECEPTION DESK", "lobby");
            expect(fixture).toBeInstanceOf(Fixture);
            expect(fixture.name).toBe("RECEPTION DESK");
            expect(fixture.location.id).toBe("lobby");
        });
        test("Get valid fixture with whitespace", () => {
            let fixture = game.entityFinder.getFixture(" RECEPTION DESK ", "lobby");
            expect(fixture).toBeInstanceOf(Fixture);
            expect(fixture.name).toBe("RECEPTION DESK");
        });
        test("Get valid fixture with mixed case", () => {
            let fixture = game.entityFinder.getFixture("ReCePtIoN DeSk", "lobby");
            expect(fixture).toBeInstanceOf(Fixture);
            expect(fixture.name).toBe("RECEPTION DESK");
        });
        test("Get valid fixture without location", () => {
            let fixture = game.entityFinder.getFixture("RECEPTION DESK");
            expect(fixture).toBeInstanceOf(Fixture);
            expect(fixture.name).toBe("RECEPTION DESK");
        });
        test("Get invalid fixture", () => {
            let fixture = game.entityFinder.getFixture("INVALID", "lobby");
            expect(fixture).toBeUndefined();
        });
        test("Get invalid fixture without location", () => {
            let fixture = game.entityFinder.getFixture("INVALID");
            expect(fixture).toBeUndefined();
        });
        test("Get empty fixture", () => {
            let fixture = game.entityFinder.getFixture("", "lobby");
            expect(fixture).toBeUndefined();
        });
        test("Get fixture with invalid location", () => {
            let fixture = game.entityFinder.getFixture("RECEPTION DESK", "INVALID");
            expect(fixture).toBeUndefined();
        });
        test("Get fixture with empty location", () => {
            let fixture = game.entityFinder.getFixture("RECEPTION DESK", "");
            expect(fixture).toBeInstanceOf(Fixture);
            expect(fixture.name).toBe("RECEPTION DESK");
        });
    });

    describe("getPrefab test", () => {
        test("Get valid prefab", () => {
            let prefab = game.entityFinder.getPrefab("PEN");
            expect(prefab).toBeInstanceOf(Prefab);
            expect(prefab.id).toBe("PEN");
        });
        test("Get invalid prefab", () => {
            let prefab = game.entityFinder.getPrefab("INVALID");
            expect(prefab).toBeUndefined();
        });
        test("Get empty prefab", () => {
            let prefab = game.entityFinder.getPrefab("");
            expect(prefab).toBeUndefined();
        });
    });

    describe("getRoomItem test", () => {
        test("Get valid item", () => {
            let foundItem1 = game.entityFinder.getRoomItem("PEN", "lobby", "RECEPTION DESK");
            expect(foundItem1).toBeInstanceOf(RoomItem);
            expect(foundItem1.prefab.id).toBe("PEN");
            expect(foundItem1.identifier).toBe("");
            expect(foundItem1.location.id).toBe("lobby");
            expect(foundItem1.containerName).toBe("RECEPTION DESK");
            let foundItem2 = game.entityFinder.getRoomItem("ANZUS BREECHES", "suite-12", "CLOSET");
            expect(foundItem2).toBeInstanceOf(RoomItem);
            expect(foundItem2.prefab.id).toBe("ANZUS BREECHES");
            expect(foundItem2.identifier).toBe("ANZUS BREECHES 2");
            expect(foundItem2.location.id).toBe("suite-12");
            expect(foundItem2.containerName).toBe("CLOSET");
            let foundItem3 = game.entityFinder.getRoomItem("ANZUS BREECHES");
            expect(foundItem3).toBeInstanceOf(RoomItem);
            expect(foundItem3.prefab.id).toBe("ANZUS BREECHES");
            expect(foundItem3.identifier).toBe("ANZUS BREECHES 2");
            expect(foundItem3.location.id).toBe("suite-12");
            expect(foundItem3.containerName).toBe("CLOSET");
            let foundItem4 = game.entityFinder.getRoomItem("COLD SERVING OF WAFFLES", "kitchen");
            expect(foundItem4).toBeInstanceOf(RoomItem);
            expect(foundItem4.prefab.id).toBe("COLD SERVING OF WAFFLES");
            expect(foundItem4.identifier).toBe("");
            expect(foundItem4.location.id).toBe("kitchen");
            expect(foundItem4.containerName).toBe("BOX OF WAFFLES 1/BOX");
        });
        test("Get invalid item", () => {
            let foundItem1 = game.entityFinder.getRoomItem("INVALID", "lobby");
            expect(foundItem1).toBeUndefined();
            let foundItem2 = game.entityFinder.getRoomItem("INVALID");
            expect(foundItem2).toBeUndefined();
            let foundItem3 = game.entityFinder.getRoomItem("INVALID", "lobby", "RECEPTION DESK");
            expect(foundItem3).toBeUndefined();
            let foundItem4 = game.entityFinder.getRoomItem("COLD SERVING OF MEATBALLS", "narnia");
            expect(foundItem4).toBeUndefined();
            let foundItem5 = game.entityFinder.getRoomItem("COLD SERVING OF MEATBALLS", "narnia", "BAG OF MEATBALLS 1/BAG");
            expect(foundItem5).toBeUndefined();
        });
        test("Get empty item", () => {
            let foundItem1 = game.entityFinder.getRoomItem("");
            expect(foundItem1).toBeUndefined();
        });
        test("Get item with empty params", () => {
            let foundItem1 = game.entityFinder.getRoomItem("", "", "");
            expect(foundItem1).toBeUndefined();
        });
        test("Get item with valid identifier but empty params", () => {
            let foundItem1 = game.entityFinder.getRoomItem("COLD SERVING OF MEATBALLS", "");
            expect(foundItem1).toBeInstanceOf(RoomItem);
            expect(foundItem1.prefab.id).toBe("COLD SERVING OF MEATBALLS");
            let foundItem2 = game.entityFinder.getRoomItem("COLD SERVING OF MEATBALLS", "", "");
            expect(foundItem2).toBeInstanceOf(RoomItem);
            expect(foundItem2.prefab.id).toBe("COLD SERVING OF MEATBALLS");
        });
        test("Try overflowing invalid item", () => {
            let testString = "";
            for (let i = 0; i < 60000; i++) {
                testString = testString + "a";
            }
            let foundItem1 = game.entityFinder.getRoomItem(testString);
            expect(foundItem1).toBeUndefined();
        });
    });

    describe("getPuzzle test", () => {
        test("Get unique valid puzzle by name", () => {
            let puzzle = game.entityFinder.getPuzzle("SCALE");
            expect(puzzle).toBeInstanceOf(Puzzle);
            expect(puzzle.name).toBe("SCALE");
            expect(puzzle.location.id).toBe("fitness-room");
            expect(puzzle.type).toBe("weight");
            expect(puzzle.accessible).toBe(false);
        });
        test("Get non-unique valid puzzle by name", () => {
            // Should get first matching puzzle in sheet
            let puzzle = game.entityFinder.getPuzzle("CALL BUTTON");
            expect(puzzle).toBeInstanceOf(Puzzle);
            expect(puzzle.name).toBe("CALL BUTTON");
            expect(puzzle.location.id).toBe("floor-1-hall-1");
            expect(puzzle.type).toBe("interact");
            expect(puzzle.accessible).toBe(true);
        });
        test("Get valid puzzle by name and location", () => {
            let puzzle = game.entityFinder.getPuzzle("CALL BUTTON", "floor-2-hall-1");
            expect(puzzle).toBeInstanceOf(Puzzle);
            expect(puzzle.name).toBe("CALL BUTTON");
            expect(puzzle.location.id).toBe("floor-2-hall-1");
        });
        test("Get valid non-unique puzzle by name and solved status", () => {
            let puzzle = game.entityFinder.getPuzzle("VENT", undefined, undefined, false);
            expect(puzzle).toBeInstanceOf(Puzzle);
            expect(puzzle.name).toBe("VENT");
            expect(puzzle.location.id).toBe("suite-2");
        });
        test("Get valid puzzle by name, location, and type", () => {
            let puzzle = game.entityFinder.getPuzzle("CALL BUTTON", "floor-2-hall-1", "interact");
            expect(puzzle).toBeInstanceOf(Puzzle);
            expect(puzzle.name).toBe("CALL BUTTON");
            expect(puzzle.location.id).toBe("floor-2-hall-1");
            expect(puzzle.type).toBe("interact");
            expect(puzzle.accessible).toBe(true);
        });
        test("Get valid puzzle by name, location, type, and solved status", () => {
            let puzzle = game.entityFinder.getPuzzle("VENT", "suite-2", "interact", false);
            expect(puzzle).toBeInstanceOf(Puzzle);
            expect(puzzle.name).toBe("VENT");
            expect(puzzle.location.id).toBe("suite-2");
            expect(puzzle.type).toBe("interact");
            expect(puzzle.accessible).toBe(false);
        });
        test("Get invalid puzzle by name", () => {
            let puzzle = game.entityFinder.getPuzzle("INVALID");
            expect(puzzle).toBeUndefined();
        });
        test("Get invalid puzzle by name and location", () => {
            let puzzle = game.entityFinder.getPuzzle("INVALID", "floor-2-hall-1");
            expect(puzzle).toBeUndefined();
        });
        test("Get puzzle by name and invalid location", () => {
            let puzzle = game.entityFinder.getPuzzle("CALL BUTTON", "INVALID");
            expect(puzzle).toBeUndefined();
        });
        test("Get puzzle by empty name", () => {
            let puzzle = game.entityFinder.getPuzzle("");
            expect(puzzle).toBeUndefined();
        });
        test("Get puzzle by empty name and location", () => {
            let puzzle = game.entityFinder.getPuzzle("", "");
            expect(puzzle).toBeUndefined();
        });
    });

    describe("getEvent test", () => {
        test("Get valid event by id", () => {
            let event = game.entityFinder.getEvent("SNOW");
            expect(event).toBeInstanceOf(Event);
            expect(event.id).toBe("SNOW");
        });
        test("Get invalid event by id", () => {
            let event = game.entityFinder.getEvent("INVALID");
            expect(event).toBeUndefined();
        });
        test("Get empty event by id", () => {
            let event = game.entityFinder.getEvent("");
            expect(event).toBeUndefined();
        });
    });

    describe("getStatusEffect test", () => {
        test("Get valid status effect by id", () => {
            let statusEffect = game.entityFinder.getStatusEffect("unconscious");
            expect(statusEffect).toBeInstanceOf(Status);
            expect(statusEffect.id).toBe("unconscious");
        });
        test("Get invalid status effect by id", () => {
            let statusEffect = game.entityFinder.getStatusEffect("INVALID");
            expect(statusEffect).toBeUndefined();
        });
        test("Get empty status effect by id", () => {
            let statusEffect = game.entityFinder.getStatusEffect("");
            expect(statusEffect).toBeUndefined();
        });
    });

    describe("getPlayer test", () => {
        test("Get valid player by name", () => {
            let player = game.entityFinder.getPlayer("Amadeus");
            expect(player).toBeInstanceOf(Player);
            expect(player.name).toBe("Amadeus");
        });
        test("Get valid player with special characters by name", () => {
            let player = game.entityFinder.getPlayer("???");
            expect(player).toBeInstanceOf(Player);
            expect(player.name).toBe("???");
        })
        test("Get invalid player by name", () => {
            let player = game.entityFinder.getPlayer("INVALID");
            expect(player).toBeUndefined();
        });
        test("Get empty player by name", () => {
            let player = game.entityFinder.getPlayer("");
            expect(player).toBeUndefined();
        });
    });

    describe("getLivingPlayer test", () => {
        test("Get valid living player by name", () => {
            let player = game.entityFinder.getLivingPlayer("Amadeus");
            expect(player).toBeInstanceOf(Player);
            expect(player.name).toBe("Amadeus");
            expect(player.alive).toBe(true);
        });
        test("Get dead player by name", () => {
            let player = game.entityFinder.getLivingPlayer("Evad");
            expect(player).toBeUndefined();
        });
        test("Get invalid player by name", () => {
            let player = game.entityFinder.getLivingPlayer("INVALID");
            expect(player).toBeUndefined();
        });
        test("Get empty player by name", () => {
            let player = game.entityFinder.getLivingPlayer("");
            expect(player).toBeUndefined();
        });
    });

    describe("getDeadPlayer test", () => {
        test("Get dead player by name", () => {
            let player = game.entityFinder.getDeadPlayer("Evad");
            expect(player).toBeInstanceOf(Player);
            expect(player.name).toBe("Evad");
            expect(player.alive).toBe(false);
        });
        test("Get living player by name", () => {
            let player = game.entityFinder.getDeadPlayer("Amadeus");
            expect(player).toBeUndefined();
        });
        test("Get invalid player by name", () => {
            let player = game.entityFinder.getDeadPlayer("INVALID");
            expect(player).toBeUndefined();
        });
        test("Get empty player by name", () => {
            let player = game.entityFinder.getDeadPlayer("");
            expect(player).toBeUndefined();
        });
    });

    describe("getPlayerHands test", () => {
        test("Get player with LEFT and RIGHT hands", () => {
            let player = game.entityFinder.getLivingPlayer("Kyra");
            let hands = game.entityFinder.getPlayerHands(player);
            expect(hands.length).toStrictEqual(2);
            let foundRight = false;
            let foundLeft = false;
            for (const hand of hands) {
                expect(hand.id).toBeOneOf(["RIGHT HAND", "LEFT HAND"]);
                if (hand.id === "LEFT HAND") foundLeft = true;
                else if (hand.id === "RIGHT HAND") foundRight = true; 
            }
            expect(foundRight).toBeTruthy();
            expect(foundLeft).toBeTruthy();
        });
    });

    describe("getPlayerFreeHand test", () => {
        test("Get player with free RIGHT hand", () => {
            let player = game.entityFinder.getLivingPlayer("Kyra");
            let hand = game.entityFinder.getPlayerFreeHand(player);
            expect(hand).toBeInstanceOf(EquipmentSlot);
            expect(hand.id).toBe("RIGHT HAND")
        });
    });

    describe("getPlayerHandHoldingItem test", () => {
        test("TODO: No players in mock data hold an item!", () => {
            expect(false).toBeTruthy();
        });
    });

    describe("getPlayerSlotWithItem test", () => {
        test("Get valid item by id", () => {
            let player = game.entityFinder.getPlayer("Vivian");
            let [slot, item] = game.entityFinder.getPlayerSlotWithItem(player, "VIVIANS GLASSES", null, false, false, true);
            expect(slot).toBeInstanceOf(EquipmentSlot);
            expect(slot.id).toBe("GLASSES");
            expect(item).toBeInstanceOf(InventoryItem);
            expect(item.prefab.id).toBe("VIVIANS GLASSES");
        });
        test("Get valid item by slot and id", () => {
            let player = game.entityFinder.getPlayer("Vivian");
            let slot = player.inventoryCollection.get("HAT");
            let [foundSlot, item] = game.entityFinder.getPlayerSlotWithItem(player, "VIVIANS BOW", slot, false, false, true);
            expect(foundSlot).toBeInstanceOf(EquipmentSlot);
            expect(foundSlot.id).toBe("HAT");
            expect(item).toBeInstanceOf(InventoryItem);
            expect(item.prefab.id).toBe("VIVIANS BOW");
        });
        test("Get valid item by identifier", () => {
            let player = game.entityFinder.getPlayer("Vivian");
            let [slot, item] = game.entityFinder.getPlayerSlotWithItem(player, "FUTURE FOUNDATION JACKET 1", null, false, true, false);
            expect(slot).toBeInstanceOf(EquipmentSlot);
            expect(slot.id).toBe("JACKET");
            expect(item).toBeInstanceOf(InventoryItem);
            expect(item.prefab.id).toBe("FUTURE FOUNDATION JACKET");
            expect(item.identifier).toBe("FUTURE FOUNDATION JACKET 1");
        });
        test("Get valid item by slot and identifier", () => {
            let player = game.entityFinder.getPlayer("Vivian");
            let slot = player.inventoryCollection.get("PANTS");
            let [foundSlot, item] = game.entityFinder.getPlayerSlotWithItem(player, "FUTURE FOUNDATION TROUSERS 1", slot, false, true, false);
            expect(foundSlot).toBeInstanceOf(EquipmentSlot);
            expect(foundSlot.id).toBe("PANTS");
            expect(item).toBeInstanceOf(InventoryItem);
            expect(item.prefab.id).toBe("FUTURE FOUNDATION TROUSERS");
            expect(item.identifier).toBe("FUTURE FOUNDATION TROUSERS 1");
        });
        test("Get valid item by name", () => {
            let player = game.entityFinder.getPlayer("Vivian");
            let [slot, item] = game.entityFinder.getPlayerSlotWithItem(player, "FLATS", null, true, false, false);
            expect(slot).toBeInstanceOf(EquipmentSlot);
            expect(slot.id).toBe("SHOES");
            expect(item).toBeInstanceOf(InventoryItem);
            expect(item.prefab.id).toBe("FUTURE FOUNDATION SHOES");
            expect(item.name).toBe("FLATS");
        });
        test("Get valid item by slot and id", () => {
            let player = game.entityFinder.getPlayer("Vivian");
            let slot = player.inventoryCollection.get("SOCKS");
            let [foundSlot, item] = game.entityFinder.getPlayerSlotWithItem(player, "WHITE SOCKS", slot, true, false, false);
            expect(foundSlot).toBeInstanceOf(EquipmentSlot);
            expect(foundSlot.id).toBe("SOCKS");
            expect(item).toBeInstanceOf(InventoryItem);
            expect(item.prefab.id).toBe("FUTURE FOUNDATION SOCKS");
            expect(item.name).toBe("WHITE SOCKS");
        });
    });

    describe("getInventoryItem test", () => {
        test("Get valid inventory item by name", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("KYRAS GLASSES");
            expect(inventoryItem).toBeInstanceOf(InventoryItem);
            expect(inventoryItem.player.name).toBe("Kyra");
            expect(inventoryItem.prefab.id).toBe("KYRAS GLASSES");
            expect(inventoryItem.identifier).toBe("");
            expect(inventoryItem.equipmentSlot).toBe("GLASSES");
        });
        test("Get valid inventory item by id and player", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("KYRAS GLASSES", "Kyra");
            expect(inventoryItem).toBeInstanceOf(InventoryItem);
            expect(inventoryItem.player.name).toBe("Kyra");
            expect(inventoryItem.prefab.id).toBe("KYRAS GLASSES");
            expect(inventoryItem.identifier).toBe("");
            expect(inventoryItem.equipmentSlot).toBe("GLASSES");
        });
        test("Get valid inventory item by id, containerName and player", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("KYRAS GLASSES", "Kyra", "");
            expect(inventoryItem).toBeInstanceOf(InventoryItem);
            expect(inventoryItem.player.name).toBe("Kyra");
            expect(inventoryItem.prefab.id).toBe("KYRAS GLASSES");
            expect(inventoryItem.identifier).toBe("");
            expect(inventoryItem.equipmentSlot).toBe("GLASSES");
        });
        test("Get valid inventory item by id, containerName and player", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("KYRAS GLASSES", "Kyra", "", "GLASSES");
            expect(inventoryItem).toBeInstanceOf(InventoryItem);
            expect(inventoryItem.player.name).toBe("Kyra");
            expect(inventoryItem.prefab.id).toBe("KYRAS GLASSES");
            expect(inventoryItem.identifier).toBe("");
            expect(inventoryItem.equipmentSlot).toBe("GLASSES");
        });
        test("Get invalid inventory item by id", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("INVALID");
            expect(inventoryItem).toBeUndefined();
        });
        test("Get invalid inventory item by id and player", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("INVALID", "Kyra");
            expect(inventoryItem).toBeUndefined();
        });
        test("Get inventory item with invalid player", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("KYRAS GLASSES", "Vivian");
            expect(inventoryItem).toBeUndefined();
        });
        test("Get inventory item with invalid containerName", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("KYRAS GLASSES", "Kyra", "INVALID");
            expect(inventoryItem).toBeUndefined();
        });
        test("Get empty inventory item by id", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("");
            expect(inventoryItem).toBeUndefined();
        });
        test("Get inventory item with empty params", () => {
            let inventoryItem = game.entityFinder.getInventoryItem("", "", "", "");
            expect(inventoryItem).toBeUndefined();
        });
    });

    describe("getGesture test", () => {
        test("Get valid gesture by id", () => {
            let gesture = game.entityFinder.getGesture("smile");
            expect(gesture).toBeInstanceOf(Gesture);
            expect(gesture.id).toBe("smile");
        });
        test("Get valid gesture by id with whitespace", () => {
            let gesture = game.entityFinder.getGesture(" smile at                ");
            expect(gesture).toBeInstanceOf(Gesture);
            expect(gesture.id).toBe("smile at");
        });
        test("Get invalid gesture by id", () => {
            let gesture = game.entityFinder.getGesture("INVALID");
            expect(gesture).toBeUndefined();
        });
        test("Get empty gesture by id", () => {
            let gesture = game.entityFinder.getGesture("");
            expect(gesture).toBeUndefined();
        });
    });

    describe("getFlag test", () => {
        test("Get valid flag by id", () => {
            let flag = game.entityFinder.getFlag("COLD SEASON FLAG");
            expect(flag).toBeInstanceOf(Flag);
            expect(flag.id).toBe("COLD SEASON FLAG");
        });
        test("Get valid flag by id with whitespace", () => {
            let flag = game.entityFinder.getFlag(" COLD SEASON FLAG                ");
            expect(flag).toBeInstanceOf(Flag);
            expect(flag.id).toBe("COLD SEASON FLAG");
        });
        test("Get invalid flag by id", () => {
            let flag = game.entityFinder.getFlag("INVALID");
            expect(flag).toBeUndefined();
        });
        test("Get empty flag by id", () => {
            let flag = game.entityFinder.getFlag("");
            expect(flag).toBeUndefined();
        });
    });

    describe("getFlagValue test", () => {
        afterAll(async () => {
            await game.entityLoader.loadAll();
        });
        beforeEach(async () => {
            await game.entityLoader.loadFlags(false);
        });
        test("Get valid boolean flag value by id", () => {
            let flagValue = game.entityFinder.getFlagValue("DAYTIME");
            expect(flagValue).toBe(false);
        });
        test("Get valid string flag value by id", () => {
            let flagValue = game.entityFinder.getFlagValue("DAILY ANIMAL");
            expect(flagValue).toBe("bear");
        });
        test("Get valid string flag and evaluate", () => {
            let flagValue = game.entityFinder.getFlagValue("DAILY ANIMAL", true);
            expect(flagValue).toBeOneOf(["cat", "dog", "mouse", "owl", "bear"]);
        });
        test("Get valid boolean flag and evaluate", () => {
            let flagValue = game.entityFinder.getFlagValue("DAYTIME", true);
            expect(flagValue).toBe(true);
        });
        test("Get invalid flag value by id", () => {
            let flagValue = game.entityFinder.getFlagValue("INVALID");
            expect(flagValue).toBeUndefined();
        });
        test("Get empty flag value by id", () => {
            let flagValue = game.entityFinder.getFlagValue("");
            expect(flagValue).toBeUndefined();
        });
    });

    describe("getRooms test", () => {
        test("Get single valid room by id", () => {
            let rooms = game.entityFinder.getRooms("lobby");
            expect(rooms.length).toBe(1);
            expect(rooms[0].id).toBe("lobby");
        });
        test("Get valid room by non-exact id", () => {
            let rooms = game.entityFinder.getRooms("Floor 1 Hall 3");
            expect(rooms.length).toBe(1);
            expect(rooms[0].id).toBe("floor-1-hall-3");
        });
        test("Get valid rooms by id using fuzzy search", () => {
            let rooms = game.entityFinder.getRooms("floor 1", undefined, undefined, true);
            expect(rooms.length).toBe(5);
            expect(rooms[0].id).toBe("floor-1-hall-1");
            expect(rooms[1].id).toBe("floor-1-hall-2");
            expect(rooms[2].id).toBe("floor-1-hall-3");
            expect(rooms[3].id).toBe("floor-1-hall-4");
            expect(rooms[4].id).toBe("floor-1-hall-5");
        });
        test("Get single valid room by tag", () => {
            let rooms = game.entityFinder.getRooms(undefined, "floor-1-hall-3");
            expect(rooms.length).toBe(1);
            expect(rooms[0].id).toBe("floor-1-hall-3");
        });
        test("Get valid rooms by tag", () => {
            let rooms = game.entityFinder.getRooms(undefined, "soundproof");
            expect(rooms.length).toBe(17);
        });
        test("Get occupied rooms by id", () => {
            let rooms = game.entityFinder.getRooms("suite", undefined, true, true);
            expect(rooms.length).toBe(1);
            expect(rooms[0].id).toBe("suite-9");
        });
        test("Get occupied rooms", () => {
            let rooms = game.entityFinder.getRooms(undefined, undefined, true);
            expect(rooms.length).toBe(4);
        });
        test("Get room by invalid id", () => {
            let rooms = game.entityFinder.getRooms("INVALID");
            expect(rooms.length).toBe(0);
            let rooms2 = game.entityFinder.getRooms("INVALID", undefined, undefined, true);
            expect(rooms2.length).toBe(0);
        });
        test("Get room by invalid tag", () => {
            let rooms = game.entityFinder.getRooms(undefined, "INVALID");
            expect(rooms.length).toBe(0);
            let rooms2 = game.entityFinder.getRooms(undefined, "INVALID", undefined, true);
            expect(rooms2.length).toBe(0);
        });
    });

    describe("getExits test", () => {
    })

    describe("getFixtures test", () => {
        test("Get fixtures by name", () => {
            let fixtures = game.entityFinder.getFixtures("RECEPTION DESK");
            expect(fixtures.length).toBe(1);
            expect(fixtures[0].name).toBe("RECEPTION DESK");
        });
        test("Get fixtures by room", () => {
            let fixtures = game.entityFinder.getFixtures(undefined, "lobby");
            expect(fixtures.length).toBe(10);
            expect(fixtures[0].name).toBe("FLOOR");
            expect(fixtures[9].name).toBe("MONITOR");
            for (const fixture of fixtures) {
                expect(fixture).toBeInstanceOf(Fixture);
                expect(fixture.location.id).toBe("lobby");
            }
        });
        test("Get fixtures by name using fuzzy search", () => {
            let fixtures = game.entityFinder.getFixtures(
                "hand wash station",
                undefined,
                undefined,
                undefined,
                true
            );
            expect(fixtures.length).toBe(2);
            expect(fixtures[0].name).toBe("HAND WASH STATION 1");
            expect(fixtures[1].name).toBe("HAND WASH STATION 2");
        });
        test("Get fixtures by accessible", () => {
            let fixtures = game.entityFinder.getFixtures(
                undefined,
                "library",
                false
            );
            expect(fixtures.length).toBe(6);
            for (const fixture of fixtures) {
                expect(fixture).toBeInstanceOf(Fixture);
                expect(fixture.accessible).toBe(false);
            }
        });
        test("Get fixtures by recipe tag", () => {
            let fixtures = game.entityFinder.getFixtures(
                undefined,
                undefined,
                undefined,
                "stovetop"
            );
            expect(fixtures.length).toBe(6);
            for (const fixture of fixtures) {
                expect(fixture).toBeInstanceOf(Fixture);
                expect(fixture.recipeTag).toBe("stovetop");
            }
        });
        test("Get fixtures by invalid name", () => {
            let fixtures = game.entityFinder.getFixtures("INVALID");
            expect(fixtures.length).toBe(0);
        });
        test("Get fixtures by invalid room", () => {
            let fixtures = game.entityFinder.getFixtures(undefined, "INVALID");
            expect(fixtures.length).toBe(0);
        });
        test("Get fixtures by invalid recipe tag", () => {
            let fixtures = game.entityFinder.getFixtures(undefined, undefined, undefined, "INVALID");
            expect(fixtures.length).toBe(0);
        });
    });

    describe("getPrefabs test", () => {
        test("Get prefabs by id", () => {
            let prefabs = game.entityFinder.getPrefabs("PEN");
            expect(prefabs.length).toBe(1);
            expect(prefabs[0]).toBeInstanceOf(Prefab);
            expect(prefabs[0].id).toBe("PEN");
        });
        test("Get prefabs by effectsString", () => {
            let prefabs = game.entityFinder.getPrefabs(undefined, "refreshed");
            for (const prefab of prefabs) {
                expect(prefab).toBeInstanceOf(Prefab);
                expect(prefab.effectsStrings).toContain("refreshed");
            }
        });
    });
});
