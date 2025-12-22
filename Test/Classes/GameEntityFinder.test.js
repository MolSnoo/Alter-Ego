import RoomItem from "../../Data/RoomItem.js";

describe("GameEntityFinder test", () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    beforeEach(() => {
    });

    describe("getRoomItem Test", () => {
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
        test("Get null item", () => {
            let foundItem1 = game.entityFinder.getRoomItem(null);
            expect(foundItem1).toBeUndefined();
        });
        test("Get item with empty params", () => {
            let foundItem1 = game.entityFinder.getRoomItem("", "", "");
            expect(foundItem1).toBeUndefined();
        })
        test("Get item with valid identifier but empty params", () => {
            let foundItem1 = game.entityFinder.getRoomItem("COLD SERVING OF MEATBALLS", "");
            expect(foundItem1).toBeUndefined();
        })
        test("Get item with valid identifier but null params", () => {
            let foundItem1 = game.entityFinder.getRoomItem("COLD SERVING OF MEATBALLS", null);
            expect(foundItem1).toBeUndefined();
        })
        test("Try overflowing invalid item", () => {
            let testString = "";
            for (let i = 0; i < 60000; i++) {
                testString = testString + "a";
            }
            let foundItem1 = game.entityFinder.getRoomItem(testString);
            expect(foundItem1).toBeUndefined();
        });
    });
});
