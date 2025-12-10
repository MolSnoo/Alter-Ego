/**
 * @class GameConstants
 * @classdesc A collection of constants used to refer to cell ranges on the spreadsheet.
 */
export default class GameConstants {
	/** @type {GameConstants} */
	static instance;
	
	roomSheetDataCells = "Rooms!A2:K";
    roomSheetSaveCells = "Rooms!D2:K";
    roomSheetDescriptionColumn = "Rooms!K";
    /** @deprecated */
    objectSheetDataCells = "Objects!A2:K";
    /** @deprecated */
    objectSheetDescriptionColumn = "Objects!K";
    fixtureSheetDataCells = "Objects!A2:K";
    fixtureSheetDescriptionColumn = "Objects!K";
    prefabSheetDataCells = "Prefabs!A2:S";
    prefabSheetDescriptionColumn = "Prefabs!S";
    recipeSheetDataCells = "Recipes!A2:H";
    recipeSheetInitiatedColumn = "Recipes!F";
    recipeSheetCompletedColumn = "Recipes!G";
    recipeSheetUncraftedColumn = "Recipes!H";
    /** @deprecated */
    itemSheetDataCells = "Items!A2:H";
    /** @deprecated */
    itemSheetDescriptionColumn = "Items!H";
    roomItemSheetDataCells = "Items!A2:H";
    roomItemSheetDescriptionColumn = "Items!H";
    puzzleSheetDataCells = "Puzzles!A2:Q";
    puzzleSheetCorrectColumn = "Puzzles!M";
    puzzleSheetAlreadySolvedColumn = "Puzzles!N";
    puzzleSheetIncorrectColumn = "Puzzles!O";
    puzzleSheetNoMoreAttemptsColumn = "Puzzles!P";
    puzzleSheetRequirementsNotMetColumn = "Puzzles!Q";
    eventSheetDataCells = "Events!A2:K";
    eventSheetTriggeredColumn = "Events!J";
    eventSheetEndedColumn = "Events!K";
    statusSheetDataCells = "Status Effects!A2:N";
    statusSheetInflictedColumn = "Status Effects!M";
    statusSheetCuredColumn = "Status Effects!N";
    playerSheetDataCells = "Players!A3:O";
    playerSheetDescriptionColumn = "Players!O";
    inventorySheetDataCells = "Inventory Items!A2:H";
    inventorySheetDescriptionColumn = "Inventory Items!H";
    gestureSheetDataCells = "Gestures!A2:E";
    flagSheetDataCells = "Flags!A2:D";
    
	constructor() {
		if (GameConstants.instance) {
			return GameConstants.instance;
		}

		GameConstants.instance = this;
	}
}