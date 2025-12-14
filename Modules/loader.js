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

import { ChannelType, Collection } from 'discord.js';
import dayjs from 'dayjs';
dayjs().format();

/**
 * Loads data from the Rooms sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadRooms (game, doErrorChecking) {
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
                const exit =  new Exit(
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
            if (game.entityFinder.getRoom(room.id))
                errors.push(new Error(`Couldn't load room on row ${room.row}. Another room with the same ID already exists.`));
            else game.roomsCollection.set(room.id, room);
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
            game.roomsCollection.set(room.id, room);
            game.entityManager.updateRoomReferences(room);
        });
        if (errors.length > 0) {
            game.loadedEntitiesHaveErrors = true;
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks a Room for errors.
 * @param {Room} room - The room to check.
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkRoom (room) {
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
    /** @type {string[]} */
    let exitNames = [];
    room.exitCollection.forEach(exit => {
        exitNames.push(exit.name);
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
    });
}

/**
 * Loads data from the Fixtures sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadFixtures (game, doErrorChecking) {
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
                sheet[row][columnAccessible]? sheet[row][columnAccessible].trim() === "TRUE" : false,
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
            game.loadedEntitiesHaveErrors = true;
            errors = trimErrors(errors);
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks a Fixture for errors.
 * @param {Fixture} fixture - The fixture to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkFixture (fixture) {
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
export function loadPrefabs (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.prefabSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnID = 0;
        const columnName = 1;
        const columnContainingPhrase = 2;
        const columnDiscreet = 3;
        const columnSize = 4;
        const columnWeight = 5;
        const columnUsable = 6;
        const columnUseVerb = 7;
        const columnUses = 8;
        const columnEffects = 9;
        const columnCures = 10;
        const columnNextStage = 11;
        const columnEquippable = 12;
        const columnEquipmentSlots = 13;
        const columnCoveredEquipmentSlots = 14;
        const columnEquipCommands = 15;
        const columnInventorySlots = 16;
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
            let effects = sheet[row][columnEffects] ? sheet[row][columnEffects].split(',') : [];
            for (let j = 0; j < effects.length; j++)
                effects[j] = Status.generateValidId(effects[j]);
            // Create a list of all status effect IDs this prefab will cure when used.
            let cures = sheet[row][columnCures] ? sheet[row][columnCures].split(',') : [];
            for (let j = 0; j < cures.length; j++)
                cures[j] = Status.generateValidId(cures[j]);
            // Create a list of equipment slots this prefab can be equipped to.
            let equipmentSlots = sheet[row][columnEquipmentSlots] ? sheet[row][columnEquipmentSlots].split(',') : [];
            for (let j = 0; j < equipmentSlots.length; j++)
                equipmentSlots[j] = Game.generateValidEntityName(equipmentSlots[j]);
            // Create a list of equipment slots this prefab covers when equipped.
            let coveredEquipmentSlots = sheet[row][columnCoveredEquipmentSlots] ? sheet[row][columnCoveredEquipmentSlots].split(',') : [];
            for (let j = 0; j < coveredEquipmentSlots.length; j++)
                coveredEquipmentSlots[j] = Game.generateValidEntityName(coveredEquipmentSlots[j]);
            // Create a list of commands to run when this prefab is equipped/unequipped. Temporarily replace forward slashes in URLs with back slashes.
            const commandString = sheet[row][columnEquipCommands] ? sheet[row][columnEquipCommands].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\') : "";
            const commands = commandString ? commandString.split('/') : ["", ""];
            let equipCommands = commands[0] ? commands[0].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let j = 0; j < equipCommands.length; j++)
                equipCommands[j] = equipCommands[j].trim();
            let unequipCommands = commands[1] ? commands[1].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let j = 0; j < unequipCommands.length; j++)
                unequipCommands[j] = unequipCommands[j].trim();
            // Create a list of inventory slots this prefab contains.
            let inventorySlotStrings = sheet[row][columnInventorySlots] ? sheet[row][columnInventorySlots].split(',') : [];
            /** @type {Collection<string, InventorySlot>} */
            let inventorySlots = new Collection();
            for (let i = 0; i < inventorySlotStrings.length; i++) {
                let inventorySlotSplit = inventorySlotStrings[i].split(':');
                if (inventorySlotSplit.length === 1) inventorySlotSplit = [inventorySlotStrings[i], ""];
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
            }
            const prefab = new Prefab(
                sheet[row][columnID] ? Game.generateValidEntityName(sheet[row][columnID]) : "",
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
                effects,
                cures,
                sheet[row][columnNextStage] ? sheet[row][columnNextStage].trim() : "",
                sheet[row][columnEquippable] ? sheet[row][columnEquippable].trim() === "TRUE" : false,
                equipmentSlots,
                coveredEquipmentSlots,
                sheet[row][columnEquipCommands] ? sheet[row][columnEquipCommands] : "",
                equipCommands,
                unequipCommands,
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
            let nextStage = game.entityFinder.getPrefab(prefab.nextStageId);
            if (nextStage) prefab.setNextStage(nextStage);
            else {
                // If the next stage wasn't found, it might have just not been loaded yet. Save it for later.
                let assignmentsList = nextStageAssignments.get(prefab.nextStageId);
                if (!assignmentsList) assignmentsList = [];
                assignmentsList.push(prefab.id);
                nextStageAssignments.set(prefab.nextStageId, assignmentsList);
            }
            if (doErrorChecking) {
                const error = checkPrefab(prefab);
                if (error instanceof Error) errors.push(error);
            }
            game.prefabs.push(prefab);
            game.prefabsCollection.set(prefab.id, prefab);
            game.entityManager.updatePrefabReferences(prefab);
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks a Prefab for errors.
 * @param {Prefab} prefab - The prefab to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkPrefab (prefab) {
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
    prefab.inventoryCollection.forEach((inventorySlot, i) => {
        if (inventorySlot.id === "" || inventorySlot.id === null || inventorySlot.id === undefined)
            return new Error(`Couldn't load prefab on row ${prefab.row}. No name was given for inventory slot ${i + 1}.`);
        if (isNaN(inventorySlot.capacity))
            return new Error(`Couldn't load prefab on row ${prefab.row}. The capacity given for inventory slot "${inventorySlot.id}" is not a number.`);
    });
    if (prefab.inventoryCollection.size !== 0 && prefab.preposition === "")
        return new Error(`Couldn't load prefab on row ${prefab.row}. ${prefab.id} has inventory slots, but no preposition was given.`);
}

/**
 * Loads data from the Recipes sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadRecipes (game, doErrorChecking) {
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

        game.recipes.length = 0;
        for (let i = 0; i < sheet.length; i++) {
            // Separate the ingredients and sort them in alphabetical order.
            let ingredientsStrings = sheet[i][columnIngredients] ? sheet[i][columnIngredients].split(',') : [];
            ingredientsStrings.sort(function (a, b) {
                let trimmedA = Game.generateValidEntityName(a);
                let trimmedB = Game.generateValidEntityName(b);
                if (trimmedA < trimmedB) return -1;
                if (trimmedA > trimmedB) return 1;
                return 0;
            });
            // For each ingredient, convert the string to a valid entity name.
            for (let j = 0; j < ingredientsStrings.length; j++)
                ingredientsStrings[j] = Game.generateValidEntityName(ingredientsStrings[j]);
            // Parse the duration.
            const durationString = sheet[i][columnDuration] ? sheet[i][columnDuration].toString() : "";
            let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
            let durationUnit = durationString.charAt(durationString.length - 1);
            /** @type {import('dayjs/plugin/duration.js').Duration} */
            let duration = null;
            if (durationString && (durationUnit === 'y' || durationUnit === 'M' || durationUnit === 'w' || durationUnit === 'd' || durationUnit === 'h' || durationUnit === 'm' || durationUnit === 's'))
                duration = dayjs.duration(durationInt, durationUnit);
            // Separate the products.
            let productsStrings = sheet[i][columnProducts] ? sheet[i][columnProducts].split(',') : [];
            // For each product, convert the string to a valid entity name.
            for (let j = 0; j < productsStrings.length; j++)
                productsStrings[j] = Game.generateValidEntityName(productsStrings[j]);

            game.recipes.push(
                new Recipe(
                    ingredientsStrings,
                    sheet[i][columnUncraftable] ? sheet[i][columnUncraftable].trim() === "TRUE" : false,
                    sheet[i][columnFixtureTag] ? sheet[i][columnFixtureTag].trim() : "",
                    duration,
                    productsStrings,
                    sheet[i][columnInitiatedDescription] ? sheet[i][columnInitiatedDescription].trim() : "",
                    sheet[i][columnCompletedDescription] ? sheet[i][columnCompletedDescription].trim() : "",
                    sheet[i][columnUncraftedDescription] ? sheet[i][columnUncraftedDescription].trim() : "",
                    i + 2,
                    game
                )
            );
        }
        let errors = [];
        for (let i = 0; i < game.recipes.length; i++) {
            for (let j = 0; j < game.recipes[i].ingredientsStrings.length; j++) {
                const prefab = game.prefabs.find(prefab => prefab.id !== "" && prefab.id === game.recipes[i].ingredientsStrings[j]);
                if (prefab) game.recipes[i].ingredients[j] = prefab;
            }
            for (let j = 0; j < game.recipes[i].productsStrings.length; j++) {
                const prefab = game.prefabs.find(prefab => prefab.id !== "" && prefab.id === game.recipes[i].productsStrings[j]);
                if (prefab) game.recipes[i].products[j] = prefab;
            }
            if (doErrorChecking) {
                const error = exports.checkRecipe(game.recipes[i]);
                if (error instanceof Error) errors.push(error);
            }
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks a Recipe for errors.
 * @param {Recipe} recipe - The recipe to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkRecipe (recipe) {
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
export function loadRoomItems (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.roomItemSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnPrefab = 0;
        const columnIdentifier = 1;
        const columnLocation = 2;
        const columnAccessibility = 3;
        const columnContainer = 4;
        const columnQuantity = 5;
        const columnUses = 6;
        const columnDescription = 7;

        game.roomItems.length = 0;
        for (let i = 0; i < sheet.length; i++) {
            game.roomItems.push(
                new RoomItem(
                    sheet[i][columnPrefab] ? Game.generateValidEntityName(sheet[i][columnPrefab]) : "",
                    sheet[i][columnIdentifier] ? Game.generateValidEntityName(sheet[i][columnIdentifier]) : "",
                    sheet[i][columnLocation] ? sheet[i][columnLocation].trim() : "",
                    sheet[i][columnAccessibility] ? sheet[i][columnAccessibility].trim() === "TRUE" : false,
                    sheet[i][columnContainer] ? sheet[i][columnContainer].trim() : "",
                    parseInt(sheet[i][columnQuantity]),
                    parseInt(sheet[i][columnUses]),
                    sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                    i + 2,
                    game
                )
            );
        }
        let errors = [];
        let childItemIndexes = [];
        for (let i = 0; i < game.roomItems.length; i++) {
            const prefab = game.prefabs.find(prefab => prefab.id !== "" && prefab.id === game.roomItems[i].prefabId);
            if (prefab) game.roomItems[i].setPrefab(prefab);
            const location = game.rooms.find(room => room.id !== "" && room.id === Room.generateValidId(game.roomItems[i].locationDisplayName))
            if (location) game.roomItems[i].location = location;
            if (game.roomItems[i].prefab instanceof Prefab) {
                game.roomItems[i].initializeInventory();
            }
            if (game.roomItems[i].containerName.startsWith("Object:")) {
                const container = game.fixtures.find(fixture =>
                    fixture.name === Game.generateValidEntityName(game.roomItems[i].containerName.substring("Object:".length))
                    && fixture.location instanceof Room
                    && game.roomItems[i].location instanceof Room
                    && fixture.location.id === game.roomItems[i].location.id
                );
                if (container) game.roomItems[i].container = container;
            }
            else if (game.roomItems[i].containerName.startsWith("Item:")) {
                childItemIndexes.push(i);
            }
            else if (game.roomItems[i].containerName.startsWith("Puzzle:")) {
                const container = game.puzzles.find(puzzle =>
                    puzzle.name === Game.generateValidEntityName(game.roomItems[i].containerName.substring("Puzzle:".length))
                    && puzzle.location instanceof Room
                    && game.roomItems[i].location instanceof Room
                    && puzzle.location.id === game.roomItems[i].location.id
                );
                if (container) game.roomItems[i].container = container;
            }
        }
        // Only assign child item containers once all items have been properly initialized.
        for (let index = 0; index < childItemIndexes.length; index++) {
            const i = childItemIndexes[index];
            const containerName = game.roomItems[i].containerName.substring("Item:".length).trim().split("/");
            const identifier = containerName[0] ? Game.generateValidEntityName(containerName[0]) : "";
            const slotId = containerName[1] ? Game.generateValidEntityName(containerName[1]) : "";
            let possibleContainers = game.roomItems.filter(item =>
                item.identifier === identifier
                && item.location instanceof Room
                && game.roomItems[i].location instanceof Room
                && item.location.id === game.roomItems[i].location.id);
            let container = null;
            for (let i = 0; i < possibleContainers.length; i++) {
                if (possibleContainers[i].quantity > 0) {
                    container = possibleContainers[i];
                    break;
                }
            }
            if (container === null && possibleContainers.length > 0) container = possibleContainers[0];
            if (container) {
                game.roomItems[i].container = container;
                game.roomItems[i].slot = slotId;
                // This is a pseudo-copy of the insertItems function without weight and takenSpace changing.
                if (game.roomItems[i].quantity !== 0) {
                    for (let j = 0; j < container.inventory.length; j++) {
                        if (container.inventory[j].id === slotId)
                            container.inventory[j].items.push(game.roomItems[i]);
                    }
                }
            }
        }
        // Create a recursive function for properly inserting item inventories.
        /** @param {RoomItem} item */
        let insertInventory = function (item) {
            let createdItem = new RoomItem(
                item.prefab.id,
                item.identifier,
                item.locationDisplayName,
                item.accessible,
                item.containerName,
                item.quantity,
                item.uses,
                item.description,
                item.row,
                game
            );
            createdItem.setPrefab(item.prefab);
            createdItem.location = item.location;
            if (item.container instanceof RoomItem) createdItem.container = game.roomItems.find(gameItem => gameItem.row === item.container.row);
            else createdItem.container = item.container;
            createdItem.slot = item.slot;
            createdItem.weight = item.weight;

            // Initialize the item's inventory slots.
            if (item.prefab instanceof Prefab)
                item.initializeInventory();

            for (let i = 0; i < item.inventory.length; i++) {
                for (let j = 0; j < item.inventory[i].items.length; j++) {
                    const inventoryItem = insertInventory(item.inventory[i].items[j]);
                    let foundItem = false;
                    let k = 0;
                    for (k; k < game.roomItems.length; k++) {
                        if (game.roomItems[k].row === inventoryItem.row) {
                            foundItem = true;
                            game.roomItems[k] = inventoryItem;
                            break;
                        }
                    }
                    if (foundItem) {
                        game.roomItems[k].container = createdItem;
                        if (game.roomItems[k].containerName !== "")
                            createdItem.insertItem(game.roomItems[k], game.roomItems[k].slot);
                        else createdItem.inventory[i].items.push(game.roomItems[k]);
                    }
                }
            }
            return createdItem;
        };
        // Run through items one more time to properly insert their inventories.
        for (let i = 0; i < game.roomItems.length; i++) {
            const container = game.roomItems[i].container;
            if (container instanceof RoomItem) {
                for (let slot = 0; slot < container.inventory.length; slot++) {
                    for (let j = 0; j < container.inventory[slot].items.length; j++) {
                        if (container.inventory[slot].items[j].row === game.roomItems[i].row) {
                            game.roomItems[i] = container.inventory[slot].items[j];
                            break;
                        }
                    }
                }
            }
            else game.roomItems[i] = insertInventory(game.roomItems[i]);

            if (doErrorChecking) {
                const error = exports.checkItem(game.roomItems[i], game);
                if (error instanceof Error) errors.push(error);
            }
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    }); 
}

/**
 * Checks a RoomItem for errors.
 * @param {RoomItem} item - The room item to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkRoomItem (item) {
    if (!(item.prefab instanceof Prefab))
        return new Error(`Couldn't load room item on row ${item.row}. "${item.prefabId}" is not a prefab.`);
    if (item.inventory.length > 0 && item.identifier === "")
        return new Error(`Couldn't load room item on row ${item.row}. This item is capable of containing items, but no container identifier was given.`);
    if (item.inventory.length > 0 && (item.quantity > 1 || isNaN(item.quantity)))
        return new Error(`Couldn't load room item on row ${item.row}. Items capable of containing items must have a quantity of 1.`);
    if (item.identifier !== "" && item.quantity !== 0 &&
        item.game.roomItems.filter(other => other.identifier === item.identifier && other.row < item.row && other.quantity !== 0).length
        + item.game.inventoryItems.filter(other => other.identifier === item.identifier && other.quantity !== 0).length > 0)
        return new Error(`Couldn't load room item on row ${item.row}. Another item or inventory item with this container identifier already exists.`);
    if (item.prefab.pluralContainingPhrase === "" && (item.quantity > 1 || isNaN(item.quantity)))
        return new Error(`Couldn't load room item on row ${item.row}. Quantity is higher than 1, but its prefab on row ${item.prefab.row} has no plural containing phrase.`);
    if (!(item.location instanceof Room))
        return new Error(`Couldn't load room item on row ${item.row}. "${item.locationDisplayName}" is not a room.`);
    if (item.containerName === "")
        return new Error(`Couldn't load room item on row ${item.row}. No container was given.`);
    if (item.containerName.startsWith("Object:") && !(item.container instanceof Fixture))
        return new Error(`Couldn't load room item on row ${item.row}. The container given is not a fixture.`);
    if (item.containerName.startsWith("Item:") && !(item.container instanceof RoomItem))
        return new Error(`Couldn't load room item on row ${item.row}. The container given is not a room item.`);
    if (item.containerName.startsWith("Puzzle:") && !(item.container instanceof Puzzle))
        return new Error(`Couldn't load room item on row ${item.row}. The container given is not a puzzle.`);
    if (item.containerName !== "" && !item.containerName.startsWith("Object:") && !item.containerName.startsWith("Item:") && !item.containerName.startsWith("Puzzle:"))
        return new Error(`Couldn't load room item on row ${item.row}. The given container type is invalid.`);
    if (item.container instanceof RoomItem && item.container.inventory.length === 0)
        return new Error(`Couldn't load room item on row ${item.row}. The item's container is a room item, but the item container's prefab on row ${item.container.prefab.row} has no inventory slots.`);
    if (item.container instanceof RoomItem) {
        if (item.slot === "") return new Error(`Couldn't load room item on row ${item.row}. The item's container is a room item, but a prefab inventory slot ID was not given.`);
        let foundSlot = false;
        for (let i = 0; i < item.container.inventory.length; i++) {
            if (item.container.inventory[i].id === item.slot) {
                foundSlot = true;
                if (item.container.inventory[i].takenSpace > item.container.inventory[i].capacity)
                    return new Error(`Couldn't load room item on row ${item.row}. The item's container is over capacity.`);
            }
        }
        if (!foundSlot) return new Error(`Couldn't load room item on row ${item.row}. The item's container prefab on row ${item.container.prefab.row} has no inventory slot "${item.slot}".`);
    }
}

/**
 * Loads data from the Puzzles sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadPuzzles (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.puzzleSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnName = 0;
        const columnSolved = 1;
        const columnOutcome = 2;
        const columnRequiresMod = 3;
        const columnLocation = 4;
        const columnParentFixture = 5;
        const columnType = 6;
        const columnAccessible = 7;
        const columnRequires = 8;
        const columnSolution = 9;
        const columnAttempts = 10;
        const columnWhenSolved = 11;
        const columnCorrectDescription = 12;
        const columnAlreadySolvedDescription = 13;
        const columnIncorrectDescription = 14;
        const columnNoMoreAttemptsDescription = 15;
        const columnRequirementsNotMetDescription = 16;

        game.puzzles.length = 0;
        for (let i = 0; i < sheet.length; i++) {
            let requirements = sheet[i][columnRequires] ? sheet[i][columnRequires].split(',') : [];
            for (let j = 0; j < requirements.length; j++)
                requirements[j] = requirements[j].trim();
            const commandString = sheet[i][columnWhenSolved] ? sheet[i][columnWhenSolved].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\').replace(/(?<=http(s?)):(?=.*?(jpg|jpeg|png|webp|avif))/g, '@') : "";
            /** @type {PuzzleCommandSet[]} */
            let commandSets = [];
            /**
             * @param {string} commandString
             * @returns {PuzzleCommandSet}
             */
            let getCommands = function (commandString) {
                const commands = commandString.split('/');
                let solvedCommands = commands[0] ? commands[0].split(/(?<!`.*?[^`])\s*?,/) : [];
                for (let j = 0; j < solvedCommands.length; j++)
                    solvedCommands[j] = solvedCommands[j].trim();
                let unsolvedCommands = commands[1] ? commands[1].split(/(?<!`.*?[^`])\s*?,/) : [];
                for (let j = 0; j < unsolvedCommands.length; j++)
                    unsolvedCommands[j] = unsolvedCommands[j].trim();
                return { solvedCommands: solvedCommands, unsolvedCommands: unsolvedCommands };
            };
            const regex = new RegExp(/(\[((.*?)(?<!(?:(?:Inventory)?Item)|Prefab): (.*?))\],?)/g);
            if (!!commandString.match(regex)) {
                let match;
                while (match = regex.exec(commandString)) {
                    const commandSet = match[2];
                    let outcomes = commandSet.substring(0, commandSet.lastIndexOf(':')).split(',');
                    for (let j = 0; j < outcomes.length; j++)
                        outcomes[j] = outcomes[j].trim();
                    const commands = getCommands(commandSet.substring(commandSet.lastIndexOf(':') + 1));
                    commandSets.push({ outcomes: outcomes, solvedCommands: commands.solvedCommands, unsolvedCommands: commands.unsolvedCommands });
                }
            }
            else {
                const commands = getCommands(sheet[i][columnWhenSolved] ? sheet[i][columnWhenSolved] : "");
                commandSets.push({ outcomes: [], solvedCommands: commands.solvedCommands, unsolvedCommands: commands.unsolvedCommands });
            }
            let solutions = sheet[i][columnSolution] ? sheet[i][columnSolution].toString().split(',') : [];
            for (let j = 0; j < solutions.length; j++) {
                if (sheet[i][columnType] === "voice")
                    solutions[j] = solutions[j].replace(/[^a-zA-Z0-9 ]+/g, "").toLowerCase().trim();
                else
                    solutions[j] = solutions[j].trim();
            }
            game.puzzles.push(
                new Puzzle(
                    sheet[i][columnName] ? Game.generateValidEntityName(sheet[i][columnName]) : "",
                    sheet[i][columnSolved] ? sheet[i][columnSolved].trim() === "TRUE" : false,
                    sheet[i][columnOutcome] ? sheet[i][columnOutcome].trim() : "",
                    sheet[i][columnRequiresMod] ? sheet[i][columnRequiresMod].trim() === "TRUE" : false,
                    sheet[i][columnLocation] ? sheet[i][columnLocation].trim() : "",
                    sheet[i][columnParentFixture] ? Game.generateValidEntityName(sheet[i][columnParentFixture]) : "",
                    sheet[i][columnType] ? sheet[i][columnType].trim() : "",
                    sheet[i][columnAccessible] ? sheet[i][columnAccessible].trim() === "TRUE" : false,
                    requirements,
                    solutions,
                    parseInt(sheet[i][columnAttempts]),
                    sheet[i][columnWhenSolved] ? sheet[i][columnWhenSolved] : "",
                    commandSets,
                    sheet[i][columnCorrectDescription] ? sheet[i][columnCorrectDescription].trim() : "",
                    sheet[i][columnAlreadySolvedDescription] ? sheet[i][columnAlreadySolvedDescription].trim() : "",
                    sheet[i][columnIncorrectDescription] ? sheet[i][columnIncorrectDescription].trim() : "",
                    sheet[i][columnNoMoreAttemptsDescription] ? sheet[i][columnNoMoreAttemptsDescription].trim() : "",
                    sheet[i][columnRequirementsNotMetDescription] ? sheet[i][columnRequirementsNotMetDescription].trim() : "",
                    i + 2,
                    game
                )
            );
        }
        let errors = [];
        for (let i = 0; i < game.puzzles.length; i++) {
            game.puzzles[i].location = game.rooms.find(room => room.id !== "" && room.id === Room.generateValidId(game.puzzles[i].locationDisplayName));
            const parentFixture = game.fixtures.find(fixture =>
                fixture.name === game.puzzles[i].parentFixtureName
                && fixture.location instanceof Room
                && game.puzzles[i].location instanceof Room
                && fixture.location.id === game.puzzles[i].location.id
            );
            if (parentFixture) game.puzzles[i].parentFixture = parentFixture;
            for (let j = 0; j < game.puzzles[i].requirementsStrings.length; j++) {
                let requirement = null;
                const requirementString = game.puzzles[i].requirementsStrings[j];
                const requirementSubstring = Game.generateValidEntityName(requirementString.substring(requirementString.indexOf(':') + 1));
                if (requirementString.startsWith("Item:") || requirementString.startsWith("InventoryItem:") || requirementString.startsWith("Prefab:"))
                    requirement = game.prefabs.find(prefab => prefab.id === requirementSubstring);
                else if (requirementString.startsWith("Event:"))
                    requirement = game.events.find(event => event.id === requirementSubstring);
                else if (requirementString.startsWith("Flag:"))
                    requirement = game.flags.get(requirementSubstring);
                else
                    requirement = game.puzzles.find(puzzle => puzzle.name === requirementString || requirementString === `Puzzle: ${puzzle.name}`);
                if (requirement) game.puzzles[i].requirements[j] = requirement;
            }
            if (doErrorChecking) {
                const error = exports.checkPuzzle(game.puzzles[i]);
                if (error instanceof Error) errors.push(error);
            }
        }
        for (let i = 0; i < game.fixtures.length; i++) {
            if (game.fixtures[i].childPuzzleName !== "") {
                game.fixtures[i].childPuzzle = game.puzzles.find(puzzle =>
                    puzzle.name === game.fixtures[i].childPuzzleName
                    && puzzle.location instanceof Room
                    && game.fixtures[i].location instanceof Room
                    && puzzle.location.id === game.fixtures[i].location.id
                );
            }
        }
        for (let i = 0; i < game.roomItems.length; i++) {
            if (game.roomItems[i].containerName.startsWith("Puzzle:")) {
                game.roomItems[i].container = game.puzzles.find(puzzle =>
                    puzzle.name === Game.generateValidEntityName(game.roomItems[i].containerName.substring("Puzzle:".length))
                    && puzzle.location instanceof Room
                    && game.roomItems[i].location instanceof Room
                    && puzzle.location.id === game.roomItems[i].location.id
                );
            }
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks a Puzzle for errors.
 * @param {Puzzle} puzzle - The puzzle to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkPuzzle (puzzle) {
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
    if (puzzle.type === "weight") {
        for (let i = 0; i < puzzle.solutions.length; i++) {
            if (isNaN(parseInt(puzzle.solutions[i])))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a weight-type puzzle, but the solution "${puzzle.solutions[i]}" is not an integer.`);
        }
    }
    if (puzzle.type === "container") {
        for (let i = 0; i < puzzle.solutions.length; i++) {
            let requiredItems = puzzle.solutions[i].split('+');
            for (let j = 0; j < requiredItems.length; j++) {
                if (!requiredItems[j].trim().startsWith("Item: ") && !requiredItems[j].trim().startsWith("InventoryItem: ") && !requiredItems[j].trim().startsWith("Prefab: "))
                    return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a container-type puzzle, but the solution "${requiredItems[j]}" does not have the "Item: ", "InventoryItem: ", or "Prefab: " prefix.`);
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
        for (let i = 0; i < puzzle.solutions.length; i++) {
            if (!puzzle.solutions[i].startsWith("Item: ") && !puzzle.solutions[i].startsWith("InventoryItem: ") && !puzzle.solutions[i].startsWith("Prefab: "))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a media-type puzzle, but the solution "${puzzle.solutions[i]}" does not have the "Item: ", "InventoryItem: ", or "Prefab: " prefix.`);
        }
        if (puzzle.solved === true && puzzle.outcome === "")
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a media-type puzzle, but it was solved without an outcome.`);
        if (puzzle.outcome !== "" && !puzzle.solutions.includes(puzzle.outcome))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a media-type puzzle, but its outcome is not among the list of its solutions.`);
    }
    for (let i = 0; i < puzzle.commandSets.length; i++) {
        for (let j = 0; j < puzzle.commandSets[i].outcomes.length; j++) {
            if (!puzzle.solutions.includes(puzzle.commandSets[i].outcomes[j]))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.commandSets[i].outcomes[j]}" in command sets is not an outcome in the puzzle's solutions.`);
        }
    }
    for (let i = 0; i < puzzle.requirements.length; i++) {
        const requirementString = puzzle.requirementsStrings[i];
        if ((requirementString.startsWith("Item:") || requirementString.startsWith("InventoryItem:") || requirementString.startsWith("Prefab:")) && !(puzzle.requirements[i] instanceof Prefab))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${requirementString}" in requires is not a prefab.`);
        else if (requirementString.startsWith("Event:") && !(puzzle.requirements[i] instanceof Event))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${requirementString}" in requires is not an event.`);
        else if (requirementString.startsWith("Flag:") && !(puzzle.requirements[i] instanceof Flag))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${requirementString}" in requires is not a flag.`);
        else if ((!requirementString.includes(':') || requirementString.startsWith("Puzzle:")) && !(puzzle.requirements[i] instanceof Puzzle))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${requirementString}" in requires is not a puzzle.`);
    }
}

/**
 * Loads data from the Events sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadEvents (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        // Clear timers for all events first.
        for (let i = 0; i < game.events.length; i++) {
            if (game.events[i].timer !== null)
                game.events[i].timer.stop();
            if (game.events[i].effectsTimer !== null)
                game.events[i].effectsTimer.stop();
        }

        const response = await getSheetValues(game.constants.eventSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnName = 0;
        const columnOngoing = 1;
        const columnDuration = 2;
        const columnTimeRemaining = 3;
        const columnTriggersAt = 4;
        const columnRoomTag = 5;
        const columnCommands = 6;
        const columnStatusEffects = 7;
        const columnRefreshedEffects = 8;
        const columnTriggeredNarration = 9;
        const columnEndedNarration = 10;

        game.events.length = 0;
        game.eventsCollection.clear();
        for (let i = 0; i < sheet.length; i++) {
            const durationString = sheet[i][columnDuration] ? sheet[i][columnDuration].toString() : "";
            let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
            let durationUnit = durationString.charAt(durationString.length - 1);
            /** @type {import('dayjs/plugin/duration.js').Duration} */
            let duration = null;
            if (durationString && (durationUnit === 'y' || durationUnit === 'M' || durationUnit === 'w' || durationUnit === 'd' || durationUnit === 'h' || durationUnit === 'm' || durationUnit === 's'))
                duration = dayjs.duration(durationInt, durationUnit);
            const timeRemaining = sheet[i][columnTimeRemaining] ? dayjs.duration(sheet[i][columnTimeRemaining]) : null;
            let triggerTimes = sheet[i][columnTriggersAt] ? sheet[i][columnTriggersAt].split(',') : [];
            for (let j = 0; j < triggerTimes.length; j++)
                triggerTimes[j] = triggerTimes[j].trim();
            const commandString = sheet[i][columnCommands] ? sheet[i][columnCommands].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\') : "";
            const commands = commandString ? commandString.split('/') : ["", ""];
            let triggeredCommands = commands[0] ? commands[0].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let j = 0; j < triggeredCommands.length; j++)
                triggeredCommands[j] = triggeredCommands[j].trim();
            let endedCommands = commands[1] ? commands[1].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let j = 0; j < endedCommands.length; j++)
                endedCommands[j] = endedCommands[j].trim();
            let effects = sheet[i][columnStatusEffects] ? sheet[i][columnStatusEffects].split(',') : [];
            for (let j = 0; j < effects.length; j++)
                effects[j] = Status.generateValidId(effects[j]);
            let refreshes = sheet[i][columnRefreshedEffects] ? sheet[i][columnRefreshedEffects].split(',') : [];
            for (let j = 0; j < refreshes.length; j++)
                refreshes[j] = Status.generateValidId(refreshes[j]);
            const event = new Event(
                sheet[i][columnName] ? Game.generateValidEntityName(sheet[i][columnName]) : "",
                sheet[i][columnOngoing] ? sheet[i][columnOngoing].trim() === "TRUE" : false,
                durationString,
                duration,
                sheet[i][columnTimeRemaining] ? sheet[i][columnTimeRemaining] : "",
                timeRemaining,
                sheet[i][columnTriggersAt] ? sheet[i][columnTriggersAt] : "",
                triggerTimes,
                sheet[i][columnRoomTag] ? sheet[i][columnRoomTag].trim() : "",
                sheet[i][columnCommands] ? sheet[i][columnCommands] : "",
                triggeredCommands,
                endedCommands,
                effects,
                refreshes,
                sheet[i][columnTriggeredNarration] ? sheet[i][columnTriggeredNarration].trim() : "",
                sheet[i][columnEndedNarration] ? sheet[i][columnEndedNarration].trim() : "",
                i + 2,
                game
            );
            game.events.push(event);
            game.eventsCollection.set(event.id, event);
        }
        let errors = [];
        for (let i = 0; i < game.events.length; i++) {
            for (let j = 0; j < game.events[i].effects.length; j++) {
                const status = game.statusEffects.find(statusEffect => statusEffect.id === game.events[i].effectsStrings[j]);
                if (status) game.events[i].effects[j] = status;
            }
            for (let j = 0; j < game.events[i].refreshes.length; j++) {
                const status = game.statusEffects.find(statusEffect => statusEffect.id === game.events[i].refreshesStrings[j]);
                if (status) game.events[i].refreshes[j] = status;
            }
            if (doErrorChecking) {
                const error = exports.checkEvent(game.events[i], game);
                if (error instanceof Error) errors.push(error);
            }
        }
        for (let i = 0; i < game.puzzles.length; i++) {
            for (let j = 0; j < game.puzzles[i].requirementsStrings.length; j++) {
                const requirementString = game.puzzles[i].requirementsStrings[j];
                if (requirementString.startsWith("Event:")) {
                    const requirement = game.events.find(event => event.id === Game.generateValidEntityName(requirementString.substring(requirementString.indexOf(':') + 1)));
                    if (requirement) game.puzzles[i].requirements[j] = requirement;
                }
            }
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks an Event for errors.
 * @param {Event} event - The event to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkEvent (event) {
    if (event.id === "" || event.id === null || event.id === undefined)
        return new Error(`Couldn't load event on row ${event.row}. No event ID was given.`);
    if (event.game.events.filter(other => other.id === event.id && other.row < event.row).length > 0)
        return new Error(`Couldn't load event on row ${event.row}. Another event with this ID already exists.`);
    if (event.duration !== null && !dayjs.isDuration(event.duration))
        return new Error(`Couldn't load event on row ${event.row}. An invalid duration was given.`);
    if (event.remaining !== null && !dayjs.isDuration(event.remaining))
        return new Error(`Couldn't load event on row ${event.row}. An invalid time remaining was given.`);
    if (!event.ongoing && event.remaining !== null)
        return new Error(`Couldn't load event on row ${event.row}. The event is not ongoing, but an amount of time remaining was given.`);
    if (event.ongoing && event.duration !== null && event.remaining === null)
        return new Error(`Couldn't load event on row ${event.row}. The event is ongoing, but no amount of time remaining was given.`);
    for (let i = 0; i < event.triggerTimes.length; i++) {
        let triggerTime = dayjs(event.triggerTimes[i], Event.formats);
        if (!triggerTime.isValid())
            return new Error(`Couldn't load event on row ${event.row}. "${event.triggerTimes[i]}" is not a valid time to trigger at.`);
    }
    for (let i = 0; i < event.effects.length; i++) {
        if (!(event.effects[i] instanceof Status))
            return new Error(`Couldn't load event on row ${event.row}. "${event.effectsStrings[i]}" in inflicted status effects is not a status effect.`);
    }
    for (let i = 0; i < event.refreshes.length; i++) {
        if (!(event.refreshes[i] instanceof Status))
            return new Error(`Couldn't load event on row ${event.row}. "${event.refreshesStrings[i]}" in refreshing status effects is not a status effect.`);
    }
}

/**
 * Loads data from the Status Effects sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadStatusEffects (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.statusSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnName = 0;
        const columnDuration = 1;
        const columnFatal = 2;
        const columnVisible = 3;
        const columnOverriders = 4;
        const columnCures = 5;
        const columnNextStage = 6;
        const columnDuplicatedStatus = 7;
        const columnCuredCondition = 8;
        const columnStatModifier = 9;
        const columnAttributes = 10;
        const columnInflictedDescription = 12;
        const columnCuredDescription = 13;

        game.statusEffects.length = 0;
        game.statusEffectsCollection.clear();
        for (let i = 0; i < sheet.length; i++) {
            const durationString = sheet[i][columnDuration] ? sheet[i][columnDuration].toString() : "";
            let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
            let durationUnit = durationString.charAt(durationString.length - 1);
            /** @type {import('dayjs/plugin/duration.js').Duration} */
            let duration = null;
            if (durationString && (durationUnit === 'y' || durationUnit === 'M' || durationUnit === 'w' || durationUnit === 'd' || durationUnit === 'h' || durationUnit === 'm' || durationUnit === 's'))
                duration = dayjs.duration(durationInt, durationUnit);
            let overriders = sheet[i][columnOverriders] ? sheet[i][columnOverriders].split(',') : [];
            for (let j = 0; j < overriders.length; j++)
                overriders[j] = Status.generateValidId(overriders[j]);
            let cures = sheet[i][columnCures] ? sheet[i][columnCures].split(',') : [];
            for (let j = 0; j < cures.length; j++)
                cures[j] = Status.generateValidId(cures[j]);
            let modifierStrings = sheet[i][columnStatModifier] ? sheet[i][columnStatModifier].split(',') : [];
            /** @type {StatModifier[]} */
            let modifiers = [];
            for (let j = 0; j < modifierStrings.length; j++) {
                modifierStrings[j] = modifierStrings[j].toLowerCase().trim();

                let modifiesSelf = true;
                if (modifierStrings[j].charAt(0) === '@') {
                    modifiesSelf = false;
                    modifierStrings[j] = modifierStrings[j].substring(1);
                }

                let stat = null;
                let assignValue = false;
                let value = null;
                if (modifierStrings[j].includes('+')) {
                    stat = modifierStrings[j].substring(0, modifierStrings[j].indexOf('+'));
                    value = parseInt(modifierStrings[j].substring(stat.length));
                }
                else if (modifierStrings[j].includes('-')) {
                    stat = modifierStrings[j].substring(0, modifierStrings[j].indexOf('-'));
                    value = parseInt(modifierStrings[j].substring(stat.length));
                }
                else if (modifierStrings[j].includes('=')) {
                    stat = modifierStrings[j].substring(0, modifierStrings[j].indexOf('='));
                    assignValue = true;
                    value = parseInt(modifierStrings[j].substring(stat.length + 1));
                }

                if (stat === "strength") stat = "str";
                else if (stat === "intelligence") stat = "int";
                else if (stat === "dexterity") stat = "dex";
                else if (stat === "speed") stat = "spd";
                else if (stat === "stamina") stat = "sta";

                modifiers.push({ modifiesSelf: modifiesSelf, stat: stat, assignValue: assignValue, value: value });
            }
            let attributes = sheet[i][columnAttributes] ? sheet[i][columnAttributes].split(',') : [];
            for (let j = 0; j < attributes.length; j++)
                attributes[j] = attributes[j].trim();
            const status = new Status(
                sheet[i][columnName] ? sheet[i][columnName].trim() : "",
                duration,
                sheet[i][columnFatal] ? sheet[i][columnFatal].trim() === "TRUE" : false,
                sheet[i][columnVisible] ? sheet[i][columnVisible].trim() === "TRUE" : false,
                overriders,
                cures,
                sheet[i][columnNextStage] ? sheet[i][columnNextStage].trim() : null,
                sheet[i][columnDuplicatedStatus] ? sheet[i][columnDuplicatedStatus].trim() : null,
                sheet[i][columnCuredCondition] ? sheet[i][columnCuredCondition].trim() : null,
                modifiers,
                attributes,
                sheet[i][columnInflictedDescription] ? sheet[i][columnInflictedDescription].trim() : "",
                sheet[i][columnCuredDescription] ? sheet[i][columnCuredDescription].trim() : "",
                i + 2,
                game
            );
            game.statusEffects.push(status);
            game.statusEffectsCollection.set(status.id, status);
        }
        // Now go through and make the nextStage and curedCondition an actual Status object.
        var errors = [];
        for (let i = 0; i < game.statusEffects.length; i++) {
            for (let j = 0; j < game.statusEffects[i].overriders.length; j++) {
                let overrider = game.statusEffects.find(statusEffect => statusEffect.id === game.statusEffects[i].overridersStrings[j]);
                if (overrider) game.statusEffects[i].overriders[j] = overrider;
            }
            for (let j = 0; j < game.statusEffects[i].cures.length; j++) {
                let cure = game.statusEffects.find(statusEffect => statusEffect.id === game.statusEffects[i].curesStrings[j]);
                if (cure) game.statusEffects[i].cures[j] = cure;
            }
            if (game.statusEffects[i].nextStage) {
                let nextStage = game.statusEffects.find(statusEffect => statusEffect.id === game.statusEffects[i].nextStageId);
                if (nextStage) game.statusEffects[i].nextStage = nextStage;
            }
            if (game.statusEffects[i].duplicatedStatus) {
                let duplicatedStatus = game.statusEffects.find(statusEffect => statusEffect.id === game.statusEffects[i].duplicatedStatusId);
                if (duplicatedStatus) game.statusEffects[i].duplicatedStatus = duplicatedStatus;
            }
            if (game.statusEffects[i].curedCondition) {
                let curedCondition = game.statusEffects.find(statusEffect => statusEffect.id === game.statusEffects[i].curedConditionId);
                if (curedCondition) game.statusEffects[i].curedCondition = curedCondition;
            }
            if (doErrorChecking) {
                const error = exports.checkStatusEffect(game.statusEffects[i]);
                if (error instanceof Error) errors.push(error);
            }
        }
        for (let i = 0; i < game.prefabs.length; i++) {
            for (let j = 0; j < game.prefabs[i].effectsStrings.length; j++) {
                let status = game.statusEffects.find(statusEffect => statusEffect.id === game.prefabs[i].effectsStrings[j]);
                if (status) game.prefabs[i].effects[j] = status;
            }
            for (let j = 0; j < game.prefabs[i].curesStrings.length; j++) {
                let status = game.statusEffects.find(statusEffect => statusEffect.id === game.prefabs[i].curesStrings[j]);
                if (status) game.prefabs[i].cures[j] = status;
            }
        }
        for (let i = 0; i < game.events.length; i++) {
            for (let j = 0; j < game.events[i].effectsStrings.length; j++) {
                let status = game.statusEffects.find(statusEffect => statusEffect.id === game.events[i].effectsStrings[j]);
                if (status) game.events[i].effects[j] = status;
            }
            for (let j = 0; j < game.events[i].refreshesStrings.length; j++) {
                let status = game.statusEffects.find(statusEffect => statusEffect.id === game.events[i].refreshesStrings[j]);
                if (status) game.events[i].refreshes[j] = status;
            }
        }
        for (let i = 0; i < game.gestures.length; i++) {
            for (let j = 0; j < game.gestures[i].disabledStatusesStrings.length; j++) {
                let status = game.statusEffects.find(statusEffect => statusEffect.id === game.gestures[i].disabledStatusesStrings[j]);
                if (status) game.gestures[i].disabledStatuses[j] = status;
            }
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks a Status Effect for errors.
 * @param {Status} status - The status effect to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkStatusEffect (status) {
    if (status.id === "" || status.id === null || status.id === undefined)
        return new Error(`Couldn't load status effect on row ${status.row}. No status effect ID was given.`);
    if (status.duration !== null && !dayjs.isDuration(status.duration))
        return new Error(`Couldn't load status effect on row ${status.row}. An invalid duration was given.`);
    for (let i = 0; i < status.statModifiers.length; i++) {
        if (status.statModifiers[i].stat === null)
            return new Error(`Couldn't load status effect on row ${status.row}. No stat in stat modifier ${i + 1} was given.`);
        if (status.statModifiers[i].stat !== "str" && status.statModifiers[i].stat !== "int" && status.statModifiers[i].stat !== "dex" && status.statModifiers[i].stat !== "spd" && status.statModifiers[i].stat !== "sta")
            return new Error(`Couldn't load status effect on row ${status.row}. "${status.statModifiers[i].stat}" in stat modifier ${i + 1} is not a valid stat.`);
        if (status.statModifiers[i].value === null)
            return new Error(`Couldn't load status effect on row ${status.row}. No number was given in stat modifier ${i + 1}.`);
        if (isNaN(status.statModifiers[i].value))
            return new Error(`Couldn't load status effect on row ${status.row}. The value given in stat modifier ${i + 1} is not an integer.`);
    }
    if (status.overriders.length > 0) {
        for (let i = 0; i < status.overriders.length; i++)
            if (!(status.overriders[i] instanceof Status))
                return new Error(`Couldn't load status effect on row ${status.row}. "${status.overridersStrings[i]}" in "don't inflict if" is not a status effect.`);
    }
    if (status.cures.length > 0) {
        for (let i = 0; i < status.cures.length; i++)
            if (!(status.cures[i] instanceof Status))
                return new Error(`Couldn't load status effect on row ${status.row}. "${status.curesStrings[i]}" in cures is not a status effect.`);
    }
    if (status.nextStage !== null && !(status.nextStage instanceof Status))
        return new Error(`Couldn't load status effect on row ${status.row}. Next stage "${status.nextStageId}" is not a status effect.`);
    if (status.duplicatedStatus !== null && !(status.duplicatedStatus instanceof Status))
        return new Error(`Couldn't load status effect on row ${status.row}. Duplicated status "${status.duplicatedStatusId}" is not a status effect.`);
    if (status.curedCondition !== null && !(status.curedCondition instanceof Status))
        return new Error(`Couldn't load status effect on row ${status.row}. Cured condition "${status.curedConditionId}" is not a status effect.`);
    return;
}

/**
 * Loads data from the Players sheet into the game. Also loads the Inventory Items sheet.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadPlayers (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        // Clear all player status effects and movement timers first.
        for (let i = 0; i < game.players.length; i++) {
            for (let j = 0; j < game.players[i].status.length; j++) {
                if (game.players[i].status[j].hasOwnProperty("timer") && game.players[i].status[j].timer !== null)
                    game.players[i].status[j].timer.stop();
            }
            game.players[i].isMoving = false;
            clearInterval(game.players[i].moveTimer);
            game.players[i].remainingTime = 0;
            game.players[i].moveQueue.length = 0;
            game.players[i].setOffline();
        }
        // Clear all rooms of their occupants.
        for (let i = 0; i < game.rooms.length; i++)
            game.rooms[i].occupants.length = 0;

        const response = await getSheetValues(game.constants.playerSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnID = 0;
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
        const columnLocation = 11;
        const columnHidingSpot = 12;
        const columnStatus = 13;
        const columnDescription = 14;

        game.players.length = 0;
        game.players_alive.length = 0;
        game.players_dead.length = 0;
        game.playersCollection.clear();
        game.livingPlayersCollection.clear();
        game.deadPlayersCollection.clear();

        for (let i = 0; i < sheet.length; i++) {
            const stats = {
                strength: parseInt(sheet[i][columnStrength]),
                intelligence: parseInt(sheet[i][columnIntelligence]),
                dexterity: parseInt(sheet[i][columnDexterity]),
                speed: parseInt(sheet[i][columnSpeed]),
                stamina: parseInt(sheet[i][columnStamina])
            };
            let statusList = sheet[i][columnStatus] ? sheet[i][columnStatus].split(',') : [];
            for (let j = 0; j < statusList.length; j++)
                statusList[j] = statusList[j].trim();
            let member = null;
            let spectateChannel = null;
            if (sheet[i][columnName] && sheet[i][columnTitle] !== "NPC") {
                try {
                    member = sheet[i][columnID] ? game.guildContext.guild.members.resolve(sheet[i][columnID].trim()) : null;
                } catch (error) {}
                const spectateChannelName = Room.generateValidId(sheet[i][columnName]);
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
                sheet[i][columnID] ? sheet[i][columnID].trim() : "",
                member,
                sheet[i][columnName] ? sheet[i][columnName].trim() : "",
                sheet[i][columnTitle] ? sheet[i][columnTitle].trim() : "",
                sheet[i][columnPronouns] ? sheet[i][columnPronouns].trim().toLowerCase() : "",
                sheet[i][columnVoice] ? sheet[i][columnVoice].trim() : "",
                stats,
                sheet[i][columnAlive] ? sheet[i][columnAlive].trim() === "TRUE" : false,
                sheet[i][columnLocation] ? sheet[i][columnLocation].trim() : "",
                sheet[i][columnHidingSpot] ? sheet[i][columnHidingSpot].trim() : "",
                [],
                sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                new Collection(),
                spectateChannel && spectateChannel.type === ChannelType.GuildText ? spectateChannel : null,
                i + 3,
                game
            );
            const location = game.rooms.find(room => room.id === Room.generateValidId(player.locationDisplayName));
            if (location) player.location = location;
            if (player.title === "NPC") player.displayIcon = player.id;
            player.setPronouns(player.originalPronouns, player.pronounString);
            player.setPronouns(player.pronouns, player.pronounString);
            game.players.push(player);
            game.playersCollection.set(Game.generateValidEntityName(player.name), player);

            if (player.alive) {
                game.players_alive.push(player);
                game.livingPlayersCollection.set(Game.generateValidEntityName(player.name), player);

                if (player.member !== null || player.title === "NPC") {
                    // Parse statuses and inflict the player with them.
                    const currentPlayer = game.players_alive[game.players_alive.length - 1];
                    for (let j = 0; j < game.statusEffects.length; j++) {
                        for (let k = 0; k < statusList.length; k++) {
                            const statusId = statusList[k].includes('(') ? Status.generateValidId(statusList[k].substring(0, statusList[k].lastIndexOf('('))) : statusList[k];
                            if (game.statusEffects[j].id === statusId) {
                                const statusRemaining = statusList[k].includes('(') ? statusList[k].substring(statusList[k].lastIndexOf('(') + 1, statusList[k].lastIndexOf(')')) : null;
                                const timeRemaining = statusRemaining ? dayjs.duration(statusRemaining) : null;
                                currentPlayer.inflict(statusId, false, false, false, null, timeRemaining);
                            }
                        }
                    }

                    if (currentPlayer.location instanceof Room) {
                        for (let k = 0; k < game.rooms.length; k++) {
                            if (game.rooms[k].id === currentPlayer.location.id) {
                                game.rooms[k].addPlayer(currentPlayer, null, null, false);
                                break;
                            }
                        }
                    }
                }
            }
            else {
                game.players_dead.push(player);
                game.deadPlayersCollection.set(Game.generateValidEntityName(player.name), player);
            }
        }

        await loadInventories(game, false);

        let errors = [];
        for (let i = 0; i < game.players.length; i++) {
            if (doErrorChecking) {
                let error = checkPlayer(game.players[i]);
                if (error instanceof Error) errors.push(error);

                let playerInventory = game.inventoryItems.filter(item => item.player instanceof Player && item.player.name === game.players[i].name);
                for (let j = 0; j < playerInventory.length; j++) {
                    error = checkInventoryItem(playerInventory[j]);
                    if (error instanceof Error) errors.push(error);
                }
            }
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks a Player for errors.
 * @param {Player} player - The player to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkPlayer (player) {
    if (player.title !== "NPC" && (player.id === "" || player.id === null || player.id === undefined))
        return new Error(`Couldn't load player on row ${player.row}. No Discord ID was given.`);
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|webp|avif))$');
    if (player.title === "NPC" && (player.id === "" || player.id === null || player.id === undefined || !iconURLSyntax.test(player.id)))
        return new Error(`Couldn't load player on row ${player.row}. The Discord ID for an NPC must be a URL with a .jpg, .jpeg, .png, .webp, or .avif extension.`);
    if (player.title !== "NPC" && (player.member === null || player.member === undefined))
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
}

/**
 * Loads data from the Inventory Items sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadInventories (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.inventorySheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnPlayer = 0;
        const columnPrefab = 1;
        const columnIdentifier = 2;
        const columnEquipmentSlot = 3;
        const columnContainer = 4;
        const columnQuantity = 5;
        const columnUses = 6;
        const columnDescription = 7;

        game.inventoryItems.length = 0;
        for (let i = 0; i < sheet.length; i++) {
            /** @type {InventoryItem} */
            let inventoryItem;
            if (sheet[i][columnPrefab] && sheet[i][columnPrefab].trim() !== "NULL") {
                inventoryItem = new InventoryItem(
                    sheet[i][columnPlayer] ? sheet[i][columnPlayer].trim() : "",
                    sheet[i][columnPrefab] ? Game.generateValidEntityName(sheet[i][columnPrefab]) : "",
                    sheet[i][columnIdentifier] ? Game.generateValidEntityName(sheet[i][columnIdentifier]) : "",
                    sheet[i][columnEquipmentSlot] ? Game.generateValidEntityName(sheet[i][columnEquipmentSlot]) : "",
                    sheet[i][columnContainer] ? sheet[i][columnContainer].trim() : "",
                    parseInt(sheet[i][columnQuantity]),
                    parseInt(sheet[i][columnUses]),
                    sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                    i + 2,
                    game
                );
                const prefab = game.prefabs.find(prefab => prefab.id !== "" && prefab.id === inventoryItem.prefabId);
                if (prefab) inventoryItem.setPrefab(prefab);
            }
            else {
                inventoryItem = new InventoryItem(
                    sheet[i][columnPlayer] ? sheet[i][columnPlayer].trim() : "",
                    "",
                    "",
                    sheet[i][columnEquipmentSlot] ? Game.generateValidEntityName(sheet[i][columnEquipmentSlot]) : "",
                    "",
                    null,
                    null,
                    "",
                    i + 2,
                    game
                );
                inventoryItem.prefab = null;
            }
            const player = sheet[i][columnPlayer] ? game.players.find(player => player.name !== "" && player.name === sheet[i][columnPlayer].trim()) : null;
            if (player) inventoryItem.player = player;
            game.inventoryItems.push(inventoryItem);
        }
        // Create EquipmentSlots for each player.
        for (let i = 0; i < game.players.length; i++) {
            let inventory = [];
            game.players[i].carryWeight = 0;
            let equipmentItems = game.inventoryItems.filter(item => item.player instanceof Player && item.player.name === game.players[i].name && item.equipmentSlot !== "" && item.containerName === "");
            for (let j = 0; j < equipmentItems.length; j++)
                inventory.push(new EquipmentSlot(equipmentItems[j].equipmentSlot, equipmentItems[j].row, game));
            game.players[i].inventory = inventory;
        }
        let errors = [];
        for (let i = 0; i < game.inventoryItems.length; i++) {
            const prefab = game.inventoryItems[i].prefab;
            if (prefab instanceof Prefab) {
                game.inventoryItems[i].initializeInventory();
            }
            if (game.inventoryItems[i].player instanceof Player) {
                const player = game.inventoryItems[i].player;
                for (let slot = 0; slot < player.inventory.length; slot++) {
                    if (player.inventory[slot].id === game.inventoryItems[i].equipmentSlot) {
                        game.inventoryItems[i].foundEquipmentSlot = true;
                        if (game.inventoryItems[i].quantity !== 0) player.inventory[slot].items.push(game.inventoryItems[i]);
                        if (game.inventoryItems[i].containerName === "") {
                            if (prefab === null) player.inventory[slot].equippedItem = null;
                            else player.inventory[slot].equippedItem = game.inventoryItems[i];
                        }
                        else {
                            const splitContainer = game.inventoryItems[i].containerName.split('/');
                            const containerItemIdentifier = splitContainer[0] ? Game.generateValidEntityName(splitContainer[0]) : "";
                            const containerItemSlot = splitContainer[1] ? Game.generateValidEntityName(splitContainer[1]) : "";
                            game.inventoryItems[i].slot = containerItemSlot;
                            for (let j = 0; j < player.inventory[slot].items.length; j++) {
                                if (player.inventory[slot].items[j].prefab && player.inventory[slot].items[j].identifier === containerItemIdentifier) {
                                    game.inventoryItems[i].container = player.inventory[slot].items[j];
                                    for (let k = 0; k < game.inventoryItems[i].container.inventory.length; k++) {
                                        if (game.inventoryItems[i].container.inventory[k].id === containerItemSlot)
                                            game.inventoryItems[i].container.inventory[k].items.push(game.inventoryItems[i]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // Create a recursive function for properly inserting item inventories.
        /** @param {InventoryItem} item */
        let insertInventory = function (item) {
            let createdItem = new InventoryItem(
                item.player.name,
                item.prefab.id,
                item.identifier,
                item.equipmentSlot,
                item.containerName,
                item.quantity,
                item.uses,
                item.description,
                item.row,
                game
            );
            createdItem.player = item.player;
            createdItem.setPrefab(item.prefab);
            createdItem.foundEquipmentSlot = item.foundEquipmentSlot;
            if (item.container instanceof InventoryItem) createdItem.container = game.inventoryItems.find(gameItem => gameItem.row === item.container.row);
            else createdItem.container = item.container;
            createdItem.slot = item.slot;
            createdItem.weight = item.weight;

            // Initialize the item's inventory slots.
            createdItem.initializeInventory();

            for (let i = 0; i < item.inventory.length; i++) {
                for (let j = 0; j < item.inventory[i].items.length; j++) {
                    let inventoryItem = insertInventory(item.inventory[i].items[j]);
                    let foundItem = false;
                    let k = 0;
                    for (k; k < game.inventoryItems.length; k++) {
                        if (game.inventoryItems[k].row === inventoryItem.row) {
                            foundItem = true;
                            game.inventoryItems[k] = inventoryItem;
                            break;
                        }
                    }
                    if (foundItem) {
                        game.inventoryItems[k].container = createdItem;
                        if (game.inventoryItems[k].containerName !== "")
                            createdItem.insertItem(game.inventoryItems[k], game.inventoryItems[k].slot);
                        else createdItem.inventory[i].items.push(game.inventoryItems[k]);
                    }
                }
            }
            return createdItem;
        };
        // Run through inventoryItems one more time to properly insert their inventories and assign them to players.
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].prefab instanceof Prefab) {
                if (game.inventoryItems[i].quantity !== 0 && game.inventoryItems[i].containerName !== "" && game.inventoryItems[i].container === null) {
                    const splitContainer = game.inventoryItems[i].containerName.split('/');
                    const containerItemIdentifier = splitContainer[0] ? Game.generateValidEntityName(splitContainer[0]) : "";
                    const containerItemSlot = splitContainer[1] ? Game.generateValidEntityName(splitContainer[1]) : "";
                    let container = game.inventoryItems.find(item =>
                        item.player instanceof Player &&
                        item.player.name === game.inventoryItems[i].player.name &&
                        item.identifier === containerItemIdentifier &&
                        item.quantity !== 0
                    );
                    if (container) {
                        game.inventoryItems[i].container = container;
                        for (let j = 0; j < game.inventoryItems[i].container.inventory.length; j++) {
                            if (game.inventoryItems[i].container.inventory[j].id === containerItemSlot)
                                game.inventoryItems[i].container.inventory[j].items.push(game.inventoryItems[i]);
                        }
                    }
                }
                const container = game.inventoryItems[i].container;
                if (container instanceof InventoryItem) {
                    for (let slot = 0; slot < container.inventory.length; slot++) {
                        for (let j = 0; j < container.inventory[slot].items.length; j++) {
                            if (container.inventory[slot].items[j].row === game.inventoryItems[i].row) {
                                game.inventoryItems[i] = container.inventory[slot].items[j];
                                break;
                            }
                        }
                    }
                }
                else game.inventoryItems[i] = insertInventory(game.inventoryItems[i]);
            }
            if (game.inventoryItems[i].player instanceof Player) {
                const player = game.inventoryItems[i].player;
                for (let slot = 0; slot < player.inventory.length; slot++) {
                    if (player.inventory[slot].id === game.inventoryItems[i].equipmentSlot && game.inventoryItems[i].containerName === "" && game.inventoryItems[i].prefab !== null) {
                        player.inventory[slot].equippedItem = game.inventoryItems[i];
                        player.carryWeight += game.inventoryItems[i].weight * game.inventoryItems[i].quantity;
                    }
                    let foundItem = false;
                    for (let j = 0; j < player.inventory[slot].items.length; j++) {
                        if (player.inventory[slot].items[j].row === game.inventoryItems[i].row) {
                            foundItem = true;
                            player.inventory[slot].items[j] = game.inventoryItems[i];
                            break;
                        }
                    }
                    if (foundItem) break;
                }
            }

            if (doErrorChecking) {
                const error = checkInventoryItem(game.inventoryItems[i]);
                if (error instanceof Error) errors.push(error);
            }
        }

        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks an InventoryItem for errors.
 * @param {InventoryItem} item - The inventory item to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkInventoryItem (item) {
    if (item.playerName === "")
        return new Error(`Couldn't load inventory item on row ${item.row}. No player name was given.`);
    if (!(item.player instanceof Player))
        return new Error(`Couldn't load inventory item on row ${item.row}. "${item.playerName}" is not a player.`);
    if (isNaN(item.quantity))
        return new Error(`Couldn't load inventory item on row ${item.row}. No quantity was given.`);
    if (item.prefab !== null) {
        if (!(item.prefab instanceof Prefab))
            return new Error(`Couldn't load inventory item on row ${item.row}. "${item.prefabId}" is not a prefab.`);
        if (item.inventory.length > 0 && item.identifier === "")
            return new Error(`Couldn't load inventory item on row ${item.row}. This item is capable of containing items, but no container identifier was given.`);
        if (item.inventory.length > 0 && (item.quantity > 1 || isNaN(item.quantity)))
            return new Error(`Couldn't load inventory item on row ${item.row}. Items capable of containing items must have a quantity of 1.`);
        if (item.identifier !== "" && item.quantity !== 0 &&
            item.game.roomItems.filter(other => other.identifier === item.identifier && other.quantity !== 0).length
            + item.game.inventoryItems.filter(other => other.identifier === item.identifier && other.row < item.row && other.quantity !== 0).length > 0)
            return new Error(`Couldn't load inventory item on row ${item.row}. Another item or inventory item with this container identifier already exists.`);
        if (item.prefab.pluralContainingPhrase === "" && (item.quantity > 1 || isNaN(item.quantity)))
            return new Error(`Couldn't load inventory item on row ${item.row}. Quantity is higher than 1, but its prefab on row ${item.prefab.row} has no plural containing phrase.`);
        if (!item.foundEquipmentSlot)
            return new Error(`Couldn't load inventory item on row ${item.row}. Couldn't find equipment slot "${item.equipmentSlot}".`);
        //if (item.equipmentSlot !== "RIGHT HAND" && item.equipmentSlot !== "LEFT HAND" && item.containerName !== "" && (item.container === null || item.container === undefined))
        //    return new Error(`Couldn't load inventory item on row ${item.row}. Couldn't find container "${item.containerName}".`);
        if (item.container instanceof InventoryItem && item.container.inventory.length === 0)
            return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is an inventory item, but the item container's prefab on row ${item.container.prefab.row} has no inventory slots.`);
        if (item.container instanceof InventoryItem) {
            if (item.slot === "") return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is an inventory item, but a prefab inventory slot name was not given.`);
            let foundSlot = false;
            for (let i = 0; i < item.container.inventory.length; i++) {
                if (item.container.inventory[i].id === item.slot) {
                    foundSlot = true;
                    if (item.container.inventory[i].takenSpace > item.container.inventory[i].capacity)
                        return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is over capacity.`);
                }
            }
            if (!foundSlot) return new Error(`Couldn't load inventory item on row ${item.row}. The item's container prefab on row ${item.container.prefab.row} has no inventory slot "${item.slot}".`);
        }
    }
}

/**
 * Loads data from the Gestures sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadGestures (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.gestureSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnName = 0;
        const columnRequires = 1;
        const columnDontAllowIf = 2;
        const columnDescription = 3;
        const columnNarration = 4;

        game.gestures.length = 0;
        game.gesturesCollection.clear();
        for (let i = 0; i < sheet.length; i++) {
            let requires = sheet[i][columnRequires] ? sheet[i][columnRequires].split(',') : [];
            for (let j = 0; j < requires.length; j++)
                requires[j] = requires[j].trim();
            let disabledStatuses = sheet[i][columnDontAllowIf] ? sheet[i][columnDontAllowIf].split(',') : [];
            for (let j = 0; j < disabledStatuses.length; j++)
                disabledStatuses[j] = Status.generateValidId(disabledStatuses[j]);
            const gesture = new Gesture(
                sheet[i][columnName] ? Gesture.generateValidId(sheet[i][columnName]) : "",
                requires,
                disabledStatuses,
                sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                sheet[i][columnNarration] ? sheet[i][columnNarration].trim() : "",
                i + 2,
                game
            );
            game.gestures.push(gesture);
            game.gesturesCollection.set(gesture.id, gesture);
        }
        // Now go through and make the disabledStatuses actual Status objects.
        let errors = [];
        for (let i = 0; i < game.gestures.length; i++) {
            for (let j = 0; j < game.gestures[i].disabledStatusesStrings.length; j++) {
                let disabledStatus = game.statusEffects.find(statusEffect => statusEffect.id === game.gestures[i].disabledStatusesStrings[j]);
                if (disabledStatus) game.gestures[i].disabledStatuses[j] = disabledStatus;
            }
            if (doErrorChecking) {
                let error = exports.checkGesture(game.gestures[i]);
                if (error instanceof Error) errors.push(error);
            }
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks a Gesture for errors.
 * @param {Gesture} gesture - The gesture to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkGesture (gesture) {
    if (gesture.id === "" || gesture.id === null || gesture.id === undefined)
        return new Error(`Couldn't load gesture on row ${gesture.row}. No gesture ID was given.`);
    for (let i = 0; i < gesture.requires.length; i++) {
        if (gesture.requires[i] !== "Exit" && gesture.requires[i] !== "Fixture" && gesture.requires[i] !== "Object" && gesture.requires[i] !== "Room Item" && gesture.requires[i] !== "Item" && gesture.requires[i] !== "Player" && gesture.requires[i] !== "Inventory Item")
            return new Error(`Couldn't load gesture on row ${gesture.row}. "${gesture.requires[i]}" is not a valid requirement.`);
    }
    if (gesture.disabledStatuses.length > 0) {
        for (let i = 0; i < gesture.disabledStatuses.length; i++)
            if (!(gesture.disabledStatuses[i] instanceof Status))
                return new Error(`Couldn't load gesture on row ${gesture.row}. "${gesture.disabledStatusesStrings[i]}" in "don't allow if" is not a status effect.`);
    }
    if (gesture.description === "")
        return new Error(`Couldn't load gesture on row ${gesture.row}. No description was given.`);
    if (gesture.narration === "")
        return new Error(`Couldn't load gesture on row ${gesture.row}. No narration was given.`);
    return;
}

/**
 * Loads data from the Flags sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Flags always undergo error checking. So, doErrorChecking simply determines if loadFlags trims the error messages itself.
 * @returns {Promise<Game>}
 */
export function loadFlags (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.flagSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response?.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnID = 0;
        const columnValue = 1;
        const columnValueScript = 2;
        const columnCommands = 3;

        game.flags.clear();
        /** @type {Flag[]} */
        let flags = [];
        for (let i = 0; i < sheet.length; i++) {
            let commandString = sheet[i][columnCommands] ? sheet[i][columnCommands].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|png))/g, '\\').replace(/(?<=http(s?)):(?=.*?(jpg|png))/g, '@') : "";
            /** @type {FlagCommandSet[]} */
            let commandSets = [];
            /**
             * @param {string} commandString 
             * @returns {FlagCommandSet}
             */
            let getCommands = function (commandString) {
                const commands = commandString.split('/');
                let setCommands = commands[0] ? commands[0].split(/(?<!`.*?[^`])\s*?,/) : [];
                for (let j = 0; j < setCommands.length; j++)
                    setCommands[j] = setCommands[j].trim();
                let clearedCommands = commands[1] ? commands[1].split(/(?<!`.*?[^`])\s*?,/) : [];
                for (let j = 0; j < clearedCommands.length; j++)
                    clearedCommands[j] = clearedCommands[j].trim();
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
                const commands = getCommands(sheet[i][columnCommands] ? sheet[i][columnCommands] : "");
                commandSets.push({ values: [], setCommands: commands.setCommands, clearedCommands: commands.clearedCommands });
            }
            let valueString = sheet[i][columnValue] ? sheet[i][columnValue].trim() : null;
            /** @type {string|number|boolean} */
            let value;
            if (!isNaN(parseFloat(valueString))) value = parseFloat(valueString);
            else if (valueString === "TRUE") value = true;
            else if (valueString === "FALSE") value = false;
            else value = valueString;
            
            let flag = new Flag(
                sheet[i][columnID] ? Game.generateValidEntityName(sheet[i][columnID]) : "",
                value,
                sheet[i][columnValueScript] ? sheet[i][columnValueScript].trim() : "",
                sheet[i][columnCommands] ? sheet[i][columnCommands].trim() : "",
                commandSets,
                i + 2,
                game
            );
            flags.push(flag);
        }
        let errors = [];
        for (let flag of flags) {
            if (doErrorChecking) {
                const error = checkFlag(flag, flags);
                if (error instanceof Error) errors.push(error);
                else game.flags.set(flag.id, flag);
            }
        }
        for (let i = 0; i < game.puzzles.length; i++) {
            for (let j = 0; j < game.puzzles[i].requirementsStrings.length; j++) {
                const requirementString = game.puzzles[i].requirementsStrings[j];
                if (requirementString.startsWith("Flag:")) {
                    let requirement = game.flags.get(Game.generateValidEntityName(requirementString.substring(requirementString.indexOf(':') + 1)));
                    if (requirement) game.puzzles[i].requirements[j] = requirement;
                }
            }
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            reject(errors.join('\n'));
        }
        resolve(game);
    });
}

/**
 * Checks a Flag for errors.
 * @param {Flag} flag - The flag to check. 
 * @param {Flag[]} flags - An array of flags that have been loaded.
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkFlag (flag, flags) {
    if (flag.id === "" || flag.id === null || flag.id === undefined)
        return new Error(`Couldn't load flag on row ${flag.row}. No flag ID was given.`);
    if (flags.find(other => other.id === flag.id && other.row !== flag.row))
        return new Error(`Couldn't get flag on row ${flag.row}. Another flag with this ID already exists.`);
    if (flag.value !== null && typeof flag.value !== "string" && typeof flag.value !== "number" && typeof flag.value !== "boolean")
        return new Error(`Couldn't load flag on row ${flag.row}. The value is not a string, number, boolean, or null.`);
    if (flag.valueScript !== "") {
        try {
            const value = flag.evaluate(flag.valueScript);
            flag.value = value;
        } catch (err) { return new Error(`Couldn't get flag on row ${flag.row}. The value script contains an error: ${err.message}`) }
    }

    return;
}

/**
 * Trims the number of errors to fit in a single Discord message.
 * @param {Error[]} errors - An array of errors to trim.
 * @returns The trimmed array of errors.
 */
function trimErrors (errors) {
    const tooManyErrors = errors.length > 20 || errors.join('\n').length >= 1980;
    while (errors.length > 20 || errors.join('\n').length >= 1980)
        errors = errors.slice(0, errors.length - 1);
    if (tooManyErrors)
        errors.push(new Error("Too many errors."));
    return errors;
}
