import EquipmentSlot from "../../Data/EquipmentSlot.js";
import Event from "../../Data/Event.js";
import Fixture from "../../Data/Fixture.js";
import Game from "../../Data/Game.js";
import InventoryItem from "../../Data/InventoryItem.js";
import Player from "../../Data/Player.js";
import Prefab from "../../Data/Prefab.js";
import Puzzle from "../../Data/Puzzle.js";
import Room from "../../Data/Room.js";
import RoomItem from "../../Data/RoomItem.js";
import sheets from "../__mocks__/libs/sheets.js";

describe('GameEntityLoader test', () => {
    /** @type {Error[]} */
    let errors;

    beforeEach(() => {
        errors = [];
    });

    afterEach(() => {
        sheets.__clearMock();
    });

    afterAll(() => {
        game.entityLoader.clearAll();
    });

    describe('loadAll test', () => {
        describe('standard load all response', () => {
            let updatePresenceSpy;
            let eventStartTimerSpy;
            let eventStartEffectsTimerSpy;
            let playerSendDescriptionSpy;

            beforeEach(() => {
                updatePresenceSpy = vi.spyOn(game.botContext, 'updatePresence').mockImplementation(() => {});
                eventStartTimerSpy = vi.spyOn(Event.prototype, 'startTimer').mockImplementation(async () => {});
                eventStartEffectsTimerSpy = vi.spyOn(Event.prototype, 'startEffectsTimer').mockImplementation(() => {});
                playerSendDescriptionSpy = vi.spyOn(Player.prototype, 'sendDescription').mockImplementation(() => {});
            });

            afterEach(() => {
                updatePresenceSpy.mockRestore();
                eventStartTimerSpy.mockRestore();
                eventStartEffectsTimerSpy.mockRestore();
                playerSendDescriptionSpy.mockRestore();
            });

            test('startGame false', async () => {
                const message = await game.entityLoader.loadAll();
                expect(message).not.toContain('Error');
                expect(message).toContain('retrieved.');
                expect(game.inProgress).toBe(false);
                expect(game.canJoin).toBe(false);
                expect(updatePresenceSpy).not.toHaveBeenCalled();
                expect(eventStartTimerSpy).toHaveBeenCalled();
                expect(eventStartEffectsTimerSpy).toHaveBeenCalled();
                expect(playerSendDescriptionSpy).not.toHaveBeenCalled();
            });
            
            test('startGame true', async () => {
                const message = await game.entityLoader.loadAll(true);
                expect(message).not.toContain('Error');
                expect(message).toContain('The game has started.');
                expect(game.inProgress).toBe(true);
                expect(game.canJoin).toBe(false);
                expect(updatePresenceSpy).toHaveBeenCalled();
                expect(eventStartTimerSpy).toHaveBeenCalled();
                expect(eventStartEffectsTimerSpy).toHaveBeenCalled();
                expect(playerSendDescriptionSpy).not.toHaveBeenCalled();
            });

            test('sendPlayerRoomDescriptions true', async () => {
                const message = await game.entityLoader.loadAll(true, true);
                expect(message).not.toContain('Error');
                expect(message).toContain('The game has started.');
                expect(game.inProgress).toBe(true);
                expect(game.canJoin).toBe(false);
                expect(updatePresenceSpy).toHaveBeenCalled();
                expect(eventStartTimerSpy).toHaveBeenCalled();
                expect(eventStartEffectsTimerSpy).toHaveBeenCalled();
                expect(playerSendDescriptionSpy).toHaveBeenCalledTimes(9);
            });
        });
    });

    describe('loadRooms test', () => {
        describe('erroneous room response', () => {
            test('no response returned', async () => {
                sheets.__setMock(game.constants.roomSheetDataCells, undefined);
                const roomCount = await game.entityLoader.loadRooms(true, errors);
                expect(errors).toEqual([]);
                expect(roomCount).toBe(0);
            });

            test('incomplete rooms', async () => {
                sheets.__setMock(game.constants.roomSheetDataCells, [
                    ["aaa"],
                    [],
                    ["aaa", "aaa"],
                    ["aaa", "", "aaa"],
                    ["aaa", "", "", "aaa"],
                    ["aaa", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "", "", "", "", "aaa"],
                ]);
                const roomCount = await game.entityLoader.loadRooms(true, errors);
                expect(errors).not.toEqual([]);
                expect(roomCount).toBe(0);
            });

            test('no room ID', async () => {
                sheets.__setMock(game.constants.roomSheetDataCells, [
                    ["'"]
                ]);
                const roomCount = await game.entityLoader.loadRooms(true, errors);
                expect(roomCount).toBe(0);
                expect(errors).toEqual([Error("Couldn't load room on row 2. The room display name resolved to a unique ID with an empty value.")]);
            });

            test('room error messages', async () => {
                sheets.__setMock(game.constants.roomSheetDataCells, [
                    [""],
                    ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
                    ["aaa", "", "aaaaaaaaa"],
                    ["aaa"]
                ]);
                const roomCount = await game.entityLoader.loadRooms(true, errors);
                const errorStrings = errors.join('\n').split('\n');
                expect(roomCount).toBe(0);
                expect(errorStrings).toHaveLength(4);
                expect(errorStrings).toContain("Error: Couldn't load room on row 2. No room display name was given.");
                expect(errorStrings).toContain("Error: Couldn't load room on row 3. The room ID exceeds 100 characters in length.");
                expect(errorStrings).toContain("Error: Couldn't load room on row 4. The icon URL must have a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.");
                expect(errorStrings).toContain("Error: Couldn't load room on row 5. Another room with the same ID already exists.");
            });

            test('exit error messages', async () => {
                sheets.__setMock(game.constants.roomSheetDataCells, [
                    ["Room 1", "", ""],
                    ["Room 2", "", "", "DOOR A", "X"],
                    ["Room 3", "", "", "DOOR B", "0", "Y"],
                    ["Room 4", "", "", "DOOR C", "0", "0", "Z"],
                    ["Room 5", "", "", "DOOR D", "0", "0", "0", "TRUE"],
                    ["Room 6", "", "", "DOOR E", "0", "0", "0", "TRUE", "Room 0"],
                    ["Room 7", "", "", "DOOR F", "0", "0", "0", "TRUE", "Room 2"],
                    ["Room 8", "", "", "DOOR G", "0", "0", "0", "TRUE", "Room 9", "DOOR Y"],
                    ["Room 9", "", "", "DOOR Z", "0", "0", "0", "TRUE", "Room 8", "DOOR G"],
                    ["", "", "", "DOOR Z", "0", "0", "0", "TRUE", "Room 8", "DOOR G"],
                ]);
                const roomCount = await game.entityLoader.loadRooms(true, errors);
                const errorStrings = errors.join('\n').split('\n');
                expect(roomCount).toBe(0);
                expect(errorStrings).toHaveLength(9);
                expect(errorStrings).toContain("Error: Couldn't load exit on row 2. No exit name was given.");
                expect(errorStrings).toContain("Error: Couldn't load exit on row 3. The X-coordinate given is not an integer.");
                expect(errorStrings).toContain("Error: Couldn't load exit on row 4. The Y-coordinate given is not an integer.");
                expect(errorStrings).toContain("Error: Couldn't load exit on row 5. The Z-coordinate given is not an integer.");
                expect(errorStrings).toContain("Error: Couldn't load exit on row 6. No destination was given.");
                expect(errorStrings).toContain("Error: Couldn't load exit on row 7. The destination given is not a room.");
                expect(errorStrings).toContain("Error: Couldn't load exit on row 8. No linked exit was given.");
                expect(errorStrings).toContain("Error: Couldn't load exit on row 9. Room \"Room 9\" does not have an exit that links back to it.");
                expect(errorStrings).toContain("Error: Couldn't load exit on row 11. The room already has an exit named \"DOOR Z\".");
            });
        });

        describe('standard room response', () => {
            test('errorChecking true', async () => {
                /** @type {Error[]} */
                let errors = [];
                const roomCount = await game.entityLoader.loadRooms(true, errors);
                expect(errors).toEqual([]);
                expect(roomCount).toBe(198);
            });
        });
    });

    describe('loadFixtures test', () => {
        beforeAll(async () => {
            await game.entityLoader.loadRooms(false);
        });

        describe('erroneous fixture response', () => {
            test('no response returned', async () => {
                sheets.__setMock(game.constants.fixtureSheetDataCells, undefined);
                const fixtureCount = await game.entityLoader.loadFixtures(true, errors);
                expect(errors).toEqual([]);
                expect(fixtureCount).toBe(0);
            });

            test('incomplete fixtures', async () => {
                sheets.__setMock(game.constants.fixtureSheetDataCells, [
                    ["aaa"],
                    [],
                    ["aaa", "aaa"],
                    ["aaa", "", "aaa"],
                    ["aaa", "", "", "aaa"],
                    ["aaa", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "", "", "", "aaa"],
                    ["aaa", "", "", "", "", "", "", "", "", "", "aaa"],
                ]);
                const fixtureCount = await game.entityLoader.loadFixtures(true, errors);
                expect(errors).not.toEqual([]);
                expect(fixtureCount).toBe(0);
            });

            test('fixture error messages', async () => {
                sheets.__setMock(game.constants.fixtureSheetDataCells, [
                    [""],
                    ["FLOOR", "saloon"],
                    ["FLOOR", "lobby"],
                    ["DESK", "lobby", "", "VAPORIZER"],
                    ["BAR LOCK", "Cooler", "TRUE", "ICE"],
                    ["EVAPORATOR", "Cooler", "TRUE", "BAR LOCK"],
                    ["TORTURE LABYRINTH", "Circus Tent", "TRUE", "", "", "FALSE", "FALSE", "FALSE", "A Lillian"],
                ]);
                await game.entityLoader.loadFixtures(false);
                await game.entityLoader.loadPuzzles(false);
                const fixtureCount = await game.entityLoader.loadFixtures(true, errors);
                const errorStrings = errors.join('\n').split('\n');
                expect(fixtureCount).toBe(0);
                expect(errorStrings).toHaveLength(6);
                expect(errorStrings).toContain("Error: Couldn't load fixture on row 2. No fixture name was given.");
                expect(errorStrings).toContain("Error: Couldn't load fixture on row 3. The location given is not a room.");
                expect(errorStrings).toContain("Error: Couldn't load fixture on row 5. The child puzzle given is not a puzzle.");
                expect(errorStrings).toContain("Error: Couldn't load fixture on row 6. The child puzzle on row 8 has no parent fixture.");
                expect(errorStrings).toContain("Error: Couldn't load fixture on row 7. The child puzzle on row 9 has a different parent fixture.");
                expect(errorStrings).toContain("Error: Couldn't load fixture on row 8. The hiding spot capacity given is not a number.");
            }, 10000);
        });

        describe('standard fixture response', () => {
            test('errorChecking true', async () => {
                await game.entityLoader.loadFixtures(false);
                await game.entityLoader.loadPuzzles(false);
                const fixtureCount = await game.entityLoader.loadFixtures(true, errors);
                expect(errors).toEqual([]);
                expect(fixtureCount).toBe(1546);
            });
        });
    });

    describe('loadPrefabs test', () => {
        describe('standard prefab response', () => {
            test('errorChecking true', async () => {
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                const prefabCount = await game.entityLoader.loadPrefabs(true, errors);
                expect(errors).toEqual([]);
                expect(prefabCount).toBe(1494);
            });
        });
    });

    describe('loadRecipes test', () => {
        describe('standard recipe response', () => {
            test('errorChecking true', async () => {
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                if (game.prefabsCollection.size === 0) await game.entityLoader.loadPrefabs(false);
                const recipeCount = await game.entityLoader.loadRecipes(true, errors);
                expect(errors).toEqual([]);
                expect(recipeCount).toBe(488);
            });
        });
    });

    describe('loadRoomItems test', () => {
        describe('standard room item response', () => {
            test('errorChecking true', async () => {
                if (game.roomsCollection.size === 0) await game.entityLoader.loadRooms(false);
                if (game.fixtures.length === 0) await game.entityLoader.loadFixtures(false);
                if (game.puzzles.length === 0) await game.entityLoader.loadPuzzles(false);
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                if (game.prefabsCollection.size === 0) await game.entityLoader.loadPrefabs(false);
                const roomItemCount = await game.entityLoader.loadRoomItems(true, errors);
                expect(errors).toEqual([]);
                expect(roomItemCount).toBe(1762);
                for (const roomItem of game.roomItems) {
                    expect(roomItem.prefab).toBeInstanceOf(Prefab);
                    expect(roomItem.prefab.id).toEqual(Game.generateValidEntityName(roomItem.prefabId));
                    expect(roomItem.location).toBeInstanceOf(Room);
                    expect(roomItem.location.id).toEqual(Room.generateValidId(roomItem.locationDisplayName));
                    if (roomItem.containerType === "Fixture") {
                        expect(roomItem.container).toBeInstanceOf(Fixture);
                        expect(roomItem.container.name).toEqual(Game.generateValidEntityName(roomItem.containerName));
                    }
                    else if (roomItem.containerType === "Puzzle") {
                        expect(roomItem.container).toBeInstanceOf(Puzzle);
                        expect(roomItem.container.name).toEqual(Game.generateValidEntityName(roomItem.containerName));
                    }
                    else if (roomItem.containerType === "RoomItem") {
                        expect(roomItem.container).toBeInstanceOf(RoomItem);
                        if (roomItem.container instanceof RoomItem)
                            expect(`${roomItem.container.getIdentifier()}/${roomItem.slot}`).toEqual(Game.generateValidEntityName(roomItem.containerName));
                    }
                    expect(roomItem.inventoryCollection.size).toEqual(roomItem.prefab.inventoryCollection.size);
                }
            });
        });
    });

    describe('loadPuzzles test', () => {
        describe('standard puzzle response', () => {
            test('errorChecking true', async () => {
                if (game.roomsCollection.size === 0) await game.entityLoader.loadRooms(false);
                if (game.fixtures.length === 0) await game.entityLoader.loadFixtures(false);
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                if (game.prefabsCollection.size === 0) await game.entityLoader.loadPrefabs(false);
                const puzzleCount = await game.entityLoader.loadPuzzles(true, errors);
                expect(errors).toEqual([]);
                expect(puzzleCount).toBe(381);
            });
        });
    });

    describe('loadEvents test', () => {
        describe('standard event response', () => {
            test('errorChecking true', async () => {
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                const eventCount = await game.entityLoader.loadEvents(true, errors);
                expect(errors).toEqual([]);
                expect(eventCount).toBe(125);
            });
        });
    });

    describe('loadStatusEffects test', () => {
        describe('standard status effect response', () => {
            test('errorChecking true', async () => {
                const statusEffectCount = await game.entityLoader.loadStatusEffects(true, errors);
                expect(errors).toEqual([]);
                expect(statusEffectCount).toBe(144);
            });
        });
    });

    describe('loadPlayers test', () => {
        describe('standard player response', () => {
            test('errorChecking true', async () => {
                if (game.roomsCollection.size === 0) await game.entityLoader.loadRooms(false);
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                if (game.prefabsCollection.size === 0) await game.entityLoader.loadPrefabs(false);
                const playerCount = await game.entityLoader.loadPlayers(true, errors);
                expect(errors).toEqual([]);
                expect(playerCount).toBe(11);
            });
        });
    });

    describe('loadInventoryItems test', () => {
        describe('standard inventory item response', () => {
            test('errorChecking true', async () => {
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                if (game.prefabsCollection.size === 0) await game.entityLoader.loadPrefabs(false);
                if (game.playersCollection.size === 0) await game.entityLoader.loadPlayers(false);
                const inventoryItemCount = await game.entityLoader.loadInventoryItems(true, errors);
                expect(errors).toEqual([]);
                expect(inventoryItemCount).toBe(37);
                for (const inventoryItem of game.inventoryItems) {
                    if (inventoryItem.prefabId !== "") {
                        expect(inventoryItem.prefab).toBeInstanceOf(Prefab);
                        expect(inventoryItem.prefab.id).toEqual(Game.generateValidEntityName(inventoryItem.prefabId));
                        expect(inventoryItem.inventoryCollection.size).toEqual(inventoryItem.prefab.inventoryCollection.size);
                    }
                    else expect(inventoryItem.prefab).toBe(null);
                    expect(inventoryItem.player).toBeInstanceOf(Player);
                    expect(inventoryItem.player.name).toEqual(inventoryItem.playerName);
                    expect(inventoryItem.player.inventoryCollection.get(inventoryItem.equipmentSlot)).toBeInstanceOf(EquipmentSlot);
                    if (inventoryItem.containerName !== "") {
                        expect(inventoryItem.container).toBeInstanceOf(InventoryItem);
                        expect(inventoryItem.containerType).toEqual("InventoryItem");
                        expect(`${inventoryItem.container.getIdentifier()}/${inventoryItem.slot}`).toEqual(Game.generateValidEntityName(inventoryItem.containerName));
                    }

                    const kyra = game.entityFinder.getPlayer("Kyra");
                    expect(kyra.carryWeight).toBe(5);
                    const kyraJacket = kyra.inventoryCollection.get("JACKET");
                    expect(kyraJacket.items).toHaveLength(1);
                    expect(kyraJacket.equippedItem).not.toBeNull();
                    expect(kyraJacket.equippedItem.identifier).toBe("KYRAS LAB COAT 1");
                    expect(kyraJacket.equippedItem.inventoryCollection.size).toBe(2);
                    for (const inventorySlot of kyraJacket.equippedItem.inventoryCollection.values()) {
                        expect(inventorySlot.takenSpace).toBe(0);
                        expect(inventorySlot.weight).toBe(0);
                    }
                    const kyraPants = kyra.inventoryCollection.get("PANTS");
                    expect(kyraPants.items).toHaveLength(2);
                    expect(kyraPants.equippedItem).not.toBeNull();
                    expect(kyraPants.equippedItem.inventoryCollection.size).toBe(2);
                    expect(kyraPants.items[1].prefab.id).toBe("MASTER KEY");
                    const kyraPantsRightPocket = kyraPants.equippedItem.inventoryCollection.get("RIGHT POCKET");
                    expect(kyraPantsRightPocket.takenSpace).toBe(1);
                    expect(kyraPantsRightPocket.weight).toBe(1);
                    expect(kyraPantsRightPocket.items).toHaveLength(1);
                    expect(kyraPantsRightPocket.items[0].prefab.id).toBe("MASTER KEY");

                    const vivian = game.entityFinder.getPlayer("Vivian");
                    expect(vivian.carryWeight).toBe(22);
                    const vivianBag = vivian.inventoryCollection.get("BAG");
                    expect(vivianBag.items).toHaveLength(6);
                    expect(vivianBag.equippedItem).not.toBe(null);
                    expect(vivianBag.equippedItem.identifier).toBe("VIVIANS QUIVER");
                    expect(vivianBag.equippedItem.inventoryCollection.size).toBe(1);
                    const vivianQuiver = vivianBag.equippedItem.inventoryCollection.get("QUIVER");
                    expect(vivianQuiver.takenSpace).toBe(5);
                    expect(vivianQuiver.weight).toBe(1);
                    expect(vivianQuiver.items).toHaveLength(1);
                    expect(vivianQuiver.items[0].identifier).toBe("WHITE JEANS 2");
                    const whiteJeans = vivianQuiver.items[0];
                    expect(whiteJeans.inventoryCollection.size).toBe(4);
                    const whiteJeansRightPocket = whiteJeans.inventoryCollection.get("RIGHT POCKET");
                    const whiteJeansLeftPocket = whiteJeans.inventoryCollection.get("LEFT POCKET");
                    const whiteJeansRightBackPocket = whiteJeans.inventoryCollection.get("RIGHT BACK POCKET");
                    const whiteJeansLeftBackPocket = whiteJeans.inventoryCollection.get("LEFT BACK POCKET");
                    expect(whiteJeansRightBackPocket.items).toHaveLength(0);
                    expect(whiteJeansLeftBackPocket.items).toHaveLength(0);
                    expect(whiteJeansRightPocket.items).toHaveLength(1);
                    expect(whiteJeansRightPocket.takenSpace).toBe(2);
                    expect(whiteJeansLeftPocket.items).toHaveLength(1);
                    expect(whiteJeansLeftPocket.takenSpace).toBe(2);
                    expect(whiteJeansRightPocket.items[0].identifier).toBe("PACK OF TOILET PAPER 2");
                    expect(whiteJeansLeftPocket.items[0].identifier).toBe("PACK OF TOILET PAPER 3");
                    expect(whiteJeansRightPocket.items[0].inventoryCollection.size).toBe(1);
                    expect(whiteJeansLeftPocket.items[0].inventoryCollection.size).toBe(1);
                    const tpPack2 = whiteJeansRightPocket.items[0].inventoryCollection.get("PACK");
                    const tpPack3 = whiteJeansLeftPocket.items[0].inventoryCollection.get("PACK");
                    expect(tpPack2.items).toHaveLength(1);
                    expect(tpPack3.items).toHaveLength(1);
                    expect(tpPack2.takenSpace).toBe(12);
                    expect(tpPack3.takenSpace).toBe(5);
                    expect(tpPack2.weight).toBe(12);
                    expect(tpPack3.weight).toBe(6);
                    expect(tpPack2.items[0].prefab.id).toBe("HAMBURGER BUN");
                    expect(tpPack3.items[0].prefab.id).toBe("DETERGENT");
                }
            });
        });
    });

    describe('loadGestures test', () => {
        describe('standard gesture response', () => {
            test('errorChecking true', async () => {
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                const gestureCount = await game.entityLoader.loadGestures(true, errors);
                expect(errors).toEqual([]);
                expect(gestureCount).toBe(138);
            });
        });
    });

    describe('loadFlags test', () => {
        describe('standard flag response', () => {
            test('errorChecking true', async () => {
                const flagCount = await game.entityLoader.loadFlags(true, errors);
                expect(errors).toEqual([]);
                expect(flagCount).toBe(5);
            });
        });
    });
});