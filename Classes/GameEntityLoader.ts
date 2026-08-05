// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Game from '../Data/Game.ts';
import GameEntityManager from './GameEntityManager.ts';
import Exit from '../Data/Exit.ts';
import Room from '../Data/Room.ts';
import Fixture from '../Data/Fixture.ts';
import Prefab from '../Data/Prefab.ts';
import InventorySlot from '../Data/InventorySlot.ts';
import type ItemInstance from '../Data/ItemInstance.ts';
import Recipe from '../Data/Recipe.ts';
import RecipeItem from '../Data/RecipeItem.ts';
import RoomItem from '../Data/RoomItem.ts';
import { default as Puzzle, type PuzzleRequirement, type PuzzleCommandSet } from '../Data/Puzzle.ts';
import Event from '../Data/Event.ts';
import EquipmentSlot from '../Data/EquipmentSlot.ts';
import InventoryItem from '../Data/InventoryItem.ts';
import Status from '../Data/Status.ts';
import Player from '../Data/Player.ts';
import Gesture from '../Data/Gesture.ts';
import { default as Flag, type FlagCommandSet } from '../Data/Flag.ts';
import InflictAction from '../Data/Actions/InflictAction.ts';
import { getSheetValues } from '../Modules/sheets.js';
import { round, convertTimeStringToDurationUnits, parseDuration, validateDuration } from '../Modules/helpers.ts';
import { parsePrefabPossibleNames } from '../Modules/stringDataExtractor.ts';
import { ChannelType, Collection, type TextChannel, type GuildMember } from 'discord.js';
import { Duration } from 'luxon';

/**
 * A set of functions to load and validate GameEntities.
 */
export default class GameEntityLoader extends GameEntityManager {
    /**
     * An array of all mandatory Status Effects by ID. If there exists no Status Effect by an ID in this array, Alter Ego will log an error when loading Status Effects.
     */
    static readonly mandatoryStatusEffects: string[] = ["heated", "weary", "asleep", "hidden", "concealed"];

    /**
     * @param game - The game this belongs to.
     */
    constructor(game: Game) {
        super(game);
    }

    /**
     * Clears all game data from memory.
     */
    clearAll() {
        this.clearGame();
    }

    /**
     * Loads all entities into the game.
     * @param startGame - Whether or not to start the game. Defaults to `false`.
     * @param sendPlayerRoomDescriptions - Whether or not to send all players the description of the room they loaded into. Defaults to `false`.
     * @returns A string indicating whether or not data was loaded successfully, or whether there were errors found.
     */
    loadAll(startGame: boolean = false, sendPlayerRoomDescriptions: boolean = false): Promise<string> {
        return new Promise(async (resolve) => {
            let errors: Error[] = [];
            // Load all entities into the game in an order that takes into account all of the entities they depend on.
            const statusEffectCount = await this.loadStatusEffects(false, errors);
            const gestureCount = await this.loadGestures(false, errors);
            const prefabCount = await this.loadPrefabs(false, errors);
            const recipeCount = await this.loadRecipes(false, errors);
            const roomCount = await this.loadRooms(false, errors);
            const eventCount = await this.loadEvents(false, errors);
            const playerCount = await this.loadPlayers(false, errors);
            const inventoryItemCount = this.game.inventoryItems.length;
            const fixtureCount = await this.loadFixtures(false, errors);
            const puzzleCount = await this.loadPuzzles(false, errors);
            const roomItemCount = await this.loadRoomItems(false, errors);
            const flagCount = await this.loadFlags(false, errors);

            for (const room of this.game.rooms.values()) {
                const error = this.checkRoom(room);
                if (error instanceof Error) errors.push(error);
            }
            for (const fixture of this.game.fixtures) {
                const error = this.checkFixture(fixture);
                if (error instanceof Error) errors.push(error);
            }
            for (const prefab of this.game.prefabs.values()) {
                const error = this.checkPrefab(prefab);
                if (error instanceof Error) errors.push(error);
            }
            for (const recipe of this.game.recipes) {
                const error = this.checkRecipe(recipe);
                if (error instanceof Error) errors.push(error);
            }
            for (const roomItem of this.game.roomItems) {
                const error = this.checkRoomItem(roomItem);
                if (error instanceof Error) errors.push(error);
            }
            for (const puzzle of this.game.puzzles) {
                const error = this.checkPuzzle(puzzle);
                if (error instanceof Error) errors.push(error);
            }
            for (const event of this.game.events.values()) {
                const error = this.checkEvent(event);
                if (error instanceof Error) errors.push(error);
            }
            for (const statusEffect of this.game.statusEffects.values()) {
                const error = this.checkStatusEffect(statusEffect);
                if (error instanceof Error) errors.push(error);
            }
            for (const player of this.game.players.values()) {
                const error = await this.checkPlayer(player);
                if (error instanceof Error) errors.push(error);
            }
            for (const inventoryItem of this.game.inventoryItems) {
                const error = this.checkInventoryItem(inventoryItem);
                if (error instanceof Error) errors.push(error);
            }
            for (const gesture of this.game.gestures.values()) {
                const error = this.checkGesture(gesture);
                if (error instanceof Error) errors.push(error);
            }
            for (const flag of this.game.flags.values()) {
                const error = this.checkFlag(flag);
                if (error instanceof Error) errors.push(error);
            }
            if (errors.length > 0) {
                errors = this.#trimErrors(errors);
                resolve(errors.join('\n'));
            }
            else {
                if (startGame) {
                    this.game.inProgress = true;
                    this.game.canJoin = false;
                    if (!this.game.settings.debug)
                        this.game.clientContext.updatePresence();
                    if (sendPlayerRoomDescriptions) {
                        this.game.livingPlayers.forEach(player => {
                            player.location.description.parseAndSendTo(player, player.location);
                        });
                    }
                }

                // Start event timers.
                this.game.events.forEach(event => {
                    if (event.ongoing && event.duration !== null)
                        event.startTimer();
                    if (event.ongoing && (event.effects.length > 0 || event.refreshes.length > 0))
                        event.startEffectsTimer();
                });

                let message = `${roomCount} rooms, ` +
                    `${fixtureCount} fixtures, ` +
                    `${prefabCount} prefabs, ` +
                    `${recipeCount} recipes, ` +
                    `${roomItemCount} room items, ` +
                    `${puzzleCount} puzzles, ` +
                    `${eventCount} events, ` +
                    `${statusEffectCount} status effects, ` +
                    `${playerCount} players, ` +
                    `${inventoryItemCount} inventory items, ` +
                    `${gestureCount} gestures, and ` +
                    `${flagCount} flags retrieved.`
                if (startGame) {
                    message += `\nThe game has started.`;
                    if (sendPlayerRoomDescriptions)
                        message += ` All players have been sent room descriptions.`;
                }
                resolve(message);
            }
        });
    }

    /**
     * Loads rooms into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadRooms(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getRooms(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.rooms);
                resolve(this.game.rooms.size);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }

    /**
     * Loads fixtures into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadFixtures(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getFixtures(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.fixtures);
                resolve(this.game.fixtures.length);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }

    /**
     * Loads prefabs into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadPrefabs(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getPrefabs(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.prefabs);
                resolve(this.game.prefabs.size);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }

    /**
     * Loads recipes into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadRecipes(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getRecipes(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.recipes);
                resolve(this.game.recipes.length);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }

    /**
     * Loads room items into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadRoomItems(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getRoomItems(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.roomItems);
                resolve(this.game.roomItems.length);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }

    /**
     * Loads puzzles into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadPuzzles(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getPuzzles(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.puzzles);
                resolve(this.game.puzzles.length);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }

    /**
     * Loads events into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadEvents(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getEvents(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.events);
                resolve(this.game.events.size);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }

    /**
     * Loads status effects into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadStatusEffects(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getStatusEffects(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.statusEffects);
                resolve(this.game.statusEffects.size);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }

    /**
     * Loads players into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadPlayers(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getPlayers(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.players);
                resolve(this.game.players.size);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }


    /**
     * Loads inventory items into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadInventoryItems(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getInventoryItems(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.inventoryItems);
                resolve(this.game.inventoryItems.length);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }


    /**
     * Loads gestures into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadGestures(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getGestures(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.gestures);
                resolve(this.game.gestures.size);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }


    /**
     * Loads flags into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     * @param errors - A list of errors that have already been found.
     * @returns The number of entities loaded.
     */
    loadFlags(doErrorChecking: boolean, errors: Error[] = []): Promise<number> {
        return new Promise(async (resolve) => {
            try {
                await this.#getFlags(doErrorChecking);
                if (this.game.settings.debug) this.#printData(this.game.flags);
                resolve(this.game.flags.size);
            }
            catch (error) {
                errors.push(...error);
                resolve(0);
            }
        });
    }

    /**
     * Loads data from the Rooms sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getRooms(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.roomSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnRoomDisplayName = 0;
            const columnRoomTags = 1;
            const columnRoomIconUrl = 2;
            const columnExitName = 3;
            const columnExitPhrase = 4;
            const columnExitTags = 5;
            const columnExitPosX = 6;
            const columnExitPosY = 7;
            const columnExitPosZ = 8;
            const columnExitUnlocked = 9;
            const columnExitDest = 10;
            const columnExitLink = 11;
            const columnExitDescription = 12;

            this.clearRooms();
            let errors: Error[] = [];
            for (let roomRow = 0, exitRow = 0; roomRow < sheet.length; roomRow = roomRow + exitRow) {
                let exits = new Collection<string, Exit>();
                for (exitRow = 0; roomRow + exitRow < sheet.length && (exitRow === 0 || sheet[roomRow + exitRow][columnRoomDisplayName] === ""); exitRow++) {
                    let tags: string[] = sheet[roomRow + exitRow][columnExitTags] ? sheet[roomRow + exitRow][columnExitTags].trim().split(',') : [];
                    for (let i = 0; i < tags.length; i++)
                        tags[i] = tags[i].trim();
                    const pos: Pos = {
                        x: parseInt(sheet[roomRow + exitRow][columnExitPosX]),
                        y: parseInt(sheet[roomRow + exitRow][columnExitPosY]),
                        z: parseInt(sheet[roomRow + exitRow][columnExitPosZ])
                    };
                    const exitName = sheet[roomRow + exitRow][columnExitName] ? Game.generateValidEntityName(sheet[roomRow + exitRow][columnExitName]) : "";
                    const exit = new Exit(
                        exitName,
                        sheet[roomRow + exitRow][columnExitPhrase] ? sheet[roomRow + exitRow][columnExitPhrase].trim() : "",
                        new Set(tags),
                        pos,
                        sheet[roomRow + exitRow][columnExitUnlocked] ? sheet[roomRow + exitRow][columnExitUnlocked].trim() === "TRUE" : false,
                        sheet[roomRow + exitRow][columnExitDest] ? sheet[roomRow + exitRow][columnExitDest].trim() : "",
                        sheet[roomRow + exitRow][columnExitLink] ? Game.generateValidEntityName(sheet[roomRow + exitRow][columnExitLink]) : "",
                        sheet[roomRow + exitRow][columnExitDescription] ? sheet[roomRow + exitRow][columnExitDescription].trim() : "",
                        roomRow + exitRow + 2,
                        this.game
                    );
                    if (exits.get(exit.name))
                        errors.push(new Error(`Couldn't load exit on row ${exit.row}. The room already has an exit named "${exit.name}".`));
                    else exits.set(exit.name, exit);
                }
                const id = sheet[roomRow][columnRoomDisplayName] ? Room.generateValidId(sheet[roomRow][columnRoomDisplayName]) : "";
                let channel = this.game.guildContext.findChannel(id);
                if (channel === null || channel === undefined) {
                    for (const roomCategoryId of this.game.guildContext.roomCategories) {
                        const roomCategory = this.game.guildContext.getChannelWithId(roomCategoryId);
                        if (roomCategory === null || roomCategory === undefined)
                            continue;
                        const roomCategorySize = this.game.guildContext.countChannelsInCategory(roomCategory.id);
                        if (roomCategory.type === ChannelType.GuildCategory && roomCategorySize < 50) {
                            channel = await this.game.guildContext.createChannel(id, roomCategory);
                            break;
                        }
                    }
                }
                let tags: string[] = sheet[roomRow][columnRoomTags] ? sheet[roomRow][columnRoomTags].trim().split(',') : [];
                for (let i = 0; i < tags.length; i++)
                    tags[i] = tags[i].trim();
                const room = new Room(
                    id,
                    sheet[roomRow][columnRoomDisplayName] ? sheet[roomRow][columnRoomDisplayName].trim() : "",
                    channel && channel.type === ChannelType.GuildText ? channel : null,
                    new Set(tags),
                    sheet[roomRow][columnRoomIconUrl] ? sheet[roomRow][columnRoomIconUrl].trim() : "",
                    exits,
                    sheet[roomRow][columnExitDescription] ? sheet[roomRow][columnExitDescription].trim() : "",
                    roomRow + 2,
                    this.game
                );
                if (this.game.entityFinder.getRoom(room.id)) {
                    errors.push(new Error(`Couldn't load room on row ${room.row}. Another room with the same ID already exists.`));
                    continue;
                }
                this.game.rooms.set(room.id, room);
            }
            // Now go through and make the dest for each exit an actual Room object.
            this.game.rooms.forEach(room => {
                room.exits.forEach(exit => {
                    const dest = this.game.entityFinder.getRoom(exit.destDisplayName);
                    if (dest) exit.dest = dest;
                });
                if (doErrorChecking) {
                    const error = this.checkRoom(room);
                    if (error instanceof Error) errors.push(error);
                }
                this.updateRoomReferences(room);
            });
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("Rooms");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("Rooms");
            resolve(this.game);
        });
    }

    /**
     * Checks a Room for errors.
     * @param room - The room to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkRoom(room: Room): Error | void {
        if (room.displayName === "" || room.displayName === null || room.displayName === undefined)
            return new Error(`Couldn't load room on row ${room.row}. No room display name was given.`);
        if (room.id === "" || room.id === null || room.id === undefined)
            return new Error(`Couldn't load room on row ${room.row}. The room display name resolved to a unique ID with an empty value.`);
        if (room.id.length > 100)
            return new Error(`Couldn't load room on row ${room.row}. The room ID exceeds 100 characters in length.`);
        if (room.channel === null || room.channel === undefined)
            return new Error(`Couldn't load room "${room.id}" on row ${room.row}. There is no corresponding channel on the server, and a channel to accommodate the room could not be automatically created.`);
        const iconURLSyntax = /(http(s?):\/\/.*?\.(jpg|jpeg|png|gif|webp|avif))(\?[^\s]*)?$/;
        if (room.iconURL !== "" && !iconURLSyntax.test(room.iconURL))
            return new Error(`Couldn't load room on row ${room.row}. The icon URL must have a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);
        for (const exit of room.exits.values()) {
            if (exit.name === "" || exit.name === null || exit.name === undefined)
                return new Error(`Couldn't load exit on row ${exit.row}. No exit name was given.`);
            if (isNaN(exit.pos.x))
                return new Error(`Couldn't load exit on row ${exit.row}. The X-coordinate given is not an integer.`);
            if (isNaN(exit.pos.y))
                return new Error(`Couldn't load exit on row ${exit.row}. The Y-coordinate given is not an integer.`);
            if (isNaN(exit.pos.z))
                return new Error(`Couldn't load exit on row ${exit.row}. The Z-coordinate given is not an integer.`);
            if (exit.destDisplayName === "" || exit.destDisplayName === null || exit.destDisplayName === undefined)
                return new Error(`Couldn't load exit on row ${exit.row}. No destination was given.`);
            if (!(exit.dest instanceof Room))
                return new Error(`Couldn't load exit on row ${exit.row}. The destination given is not a room.`);
            if (exit.link === "" || exit.link === null || exit.link === undefined)
                return new Error(`Couldn't load exit on row ${exit.row}. No linked exit was given.`);
            const linkedExit = exit.dest.exits.get(exit.link);
            if (!linkedExit)
                return new Error(`Couldn't load exit on row ${exit.row}. Room "${exit.dest.displayName}" does not have an exit that links back to it.`);
        }
    }

    /**
     * Loads data from the Fixtures sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getFixtures(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.fixtureSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnLocationDisplayName = 1;
            const columnAccessible = 2;
            const columnChildPuzzleName = 3;
            const columnRecipeTag = 4;
            const columnActivatable = 5;
            const columnActivated = 6;
            const columnAutoDeactivate = 7;
            const columnHidingSpot = 8;
            const columnPreposition = 9;
            const columnDescription = 10;

            await this.clearFixtures();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                // Convert old spreadsheet values.
                let hidingSpotCapacity = NaN;
                const hidingSpot = sheet[row][columnHidingSpot] ? sheet[row][columnHidingSpot].trim() : "";
                if (hidingSpot === "TRUE")
                    hidingSpotCapacity = 1;
                else if (hidingSpot === "FALSE" || hidingSpot === "")
                    hidingSpotCapacity = 0;
                const fixture = new Fixture(
                    sheet[row][columnName] ? Game.generateValidEntityName(sheet[row][columnName]) : "",
                    sheet[row][columnLocationDisplayName] ? sheet[row][columnLocationDisplayName].trim() : "",
                    sheet[row][columnAccessible] ? sheet[row][columnAccessible].trim() === "TRUE" : false,
                    sheet[row][columnChildPuzzleName] ? Game.generateValidEntityName(sheet[row][columnChildPuzzleName]) : "",
                    sheet[row][columnRecipeTag] ? sheet[row][columnRecipeTag].trim() : "",
                    sheet[row][columnActivatable] ? sheet[row][columnActivatable].trim() === "TRUE" : false,
                    sheet[row][columnActivated] ? sheet[row][columnActivated].trim() === "TRUE" : false,
                    sheet[row][columnAutoDeactivate] ? sheet[row][columnAutoDeactivate].trim() === "TRUE" : false,
                    isNaN(hidingSpotCapacity) ? parseInt(sheet[row][columnHidingSpot]) : hidingSpotCapacity,
                    sheet[row][columnPreposition] ? sheet[row][columnPreposition].trim() : "",
                    sheet[row][columnDescription] ? sheet[row][columnDescription].trim() : "",
                    row + 2,
                    this.game
                );
                const location = this.game.entityFinder.getRoom(fixture.locationDisplayName);
                if (location) fixture.setLocation(location);
                const childPuzzle = this.game.entityFinder.getPuzzle(fixture.childPuzzleName, fixture.locationDisplayName);
                if (childPuzzle) fixture.setChildPuzzle(childPuzzle);
                if (doErrorChecking) {
                    const error = this.checkFixture(fixture);
                    if (error instanceof Error) errors.push(error);
                }
                this.game.fixtures.push(fixture);
                await this.updateFixtureReferences(fixture);
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("Fixtures");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("Fixtures");
            resolve(this.game);
        });
    }

    /**
     * Checks a Fixture for errors.
     * @param fixture - The fixture to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkFixture(fixture: Fixture): Error | void {
        if (fixture.name === "" || fixture.name === null || fixture.name === undefined)
            return new Error(`Couldn't load fixture on row ${fixture.row}. No fixture name was given.`);
        if (!(fixture.location instanceof Room))
            return new Error(`Couldn't load fixture on row ${fixture.row}. The location given is not a room.`);
        if (fixture.childPuzzleName !== "" && !(fixture.childPuzzle instanceof Puzzle))
            return new Error(`Couldn't load fixture on row ${fixture.row}. The child puzzle given is not a puzzle.`);
        if (fixture.childPuzzle !== null && fixture.childPuzzle !== undefined && (fixture.childPuzzle.parentFixture === null || fixture.childPuzzle.parentFixture === undefined))
            return new Error(`Couldn't load fixture on row ${fixture.row}. The child puzzle on row ${fixture.childPuzzle.row} has no parent fixture.`);
        if (fixture.childPuzzle !== null && fixture.childPuzzle !== undefined && fixture.childPuzzle.parentFixture !== null && fixture.childPuzzle.parentFixture !== undefined && fixture.childPuzzle.parentFixture.name !== fixture.name)
            return new Error(`Couldn't load fixture on row ${fixture.row}. The child puzzle on row ${fixture.childPuzzle.row} has a different parent fixture.`);
        if (isNaN(fixture.hidingSpotCapacity))
            return new Error(`Couldn't load fixture on row ${fixture.row}. The hiding spot capacity given is not a number.`);
    }

    /**
     * Loads data from the Prefabs sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getPrefabs(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.prefabSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnId = 0;
            const columnName = 1;
            const columnContainingPhrase = 2;
            const columnDiscreet = 3;
            const columnSize = 4;
            const columnWeight = 5;
            const columnUsable = 6;
            const columnUseVerb = 7;
            const columnUses = 8;
            const columnEffectsStrings = 9;
            const columnCuresStrings = 10;
            const columnNextStageId = 11;
            const columnEquippable = 12;
            const columnEquipmentSlots = 13;
            const columnCoveredEquipmentSlots = 14;
            const columnCommandsString = 15;
            const columnInventorySlotsStrings = 16;
            const columnPreposition = 17;
            const columnDescription = 18;

            this.clearPrefabs();
            let nextStageAssignments = new Collection<string, string[]>();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                const possibleNames = parsePrefabPossibleNames(sheet[row][columnName], true);
                const possibleContainingPhrases = parsePrefabPossibleNames(sheet[row][columnContainingPhrase], false);
                // Separate third person verb and second person verb.
                const useVerbs: string[] = sheet[row][columnUseVerb] ? sheet[row][columnUseVerb].split(',') : [];
                // Create a list of all status effect IDs this prefab will inflict when used.
                let effectsStrings: string[] = sheet[row][columnEffectsStrings] ? sheet[row][columnEffectsStrings].split(',') : [];
                effectsStrings.forEach((effectString, i) => {
                    effectsStrings[i] = Status.generateValidId(effectString);
                });
                // Create a list of all status effect IDs this prefab will cure when used.
                let curesStrings: string[] = sheet[row][columnCuresStrings] ? sheet[row][columnCuresStrings].split(',') : [];
                curesStrings.forEach((cureString, i) => {
                    curesStrings[i] = Status.generateValidId(cureString);
                });
                // Create a list of equipment slots this prefab can be equipped to.
                let equipmentSlots: string[] = sheet[row][columnEquipmentSlots] ? sheet[row][columnEquipmentSlots].split(',') : [];
                equipmentSlots.forEach((equipmentSlotId, i) => {
                    equipmentSlots[i] = Game.generateValidEntityName(equipmentSlotId);
                });
                // Create a list of equipment slots this prefab covers when equipped.
                let coveredEquipmentSlots: string[] = sheet[row][columnCoveredEquipmentSlots] ? sheet[row][columnCoveredEquipmentSlots].split(',') : [];
                for (let j = 0; j < coveredEquipmentSlots.length; j++)
                    coveredEquipmentSlots[j] = Game.generateValidEntityName(coveredEquipmentSlots[j]);
                // Create a list of commands to run when this prefab is equipped/unequipped. Temporarily replace forward slashes in URLs with back slashes.
                const commandString = sheet[row][columnCommandsString] ? sheet[row][columnCommandsString].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\') : "";
                const commands: string[] = commandString ? commandString.split('/') : ["", ""];
                let equippedCommands: string[] = commands[0] ? (commands[0].match(/(?:`[^`]*`|[^,])+/g)?.map(s => s.trim()).filter(s => s !== '') ?? []) : [];
                let unequippedCommands: string[] = commands[1] ? (commands[1].match(/(?:`[^`]*`|[^,])+/g)?.map(s => s.trim()).filter(s => s !== '') ?? []) : [];
                // Create a list of inventory slots this prefab contains.
                let inventorySlotStrings: string[] = sheet[row][columnInventorySlotsStrings] ? sheet[row][columnInventorySlotsStrings].split(',') : [];
                let inventorySlots = new Collection<string, InventorySlot<ItemInstance>>();
                inventorySlotStrings.forEach(inventorySlotString => {
                    let inventorySlotSplit: string[] = inventorySlotString.split(':');
                    if (inventorySlotSplit.length === 1) inventorySlotSplit = [inventorySlotString, ""];
                    const inventorySlot = new InventorySlot<ItemInstance>(
                        Game.generateValidEntityName(inventorySlotSplit[0]),
                        parseInt(inventorySlotSplit[1]),
                        0,
                        0,
                        [],
                        row + 2,
                        this.game
                    );
                    if (inventorySlots.get(inventorySlot.id))
                        errors.push(new Error(`Couldn't load prefab on row ${row + 2}. The prefab already has an inventory slot with the ID "${inventorySlot.id}".`));
                    else inventorySlots.set(inventorySlot.id, inventorySlot);
                });
                const prefab = new Prefab(
                    sheet[row][columnId] ? Game.generateValidEntityName(sheet[row][columnId]) : "",
                    possibleNames,
                    possibleContainingPhrases,
                    sheet[row][columnDiscreet] ? sheet[row][columnDiscreet].trim() === "TRUE" : false,
                    parseInt(sheet[row][columnSize]),
                    round(parseFloat(sheet[row][columnWeight])),
                    sheet[row][columnUsable] ? sheet[row][columnUsable].trim() === "TRUE" : false,
                    useVerbs[0] ? useVerbs[0].trim() : "",
                    useVerbs[1] ? useVerbs[1].trim() : "",
                    parseInt(sheet[row][columnUses]),
                    effectsStrings,
                    curesStrings,
                    sheet[row][columnNextStageId] ? sheet[row][columnNextStageId].trim() : "",
                    sheet[row][columnEquippable] ? sheet[row][columnEquippable].trim() === "TRUE" : false,
                    equipmentSlots,
                    coveredEquipmentSlots,
                    sheet[row][columnCommandsString] ? sheet[row][columnCommandsString] : "",
                    equippedCommands,
                    unequippedCommands,
                    inventorySlots,
                    sheet[row][columnPreposition] ? sheet[row][columnPreposition].trim() : "",
                    sheet[row][columnDescription] ? sheet[row][columnDescription].trim() : "",
                    row + 2,
                    this.game
                );
                if (this.game.entityFinder.getPrefab(prefab.id)) {
                    errors.push(new Error(`Couldn't load prefab on row ${prefab.row}. Another prefab with this ID already exists.`));
                    continue;
                }
                prefab.effectsStrings.forEach((effectsString, i) => {
                    const effect = this.game.entityFinder.getStatusEffect(effectsString);
                    if (effect) prefab.effects[i] = effect;
                });
                prefab.curesStrings.forEach((curesString, i) => {
                    const cure = this.game.entityFinder.getStatusEffect(curesString);
                    if (cure) prefab.cures[i] = cure;
                });
                // If this prefab's ID is currently in the next stage assignments collection, we can finally set the next stage for the prefabs in its list.
                const nextStageAssignment: string[] = nextStageAssignments.get(prefab.id);
                if (nextStageAssignment) {
                    nextStageAssignment.forEach(prevStage => this.game.entityFinder.getPrefab(prevStage).setNextStage(prefab));
                    nextStageAssignments.delete(prefab.id);
                }
                if (prefab.nextStageId !== "") {
                    let nextStage = this.game.entityFinder.getPrefab(prefab.nextStageId);
                    if (nextStage) prefab.setNextStage(nextStage);
                    else {
                        // If the next stage wasn't found, it might have just not been loaded yet. Save it for later.
                        let assignmentsList: string[] = nextStageAssignments.get(prefab.nextStageId);
                        if (!assignmentsList) assignmentsList = [];
                        assignmentsList.push(prefab.id);
                        nextStageAssignments.set(prefab.nextStageId, assignmentsList);
                    }
                }
                this.game.prefabs.set(prefab.id, prefab);
                this.updatePrefabReferences(prefab);
            }
            if (doErrorChecking) {
                this.game.prefabs.forEach(prefab => {
                    const error = this.checkPrefab(prefab);
                    if (error instanceof Error) errors.push(error);
                });
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("Prefabs");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("Prefabs");
            resolve(this.game);
        });
    }

    /**
     * Checks a Prefab for errors.
     * @param prefab - The prefab to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkPrefab(prefab: Prefab): Error | void {
        if (prefab.id === "" || prefab.id === null || prefab.id === undefined)
            return new Error(`Couldn't load prefab on row ${prefab.row}. No prefab ID was given.`);
        if (prefab.possibleNames.size < 1 || prefab.name === "" || prefab.name === null || prefab.name === undefined)
            return new Error(`Couldn't load prefab on row ${prefab.row}. No prefab name was given.`);
        if (prefab.possibleContainingPhrases.size < 1 || prefab.singleContainingPhrase === "" || prefab.singleContainingPhrase === null || prefab.singleContainingPhrase === undefined)
            return new Error(`Couldn't load prefab on row ${prefab.row}. No single containing phrase was given.`);
        if (prefab.possibleNames.size > 1) {
            for (const possibility of prefab.possibleNames.entries()) {
                const proceduralSelections = [...possibility[0]][0];
                const proceduralName = proceduralSelections[0];
                const possName = proceduralSelections[1];
                const names = possibility[1];
                if (names[0] === "" || names[0] === null || names[0] === undefined)
                    return new Error(`Couldn't load prefab on row ${prefab.row}. No name was given for possibility "${possName}" in procedural "${proceduralName}".`);
                if (proceduralName === "")
                    return new Error(`Couldn't load prefab on row ${prefab.row}. No procedural name was given.`);
                if (!prefab.proceduralOptions.has(proceduralName))
                    return new Error(`Couldn't load prefab on row ${prefab.row}. No procedural with name "${proceduralName}" exists in its description.`);
                if (possName === "" || possName === null || possName === undefined)
                    return new Error(`Couldn't load prefab on row ${prefab.row}. No possibility was given for procedural "${proceduralName}".`);
                if (!prefab.proceduralOptions.get(proceduralName).has(possName))
                    return new Error(`Couldn't load prefab on row ${prefab.row}. Procedural "${proceduralName}" does not contain possibility "${possName}".`);
            }
        }
        if (prefab.possibleContainingPhrases.size > 1) {
            for (const possibility of prefab.possibleContainingPhrases.entries()) {
                const proceduralSelections = [...possibility[0]][0];
                const proceduralName = proceduralSelections[0];
                const possName = proceduralSelections[1];
                const containingPhrases = possibility[1];
                if (containingPhrases[0] === "" || containingPhrases[0] === null || containingPhrases[0] === undefined)
                    return new Error(`Couldn't load prefab on row ${prefab.row}. No single containing phrase was given for possibility "${possName}" in procedural "${proceduralName}".`);
                if (proceduralName === "")
                    return new Error(`Couldn't load prefab on row ${prefab.row}. No procedural name was given.`);
                if (!prefab.proceduralOptions.has(proceduralName))
                    return new Error(`Couldn't load prefab on row ${prefab.row}. No procedural with name "${proceduralName}" exists in its description.`);
                if (possName === "" || possName === null || possName === undefined)
                    return new Error(`Couldn't load prefab on row ${prefab.row}. No possibility was given for procedural "${proceduralName}".`);
                if (!prefab.proceduralOptions.get(proceduralName).has(possName))
                    return new Error(`Couldn't load prefab on row ${prefab.row}. Procedural "${proceduralName}" does not contain possibility "${possName}".`);
            }
        }
        if (isNaN(prefab.size))
            return new Error(`Couldn't load prefab on row ${prefab.row}. The size given is not a number.`);
        if (isNaN(prefab.weight))
            return new Error(`Couldn't load prefab on row ${prefab.row}. The weight given is not a number.`);
        for (let i = 0; i < prefab.effects.length; i++) {
            if (!(prefab.effects[i] instanceof Status))
                return new Error(`Couldn't load prefab on row ${prefab.row}. "${prefab.effectsStrings[i]}" in effects is not a status effect.`);
        }
        for (let i = 0; i < prefab.cures.length; i++) {
            if (!(prefab.cures[i] instanceof Status))
                return new Error(`Couldn't load prefab on row ${prefab.row}. "${prefab.curesStrings[i]}" in cures is not a status effect.`);
        }
        if (prefab.nextStageId !== "" && !(prefab.nextStage instanceof Prefab))
            return new Error(`Couldn't load prefab on row ${prefab.row}. "${prefab.nextStageId}" in turns into is not a prefab.`);
        for (const [i, inventorySlot] of prefab.inventory.entries()) {
            if (inventorySlot.id === "" || inventorySlot.id === null || inventorySlot.id === undefined)
                return new Error(`Couldn't load prefab on row ${prefab.row}. No name was given for inventory slot ${i + 1}.`);
            if (isNaN(inventorySlot.capacity))
                return new Error(`Couldn't load prefab on row ${prefab.row}. The capacity given for inventory slot "${inventorySlot.id}" is not a number.`);
        }
        if (prefab.inventory.size !== 0 && prefab.preposition === "")
            return new Error(`Couldn't load prefab on row ${prefab.row}. ${prefab.id} has inventory slots, but no preposition was given.`);
    }

    /**
     * Loads data from the Recipes sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getRecipes(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.recipeSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnIngredients = 0;
            const columnUncraftable = 1;
            const columnFixtureTag = 2;
            const columnDuration = 3;
            const columnProducts = 4;
            const columnInitiatedDescription = 5;
            const columnCompletedDescription = 6;
            const columnUncraftedDescription = 7;

            this.clearRecipes();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                // Separate the ingredients and sort them in alphabetical order.
                let ingredientsStrings: string[] = sheet[row][columnIngredients] ? sheet[row][columnIngredients].split(',') : [];
                ingredientsStrings.sort((a, b) => {
                    const trimmedA = Game.generateValidEntityName(a).replace(RecipeItem.itemRegex, "$3");
                    const trimmedB = Game.generateValidEntityName(b).replace(RecipeItem.itemRegex, "$3");
                    if (trimmedA < trimmedB) return -1;
                    if (trimmedA > trimmedB) return 1;
                    return 0;
                });
                // For each ingredient, convert the string to a valid entity name.
                for (let j = 0; j < ingredientsStrings.length; j++)
                    ingredientsStrings[j] = ingredientsStrings[j].trim();
                // Parse the duration.
                const durationString = sheet[row][columnDuration] ? String(sheet[row][columnDuration]) : "";
                const duration = durationString !== "" ? parseDuration(durationString) : null;
                // Separate the products.
                let productsStrings: string[] = sheet[row][columnProducts] ? sheet[row][columnProducts].split(',') : [];
                // For each product, convert the string to a valid entity name.
                for (let j = 0; j < productsStrings.length; j++)
                    productsStrings[j] = productsStrings[j].trim();
                const fixtureTag = sheet[row][columnFixtureTag] ? sheet[row][columnFixtureTag].trim() : "";
                let recipe = new Recipe(
                    ingredientsStrings,
                    sheet[row][columnUncraftable] ? sheet[row][columnUncraftable].trim() === "TRUE" : false,
                    fixtureTag,
                    durationString,
                    duration,
                    productsStrings,
                    sheet[row][columnInitiatedDescription] ? sheet[row][columnInitiatedDescription].trim() : "",
                    sheet[row][columnCompletedDescription] ? sheet[row][columnCompletedDescription].trim() : "",
                    sheet[row][columnUncraftedDescription] ? sheet[row][columnUncraftedDescription].trim() : "",
                    row + 2,
                    this.game
                );
                recipe.ingredientsStrings.forEach((ingredientsString, i) => {
                    const ingredient = new RecipeItem(ingredientsString, this.game, fixtureTag ? "processing" : "crafting");
                    const prefab = this.game.entityFinder.getPrefab(ingredient.prefabId);
                    if (prefab) ingredient.setPrefab(prefab);
                    if (ingredient.containedItemsString) {
                        const containedItemsStrings = ingredient.containedItemsString.split('+');
                        for (const containedItemString of containedItemsStrings) {
                            const containedIngredient = new RecipeItem(containedItemString, this.game, fixtureTag ? "processing" : "crafting");
                            const prefab = this.game.entityFinder.getPrefab(containedIngredient.prefabId);
                            if (prefab) containedIngredient.setPrefab(prefab);
                            containedIngredient.setContainer(ingredient);
                            ingredient.containedItems.push(containedIngredient);
                            recipe.ingredientsFlat.push(containedIngredient);
                        }
                    }
                    recipe.ingredients[i] = ingredient;
                    recipe.ingredientsFlat.push(ingredient);
                });
                recipe.productsStrings.forEach((productsString, i) => {
                    const product = new RecipeItem(productsString, this.game, fixtureTag ? "processing" : "crafting");
                    const prefab = this.game.entityFinder.getPrefab(product.prefabId);
                    if (prefab) product.setPrefab(prefab);
                    if (product.containedItemsString) {
                        const containedItemsStrings = product.containedItemsString.split('+');
                        for (const containedItemString of containedItemsStrings) {
                            const containedProduct = new RecipeItem(containedItemString, this.game, fixtureTag ? "processing" : "crafting");
                            const prefab = this.game.entityFinder.getPrefab(containedProduct.prefabId);
                            if (prefab) containedProduct.setPrefab(prefab);
                            containedProduct.setContainer(product);
                            product.containedItems.push(containedProduct);
                            recipe.productsFlat.push(containedProduct);
                        }
                    }
                    recipe.products[i] = product;
                    recipe.productsFlat.push(product);
                });
                recipe.ingredientsFlat.sort((a, b) => {
                    if (a.prefabId < b.prefabId) return -1;
                    if (a.prefabId > b.prefabId) return 1;
                    return 0;
                });
                recipe.productsFlat.sort((a, b) => {
                    if (a.prefabId < b.prefabId) return -1;
                    if (a.prefabId > b.prefabId) return 1;
                    return 0;
                });
                if (doErrorChecking) {
                    const error = this.checkRecipe(recipe);
                    if (error instanceof Error) errors.push(error);
                }
                this.game.recipes.push(recipe);
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("Recipes");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("Recipes");
            resolve(this.game);
        });
    }

    /**
     * Checks a Recipe for errors.
     * @param recipe - The recipe to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkRecipe(recipe: Recipe): Error | void {
        if (recipe.ingredients.length === 0)
            return new Error(`Couldn't load recipe on row ${recipe.row}. No ingredients were given.`);
        const ingredientVariables = new Set<string>();
        for (const ingredient of recipe.ingredientsFlat) {
            if (ingredient.quantityVariableName !== '' && /^[A-Z]$/.test(ingredient.quantityVariableName) === false)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${ingredient.quantityVariableName}" in ingredients is not a valid variable name.`);
            if (ingredient.usesVariableName !== '' && /^[A-Z]$/.test(ingredient.usesVariableName) === false)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${ingredient.usesVariableName}" in ingredients is not a valid variable name.`);
            if (!(ingredient.prefab instanceof Prefab))
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${ingredient.prefabId}" in ingredients is not a prefab.`);
            if (ingredient.quantity < 1)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${ingredient.prefabId}" must have a quantity greater than or equal to 1.`);
            if (!isNaN(ingredient.uses) && ingredient.uses < 1)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${ingredient.prefabId}" must have a number of uses greater than or equal to 1.`);
            if (ingredient.containedItems.length > 0 && ingredient.prefab.inventory.size === 0)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${ingredient.prefabId}" is not a container, but is expected to contain items.`);
            if (ingredient.prefab.inventory.size > 1)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${ingredient.prefabId}" has more than one inventory slot.`)
            if (ingredient.containedItems.length > 0 && ingredient.prefab.inventory.reduce((size, inventory) => size + inventory.capacity, 0) < ingredient.containedItems.reduce((size, item) => size + (item.quantity * item.prefab.size), 0))
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${ingredient.prefabId}" is too full.`)
            ingredientVariables.add(ingredient.quantityVariableName);
            ingredientVariables.add(ingredient.usesVariableName);
        }
        if (recipe.fixtureTag === "") {
            for (const ingredient of recipe.ingredients) {
                if (!(ingredient.quantity === 1 && ingredient.quantityIsConstant))
                    return new Error(`Couldn't load recipe on row ${recipe.row}. Top-level ingredients in hand-crafting recipes cannot have a quantity other than a constant of 1.`);
            }
            for (const product of recipe.products) {
                if (!(product.quantity === 1 && product.quantityIsConstant))
                    return new Error(`Couldn't load recipe on row ${recipe.row}. Top-level products in hand-crafting recipes cannot have a quantity other than a constant of 1.`);
            }
        }
        if (recipe.ingredients.filter(ingredient => ingredient.prefab.inventory.size > 0).length > 1)
            return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes cannot have more than one container as an ingredient.`);
        if (recipe.ingredients.length > 2 && recipe.fixtureTag === "")
            return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than 2 ingredients must require a fixture tag.`);
        if (recipe.products.length > 2 && recipe.fixtureTag === "")
            return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than 2 products must require a fixture tag.`);
        if (recipe.duration !== null && !validateDuration(recipe.duration))
            return new Error(`Couldn't load recipe on row ${recipe.row}. "${recipe.durationString}" is not a valid duration.`);
        if (recipe.fixtureTag === "" && recipe.duration !== null)
            return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes without a fixture tag cannot have a duration.`);
        for (const product of recipe.productsFlat) {
            if (product.quantityVariableName !== '' && /^[A-Z]$/.test(product.quantityVariableName) === false)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${product.quantityVariableName}" in products is not a valid variable name.`);
            if (product.usesVariableName !== '' && /^[A-Z]$/.test(product.usesVariableName) === false)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${product.usesVariableName}" in ingredients is not a valid variable name.`);
            if (product.quantityVariableName !== '' && !ingredientVariables.has(product.quantityVariableName))
                return new Error(`Couldn't load recipe on row ${recipe.row}. Variable "${product.quantityVariableName}" does not appear in ingredients.`);
            if (product.usesVariableName !== '' && !ingredientVariables.has(product.usesVariableName))
                return new Error(`Couldn't load recipe on row ${recipe.row}. Variable "${product.usesVariableName}" does not appear in ingredients.`);
            if (!(product.prefab instanceof Prefab))
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${product.prefabId}" in products is not a prefab.`);
            if (product.quantity < 1)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${product.prefabId}" must have a quantity greater than or equal to 1.`);
            if (!isNaN(product.uses) && product.uses < 1)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${product.prefabId}" must have a number of uses greater than or equal to 1.`);
            if (product.containedItems.length > 0 && product.prefab.inventory.size === 0)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${product.prefabId}" is not a container, but is expected to contain items.`);
            if (product.prefab.inventory.size > 1)
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${product.prefabId}" has more than one inventory slot.`)
            if (product.containedItems.length > 0 && product.prefab.inventory.reduce((size, inventory) => size + inventory.capacity, 0) < product.containedItems.reduce((size, item) => size + (item.quantity * item.prefab.size), 0))
                return new Error(`Couldn't load recipe on row ${recipe.row}. "${product.prefabId}" is too full.`)
        }
        if (recipe.products.filter(product => product.prefab.inventory.size > 0 && product.containedItems.length > 0).length > 1)
            return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes cannot have more than one container as a product.`);
        if (recipe.fixtureTag !== "" && recipe.uncraftable)
            return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with a fixture tag cannot be uncraftable.`);
        if (recipe.products.length > 1 && recipe.uncraftable)
            return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than one product cannot be uncraftable.`);
        if (recipe.fixtureTag === "") {
            for (const ingredient of recipe.ingredients) {
                if (ingredient.quantity !== 1)
                    return new Error(`Couldn't load recipe on row ${recipe.row}. Ingredients in crafting-type recipes must have a quantity of 1.`);
            }
            for (const product of recipe.products) {
                if (product.quantity !== 1)
                    return new Error(`Couldn't load recipe on row ${recipe.row}. Products in crafting-type recipes must have a quantity of 1.`);
            }
        }
    }

    /**
     * Loads data from the Room Items sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getRoomItems(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.roomItemSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnPrefabId = 0;
            const columnIdentifier = 1;
            const columnLocationDisplayName = 2;
            const columnAccessible = 3;
            const columnContainerName = 4;
            const columnQuantity = 5;
            const columnUses = 6;
            const columnDescription = 7;

            this.clearRoomItems();
            let containerItems = new Collection<string, RoomItem>();
            let unloadedContainers = new Collection<string, RoomItem[]>();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                let containerDisplay: string[] = sheet[row][columnContainerName] && sheet[row][columnContainerName].split(':').length > 1 ?
                    sheet[row][columnContainerName].split(':') : ['', sheet[row][columnContainerName]];
                let containerType = containerDisplay[0].trim();
                const containerTypeUpper = containerType.toUpperCase();
                let containerName = Game.generateValidEntityName(containerDisplay[1]);
                if (containerTypeUpper === "FIXTURE" || containerTypeUpper === "OBJECT") containerType = "Fixture";
                else if (containerTypeUpper === "ROOMITEM" || containerTypeUpper === "ITEM") containerType = "RoomItem";
                else if (containerTypeUpper === "PUZZLE") containerType = "Puzzle";
                const roomItem = new RoomItem(
                    sheet[row][columnPrefabId] ? Game.generateValidEntityName(sheet[row][columnPrefabId]) : "",
                    sheet[row][columnIdentifier] ? Game.generateValidEntityName(sheet[row][columnIdentifier]) : "",
                    sheet[row][columnLocationDisplayName] ? sheet[row][columnLocationDisplayName].trim() : "",
                    sheet[row][columnAccessible] ? sheet[row][columnAccessible].trim() === "TRUE" : false,
                    containerType,
                    containerName,
                    parseInt(sheet[row][columnQuantity]),
                    parseInt(sheet[row][columnUses]),
                    sheet[row][columnDescription] ? sheet[row][columnDescription].trim() : "",
                    row + 2,
                    this.game
                );
                const prefab = this.game.entityFinder.getPrefab(roomItem.prefabId);
                if (prefab) {
                    roomItem.setPrefab(prefab);
                    roomItem.setNames();
                    roomItem.initializeInventory();
                }
                const location = this.game.entityFinder.getRoom(roomItem.locationDisplayName);
                if (location) roomItem.setLocation(location);
                if (roomItem.quantity !== 0 && roomItem.identifier !== "" && roomItem.inventory.size > 0) {
                    if (containerItems.get(roomItem.identifier)) {
                        errors.push(new Error(`Couldn't load room item on row ${roomItem.row}. Another room item with this container identifier already exists.`));
                        continue;
                    }
                    containerItems.set(roomItem.identifier, roomItem);
                    // If this item's identifier is already in the unloadedContainers collection, we can set it as the container for its child items.
                    const unassignedChildItems: RoomItem[] = unloadedContainers.get(roomItem.identifier);
                    if (unassignedChildItems) {
                        unassignedChildItems.forEach(childItem => {
                            childItem.setContainer(roomItem);
                            roomItem.insertItem(childItem, childItem.slot);
                        });
                        unloadedContainers.delete(roomItem.identifier);
                    }
                }
                if (roomItem.containerType === "Fixture") {
                    const container: Fixture = this.game.entityFinder.getFixture(containerName, roomItem.locationDisplayName);
                    if (container) roomItem.setContainer(container);
                }
                else if (roomItem.containerType === "Puzzle") {
                    const container: Puzzle = this.game.entityFinder.getPuzzle(containerName, roomItem.locationDisplayName);
                    if (container) roomItem.setContainer(container);
                }
                else if (roomItem.containerType === "RoomItem") {
                    const containerNameSplit: string[] = roomItem.containerName.split('/').length > 1 ?
                        roomItem.containerName.split('/') : [roomItem.containerName, ''];
                    const identifier = Game.generateValidEntityName(containerNameSplit[0]);
                    const slotId = Game.generateValidEntityName(containerNameSplit[1]);
                    if (slotId) roomItem.slot = slotId;
                    const container: RoomItem = containerItems.get(identifier);
                    if (container) {
                        roomItem.setContainer(container);
                        container.insertItem(roomItem, slotId);
                    }
                    else {
                        // If the container item wasn't found, it might have just not been loaded yet. Save it for later.
                        let unassignedChildItems: RoomItem[] = unloadedContainers.get(identifier);
                        if (!unassignedChildItems) unassignedChildItems = [];
                        unassignedChildItems.push(roomItem);
                        unloadedContainers.set(identifier, unassignedChildItems);
                    }
                }
                this.game.roomItems.push(roomItem);
            }
            if (doErrorChecking) {
                this.game.roomItems.forEach(roomItem => {
                    const error = this.checkRoomItem(roomItem);
                    if (error instanceof Error) errors.push(error);
                });
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("RoomItems");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("RoomItems");
            resolve(this.game);
        });
    }

    /**
     * Checks a RoomItem for errors.
     * @param item - The room item to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkRoomItem(item: RoomItem): Error | void {
        if (!(item.prefab instanceof Prefab))
            return new Error(`Couldn't load room item on row ${item.row}. "${item.prefabId}" is not a prefab.`);
        if (item.inventory.size > 0 && item.identifier === "")
            return new Error(`Couldn't load room item on row ${item.row}. This item is capable of containing items, but no container identifier was given.`);
        if (item.inventory.size > 0 && (item.quantity > 1 || isNaN(item.quantity)))
            return new Error(`Couldn't load room item on row ${item.row}. Items capable of containing items must have a quantity of 1.`);
        if (item.identifier !== "" && item.quantity !== 0 &&
            this.game.roomItems.filter(roomItem => roomItem.identifier === item.identifier && roomItem.quantity !== 0).length
            + this.game.inventoryItems.filter(inventoryItem => inventoryItem.identifier === item.identifier && inventoryItem.quantity !== 0).length > 1)
            return new Error(`Couldn't load room item on row ${item.row}. Another item or inventory item with this container identifier already exists.`);
        if (item.pluralContainingPhrase === "" && (item.quantity > 1 || isNaN(item.quantity)))
            return new Error(`Couldn't load room item on row ${item.row}. Quantity is higher than 1, but its prefab on row ${item.prefab.row} has no plural containing phrase.`);
        if (!(item.location instanceof Room))
            return new Error(`Couldn't load room item on row ${item.row}. "${item.locationDisplayName}" is not a room.`);
        if (item.containerName === "")
            return new Error(`Couldn't load room item on row ${item.row}. No container was given.`);
        if (item.containerType === "")
            return new Error(`Couldn't load room item on row ${item.row}. The container type wasn't specified.`);
        if (item.containerType !== "Fixture" && item.containerType !== "RoomItem" && item.containerType !== "Puzzle")
            return new Error(`Couldn't load room item on row ${item.row}. "${item.containerType}" is not a valid container type.`);
        if (item.containerType === "Fixture" && !(item.container instanceof Fixture))
            return new Error(`Couldn't load room item on row ${item.row}. The container given is not a fixture.`);
        if (item.quantity !== 0 && item.containerType === "RoomItem" && !(item.container instanceof RoomItem)) {
            const containerName = item.containerName.split('/');
            const container = item.getGame().entityFinder.getRoomItem(containerName[0], item.location.id);
            if (container && container.inventory.size === 0)
                return new Error(`Couldn't load room item on row ${item.row}. The item's container is a room item, but the item container's prefab on row ${container.prefab.row} has no inventory slots.`);
            return new Error(`Couldn't load room item on row ${item.row}. The container given is not a room item.`);
        }
        if (item.containerType === "Puzzle" && !(item.container instanceof Puzzle))
            return new Error(`Couldn't load room item on row ${item.row}. The container given is not a puzzle.`);
        if (item.container instanceof RoomItem) {
            if (item.slot === "") return new Error(`Couldn't load room item on row ${item.row}. The item's container is a room item, but a prefab inventory slot ID was not given.`);
            const inventorySlot: InventorySlot<RoomItem> = item.container.inventory.get(item.slot);
            if (!inventorySlot)
                return new Error(`Couldn't load room item on row ${item.row}. The item's container prefab on row ${item.container.prefab.row} has no inventory slot "${item.slot}".`);
            if (inventorySlot.takenSpace > inventorySlot.capacity)
                return new Error(`Couldn't load room item on row ${item.row}. The item's container is over capacity.`);
            const containerChain = new Set<number>();
            let container: RoomItemContainer = item;
            while (container instanceof RoomItem) {
                if (containerChain.has(container.row)) return new Error(`Couldn't load room item on row ${item.row}. The item's container chain contains itself, resulting in an infinite loop.`);
                containerChain.add(container.row);
                container = container.container;
            }
        }
    }

    /**
     * Loads data from the Puzzles sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getPuzzles(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.puzzleSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnSolved = 1;
            const columnOutcome = 2;
            const columnRequiresMod = 3;
            const columnLocationDisplayName = 4;
            const columnParentFixtureName = 5;
            const columnType = 6;
            const columnAccessible = 7;
            const columnRequiresStrings = 8;
            const columnSolution = 9;
            const columnAttempts = 10;
            const columnCommandsString = 11;
            const columnCorrectDescription = 12;
            const columnAlreadySolvedDescription = 13;
            const columnUnsolvedDescription = 14;
            const columnIncorrectDescription = 15;
            const columnNoMoreAttemptsDescription = 16;
            const columnRequirementsNotMetDescription = 17;

            this.clearPuzzles();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                let requirements: string[] = sheet[row][columnRequiresStrings] ? sheet[row][columnRequiresStrings].split(',') : [];
                let requirementsStrings: PuzzleRequirement[] = [];
                requirements.forEach(requirement => {
                    let requirementDisplay: string[] = requirement.split(':').length > 1 ? requirement.split(':') : ['', requirement];
                    let requirementType = requirementDisplay[0].trim();
                    const requirementTypeUpper = requirementType.toUpperCase();
                    let requirementId = Game.generateValidEntityName(requirementDisplay[1]);
                    if (requirementTypeUpper === "PUZZLE") requirementType = "Puzzle";
                    else if (requirementTypeUpper === "EVENT") requirementType = "Event";
                    else if (requirementTypeUpper === "FLAG") requirementType = "Flag";
                    else if (requirementTypeUpper === "PREFAB" || requirementTypeUpper === "ITEM" || requirementTypeUpper === "ROOMITEM" || requirementTypeUpper === "INVENTORYITEM") requirementType = "Prefab";
                    requirementsStrings.push({ type: requirementType, entityId: requirementId });
                });
                const commandString = sheet[row][columnCommandsString] ? sheet[row][columnCommandsString].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\').replace(/(?<=http(s?)):(?=.*?(jpg|jpeg|png|webp|avif))/g, '@') : "";
                let commandSets: PuzzleCommandSet[] = [];
                let getCommands = function (commandString: string): PuzzleCommandSet {
                    const commands: string[] = commandString.split('/');
                    let solvedCommands: string[] = commands[0] ? (commands[0].match(/(?:`[^`]*`|[^,])+/g)?.map(s => s.trim()).filter(s => s !== '') ?? []) : [];
                    let unsolvedCommands: string[] = commands[1] ? (commands[1].match(/(?:`[^`]*`|[^,])+/g)?.map(s => s.trim()).filter(s => s !== '') ?? []) : [];
                    return { solvedCommands: solvedCommands, unsolvedCommands: unsolvedCommands };
                };
                const regex = new RegExp(/(\[((.*?)(?<!(?:(?:Room|Inventory)?Item)|Prefab): (.*?))\],?)/g);
                if (!!commandString.match(regex)) {
                    let match: RegExpExecArray | null;
                    while (match = regex.exec(commandString)) {
                        const commandSet = match[2];
                        let outcomes = commandSet.substring(0, commandSet.lastIndexOf(':')).split(',');
                        for (let i = 0; i < outcomes.length; i++)
                            outcomes[i] = outcomes[i].trim();
                        const commands = getCommands(commandSet.substring(commandSet.lastIndexOf(':') + 1));
                        commandSets.push({ outcomes: outcomes, solvedCommands: commands.solvedCommands, unsolvedCommands: commands.unsolvedCommands });
                    }
                }
                else {
                    const commands = getCommands(sheet[row][columnCommandsString] ? sheet[row][columnCommandsString] : "");
                    commandSets.push({ outcomes: [], solvedCommands: commands.solvedCommands, unsolvedCommands: commands.unsolvedCommands });
                }
                let solutions: string[] = sheet[row][columnSolution] ? sheet[row][columnSolution].toString().split(',') : [];
                for (let j = 0; j < solutions.length; j++) {
                    if (sheet[row][columnType] === "voice")
                        solutions[j] = solutions[j].replace(/[^a-zA-Z0-9 ]+/g, "").toLowerCase().trim();
                    else
                        solutions[j] = solutions[j].trim();
                }
                const puzzle = new Puzzle(
                    sheet[row][columnName] ? Game.generateValidEntityName(sheet[row][columnName]) : "",
                    sheet[row][columnSolved] ? sheet[row][columnSolved].trim() === "TRUE" : false,
                    sheet[row][columnOutcome] ? sheet[row][columnOutcome].trim() : "",
                    sheet[row][columnRequiresMod] ? sheet[row][columnRequiresMod].trim() === "TRUE" : false,
                    sheet[row][columnLocationDisplayName] ? sheet[row][columnLocationDisplayName].trim() : "",
                    sheet[row][columnParentFixtureName] ? Game.generateValidEntityName(sheet[row][columnParentFixtureName]) : "",
                    sheet[row][columnType] ? sheet[row][columnType].trim() : "",
                    sheet[row][columnAccessible] ? sheet[row][columnAccessible].trim() === "TRUE" : false,
                    requirementsStrings,
                    solutions,
                    parseInt(sheet[row][columnAttempts]),
                    sheet[row][columnCommandsString] ? sheet[row][columnCommandsString] : "",
                    commandSets,
                    sheet[row][columnCorrectDescription] ? sheet[row][columnCorrectDescription].trim() : "",
                    sheet[row][columnAlreadySolvedDescription] ? sheet[row][columnAlreadySolvedDescription].trim() : "",
                    sheet[row][columnUnsolvedDescription] ? sheet[row][columnUnsolvedDescription].trim() : "",
                    sheet[row][columnIncorrectDescription] ? sheet[row][columnIncorrectDescription].trim() : "",
                    sheet[row][columnNoMoreAttemptsDescription] ? sheet[row][columnNoMoreAttemptsDescription].trim() : "",
                    sheet[row][columnRequirementsNotMetDescription] ? sheet[row][columnRequirementsNotMetDescription].trim() : "",
                    row + 2,
                    this.game
                );
                const location = this.game.entityFinder.getRoom(puzzle.locationDisplayName);
                if (location) puzzle.setLocation(location);
                const parentFixture = this.game.entityFinder.getFixture(puzzle.parentFixtureName, puzzle.locationDisplayName);
                if (parentFixture) puzzle.setParentFixture(parentFixture);
                this.game.puzzles.push(puzzle);
                this.updatePuzzleReferences(puzzle);
            }
            this.game.puzzles.forEach(puzzle => {
                puzzle.requirementsStrings.forEach((requirementString, i) => {
                    let requirement: Prefab|Event|Flag|Puzzle = null;
                    if (requirementString.type === "Prefab")
                        requirement = this.game.entityFinder.getPrefab(requirementString.entityId);
                    else if (requirementString.type === "Event")
                        requirement = this.game.entityFinder.getEvent(requirementString.entityId);
                    else if (requirementString.type === "Flag")
                        requirement = this.game.entityFinder.getFlag(requirementString.entityId);
                    else
                        requirement = this.game.entityFinder.getPuzzle(requirementString.entityId);
                    puzzle.requirements[i] = requirement;
                });
                if (doErrorChecking) {
                    const error = this.checkPuzzle(puzzle);
                    if (error instanceof Error) errors.push(error);
                }
            });
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("Puzzles");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("Puzzles");
            resolve(this.game);
        });
    }

    /**
     * Checks a Puzzle for errors.
     * @param puzzle - The puzzle to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkPuzzle(puzzle: Puzzle): Error | void {
        if (puzzle.name === "" || puzzle.name === null || puzzle.name === undefined)
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. No puzzle name was given.`);
        if (!(puzzle.location instanceof Room))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.locationDisplayName}" is not a room.`);
        if (puzzle.parentFixtureName !== "" && !(puzzle.parentFixture instanceof Fixture))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The parent fixture given is not a fixture.`);
        if (puzzle.parentFixture !== null && puzzle.parentFixture !== undefined && (puzzle.parentFixture.childPuzzle === null || puzzle.parentFixture.childPuzzle === undefined))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The parent fixture on row ${puzzle.parentFixture.row} has no child puzzle.`);
        if (puzzle.parentFixture !== null && puzzle.parentFixture !== undefined && puzzle.parentFixture.childPuzzle !== null && puzzle.parentFixture.childPuzzle !== undefined && puzzle.parentFixture.childPuzzle.name !== puzzle.name)
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The parent fixture has a different child puzzle.`);
        if (puzzle.type !== "password" &&
            puzzle.type !== "interact" &&
            puzzle.type !== "toggle" &&
            puzzle.type !== "combination lock" &&
            puzzle.type !== "key lock" &&
            !puzzle.type.endsWith("probability") &&
            puzzle.type !== "channels" &&
            puzzle.type !== "weight" &&
            puzzle.type !== "container" &&
            puzzle.type !== "take" &&
            puzzle.type !== "drop" &&
            puzzle.type !== "voice" &&
            puzzle.type !== "switch" &&
            puzzle.type !== "option" &&
            puzzle.type !== "media" &&
            puzzle.type !== "player" &&
            puzzle.type !== "player toggle" &&
            puzzle.type !== "room player" &&
            puzzle.type !== "exit" &&
            puzzle.type !== "restricted exit" &&
            puzzle.type !== "matrix")
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.type}" is not a valid puzzle type.`);
        if ((puzzle.type === "probability" || puzzle.type.endsWith(" probability")) && puzzle.solutions.length < 1)
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a probability-type puzzle, but no solutions were given.`);
        if (puzzle.type.endsWith(" probability")) {
            if (puzzle.type !== "str probability" && puzzle.type !== "strength probability" &&
                puzzle.type !== "per probability" && puzzle.type !== "perception probability" &&
                puzzle.type !== "int probability" && puzzle.type !== "intelligence probability" &&
                puzzle.type !== "dex probability" && puzzle.type !== "dexterity probability" &&
                puzzle.type !== "spd probability" && puzzle.type !== "speed probability" &&
                puzzle.type !== "sta probability" && puzzle.type !== "stamina probability")
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.type}" is not a valid stat probability puzzle type.`);
        }
        for (let solution of puzzle.solutions) {
            if (puzzle.type === "weight" && isNaN(parseFloat(solution)))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a weight-type puzzle, but the solution "${solution}" is not a number.`);
            if (!solution.startsWith("Item: ") && !solution.startsWith("Prefab: ")) {
                if (puzzle.type === "media")
                    return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a media-type puzzle, but the solution "${solution}" does not have the "Item: " or "Prefab: " prefix.`);
                if (puzzle.type === "take")
                    return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a take-type puzzle, but the solution "${solution}" does not have the "Item: " or "Prefab: " prefix.`);
                if (puzzle.type === "drop")
                    return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a drop-type puzzle, but the solution "${solution}" does not have the "Item: " or "Prefab: " prefix.`);
            }
            if (puzzle.type === "container") {
                const requiredItems = solution.split('+');
                for (let requiredItem of requiredItems) {
                    if (!requiredItem.trim().startsWith("Item: ") && !requiredItem.trim().startsWith("Prefab: "))
                        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a container-type puzzle, but the solution "${requiredItem}" does not have the "Item: " or "Prefab: " prefix.`);
                }
            }
        }
        if (puzzle.type === "switch" && puzzle.solved === false)
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a switch-type puzzle, but it is not solved.`);
        if (puzzle.type === "switch" && puzzle.outcome === "")
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a switch-type puzzle, but no outcome was given.`);
        if (puzzle.type === "switch" && !puzzle.solutions.includes(puzzle.outcome))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a switch-type puzzle, but its outcome is not among the list of its solutions.`);
        if (puzzle.type === "media") {
            if (puzzle.solved === true && puzzle.outcome === "")
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a media-type puzzle, but it was solved without an outcome.`);
            if (puzzle.outcome !== "" && !puzzle.solutions.includes(puzzle.outcome))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a media-type puzzle, but its outcome is not among the list of its solutions.`);
        }
        for (let commandSet of puzzle.commandSets) {
            for (let outcome of commandSet.outcomes) {
                if (!puzzle.solutions.includes(outcome))
                    return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${outcome}" in command sets is not an outcome in the puzzle's solutions.`);
            }
        }
        for (let i = 0; i < puzzle.requirements.length; i++) {
            const requirement = puzzle.requirements[i];
            const requirementString = puzzle.requirementsStrings[i];
            if (requirementString.type === "Prefab" && !(requirement instanceof Prefab))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${requirementString.entityId}" in requires is not a prefab.`);
            else if (requirementString.type === "Event" && !(requirement instanceof Event))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${requirementString.entityId}" in requires is not an event.`);
            else if (requirementString.type === "Flag" && !(requirement instanceof Flag))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${requirementString.entityId}" in requires is not a flag.`);
            else if ((requirementString.type === "Puzzle" || requirementString.type === "") && !(requirement instanceof Puzzle))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${requirementString.entityId}" in requires is not a puzzle.`);
            else if (requirementString.type !== "Prefab"
                && requirementString.type !== "Event"
                && requirementString.type !== "Flag"
                && requirementString.type !== "Puzzle"
                && requirementString.type !== "")
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${requirementString.type}" is not a valid requirement type.`);
        }
    }

    /**
     * Loads data from the Events sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getEvents(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.eventSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnId = 0;
            const columnOngoing = 1;
            const columnDurationString = 2;
            const columnRemainingString = 3;
            const columnTriggerTimesStrings = 4;
            const columnRoomTag = 5;
            const columnCommandsString = 6;
            const columnEffectsStrings = 7;
            const columnRefreshedStrings = 8;
            const columnTriggeredNarration = 9;
            const columnEndedNarration = 10;

            this.clearEvents();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                const durationString = sheet[row][columnDurationString] ? String(sheet[row][columnDurationString]) : "";
                const duration = durationString !== "" ? parseDuration(durationString) : null;
                const timeRemainingString = sheet[row][columnRemainingString] ? sheet[row][columnRemainingString] : "";
                const timeRemainingParsed = convertTimeStringToDurationUnits(timeRemainingString);
                let timeRemaining: Duration;
                if (timeRemainingString !== "") {
                    if (timeRemainingParsed !== undefined)
                        timeRemaining = Duration.fromObject(timeRemainingParsed);
                    else
                        timeRemaining = Duration.invalid("created from invalid duration string", `${timeRemainingString} is not a valid duration string`);
                } else timeRemaining = null;
                let triggerTimesStrings: string[] = sheet[row][columnTriggerTimesStrings] ? sheet[row][columnTriggerTimesStrings].split(',') : [];
                for (let i = 0; i < triggerTimesStrings.length; i++)
                    triggerTimesStrings[i] = triggerTimesStrings[i].trim();
                const commandString = sheet[row][columnCommandsString] ? sheet[row][columnCommandsString].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\') : "";
                const commands: string[] = commandString ? commandString.split('/') : ["", ""];
                let triggeredCommands: string[] = commands[0] ? (commands[0].match(/(?:`[^`]*`|[^,])+/g)?.map(s => s.trim()).filter(s => s !== '') ?? []) : [];
                let endedCommands: string[] = commands[1] ? (commands[1].match(/(?:`[^`]*`|[^,])+/g)?.map(s => s.trim()).filter(s => s !== '') ?? []) : [];
                let effectsStrings: string[] = sheet[row][columnEffectsStrings] ? sheet[row][columnEffectsStrings].split(',') : [];
                for (let i = 0; i < effectsStrings.length; i++)
                    effectsStrings[i] = Status.generateValidId(effectsStrings[i]);
                let refreshesStrings: string[] = sheet[row][columnRefreshedStrings] ? sheet[row][columnRefreshedStrings].split(',') : [];
                for (let i = 0; i < refreshesStrings.length; i++)
                    refreshesStrings[i] = Status.generateValidId(refreshesStrings[i]);
                const event = new Event(
                    sheet[row][columnId] ? Game.generateValidEntityName(sheet[row][columnId]) : "",
                    sheet[row][columnOngoing] ? sheet[row][columnOngoing].trim() === "TRUE" : false,
                    durationString,
                    duration,
                    timeRemainingString,
                    timeRemaining,
                    triggerTimesStrings,
                    sheet[row][columnRoomTag] ? sheet[row][columnRoomTag].trim() : "",
                    sheet[row][columnCommandsString] ? sheet[row][columnCommandsString] : "",
                    triggeredCommands,
                    endedCommands,
                    effectsStrings,
                    refreshesStrings,
                    sheet[row][columnTriggeredNarration] ? sheet[row][columnTriggeredNarration].trim() : "",
                    sheet[row][columnEndedNarration] ? sheet[row][columnEndedNarration].trim() : "",
                    row + 2,
                    this.game
                );
                if (this.game.entityFinder.getEvent(event.id)) {
                    errors.push(new Error(`Couldn't load event on row ${event.row}. Another event with this ID already exists.`));
                    continue;
                }
                event.effectsStrings.forEach((effectsString, i) => {
                    const effect = this.game.entityFinder.getStatusEffect(effectsString);
                    if (effect) event.effects[i] = effect;
                });
                event.refreshesStrings.forEach((refreshesString, i) => {
                    const refreshes = this.game.entityFinder.getStatusEffect(refreshesString);
                    if (refreshes) event.refreshes[i] = refreshes;
                });
                if (doErrorChecking) {
                    const error = this.checkEvent(event);
                    if (error instanceof Error) errors.push(error);
                }
                this.game.events.set(event.id, event);
                this.updateEventReferences(event);
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("Events");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("Events");
            resolve(this.game);
        });
    }

    /**
     * Checks an Event for errors.
     * @param event - The event to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkEvent(event: Event): Error | void {
        if (event.id === "" || event.id === null || event.id === undefined)
            return new Error(`Couldn't load event on row ${event.row}. No event ID was given.`);
        if (event.duration !== null && !validateDuration(event.duration))
            return new Error(`Couldn't load event on row ${event.row}. "${event.durationString}" is not a valid duration.`);
        if (event.remaining !== null && !validateDuration(event.remaining))
            return new Error(`Couldn't load event on row ${event.row}. "${event.remainingString}" is not a valid representation of the time remaining.`);
        if (!event.ongoing && event.remaining !== null)
            return new Error(`Couldn't load event on row ${event.row}. The event is not ongoing, but an amount of time remaining was given.`);
        if (event.ongoing && event.duration !== null && event.remaining === null)
            return new Error(`Couldn't load event on row ${event.row}. The event is ongoing and has a duration, but no amount of time remaining was given.`);
        for (let triggerTimeString of event.triggerTimesStrings) {
            let triggerTime = Event.parseTriggerTime(triggerTimeString);
            if (!triggerTime.valid)
                return new Error(`Couldn't load event on row ${event.row}. "${triggerTimeString}" is not a valid time to trigger at.`);
        }
        for (let i = 0; i < event.effects.length; i++) {
            if (!(event.effects[i] instanceof Status))
                return new Error(`Couldn't load event on row ${event.row}. "${event.effectsStrings[i]}" in inflicted status effects is not a status effect.`);
        }
        for (let i = 0; i < event.refreshes.length; i++) {
            if (!(event.refreshes[i] instanceof Status))
                return new Error(`Couldn't load event on row ${event.row}. "${event.refreshesStrings[i]}" in refreshed status effects is not a status effect.`);
        }
    }

    /**
     * Loads data from the Status Effects sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getStatusEffects(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.statusSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnId = 0;
            const columnDuration = 1;
            const columnFatal = 2;
            const columnVisible = 3;
            const columnOverridersStrings = 4;
            const columnCuresStrings = 5;
            const columnNextStageId = 6;
            const columnDuplicatedStatusId = 7;
            const columnCuredConditionId = 8;
            const columnStatModifiersString = 9;
            const columnBehaviorAttributes = 10;
            const columnInflictedDescription = 12;
            const columnCuredDescription = 13;

            this.clearStatusEffects();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                const durationString = sheet[row][columnDuration] ? String(sheet[row][columnDuration]) : "";
                const duration: Duration = durationString !== "" ? parseDuration(durationString) : null;
                let overriders: string[] = sheet[row][columnOverridersStrings] ? sheet[row][columnOverridersStrings].split(',') : [];
                for (let i = 0; i < overriders.length; i++)
                    overriders[i] = Status.generateValidId(overriders[i]);
                let cures: string[] = sheet[row][columnCuresStrings] ? sheet[row][columnCuresStrings].split(',') : [];
                for (let i = 0; i < cures.length; i++)
                    cures[i] = Status.generateValidId(cures[i]);
                const modifierStrings: string[] = sheet[row][columnStatModifiersString] ? sheet[row][columnStatModifiersString].split(',') : [];
                const regex = /^(@)?([^0-9+=-]+)?(\+|-|=)?(.+)?$/gi;
                let modifiers: StatModifier[] = [];
                for (const modifierString of modifierStrings) {
                    const matches = modifierString.trim().matchAll(regex);
                    for (const match of matches) {
                        // Determine if the modifier modifies the player it's applied to or not.
                        let modifiesSelf = true;
                        if (match[1] && match[1] === '@')
                            modifiesSelf = false;
                        // Parse the stat.
                        let stat: string = null;
                        if (match[2])
                            stat = Player.abbreviateStatName(match[2]);
                        // Determine if the modifier assigns the value to the player's stat, or just modifies it.
                        let assignValue = false;
                        if (match[3] && match[3] === '=')
                            assignValue = true;
                        // Parse the value.
                        let value: number = null;
                        if (match[4]) {
                            value = parseInt(match[4]);
                            if (match[3] && match[3] === '-')
                                value *= -1;
                        }
                        modifiers.push({ modifiesSelf: modifiesSelf, stat: stat, assignValue: assignValue, value: value });
                    }
                }
                let behaviorAttributes: string[] = sheet[row][columnBehaviorAttributes] ? sheet[row][columnBehaviorAttributes].split(',') : [];
                for (let i = 0; i < behaviorAttributes.length; i++)
                    behaviorAttributes[i] = behaviorAttributes[i].trim();
                const status = new Status(
                    sheet[row][columnId] ? Status.generateValidId(sheet[row][columnId]) : "",
                    durationString,
                    duration,
                    sheet[row][columnFatal] ? sheet[row][columnFatal].trim() === "TRUE" : false,
                    sheet[row][columnVisible] ? sheet[row][columnVisible].trim() === "TRUE" : false,
                    overriders,
                    cures,
                    sheet[row][columnNextStageId] ? sheet[row][columnNextStageId].trim() : "",
                    sheet[row][columnDuplicatedStatusId] ? sheet[row][columnDuplicatedStatusId].trim() : "",
                    sheet[row][columnCuredConditionId] ? sheet[row][columnCuredConditionId].trim() : "",
                    modifiers,
                    new Set(behaviorAttributes),
                    sheet[row][columnInflictedDescription] ? sheet[row][columnInflictedDescription].trim() : "",
                    sheet[row][columnCuredDescription] ? sheet[row][columnCuredDescription].trim() : "",
                    row + 2,
                    this.game
                );
                if (this.game.entityFinder.getStatusEffect(status.id)) {
                    errors.push(new Error(`Couldn't load status effect on row ${status.row}. Another status effect with this ID already exists.`));
                    continue;
                }
                this.game.statusEffects.set(status.id, status);
                this.updateStatusEffectReferences(status);
            }
            this.game.statusEffects.forEach(status => {
                Status.postProcess(status);
                if (doErrorChecking) {
                    const error = this.checkStatusEffect(status);
                    if (error instanceof Error) errors.push(error);
                }
            });
            for (const status of GameEntityLoader.mandatoryStatusEffects) {
                if (!this.game.statusEffects.has(status)) {
                    errors.push(new Error(`Mandatory status effect "${status}" not found.`));
                }
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("StatusEffects");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("StatusEffects");
            resolve(this.game);
        });
    }

    /**
     * Checks a Status Effect for errors.
     * @param status - The status effect to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkStatusEffect(status: Status): Error | void {
        if (status.id === "" || status.id === null || status.id === undefined)
            return new Error(`Couldn't load status effect on row ${status.row}. No status effect ID was given.`);
        if (status.duration !== null && !validateDuration(status.duration))
            return new Error(`Couldn't load status effect on row ${status.row}. An invalid duration was given.`);
        for (let i = 0; i < status.statModifiers.length; i++) {
            const statModifier = status.statModifiers[i];
            if (statModifier.stat === null)
                return new Error(`Couldn't load status effect on row ${status.row}. No stat in stat modifier ${i + 1} was given.`);
            if (statModifier.stat !== "str" && statModifier.stat !== "per" && statModifier.stat !== "dex" && statModifier.stat !== "spd" && statModifier.stat !== "sta")
                return new Error(`Couldn't load status effect on row ${status.row}. "${statModifier.stat}" in stat modifier ${i + 1} is not a valid stat.`);
            if (statModifier.value === null)
                return new Error(`Couldn't load status effect on row ${status.row}. No number was given in stat modifier ${i + 1}.`);
            if (isNaN(statModifier.value))
                return new Error(`Couldn't load status effect on row ${status.row}. The value given in stat modifier ${i + 1} is not an integer.`);
        }
        for (let i = 0; i < status.overriders.length; i++) {
            if (!(status.overriders[i] instanceof Status))
                return new Error(`Couldn't load status effect on row ${status.row}. "${status.overridersStrings[i]}" in "don't inflict if" is not a status effect.`);
        }
        for (let i = 0; i < status.cures.length; i++) {
            if (!(status.cures[i] instanceof Status))
                return new Error(`Couldn't load status effect on row ${status.row}. "${status.curesStrings[i]}" in cures is not a status effect.`);
        }
        if (status.nextStageId !== "" && !(status.nextStage instanceof Status))
            return new Error(`Couldn't load status effect on row ${status.row}. Next stage "${status.nextStageId}" is not a status effect.`);
        if (status.duplicatedStatusId !== "" && !(status.duplicatedStatus instanceof Status))
            return new Error(`Couldn't load status effect on row ${status.row}. Duplicated status "${status.duplicatedStatusId}" is not a status effect.`);
        if (status.curedConditionId !== "" && !(status.curedCondition instanceof Status))
            return new Error(`Couldn't load status effect on row ${status.row}. Cured condition "${status.curedConditionId}" is not a status effect.`);
    }

    /**
     * Loads data from the Players sheet into the game. Also loads the Inventory Items sheet.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getPlayers(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.playerSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnId = 0;
            const columnName = 1;
            const columnTitle = 2;
            const columnPronouns = 3;
            const columnVoice = 4;
            const columnStrength = 5;
            const columnPerception = 6;
            const columnDexterity = 7;
            const columnSpeed = 8;
            const columnStamina = 9;
            const columnAlive = 10;
            const columnLocationDisplayName = 11;
            const columnHidingSpot = 12;
            const columnStatusStrings = 13;
            const columnDescription = 14;

            this.clearPlayers();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                if (sheet[row][columnName] === "" || sheet[row][columnName] === null || sheet[row][columnName] === undefined) {
                    errors.push(new Error(`Couldn't load player on row ${row + 3}. No player name was given.`));
                    continue;
                }
                const playerName = Player.generateValidName(sheet[row][columnName]) ?? "";
                const spectateChannelName = Room.generateValidId(playerName) ?? "";
                if (spectateChannelName === "") {
                    errors.push(new Error(`Couldn't load player on row ${row + 3}. The name of a player cannot be only special characters.`));
                    continue;
                }
                const stats: Stats = {
                    strength: parseInt(sheet[row][columnStrength]),
                    perception: parseInt(sheet[row][columnPerception]),
                    dexterity: parseInt(sheet[row][columnDexterity]),
                    speed: parseInt(sheet[row][columnSpeed]),
                    stamina: parseInt(sheet[row][columnStamina])
                };
                const statusStrings: string[] = sheet[row][columnStatusStrings] ? sheet[row][columnStatusStrings].split(',') : [];
                let statusDisplays: StatusDisplay[] = new Array(statusStrings.length);
                statusStrings.forEach((statusString, i) => {
                    let statusId = "";
                    let timeRemaining: string = null;
                    if (statusString.includes('(')) {
                        statusId = Status.generateValidId(statusString.substring(0, statusString.lastIndexOf('(')));
                        timeRemaining = statusString.substring(statusString.lastIndexOf('(') + 1, statusString.lastIndexOf(')'));
                    }
                    else statusId = Status.generateValidId(statusString);
                    statusDisplays[i] = { id: statusId, timeRemaining: timeRemaining };
                });
                let member: GuildMember = null;
                let notificationChannel: Messageable = null;
                let spectateChannel: TextChannel = null;
                if (sheet[row][columnTitle] !== "NPC") {
                    try {
                        member = sheet[row][columnId] ? this.game.guildContext.getMember(sheet[row][columnId].trim()) : null;
                        notificationChannel = await this.game.guildContext.createDM(member);
                    } catch (error) { }
                    spectateChannel = await this.game.guildContext.getOrCreateSpectateChannel(spectateChannelName);
                }
                const player = new Player(
                    sheet[row][columnId] ? sheet[row][columnId].trim() : "",
                    member,
                    sheet[row][columnName] ? Player.generateValidName(sheet[row][columnName], true) : "",
                    sheet[row][columnTitle] ? sheet[row][columnTitle].trim() : "",
                    sheet[row][columnPronouns] ? sheet[row][columnPronouns].trim().toLowerCase() : "",
                    sheet[row][columnVoice] ? sheet[row][columnVoice].trim() : "",
                    stats,
                    sheet[row][columnAlive] ? sheet[row][columnAlive].trim() === "TRUE" : false,
                    sheet[row][columnLocationDisplayName] ? sheet[row][columnLocationDisplayName].trim() : "",
                    sheet[row][columnHidingSpot] ? sheet[row][columnHidingSpot].trim() : "",
                    statusDisplays,
                    sheet[row][columnDescription] ? sheet[row][columnDescription].trim() : "",
                    new Collection(),
                    notificationChannel,
                    spectateChannel && spectateChannel.type === ChannelType.GuildText ? spectateChannel : null,
                    row + 3,
                    this.game
                );
                if (this.game.players.has(Game.generateValidEntityName(player.name))) {
                    errors.push(new Error(`Couldn't load player on row ${player.row}. Another player with this name already exists.`));
                    continue;
                }
                const location = this.game.entityFinder.getRoom(player.locationDisplayName);
                if (location) player.setLocation(location);
                if (player.isNPC) player.displayIcon = player.id;
                player.setPronouns(player.originalPronouns, player.pronounString);
                player.setPronouns(player.pronouns, player.pronounString);
                this.game.players.set(Game.generateValidEntityName(player.name), player);

                if (player.alive) {
                    if (player.member !== null || player.isNPC) {
                        if (player.location instanceof Room) {
                            player.location.addPlayer(player);
                            let invalidStatusFound = false;
                            // Parse statuses and inflict the player with them.
                            for (const statusDisplay of player.statusDisplays) {
                                const status = this.game.entityFinder.getStatusEffect(statusDisplay.id);
                                if (status) {
                                    const timeRemainingString = statusDisplay.timeRemaining ? statusDisplay.timeRemaining : "";
                                    const timeRemainingParsed = convertTimeStringToDurationUnits(timeRemainingString);
                                    let timeRemaining: Duration;
                                    if (timeRemainingString !== "") {
                                        if (timeRemainingParsed !== undefined)
                                            timeRemaining = Duration.fromObject(timeRemainingParsed);
                                        else {
                                            errors.push(new Error(`Couldn't load player on row ${player.row}. "${statusDisplay.timeRemaining}" is not a valid representation of the time remaining for the status "${statusDisplay.id}".`));
                                            invalidStatusFound = true;
                                            break;
                                        }
                                    } else timeRemaining = null;
                                    const inflictAction = new InflictAction(this.game, undefined, player, player.location, true);
                                    await inflictAction.performInflict(status, false, false, false, undefined, timeRemaining, true);
                                }
                            }
                            if (invalidStatusFound) continue;
                        }
                    }
                    this.game.livingPlayers.set(Game.generateValidEntityName(player.name), player);
                }
                else
                    this.game.deadPlayers.set(Game.generateValidEntityName(player.name), player);
                this.updatePlayerReferences(player);
            }

            // Now load player inventories.
            try {
                await this.#getInventoryItems(false);
            }
            catch (error) {
                errors.push(...error);
            }
            if (doErrorChecking) {
                for (const player of this.game.players.values()) {
                    let error = await this.checkPlayer(player);
                    if (error instanceof Error) errors.push(error);
                    // Get all inventory items that are assigned to this player and check for errors on them.
                    const playerInventoryItems = this.game.inventoryItems.filter(item => item.player instanceof Player && item.player.name === player.name);
                    playerInventoryItems.forEach(inventoryItem => {
                        error = this.checkInventoryItem(inventoryItem);
                        if (error instanceof Error) errors.push(error);
                    });
                }
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("Players");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("Players");
            // Ensure parties are reassigned properly after loading players.
            for (const party of this.game.parties.values())
                party.forciblyAssignToMembers();
            resolve(this.game);
        });
    }

    /**
     * Checks a Player for errors.
     * @param player - The player to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    async checkPlayer(player: Player): Promise<Error | void> {
        if (!player.isNPC && (player.id === "" || player.id === null || player.id === undefined))
            return new Error(`Couldn't load player on row ${player.row}. No Discord ID was given.`);
        const iconURLSyntax = /(http(s?):\/\/.*?\.(jpg|jpeg|png|webp|avif))(\?[^\s]*)?$/;
        if (player.isNPC && (player.id === "" || player.id === null || player.id === undefined || !iconURLSyntax.test(player.id)))
            return new Error(`Couldn't load player on row ${player.row}. The Discord ID for an NPC must be a URL with a .jpg, .jpeg, .png, .webp, or .avif extension.`);
        if (!player.isNPC && (player.member === null || player.member === undefined))
            return new Error(`Couldn't load player on row ${player.row}. There is no member on the server with the ID ${player.id}.`);
        const canDmPlayer = !player.isNPC ? await this.#checkCanDmPlayer(player) : true;
        if (!canDmPlayer)
            return new Error(`Couldn't load player on row ${player.row}. Cannot send direct messages. Please ask <@${player.id}> to allow direct messages from server members in their privacy settings for this server.`);
        if (player.name.includes(" "))
            return new Error(`Couldn't load player on row ${player.row}. Player names must not have any spaces.`);
        if (player.originalPronouns.sbj === null || player.originalPronouns.sbj === "")
            return new Error(`Couldn't load player on row ${player.row}. No subject pronoun was given.`);
        if (player.originalPronouns.obj === null || player.originalPronouns.obj === "")
            return new Error(`Couldn't load player on row ${player.row}. No object pronoun was given.`);
        if (player.originalPronouns.dpos === null || player.originalPronouns.dpos === "")
            return new Error(`Couldn't load player on row ${player.row}. No dependent possessive pronoun was given.`);
        if (player.originalPronouns.ipos === null || player.originalPronouns.ipos === "")
            return new Error(`Couldn't load player on row ${player.row}. No independent possessive pronoun was given.`);
        if (player.originalPronouns.ref === null || player.originalPronouns.ref === "")
            return new Error(`Couldn't load player on row ${player.row}. No reflexive pronoun was given.`);
        if (player.originalPronouns.plural === null)
            return new Error(`Couldn't load player on row ${player.row}. Whether the player's pronouns pluralize verbs was not specified.`);
        if (player.originalVoiceString === "" || player.originalVoiceString === null || player.originalVoiceString === undefined)
            return new Error(`Couldn't load player on row ${player.row}. No voice descriptor was given.`);
        if (isNaN(player.strength))
            return new Error(`Couldn't load player on row ${player.row}. The strength stat given is not an integer.`);
        if (isNaN(player.perception))
            return new Error(`Couldn't load player on row ${player.row}. The perception stat given is not an integer.`);
        if (isNaN(player.dexterity))
            return new Error(`Couldn't load player on row ${player.row}. The dexterity stat given is not an integer.`);
        if (isNaN(player.speed))
            return new Error(`Couldn't load player on row ${player.row}. The speed stat given is not an integer.`);
        if (isNaN(player.stamina))
            return new Error(`Couldn't load player on row ${player.row}. The stamina stat given is not an integer.`);
        if (player.alive && !(player.location instanceof Room))
            return new Error(`Couldn't load player on row ${player.row}. "${player.locationDisplayName}" is not a room.`);
        for (let statusDisplay of player.statusDisplays) {
            if (!player.hasStatus(statusDisplay.id) && (statusDisplay.timeRemaining ? convertTimeStringToDurationUnits(statusDisplay.timeRemaining) !== undefined : true))
                return new Error(`Couldn't load player on row ${player.row}. "${statusDisplay.id}" is not a status effect.`);
        }
    }

    /**
     * Loads data from the Inventory Items sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getInventoryItems(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.inventorySheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnPlayerName = 0;
            const columnPrefabId = 1;
            const columnIdentifier = 2;
            const columnEquipmentSlotId = 3;
            const columnContainerName = 4;
            const columnQuantity = 5;
            const columnUses = 6;
            const columnDescription = 7;

            this.clearInventoryItems();
            let containerItems = new Collection<string, InventoryItem>();
            let unloadedContainers = new Collection<string, InventoryItem[]>();
            let equipmentSlots = new Collection<string, Collection<string, EquipmentSlot>>();
            let unloadedEquipmentSlots = new Collection<string, Collection<string, InventoryItem[]>>();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                const containerName = sheet[row][columnContainerName] ? Game.generateValidEntityName(sheet[row][columnContainerName]) : "";
                let containerType = "";
                if (containerName) containerType = "InventoryItem";
                let inventoryItem: InventoryItem;
                if (sheet[row][columnPrefabId] && sheet[row][columnPrefabId].trim() !== "NULL") {
                    inventoryItem = new InventoryItem(
                        sheet[row][columnPlayerName] ? sheet[row][columnPlayerName].trim() : "",
                        sheet[row][columnPrefabId] ? Game.generateValidEntityName(sheet[row][columnPrefabId]) : "",
                        sheet[row][columnIdentifier] ? Game.generateValidEntityName(sheet[row][columnIdentifier]) : "",
                        sheet[row][columnEquipmentSlotId] ? Game.generateValidEntityName(sheet[row][columnEquipmentSlotId]) : "",
                        containerType,
                        containerName,
                        parseInt(sheet[row][columnQuantity]),
                        parseInt(sheet[row][columnUses]),
                        sheet[row][columnDescription] ? sheet[row][columnDescription].trim() : "",
                        row + 2,
                        this.game
                    );
                    const prefab = this.game.entityFinder.getPrefab(inventoryItem.prefabId);
                    if (prefab) {
                        inventoryItem.setPrefab(prefab);
                        inventoryItem.setNames();
                        inventoryItem.initializeInventory();
                    }
                    if (inventoryItem.quantity !== 0 && inventoryItem.identifier !== "" && inventoryItem.inventory.size > 0) {
                        if (containerItems.get(inventoryItem.identifier)) {
                            errors.push(new Error(`Couldn't load inventory item on row ${inventoryItem.row}. Another inventory item with this container identifier already exists.`));
                            continue;
                        }
                        containerItems.set(inventoryItem.identifier, inventoryItem);
                        // If this item's identifier is already in the unloadedContainers collection, we can set it as the container for its child items.
                        const unassignedChildItems: InventoryItem[] = unloadedContainers.get(inventoryItem.identifier);
                        if (unassignedChildItems) {
                            unassignedChildItems.forEach(childItem => {
                                childItem.setContainer(inventoryItem);
                                inventoryItem.insertItem(childItem, childItem.slot);
                            });
                            unloadedContainers.delete(inventoryItem.identifier);
                        }
                    }
                    const containerNameSplit: string[] = inventoryItem.containerName.split('/').length > 1 ?
                        inventoryItem.containerName.split('/') : [inventoryItem.containerName, ''];
                    const identifier = Game.generateValidEntityName(containerNameSplit[0]);
                    const slotId = Game.generateValidEntityName(containerNameSplit[1]);
                    if (slotId) inventoryItem.slot = slotId;
                    const container: InventoryItem = containerItems.get(identifier);
                    if (container) {
                        inventoryItem.setContainer(container);
                        container.insertItem(inventoryItem, slotId);
                    }
                    else {
                        // If the container item wasn't found, it might have just not been loaded yet. Save it for later.
                        let unassignedChildItems: InventoryItem[] = unloadedContainers.get(identifier);
                        if (!unassignedChildItems) unassignedChildItems = [];
                        unassignedChildItems.push(inventoryItem);
                        unloadedContainers.set(identifier, unassignedChildItems);
                    }
                }
                else {
                    inventoryItem = new InventoryItem(
                        sheet[row][columnPlayerName] ? sheet[row][columnPlayerName].trim() : "",
                        "",
                        "",
                        sheet[row][columnEquipmentSlotId] ? Game.generateValidEntityName(sheet[row][columnEquipmentSlotId]) : "",
                        "",
                        "",
                        null,
                        null,
                        "",
                        row + 2,
                        this.game
                    );
                    inventoryItem.prefab = null;
                }
                const player: Player = sheet[row][columnPlayerName] ? this.game.entityFinder.getPlayer(sheet[row][columnPlayerName]) : null;
                if (player) {
                    inventoryItem.setPlayer(player);
                    if (inventoryItem.equipmentSlot !== "" && inventoryItem.containerName !== "") {
                        let foundEquipmentSlot = false;
                        const playerEquipmentSlots: Collection<string, EquipmentSlot> = equipmentSlots.get(player.name);
                        if (playerEquipmentSlots) {
                            const equipmentSlot: EquipmentSlot = playerEquipmentSlots.get(inventoryItem.equipmentSlot);
                            if (equipmentSlot) {
                                foundEquipmentSlot = true;
                                equipmentSlot.insertItem(inventoryItem);
                            }
                        }
                        if (!foundEquipmentSlot) {
                            // If the equipment slot wasn't found, it might have just not been loaded yet. Save it for later.
                            let unloadedPlayerEquipmentSlots: Collection<string, InventoryItem[]> = unloadedEquipmentSlots.get(player.name);
                            if (!unloadedPlayerEquipmentSlots) unloadedPlayerEquipmentSlots = new Collection();
                            let unassignedEquipmentSlotItems: InventoryItem[] = unloadedPlayerEquipmentSlots.get(inventoryItem.equipmentSlot);
                            if (!unassignedEquipmentSlotItems) unassignedEquipmentSlotItems = [];
                            unassignedEquipmentSlotItems.push(inventoryItem);
                            unloadedPlayerEquipmentSlots.set(inventoryItem.equipmentSlot, unassignedEquipmentSlotItems);
                            unloadedEquipmentSlots.set(player.name, unloadedPlayerEquipmentSlots);
                        }
                    }
                }
                if (player && inventoryItem.equipmentSlot !== "" && inventoryItem.containerName === "") {
                    // Create the corresponding equipment slot for the player, if it doesn't already exist.
                    let playerEquipmentSlots: Collection<string, EquipmentSlot> = equipmentSlots.get(player.name);
                    if (!playerEquipmentSlots) playerEquipmentSlots = new Collection();
                    if (playerEquipmentSlots.get(inventoryItem.equipmentSlot)) {
                        errors.push(new Error(`Couldn't load inventory item on row ${inventoryItem.row}. ${player.name} already has an equipment slot with this ID.`));
                        continue;
                    }
                    const equipmentSlot = new EquipmentSlot(inventoryItem.equipmentSlot, inventoryItem.row, this.game);
                    equipmentSlot.equipItem(inventoryItem);
                    playerEquipmentSlots.set(equipmentSlot.id, equipmentSlot);
                    equipmentSlots.set(player.name, playerEquipmentSlots);
                    // If this equipment slot's ID is in the unloadedEquipmentSlots collection, we can insert any previously unassigned items into it.
                    const unloadedPlayerEquipmentSlots: Collection<string, InventoryItem[]> = unloadedEquipmentSlots.get(player.name);
                    if (unloadedPlayerEquipmentSlots) {
                        const unassignedEquipmentSlotItems: InventoryItem[] = unloadedPlayerEquipmentSlots.get(inventoryItem.equipmentSlot);
                        if (unassignedEquipmentSlotItems) {
                            unassignedEquipmentSlotItems.forEach(unassignedItem => {
                                equipmentSlot.insertItem(unassignedItem);
                            });
                            unloadedEquipmentSlots.get(player.name).delete(inventoryItem.equipmentSlot);
                        }
                    }
                }
                this.game.inventoryItems.push(inventoryItem);
            }
            this.game.players.forEach(player => {
                const playerEquipmentSlots: Collection<string, EquipmentSlot> = equipmentSlots.get(player.name);
                if (playerEquipmentSlots) {
                    player.setInventory(playerEquipmentSlots);
                    player.updateCarryWeight();
                }
            });
            if (doErrorChecking) {
                this.game.inventoryItems.forEach(inventoryItem => {
                    const error = this.checkInventoryItem(inventoryItem);
                    if (error instanceof Error) errors.push(error);
                });
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("InventoryItems");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("InventoryItems");
            resolve(this.game);
        });
    }

    /**
     * Checks an InventoryItem for errors.
     * @param item - The inventory item to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkInventoryItem(item: InventoryItem): Error | void {
        if (item.playerName === "")
            return new Error(`Couldn't load inventory item on row ${item.row}. No player name was given.`);
        if (!(item.player instanceof Player))
            return new Error(`Couldn't load inventory item on row ${item.row}. "${item.playerName}" is not a player.`);
        if (isNaN(item.quantity))
            return new Error(`Couldn't load inventory item on row ${item.row}. No quantity was given.`);
        if (item.prefab !== null) {
            if (!(item.prefab instanceof Prefab))
                return new Error(`Couldn't load inventory item on row ${item.row}. "${item.prefabId}" is not a prefab.`);
            if (item.inventory.size > 0 && item.identifier === "")
                return new Error(`Couldn't load inventory item on row ${item.row}. This item is capable of containing items, but no container identifier was given.`);
            if (item.inventory.size > 0 && (item.quantity > 1))
                return new Error(`Couldn't load inventory item on row ${item.row}. Items capable of containing items must have a quantity of 1.`);
            if (item.identifier !== "" && item.quantity !== 0 && this.game.roomItems.filter(roomItem => roomItem.identifier === item.identifier && roomItem.quantity !== 0).length
                + this.game.inventoryItems.filter(inventoryItem => inventoryItem.identifier === item.identifier && inventoryItem.quantity !== 0).length > 1)
                return new Error(`Couldn't load inventory item on row ${item.row}. Another item or inventory item with this container identifier already exists.`);
            if (item.pluralContainingPhrase === "" && (item.quantity > 1))
                return new Error(`Couldn't load inventory item on row ${item.row}. Quantity is higher than 1, but its prefab on row ${item.prefab.row} has no plural containing phrase.`);
            if (!item.player.inventory.get(item.equipmentSlot))
                return new Error(`Couldn't load inventory item on row ${item.row}. Couldn't find equipment slot "${item.equipmentSlot}".`);
            if (item.quantity !== 0 && item.equipmentSlot !== "RIGHT HAND" && item.equipmentSlot !== "LEFT HAND" && item.containerName !== "" && (item.container === null || item.container === undefined))
                return new Error(`Couldn't load inventory item on row ${item.row}. Couldn't find container "${item.containerName}".`);
            if (item.container instanceof InventoryItem && item.container.inventory.size === 0)
                return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is an inventory item, but the item container's prefab on row ${item.container.prefab.row} has no inventory slots.`);
            if (item.container instanceof InventoryItem) {
                if (item.slot === "") return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is an inventory item, but a prefab inventory slot name was not given.`);
                const inventorySlot = item.container.inventory.get(item.slot);
                if (!inventorySlot)
                    return new Error(`Couldn't load inventory item on row ${item.row}. The item's container prefab on row ${item.container.prefab.row} has no inventory slot "${item.slot}".`);
                if (inventorySlot.takenSpace > inventorySlot.capacity)
                    return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is over capacity.`);
                const containerChain = new Set<number>();
                let container: InventoryItem = item;
                while (container instanceof InventoryItem) {
                    if (containerChain.has(container.row)) return new Error(`Couldn't load room item on row ${item.row}. The item's container chain contains itself, resulting in an infinite loop.`);
                    containerChain.add(container.row);
                    container = container.container;
                }
            }
        }
    }

    /**
     * Loads data from the Gestures sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getGestures(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.gestureSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnId = 0;
            const columnRequires = 1;
            const columnDisabledStatusesStrings = 2;
            const columnDescription = 3;
            const columnNarration = 4;

            this.clearGestures();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                let requiresStrings: string[] = sheet[row][columnRequires] ? sheet[row][columnRequires].split(',') : [];
                requiresStrings.forEach((requiresString, i) => {
                    const requiresStringUpper = requiresString.toUpperCase().trim();
                    if (requiresStringUpper === "EXIT")
                        requiresStrings[i] = "Exit";
                    else if (requiresStringUpper === "FIXTURE" || requiresStringUpper === "OBJECT")
                        requiresStrings[i] = "Fixture";
                    else if (requiresStringUpper === "ROOMITEM" || requiresStringUpper === "ROOM ITEM" || requiresStringUpper === "ITEM")
                        requiresStrings[i] = "RoomItem";
                    else if (requiresStringUpper === "PLAYER")
                        requiresStrings[i] = "Player";
                    else if (requiresStringUpper === "INVENTORYITEM" || requiresStringUpper === "INVENTORY ITEM")
                        requiresStrings[i] = "InventoryItem";
                    else requiresStrings[i] = requiresString.trim();
                });
                let disabledStatusesStrings: string[] = sheet[row][columnDisabledStatusesStrings] ? sheet[row][columnDisabledStatusesStrings].split(',') : [];
                disabledStatusesStrings.forEach((disabledStatusString, i) => {
                    disabledStatusesStrings[i] = Status.generateValidId(disabledStatusString);
                });
                const gesture = new Gesture(
                    sheet[row][columnId] ? Gesture.generateValidId(sheet[row][columnId]) : "",
                    requiresStrings,
                    disabledStatusesStrings,
                    sheet[row][columnDescription] ? sheet[row][columnDescription].trim() : "",
                    sheet[row][columnNarration] ? sheet[row][columnNarration].trim() : "",
                    row + 2,
                    this.game
                );
                if (this.game.entityFinder.getGesture(gesture.id)) {
                    errors.push(new Error(`Couldn't load gesture on row ${gesture.row}. No gesture ID was given.`));
                    continue;
                }
                gesture.disabledStatusesStrings.forEach((disabledStatusString, i) => {
                    const disabledStatus = this.game.entityFinder.getStatusEffect(disabledStatusString);
                    if (disabledStatus) gesture.disabledStatuses[i] = disabledStatus;
                });
                if (doErrorChecking) {
                    let error = this.checkGesture(gesture);
                    if (error instanceof Error) errors.push(error);
                }
                this.game.gestures.set(gesture.id, gesture);
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("Gestures");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("Gestures");
            resolve(this.game);
        });
    }

    /**
     * Checks a Gesture for errors.
     * @param gesture - The gesture to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkGesture(gesture: Gesture): Error | void {
        if (gesture.id === "" || gesture.id === null || gesture.id === undefined)
            return new Error(`Couldn't load gesture on row ${gesture.row}. No gesture ID was given.`);
        for (let requireType of gesture.requires) {
            if (requireType !== "Exit" && requireType !== "Fixture" && requireType !== "RoomItem" && requireType !== "Player" && requireType !== "InventoryItem")
                return new Error(`Couldn't load gesture on row ${gesture.row}. "${requireType}" is not a valid requirement type.`);
        }
        for (let i = 0; i < gesture.disabledStatuses.length; i++) {
            if (!(gesture.disabledStatuses[i] instanceof Status))
                return new Error(`Couldn't load gesture on row ${gesture.row}. "${gesture.disabledStatusesStrings[i]}" in "don't allow if" is not a status effect.`);
        }
        if (gesture.description === "")
            return new Error(`Couldn't load gesture on row ${gesture.row}. No description was given.`);
        if (gesture.narration.text === "")
            return new Error(`Couldn't load gesture on row ${gesture.row}. No narration was given.`);
    }

    /**
     * Loads data from the Flags sheet into the game.
     * @param doErrorChecking - Whether or not to check for errors.
     */
    #getFlags(doErrorChecking: boolean): Promise<Game> {
        return new Promise(async (resolve, reject) => {
            const response: ValueRange = await getSheetValues(this.game.constants.flagSheetDataCells, this.game.settings.spreadsheetID);
            const sheet: string[][] = response?.values ? response?.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnId = 0;
            const columnValue = 1;
            const columnValueScript = 2;
            const columnCommandsString = 3;

            this.clearFlags();
            let errors: Error[] = [];
            for (let row = 0; row < sheet.length; row++) {
                let commandString = sheet[row][columnCommandsString] ? sheet[row][columnCommandsString].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\').replace(/(?<=http(s?)):(?=.*?(jpg|jpeg|png|webp|avif))/g, '@') : "";
                let commandSets: FlagCommandSet[] = [];
                let getCommands = function (commandString: string): FlagCommandSet {
                    const commands: string[] = commandString.split('/');
                    let setCommands: string[] = commands[0] ? (commands[0].match(/(?:`[^`]*`|[^,])+/g)?.map(s => s.trim()).filter(s => s !== '') ?? []) : [];
                    let clearedCommands: string[] = commands[1] ? (commands[1].match(/(?:`[^`]*`|[^,])+/g)?.map(s => s.trim()).filter(s => s !== '') ?? []) : [];
                    return { setCommands: setCommands, clearedCommands: clearedCommands };
                };
                const regex = new RegExp(/(\[((.*?): (.*?))\],?)/g);
                if (!!commandString.match(regex)) {
                    let match: RegExpExecArray | null;
                    while (match = regex.exec(commandString)) {
                        const commandSet = match[2];
                        let values = commandSet.substring(0, commandSet.lastIndexOf(':')).split(',');
                        for (let j = 0; j < values.length; j++)
                            values[j] = values[j].trim();
                        const commands = getCommands(commandSet.substring(commandSet.lastIndexOf(':') + 1));
                        commandSets.push({ values: values, setCommands: commands.setCommands, clearedCommands: commands.clearedCommands });
                    }
                }
                else {
                    const commands = getCommands(sheet[row][columnCommandsString] ? sheet[row][columnCommandsString] : "");
                    commandSets.push({ values: [], setCommands: commands.setCommands, clearedCommands: commands.clearedCommands });
                }
                let valueString = sheet[row][columnValue] ? sheet[row][columnValue].trim() : null;
                let value: string | number | boolean;
                if (!isNaN(parseFloat(valueString))) value = parseFloat(valueString);
                else if (valueString === "TRUE") value = true;
                else if (valueString === "FALSE") value = false;
                else value = valueString;

                let flag = new Flag(
                    sheet[row][columnId] ? Game.generateValidEntityName(sheet[row][columnId]) : "",
                    value,
                    sheet[row][columnValueScript] ? sheet[row][columnValueScript].trim() : "",
                    sheet[row][columnCommandsString] ? sheet[row][columnCommandsString].trim() : "",
                    commandSets,
                    row + 2,
                    this.game
                );
                if (this.game.entityFinder.getFlag(flag.id)) {
                    errors.push(new Error(`Couldn't get flag on row ${flag.row}. Another flag with this ID already exists.`));
                    continue;
                }
                this.game.flags.set(flag.id, flag);
                this.updateFlagReferences(flag);
            }
            if (doErrorChecking) {
                this.game.flags.forEach(flag => {
                    const error = this.checkFlag(flag);
                    if (error instanceof Error) errors.push(error);
                });
            }
            if (errors.length > 0) {
                this.game.loadedEntitiesWithErrors.add("Flags");
                errors = this.#trimErrors(errors);
                reject(errors);
            }
            this.game.loadedEntitiesWithErrors.delete("Flags");
            resolve(this.game);
        });
    }

    /**
     * Checks a Flag for errors.
     * @param flag - The flag to check.
     * @returns An Error, if there is one. Otherwise, returns nothing.
     */
    checkFlag(flag: Flag): Error | void {
        if (flag.id === "" || flag.id === null || flag.id === undefined)
            return new Error(`Couldn't load flag on row ${flag.row}. No flag ID was given.`);
        if (flag.value !== null && typeof flag.value !== "string" && typeof flag.value !== "number" && typeof flag.value !== "boolean")
            return new Error(`Couldn't load flag on row ${flag.row}. The value is not a string, number, boolean, or null.`);
        if (flag.valueScript !== "") {
            try {
                const value = flag.evaluate(flag.valueScript);
                flag.value = value;
            } catch (err) { return new Error(`Couldn't get flag on row ${flag.row}. The value script contains an error: ${err.message}`) }
        }
    }

    /**
     * Trims the number of errors to fit in a single Discord message.
     * @param errors - An array of errors to trim.
     * @returns The trimmed array of errors.
     */
    #trimErrors(errors: Error[]): Error[] {
        const tooManyErrors = errors.length > 20 || errors.join('\n').length >= 1980;
        while (errors.length > 20 || errors.join('\n').length >= 1980)
            errors = errors.slice(0, errors.length - 1);
        if (tooManyErrors)
            errors.push(new Error("Too many errors."));
        return errors;
    }

    /**
     * Prints an array or map of entities to the console.
     * @param data - The data to print.
     */
    #printData(data: PersistentGameEntity[] | Map<string, PersistentGameEntity>): void {
        if (data instanceof Array) {
            for (let i = 0; i < data.length; i++) {
                console.log(this.game.clientContext.prettyPrinter.prettyObject(data[i]));
            }
        }
        else if (data instanceof Map) {
            data.forEach(entry => {
                console.log(this.game.clientContext.prettyPrinter.prettyObject(entry));
            });
        }
    }

    /**
     * Checks whether or not the member can receive direct messages from guild members.
     * @param player - The player to check for.
     * @returns True if the player can receive direct messages from guild members, false if not.
     */
    #checkCanDmPlayer(player: Player): Promise<boolean> {
        return new Promise(resolve => {
            if (player.member) {
                player.member.send('')
                .then(() => resolve(true))
                .catch(error => {
                    if (error.hasOwnProperty("code") && (error.code === 50007 || error.code === 50278))
                        resolve(false);
                    else resolve(true);
                });
            }
            else resolve(false);
        });
    }
}
