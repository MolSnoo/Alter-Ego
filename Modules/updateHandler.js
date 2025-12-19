import GameConstants from '../Classes/GameConstants.js';
import GameSettings from '../Classes/GameSettings.js';
import { batchUpdateSheet, getSheetWithProperties } from './sheets.js';

import fs from 'fs';

/**
 * Automatically updates config files and the sheet.
 * @param {GameSettings} settings 
 */
export default async function autoUpdate (settings) {
    const constants = new GameConstants();
    await v1_9Update(settings, constants);
    await v1_10Update(settings, constants);
}

/**
 * @param {GameSettings} settings 
 * @param {GameConstants} constants
 */
async function v1_10Update(settings, constants) {
    // Update constants file. This shouldn't be necessary if Docker is used.
    if (constants.recipeSheetDataCells === "Recipes!A2:F" ||
        constants.recipeSheetInitiatedColumn === "Recipes!E" ||
        constants.recipeSheetCompletedColumn === "Recipes!F" ||
        constants.recipeSheetUncraftedColumn === undefined
    ) {
        constants.recipeSheetDataCells = "Recipes!A2:H";
        constants.recipeSheetInitiatedColumn = "Recipes!F";
        constants.recipeSheetCompletedColumn = "Recipes!G";
        constants.recipeSheetUncraftedColumn = "Recipes!H";
        let json = JSON.stringify(constants);
        await fs.writeFileSync('Configs/constants.json', json, 'utf8');
        console.log("Updated constants file with new Recipes sheet coordinates.");
    }
    // Updated Recipes sheet with the new columns.
    const response = await getSheetWithProperties("Recipes!A1:H1", settings.spreadsheetID);
    const sheetProperties = response.data.sheets[0] ? response.data.sheets[0].properties : {};
    if (sheetProperties.gridProperties.columnCount === 6) {
        var requests = [
            {
                insertDimension: {
                    range: {
                        sheetId: sheetProperties.sheetId,
                        dimension: "COLUMNS",
                        startIndex: 1,
                        endIndex: 2
                    },
                    inheritFromBefore: false
                }
            },
            {
                insertDimension: {
                    range: {
                        sheetId: sheetProperties.sheetId,
                        dimension: "COLUMNS",
                        startIndex: 7,
                        endIndex: 8
                    },
                    inheritFromBefore: true
                }
            },
            {
                pasteData: {
                    coordinate: {
                        sheetId: sheetProperties.sheetId,
                        rowIndex: 0,
                        columnIndex: 1
                    },
                    data: "Uncraftable?",
                    type: "PASTE_VALUES",
                    delimiter: ","
                }
            },
            {
                pasteData: {
                    coordinate: {
                        sheetId: sheetProperties.sheetId,
                        rowIndex: 0,
                        columnIndex: 7
                    },
                    data: "Message When Uncrafted",
                    type: "PASTE_VALUES",
                    delimiter: ","
                }
            }
        ];
        batchUpdateSheet(requests, settings.spreadsheetID).then(() => {
            console.log("Inserted Uncraftable and Message When Uncrafted columns on Recipes sheet.");
        }).catch(err => console.error(err));
        
    }
}

/**
 * @param {GameSettings} settings 
 * @param {GameConstants} constants
 */
async function v1_9Update(settings, constants) {
    // Update constants file. This shouldn't be necessary if Docker is used.
    if (constants.playerSheetDataCells === "Players!A3:N" ||
        constants.playerSheetDescriptionColumn === "Players!N"
    ) {
        constants.playerSheetDataCells = "Players!A3:O";
        constants.playerSheetDescriptionColumn = "Players!O";
        let json = JSON.stringify(constants);
        fs.writeFileSync('Configs/constants.json', json, 'utf8');
        console.log("Updated constants file with new Players sheet coordinates.");
    }
    // Update Players sheet with the new voice column.
    const response = await getSheetWithProperties("Players!A1:O1", settings.spreadsheetID);
    const sheetProperties = response.data.sheets[0] ? response.data.sheets[0].properties : {};
    if (sheetProperties.gridProperties.columnCount === 14) {
        var requests = [
            {
                insertDimension: {
                    range: {
                        sheetId: sheetProperties.sheetId,
                        dimension: "COLUMNS",
                        startIndex: 4,
                        endIndex: 5,
                    },
                    inheritFromBefore: true
                }
            },
            {
                pasteData: {
                    coordinate: {
                        sheetId: sheetProperties.sheetId,
                        rowIndex: 0,
                        columnIndex: 4
                    },
                    data: "Voice",
                    type: "PASTE_VALUES",
                    delimiter: ","
                }
            },
            {
                mergeCells: {
                    range: {
                        sheetId: sheetProperties.sheetId,
                        startRowIndex: 0,
                        endRowIndex: 2,
                        startColumnIndex: 4,
                        endColumnIndex: 5
                    },
                    mergeType: "MERGE_COLUMNS"
                }
            }
        ];
        batchUpdateSheet(requests, settings.spreadsheetID).then(() => {
            console.log("Inserted Voice column on Players sheet.");
        }).catch(err => console.error(err));
    }
}
