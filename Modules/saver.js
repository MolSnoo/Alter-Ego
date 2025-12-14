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
export async function saveGame (game, deletedItemsCount = 0, deletedInventoryItemsCount = 0) {
    return new Promise(async (resolve, reject) => {
        /** @type {ValueRange[]} */
        let data = [];

        /** @type {string[][]} */
        let roomValues = [];
        for (let i = 0; i < game.rooms.length; i++) {
            for (let j = 0; j < game.rooms[i].exit.length; j++) {
                roomValues.push([
                    j === 0 ? game.rooms[i].displayName : "",
                    j === 0 ? game.rooms[i].tags.join(", ") : "",
                    j === 0 ? game.rooms[i].iconURL : "",
                    game.rooms[i].exit[j].name,
                    String(game.rooms[i].exit[j].pos.x),
                    String(game.rooms[i].exit[j].pos.y),
                    String(game.rooms[i].exit[j].pos.z),
                    game.rooms[i].exit[j].unlocked ? "TRUE" : "FALSE",
                    game.rooms[i].exit[j].dest.displayName,
                    game.rooms[i].exit[j].link,
                    game.rooms[i].exit[j].description
                ]);
            }
        }
        data.push({ range: game.constants.roomSheetDataCells, values: roomValues });

        /** @type {string[][]} */
        let fixtureValues = [];
        for (let i = 0; i < game.fixtures.length; i++) {
            fixtureValues.push([
                game.fixtures[i].name,
                game.fixtures[i].location.displayName,
                game.fixtures[i].accessible ? "TRUE" : "FALSE",
                game.fixtures[i].childPuzzleName,
                game.fixtures[i].recipeTag,
                game.fixtures[i].activatable ? "TRUE" : "FALSE",
                game.fixtures[i].activated ? "TRUE" : "FALSE",
                game.fixtures[i].autoDeactivate ? "TRUE" : "FALSE",
                String(game.fixtures[i].hidingSpotCapacity),
                game.fixtures[i].preposition,
                game.fixtures[i].description
            ]);
        }
        data.push({ range: game.constants.fixtureSheetDataCells, values: fixtureValues });

        /** @type {string[][]} */
        let itemValues = [];
        for (let i = 0; i < game.items.length; i++) {
            itemValues.push([
                game.items[i].prefab.id,
                game.items[i].identifier,
                game.items[i].location.displayName,
                game.items[i].accessible ? "TRUE" : "FALSE",
                `${game.items[i].containerType}: ${game.items[i].containerName}`,
                !isNaN(game.items[i].quantity) ? String(game.items[i].quantity) : "",
                !isNaN(game.items[i].uses) ? String(game.items[i].uses) : "",
                game.items[i].description
            ]);
            // If any items were deleted, row numbers may be incorrect. Fix them now.
            if (deletedItemsCount > 0) {
                if (i === 0) game.items[i].row = 2;
                else game.items[i].row = game.items[i - 1].row + 1;
            }
        }
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
        for (let i = 0; i < game.puzzles.length; i++) {
            /** @type {string[]} */
            let requirementStrings = [];
            game.puzzles[i].requirementsStrings.forEach(requirement => {
                if (requirement.type === "") requirementStrings.push(requirement.entityId);
                else requirementStrings.push(`${requirement.type}: ${requirement.entityId}`);
            });
            puzzleValues.push([
                game.puzzles[i].name,
                game.puzzles[i].solved ? "TRUE" : "FALSE",
                game.puzzles[i].outcome,
                game.puzzles[i].requiresMod ? "TRUE" : "FALSE",
                game.puzzles[i].location.displayName,
                game.puzzles[i].parentFixtureName,
                game.puzzles[i].type,
                game.puzzles[i].accessible ? "TRUE" : "FALSE",
                requirementStrings.join(", "),
                game.puzzles[i].solutions.join(", "),
                !isNaN(game.puzzles[i].remainingAttempts) ? String(game.puzzles[i].remainingAttempts) : "",
                game.puzzles[i].commandSetsString,
                game.puzzles[i].correctDescription,
                game.puzzles[i].alreadySolvedDescription,
                game.puzzles[i].incorrectDescription,
                game.puzzles[i].noMoreAttemptsDescription,
                game.puzzles[i].requirementsNotMetDescription
            ]);
        }
        data.push({ range: game.constants.puzzleSheetDataCells, values: puzzleValues });

        /** @type {string[][]} */
        let eventValues = [];
        for (let i = 0; i < game.events.length; i++) {
            eventValues.push([
                game.events[i].id,
                game.events[i].ongoing ? "TRUE" : "FALSE",
                game.events[i].durationString,
                game.events[i].remainingString,
                game.events[i].triggerTimesString,
                game.events[i].roomTag,
                game.events[i].commandsString,
                game.events[i].effectsStrings.join(", "),
                game.events[i].refreshesStrings.join(", "),
                game.events[i].triggeredNarration,
                game.events[i].endedNarration
            ]);
        }
        data.push({ range: game.constants.eventSheetDataCells, values: eventValues });

        /** @type {string[][]} */
        let playerValues = [];
        for (let i = 0; i < game.players.length; i++) {
            playerValues.push([
                game.players[i].id,
                game.players[i].name,
                game.players[i].title,
                game.players[i].pronounString,
                game.players[i].originalVoiceString,
                String(game.players[i].defaultStrength),
                String(game.players[i].defaultIntelligence),
                String(game.players[i].defaultDexterity),
                String(game.players[i].defaultSpeed),
                String(game.players[i].defaultStamina),
                game.players[i].alive ? "TRUE" : "FALSE",
                game.players[i].location ? game.players[i].location.displayName : "",
                game.players[i].hidingSpot ? game.players[i].hidingSpot : "",
                game.players[i].statusString,
                game.players[i].description
            ]);
        }
        data.push({ range: game.constants.playerSheetDataCells, values: playerValues });

        /** @type {string[][]} */
        let inventoryValues = [];
        for (let i = 0; i < game.inventoryItems.length; i++) {
            inventoryValues.push([
                game.inventoryItems[i].player.name,
                game.inventoryItems[i].prefab ? game.inventoryItems[i].prefab.id : "NULL",
                game.inventoryItems[i].identifier,
                game.inventoryItems[i].equipmentSlot,
                game.inventoryItems[i].containerName,
                !isNaN(game.inventoryItems[i].quantity) && game.inventoryItems[i].quantity !== null ? String(game.inventoryItems[i].quantity) : "",
                !isNaN(game.inventoryItems[i].uses) && game.inventoryItems[i].uses !== null ? String(game.inventoryItems[i].uses) : "",
                game.inventoryItems[i].description
            ]);
            // If any inventory items were deleted, row numbers may be incorrect. Fix them now.
            if (deletedInventoryItemsCount > 0) {
                if (i === 0) game.inventoryItems[i].row = 2;
                else game.inventoryItems[i].row = game.inventoryItems[i - 1].row + 1;
            }
        }
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
export async function setupdemo (game) {
    return new Promise (async (resolve, reject) =>  {
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
