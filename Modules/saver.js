import demodata from '../Configs/demodata.json' with { type: 'json' };
import Game from '../Data/Game.js';
import { batchUpdateSheetValues } from "./sheets.js";

/**
 * Saves the current game state to the spreadsheet.
 * @param {Game} game - The game to save.
 * @param {number} [deletedItemsCount] - The number of deleted rows from the Items sheet. Inserts that many blank rows after the remaining items. Defaults to 0.
 * @param {number} [deletedInventoryItemsCount] - The number of deleted rows from the Inventory Items sheet. Inserts that many blank rows after the remaining inventory items. Defaults to 0.
 * @returns {Promise<Error|void>} An Error, if there is one.
 */
export async function saveGame(game, deletedItemsCount = 0, deletedInventoryItemsCount = 0) {
    return new Promise(async (resolve, reject) => {
        /** @type {ValueRange[]} */
        let data = [];

        /** @type {string[][]} */
        let roomValues = [];
        game.roomsCollection.forEach(room => {
            room.exitCollection.forEach(exit => {
                const firstExit = room.exitCollection.firstKey() === exit.name;
                roomValues.push([
                    firstExit ? room.displayName : "",
                    firstExit ? room.tags.join(", ") : "",
                    firstExit ? room.iconURL : "",
                    exit.name,
                    String(exit.pos.x),
                    String(exit.pos.y),
                    String(exit.pos.z),
                    exit.unlocked ? "TRUE" : "FALSE",
                    exit.dest.displayName,
                    exit.link,
                    exit.description
                ]);
            });
        });
        data.push({ range: game.constants.roomSheetDataCells, values: roomValues });

        /** @type {string[][]} */
        let fixtureValues = [];
        game.fixtures.forEach(fixture => {
            fixtureValues.push([
                fixture.name,
                fixture.location.displayName,
                fixture.accessible ? "TRUE" : "FALSE",
                fixture.childPuzzleName,
                fixture.recipeTag,
                fixture.activatable ? "TRUE" : "FALSE",
                fixture.activated ? "TRUE" : "FALSE",
                fixture.autoDeactivate ? "TRUE" : "FALSE",
                String(fixture.hidingSpotCapacity),
                fixture.preposition,
                fixture.description
            ]);
        });
        data.push({ range: game.constants.fixtureSheetDataCells, values: fixtureValues });

        /** @type {string[][]} */
        let itemValues = [];
        game.roomItems.forEach((roomItem, i) => {
            itemValues.push([
                roomItem.prefab.id,
                roomItem.identifier,
                roomItem.location.displayName,
                roomItem.accessible ? "TRUE" : "FALSE",
                `${roomItem.containerType}: ${roomItem.containerName}`,
                !isNaN(roomItem.quantity) ? String(roomItem.quantity) : "",
                !isNaN(roomItem.uses) ? String(roomItem.uses) : "",
                roomItem.description
            ]);
            // If any items were deleted, row numbers may be incorrect. Fix them now.
            if (deletedItemsCount > 0) {
                if (i === 0) game.roomItems[i].row = 2;
                else game.roomItems[i].row = game.roomItems[i - 1].row + 1;
            }
        });
        for (let i = 0; i < deletedItemsCount; i++)
            itemValues.push([
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                ""
            ]);
        data.push({ range: game.constants.roomItemSheetDataCells, values: itemValues });

        /** @type {string[][]} */
        let puzzleValues = [];
        game.puzzles.forEach(puzzle => {
            /** @type {string[]} */
            let requirementStrings = [];
            puzzle.requirementsStrings.forEach(requirementString => {
                if (requirementString.type === "") requirementStrings.push(requirementString.entityId);
                else requirementStrings.push(`${requirementString.type}: ${requirementString.entityId}`);
            });
            puzzleValues.push([
                puzzle.name,
                puzzle.solved ? "TRUE" : "FALSE",
                puzzle.outcome,
                puzzle.requiresMod ? "TRUE" : "FALSE",
                puzzle.location.displayName,
                puzzle.parentFixtureName,
                puzzle.type,
                puzzle.accessible ? "TRUE" : "FALSE",
                requirementStrings.join(", "),
                puzzle.solutions.join(", "),
                !isNaN(puzzle.remainingAttempts) ? String(puzzle.remainingAttempts) : "",
                puzzle.commandSetsString,
                puzzle.correctDescription,
                puzzle.alreadySolvedDescription,
                puzzle.incorrectDescription,
                puzzle.noMoreAttemptsDescription,
                puzzle.requirementsNotMetDescription
            ]);
        });
        data.push({ range: game.constants.puzzleSheetDataCells, values: puzzleValues });

        /** @type {string[][]} */
        let eventValues = [];
        game.eventsCollection.forEach(event => {
            eventValues.push([
                event.id,
                event.ongoing ? "TRUE" : "FALSE",
                event.durationString,
                event.remainingString,
                event.triggerTimesStrings.join(", "),
                event.roomTag,
                event.commandsString,
                event.effectsStrings.join(", "),
                event.refreshesStrings.join(", "),
                event.triggeredNarration,
                event.endedNarration
            ]);
        });
        data.push({ range: game.constants.eventSheetDataCells, values: eventValues });

        /** @type {string[][]} */
        let playerValues = [];
        game.playersCollection.forEach(player => {
            playerValues.push([
                player.id,
                player.name,
                player.title,
                player.pronounString,
                player.originalVoiceString,
                String(player.defaultStrength),
                String(player.defaultIntelligence),
                String(player.defaultDexterity),
                String(player.defaultSpeed),
                String(player.defaultStamina),
                player.alive ? "TRUE" : "FALSE",
                player.location ? player.location.displayName : "",
                player.hidingSpot ? player.hidingSpot : "",
                player.getStatusList(true, true),
                player.description
            ]);
        });
        data.push({ range: game.constants.playerSheetDataCells, values: playerValues });

        /** @type {string[][]} */
        let inventoryValues = [];
        game.inventoryItems.forEach((inventoryItem, i) => {
            inventoryValues.push([
                inventoryItem.player.name,
                inventoryItem.prefab ? inventoryItem.prefab.id : "NULL",
                inventoryItem.identifier,
                inventoryItem.equipmentSlot,
                inventoryItem.containerName,
                !isNaN(inventoryItem.quantity) && inventoryItem.quantity !== null ? String(inventoryItem.quantity) : "",
                !isNaN(inventoryItem.uses) && inventoryItem.uses !== null ? String(inventoryItem.uses) : "",
                inventoryItem.description
            ]);
            // If any inventory items were deleted, row numbers may be incorrect. Fix them now.
            if (deletedInventoryItemsCount > 0) {
                if (i === 0) game.inventoryItems[i].row = 2;
                else game.inventoryItems[i].row = game.inventoryItems[i - 1].row + 1;
            }
        });
        for (let i = 0; i < deletedInventoryItemsCount; i++)
            inventoryValues.push([
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                ""
            ]);
        data.push({ range: game.constants.inventorySheetDataCells, values: inventoryValues });

        /** @type {string[][]} */
        let flagValues = [];
        game.flags.forEach(flag => {
            flagValues.push([
                flag.id,
                flag.value === null ? "" : flag.value === true ? "TRUE" : flag.value === false ? "FALSE" : String(flag.value),
                flag.valueScript,
                flag.commandSetsString
            ]);
        });
        data.push({ range: game.constants.flagSheetDataCells, values: flagValues });

        try {
            await batchUpdateSheetValues(data);
            resolve();
        }
        catch (err) {
            reject(err);
        }
    });
}

/**
 * Sets up a small demo environment on the spreadsheet. Overwrites anything that may already be on the spreadsheet.
 * @param {Game} game - The game context in which to set up a demo environment.
 * @returns {Promise<string[][]>} A set of room data formatted as spreadsheet cells.
 */
export async function setupdemo(game) {
    return new Promise(async (resolve, reject) => {
        /** @type {ValueRange[]} */
        let data = [];

        const roomValues = demodata.rooms;
        const fixtureValues = demodata.objects;
        const prefabValues = demodata.prefabs;
        const recipeValues = demodata.recipes;
        const itemValues = demodata.items;
        const puzzleValues = demodata.puzzles;
        const eventValues = demodata.events;
        const statusValues = demodata.statusEffects;
        const gestureValues = demodata.gestures;

        /** @type {ValueRange} */
        data.push({ range: game.constants.roomSheetDataCells, values: roomValues });
        /** @type {ValueRange} */
        data.push({ range: game.constants.fixtureSheetDataCells, values: fixtureValues });
        /** @type {ValueRange} */
        data.push({ range: game.constants.prefabSheetDataCells, values: prefabValues });
        /** @type {ValueRange} */
        data.push({ range: game.constants.recipeSheetDataCells, values: recipeValues });
        /** @type {ValueRange} */
        data.push({ range: game.constants.roomItemSheetDataCells, values: itemValues });
        /** @type {ValueRange} */
        data.push({ range: game.constants.puzzleSheetDataCells, values: puzzleValues });
        /** @type {ValueRange} */
        data.push({ range: game.constants.eventSheetDataCells, values: eventValues });
        /** @type {ValueRange} */
        data.push({ range: game.constants.statusSheetDataCells, values: statusValues });
        /** @type {ValueRange} */
        data.push({ range: game.constants.gestureSheetDataCells, values: gestureValues });

        try {
            await batchUpdateSheetValues(data);
            resolve(roomValues);
        }
        catch (err) {
            reject(err);
        }
    });
}
