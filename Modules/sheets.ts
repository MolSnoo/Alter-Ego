// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { google, sheets_v4 } from 'googleapis';
import { loadCredentials } from './credentialsLoader.ts';
import type { GaxiosResponseWithHTTP2, JWT } from 'googleapis-common';

export type SheetRange = `${string}!${string}`;
export type CellData = sheets_v4.Schema$CellData;
export type RowData = sheets_v4.Schema$RowData;
export type Request = sheets_v4.Schema$Request;
export type Spreadsheet = GaxiosResponseWithHTTP2<sheets_v4.Schema$Spreadsheet>;
type GetSheetRequest = sheets_v4.Params$Resource$Spreadsheets$Get;
type GetSheetValuesRequest = sheets_v4.Params$Resource$Spreadsheets$Values$Get;
type UpdateSheetValuesRequest = sheets_v4.Params$Resource$Spreadsheets$Values$Update;
type UpdateSheetValuesResponse = GaxiosResponseWithHTTP2<sheets_v4.Schema$UpdateValuesResponse>;
type BatchUpdateSheetValuesRequest = sheets_v4.Params$Resource$Spreadsheets$Values$Batchupdate;
type BatchUpdateSheetValuesResponse = GaxiosResponseWithHTTP2<sheets_v4.Schema$BatchUpdateValuesResponse>;
type AppendSheetValuesRequest = sheets_v4.Params$Resource$Spreadsheets$Values$Append;
type AppendSheetValuesResponse = GaxiosResponseWithHTTP2<sheets_v4.Schema$AppendValuesResponse>;
type BatchUpdateSheetRequest = sheets_v4.Params$Resource$Spreadsheets$Batchupdate;
type BatchUpdateSheetResponse = GaxiosResponseWithHTTP2<sheets_v4.Schema$BatchUpdateSpreadsheetResponse>;

const sheets = google.sheets({ version: 'v4' });

/**
 * Gets the values of the spreadsheet in the specified sheetRange.
 * @param sheetRange - The range to get in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param spreadsheetId - The ID of the spreadsheet to read.
 * @returns The values of the specified range in {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#ValueRange|ValueRange} format.
 */
export function getSheetValues(sheetRange: SheetRange, spreadsheetId: string): Promise<ValueRange> {
    const request: GetSheetValuesRequest = {
        // The ID of the spreadsheet to retrieve data from.
        spreadsheetId: spreadsheetId,

        // The A1 notation of the values to retrieve.
        range: sheetRange,

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
 * Gets the specified sheetRange of the spreadsheet, including its {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/sheets#GridProperties|GridProperties}.
 * @param sheetRange - The range to get in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param spreadsheetId - The ID of the spreadsheet to read.
 * @returns The specified range in the {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets#Spreadsheet|Spreadsheet}.
 */
export function getSheetWithProperties(sheetRange: SheetRange, spreadsheetId: string): Promise<Spreadsheet> {
    const request: GetSheetRequest = {
        spreadsheetId: spreadsheetId,

        ranges: [sheetRange],

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
 * Updates the values of the spreadsheet for a single sheetRange.
 * @param sheetRange - The range to update in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param data - An array of arrays of values to replace the values currently in the specified sheetRange.
 * @param spreadsheetId - The ID of the spreadsheet to update.
 * @returns An {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/UpdateValuesResponse|UpdateValuesResponse}.
 */
export function updateSheetValues(sheetRange: SheetRange, data: string[][], spreadsheetId: string): Promise<UpdateSheetValuesResponse> {
    const request: UpdateSheetValuesRequest = {
        spreadsheetId: spreadsheetId,

        range: sheetRange,

        valueInputOption: 'RAW',

        requestBody: {
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
 * Updates the values of the spreadsheet for multiple sheetRanges.
 * @param data - The ranges to update and the values to replace them with.
 * @param spreadsheetId - The ID of the spreadsheet to update.
 * @returns A {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate#response-body|BatchUpdateSheetValuesResponse}.
 */
export function batchUpdateSheetValues(data: ValueRange[], spreadsheetId: string): Promise<BatchUpdateSheetValuesResponse> {
    const request: BatchUpdateSheetValuesRequest = {
        spreadsheetId: spreadsheetId,

        requestBody: {
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
 * @param requests - An array of {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#Request|Requests}.
 * @param spreadsheetId - The ID of the spreadsheet to update.
 * @returns A {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate#response-body|BatchUpdateSheetResponse}.
 */
export function batchUpdateSheet(requests: Request[], spreadsheetId: string): Promise<BatchUpdateSheetResponse> {
    const request: BatchUpdateSheetRequest = {
        spreadsheetId: spreadsheetId,

        requestBody: {
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
 * Appends rows of values to the spreadsheet after the specified sheetRange.
 * @param sheetRange - The range to append rows to in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param data - An array of arrays of values to append to the spreadsheet after the specified sheetRange.
 * @param spreadsheetId - The ID of the spreadsheet to update.
 * @param overwrite - Whether or not to overwrite existing values at the end of the range. Defaults to false.
 * @returns An {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append#response-body|AppendSheetValuesResponse}.
 */
export function appendRowsToSheet(sheetRange: SheetRange, data: string[][], spreadsheetId: string, overwrite: boolean = false): Promise<AppendSheetValuesResponse> {
    // Google Sheets attempts to detect the table of existing data, and if there are any gaps,
    // it determines that to be where to append data. So, we need to extract only the first column in the range.
    // This ensures that rows will always be appended starting in the first column.
    const appendRange = sheetRange.includes(":") ? sheetRange.split(":")[0] : sheetRange;

    const request: AppendSheetValuesRequest = {
        spreadsheetId: spreadsheetId,

        range: appendRange,

        valueInputOption: 'RAW',

        insertDataOption: overwrite ? 'OVERWRITE' : 'INSERT_ROWS',

        requestBody: {
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

function authorize(): JWT {
    let credentials = loadCredentials();
    return new google.auth.JWT({
        email: credentials.google.client_email,
        key: credentials.google.private_key,
        keyId: credentials.google.private_key_id,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
}
