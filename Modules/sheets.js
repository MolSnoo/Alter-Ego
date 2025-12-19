import { createRequire } from 'node:module';
import { google } from 'googleapis';
const sheets = google.sheets({ version: 'v4' });

/**
 * Gets the values of the spreadsheet in the specified sheetrange.
 * @param {string} sheetrange - The range to get in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param {string} spreadsheetId - The ID of the spreadsheet to read.
 * @returns {Promise<ValueRange>} The values of the specified range in {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#ValueRange|ValueRange} format.
 */
export function getSheetValues (sheetrange, spreadsheetId) {
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

    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values.get(request).then(response => {
            resolve({ range: response.data.range, majorDimension: response.data.majorDimension, values: response.data.values });
        }).catch(err => reject(err));
    });
}

/**
 * Gets the specified sheetrange of the spreadsheet, including its {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/sheets#GridProperties|GridProperties}.
 * @param {string} sheetrange - The range to get in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param {string} spreadsheetId - The ID of the spreadsheet to read.
 * @returns {Promise<any>} The specified range in the {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets#Spreadsheet|Spreadsheet}.
 */
export function getSheetWithProperties (sheetrange, spreadsheetId) {
    const request = {
        spreadsheetId: spreadsheetId,

        ranges: [sheetrange],

        includeGridData: true,

        auth: authorize(),
    };

    return new Promise((resolve, reject) => {
        sheets.spreadsheets.get(request).then(response => {
            resolve(response);
        }).catch(err => reject(err));
    });
}

/**
 * Updates the values of the spreadsheet for a single sheetrange.
 * @param {string} sheetrange - The range to update in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param {string[][]} data - An array of arrays of values to replace the values currently in the specified sheetrange.
 * @param {string} spreadsheetId - The ID of the spreadsheet to update.
 * @returns {Promise<any>} An {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/UpdateValuesResponse|UpdateValuesResponse}.
 */
export function updateSheetValues (sheetrange, data, spreadsheetId) {
    const request = {
        spreadsheetId: spreadsheetId,

        range: sheetrange,

        valueInputOption: 'RAW',

        resource: {
            values: data,
        },

        auth: authorize(),
    };

    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values.update(request).then(response => {
            resolve(response);
        }).catch(err => reject(err));
    });
}

/**
 * Updates the values of the spreadsheet for multiple sheetranges.
 * @param {ValueRange[]} data - The ranges to update and the values to replace them with. 
 * @param {string} spreadsheetId - The ID of the spreadsheet to update.
 * @returns {Promise<any>} {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate#response-body}
 */
export function batchUpdateSheetValues (data, spreadsheetId) {
    const request = {
        spreadsheetId: spreadsheetId,

        resource: {
            valueInputOption: 'RAW',

            data: data
        },

        auth: authorize()
    };

    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values.batchUpdate(request).then(response => {
            resolve(response);
        }).catch(err => reject(err));
    });
}

/**
 * 
 * @param {object[]} requests - An array of {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#Request|Requests}.
 * @param {string} spreadsheetId - The ID of the spreadsheet to update.
 * @returns {Promise<any>} {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate#response-body}
 */
export function batchUpdateSheet (requests, spreadsheetId) {
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
            resolve(response);
        }).catch(err => reject(err));
    });
}

/**
 * Appends rows of values to the spreadsheet after the specified sheetrange.
 * @param {string} sheetrange - The range to append rows to in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param {string[][]} data - An array of arrays of values to append to the spreadsheet after the specified sheetrange.
 * @param {string} spreadsheetId - The ID of the spreadsheet to update.
 * @returns {Promise<any>} {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append#response-body}
 */
export function appendRowsToSheet (sheetrange, data, spreadsheetId) {
    const request = {
        spreadsheetId: spreadsheetId,

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
            resolve(response);
        }).catch(err => reject(err));
    });
}

function authorize() {
    const require = createRequire(import.meta.url);
    let credentials;
    if (process.env.VITEST)
        credentials = process.env.CREDENTIALS;
    else {
        try {
            credentials = require('../Configs/credentials.json');
        } 
        catch(err) {
            console.error('Could not load Configs/credentials.json:', err);
            return null;
        }
    }
    if (!credentials || !credentials.google) {
        console.error('Invalid credentials format in Configs/credentials.json');
        return null;
    }
    return new google.auth.JWT({
        email: credentials.google.client_email,
        key: credentials.google.private_key,
        keyId: credentials.google.private_key_id,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
}
