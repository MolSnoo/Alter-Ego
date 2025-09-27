const constants = include('Configs/constants.json');
const sheets = include(`${constants.modulesDir}/sheets.js`);

const fs = require('fs');

module.exports.autoUpdate = async () => {
    await v1_9Update();
    await v1_10Update();
};

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
    sheets.getDataWithProperties("Recipes!A1:H1", async function (response) {
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
            sheets.batchUpdate(requests, async function (response) {
                console.log("Inserted Uncraftable and Message When Uncrafted columns on Recipes sheet.");
            });
        }
    });
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
    sheets.getDataWithProperties("Players!A1:O1", async function (response) {
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
            sheets.batchUpdate(requests, async function (response) {
                console.log("Inserted Voice column on Players sheet.");
            });
        }
    });
}
