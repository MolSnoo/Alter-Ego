import { readFileSync } from "fs";

const dataMap = new Map();

/**
 * @param {string} sheetrange 
 * @param {string[][]} values 
 */
export function __setMock(sheetrange, values) {
	dataMap.set(sheetrange, values);
}

export function __clearMock() {
	dataMap.clear();
}

/**
 * Gets the values of the spreadsheet in the specified sheetrange.
 * @param {string} sheetrange - The range to get in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param {string} spreadsheetId - The ID of the spreadsheet to read.
 * @returns {Promise<ValueRange>} The values of the specified range in {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values#ValueRange|ValueRange} format.
 */
export async function getSheetValues(sheetrange, spreadsheetId) {
	let values;
	let filename = getGameDataFileName(sheetrange);
	if (dataMap.size === 0 && filename) {
		values = JSON.parse(readFileSync(`./Test/__mocks__/gamedata/${filename}`).toString());
	}
	else values = dataMap.get(sheetrange);
	return { range: sheetrange, majorDimension: 'ROWS', values: values || [] };
}

/**
 * Gets the specified sheetrange of the spreadsheet, including its {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/sheets#GridProperties|GridProperties}.
 * @param {string} sheetrange - The range to get in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param {string} spreadsheetId - The ID of the spreadsheet to read.
 * @returns {Promise<any>} The specified range in the {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets#Spreadsheet|Spreadsheet}.
 */
export async function getSheetWithProperties(sheetrange, spreadsheetId) {
	return { range: sheetrange, spreadsheetId, data: dataMap.get(sheetrange) || [] };
}

/**
 * Updates the values of the spreadsheet for a single sheetrange.
 * @param {string} sheetrange - The range to update in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param {string[][]} data - An array of arrays of values to replace the values currently in the specified sheetrange.
 * @param {string} spreadsheetId - The ID of the spreadsheet to update.
 * @returns {Promise<any>} An {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/UpdateValuesResponse|UpdateValuesResponse}.
 */
export async function updateSheetValues(sheetrange, data, spreadsheetId) {
	return { status: 'mocked' };
}

/**
 * Updates the values of the spreadsheet for multiple sheetranges.
 * @param {ValueRange[]} data - The ranges to update and the values to replace them with. 
 * @param {string} spreadsheetId - The ID of the spreadsheet to update.
 * @returns {Promise<any>} {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate#response-body}
 */
export async function batchUpdateSheetValues(data, spreadsheetId) {
	return { status: 'mocked' };
}

/**
 * 
 * @param {object[]} requests - An array of {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#Request|Requests}.
 * @param {string} spreadsheetId - The ID of the spreadsheet to update.
 * @returns {Promise<any>} {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate#response-body}
 */
export async function batchUpdateSheet(requests, spreadsheetId) {
	return { status: 'mocked' };
}

/**
 * Appends rows of values to the spreadsheet after the specified sheetrange.
 * @param {string} sheetrange - The range to append rows to in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
 * @param {string[][]} data - An array of arrays of values to append to the spreadsheet after the specified sheetrange.
 * @param {string} spreadsheetId - The ID of the spreadsheet to update.
 * @returns {Promise<any>} {@link https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append#response-body}
 */
export async function appendRowsToSheet(sheetrange, data, spreadsheetId) {
	return { status: 'mocked' };
}

/** 
 * Gets the file name to load from based on the sheetrange.
 * @param {string} sheetrange - The range to append rows to in {@link https://developers.google.com/workspace/sheets/api/guides/concepts#cell|A1 notation}.
*/
function getGameDataFileName(sheetrange) {
	switch (sheetrange) {
		case game.constants.roomSheetDataCells:
			return "rooms.json";
		case game.constants.fixtureSheetDataCells:
			return "fixtures.json";
		case game.constants.prefabSheetDataCells:
			return "prefabs.json";
		case game.constants.recipeSheetDataCells:
			return "recipes.json";
		case game.constants.roomItemSheetDataCells:
			return "roomitems.json";
		case game.constants.puzzleSheetDataCells:
			return "puzzles.json";
		case game.constants.eventSheetDataCells:
			return "events.json";
		case game.constants.statusSheetDataCells:
			return "statuseffects.json";
		case game.constants.playerSheetDataCells:
			return "players.json";
		case game.constants.inventorySheetDataCells:
			return "inventoryitems.json";
		case game.constants.gestureSheetDataCells:
			return "gestures.json";
		case game.constants.flagSheetDataCells:
			return "flags.json";
	}
}

export default {
	__setMock,
	__clearMock,
	getSheetValues,
	getSheetWithProperties,
	updateSheetValues,
	batchUpdateSheetValues,
	batchUpdateSheet,
	appendRowsToSheet,
};
