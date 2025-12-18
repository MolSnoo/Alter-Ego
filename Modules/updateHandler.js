import constants from '../Configs/constants.json' with { type: 'json' };
import { batchUpdateSheet, batchUpdateSheetValues, getSheetWithProperties } from './sheets.js';

import fs from 'fs';

export default async function autoUpdate () {
    await v1_9Update();
    await v1_10Update();
}

async function v1_10Update() {
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
    const response = await getSheetWithProperties("Recipes!A1:H1");
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
        batchUpdateSheet(requests).then(() => {
            console.log("Inserted Uncraftable and Message When Uncrafted columns on Recipes sheet.");
        }).catch(err => console.error(err));
        
    }
}

async function v1_9Update() {
    // Update constants file. This shouldn't be necessary if Docker is used.
    if (constants.playerSheetDataCells === "Players!A3:N" ||
        constants.playerSheetDescriptionColumn === "Players!N"
    ) {
        constants.playerSheetDataCells = "Players!A3:O";
        constants.playerSheetDescriptionColumn = "Players!O";
        let json = JSON.stringify(constants);
        await fs.writeFileSync('Configs/constants.json', json, 'utf8');
        console.log("Updated constants file with new Players sheet coordinates.");
    }
    // Update Players sheet with the new voice column.
    const response = await getSheetWithProperties("Players!A1:O1");
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
        batchUpdateSheetValues(requests).then(() => {
            console.log("Inserted Voice column on Players sheet.");
        }).catch(err => console.error(err));
    }
}
