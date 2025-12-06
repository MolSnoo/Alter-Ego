import { google } from 'googleapis';
const sheets = google.sheets({ version: 'v4' });

import settings from '../Configs/settings.json' with { type: 'json' };
import credentials from '../Configs/credentials.json' with { type: 'json' };
const spreadsheetID = settings.spreadsheetID;

export function getData (sheetrange, dataOperation, spreadsheetId) {
    if (!spreadsheetId) spreadsheetId = spreadsheetID;
    const request = {
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

        auth: authorize(),
    };

    sheets.spreadsheets.values.get(request).then(response => {
        if (dataOperation)
            dataOperation(response);
    }).catch(err => console.error(err));
}

export function getDataWithProperties (sheetrange, dataOperation, spreadsheetId) {
    if (!spreadsheetId) spreadsheetId = spreadsheetID;
    const request = {
        spreadsheetId: spreadsheetId,

        ranges: [sheetrange],

        includeGridData: true,

        auth: authorize(),
    };

    sheets.spreadsheets.get(request).then(response => {
        if (dataOperation)
            dataOperation(response);
    }).catch(err => console.error(err));
}

export function updateData (sheetrange, data, dataOperation) {
    const request = {
        spreadsheetId: spreadsheetID,

        range: sheetrange,

        valueInputOption: 'RAW',

        resource: {
            values: data,
        },

        auth: authorize(),
    };

    sheets.spreadsheets.values.update(request).then(response => {
        if (dataOperation)
            dataOperation(response);
    }).catch(err => console.error(err));
}

export function batchUpdateData (data, dataOperation) {
    const request = {
        spreadsheetId: spreadsheetID,

        resource: {
            valueInputOption: 'RAW',

            data: data
        },

        auth: authorize()
    };

    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values.batchUpdate(request).then(response => {
            if (dataOperation)
                dataOperation(response);
            resolve();
        }).catch(err => reject(err));
    });
}

export function batchUpdate (requests, dataOperation, spreadsheetId) {
    if (!spreadsheetId) spreadsheetId = spreadsheetID;
    const request = {
        spreadsheetId: spreadsheetId,

        resource: {
            // A list of updates to apply to the spreadsheet.
            // Requests will be applied in the order they are specified.
            // If any request is not valid, no requests will be applied.
            requests: requests
        },

        auth: authorize()
    };

    return new Promise((resolve, reject) => {
        sheets.spreadsheets.batchUpdate(request).then(response => {
            if (dataOperation)
                dataOperation(response);
            resolve();
        }).catch(err => reject(console.error(err)));
    });
}

export function appendRows (sheetrange, data, dataOperation) {
    const request = {
        spreadsheetId: spreadsheetID,

        range: sheetrange,

        valueInputOption: 'RAW',

        insertDataOption: 'INSERT_ROWS',

        resource: {
            values: data,
        },

        auth: authorize()
    };

    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values.append(request).then(response => {
            if (dataOperation)
                dataOperation(response);
            resolve();
        }).catch(err => reject(err));
    });
}

function authorize() {
    return new google.auth.JWT({
        email: credentials.google.client_email,
        key: credentials.google.private_key,
        keyId: credentials.google.private_key_id,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
}
