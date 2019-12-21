const { google } = require('googleapis');
const credentials = include('credentials.json');
var sheets = google.sheets('v4');

const settings = include('settings.json');
const spreadsheetID = settings.spreadsheetID;
const roomSheetID = settings.roomSheetID;
const objectSheetID = settings.objectSheetID;
const prefabSheetID = settings.prefabSheetID;
const itemSheetID = settings.itemSheetID;
const puzzleSheetID = settings.puzzleSheetID;
const statusEffectSheetID = settings.statusEffectSheetID;
const playerSheetID = settings.playerSheetID;
const inventoryItemSheetID = settings.inventoryItemSheetID;

module.exports.getData = function (sheetrange, dataOperation, spreadsheetId) {
    authorize(function (authClient) {
        if (!spreadsheetId) spreadsheetId = spreadsheetID;
        var request = {
            // The ID of the spreadsheet to retrieve data from.
            spreadsheetId: spreadsheetId,

            // The A1 notation of the values to retrieve.
            range: sheetrange,

            // How values should be represented in the output.
            // The default render option is ValueRenderOption.FORMATTED_VALUE.
            valueRenderOption: 'FORMATTED_VALUE',

            // How dates, times, and durations should be represented in the output.
            // This is ignored if value_render_option is
            // FORMATTED_VALUE.
            // The default dateTime render option is [DateTimeRenderOption.SERIAL_NUMBER].
            dateTimeRenderOption: 'SERIAL_NUMBER',

            auth: authClient,
        };

        sheets.spreadsheets.values.get(request, function (err, response) {
            if (err) {
                console.error(err);
                return;
            }

            dataOperation(response);
            //console.log('Retrieved "' + response.data.values + '" from ' + sheetrange);
        });
    });
};

module.exports.getDataFormulas = function (sheetrange, dataOperation) {
    authorize(function (authClient) {
        var request = {
            // The ID of the spreadsheet to retrieve data from.
            spreadsheetId: spreadsheetID,

            // The A1 notation of the values to retrieve.
            range: sheetrange,

            // How values should be represented in the output.
            // The default render option is ValueRenderOption.FORMATTED_VALUE.
            valueRenderOption: 'FORMULA',

            // How dates, times, and durations should be represented in the output.
            // This is ignored if value_render_option is
            // FORMATTED_VALUE.
            // The default dateTime render option is [DateTimeRenderOption.SERIAL_NUMBER].
            dateTimeRenderOption: 'SERIAL_NUMBER',

            auth: authClient,
        };

        sheets.spreadsheets.values.get(request, function (err, response) {
            if (err) {
                console.error(err);
                return;
            }

            dataOperation(response);
            //console.log('Retrieved "' + response.data.values + '" from ' + sheetrange);
        });
    });
};

module.exports.updateData = function (sheetrange, data, dataOperation) {
    authorize(function (authClient) {
        var request = {
            // The ID of the spreadsheet to update.
            spreadsheetId: spreadsheetID,

            // The A1 notation of the values to update.
            range: sheetrange,

            // How the input data should be interpreted.
            valueInputOption: 'USER_ENTERED',

            resource: {
                values: data,
            },

            auth: authClient,
        };

        sheets.spreadsheets.values.update(request, function (err, response) {
            if (err) {
                console.error(err);
                return;
            }

            if (dataOperation) {
                dataOperation(response);
            }
            //console.log('Wrote "' + data + '" to ' + sheetrange);
        });
    });
};

module.exports.updateCell = function (sheetrange, data, dataOperation) {
    authorize(function (authClient) {
        var request = {
            // The ID of the spreadsheet to update.
            spreadsheetId: spreadsheetID,

            // The A1 notation of the values to update.
            range: sheetrange,

            // How the input data should be interpreted.
            valueInputOption: 'USER_ENTERED',

            resource: {
                values: new Array(new Array(data.toString())),
            },

            auth: authClient,
        };

        sheets.spreadsheets.values.update(request, function (err, response) {
            if (err) {
                console.error(err);
                return;
            }

            if (dataOperation) {
                dataOperation(response);
            }
            //console.log('Wrote "' + data + '" to ' + sheetrange);
        });
    });
};

module.exports.batchUpdate = function (requests, dataOperation, spreadsheetId) {
    authorize(function (authClient) {
        if (!spreadsheetId) spreadsheetId = spreadsheetID;
        var request = {
            // The ID of the spreadsheet to update.
            spreadsheetId: spreadsheetId,

            resource: {
                // A list of updates to apply to the spreadsheet.
                // Requests will be applied in the order they are specified.
                // If any request is not valid, no requests will be applied.
                requests: requests
            },

            auth: authClient
        };

        sheets.spreadsheets.batchUpdate(request, function (err, response) {
            if (err) {
                console.error(err);
                return;
            }

            if (dataOperation) {
                dataOperation(response);
            }
        });
    });
};

module.exports.appendRow = function (sheetrange, data, dataOperation) {
    authorize(function (authClient) {
        var request = {
            // The ID of the spreadsheet to update.
            spreadsheetId: spreadsheetID,

            // The A1 notation of a range to search for a logical table of data.
            // Values will be appended after the last row of the table.
            range: sheetrange,

            // How the input data should be interpreted.
            valueInputOption: 'USER_ENTERED',

            // How the input data should be inserted.
            insertDataOption: 'INSERT_ROWS',

            resource: {
                values: new Array(data),
            },

            auth: authClient,
        };

        sheets.spreadsheets.values.append(request, function (err, response) {
            if (err) {
                console.error(err);
                return;
            }

            if (dataOperation) {
                dataOperation(response);
            }
            //console.log('Appended row "' + data + '" to ' + sheetrange);
        });
    });
};

module.exports.insertRow = function (sheetrange, data, dataOperation) {
    const sheetrangeArgs = sheetrange.split('!');
    const sheetName = sheetrangeArgs[0];
    var sheetId;
    switch (sheetName) {
        case "Rooms":
            sheetId = roomSheetID;
            break;
        case "Objects":
            sheetId = objectSheetID;
            break;
        case "Items":
            sheetId = itemSheetID;
            break;
        case "Puzzles":
            sheetId = puzzleSheetID;
            break;
        case "Status Effects":
            sheetId = statusEffectSheetID;
            break;
        case "Players":
            sheetId = playerSheetID;
            break;
    }
    var rowNumber;
    for (var i = sheetrangeArgs[1].length - 1; i >= 0; i--) {
        if (isNaN(parseInt(sheetrangeArgs[1].charAt(i)))) {
            rowNumber = parseInt(sheetrangeArgs[1].substring(i + 1));
        }
    }

    const dataString = data.join("@");

    authorize(function (authClient) {
        var request = {
            // The ID of the spreadsheet to update.
            spreadsheetId: spreadsheetID,

            resource: {
                // A list of updates to apply to the spreadsheet.
                // Requests will be applied in the order they are specified.
                // If any request is not valid, no requests will be applied.
                requests: [
                    {
                        "insertRange": {
                            "range": {
                                "sheetId": sheetId,
                                "startRowIndex": rowNumber,
                                "endRowIndex": rowNumber + 1
                            },
                            "shiftDimension": "ROWS"
                        }
                    },
                    {
                        "pasteData": {
                            "data": dataString,
                            "type": "PASTE_NORMAL",
                            "delimiter": "@",
                            "coordinate": {
                                "sheetId": sheetId,
                                "rowIndex": rowNumber
                            }
                        }
                    }
                ]
            },

            auth: authClient,
        };

        sheets.spreadsheets.batchUpdate(request, function (err, response) {
            if (err) {
                console.error(err);
                return;
            }

            if (dataOperation) {
                dataOperation(response);
            }
            //console.log("Inserted row(s).");
        });
    });
};

module.exports.fetchData = function (sheetrange) {
    return new Promise((resolve) => {
        exports.getDataFormulas(sheetrange, (response) => {
            resolve(response.data.values);
        });
    });
};

module.exports.fetchDescription = function (descriptionCell) {
    return new Promise((resolve) => {
        exports.getDataFormulas(descriptionCell, (response) => {
            resolve(response.data.values[0][0]);
        });
    });
};

function authorize(callback) {
    // TODO: Change placeholder below to generate authentication credentials. See
    // https://developers.google.com/sheets/quickstart/nodejs#step_3_set_up_the_sample
    //
    // Authorize using one of the following scopes:
    //   'https://www.googleapis.com/auth/drive'
    //   'https://www.googleapis.com/auth/drive.file'
    //   'https://www.googleapis.com/auth/drive.readonly'
    //   'https://www.googleapis.com/auth/spreadsheets'
    //   'https://www.googleapis.com/auth/spreadsheets.readonly'
    const privatekey = credentials.google;

    var authClient = new google.auth.JWT(
        privatekey.client_email,
        null,
        privatekey.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']);

    if (authClient == null) {
        console.log('authentication failed');
        return;
    }
    callback(authClient);
}
