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
            expect(fixture).toBeUndefined();
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
            expect(foundItem1).toBeUndefined();
            let foundItem2 = game.entityFinder.getRoomItem("COLD SERVING OF MEATBALLS", "", "");
            expect(foundItem2).toBeUndefined();
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

    describe("getInventoryItem test", () => {
        test("Get valid inventory item by id", () => {
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
        afterEach(async () => {
            await game.entityLoader.loadAll();
        });
        test("Get valid boolean flag value by id", () => {
            let flagValue = game.entityFinder.getFlagValue("COLD SEASON FLAG");
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
        test("Get valid rooms by id using fuzzy search", () => {
            let rooms = game.entityFinder.getRooms("floor-1", undefined, undefined, true);
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
});
