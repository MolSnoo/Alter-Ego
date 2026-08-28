// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import demodata from "../Configs/demodata.json" with { type: 'json' };
import { batchUpdateSheetValues } from "../Modules/sheets.ts";
import type Game from "../Data/Game.ts";

/**
 * A set of functions to load and validate GameEntities.
 */
export default class GameEntitySaver {
    /**
     * The game this belongs to.
     */
    readonly #game: Game;

    /**
     * @param game - The game this belongs to.
     */
    constructor(game: Game) {
        this.#game = game;
    }

    /**
     * Saves the current game state to the spreadsheet.
     * @param deletedItemsCount - The number of deleted rows from the Items sheet. Inserts that many blank rows after the remaining items. Defaults to 0.
     * @param deletedInventoryItemsCount - The number of deleted rows from the Inventory Items sheet. Inserts that many blank rows after the remaining inventory items. Defaults to 0.
     * @returns An Error, if there is one.
     */
    async saveGame(deletedItemsCount: number = 0, deletedInventoryItemsCount: number = 0): Promise<Error | void> {
        return new Promise(async (resolve, reject) => {
            let data: ValueRange[] = [];

            let roomValues: string[][] = [];
            this.#game.rooms.forEach(room => {
                room.exits.forEach(exit => {
                    const firstExit = room.exits.firstKey() === exit.name;
                    roomValues.push([
                        firstExit ? room.displayName : "",
                        firstExit ? Array.from(room.tags).join(", ") : "",
                        firstExit ? room.iconURL : "",
                        exit.name,
                        exit.phrase,
                        Array.from(exit.tags).join(", "),
                        String(exit.pos.x),
                        String(exit.pos.y),
                        String(exit.pos.z),
                        exit.unlocked ? "TRUE" : "FALSE",
                        exit.dest.displayName,
                        exit.link,
                        exit.description.text
                    ]);
                });
            });
            data.push({ range: this.#game.constants.roomSheetDataCells, values: roomValues });

            let fixtureValues: string[][] = [];
            this.#game.fixtures.forEach(fixture => {
                fixtureValues.push([
                    fixture.name,
                    fixture.location.displayName,
                    fixture.accessible ? "TRUE" : "FALSE",
                    fixture.childPuzzleName,
                    fixture.recipeTag,
                    fixture.activatable ? "TRUE" : "FALSE",
                    fixture.activated ? "TRUE" : "FALSE",
                    fixture.autoDeactivate ? "TRUE" : "FALSE",
                    String(fixture.hidingSpotCapacity),
                    fixture.preposition,
                    fixture.description.text
                ]);
            });
            data.push({ range: this.#game.constants.fixtureSheetDataCells, values: fixtureValues });

            let roomItemValues: string[][] = [];
            this.#game.roomItems.forEach((roomItem, i) => {
                roomItemValues.push([
                    roomItem.prefab.id,
                    roomItem.identifier,
                    roomItem.location.displayName,
                    roomItem.accessible ? "TRUE" : "FALSE",
                    `${roomItem.containerType}: ${roomItem.containerName}`,
                    !isNaN(roomItem.quantity) ? String(roomItem.quantity) : "",
                    !isNaN(roomItem.uses) ? String(roomItem.uses) : "",
                    roomItem.description.text
                ]);
                // If any items were deleted, row numbers may be incorrect. Fix them now.
                if (deletedItemsCount > 0) {
                    if (i === 0) this.#game.roomItems[i].setRow(2);
                    else this.#game.roomItems[i].setRow(this.#game.roomItems[i - 1].row + 1);
                }
            });
            for (let i = 0; i < deletedItemsCount; i++)
                roomItemValues.push([
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ]);
            data.push({ range: this.#game.constants.roomItemSheetDataCells, values: roomItemValues });

            let puzzleValues: string[][] = [];
            this.#game.puzzles.forEach(puzzle => {
                let requirementStrings: string[] = [];
                puzzle.requirementsStrings.forEach(requirementString => {
                    if (requirementString.type === "") requirementStrings.push(requirementString.entityId);
                    else requirementStrings.push(`${requirementString.type}: ${requirementString.entityId}`);
                });
                puzzleValues.push([
                    puzzle.name,
                    puzzle.solved ? "TRUE" : "FALSE",
                    puzzle.outcome,
                    puzzle.requiresMod ? "TRUE" : "FALSE",
                    puzzle.location.displayName,
                    puzzle.parentFixtureName,
                    puzzle.type,
                    puzzle.accessible ? "TRUE" : "FALSE",
                    requirementStrings.join(", "),
                    puzzle.solutions.join(", "),
                    !isNaN(puzzle.remainingAttempts) ? String(puzzle.remainingAttempts) : "",
                    puzzle.commandSetsString,
                    puzzle.correctDescription.text,
                    puzzle.alreadySolvedDescription.text,
                    puzzle.unsolvedDescription.text,
                    puzzle.incorrectDescription.text,
                    puzzle.noMoreAttemptsDescription.text,
                    puzzle.requirementsNotMetDescription.text
                ]);
            });
            data.push({ range: this.#game.constants.puzzleSheetDataCells, values: puzzleValues });

            let eventValues: string[][] = [];
            this.#game.events.forEach(event => {
                eventValues.push([
                    event.id,
                    event.ongoing ? "TRUE" : "FALSE",
                    event.durationString,
                    event.remainingString,
                    event.triggerTimesStrings.join(", "),
                    event.roomTag,
                    event.commandsString,
                    event.effectsStrings.join(", "),
                    event.refreshesStrings.join(", "),
                    event.triggeredNarration.text,
                    event.endedNarration.text
                ]);
            });
            data.push({ range: this.#game.constants.eventSheetDataCells, values: eventValues });

            let playerValues: string[][] = [];
            this.#game.players.forEach(player => {
                playerValues.push([
                    player.id,
                    player.name,
                    player.title,
                    player.pronounString,
                    player.originalVoiceString,
                    String(player.defaultStrength),
                    String(player.defaultPerception),
                    String(player.defaultDexterity),
                    String(player.defaultSpeed),
                    String(player.defaultStamina),
                    player.alive ? "TRUE" : "FALSE",
                    player.location ? player.location.displayName : "",
                    player.hidingSpot ? player.hidingSpot : "",
                    player.getStatusList(true, true),
                    player.description.text
                ]);
            });
            data.push({ range: this.#game.constants.playerSheetDataCells, values: playerValues });

            let inventoryValues: string[][] = [];
            this.#game.inventoryItems.forEach((inventoryItem, i) => {
                inventoryValues.push([
                    inventoryItem.player.name,
                    inventoryItem.prefab ? inventoryItem.prefab.id : "NULL",
                    inventoryItem.identifier,
                    inventoryItem.equipmentSlot,
                    inventoryItem.containerName,
                    !isNaN(inventoryItem.quantity) && inventoryItem.quantity !== null ? String(inventoryItem.quantity) : "",
                    !isNaN(inventoryItem.uses) && inventoryItem.uses !== null ? String(inventoryItem.uses) : "",
                    inventoryItem.description.text
                ]);
                // If any inventory items were deleted, row numbers may be incorrect. Fix them now.
                if (deletedInventoryItemsCount > 0) {
                    if (i === 0) this.#game.inventoryItems[i].setRow(2);
                    else this.#game.inventoryItems[i].setRow(this.#game.inventoryItems[i - 1].row + 1);
                }
            });
            for (let i = 0; i < deletedInventoryItemsCount; i++)
                inventoryValues.push([
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ]);
            data.push({ range: this.#game.constants.inventorySheetDataCells, values: inventoryValues });

            let flagValues: string[][] = [];
            this.#game.flags.forEach(flag => {
                flagValues.push([
                    flag.id,
                    flag.value === null ? "" : flag.value === true ? "TRUE" : flag.value === false ? "FALSE" : String(flag.value),
                    flag.valueScript,
                    flag.commandSetsString
                ]);
            });
            data.push({ range: this.#game.constants.flagSheetDataCells, values: flagValues });

            try {
                await batchUpdateSheetValues(data, this.#game.settings.spreadsheetID);
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Sets up a small demo environment on the spreadsheet. Overwrites anything that may already be on the spreadsheet.
     * @returns A set of room data formatted as spreadsheet cells.
     */
    async setupDemo(): Promise<string[][]> {
        return new Promise(async (resolve, reject) => {
            let data: ValueRange[] = [];

            const roomValues = demodata.rooms;
            const fixtureValues = demodata.fixtures;
            const prefabValues = demodata.prefabs;
            const recipeValues = demodata.recipes;
            const roomItemValues = demodata.roomItems;
            const puzzleValues = demodata.puzzles;
            const eventValues = demodata.events;
            const statusValues = demodata.statusEffects;
            const gestureValues = demodata.gestures;
            const flagValues = demodata.flags;

            data.push({ range: this.#game.constants.roomSheetDataCells, values: roomValues });
            data.push({ range: this.#game.constants.fixtureSheetDataCells, values: fixtureValues });
            data.push({ range: this.#game.constants.prefabSheetDataCells, values: prefabValues });
            data.push({ range: this.#game.constants.recipeSheetDataCells, values: recipeValues });
            data.push({ range: this.#game.constants.roomItemSheetDataCells, values: roomItemValues });
            data.push({ range: this.#game.constants.puzzleSheetDataCells, values: puzzleValues });
            data.push({ range: this.#game.constants.eventSheetDataCells, values: eventValues });
            data.push({ range: this.#game.constants.statusSheetDataCells, values: statusValues });
            data.push({ range: this.#game.constants.gestureSheetDataCells, values: gestureValues });
            data.push({ range: this.#game.constants.flagSheetDataCells, values: flagValues });

            try {
                await batchUpdateSheetValues(data, this.#game.settings.spreadsheetID);
                resolve(roomValues);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
