import { getSheetValues } from './sheets.js';

import Game from '../Data/Game.js';
import Exit from '../Data/Exit.js';
import Room from '../Data/Room.js';
import Fixture from '../Data/Fixture.js';
import Prefab from '../Data/Prefab.js';
import InventorySlot from '../Data/InventorySlot.js';
import Recipe from '../Data/Recipe.js';
import RoomItem from '../Data/RoomItem.js';
import Puzzle from '../Data/Puzzle.js';
import Event from '../Data/Event.js';
import EquipmentSlot from '../Data/EquipmentSlot.js';
import InventoryItem from '../Data/InventoryItem.js';
import Status from '../Data/Status.js';
import Player from '../Data/Player.js';
import Gesture from '../Data/Gesture.js';
import Flag from '../Data/Flag.js';
import { convertTimeStringToDurationUnits, parseDuration } from './helpers.js';
import { ChannelType, Collection } from 'discord.js';
import dayjs from 'dayjs';
dayjs().format();

/**
 * Loads data from the Rooms sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadRooms(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.roomSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnRoomDisplayName = 0;
        const columnRoomTags = 1;
        const columnRoomIconUrl = 2;
        const columnExitName = 3;
        const columnExitPosX = 4;
        const columnExitPosY = 5;
        const columnExitPosZ = 6;
        const columnExitUnlocked = 7;
        const columnExitDest = 8;
        const columnExitLink = 9;
        const columnExitDescription = 10;

        game.entityManager.clearRooms();
        /** @type {Error[]} */
        let errors = [];
        for (let roomRow = 0, exitRow = 0; roomRow < sheet.length; roomRow = roomRow + exitRow) {
            /** @type {Collection<string, Exit>} */
            let exits = new Collection();
            for (exitRow = 0; roomRow + exitRow < sheet.length && (exitRow === 0 || sheet[roomRow + exitRow][columnRoomDisplayName] === ""); exitRow++) {
                const pos = {
                    x: parseInt(sheet[roomRow + exitRow][columnExitPosX]),
                    y: parseInt(sheet[roomRow + exitRow][columnExitPosY]),
                    z: parseInt(sheet[roomRow + exitRow][columnExitPosZ])
                };
                const exitName = sheet[roomRow + exitRow][columnExitName] ? Game.generateValidEntityName(sheet[roomRow + exitRow][columnExitName]) : "";
                const exit = new Exit(
                    exitName,
                    pos,
                    sheet[roomRow + exitRow][columnExitUnlocked] ? sheet[roomRow + exitRow][columnExitUnlocked].trim() === "TRUE" : false,
                    sheet[roomRow + exitRow][columnExitDest] ? sheet[roomRow + exitRow][columnExitDest].trim() : "",
                    sheet[roomRow + exitRow][columnExitLink] ? Game.generateValidEntityName(sheet[roomRow + exitRow][columnExitLink]) : "",
                    sheet[roomRow + exitRow][columnExitDescription] ? sheet[roomRow + exitRow][columnExitDescription].trim() : "",
                    roomRow + exitRow + 2,
                    game
                );
                if (exits.get(exit.name))
                    errors.push(new Error(`Couldn't load exit on row ${exit.row}. The room already has an exit named "${exit.name}".`));
                else exits.set(exit.name, exit);
            }
            const id = sheet[roomRow][columnRoomDisplayName] ? Room.generateValidId(sheet[roomRow][columnRoomDisplayName]) : "";
            let channel = game.guildContext.guild.channels.cache.find(channel => channel.name === id);
            if (channel === null || channel === undefined) {
                for (const roomCategoryId of game.guildContext.roomCategories) {
                    const roomCategory = game.guildContext.guild.channels.resolve(roomCategoryId);
                    if (roomCategory === null || roomCategory === undefined)
                        continue;
                    const roomCategorySize = game.guildContext.guild.channels.cache.filter(
                        (channel) => channel.parent && channel.parentId === roomCategory.id
                    ).size;
                    if (roomCategory.type === ChannelType.GuildCategory && roomCategorySize < 50) {
                        channel = await game.guildContext.guild.channels.create({
                            name: id,
                            type: ChannelType.GuildText,
                            parent: roomCategory,
                        });
                        break;
                    }
                }
            }
            let tags = sheet[roomRow][columnRoomTags] ? sheet[roomRow][columnRoomTags].trim().split(',') : [];
            for (let i = 0; i < tags.length; i++)
                tags[i] = tags[i].trim();
            const room = new Room(
                id,
                sheet[roomRow][columnRoomDisplayName] ? sheet[roomRow][columnRoomDisplayName].trim() : "",
                channel && channel.type === ChannelType.GuildText ? channel : null,
                tags,
                sheet[roomRow][columnRoomIconUrl] ? sheet[roomRow][columnRoomIconUrl].trim() : "",
                exits,
                sheet[roomRow][columnExitDescription] ? sheet[roomRow][columnExitDescription].trim() : "",
                roomRow + 2,
                game
            );
            if (game.entityFinder.getRoom(room.id)) {
                errors.push(new Error(`Couldn't load room on row ${room.row}. Another room with the same ID already exists.`));
                continue;
            }
            game.roomsCollection.set(room.id, room);
        }
        // Now go through and make the dest for each exit an actual Room object.
        game.roomsCollection.forEach(room => {
            room.exitCollection.forEach(exit => {
                const dest = game.entityFinder.getRoom(exit.destDisplayName);
                if (dest) exit.dest = dest;
            });
            if (doErrorChecking) {
                const error = checkRoom(room);
                if (error instanceof Error) errors.push(error);
            }
            game.entityManager.updateRoomReferences(room);
        });
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("Rooms");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("Rooms");
        resolve(game);
    });
}

/**
 * Checks a Room for errors.
 * @param {Room} room - The room to check.
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkRoom(room) {
    if (room.displayName === "" || room.displayName === null || room.displayName === undefined)
        return new Error(`Couldn't load room on row ${room.row}. No room display name was given.`);
    if (room.id === "" || room.id === null || room.id === undefined)
        return new Error(`Couldn't load room on row ${room.row}. The room display name resolved to a unique ID with an empty value.`);
    if (room.id.length > 100)
        return new Error(`Couldn't load room on row ${room.row}. The room ID exceeds 100 characters in length.`);
    if (room.channel === null || room.channel === undefined)
        return new Error(`Couldn't load room "${room.id}" on row ${room.row}. There is no corresponding channel on the server, and a channel to accommodate the room could not be automatically created.`);
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|gif|webp|avif))$');
    if (room.iconURL !== "" && !iconURLSyntax.test(room.iconURL))
        return new Error(`Couldn't load room on row ${room.row}. The icon URL must have a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);
    for (const exit of room.exitCollection.values()) {
        if (exit.name === "" || exit.name === null || exit.name === undefined)
            return new Error(`Couldn't load exit on row ${exit.row}. No exit name was given.`);
        if (isNaN(exit.pos.x))
            return new Error(`Couldn't load exit on row ${exit.row}. The X-coordinate given is not an integer.`);
        if (isNaN(exit.pos.y))
            return new Error(`Couldn't load exit on row ${exit.row}. The Y-coordinate given is not an integer.`);
        if (isNaN(exit.pos.z))
            return new Error(`Couldn't load exit on row ${exit.row}. The Z-coordinate given is not an integer.`);
        if (exit.link === "" || exit.link === null || exit.link === undefined)
            return new Error(`Couldn't load exit on row ${exit.row}. No linked exit was given.`);
        if (exit.destDisplayName === "" || exit.destDisplayName === null || exit.destDisplayName === undefined)
            return new Error(`Couldn't load exit on row ${exit.row}. No destination was given.`);
        if (!(exit.dest instanceof Room))
            return new Error(`Couldn't load exit on row ${exit.row}. The destination given is not a room.`);
        let matchingExit = false;
        for (const destExit of exit.dest.exitCollection.values()) {
            if (destExit.link === exit.name) {
                matchingExit = true;
                break;
            }
        }
        if (!matchingExit)
            return new Error(`Couldn't load exit on row ${exit.row}. Room "${exit.dest.displayName}"  does not have an exit that links back to it.`);
    }
}

/**
 * Loads data from the Fixtures sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadFixtures(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.fixtureSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
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

        game.entityManager.clearFixtures();
        /** @type {Error[]} */
        let errors = [];
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
                game
            );
            const location = game.entityFinder.getRoom(fixture.locationDisplayName);
            if (location) fixture.setLocation(location);
            const childPuzzle = game.entityFinder.getPuzzle(fixture.childPuzzleName, fixture.locationDisplayName);
            if (childPuzzle) fixture.setChildPuzzle(childPuzzle);
            if (doErrorChecking) {
                const error = checkFixture(fixture);
                if (error instanceof Error) errors.push(error);
            }
            game.fixtures.push(fixture);
            game.entityManager.updateFixtureReferences(fixture);
        }
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("Fixtures");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("Fixtures");
        resolve(game);
    });
}

/**
 * Checks a Fixture for errors.
 * @param {Fixture} fixture - The fixture to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkFixture(fixture) {
    if (fixture.name === "" || fixture.name === null || fixture.name === undefined)
        return new Error(`Couldn't load fixture on row ${fixture.row}. No fixture name was given.`);
    if (!(fixture.location instanceof Room))
        return new Error(`Couldn't load fixture on row ${fixture.row}. The location given is not a room.`);
    if (fixture.childPuzzleName !== "" && !(fixture.childPuzzle instanceof Puzzle))
        return new Error(`Couldn't load fixture on row ${fixture.row}. The child puzzle given is not a puzzle.`);
    if (fixture.childPuzzle !== null && fixture.childPuzzle !== undefined && (fixture.childPuzzle.parentFixture === null || fixture.childPuzzle.parentFixture === undefined))
        return new Error(`Couldn't load fixture on row ${fixture.row}. The child puzzle on row ${fixture.childPuzzle.row} has no parent fixture.`);
    if (fixture.childPuzzle !== null && fixture.childPuzzle !== undefined && fixture.childPuzzle.parentFixture !== null && fixture.childPuzzle.parentFixture !== undefined && fixture.childPuzzle.parentFixture.name !== fixture.name)
        return new Error(`Couldn't load fixture on row ${fixture.row}. The child puzzle has a different parent fixture.`);
    if (isNaN(fixture.hidingSpotCapacity))
        return new Error(`Couldn't load fixture on row ${fixture.row}. The hiding spot capacity given is not a number.`);
}

/**
 * Loads data from the Prefabs sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadPrefabs(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.prefabSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
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

        game.entityManager.clearPrefabs();
        /** @type {Collection<string, string[]>} */
        let nextStageAssignments = new Collection();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            // Separate name and plural name.
            const name = sheet[row][columnName] ? sheet[row][columnName].split(',') : "";
            // Separate single containing phrase and plural containing phrase.
            const containingPhrase = sheet[row][columnContainingPhrase] ? sheet[row][columnContainingPhrase].split(',') : "";
            // Create a list of all status effect IDs this prefab will inflict when used.
            let effectsStrings = sheet[row][columnEffectsStrings] ? sheet[row][columnEffectsStrings].split(',') : [];
            effectsStrings.forEach((effectString, i) => {
                effectsStrings[i] = Status.generateValidId(effectString);
            });
            // Create a list of all status effect IDs this prefab will cure when used.
            let curesStrings = sheet[row][columnCuresStrings] ? sheet[row][columnCuresStrings].split(',') : [];
            curesStrings.forEach((cureString, i) => {
                curesStrings[i] = Status.generateValidId(cureString);
            });
            // Create a list of equipment slots this prefab can be equipped to.
            let equipmentSlots = sheet[row][columnEquipmentSlots] ? sheet[row][columnEquipmentSlots].split(',') : [];
            equipmentSlots.forEach((equipmentSlotId, i) => {
                equipmentSlots[i] = Game.generateValidEntityName(equipmentSlotId);
            });
            // Create a list of equipment slots this prefab covers when equipped.
            let coveredEquipmentSlots = sheet[row][columnCoveredEquipmentSlots] ? sheet[row][columnCoveredEquipmentSlots].split(',') : [];
            for (let j = 0; j < coveredEquipmentSlots.length; j++)
                coveredEquipmentSlots[j] = Game.generateValidEntityName(coveredEquipmentSlots[j]);
            // Create a list of commands to run when this prefab is equipped/unequipped. Temporarily replace forward slashes in URLs with back slashes.
            const commandString = sheet[row][columnCommandsString] ? sheet[row][columnCommandsString].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\') : "";
            const commands = commandString ? commandString.split('/') : ["", ""];
            let equippedCommands = commands[0] ? commands[0].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let i = 0; i < equippedCommands.length; i++)
                equippedCommands[i] = equippedCommands[i].trim();
            let unequippedCommands = commands[1] ? commands[1].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let i = 0; i < unequippedCommands.length; i++)
                unequippedCommands[i] = unequippedCommands[i].trim();
            // Create a list of inventory slots this prefab contains.
            let inventorySlotStrings = sheet[row][columnInventorySlotsStrings] ? sheet[row][columnInventorySlotsStrings].split(',') : [];
            /** @type {Collection<string, InventorySlot>} */
            let inventorySlots = new Collection();
            inventorySlotStrings.forEach(inventorySlotString => {
                let inventorySlotSplit = inventorySlotString.split(':');
                if (inventorySlotSplit.length === 1) inventorySlotSplit = [inventorySlotString, ""];
                const inventorySlot = new InventorySlot(
                    Game.generateValidEntityName(inventorySlotSplit[0]),
                    parseInt(inventorySlotSplit[1]),
                    0,
                    0,
                    []
                );
                if (inventorySlots.get(inventorySlot.id))
                    errors.push(new Error(`Couldn't load prefab on row ${row + 2}. The prefab already has an inventory slot with the ID "${inventorySlot.id}".`));
                else inventorySlots.set(inventorySlot.id, inventorySlot);
            });
            const prefab = new Prefab(
                sheet[row][columnId] ? Game.generateValidEntityName(sheet[row][columnId]) : "",
                name[0] ? Game.generateValidEntityName(name[0]) : "",
                name[1] ? Game.generateValidEntityName(name[1]) : "",
                containingPhrase[0] ? containingPhrase[0].trim() : "",
                containingPhrase[1] ? containingPhrase[1].trim() : "",
                sheet[row][columnDiscreet] ? sheet[row][columnDiscreet].trim() === "TRUE" : false,
                parseInt(sheet[row][columnSize]),
                parseInt(sheet[row][columnWeight]),
                sheet[row][columnUsable] ? sheet[row][columnUsable].trim() === "TRUE" : false,
                sheet[row][columnUseVerb] ? sheet[row][columnUseVerb].trim() : "",
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
                game
            );
            if (game.entityFinder.getPrefab(prefab.id)) {
                errors.push(new Error(`Couldn't load prefab on row ${prefab.row}. Another prefab with this ID already exists.`));
                continue;
            }
            prefab.effectsStrings.forEach((effectsString, i) => {
                const effect = game.entityFinder.getStatusEffect(effectsString);
                if (effect) prefab.effects[i] = effect;
            });
            prefab.curesStrings.forEach((curesString, i) => {
                const cure = game.entityFinder.getStatusEffect(curesString);
                if (cure) prefab.cures[i] = cure;
            });
            // If this prefab's ID is currently in the next stage assignments collection, we can finally set the next stage for the prefabs in its list.
            const nextStageAssignment = nextStageAssignments.get(prefab.id);
            if (nextStageAssignment) {
                nextStageAssignment.forEach(prevStage => game.entityFinder.getPrefab(prevStage).setNextStage(prefab));
                nextStageAssignments.delete(prefab.id);
            }
            if (prefab.nextStageId !== "") {
                let nextStage = game.entityFinder.getPrefab(prefab.nextStageId);
                if (nextStage) prefab.setNextStage(nextStage);
                else {
                    // If the next stage wasn't found, it might have just not been loaded yet. Save it for later.
                    let assignmentsList = nextStageAssignments.get(prefab.nextStageId);
                    if (!assignmentsList) assignmentsList = [];
                    assignmentsList.push(prefab.id);
                    nextStageAssignments.set(prefab.nextStageId, assignmentsList);
                }
            }
            game.prefabs.push(prefab);
            game.prefabsCollection.set(prefab.id, prefab);
            game.entityManager.updatePrefabReferences(prefab);
        }
        if (doErrorChecking) {
            game.prefabsCollection.forEach(prefab => {
                const error = checkPrefab(prefab);
                if (error instanceof Error) errors.push(error);
            });
        }
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("Prefabs");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("Prefabs");
        resolve(game);
    });
}

/**
 * Checks a Prefab for errors.
 * @param {Prefab} prefab - The prefab to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkPrefab(prefab) {
    if (prefab.id === "" || prefab.id === null || prefab.id === undefined)
        return new Error(`Couldn't load prefab on row ${prefab.row}. No prefab ID was given.`);
    if (prefab.name === "" || prefab.name === null || prefab.name === undefined)
        return new Error(`Couldn't load prefab on row ${prefab.row}. No prefab name was given.`);
    if (prefab.singleContainingPhrase === "")
        return new Error(`Couldn't load prefab on row ${prefab.row}. No single containing phrase was given.`);
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
    for (const [i, inventorySlot] of prefab.inventoryCollection.entries()) {
        if (inventorySlot.id === "" || inventorySlot.id === null || inventorySlot.id === undefined)
            return new Error(`Couldn't load prefab on row ${prefab.row}. No name was given for inventory slot ${i + 1}.`);
        if (isNaN(inventorySlot.capacity))
            return new Error(`Couldn't load prefab on row ${prefab.row}. The capacity given for inventory slot "${inventorySlot.id}" is not a number.`);
    }
    if (prefab.inventoryCollection.size !== 0 && prefab.preposition === "")
        return new Error(`Couldn't load prefab on row ${prefab.row}. ${prefab.id} has inventory slots, but no preposition was given.`);
}

/**
 * Loads data from the Recipes sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadRecipes(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.recipeSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnIngredients = 0;
        const columnUncraftable = 1;
        const columnFixtureTag = 2;
        const columnDuration = 3;
        const columnProducts = 4;
        const columnInitiatedDescription = 5;
        const columnCompletedDescription = 6;
        const columnUncraftedDescription = 7;

        game.entityManager.clearRecipes();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            // Separate the ingredients and sort them in alphabetical order.
            let ingredientsStrings = sheet[row][columnIngredients] ? sheet[row][columnIngredients].split(',') : [];
            ingredientsStrings.sort((a, b) => {
                const trimmedA = Game.generateValidEntityName(a);
                const trimmedB = Game.generateValidEntityName(b);
                if (trimmedA < trimmedB) return -1;
                if (trimmedA > trimmedB) return 1;
                return 0;
            });
            // For each ingredient, convert the string to a valid entity name.
            for (let j = 0; j < ingredientsStrings.length; j++)
                ingredientsStrings[j] = Game.generateValidEntityName(ingredientsStrings[j]);
            // Parse the duration.
            const durationString = sheet[row][columnDuration] ? String(sheet[row][columnDuration]) : "";
            const duration = parseDuration(durationString);
            // Separate the products.
            let productsStrings = sheet[row][columnProducts] ? sheet[row][columnProducts].split(',') : [];
            // For each product, convert the string to a valid entity name.
            for (let j = 0; j < productsStrings.length; j++)
                productsStrings[j] = Game.generateValidEntityName(productsStrings[j]);
            let recipe = new Recipe(
                ingredientsStrings,
                sheet[row][columnUncraftable] ? sheet[row][columnUncraftable].trim() === "TRUE" : false,
                sheet[row][columnFixtureTag] ? sheet[row][columnFixtureTag].trim() : "",
                duration,
                productsStrings,
                sheet[row][columnInitiatedDescription] ? sheet[row][columnInitiatedDescription].trim() : "",
                sheet[row][columnCompletedDescription] ? sheet[row][columnCompletedDescription].trim() : "",
                sheet[row][columnUncraftedDescription] ? sheet[row][columnUncraftedDescription].trim() : "",
                row + 2,
                game
            );
            recipe.ingredientsStrings.forEach((ingredientsString, i) => {
                const prefab = game.entityFinder.getPrefab(ingredientsString);
                if (prefab) recipe.ingredients[i] = prefab;
            });
            recipe.productsStrings.forEach((productsString, i) => {
                const prefab = game.entityFinder.getPrefab(productsString);
                if (prefab) recipe.products[i] = prefab;
            });
            if (doErrorChecking) {
                const error = checkRecipe(recipe);
                if (error instanceof Error) errors.push(error);
            }
            game.recipes.push(recipe);
        }
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("Recipes");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("Recipes");
        resolve(game);
    });
}

/**
 * Checks a Recipe for errors.
 * @param {Recipe} recipe - The recipe to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkRecipe(recipe) {
    if (recipe.ingredients.length === 0)
        return new Error(`Couldn't load recipe on row ${recipe.row}. No ingredients were given.`);
    for (let i = 0; i < recipe.ingredients.length; i++) {
        if (!(recipe.ingredients[i] instanceof Prefab))
            return new Error(`Couldn't load recipe on row ${recipe.row}. "${recipe.ingredientsStrings[i]}" in ingredients is not a prefab.`);
    }
    if (recipe.ingredients.length > 2 && recipe.fixtureTag === "")
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than 2 ingredients must require a fixture tag.`);
    if (recipe.products.length > 2 && recipe.fixtureTag === "")
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than 2 products must require a fixture tag.`);
    if (recipe.duration !== null && !dayjs.isDuration(recipe.duration))
        return new Error(`Couldn't load recipe on row ${recipe.row}. An invalid duration was given.`);
    if (recipe.fixtureTag === "" && recipe.duration !== null)
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes without a fixture tag cannot have a duration.`);
    for (let i = 0; i < recipe.products.length; i++) {
        if (!(recipe.products[i] instanceof Prefab))
            return new Error(`Couldn't load recipe on row ${recipe.row}. "${recipe.productsStrings[i]}" in products is not a prefab.`);
    }
    if (recipe.fixtureTag !== "" && recipe.uncraftable)
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with a fixture tag cannot be uncraftable.`)
    if (recipe.products.length > 1 && recipe.uncraftable)
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than one product cannot be uncraftable.`)
}

/**
 * Loads data from the Room Items sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadRoomItems(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.roomItemSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnPrefabId = 0;
        const columnIdentifier = 1;
        const columnLocationDisplayName = 2;
        const columnAccessible = 3;
        const columnContainerName = 4;
        const columnQuantity = 5;
        const columnUses = 6;
        const columnDescription = 7;

        game.entityManager.clearRoomItems();
        /** @type {Collection<string, RoomItem>} */
        let containerItems = new Collection();
        /** @type {Collection<string, RoomItem[]>} */
        let unloadedContainers = new Collection();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            let containerDisplay = sheet[row][columnContainerName] && sheet[row][columnContainerName].split(':').length > 1 ? sheet[row][columnContainerName].split(':') : ['', sheet[row][columnContainerName]];
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
                game
            );
            const prefab = game.entityFinder.getPrefab(roomItem.prefabId);
            if (prefab) {
                roomItem.setPrefab(prefab);
                roomItem.initializeInventory();
            }
            const location = game.entityFinder.getRoom(roomItem.locationDisplayName);
            if (location) roomItem.setLocation(location);
            if (roomItem.quantity !== 0 && roomItem.identifier !== "" && roomItem.inventoryCollection.size > 0) {
                if (containerItems.get(roomItem.identifier)) {
                    errors.push(new Error(`Couldn't load room item on row ${roomItem.row}. Another room item with this container identifier already exists.`));
                    continue;
                }
                containerItems.set(roomItem.identifier, roomItem);
                // If this item's identifier is already in the unloadedContainers collection, we can set it as the container for its child items.
                const unassignedChildItems = unloadedContainers.get(roomItem.identifier);
                if (unassignedChildItems) {
                    unassignedChildItems.forEach(childItem => {
                        childItem.setContainer(roomItem);
                        roomItem.insertItem(childItem, childItem.slot);
                    });
                    unloadedContainers.delete(roomItem.identifier);
                }
            }
            if (roomItem.containerType === "Fixture") {
                const container = game.entityFinder.getFixture(containerName, roomItem.locationDisplayName);
                if (container) roomItem.setContainer(container);
            }
            else if (roomItem.containerType === "Puzzle") {
                const container = game.entityFinder.getPuzzle(containerName, roomItem.locationDisplayName);
                if (container) roomItem.setContainer(container);
            }
            else if (roomItem.containerType === "RoomItem") {
                const containerNameSplit = roomItem.containerName.split('/').length > 1 ? roomItem.containerName.split('/') : [roomItem.containerName, ''];
                const identifier = Game.generateValidEntityName(containerNameSplit[0]);
                const slotId = Game.generateValidEntityName(containerNameSplit[1]);
                if (slotId) roomItem.slot = slotId;
                const container = containerItems.get(identifier);
                if (container) {
                    roomItem.setContainer(container);
                    container.insertItem(roomItem, slotId);
                }
                else {
                    // If the container item wasn't found, it might have just not been loaded yet. Save it for later.
                    let unassignedChildItems = unloadedContainers.get(identifier);
                    if (!unassignedChildItems) unassignedChildItems = [];
                    unassignedChildItems.push(roomItem);
                    unloadedContainers.set(identifier, unassignedChildItems);
                }
            }
            game.roomItems.push(roomItem);
        }
        if (doErrorChecking) {
            game.roomItems.forEach(roomItem => {
                const error = checkRoomItem(roomItem);
                if (error instanceof Error) errors.push(error);
            });
        }
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("RoomItems");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("RoomItems");
        resolve(game);
    });
}

/**
 * Checks a RoomItem for errors.
 * @param {RoomItem} item - The room item to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkRoomItem(item) {
    if (!(item.prefab instanceof Prefab))
        return new Error(`Couldn't load room item on row ${item.row}. "${item.prefabId}" is not a prefab.`);
    if (item.inventoryCollection.size > 0 && item.identifier === "")
        return new Error(`Couldn't load room item on row ${item.row}. This item is capable of containing items, but no container identifier was given.`);
    if (item.inventoryCollection.size > 0 && (item.quantity > 1 || isNaN(item.quantity)))
        return new Error(`Couldn't load room item on row ${item.row}. Items capable of containing items must have a quantity of 1.`);
    if (item.identifier !== "" && item.quantity !== 0 &&
        item.game.roomItems.filter(roomItem => roomItem.identifier === item.identifier && roomItem.quantity !== 0).length
        + item.game.inventoryItems.filter(inventoryItem => inventoryItem.identifier === item.identifier && inventoryItem.quantity !== 0).length > 1)
        return new Error(`Couldn't load room item on row ${item.row}. Another item or inventory item with this container identifier already exists.`);
    if (item.prefab.pluralContainingPhrase === "" && (item.quantity > 1 || isNaN(item.quantity)))
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
    if (item.containerType === "RoomItem" && !(item.container instanceof RoomItem))
        return new Error(`Couldn't load room item on row ${item.row}. The container given is not a room item.`);
    if (item.containerType === "Puzzle" && !(item.container instanceof Puzzle))
        return new Error(`Couldn't load room item on row ${item.row}. The container given is not a puzzle.`);
    if (item.container instanceof RoomItem && item.container.inventoryCollection.size === 0)
        return new Error(`Couldn't load room item on row ${item.row}. The item's container is a room item, but the item container's prefab on row ${item.container.prefab.row} has no inventory slots.`);
    if (item.container instanceof RoomItem) {
        if (item.slot === "") return new Error(`Couldn't load room item on row ${item.row}. The item's container is a room item, but a prefab inventory slot ID was not given.`);
        const inventorySlot = item.container.inventoryCollection.get(item.slot);
        if (!inventorySlot)
            return new Error(`Couldn't load room item on row ${item.row}. The item's container prefab on row ${item.container.prefab.row} has no inventory slot "${item.slot}".`);
        if (inventorySlot.takenSpace > inventorySlot.capacity)
            return new Error(`Couldn't load room item on row ${item.row}. The item's container is over capacity.`);
    }
}

/**
 * Loads data from the Puzzles sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadPuzzles(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.puzzleSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
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
        const columnIncorrectDescription = 14;
        const columnNoMoreAttemptsDescription = 15;
        const columnRequirementsNotMetDescription = 16;

        game.entityManager.clearPuzzles();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            let requirements = sheet[row][columnRequiresStrings] ? sheet[row][columnRequiresStrings].split(',') : [];
            /** @type {PuzzleRequirement[]} */
            let requirementsStrings = [];
            requirements.forEach(requirement => {
                let requirementDisplay = requirement.split(':').length > 1 ? requirement.split(':') : ['', requirement];
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
            /** @type {PuzzleCommandSet[]} */
            let commandSets = [];
            /**
             * @param {string} commandString
             * @returns {PuzzleCommandSet}
             */
            let getCommands = function (commandString) {
                const commands = commandString.split('/');
                let solvedCommands = commands[0] ? commands[0].split(/(?<!`.*?[^`])\s*?,/) : [];
                for (let i = 0; i < solvedCommands.length; i++)
                    solvedCommands[i] = solvedCommands[i].trim();
                let unsolvedCommands = commands[1] ? commands[1].split(/(?<!`.*?[^`])\s*?,/) : [];
                for (let i = 0; i < unsolvedCommands.length; i++)
                    unsolvedCommands[i] = unsolvedCommands[i].trim();
                return { solvedCommands: solvedCommands, unsolvedCommands: unsolvedCommands };
            };
            const regex = new RegExp(/(\[((.*?)(?<!(?:(?:Room|Inventory)?Item)|Prefab): (.*?))\],?)/g);
            if (!!commandString.match(regex)) {
                let match;
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
            let solutions = sheet[row][columnSolution] ? sheet[row][columnSolution].toString().split(',') : [];
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
                sheet[row][columnIncorrectDescription] ? sheet[row][columnIncorrectDescription].trim() : "",
                sheet[row][columnNoMoreAttemptsDescription] ? sheet[row][columnNoMoreAttemptsDescription].trim() : "",
                sheet[row][columnRequirementsNotMetDescription] ? sheet[row][columnRequirementsNotMetDescription].trim() : "",
                row + 2,
                game
            );
            const location = game.entityFinder.getRoom(puzzle.locationDisplayName);
            if (location) puzzle.setLocation(location);
            const parentFixture = game.entityFinder.getFixture(puzzle.parentFixtureName, puzzle.locationDisplayName);
            if (parentFixture) puzzle.setParentFixture(parentFixture);
            game.puzzles.push(puzzle);
            game.entityManager.updatePuzzleReferences(puzzle);
        }
        game.puzzles.forEach(puzzle => {
            puzzle.requirementsStrings.forEach((requirementString, i) => {
                /** @type {Prefab|Event|Flag|Puzzle} */
                let requirement = null;
                if (requirementString.type === "Prefab")
                    requirement = game.entityFinder.getPrefab(requirementString.entityId);
                else if (requirementString.type === "Event")
                    requirement = game.entityFinder.getEvent(requirementString.entityId);
                else if (requirementString.type === "Flag")
                    requirement = game.entityFinder.getFlag(requirementString.entityId);
                else
                    requirement = game.entityFinder.getPuzzle(requirementString.entityId);
                puzzle.requirements[i] = requirement;
            });
            if (doErrorChecking) {
                const error = checkPuzzle(puzzle);
                if (error instanceof Error) errors.push(error);
            }
        });
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("Puzzles");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("Puzzles");
        resolve(game);
    });
}

/**
 * Checks a Puzzle for errors.
 * @param {Puzzle} puzzle - The puzzle to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkPuzzle(puzzle) {
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
        puzzle.type !== "voice" &&
        puzzle.type !== "switch" &&
        puzzle.type !== "option" &&
        puzzle.type !== "media" &&
        puzzle.type !== "player" &&
        puzzle.type !== "room player" &&
        puzzle.type !== "restricted exit" &&
        puzzle.type !== "matrix")
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.type}" is not a valid puzzle type.`);
    if ((puzzle.type === "probability" || puzzle.type.endsWith(" probability")) && puzzle.solutions.length < 1)
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a probability-type puzzle, but no solutions were given.`);
    if (puzzle.type.endsWith(" probability")) {
        if (puzzle.type !== "str probability" && puzzle.type !== "strength probability" &&
            puzzle.type !== "int probability" && puzzle.type !== "intelligence probability" &&
            puzzle.type !== "dex probability" && puzzle.type !== "dexterity probability" &&
            puzzle.type !== "spd probability" && puzzle.type !== "speed probability" &&
            puzzle.type !== "sta probability" && puzzle.type !== "stamina probability")
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.type}" is not a valid stat probability puzzle type.`);
    }
    for (let solution of puzzle.solutions) {
        if (puzzle.type === "weight" && isNaN(parseInt(solution)))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a weight-type puzzle, but the solution "${solution}" is not an integer.`);
        if (puzzle.type === "media" && !solution.startsWith("Item: ") && !solution.startsWith("Prefab: "))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a media-type puzzle, but the solution "${solution}" does not have the "Item: " or "Prefab: " prefix.`);
        if (puzzle.type === "container") {
            const requiredItems = solution.split('+');
            for (let requiredItem of requiredItems) {
                if (!requiredItem.trim().startsWith("Item: ") && !requiredItem.trim().startsWith("Prefab: "))
                    return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a container-type puzzle, but the solution "${requiredItem}" does not have the "Item: " or "Prefab: " prefix.`);
            }
        }
    }
    if (puzzle.type === "switch" && puzzle.solved === false)
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a switch-type puzzle, but it not solved.`);
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
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadEvents(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.eventSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
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

        game.entityManager.clearEvents();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            const durationString = sheet[row][columnDurationString] ? String(sheet[row][columnDurationString]) : "";
            const duration = parseDuration(durationString);
            const timeRemaining = sheet[row][columnRemainingString] ? dayjs.duration(convertTimeStringToDurationUnits(sheet[row][columnRemainingString])) : null;
            let triggerTimesStrings = sheet[row][columnTriggerTimesStrings] ? sheet[row][columnTriggerTimesStrings].split(',') : [];
            for (let i = 0; i < triggerTimesStrings.length; i++)
                triggerTimesStrings[i] = triggerTimesStrings[i].trim();
            const commandString = sheet[row][columnCommandsString] ? sheet[row][columnCommandsString].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\') : "";
            const commands = commandString ? commandString.split('/') : ["", ""];
            let triggeredCommands = commands[0] ? commands[0].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let i = 0; i < triggeredCommands.length; i++)
                triggeredCommands[i] = triggeredCommands[i].trim();
            let endedCommands = commands[1] ? commands[1].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let i = 0; i < endedCommands.length; i++)
                endedCommands[i] = endedCommands[i].trim();
            let effectsStrings = sheet[row][columnEffectsStrings] ? sheet[row][columnEffectsStrings].split(',') : [];
            for (let i = 0; i < effectsStrings.length; i++)
                effectsStrings[i] = Status.generateValidId(effectsStrings[i]);
            let refreshesStrings = sheet[row][columnRefreshedStrings] ? sheet[row][columnRefreshedStrings].split(',') : [];
            for (let i = 0; i < refreshesStrings.length; i++)
                refreshesStrings[i] = Status.generateValidId(refreshesStrings[i]);
            const event = new Event(
                sheet[row][columnId] ? Game.generateValidEntityName(sheet[row][columnId]) : "",
                sheet[row][columnOngoing] ? sheet[row][columnOngoing].trim() === "TRUE" : false,
                durationString,
                duration,
                sheet[row][columnRemainingString] ? sheet[row][columnRemainingString] : "",
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
                game
            );
            if (game.entityFinder.getEvent(event.id)) {
                errors.push(new Error(`Couldn't load event on row ${event.row}. Another event with this ID already exists.`));
                continue;
            }
            event.effectsStrings.forEach((effectsString, i) => {
                const effect = game.entityFinder.getStatusEffect(effectsString);
                if (effect) event.effects[i] = effect;
            });
            event.refreshesStrings.forEach((refreshesString, i) => {
                const refreshes = game.entityFinder.getStatusEffect(refreshesString);
                if (refreshes) event.refreshes[i] = refreshes;
            });
            if (doErrorChecking) {
                const error = checkEvent(event);
                if (error instanceof Error) errors.push(error);
            }
            game.events.push(event);
            game.eventsCollection.set(event.id, event);
            game.entityManager.updateEventReferences(event);
        }
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("Events");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("Events");
        resolve(game);
    });
}

/**
 * Checks an Event for errors.
 * @param {Event} event - The event to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkEvent(event) {
    if (event.id === "" || event.id === null || event.id === undefined)
        return new Error(`Couldn't load event on row ${event.row}. No event ID was given.`);
    if (event.duration !== null && !dayjs.isDuration(event.duration))
        return new Error(`Couldn't load event on row ${event.row}. "${event.durationString}" is not a valid duration.`);
    if (event.remaining !== null && !dayjs.isDuration(event.remaining))
        return new Error(`Couldn't load event on row ${event.row}. "${event.remainingString}" is not a valid representation of the time remaining.`);
    if (!event.ongoing && event.remaining !== null)
        return new Error(`Couldn't load event on row ${event.row}. The event is not ongoing, but an amount of time remaining was given.`);
    if (event.ongoing && event.duration !== null && event.remaining === null)
        return new Error(`Couldn't load event on row ${event.row}. The event is ongoing and has a duration, but no amount of time remaining was given.`);
    for (let triggerTimeString of event.triggerTimesStrings) {
        let triggerTime = dayjs(triggerTimeString, Event.formats);
        if (!triggerTime.isValid())
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
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadStatusEffects(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.statusSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
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

        game.entityManager.clearStatusEffects();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            const durationString = sheet[row][columnDuration] ? String(sheet[row][columnDuration]) : "";
            const duration = parseDuration(durationString);
            let overriders = sheet[row][columnOverridersStrings] ? sheet[row][columnOverridersStrings].split(',') : [];
            for (let i = 0; i < overriders.length; i++)
                overriders[i] = Status.generateValidId(overriders[i]);
            let cures = sheet[row][columnCuresStrings] ? sheet[row][columnCuresStrings].split(',') : [];
            for (let i = 0; i < cures.length; i++)
                cures[i] = Status.generateValidId(cures[i]);
            const modifierStrings = sheet[row][columnStatModifiersString] ? sheet[row][columnStatModifiersString].split(',') : [];
            const regex = /(@)?(.*)(\+|-|=)(.*)/gi;
            /** @type {StatModifier[]} */
            let modifiers = [];
            for (const modifierString of modifierStrings) {
                const matches = modifierString.trim().matchAll(regex);
                for (const match of matches) {
                    // Determine if the modifier modifies the player it's applied to or not.
                    let modifiesSelf = true;
                    if (match[1] && match[1] === '@')
                        modifiesSelf = false;
                    // Parse the stat.
                    let stat = null;
                    if (match[2])
                        stat = Player.abbreviateStatName(match[2]);
                    // Determine if the modifier assigns the value to the player's stat, or just modifies it.
                    let assignValue = false;
                    if (match[3] && match[3] === '=')
                        assignValue = true;
                    // Parse the value.
                    let value = null;
                    if (match[4]) {
                        value = parseInt(match[4]);
                        if (match[3] && match[3] === '-')
                            value *= -1;
                    }
                    modifiers.push({ modifiesSelf: modifiesSelf, stat: stat, assignValue: assignValue, value: value });
                }
            }
            let behaviorAttributes = sheet[row][columnBehaviorAttributes] ? sheet[row][columnBehaviorAttributes].split(',') : [];
            for (let i = 0; i < behaviorAttributes.length; i++)
                behaviorAttributes[i] = behaviorAttributes[i].trim();
            const status = new Status(
                sheet[row][columnId] ? sheet[row][columnId].trim() : "",
                duration,
                sheet[row][columnFatal] ? sheet[row][columnFatal].trim() === "TRUE" : false,
                sheet[row][columnVisible] ? sheet[row][columnVisible].trim() === "TRUE" : false,
                overriders,
                cures,
                sheet[row][columnNextStageId] ? sheet[row][columnNextStageId].trim() : "",
                sheet[row][columnDuplicatedStatusId] ? sheet[row][columnDuplicatedStatusId].trim() : "",
                sheet[row][columnCuredConditionId] ? sheet[row][columnCuredConditionId].trim() : "",
                modifiers,
                behaviorAttributes,
                sheet[row][columnInflictedDescription] ? sheet[row][columnInflictedDescription].trim() : "",
                sheet[row][columnCuredDescription] ? sheet[row][columnCuredDescription].trim() : "",
                row + 2,
                game
            );
            if (game.entityFinder.getStatusEffect(status.id)) {
                errors.push(new Error(`Couldn't load status effect on row ${status.row}. Another status effect with this ID already exists.`));
                continue;
            }
            game.statusEffects.push(status);
            game.statusEffectsCollection.set(status.id, status);
            game.entityManager.updateStatusEffectReferences(status);
        }
        game.statusEffectsCollection.forEach(status => {
            status.overridersStrings.forEach((overriderString, i) => {
                const overrider = game.entityFinder.getStatusEffect(overriderString);
                if (overrider) status.overriders[i] = overrider;
            });
            status.curesStrings.forEach((curesString, i) => {
                const cure = game.entityFinder.getStatusEffect(curesString);
                if (cure) status.cures[i] = cure;
            });
            const nextStage = game.entityFinder.getStatusEffect(status.nextStageId);
            if (nextStage) status.setNextStage(nextStage);
            const duplicatedStatus = game.entityFinder.getStatusEffect(status.duplicatedStatusId);
            if (duplicatedStatus) status.setDuplicatedStatus(duplicatedStatus);
            const curedCondition = game.entityFinder.getStatusEffect(status.curedConditionId);
            if (curedCondition) status.setCuredCondition(curedCondition);
            if (doErrorChecking) {
                const error = checkStatusEffect(status);
                if (error instanceof Error) errors.push(error);
            }
        });
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("StatusEffects");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("StatusEffects");
        resolve(game);
    });
}

/**
 * Checks a Status Effect for errors.
 * @param {Status} status - The status effect to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkStatusEffect(status) {
    if (status.id === "" || status.id === null || status.id === undefined)
        return new Error(`Couldn't load status effect on row ${status.row}. No status effect ID was given.`);
    if (status.duration !== null && !dayjs.isDuration(status.duration))
        return new Error(`Couldn't load status effect on row ${status.row}. An invalid duration was given.`);
    for (let i = 0; i < status.statModifiers.length; i++) {
        const statModifier = status.statModifiers[i];
        if (statModifier.stat === null)
            return new Error(`Couldn't load status effect on row ${status.row}. No stat in stat modifier ${i + 1} was given.`);
        if (statModifier.stat !== "str" && statModifier.stat !== "int" && statModifier.stat !== "dex" && statModifier.stat !== "spd" && statModifier.stat !== "sta")
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
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadPlayers(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.playerSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnId = 0;
        const columnName = 1;
        const columnTitle = 2;
        const columnPronouns = 3;
        const columnVoice = 4;
        const columnStrength = 5;
        const columnIntelligence = 6;
        const columnDexterity = 7;
        const columnSpeed = 8;
        const columnStamina = 9;
        const columnAlive = 10;
        const columnLocationDisplayName = 11;
        const columnHidingSpot = 12;
        const columnStatusStrings = 13;
        const columnDescription = 14;

        game.entityManager.clearPlayers();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            const stats = {
                strength: parseInt(sheet[row][columnStrength]),
                intelligence: parseInt(sheet[row][columnIntelligence]),
                dexterity: parseInt(sheet[row][columnDexterity]),
                speed: parseInt(sheet[row][columnSpeed]),
                stamina: parseInt(sheet[row][columnStamina])
            };
            const statusStrings = sheet[row][columnStatusStrings] ? sheet[row][columnStatusStrings].split(',') : [];
            /** @type {StatusDisplay[]} */
            let statusDisplays = new Array(statusStrings.length);
            statusStrings.forEach((statusString, i) => {
                let statusId = "";
                let timeRemaining = null;
                if (statusString.includes('(')) {
                    statusId = Status.generateValidId(statusString.substring(0, statusString.lastIndexOf('(')));
                    timeRemaining = statusString.substring(statusString.lastIndexOf('(') + 1, statusString.lastIndexOf(')'));
                }
                else statusId = Status.generateValidId(statusString);
                statusDisplays[i] = { id: statusId, timeRemaining: timeRemaining };
            });
            let member = null;
            let spectateChannel = null;
            if (sheet[row][columnName] && sheet[row][columnTitle] !== "NPC") {
                try {
                    member = sheet[row][columnId] ? game.guildContext.guild.members.resolve(sheet[row][columnId].trim()) : null;
                } catch (error) { }
                const spectateChannelName = Room.generateValidId(sheet[row][columnName]);
                spectateChannel = game.guildContext.guild.channels.cache.find(channel =>
                    channel.parent
                    && channel.parentId === game.guildContext.spectateCategoryId
                    && channel.name === spectateChannelName
                );
                const spectateChannelCount = game.guildContext.guild.channels.cache.filter(channel => channel.parent && channel.parentId === game.guildContext.spectateCategoryId).size;
                if (!spectateChannel && spectateChannelCount < 50) {
                    spectateChannel = await game.guildContext.guild.channels.create({
                        name: spectateChannelName,
                        type: ChannelType.GuildText,
                        parent: game.guildContext.spectateCategoryId
                    });
                }
            }
            const player = new Player(
                sheet[row][columnId] ? sheet[row][columnId].trim() : "",
                member,
                sheet[row][columnName] ? sheet[row][columnName].trim() : "",
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
                spectateChannel && spectateChannel.type === ChannelType.GuildText ? spectateChannel : null,
                row + 3,
                game
            );
            if (game.entityFinder.getPlayer(player.name)) {
                errors.push(new Error(`Couldn't load player on row ${player.row}. Another player with this name already exists.`));
                continue;
            }
            const location = game.entityFinder.getRoom(player.locationDisplayName);
            if (location) player.setLocation(location);
            if (player.isNPC) player.displayIcon = player.id;
            player.setPronouns(player.originalPronouns, player.pronounString);
            player.setPronouns(player.pronouns, player.pronounString);
            game.players.push(player);
            game.playersCollection.set(Game.generateValidEntityName(player.name), player);

            if (player.alive) {
                if (player.member !== null || player.isNPC) {
                    if (player.location instanceof Room)
                        player.location.addPlayer(player, null, null, false);
                    // Parse statuses and inflict the player with them.
                    player.statusDisplays.forEach(statusDisplay => {
                        const status = game.entityFinder.getStatusEffect(statusDisplay.id);
                        if (status) {
                            const timeRemaining = statusDisplay.timeRemaining ? dayjs.duration(convertTimeStringToDurationUnits(statusDisplay.timeRemaining)) : null;
                            player.inflict(status, false, false, false, null, timeRemaining);
                        }
                    });
                }
                game.players_alive.push(player);
                game.livingPlayersCollection.set(Game.generateValidEntityName(player.name), player);
            }
            else {
                game.players_dead.push(player);
                game.deadPlayersCollection.set(Game.generateValidEntityName(player.name), player);
            }
        }

        // Now load player inventories.
        await loadInventoryItems(game, false);
        if (doErrorChecking) {
            game.playersCollection.forEach(player => {
                let error = checkPlayer(player);
                if (error instanceof Error) errors.push(error);
                // Get all inventory items that are assigned to this player and check for errors on them.
                const playerInventoryItems = game.inventoryItems.filter(item => item.player instanceof Player && item.player.name === player.name);
                playerInventoryItems.forEach(inventoryItem => {
                    error = checkInventoryItem(inventoryItem);
                    if (error instanceof Error) errors.push(error);
                });
            });
        }
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("Players");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("Players");
        resolve(game);
    });
}

/**
 * Checks a Player for errors.
 * @param {Player} player - The player to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkPlayer(player) {
    if (!player.isNPC && (player.id === "" || player.id === null || player.id === undefined))
        return new Error(`Couldn't load player on row ${player.row}. No Discord ID was given.`);
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|webp|avif))$');
    if (player.isNPC && (player.id === "" || player.id === null || player.id === undefined || !iconURLSyntax.test(player.id)))
        return new Error(`Couldn't load player on row ${player.row}. The Discord ID for an NPC must be a URL with a .jpg, .jpeg, .png, .webp, or .avif extension.`);
    if (!player.isNPC && (player.member === null || player.member === undefined))
        return new Error(`Couldn't load player on row ${player.row}. There is no member on the server with the ID ${player.id}.`);
    if (player.name === "" || player.name === null || player.name === undefined)
        return new Error(`Couldn't load player on row ${player.row}. No player name was given.`);
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
    if (isNaN(player.intelligence))
        return new Error(`Couldn't load player on row ${player.row}. The intelligence stat given is not an integer.`);
    if (isNaN(player.dexterity))
        return new Error(`Couldn't load player on row ${player.row}. The dexterity stat given is not an integer.`);
    if (isNaN(player.speed))
        return new Error(`Couldn't load player on row ${player.row}. The speed stat given is not an integer.`);
    if (isNaN(player.stamina))
        return new Error(`Couldn't load player on row ${player.row}. The stamina stat given is not an integer.`);
    if (player.alive && !(player.location instanceof Room))
        return new Error(`Couldn't load player on row ${player.row}. "${player.locationDisplayName}" is not a room.`);
    for (let statusDisplay of player.statusDisplays) {
        if (!player.hasStatus(statusDisplay.id))
            return new Error(`Couldn't load player on row ${player.row}. "${statusDisplay.id}" is not a status effect.`);
        if (statusDisplay.timeRemaining) {
            const timeRemaining = dayjs.duration(convertTimeStringToDurationUnits(statusDisplay.timeRemaining));
            if (!dayjs.isDuration(timeRemaining))
                return new Error(`Couldn't load player on row ${player.row}. "${statusDisplay.timeRemaining}" is not a valid representation of the time remaining for the status "${statusDisplay.id}".`);
        }
    }
}

/**
 * Loads data from the Inventory Items sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadInventoryItems(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.inventorySheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnPlayerName = 0;
        const columnPrefabId = 1;
        const columnIdentifier = 2;
        const columnEquipmentSlotId = 3;
        const columnContainerName = 4;
        const columnQuantity = 5;
        const columnUses = 6;
        const columnDescription = 7;

        game.entityManager.clearInventoryItems();
        /** @type {Collection<string, InventoryItem>} */
        let containerItems = new Collection();
        /** @type {Collection<string, InventoryItem[]>} */
        let unloadedContainers = new Collection();
        /** @type {Collection<string, Collection<string, EquipmentSlot>>} */
        let equipmentSlots = new Collection();
        /** @type {Collection<string, Collection<string, InventoryItem[]>>} */
        let unloadedEquipmentSlots = new Collection();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            const containerName = sheet[row][columnContainerName] ? Game.generateValidEntityName(sheet[row][columnContainerName]) : "";
            let containerType = "";
            if (containerName) containerType = "InventoryItem";
            /** @type {InventoryItem} */
            let inventoryItem;
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
                    game
                );
                const prefab = game.entityFinder.getPrefab(inventoryItem.prefabId);
                if (prefab) {
                    inventoryItem.setPrefab(prefab);
                    inventoryItem.initializeInventory();
                }
                if (inventoryItem.quantity !== 0 && inventoryItem.identifier !== "" && inventoryItem.inventoryCollection.size > 0) {
                    if (containerItems.get(inventoryItem.identifier)) {
                        errors.push(new Error(`Couldn't load inventory item on row ${inventoryItem.row}. Another inventory item with this container identifier already exists.`));
                        continue;
                    }
                    containerItems.set(inventoryItem.identifier, inventoryItem);
                    // If this item's identifier is already in the unloadedContainers collection, we can set it as the container for its child items.
                    const unassignedChildItems = unloadedContainers.get(inventoryItem.identifier);
                    if (unassignedChildItems) {
                        unassignedChildItems.forEach(childItem => {
                            childItem.setContainer(inventoryItem);
                            inventoryItem.insertItem(childItem, childItem.slot);
                        });
                        unloadedContainers.delete(inventoryItem.identifier);
                    }
                }
                const containerNameSplit = inventoryItem.containerName.split('/').length > 1 ? inventoryItem.containerName.split('/') : [inventoryItem.containerName, ''];
                const identifier = Game.generateValidEntityName(containerNameSplit[0]);
                const slotId = Game.generateValidEntityName(containerNameSplit[1]);
                if (slotId) inventoryItem.slot = slotId;
                const container = containerItems.get(identifier);
                if (container) {
                    inventoryItem.setContainer(container);
                    container.insertItem(inventoryItem, slotId);
                }
                else {
                    // If the container item wasn't found, it might have just not been loaded yet. Save it for later.
                    let unassignedChildItems = unloadedContainers.get(identifier);
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
                    game
                );
                inventoryItem.prefab = null;
            }
            const player = sheet[row][columnPlayerName] ? game.entityFinder.getPlayer(sheet[row][columnPlayerName]) : null;
            if (player) {
                inventoryItem.setPlayer(player);
                let foundEquipmentSlot = false;
                const playerEquipmentSlots = equipmentSlots.get(player.name);
                if (playerEquipmentSlots) {
                    const equipmentSlot = playerEquipmentSlots.get(inventoryItem.equipmentSlot);
                    if (equipmentSlot) {
                        foundEquipmentSlot = true;
                        equipmentSlot.insertItem(inventoryItem);
                    }
                }
                if (!foundEquipmentSlot) {
                    // If the equipment slot wasn't found, it might have just not been loaded yet. Save it for later.
                    let unloadedPlayerEquipmentSlots = unloadedEquipmentSlots.get(player.name);
                    if (!unloadedPlayerEquipmentSlots) unloadedPlayerEquipmentSlots = new Collection();
                    let unassignedEquipmentSlotItems = unloadedPlayerEquipmentSlots.get(inventoryItem.equipmentSlot);
                    if (!unassignedEquipmentSlotItems) unassignedEquipmentSlotItems = [];
                    unassignedEquipmentSlotItems.push(inventoryItem);
                    unloadedPlayerEquipmentSlots.set(inventoryItem.equipmentSlot, unassignedEquipmentSlotItems);
                    unloadedEquipmentSlots.set(player.name, unloadedPlayerEquipmentSlots);
                }
            }
            if (player && inventoryItem.equipmentSlot !== "" && inventoryItem.containerName === "") {
                // Create the corresponding equipment slot for the player, if it doesn't already exist.
                let playerEquipmentSlots = equipmentSlots.get(player.name);
                if (!playerEquipmentSlots) playerEquipmentSlots = new Collection();
                if (playerEquipmentSlots.get(inventoryItem.equipmentSlot)) {
                    errors.push(new Error(`Couldn't load inventory item on row ${inventoryItem.row}. ${player.name} already has an equipment slot with this ID.`));
                    continue;
                }
                const equipmentSlot = new EquipmentSlot(inventoryItem.equipmentSlot, inventoryItem.row, game);
                equipmentSlot.equipItem(inventoryItem);
                playerEquipmentSlots.set(equipmentSlot.id, equipmentSlot);
                equipmentSlots.set(player.name, playerEquipmentSlots);
                // If this equipment slot's ID is in the unloadedEquipmentSlots collection, we can insert any previously unassigned items into it.
                const unloadedPlayerEquipmentSlots = unloadedEquipmentSlots.get(player.name);
                if (unloadedPlayerEquipmentSlots) {
                    const unassignedEquipmentSlotItems = unloadedPlayerEquipmentSlots.get(inventoryItem.equipmentSlot);
                    if (unassignedEquipmentSlotItems) {
                        unassignedEquipmentSlotItems.forEach(unassignedItem => {
                            equipmentSlot.insertItem(unassignedItem);
                        });
                        unloadedEquipmentSlots.get(player.name).delete(inventoryItem.equipmentSlot);
                    }
                }
            }
            game.inventoryItems.push(inventoryItem);
        }
        game.playersCollection.forEach(player => {
            const playerEquipmentSlots = equipmentSlots.get(player.name);
            if (playerEquipmentSlots) {
                player.setInventory(playerEquipmentSlots);
                // Calculate the player's carry weight.
                player.carryWeight = player.inventoryCollection.reduce((weight, equipmentSlot) => {
                    let itemWeight = equipmentSlot.items.reduce((inventoryItemWeight, inventoryItem) => {
                        return inventoryItem.prefab !== null ? inventoryItemWeight + inventoryItem.weight * inventoryItem.quantity : inventoryItemWeight;
                    }, 0);
                    return weight + itemWeight;
                }, 0);
            }
        });
        if (doErrorChecking) {
            game.inventoryItems.forEach(inventoryItem => {
                const error = checkInventoryItem(inventoryItem);
                if (error instanceof Error) errors.push(error);
            });
        }
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("InventoryItems");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("InventoryItems");
        resolve(game);
    });
}

/**
 * Checks an InventoryItem for errors.
 * @param {InventoryItem} item - The inventory item to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkInventoryItem(item) {
    if (item.playerName === "")
        return new Error(`Couldn't load inventory item on row ${item.row}. No player name was given.`);
    if (!(item.player instanceof Player))
        return new Error(`Couldn't load inventory item on row ${item.row}. "${item.playerName}" is not a player.`);
    if (isNaN(item.quantity))
        return new Error(`Couldn't load inventory item on row ${item.row}. No quantity was given.`);
    if (item.prefab !== null) {
        if (!(item.prefab instanceof Prefab))
            return new Error(`Couldn't load inventory item on row ${item.row}. "${item.prefabId}" is not a prefab.`);
        if (item.inventoryCollection.size > 0 && item.identifier === "")
            return new Error(`Couldn't load inventory item on row ${item.row}. This item is capable of containing items, but no container identifier was given.`);
        if (item.inventoryCollection.size > 0 && (item.quantity > 1))
            return new Error(`Couldn't load inventory item on row ${item.row}. Items capable of containing items must have a quantity of 1.`);
        if (item.identifier !== "" && item.quantity !== 0 && item.game.roomItems.filter(roomItem => roomItem.identifier === item.identifier && roomItem.quantity !== 0).length
            + item.game.inventoryItems.filter(inventoryItem => inventoryItem.identifier === item.identifier && inventoryItem.quantity !== 0).length > 1)
            return new Error(`Couldn't load inventory item on row ${item.row}. Another item or inventory item with this container identifier already exists.`);
        if (item.prefab.pluralContainingPhrase === "" && (item.quantity > 1))
            return new Error(`Couldn't load inventory item on row ${item.row}. Quantity is higher than 1, but its prefab on row ${item.prefab.row} has no plural containing phrase.`);
        if (!item.player.inventoryCollection.get(item.equipmentSlot))
            return new Error(`Couldn't load inventory item on row ${item.row}. Couldn't find equipment slot "${item.equipmentSlot}".`);
        if (item.equipmentSlot !== "RIGHT HAND" && item.equipmentSlot !== "LEFT HAND" && item.containerName !== "" && (item.container === null || item.container === undefined))
            return new Error(`Couldn't load inventory item on row ${item.row}. Couldn't find container "${item.containerName}".`);
        if (item.container instanceof InventoryItem && item.container.inventoryCollection.size === 0)
            return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is an inventory item, but the item container's prefab on row ${item.container.prefab.row} has no inventory slots.`);
        if (item.container instanceof InventoryItem) {
            if (item.slot === "") return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is an inventory item, but a prefab inventory slot name was not given.`);
            const inventorySlot = item.container.inventoryCollection.get(item.slot);
            if (!inventorySlot)
                return new Error(`Couldn't load inventory item on row ${item.row}. The item's container prefab on row ${item.container.prefab.row} has no inventory slot "${item.slot}".`);
            if (inventorySlot.takenSpace > inventorySlot.capacity)
                return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is over capacity.`);
        }
    }
}

/**
 * Loads data from the Gestures sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadGestures(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.gestureSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnId = 0;
        const columnRequires = 1;
        const columnDisabledStatusesStrings = 2;
        const columnDescription = 3;
        const columnNarration = 4;

        game.entityManager.clearGestures();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            let requiresStrings = sheet[row][columnRequires] ? sheet[row][columnRequires].split(',') : [];
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
            let disabledStatusesStrings = sheet[row][columnDisabledStatusesStrings] ? sheet[row][columnDisabledStatusesStrings].split(',') : [];
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
                game
            );
            if (game.entityFinder.getGesture(gesture.id)) {
                errors.push(new Error(`Couldn't load gesture on row ${gesture.row}. No gesture ID was given.`));
                continue;
            }
            gesture.disabledStatusesStrings.forEach((disabledStatusString, i) => {
                const disabledStatus = game.entityFinder.getStatusEffect(disabledStatusString);
                if (disabledStatus) gesture.disabledStatuses[i] = disabledStatus;
            });
            if (doErrorChecking) {
                let error = checkGesture(gesture);
                if (error instanceof Error) errors.push(error);
            }
            game.gestures.push(gesture);
            game.gesturesCollection.set(gesture.id, gesture);
        }
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("Gestures");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("Gestures");
        resolve(game);
    });
}

/**
 * Checks a Gesture for errors.
 * @param {Gesture} gesture - The gesture to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkGesture(gesture) {
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
    if (gesture.narration === "")
        return new Error(`Couldn't load gesture on row ${gesture.row}. No narration was given.`);
}

/**
 * Loads data from the Flags sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadFlags(game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.flagSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response?.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnId = 0;
        const columnValue = 1;
        const columnValueScript = 2;
        const columnCommandsString = 3;

        game.entityManager.clearFlags();
        /** @type {Error[]} */
        let errors = [];
        for (let row = 0; row < sheet.length; row++) {
            let commandString = sheet[row][columnCommandsString] ? sheet[row][columnCommandsString].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\').replace(/(?<=http(s?)):(?=.*?(jpg|jpeg|png|webp|avif))/g, '@') : "";
            /** @type {FlagCommandSet[]} */
            let commandSets = [];
            /**
             * @param {string} commandString 
             * @returns {FlagCommandSet}
             */
            let getCommands = function (commandString) {
                const commands = commandString.split('/');
                let setCommands = commands[0] ? commands[0].split(/(?<!`.*?[^`])\s*?,/) : [];
                for (let i = 0; i < setCommands.length; i++)
                    setCommands[i] = setCommands[i].trim();
                let clearedCommands = commands[1] ? commands[1].split(/(?<!`.*?[^`])\s*?,/) : [];
                for (let i = 0; i < clearedCommands.length; i++)
                    clearedCommands[i] = clearedCommands[i].trim();
                return { setCommands: setCommands, clearedCommands: clearedCommands };
            };
            const regex = new RegExp(/(\[((.*?): (.*?))\],?)/g);
            if (!!commandString.match(regex)) {
                let match;
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
            /** @type {string|number|boolean} */
            let value;
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
                game
            );
            if (game.entityFinder.getFlag(flag.id)) {
                errors.push(new Error(`Couldn't get flag on row ${flag.row}. Another flag with this ID already exists.`));
                continue;
            }
            game.flags.set(flag.id, flag);
            game.entityManager.updateFlagReferences(flag);
        }
        if (doErrorChecking) {
            game.flags.forEach(flag => {
                const error = checkFlag(flag);
                if (error instanceof Error) errors.push(error);
            });
        }
        if (errors.length > 0) {
            game.loadedEntitiesWithErrors.add("Flags");
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        game.loadedEntitiesWithErrors.delete("Flags");
        resolve(game);
    });
}

/**
 * Checks a Flag for errors.
 * @param {Flag} flag - The flag to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkFlag(flag) {
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
 * @param {Error[]} errors - An array of errors to trim.
 * @returns The trimmed array of errors.
 */
function trimErrors(errors) {
    const tooManyErrors = errors.length > 20 || errors.join('\n').length >= 1980;
    while (errors.length > 20 || errors.join('\n').length >= 1980)
        errors = errors.slice(0, errors.length - 1);
    if (tooManyErrors)
        errors.push(new Error("Too many errors."));
    return errors;
}
