// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import GameConstants from '../Classes/GameConstants.ts';
import { loadDotEnv } from '../Modules/envLoader.ts';
import { loadCredentials } from '../Modules/credentialsLoader.ts';
import { getSheetValues } from '../Modules/sheets.js';
import { writeFile } from 'fs/promises';

async function main() {
	loadDotEnv();
	const credentials = loadCredentials();
	if (!credentials || !credentials.google) return console.warn('No usable Google credentials found in Configs/credentials.json. Execution cannot proceed.');

	// Fetch the master sheet and save it as JSON files for faster loading during testing.
	const constants = GameConstants.Instance;
	const masterTestSheetId = '1yFV7s2d7lGwK4pdit8_sib8ypNtXQviNx81TR2DjtRY';
	const entityMappings = [
		['roomSheetDataCells', './Test/__mocks__/gamedata/rooms.json'],
		['fixtureSheetDataCells', './Test/__mocks__/gamedata/fixtures.json'],
		['prefabSheetDataCells', './Test/__mocks__/gamedata/prefabs.json'],
		['recipeSheetDataCells', './Test/__mocks__/gamedata/recipes.json'],
		['roomItemSheetDataCells', './Test/__mocks__/gamedata/roomitems.json'],
		['puzzleSheetDataCells', './Test/__mocks__/gamedata/puzzles.json'],
		['eventSheetDataCells', './Test/__mocks__/gamedata/events.json'],
		['statusSheetDataCells', './Test/__mocks__/gamedata/statuseffects.json'],
		['playerSheetDataCells', './Test/__mocks__/gamedata/players.json'],
		['inventorySheetDataCells', './Test/__mocks__/gamedata/inventoryitems.json'],
		['gestureSheetDataCells', './Test/__mocks__/gamedata/gestures.json'],
		['flagSheetDataCells', './Test/__mocks__/gamedata/flags.json'],
	];

	for (const [sheetRangeConstant, fileWritePath] of entityMappings) {
		setTimeout(async () => {
			try {
				const range = constants[sheetRangeConstant];
				if (!range) {
					console.warn(`No range found for ${sheetRangeConstant}, skipping.`);
					return;
				}
				console.log(`Fetching ${sheetRangeConstant}.`);
				const sheet = await getSheetValues(range, masterTestSheetId);
				if (sheet && sheet.values) {
					await writeFile(
						fileWritePath,
						JSON.stringify(sheet.values, undefined, 2)
							.replace(/",\n +"/g, `", "`)
							.replace(/\[\n +"/g, `[ "`)
							.replace(/"\n +]/g, `" ]`),
					);
					console.log(`Wrote ${fileWritePath}.`);
				} else {
					console.warn(`No values returned for ${sheetRangeConstant}.`);
				}
			} catch (err) {
				console.error(`Failed to fetch ${sheetRangeConstant}:`, err);
			}
		}, 0);
	}
}

main().catch(err => {
	console.error(err);
	process.exit(0);
});
