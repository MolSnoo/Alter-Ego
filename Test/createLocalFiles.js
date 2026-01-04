import GameConstants from '../Classes/GameConstants.js';
import { getSheetValues } from '../Modules/sheets.js';
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import { createRequire } from 'node:module';

async function main() {
    // Copy the default config files into the Configs folder.
    const configMappings = [
        ['./Defaults/default_credentials.json', './Configs/credentials.json'],
        ['./Defaults/default_demodata.json', './Configs/demodata.json'],
        ['./Defaults/default_playerdefaults.json', './Configs/playerdefaults.json'],
        ['./Defaults/default_serverconfig.json', './Configs/serverconfig.json'],
        ['./Defaults/default_settings.json', './Configs/settings.json']
    ];
    for (const [defaultsFilePath, configsFilePath] of configMappings) {
        const configFileExists = existsSync(configsFilePath);
        if (!configFileExists) {
            console.log(`File does not exist: ${configsFilePath}. Attempting to copy from Defaults directory...`);
            const defaultFileExists = existsSync(defaultsFilePath);
            if (!defaultFileExists) {
                console.warn(`No such file exists: ${defaultsFilePath}, skipping.`);
                continue;
            }
            copyFileSync(defaultsFilePath, configsFilePath);
            console.log(`Wrote ${configsFilePath}.`);
        }
    }

    // If there are still no valid credentials, skip the rest.
    const require = createRequire(import.meta.url);
    let credentials = null;
    try { 
        credentials = require('../Configs/credentials.json');
    } catch (err) { credentials = null; }
    if (!credentials || !credentials.google)
        return console.warn('No usable Google credentials found in Configs/credentials.json. Execution cannot proceed.');
    
    // Fetch the master sheet and save it as JSON files for faster loading during testing.
    const constants = new GameConstants();
    const masterTestSheetId = "1yFV7s2d7lGwK4pdit8_sib8ypNtXQviNx81TR2DjtRY";
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
        ['flagSheetDataCells', './Test/__mocks__/gamedata/flags.json']
    ];

    for (const [sheetRangeConstant, fileWritePath] of entityMappings) {
        try {
            const range = constants[sheetRangeConstant];
            if (!range) { 
                console.warn(`No range found for ${sheetRangeConstant}, skipping.`);
                continue;
            }
            console.log(`Fetching ${sheetRangeConstant}.`);
            const sheet = await getSheetValues(range, masterTestSheetId);
            if (sheet && sheet.values){
                writeFileSync(fileWritePath, JSON.stringify(sheet.values, undefined, 2).replace(/",\n +"/g, `", "`).replace(/\[\n +"/g, `[ "`).replace(/"\n +]/g, `" ]`));
                console.log(`Wrote ${fileWritePath}.`);
            } else {
                console.warn(`No values returned for ${sheetRangeConstant}.`);
            }
        }
		catch(err) {
            console.error(`Failed to fetch ${sheetRangeConstant}:`, err);
        }
    }
}

main().catch(err => {
	console.error(err);
	process.exit(0);
});
