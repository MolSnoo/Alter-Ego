import Event from "../../Data/Event.js";
import Player from "../../Data/Player.js";
import sheets from "../__mocks__/libs/sheets.js";

describe('GameEntityLoader test', () => {
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
            /** @type {Error[]} */
            let errors;

            beforeEach(() => {
                errors = [];
            });

            afterEach(() => {
                sheets.__clearMock();
            });

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
                expect(errorStrings).toContain("Error: Couldn't load exit on row 10. Room \"Room 8\"  does not have an exit that links back to it.");
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
        describe('standard fixture response', () => {
            test('errorChecking true', async () => {
                /** @type {Error[]} */
                let errors = [];
                if (game.roomsCollection.size === 0) await game.entityLoader.loadRooms(false);
                if (game.fixtures.length === 0) await game.entityLoader.loadFixtures(false);
                if (game.puzzles.length === 0) await game.entityLoader.loadPuzzles(false);
                const fixtureCount = await game.entityLoader.loadFixtures(true, errors);
                expect(errors).toEqual([]);
                expect(fixtureCount).toBe(1546);
            });
        });
    });

    describe('loadPrefabs test', () => {
        describe('standard prefab response', () => {
            test('errorChecking true', async () => {
                /** @type {Error[]} */
                let errors = [];
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
                /** @type {Error[]} */
                let errors = [];
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
                /** @type {Error[]} */
                let errors = [];
                if (game.roomsCollection.size === 0) await game.entityLoader.loadRooms(false);
                if (game.fixtures.length === 0) await game.entityLoader.loadFixtures(false);
                if (game.puzzles.length === 0) await game.entityLoader.loadPuzzles(false);
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                if (game.prefabsCollection.size === 0) await game.entityLoader.loadPrefabs(false);
                const roomItemCount = await game.entityLoader.loadRoomItems(true, errors);
                expect(errors).toEqual([]);
                expect(roomItemCount).toBe(1762);
            });
        });
    });

    describe('loadPuzzles test', () => {
        describe('standard puzzle response', () => {
            test('errorChecking true', async () => {
                /** @type {Error[]} */
                let errors = [];
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
                /** @type {Error[]} */
                let errors = [];
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
                /** @type {Error[]} */
                let errors = [];
                const statusEffectCount = await game.entityLoader.loadStatusEffects(true, errors);
                expect(errors).toEqual([]);
                expect(statusEffectCount).toBe(144);
            });
        });
    });

    describe('loadPlayers test', () => {
        describe('standard player response', () => {
            test('errorChecking true', async () => {
                /** @type {Error[]} */
                let errors = [];
                if (game.roomsCollection.size === 0) await game.entityLoader.loadRooms(false);
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                if (game.prefabsCollection.size === 0) await game.entityLoader.loadPrefabs(false);
                const playerCount = await game.entityLoader.loadPlayers(true, errors);
                expect(errors).toEqual([]);
                expect(playerCount).toBe(10);
            });
        });
    });

    describe('loadInventoryItems test', () => {
        describe('standard inventory item response', () => {
            test('errorChecking true', async () => {
                /** @type {Error[]} */
                let errors = [];
                if (game.statusEffectsCollection.size === 0) await game.entityLoader.loadStatusEffects(false);
                if (game.prefabsCollection.size === 0) await game.entityLoader.loadPrefabs(false);
                if (game.playersCollection.size === 0) await game.entityLoader.loadPlayers(false);
                const inventoryItemCount = await game.entityLoader.loadInventoryItems(true, errors);
                expect(errors).toEqual([]);
                expect(inventoryItemCount).toBe(31);
            });
        });
    });

    describe('loadGestures test', () => {
        describe('standard gesture response', () => {
            test('errorChecking true', async () => {
                /** @type {Error[]} */
                let errors = [];
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
                /** @type {Error[]} */
                let errors = [];
                const flagCount = await game.entityLoader.loadFlags(true, errors);
                expect(errors).toEqual([]);
                expect(flagCount).toBe(5);
            });
        });
    });
});