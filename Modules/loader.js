import { getSheetValues } from './sheets.js';

import Game from '../Data/Game.js';
import Exit from '../Data/Exit.js';
import Room from '../Data/Room.js';
import { default as Fixture } from '../Data/Object.js';
import Prefab from '../Data/Prefab.js';
import InventorySlot from '../Data/InventorySlot.js';
import Recipe from '../Data/Recipe.js';
import Item from '../Data/Item.js';
import Puzzle from '../Data/Puzzle.js';
import Event from '../Data/Event.js';
import EquipmentSlot from '../Data/EquipmentSlot.js';
import InventoryItem from '../Data/InventoryItem.js';
import Status from '../Data/Status.js';
import Player from '../Data/Player.js';
import Gesture from '../Data/Gesture.js';
import Flag from '../Data/Flag.js';

import { ChannelType } from 'discord.js';
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
        const columnRoomName = 0;
        const columnTags = 1;
        const columnRoomIcon = 2;
        const columnExits = 3;
        const columnPosX = 4;
        const columnPosY = 5;
        const columnPosZ = 6;
        const columnUnlocked = 7;
        const columnLeadsTo = 8;
        const columnFrom = 9;
        const columnDescription = 10;

        game.rooms.length = 0;
        for (let i = 0, j = 0; i < sheet.length; i = i + j) {
            let exits = [];
            for (j = 0; i + j < sheet.length && (j === 0 || sheet[i + j][columnRoomName] === ""); j++) {
                const pos = {
                    x: parseInt(sheet[i + j][columnPosX]),
                    y: parseInt(sheet[i + j][columnPosY]),
                    z: parseInt(sheet[i + j][columnPosZ])
                };
                exits.push(
                    new Exit(
                        sheet[i + j][columnExits] ? Game.generateValidEntityName(sheet[i + j][columnExits]) : "",
                        pos,
                        sheet[i + j][columnUnlocked] ? sheet[i + j][columnUnlocked].trim() === "TRUE" : false,
                        sheet[i + j][columnLeadsTo] ? sheet[i + j][columnLeadsTo].trim() : "",
                        sheet[i + j][columnFrom] ? Game.generateValidEntityName(sheet[i + j][columnFrom]) : "",
                        sheet[i + j][columnDescription] ? sheet[i + j][columnDescription].trim() : "",
                        i + j + 2,
                        game
                    ));
            }
            const id = sheet[i][columnRoomName] ? Room.generateValidId(sheet[i][columnRoomName]) : "";
            let channel = game.guildContext.guild.channels.cache.find(channel => channel.name === id);
            if (channel === null || channel === undefined) {
                for (let j = 0; j < game.guildContext.roomCategories.length; j++) {
                    const roomCategory = game.guildContext.guild.channels.resolve(game.guildContext.roomCategories[j].trim());
                    if (roomCategory === null || roomCategory === undefined)
                        continue;
                    const roomCategorySize = game.guildContext.guild.channels.cache.filter(
                        (channel) => channel.parent && channel.parentId === roomCategory.id
                    ).size;
                    if (roomCategory.type === ChannelType.GuildCategory && roomCategorySize < 50) {
                        channel = await game.guildContext.guild.channels.create({
                            name: sheet[i][columnRoomName],
                            type: ChannelType.GuildText,
                            parent: roomCategory,
                        });
                        break;
                    }
                }
            }
            let tags = sheet[i][columnTags] ? sheet[i][columnTags].trim().split(',') : [];
            for (let j = 0; j < tags.length; j++)
                tags[j] = tags[j].trim();
            game.rooms.push(
                new Room(
                    id,
                    sheet[i][columnRoomName] ? sheet[i][columnRoomName].trim() : "",
                    channel && channel.type === ChannelType.GuildText ? channel : null,
                    tags,
                    sheet[i][columnRoomIcon] ? sheet[i][columnRoomIcon].trim() : "",
                    exits,
                    sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                    i + 2,
                    game
                )
            );
        }
        let errors = [];
        // Now go through and make the dest for each exit an actual Room object.
        // Also, add any occupants to the room.
        for (let i = 0; i < game.rooms.length; i++) {
            for (let j = 0; j < game.rooms[i].exit.length; j++) {
                let dest = game.rooms.find(room => room.id === Room.generateValidId(game.rooms[i].exit[j].destId) && room.id !== "");
                if (dest) game.rooms[i].exit[j].dest = dest;
            }
            if (doErrorChecking) {
                const error = checkRoom(game.rooms[i]);
                if (error instanceof Error) errors.push(error);
            }
            for (let j = 0; j < game.players_alive.length; j++) {
                if (game.players_alive[j].location instanceof Room && game.players_alive[j].location.id === game.rooms[i].id) {
                    game.rooms[i].addPlayer(game.players_alive[j], null, null, false);
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
 * Checks a Room for errors.
 * @param {Room} room - The room to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkRoom (room) {
    if (room.displayName === "" || room.displayName === null || room.displayName === undefined)
        return new Error(`Couldn't load room on row ${room.row}. No room name was given.`);
    if (room.id === "" || room.id === null || room.id === undefined)
        return new Error(`Couldn't load room on row ${room.row}. The room name resolved to a unique ID with an empty value.`);
    if (room.game.rooms.find(other => other.id === room.id && other.row < room.row))
        return new Error(`Couldn't load room on row ${room.row}. Another room with the same ID already exists.`);
    if (room.id.length > 100)
        return new Error(`Couldn't load room on row ${room.row}. The room ID exceeds 100 characters in length.`);
    if (room.channel === null || room.channel === undefined)
        return new Error(`Couldn't load room "${room.id}" on row ${room.row}. There is no corresponding channel on the server, and a channel to accomodate the room could not be automatically created.`);
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|gif|webp|avif))$');
    if (room.iconURL !== "" && !iconURLSyntax.test(room.iconURL))
        return new Error(`Couldn't load room on row ${room.row}. The icon URL must have a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);
    for (let i = 0; i < room.exit.length; i++) {
        let exit = room.exit[i];
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
        if (exit.destId === "" || exit.destId === null || exit.destId === undefined)
            return new Error(`Couldn't load exit on row ${exit.row}. No destination was given.`);
        if (!(exit.dest instanceof Room))
            return new Error(`Couldn't load exit on row ${exit.row}. The destination given is not a room.`);
        let matchingExit = false;
        for (let j = 0; j < exit.dest.exit.length; j++) {
            let dest = exit.dest;
            if (dest.exit[j].link === exit.name) {
                matchingExit = true;
                break;
            }
        }
        if (!matchingExit)
            return new Error(`Couldn't load exit on row ${exit.row}. Room "${exit.dest.displayName}"  does not have an exit that links back to it.`);
    }
}

/**
 * Loads data from the Objects sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadObjects (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        // Clear all recipe intervals so they don't continue after these objects are unloaded.
        for (let i = 0; i < game.objects.length; i++) {
            if (game.objects[i].recipeInterval !== null)
                game.objects[i].recipeInterval.stop();
            if (game.objects[i].process.timer !== null)
                game.objects[i].process.timer.stop();
        }

        const response = await getSheetValues(game.constants.objectSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnName = 0;
        const columnLocation = 1;
        const columnAccessibility = 2;
        const columnChildPuzzle = 3;
        const columnRecipeTag = 4;
        const columnActivatable = 5;
        const columnActivated = 6;
        const columnAutoDeactivate = 7;
        const columnHidingSpot = 8;
        const columnPreposition = 9;
        const columnDescription = 10;

        game.objects.length = 0;
        for (let i = 0; i < sheet.length; i++) {
            // Convert old spreadsheet values.
            let hidingSpotCapacity = NaN;
            if (sheet[i][columnHidingSpot] && sheet[i][columnHidingSpot].trim() === "TRUE")
                hidingSpotCapacity = 1;
            else if (sheet[i][columnHidingSpot] && sheet[i][columnHidingSpot].trim() === "FALSE" || sheet[i][columnHidingSpot].trim() === "")
                hidingSpotCapacity = 0;
            game.objects.push(
                new Fixture(
                    sheet[i][columnName] ? Game.generateValidEntityName(sheet[i][columnName]) : "",
                    sheet[i][columnLocation] ? sheet[i][columnLocation].trim() : "",
                    sheet[i][columnAccessibility]? sheet[i][columnAccessibility].trim() === "TRUE" : false,
                    sheet[i][columnChildPuzzle] ? Game.generateValidEntityName(sheet[i][columnChildPuzzle]) : "",
                    sheet[i][columnRecipeTag] ? sheet[i][columnRecipeTag].trim() : "",
                    sheet[i][columnActivatable] ? sheet[i][columnActivatable].trim() === "TRUE" : false,
                    sheet[i][columnActivated] ? sheet[i][columnActivated].trim() === "TRUE" : false,
                    sheet[i][columnAutoDeactivate] ? sheet[i][columnAutoDeactivate].trim() === "TRUE" : false,
                    isNaN(hidingSpotCapacity) ? parseInt(sheet[i][columnHidingSpot]) : hidingSpotCapacity,
                    sheet[i][columnPreposition] ? sheet[i][columnPreposition].trim() : "",
                    sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                    i + 2,
                    game
                )
            );
        }
        let errors = [];
        for (let i = 0; i < game.objects.length; i++) {
            game.objects[i].location = game.rooms.find(room => room.id !== "" && room.id === Room.generateValidId(game.objects[i].locationName));
            const childPuzzle = game.puzzles.find(puzzle =>
                puzzle.name === game.objects[i].childPuzzleName
                && puzzle.location instanceof Room
                && game.objects[i].location instanceof Room
                && puzzle.location.id === game.objects[i].location.id
            );
            if (childPuzzle) game.objects[i].childPuzzle = childPuzzle;
            if (doErrorChecking) {
                const error = checkObject(game.objects[i]);
                if (error instanceof Error) errors.push(error);
            }
        }
        for (let i = 0; i < game.items.length; i++) {
            if (game.items[i].containerName.startsWith("Object:")) {
                game.items[i].container = game.objects.find(object =>
                    object.name === Game.generateValidEntityName(game.items[i].containerName.substring("Object:".length))
                    && object.location instanceof Room
                    && game.items[i].location instanceof Room
                    && object.location.id === game.items[i].location.id
                );
            }
        }
        for (let i = 0; i < game.puzzles.length; i++) {
            if (game.puzzles[i].parentObjectName !== "") {
                game.puzzles[i].parentObject = game.objects.find(object =>
                    object.name === game.puzzles[i].parentObjectName
                    && object.location instanceof Room
                    && game.puzzles[i].location instanceof Room
                    && object.location.id === game.puzzles[i].location.id
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
 * Checks an Object for errors.
 * @param {Fixture} object - The object to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkObject (object) {
    if (object.name === "" || object.name === null || object.name === undefined)
        return new Error(`Couldn't load object on row ${object.row}. No object name was given.`);
    if (!(object.location instanceof Room))
        return new Error(`Couldn't load object on row ${object.row}. The location given is not a room.`);
    if (object.childPuzzleName !== "" && !(object.childPuzzle instanceof Puzzle))
        return new Error(`Couldn't load object on row ${object.row}. The child puzzle given is not a puzzle.`);
    if (object.childPuzzle !== null && object.childPuzzle !== undefined && (object.childPuzzle.parentObject === null || object.childPuzzle.parentObject === undefined))
        return new Error(`Couldn't load object on row ${object.row}. The child puzzle on row ${object.childPuzzle.row} has no parent object.`);
    if (object.childPuzzle !== null && object.childPuzzle !== undefined && object.childPuzzle.parentObject !== null && object.childPuzzle.parentObject !== undefined && object.childPuzzle.parentObject.name !== object.name)
        return new Error(`Couldn't load object on row ${object.row}. The child puzzle has a different parent object.`);
    if (isNaN(object.hidingSpotCapacity))
        return new Error(`Couldn't load object on row ${object.row}. The hiding spot capacity given is not a number.`);
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
        const columnEffect = 9;
        const columnCures = 10;
        const columnNextStage = 11;
        const columnEquippable = 12;
        const columnSlots = 13;
        const columnCoveredSlots = 14;
        const columnEquipCommands = 15;
        const columnInventorySlots = 16;
        const columnPreposition = 17;
        const columnDescription = 18;

        game.prefabs.length = 0;
        for (let i = 0; i < sheet.length; i++) {
            // Separate name and plural name.
            const name = sheet[i][columnName] ? sheet[i][columnName].split(',') : "";
            // Separate single containing phrase and plural containing phrase.
            const containingPhrase = sheet[i][columnContainingPhrase] ? sheet[i][columnContainingPhrase].split(',') : "";
            // Create a list of all status effect IDs this prefab will inflict when used.
            let effects = sheet[i][columnEffect] ? sheet[i][columnEffect].split(',') : [];
            for (let j = 0; j < effects.length; j++)
                effects[j] = Status.generateValidId(effects[j]);
            // Create a list of all status effect IDs this prefab will cure when used.
            let cures = sheet[i][columnCures] ? sheet[i][columnCures].split(',') : [];
            for (let j = 0; j < cures.length; j++)
                cures[j] = Status.generateValidId(cures[j]);
            // Create a list of equipment slots this prefab can be equipped to.
            let equipmentSlots = sheet[i][columnSlots] ? sheet[i][columnSlots].split(',') : [];
            for (let j = 0; j < equipmentSlots.length; j++)
                equipmentSlots[j] = Game.generateValidEntityName(equipmentSlots[j]);
            // Create a list of equipment slots this prefab covers when equipped.
            let coveredEquipmentSlots = sheet[i][columnCoveredSlots] ? sheet[i][columnCoveredSlots].split(',') : [];
            for (let j = 0; j < coveredEquipmentSlots.length; j++)
                coveredEquipmentSlots[j] = Game.generateValidEntityName(coveredEquipmentSlots[j]);
            // Create a list of commands to run when this prefab is equipped/unequipped. Temporarily replace forward slashes in URLs with back slashes.
            const commandString = sheet[i][columnEquipCommands] ? sheet[i][columnEquipCommands].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|jpeg|png|webp|avif))/g, '\\') : "";
            const commands = commandString ? commandString.split('/') : ["", ""];
            let equipCommands = commands[0] ? commands[0].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let j = 0; j < equipCommands.length; j++)
                equipCommands[j] = equipCommands[j].trim();
            let unequipCommands = commands[1] ? commands[1].split(/(?<!`.*?[^`])\s*?,/) : [];
            for (let j = 0; j < unequipCommands.length; j++)
                unequipCommands[j] = unequipCommands[j].trim();
            // Create a list of inventory slots this prefab contains.
            let inventorySlotStrings = sheet[i][columnInventorySlots] ? sheet[i][columnInventorySlots].split(',') : [];
            /** @type {InventorySlot[]} */
            let inventorySlots = [];
            for (let j = 0; j < inventorySlotStrings.length; j++) {
                let inventorySlot = inventorySlotStrings[j].split(':');
                if (inventorySlot.length === 1) inventorySlot = [inventorySlotStrings[j], ""];
                inventorySlots.push(
                    new InventorySlot(
                        Game.generateValidEntityName(inventorySlot[0]),
                        parseInt(inventorySlot[1]),
                        0,
                        0,
                        []
                    )
                );
            }

            game.prefabs.push(
                new Prefab(
                    sheet[i][columnID] ? Game.generateValidEntityName(sheet[i][columnID]) : "",
                    name[0] ? Game.generateValidEntityName(name[0]) : "",
                    name[1] ? Game.generateValidEntityName(name[1]) : "",
                    containingPhrase[0] ? containingPhrase[0].trim() : "",
                    containingPhrase[1] ? containingPhrase[1].trim() : "",
                    sheet[i][columnDiscreet] ? sheet[i][columnDiscreet].trim() === "TRUE" : false,
                    parseInt(sheet[i][columnSize]),
                    parseInt(sheet[i][columnWeight]),
                    sheet[i][columnUsable] ? sheet[i][columnUsable].trim() === "TRUE" : false,
                    sheet[i][columnUseVerb] ? sheet[i][columnUseVerb].trim() : "",
                    parseInt(sheet[i][columnUses]),
                    effects,
                    cures,
                    sheet[i][columnNextStage] ? sheet[i][columnNextStage].trim() : "",
                    sheet[i][columnEquippable] ? sheet[i][columnEquippable].trim() === "TRUE" : false,
                    equipmentSlots,
                    coveredEquipmentSlots,
                    sheet[i][columnEquipCommands] ? sheet[i][columnEquipCommands] : "",
                    equipCommands,
                    unequipCommands,
                    inventorySlots,
                    sheet[i][columnPreposition] ? sheet[i][columnPreposition].trim() : "",
                    sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                    i + 2,
                    game
                )
            );
        }
        let errors = [];
        for (let i = 0; i < game.prefabs.length; i++) {
            for (let j = 0; j < game.prefabs[i].effects.length; j++) {
                const status = game.statusEffects.find(statusEffect => statusEffect.id === game.prefabs[i].effectsStrings[j]);
                if (status) game.prefabs[i].effects[j] = status;
            }
            for (let j = 0; j < game.prefabs[i].cures.length; j++) {
                const status = game.statusEffects.find(statusEffect => statusEffect.id === game.prefabs[i].curesStrings[j]);
                if (status) game.prefabs[i].cures[j] = status;
            }
            const nextStage = game.prefabs.find(prefab => prefab.id === game.prefabs[i].nextStageId);
            if (nextStage) game.prefabs[i].nextStage = nextStage;
            if (doErrorChecking) {
                const error = checkPrefab(game.prefabs[i]);
                if (error instanceof Error) errors.push(error);
            }
        }
        for (let i = 0; i < game.puzzles.length; i++) {
            for (let j = 0; j < game.puzzles[i].requirementsStrings.length; j++) {
                const requirementString = game.puzzles[i].requirementsStrings[j];
                if (requirementString.startsWith("Item:") || requirementString.startsWith("InventoryItem:") || requirementString.startsWith("Prefab:")) {
                    let requirement = game.prefabs.find(prefab => prefab.id === Game.generateValidEntityName(requirementString.substring(requirementString.indexOf(':') + 1)));
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
 * Checks a Prefab for errors.
 * @param {Prefab} prefab - The prefab to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkPrefab (prefab) {
    if (prefab.id === "" || prefab.id === null || prefab.id === undefined)
        return new Error(`Couldn't load prefab on row ${prefab.row}. No prefab ID was given.`);
    if (prefab.game.prefabs.find(other => other.id === prefab.id && other.row < prefab.row))
        return new Error(`Couldn't load prefab on row ${prefab.row}. Another prefab with this ID already exists.`);
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
    for (let i = 0; i < prefab.inventory.length; i++) {
        if (prefab.inventory[i].id === "" || prefab.inventory[i].id === null || prefab.inventory[i].id === undefined)
            return new Error(`Couldn't load prefab on row ${prefab.row}. No name was given for inventory slot ${i + 1}.`);
        if (isNaN(prefab.inventory[i].capacity))
            return new Error(`Couldn't load prefab on row ${prefab.row}. The capacity given for inventory slot "${prefab.inventory[i].id}" is not a number.`);
    }
    if (prefab.inventory.length !== 0 && prefab.preposition === "")
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
        const columnObjectTag = 2;
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
            // If an invalid unit was given, pass NaN for both parameters. This produces an invalid duration.
            if (!"yMwdhms".includes(durationUnit)) {
                durationInt = NaN;
                durationUnit = "?";
            }
            let duration = durationString ? dayjs.duration(durationInt, durationUnit) : dayjs.duration(0);
            // Separate the products.
            let productsStrings = sheet[i][columnProducts] ? sheet[i][columnProducts].split(',') : [];
            // For each product, convert the string to a valid entity name.
            for (let j = 0; j < productsStrings.length; j++)
                productsStrings[j] = Game.generateValidEntityName(productsStrings[j]);

            game.recipes.push(
                new Recipe(
                    ingredientsStrings,
                    sheet[i][columnUncraftable] ? sheet[i][columnUncraftable].trim() === "TRUE" : false,
                    sheet[i][columnObjectTag] ? sheet[i][columnObjectTag].trim() : "",
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
    if (recipe.ingredients.length > 2 && recipe.objectTag === "")
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than 2 ingredients must require an object tag.`);
    if (recipe.products.length > 2 && recipe.objectTag === "")
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than 2 products must require an object tag.`);
    if (recipe.duration !== null && !recipe.duration.isValid())
        return new Error(`Couldn't load recipe on row ${recipe.row}. An invalid duration was given.`);
    if (recipe.objectTag === "" && recipe.duration.asMilliseconds() !== 0)
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes without an object tag cannot have a duration.`);
    for (let i = 0; i < recipe.products.length; i++) {
        if (!(recipe.products[i] instanceof Prefab))
            return new Error(`Couldn't load recipe on row ${recipe.row}. "${recipe.productsStrings[i]}" in products is not a prefab.`);
    }
    if (recipe.objectTag !== "" && recipe.uncraftable)
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with an object tag cannot be uncraftable.`)
    if (recipe.products.length > 1 && recipe.uncraftable)
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than one product cannot be uncraftable.`)
}

/**
 * Loads data from the Items sheet into the game.
 * @param {Game} game - The game to load these entities into.
 * @param {boolean} doErrorChecking - Whether or not to check for errors.
 * @returns {Promise<Game>}
 */
export function loadItems (game, doErrorChecking) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.itemSheetDataCells, game.settings.spreadsheetID);
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

        game.items.length = 0;
        for (let i = 0; i < sheet.length; i++) {
            game.items.push(
                new Item(
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
        for (let i = 0; i < game.items.length; i++) {
            const prefab = game.prefabs.find(prefab => prefab.id !== "" && prefab.id === game.items[i].prefabId);
            if (prefab) game.items[i].setPrefab(prefab);
            const location = game.rooms.find(room => room.id !== "" && room.id === Room.generateValidId(game.items[i].locationId))
            if (location) game.items[i].location = location;
            if (game.items[i].prefab instanceof Prefab) {
                game.items[i].initializeInventory();
            }
            if (game.items[i].containerName.startsWith("Object:")) {
                const container = game.objects.find(object =>
                    object.name === Game.generateValidEntityName(game.items[i].containerName.substring("Object:".length))
                    && object.location instanceof Room
                    && game.items[i].location instanceof Room
                    && object.location.id === game.items[i].location.id
                );
                if (container) game.items[i].container = container;
            }
            else if (game.items[i].containerName.startsWith("Item:")) {
                childItemIndexes.push(i);
            }
            else if (game.items[i].containerName.startsWith("Puzzle:")) {
                const container = game.puzzles.find(puzzle =>
                    puzzle.name === Game.generateValidEntityName(game.items[i].containerName.substring("Puzzle:".length))
                    && puzzle.location instanceof Room
                    && game.items[i].location instanceof Room
                    && puzzle.location.id === game.items[i].location.id
                );
                if (container) game.items[i].container = container;
            }
        }
        // Only assign child item containers once all items have been properly initialized.
        for (let index = 0; index < childItemIndexes.length; index++) {
            const i = childItemIndexes[index];
            const containerName = game.items[i].containerName.substring("Item:".length).trim().split("/");
            const identifier = containerName[0] ? Game.generateValidEntityName(containerName[0]) : "";
            const slotId = containerName[1] ? Game.generateValidEntityName(containerName[1]) : "";
            let possibleContainers = game.items.filter(item =>
                item.identifier === identifier
                && item.location instanceof Room
                && game.items[i].location instanceof Room
                && item.location.id === game.items[i].location.id);
            let container = null;
            for (let i = 0; i < possibleContainers.length; i++) {
                if (possibleContainers[i].quantity > 0) {
                    container = possibleContainers[i];
                    break;
                }
            }
            if (container === null && possibleContainers.length > 0) container = possibleContainers[0];
            if (container) {
                game.items[i].container = container;
                game.items[i].slot = slotId;
                // This is a pseudo-copy of the insertItems function without weight and takenSpace changing.
                if (game.items[i].quantity !== 0) {
                    for (let j = 0; j < container.inventory.length; j++) {
                        if (container.inventory[j].id === slotId)
                            container.inventory[j].items.push(game.items[i]);
                    }
                }
            }
        }
        // Create a recursive function for properly inserting item inventories.
        /** @param {Item} item */
        let insertInventory = function (item) {
            let createdItem = new Item(
                item.prefab.id,
                item.identifier,
                item.locationId,
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
            if (item.container instanceof Item) createdItem.container = game.items.find(gameItem => gameItem.row === item.container.row);
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
                    for (k; k < game.items.length; k++) {
                        if (game.items[k].row === inventoryItem.row) {
                            foundItem = true;
                            game.items[k] = inventoryItem;
                            break;
                        }
                    }
                    if (foundItem) {
                        game.items[k].container = createdItem;
                        if (game.items[k].containerName !== "")
                            createdItem.insertItem(game.items[k], game.items[k].slot);
                        else createdItem.inventory[i].items.push(game.items[k]);
                    }
                }
            }
            return createdItem;
        };
        // Run through items one more time to properly insert their inventories.
        for (let i = 0; i < game.items.length; i++) {
            const container = game.items[i].container;
            if (container instanceof Item) {
                for (let slot = 0; slot < container.inventory.length; slot++) {
                    for (let j = 0; j < container.inventory[slot].items.length; j++) {
                        if (container.inventory[slot].items[j].row === game.items[i].row) {
                            game.items[i] = container.inventory[slot].items[j];
                            break;
                        }
                    }
                }
            }
            else game.items[i] = insertInventory(game.items[i]);

            if (doErrorChecking) {
                const error = exports.checkItem(game.items[i], game);
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
 * Checks an Item for errors.
 * @param {Item} item - The item to check. 
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkItem (item) {
    if (!(item.prefab instanceof Prefab))
        return new Error(`Couldn't load item on row ${item.row}. "${item.prefabId}" is not a prefab.`);
    if (item.inventory.length > 0 && item.identifier === "")
        return new Error(`Couldn't load item on row ${item.row}. This item is capable of containing items, but no container identifier was given.`);
    if (item.inventory.length > 0 && (item.quantity > 1 || isNaN(item.quantity)))
        return new Error(`Couldn't load item on row ${item.row}. Items capable of containing items must have a quantity of 1.`);
    if (item.identifier !== "" && item.quantity !== 0 &&
        item.game.items.filter(other => other.identifier === item.identifier && other.row < item.row && other.quantity !== 0).length
        + item.game.inventoryItems.filter(other => other.identifier === item.identifier && other.quantity !== 0).length > 0)
        return new Error(`Couldn't load item on row ${item.row}. Another item or inventory item with this container identifier already exists.`);
    if (item.prefab.pluralContainingPhrase === "" && (item.quantity > 1 || isNaN(item.quantity)))
        return new Error(`Couldn't load item on row ${item.row}. Quantity is higher than 1, but its prefab on row ${item.prefab.row} has no plural containing phrase.`);
    if (!(item.location instanceof Room))
        return new Error(`Couldn't load item on row ${item.row}. "${item.locationId}" is not a room.`);
    if (item.containerName === "")
        return new Error(`Couldn't load item on row ${item.row}. No container was given.`);
    if (item.containerName.startsWith("Object:") && !(item.container instanceof Object))
        return new Error(`Couldn't load item on row ${item.row}. The container given is not an object.`);
    if (item.containerName.startsWith("Item:") && !(item.container instanceof Item))
        return new Error(`Couldn't load item on row ${item.row}. The container given is not an item.`);
    if (item.containerName.startsWith("Puzzle:") && !(item.container instanceof Puzzle))
        return new Error(`Couldn't load item on row ${item.row}. The container given is not a puzzle.`);
    if (item.containerName !== "" && !item.containerName.startsWith("Object:") && !item.containerName.startsWith("Item:") && !item.containerName.startsWith("Puzzle:"))
        return new Error(`Couldn't load item on row ${item.row}. The given container type is invalid.`);
    if (item.container instanceof Item && item.container.inventory.length === 0)
        return new Error(`Couldn't load item on row ${item.row}. The item's container is an item, but the item container's prefab on row ${item.container.prefab.row} has no inventory slots.`);
    if (item.container instanceof Item) {
        if (item.slot === "") return new Error(`Couldn't load item on row ${item.row}. The item's container is an item, but a prefab inventory slot ID was not given.`);
        let foundSlot = false;
        for (let i = 0; i < item.container.inventory.length; i++) {
            if (item.container.inventory[i].id === item.slot) {
                foundSlot = true;
                if (item.container.inventory[i].takenSpace > item.container.inventory[i].capacity)
                    return new Error(`Couldn't load item on row ${item.row}. The item's container is over capacity.`);
            }
        }
        if (!foundSlot) return new Error(`Couldn't load item on row ${item.row}. The item's container prefab on row ${item.container.prefab.row} has no inventory slot "${item.slot}".`);
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
        const columnParentObject = 5;
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
                    sheet[i][columnParentObject] ? Game.generateValidEntityName(sheet[i][columnParentObject]) : "",
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
            game.puzzles[i].location = game.rooms.find(room => room.id !== "" && room.id === Room.generateValidId(game.puzzles[i].locationId));
            const parentObject = game.objects.find(object =>
                object.name === game.puzzles[i].parentObjectName
                && object.location instanceof Room
                && game.puzzles[i].location instanceof Room
                && object.location.id === game.puzzles[i].location.id
            );
            if (parentObject) game.puzzles[i].parentObject = parentObject;
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
        for (let i = 0; i < game.objects.length; i++) {
            if (game.objects[i].childPuzzleName !== "") {
                game.objects[i].childPuzzle = game.puzzles.find(puzzle =>
                    puzzle.name === game.objects[i].childPuzzleName
                    && puzzle.location instanceof Room
                    && game.objects[i].location instanceof Room
                    && puzzle.location.id === game.objects[i].location.id
                );
            }
        }
        for (let i = 0; i < game.items.length; i++) {
            if (game.items[i].containerName.startsWith("Puzzle:")) {
                game.items[i].container = game.puzzles.find(puzzle =>
                    puzzle.name === Game.generateValidEntityName(game.items[i].containerName.substring("Puzzle:".length))
                    && puzzle.location instanceof Room
                    && game.items[i].location instanceof Room
                    && puzzle.location.id === game.items[i].location.id
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
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.locationId}" is not a room.`);
    if (puzzle.parentObjectName !== "" && !(puzzle.parentObject instanceof Fixture))
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The parent object given is not an object.`);
    if (puzzle.parentObject !== null && puzzle.parentObject !== undefined && (puzzle.parentObject.childPuzzle === null || puzzle.parentObject.childPuzzle === undefined))
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The parent object on row ${puzzle.parentObject.row} has no child puzzle.`);
    if (puzzle.parentObject !== null && puzzle.parentObject !== undefined && puzzle.parentObject.childPuzzle !== null && puzzle.parentObject.childPuzzle !== undefined && puzzle.parentObject.childPuzzle.name !== puzzle.name)
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The parent object has a different child puzzle.`);
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
        for (let i = 0; i < sheet.length; i++) {
            const durationString = sheet[i][columnDuration] ? sheet[i][columnDuration].toString() : "";
            let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
            let durationUnit = durationString.charAt(durationString.length - 1);
            // If an invalid unit was given, pass NaN for both parameters. This produces an invalid duration.
            if (!"yMwdhms".includes(durationUnit)) {
                durationInt = NaN;
                durationUnit = '?';
            }
            const duration = durationString ? dayjs.duration(durationInt, durationUnit) : null;
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
            game.events.push(
                new Event(
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
                )
            );
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
    if (event.duration !== null && !event.duration.isValid())
        return new Error(`Couldn't load event on row ${event.row}. An invalid duration was given.`);
    if (event.remaining !== null && !event.remaining.isValid())
        return new Error(`Couldn't load event on row ${event.row}. An invalid time remaining was given.`);
    if (!event.ongoing && event.remaining !== null)
        return new Error(`Couldn't load event on row ${event.row}. The event is not ongoing, but an amount of time remaining was given.`);
    if (event.ongoing && event.duration !== null && event.remaining === null)
        return new Error(`Couldn't load event on row ${event.row}. The event is ongoing, but no amount of time remaining was given.`);
    for (let i = 0; i < event.triggerTimes.length; i++) {
        let triggerTime = dayjs(event.triggerTimes[i], Event.formats);
        if (!triggerTime.isValid()) {
            let timeString = triggerTime.inspect().replace(/dayjs.invalid\(\/\* (.*)\*\/\)/g, '$1').trim(); // TODO: FIXME (broken by day.js migration, no .inspect() on dayjs objects)
            return new Error(`Couldn't load event on row ${event.row}. "${timeString}" is not a valid time to trigger at.`);
        }
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
        for (let i = 0; i < sheet.length; i++) {
            const durationString = sheet[i][columnDuration] ? sheet[i][columnDuration].toString() : "";
            let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
            let durationUnit = durationString.charAt(durationString.length - 1);
            // If an invalid unit was given, pass NaN for both parameters. This produces an invalid duration.
            if (!"yMwdhms".includes(durationUnit)) {
                durationInt = NaN;
                durationUnit = "?";
            }
            const duration = durationString ? dayjs.duration(durationInt, durationUnit) : null;
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
            game.statusEffects.push(
                new Status(
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
                )
            );
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
    if (status.duration !== null && !status.duration.isValid())
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
            const player =
                new Player(
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
                    [],
                    spectateChannel && spectateChannel.type === ChannelType.GuildText ? spectateChannel : null,
                    i + 3,
                    game
                );
            const location = game.rooms.find(room => room.id === Room.generateValidId(player.locationId));
            if (location) player.location = location;
            if (player.title === "NPC") player.displayIcon = player.id;
            player.setPronouns(player.originalPronouns, player.pronounString);
            player.setPronouns(player.pronouns, player.pronounString);
            game.players.push(player);

            if (player.alive) {
                game.players_alive.push(player);

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
            else
                game.players_dead.push(player);
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
        return new Error(`Couldn't load player on row ${player.row}. "${player.locationId}" is not a room.`);
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
            item.game.items.filter(other => other.identifier === item.identifier && other.quantity !== 0).length
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
        for (let i = 0; i < sheet.length; i++) {
            let requires = sheet[i][columnRequires] ? sheet[i][columnRequires].split(',') : [];
            for (let j = 0; j < requires.length; j++)
                requires[j] = requires[j].trim();
            let disabledStatuses = sheet[i][columnDontAllowIf] ? sheet[i][columnDontAllowIf].split(',') : [];
            for (let j = 0; j < disabledStatuses.length; j++)
                disabledStatuses[j] = Status.generateValidId(disabledStatuses[j]);
            game.gestures.push(
                new Gesture(
                    sheet[i][columnName] ? sheet[i][columnName].trim() : "",
                    requires,
                    disabledStatuses,
                    sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                    sheet[i][columnNarration] ? sheet[i][columnNarration].trim() : "",
                    i + 2,
                    game
                )
            );
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
        if (gesture.requires[i] !== "Exit" && gesture.requires[i] !== "Object" && gesture.requires[i] !== "Item" && gesture.requires[i] !== "Player" && gesture.requires[i] !== "Inventory Item")
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
 * @param {Error[]} errors - The currently existing errors from loading the rest of the spreadsheet.
 * @returns {Promise<Game>}
 */
export function loadFlags (game, doErrorChecking, errors) {
    return new Promise(async (resolve, reject) => {
        const response = await getSheetValues(game.constants.flagSheetDataCells, game.settings.spreadsheetID);
        const sheet = response?.values ? response?.values : [];
        // These constants are the column numbers corresponding to that data on the spreadsheet.
        const columnID = 0;
        const columnValue = 1;
        const columnValueScript = 2;
        const columnCommands = 3;

        game.flags.clear();
        if (!errors) errors = [];
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
            
            let flag = new Flag(
                sheet[i][columnID] ? sheet[i][columnID].toUpperCase().replace(/[\'"“”`]/g, '').trim() : "",
                value,
                sheet[i][columnValueScript] ? sheet[i][columnValueScript].trim() : "",
                sheet[i][columnCommands] ? sheet[i][columnCommands].trim() : "",
                commandSets,
                i + 2,
                game
            );
            
            const error = checkFlag(flag);
            if (error instanceof Error) errors.push(error);
            else game.flags.set(flag.id, flag);
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
        if (doErrorChecking && errors.length > 0) {
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
 * @returns {Error|void} An Error, if there is one. Otherwise, returns nothing.
 */
export function checkFlag (flag) {
    if (flag.id === "" || flag.id === null || flag.id === undefined)
        return new Error(`Couldn't load flag on row ${flag.row}. No flag ID was given.`);
    if (!!flag.game.flags.get(flag.id) && flag.game.flags.get(flag.id).row !== flag.row)
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
