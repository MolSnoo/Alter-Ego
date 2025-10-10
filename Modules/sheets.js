const { google } = require('googleapis');
const credentials = include('Configs/credentials.json');
var sheets = google.sheets('v4');

const settings = include('Configs/settings.json');
const spreadsheetID = settings.spreadsheetID;

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

module.exports.getDataWithProperties = function (sheetrange, dataOperation, spreadsheetId) {
    authorize(function (authClient) {
        if (!spreadsheetId) spreadsheetId = spreadsheetID;
        var request = {
            // The ID of the spreadsheet to retrieve data from.
            spreadsheetId: spreadsheetId,

            // The A1 notation of the values to retrieve.
            ranges: [sheetrange],

            // Boolean. True if grid data should be returned.
            includeGridData: true,

            auth: authClient,
        };

        sheets.spreadsheets.get(request, function (err, response) {
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
            valueInputOption: 'RAW',

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

module.exports.batchUpdateData = function (data, dataOperation) {
    return new Promise((resolve, reject) => {
        authorize(function (authClient) {
            var request = {
                // The ID of the spreadsheet to update.
                spreadsheetId: spreadsheetID,

                resource: {
                    // How the input data should be interpreted.
                    valueInputOption: 'RAW',

                    data: data
                },

                auth: authClient
            };

            sheets.spreadsheets.values.batchUpdate(request, function (err, response) {
                if (err) {
                    console.error(err);
                    reject(err);
                }

                if (dataOperation) {
                    dataOperation(response);
                }
                resolve();
            });
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
    return new Promise((resolve, reject) => {
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
                    reject(err);
                }

                if (dataOperation) {
                    dataOperation(response);
                }
                resolve();
            });
        });
    });
};

module.exports.appendRows = function (sheetrange, data, dataOperation) {
    return new Promise((resolve, reject) => {
        authorize(function (authClient) {
        var request = {
            // The ID of the spreadsheet to update.
            spreadsheetId: spreadsheetID,

            // The A1 notation of a range to search for a logical table of data.
            // Values will be appended after the last row of the table.
            range: sheetrange,

            // How the input data should be interpreted.
            valueInputOption: 'RAW',

            // How the input data should be inserted.
            insertDataOption: 'INSERT_ROWS',

            resource: {
                values: data,
            },

            auth: authClient,
        };

        sheets.spreadsheets.values.append(request, function (err, response) {
            if (err) {
                console.error(err);
                reject(err);
            }

            if (dataOperation) {
                dataOperation(response);
            }
            resolve();
        });
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
