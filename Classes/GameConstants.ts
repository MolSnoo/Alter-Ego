import type { SheetRange } from "../Modules/sheets.ts";

/**
 * A collection of constants used to refer to cell ranges on the spreadsheet.
 */
export default class GameConstants {
    /**
     * The single instance of these constants that can exist.
     */
    static #instance: GameConstants;

    readonly roomSheetDataCells: SheetRange = "Rooms!A2:M";
    readonly roomSheetSaveCells: SheetRange = "Rooms!D2:M";
    readonly roomSheetDescriptionColumn: SheetRange = "Rooms!M";
    /** @deprecated Use fixtureSheetDataCells instead. */
    readonly objectSheetDataCells: SheetRange = "Objects!A2:K";
    /** @deprecated Use fixtureSheetDescriptionColumn instead. */
    readonly objectSheetDescriptionColumn: SheetRange = "Objects!K";
    readonly fixtureSheetDataCells: SheetRange = "Fixtures!A2:K";
    readonly fixtureSheetDescriptionColumn: SheetRange = "Fixtures!K";
    readonly prefabSheetDataCells: SheetRange = "Prefabs!A2:S";
    readonly prefabSheetDescriptionColumn: SheetRange = "Prefabs!S";
    readonly recipeSheetDataCells: SheetRange = "Recipes!A2:H";
    readonly recipeSheetInitiatedColumn: SheetRange = "Recipes!F";
    readonly recipeSheetCompletedColumn: SheetRange = "Recipes!G";
    readonly recipeSheetUncraftedColumn: SheetRange = "Recipes!H";
    /** @deprecated Use roomItemSheetDataCells instead. */
    readonly itemSheetDataCells: SheetRange = "Items!A2:H";
    /** @deprecated Use roomItemSheetDescriptionColumn instead. */
    readonly itemSheetDescriptionColumn: SheetRange = "Items!H";
    readonly roomItemSheetDataCells: SheetRange = "Room Items!A2:H";
    readonly roomItemSheetDescriptionColumn: SheetRange = "Room Items!H";
    readonly puzzleSheetDataCells: SheetRange = "Puzzles!A2:R";
    readonly puzzleSheetCorrectColumn: SheetRange = "Puzzles!M";
    readonly puzzleSheetAlreadySolvedColumn: SheetRange = "Puzzles!N";
    readonly puzzleSheetUnsolvedColumn: SheetRange = "Puzzles!O";
    readonly puzzleSheetIncorrectColumn: SheetRange = "Puzzles!P";
    readonly puzzleSheetNoMoreAttemptsColumn: SheetRange = "Puzzles!Q";
    readonly puzzleSheetRequirementsNotMetColumn: SheetRange = "Puzzles!R";
    readonly eventSheetDataCells: SheetRange = "Events!A2:K";
    readonly eventSheetTriggeredColumn: SheetRange = "Events!J";
    readonly eventSheetEndedColumn: SheetRange = "Events!K";
    readonly statusSheetDataCells: SheetRange = "Status Effects!A2:N";
    readonly statusSheetInflictedColumn: SheetRange = "Status Effects!M";
    readonly statusSheetCuredColumn: SheetRange = "Status Effects!N";
    readonly playerSheetDataCells: SheetRange = "Players!A3:O";
    readonly playerSheetDescriptionColumn: SheetRange = "Players!O";
    readonly inventorySheetDataCells: SheetRange = "Inventory Items!A2:H";
    readonly inventorySheetDescriptionColumn: SheetRange = "Inventory Items!H";
    readonly gestureSheetDataCells: SheetRange = "Gestures!A2:E";
    readonly flagSheetDataCells: SheetRange = "Flags!A2:D";

    private constructor() {
        if (GameConstants.#instance) {
            return GameConstants.#instance;
        }

        GameConstants.#instance = this;
    }

    /**
     * The single instance of these constants that can exist.
     */
    public static get Instance() {
        if (GameConstants.#instance) return GameConstants.#instance;
        else return this.#instance = new this();
    }
}
