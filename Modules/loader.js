const constants = include('Configs/constants.json');
const serverconfig = include('Configs/serverconfig.json');
const sheets = include(`${constants.modulesDir}/sheets.js`);

const Exit = include(`${constants.dataDir}/Exit.js`);
const Room = include(`${constants.dataDir}/Room.js`);
const Object = include(`${constants.dataDir}/Object.js`);
const Prefab = include(`${constants.dataDir}/Prefab.js`);
const Recipe = include(`${constants.dataDir}/Recipe.js`);
const Item = include(`${constants.dataDir}/Item.js`);
const Puzzle = include(`${constants.dataDir}/Puzzle.js`);
const Event = include(`${constants.dataDir}/Event.js`);
const EquipmentSlot = include(`${constants.dataDir}/EquipmentSlot.js`);
const InventoryItem = include(`${constants.dataDir}/InventoryItem.js`);
const Status = include(`${constants.dataDir}/Status.js`);
const Player = include(`${constants.dataDir}/Player.js`);
const Gesture = include(`${constants.dataDir}/Gesture.js`);

const CaseInsensitiveMap = include(`${constants.dataDir}/CaseInsensitiveMap.js`);
const { ChannelType } = require('../node_modules/discord-api-types/v10');
var moment = require('moment');
moment().format();

module.exports.loadRooms = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getData(constants.roomSheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
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
            game.rooms_by_name = new CaseInsensitiveMap();
            for (let i = 0, j = 0; i < sheet.length; i = i + j) {
                var exits = [];
                for (j = 0; i + j < sheet.length && (j === 0 || sheet[i + j][columnRoomName] === ""); j++) {
                    const pos = {
                        x: parseInt(sheet[i + j][columnPosX]),
                        y: parseInt(sheet[i + j][columnPosY]),
                        z: parseInt(sheet[i + j][columnPosZ])
                    };
                    exits.push(
                        new Exit(
                            sheet[i + j][columnExits] ? sheet[i + j][columnExits].trim() : "",
                            pos,
                            sheet[i + j][columnUnlocked] ? sheet[i + j][columnUnlocked].trim() === "TRUE" : false,
                            sheet[i + j][columnLeadsTo] ? sheet[i + j][columnLeadsTo].trim() : "",
                            sheet[i + j][columnFrom] ? sheet[i + j][columnFrom].trim() : "",
                            sheet[i + j][columnDescription] ? sheet[i + j][columnDescription].trim() : "",
                            i + j + 2
                        ));
                }
                const channel = game.guild.channels.cache.find(channel => channel.name === sheet[i][columnRoomName]);
                var tags = sheet[i][columnTags] ? sheet[i][columnTags].trim().split(',') : [];
                for (let j = 0; j < tags.length; j++)
                    tags[j] = tags[j].trim();
                let room = new Room(
                    sheet[i][columnRoomName] ? sheet[i][columnRoomName].trim() : "",
                    channel,
                    tags,
                    sheet[i][columnRoomIcon] ? sheet[i][columnRoomIcon].trim() : "",
                    exits,
                    sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                    i + 2
                );
                game.rooms.push(room);
                game.rooms_by_name.set(room.name, room);
            }
            var errors = [];
            // Now go through and make the dest for each exit an actual Room object.
            // Also, add any occupants to the room.
            for (let i = 0; i < game.rooms.length; i++) {
                for (let j = 0; j < game.rooms[i].exit.length; j++) {
                    let dest = game.rooms.find(room => room.name === game.rooms[i].exit[j].dest && room.name !== "");
                    if (dest) game.rooms[i].exit[j].dest = dest;
                }
                if (doErrorChecking) {
                    let error = exports.checkRoom(game.rooms[i]);
                    if (error instanceof Error) errors.push(error);
                }
                for (let j = 0; j < game.players_alive.length; j++) {
                    if (game.players_alive[j].location instanceof Room && game.players_alive[j].location.name === game.rooms[i].name) {
                        game.rooms[i].addPlayer(game, game.players_alive[j], null, null, false);
                    }
                }
            }
            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkRoom = function (room) {
    if (room.name === "" || room.name === null || room.name === undefined)
        return new Error(`Couldn't load room on row ${room.row}. No room name was given.`);
    if (room.name.toLowerCase() !== room.name)
        return new Error(`Couldn't load room on row ${room.row}. The room name must be in all lowercase letters.`);
    if (RegExp(/[^a-z0-9-_]/).test(room.name))
        return new Error(`Couldn't load room on row ${room.row}. The room name has characters which are not permitted in a Discord channel name.`);
    if (room.name.length > 100)
        return new Error(`Couldn't load room on row ${room.row}. The room name exceeds 100 characters in length.`);
    if (room.channel === null || room.channel === undefined)
        return new Error(`Couldn't load room "${room.name}". There is no corresponding channel on the server.`);
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|png|gif))$');
    if (room.iconURL !== "" && !iconURLSyntax.test(room.iconURL))
        return new Error(`Couldn't load room on row ${room.row}. The icon URL must have a .jpg, .png, or .gif extension.`);
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
        if (exit.dest === "" || exit.dest === null || exit.dest === undefined)
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
            return new Error(`Couldn't load exit on row ${exit.row}. Room "${exit.dest.name}"  does not have an exit that links back to it.`);
    }
    return;
};

module.exports.loadObjects = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        // Clear all recipe intervals so they don't continue after these objects are unloaded.
        for (let i = 0; i < game.objects.length; i++) {
            if (game.objects[i].recipeInterval !== null)
                game.objects[i].recipeInterval.stop();
            if (game.objects[i].process.timer !== null)
                game.objects[i].process.timer.stop();
        }

        sheets.getData(constants.objectSheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
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
                    new Object(
                        sheet[i][columnName] ? sheet[i][columnName].trim() : "",
                        sheet[i][columnLocation] ? sheet[i][columnLocation].trim() : "",
                        sheet[i][columnAccessibility]? sheet[i][columnAccessibility].trim() === "TRUE" : false,
                        sheet[i][columnChildPuzzle] ? sheet[i][columnChildPuzzle].trim() : "",
                        sheet[i][columnRecipeTag] ? sheet[i][columnRecipeTag].trim() : "",
                        sheet[i][columnActivatable] ? sheet[i][columnActivatable].trim() === "TRUE" : false,
                        sheet[i][columnActivated] ? sheet[i][columnActivated].trim() === "TRUE" : false,
                        sheet[i][columnAutoDeactivate] ? sheet[i][columnAutoDeactivate].trim() === "TRUE" : false,
                        isNaN(hidingSpotCapacity) ? parseInt(sheet[i][columnHidingSpot]) : hidingSpotCapacity,
                        sheet[i][columnPreposition] ? sheet[i][columnPreposition].trim() : "",
                        sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                        i + 2
                    )
                );
            }
            var errors = [];
            for (let i = 0; i < game.objects.length; i++) {
                game.objects[i].location = game.rooms.find(room => room.name === game.objects[i].location && room.name !== "");
                let childPuzzle = game.puzzles.find(puzzle => puzzle.name === game.objects[i].childPuzzleName && puzzle.location instanceof Room && game.objects[i].location instanceof Room && puzzle.location.name === game.objects[i].location.name);
                if (childPuzzle) game.objects[i].childPuzzle = childPuzzle;
                if (doErrorChecking) {
                    let error = exports.checkObject(game.objects[i]);
                    if (error instanceof Error) errors.push(error);
                }
            }
            for (let i = 0; i < game.items.length; i++) {
                if (game.items[i].containerName.startsWith("Object:"))
                    game.items[i].container = game.objects.find(object => object.name === game.items[i].containerName.substring("Object:".length).trim() && object.location instanceof Room && game.items[i].location instanceof Room && object.location.name === game.items[i].location.name);
            }
            for (let i = 0; i < game.puzzles.length; i++) {
                if (game.puzzles[i].parentObjectName !== "")
                    game.puzzles[i].parentObject = game.objects.find(object => object.name === game.puzzles[i].parentObjectName && object.location instanceof Room && game.puzzles[i].location instanceof Room && object.location.name === game.puzzles[i].location.name);
            }
            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkObject = function (object) {
    if (object.name === "" || object.name === null || object.name === undefined)
        return new Error(`Couldn't load object on row ${object.row}. No object name was given.`);
    if (!(object.location instanceof Room))
        return new Error(`Couldn't load object on row ${object.row}. The location given is not a room.`);
    if (object.childPuzzleName !== "" && !(object.childPuzzle instanceof Puzzle))
        return new Error(`Couldn't load object on row ${object.row}. The child puzzle given is not a puzzle.`);
    if (object.childPuzzle !== null && object.childPuzzle !== undefined && (object.childPuzzle.parentObject === null || object.childPuzzle.parentObject === undefined)) {
        return new Error(`Couldn't load object on row ${object.row}. The child puzzle on row ${object.childPuzzle.row} has no parent object.`);
    }
    if (object.childPuzzle !== null && object.childPuzzle !== undefined && object.childPuzzle.parentObject !== null && object.childPuzzle.parentObject !== undefined && object.childPuzzle.parentObject.name !== object.name)
        return new Error(`Couldn't load object on row ${object.row}. The child puzzle has a different parent object.`);
    if (isNaN(object.hidingSpotCapacity))
        return new Error(`Couldn't load object on row ${object.row}. The hiding spot capacity given is not a number.`);
    return;
};

module.exports.loadPrefabs = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getData(constants.prefabSheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
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
            game.prefabs_by_id = new CaseInsensitiveMap();
            for (let i = 0; i < sheet.length; i++) {
                // Separate name and plural name.
                const name = sheet[i][columnName] ? sheet[i][columnName].split(',') : "";
                // Separate single containing phrase and plural containing phrase.
                const containingPhrase = sheet[i][columnContainingPhrase] ? sheet[i][columnContainingPhrase].split(',') : "";
                // Create a list of all status effect names this prefab will inflict when used.
                var effects = sheet[i][columnEffect] ? sheet[i][columnEffect].split(',') : [];
                for (let j = 0; j < effects.length; j++)
                    effects[j] = effects[j].trim();
                // Create a list of all status effect names this prefab will cure when used.
                var cures = sheet[i][columnCures] ? sheet[i][columnCures].split(',') : [];
                for (let j = 0; j < cures.length; j++)
                    cures[j] = cures[j].trim();
                // Create a list of equipment slots this prefab can be equipped to.
                var equipmentSlots = sheet[i][columnSlots] ? sheet[i][columnSlots].split(',') : [];
                for (let j = 0; j < equipmentSlots.length; j++)
                    equipmentSlots[j] = equipmentSlots[j].trim();
                // Create a list of equipment slots this prefab covers when equipped.
                var coveredEquipmentSlots = sheet[i][columnCoveredSlots] ? sheet[i][columnCoveredSlots].split(',') : [];
                for (let j = 0; j < coveredEquipmentSlots.length; j++)
                    coveredEquipmentSlots[j] = coveredEquipmentSlots[j].trim();
                // Create a list of commands to run when this prefab is equipped/unequipped. Temporarily replace forward slashes in URLs with back slashes.
                const commandString = sheet[i][columnEquipCommands] ? sheet[i][columnEquipCommands].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|png))/g, '\\') : "";
                const commands = commandString ? commandString.split('/') : new Array("", "");
                var equipCommands = commands[0] ? commands[0].split(',') : "";
                for (let j = 0; j < equipCommands.length; j++)
                    equipCommands[j] = equipCommands[j].trim();
                var unequipCommands = commands[1] ? commands[1].split(',') : "";
                for (let j = 0; j < unequipCommands.length; j++)
                    unequipCommands[j] = unequipCommands[j].trim();
                // Create a list of inventory slots this prefab contains.
                var inventorySlots = sheet[i][columnInventorySlots] ? sheet[i][columnInventorySlots].split(',') : [];
                for (let j = 0; j < inventorySlots.length; j++) {
                    const inventorySlot = inventorySlots[j].split(':');
                    inventorySlots[j] = { name: inventorySlot[0].trim(), capacity: parseInt(inventorySlot[1]), takenSpace: 0, weight: 0, item: [] };
                }

                let prefab = new Prefab(
                    sheet[i][columnID] ? sheet[i][columnID].trim() : "",
                    name[0] ? name[0].trim() : "",
                    name[1] ? name[1].trim() : "",
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
                    equipCommands,
                    unequipCommands,
                    inventorySlots,
                    sheet[i][columnPreposition] ? sheet[i][columnPreposition].trim() : "",
                    sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                    i + 2
                );
                game.prefabs.push(prefab);
                game.prefabs_by_id.set(prefab.id, prefab);
            }
            var errors = [];
            for (let i = 0; i < game.prefabs.length; i++) {
                for (let j = 0; j < game.prefabs[i].effects.length; j++) {
                    let status = game.statusEffects.find(statusEffect => statusEffect.name === game.prefabs[i].effects[j]);
                    if (status) game.prefabs[i].effects[j] = status;
                }
                for (let j = 0; j < game.prefabs[i].cures.length; j++) {
                    let status = game.statusEffects.find(statusEffect => statusEffect.name === game.prefabs[i].cures[j]);
                    if (status) game.prefabs[i].cures[j] = status;
                }
                let nextStage = game.prefabs.find(prefab => prefab.id === game.prefabs[i].nextStageName);
                if (nextStage) game.prefabs[i].nextStage = nextStage;
                if (doErrorChecking) {
                    let error = exports.checkPrefab(game.prefabs[i], game);
                    if (error instanceof Error) errors.push(error);
                }
            }
            for (let i = 0; i < game.puzzles.length; i++) {
                for (let j = 0; j < game.puzzles[i].requirementsStrings.length; j++) {
                    if (game.puzzles[i].requirementsStrings[j].startsWith("Item:") || game.puzzles[i].requirementsStrings[j].startsWith("Prefab:")) {
                        let requirement = game.prefabs.find(prefab => prefab.id === game.puzzles[i].requirementsStrings[j].substring(game.puzzles[i].requirementsStrings[j].indexOf(':') + 1).trim());
                        if (requirement) game.puzzles[i].requirements[j] = requirement;
                    }
                }
            }
            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkPrefab = function (prefab, game) {
    if (prefab.id === "" || prefab.id === null || prefab.id === undefined)
        return new Error(`Couldn't load prefab on row ${prefab.row}. No prefab ID was given.`);
    if (game.prefabs.filter(other => other.id === prefab.id && other.row < prefab.row).length > 0)
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
            return new Error(`Couldn't load prefab on row ${prefab.row}. "${prefab.effects[i]}" in effects is not a status effect.`);
    }
    for (let i = 0; i < prefab.cures.length; i++) {
        if (!(prefab.cures[i] instanceof Status))
            return new Error(`Couldn't load prefab on row ${prefab.row}. "${prefab.cures[i]}" in cures is not a status effect.`);
    }
    if (prefab.nextStageName !== "" && !(prefab.nextStage instanceof Prefab))
        return new Error(`Couldn't load prefab on row ${prefab.row}. "${prefab.nextStageName}" in turns into is not a prefab.`);
    for (let i = 0; i < prefab.inventory.length; i++) {
        if (prefab.inventory[i].name === "" || prefab.inventory[i].name === null || prefab.inventory[i].name === undefined)
            return new Error(`Couldn't load prefab on row ${prefab.row}. No name was given for inventory slot ${i + 1}.`);
        if (isNaN(prefab.inventory[i].capacity))
            return new Error(`Couldn't load prefab on row ${prefab.row}. The capacity given for inventory slot "${prefab.inventory[i].name}" is not a number.`);
    }
    if (prefab.inventory.length !== 0 && prefab.preposition === "")
        return new Error(`Couldn't load prefab on row ${prefab.row}. ${prefab.id} has inventory slots, but no preposition was given.`);
    return;
};

module.exports.loadRecipes = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getData(constants.recipeSheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
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
                var ingredients = sheet[i][columnIngredients] ? sheet[i][columnIngredients].split(',') : [];
                ingredients.sort(function (a, b) {
                    let trimmedA = a.trim();
                    let trimmedB = b.trim();
                    if (trimmedA < trimmedB) return -1;
                    if (trimmedA > trimmedB) return 1;
                    return 0;
                });
                // For each ingredient, find its Prefab.
                for (let j = 0; j < ingredients.length; j++) {
                    ingredients[j] = ingredients[j].trim();
                    let prefab = game.prefabs.find(prefab => prefab.id === ingredients[j] && prefab.id !== "");
                    if (prefab) ingredients[j] = prefab;
                }
                // Parse the duration.
                const durationString = sheet[i][columnDuration] ? sheet[i][columnDuration].toString() : "";
                let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
                let durationUnit = durationString.charAt(durationString.length - 1);
                // If an invalid unit was given, pass NaN for both parameters. This produces an invalid duration.
                if (!"yMwdhms".includes(durationUnit)) {
                    durationInt = NaN;
                    durationUnit = NaN;
                }
                var duration = durationString ? moment.duration(durationInt, durationUnit) : moment.duration(0);
                // Separate the products.
                var products = sheet[i][columnProducts] ? sheet[i][columnProducts].split(',') : [];
                // For each product, find its Prefab.
                for (let j = 0; j < products.length; j++) {
                    products[j] = products[j].trim();
                    let prefab = game.prefabs.find(prefab => prefab.id === products[j] && prefab.id !== "");
                    if (prefab) products[j] = prefab;
                }

                game.recipes.push(
                    new Recipe(
                        ingredients,
                        sheet[i][columnUncraftable] ? sheet[i][columnUncraftable].trim() === "TRUE" : false,
                        sheet[i][columnObjectTag] ? sheet[i][columnObjectTag].trim() : "",
                        duration,
                        products,
                        sheet[i][columnInitiatedDescription] ? sheet[i][columnInitiatedDescription].trim() : "",
                        sheet[i][columnCompletedDescription] ? sheet[i][columnCompletedDescription].trim() : "",
                        sheet[i][columnUncraftedDescription] ? sheet[i][columnUncraftedDescription].trim() : "",
                        i + 2
                    )
                );
            }
            var errors = [];
            for (let i = 0; i < game.recipes.length; i++) {
                if (doErrorChecking) {
                    let error = exports.checkRecipe(game.recipes[i]);
                    if (error instanceof Error) errors.push(error);
                }
            }
            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkRecipe = function (recipe) {
    if (recipe.ingredients.length === 0)
        return new Error(`Couldn't load recipe on row ${recipe.row}. No ingredients were given.`);
    for (let i = 0; i < recipe.ingredients.length; i++) {
        if (!(recipe.ingredients[i] instanceof Prefab))
            return new Error(`Couldn't load recipe on row ${recipe.row}. "${recipe.ingredients[i]}" in ingredients is not a prefab.`);
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
            return new Error(`Couldn't load recipe on row ${recipe.row}. "${recipe.products[i]}" in products is not a prefab.`);
    }
    if (recipe.objectTag !== "" && recipe.uncraftable)
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with an object tag cannot be uncraftable.`)
    if (recipe.products.length > 1 && recipe.uncraftable)
        return new Error(`Couldn't load recipe on row ${recipe.row}. Recipes with more than one product cannot be uncraftable.`)
};

module.exports.loadItems = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getData(constants.itemSheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
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
                // Find the prefab first.
                const prefab = sheet[i][columnPrefab] ? game.prefabs.find(prefab => prefab.id === sheet[i][columnPrefab].trim() && prefab.id !== "") : null;

                game.items.push(
                    new Item(
                        prefab ? prefab : sheet[i][columnPrefab] ? sheet[i][columnPrefab].trim() : "",
                        sheet[i][columnIdentifier] ? sheet[i][columnIdentifier].trim() : "",
                        sheet[i][columnLocation] ? sheet[i][columnLocation].trim() : "",
                        sheet[i][columnAccessibility] ? sheet[i][columnAccessibility].trim() === "TRUE" : false,
                        sheet[i][columnContainer] ? sheet[i][columnContainer].trim() : "",
                        parseInt(sheet[i][columnQuantity]),
                        parseInt(sheet[i][columnUses]),
                        sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                        i + 2
                    )
                );
            }
            var errors = [];
            var childItemIndexes = [];
            for (let i = 0; i < game.items.length; i++) {
                game.items[i].location = game.rooms.find(room => room.name === game.items[i].location && room.name !== "");
                if (game.items[i].prefab instanceof Prefab) {
                    const prefab = game.items[i].prefab;
                    game.items[i].weight = game.items[i].prefab.weight;
                    for (let j = 0; j < prefab.inventory.length; j++)
                        game.items[i].inventory.push({ name: prefab.inventory[j].name, capacity: prefab.inventory[j].capacity, takenSpace: prefab.inventory[j].takenSpace, weight: prefab.inventory[j].weight, item: [] });
                }
                if (game.items[i].containerName.startsWith("Object:")) {
                    let container = game.objects.find(object => object.name === game.items[i].containerName.substring("Object:".length).trim() && object.location instanceof Room && game.items[i].location instanceof Room && object.location.name === game.items[i].location.name);
                    if (container) game.items[i].container = container;
                }
                else if (game.items[i].containerName.startsWith("Item:")) {
                    childItemIndexes.push(i);
                }
                else if (game.items[i].containerName.startsWith("Puzzle:")) {
                    let container = game.puzzles.find(puzzle => puzzle.name === game.items[i].containerName.substring("Puzzle:".length).trim() && puzzle.location instanceof Room && game.items[i].location instanceof Room && puzzle.location.name === game.items[i].location.name);
                    if (container) game.items[i].container = container;
                }
            }
            // Only assign child item containers once all items have been properly initialized.
            for (let index = 0; index < childItemIndexes.length; index++) {
                const i = childItemIndexes[index];
                const containerName = game.items[i].containerName.substring("Item:".length).trim().split("/");
                const identifier = containerName[0] ? containerName[0].trim() : "";
                const slotName = containerName[1] ? containerName[1].trim() : "";
                let possibleContainers = game.items.filter(item => item.identifier === identifier && item.location instanceof Room && game.items[i].location instanceof Room && item.location.name === game.items[i].location.name);
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
                    game.items[i].slot = slotName;
                    // This is a pseudo-copy of the insertItems function without weight and takenSpace changing.
                    if (game.items[i].quantity !== 0) {
                        for (let j = 0; j < container.inventory.length; j++) {
                            if (container.inventory[j].name === slotName)
                                container.inventory[j].item.push(game.items[i]);
                        }
                    }
                }
            }
            // Create a recursive function for properly inserting item inventories.
            let insertInventory = function (item) {
                var createdItem = new Item(
                    item.prefab,
                    item.identifier,
                    item.location,
                    item.accessible,
                    item.containerName,
                    item.quantity,
                    item.uses,
                    item.description,
                    item.row
                );
                if (item.container instanceof Item) createdItem.container = game.items.find(gameItem => gameItem.row === item.container.row);
                else createdItem.container = item.container;
                createdItem.slot = item.slot;
                createdItem.weight = item.weight;

                // Initialize the item's inventory slots.
                if (item.prefab instanceof Prefab) {
                    for (let i = 0; i < item.prefab.inventory.length; i++)
                        createdItem.inventory.push({
                            name: item.prefab.inventory[i].name,
                            capacity: item.prefab.inventory[i].capacity,
                            takenSpace: item.prefab.inventory[i].takenSpace,
                            weight: item.prefab.inventory[i].weight,
                            item: []
                        });
                }

                for (let i = 0; i < item.inventory.length; i++) {
                    for (let j = 0; j < item.inventory[i].item.length; j++) {
                        let inventoryItem = insertInventory(item.inventory[i].item[j]);
                        let foundItem = false;
                        for (var k = 0; k < game.items.length; k++) {
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
                            else createdItem.inventory[i].item.push(game.items[k]);
                        }
                    }
                }
                return createdItem;
            };
            // Run through items one more time to properly insert their inventories.
            for (let i = 0; i < game.items.length; i++) {
                if (game.items[i].container instanceof Item) {
                    let container = game.items[i].container;
                    for (let slot = 0; slot < container.inventory.length; slot++) {
                        for (let j = 0; j < container.inventory[slot].item.length; j++) {
                            if (container.inventory[slot].item[j].row === game.items[i].row) {
                                game.items[i] = container.inventory[slot].item[j];
                                break;
                            }
                        }
                    }
                }
                else game.items[i] = insertInventory(game.items[i]);

                if (doErrorChecking) {
                    let error = exports.checkItem(game.items[i], game);
                    if (error instanceof Error) errors.push(error);
                }
            }
            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    }); 
};

module.exports.checkItem = function (item, game) {
    if (!(item.prefab instanceof Prefab))
        return new Error(`Couldn't load item on row ${item.row}. The prefab given is not a prefab.`);
    if (item.inventory.length > 0 && item.identifier === "")
        return new Error(`Couldn't load item on row ${item.row}. This item is capable of containing items, but no container identifier was given.`);
    if (item.inventory.length > 0 && (item.quantity > 1 || isNaN(item.quantity)))
        return new Error(`Couldn't load item on row ${item.row}. Items capable of containing items must have a quantity of 1.`);
    if (item.identifier !== "" && item.quantity !== 0 &&
        game.items.filter(other => other.identifier === item.identifier && other.row < item.row && other.quantity !== 0).length
        + game.inventoryItems.filter(other => other.identifier === item.identifier && other.quantity !== 0).length > 0)
        return new Error(`Couldn't load item on row ${item.row}. Another item or inventory item with this container identifier already exists.`);
    if (item.prefab.pluralContainingPhrase === "" && (item.quantity > 1 || isNaN(item.quantity)))
        return new Error(`Couldn't load item on row ${item.row}. Quantity is higher than 1, but its prefab on row ${item.prefab.row} has no plural containing phrase.`);
    if (!(item.location instanceof Room))
        return new Error(`Couldn't load item on row ${item.row}. The location given is not a room.`);
    if (item.containerName.startsWith("Object:") && !(item.container instanceof Object))
        return new Error(`Couldn't load item on row ${item.row}. The container given is not an object.`);
    if (item.containerName.startsWith("Item:") && !(item.container instanceof Item))
        return new Error(`Couldn't load item on row ${item.row}. The container given is not an item.`);
    if (item.containerName.startsWith("Puzzle:") && !(item.container instanceof Puzzle))
        return new Error(`Couldn't load item on row ${item.row}. The container given is not a puzzle.`);
    if (item.containerName !== "" && !item.containerName.startsWith("Object:") && !item.containerName.startsWith("Item:") && !item.containerName.startsWith("Puzzle:"))
        return new Error(`Couldn't load item on row ${item.row}. The given container type is invalid.`);
    if (item.container instanceof Item && item.container.inventory.length === 0)
        return new Error(`Couldn't load item on row ${item.row}. The item's container is an inventory item, but the item container's prefab on row ${item.container.prefab.row} has no inventory slots.`);
    if (item.container instanceof Item) {
        if (item.slot === "") return new Error(`Couldn't load item on row ${item.row}. The item's container is an item, but a prefab inventory slot name was not given.`);
        let foundSlot = false;
        for (let i = 0; i < item.container.inventory.length; i++) {
            if (item.container.inventory[i].name === item.slot) {
                foundSlot = true;
                if (item.container.inventory[i].takenSpace > item.container.inventory[i].capacity)
                    return new Error(`Couldn't load item on row ${item.row}. The item's container is over capacity.`);
            }
        }
        if (!foundSlot) return new Error(`Couldn't load item on row ${item.row}. The item's container prefab on row ${item.container.prefab.row} has no inventory slot "${item.slot}".`);
    }
    return;
};

module.exports.loadPuzzles = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getData(constants.puzzleSheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
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
                let commandString = sheet[i][columnWhenSolved] ? sheet[i][columnWhenSolved].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|png))/g, '\\').replace(/(?<=http(s?)):(?=.*?(jpg|png))/g, '@') : "";
                let commandSets = [];
                let getCommands = function (commandString) {
                    const commands = commandString.split('/');
                    let solvedCommands = commands[0] ? commands[0].split(',') : [];
                    for (let j = 0; j < solvedCommands.length; j++)
                        solvedCommands[j] = solvedCommands[j].trim();
                    let unsolvedCommands = commands[1] ? commands[1].split(',') : [];
                    for (let j = 0; j < unsolvedCommands.length; j++)
                        unsolvedCommands[j] = unsolvedCommands[j].trim();
                    return { solvedCommands: solvedCommands, unsolvedCommands: unsolvedCommands };
                };
                const regex = new RegExp(/(\[((.*?)(?<!Item): (.*?))\],?)/);
                if (regex.test(commandString)) {
                    while (regex.test(commandString)) {
                        const commandSet = RegExp.$2;
                        let outcomes = commandSet.substring(0, commandSet.lastIndexOf(':')).split(',');
                        for (let j = 0; j < outcomes.length; j++)
                            outcomes[j] = outcomes[j].trim();
                        const commands = getCommands(commandSet.substring(commandSet.lastIndexOf(':') + 1));
                        commandSets.push({ outcomes: outcomes, solvedCommands: commands.solvedCommands, unsolvedCommands: commands.unsolvedCommands });
                        commandString = commandString.replace(RegExp.$1, "").trim();
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
                        sheet[i][columnName] ? sheet[i][columnName].trim() : "",
                        sheet[i][columnSolved] ? sheet[i][columnSolved].trim() === "TRUE" : false,
                        sheet[i][columnOutcome] ? sheet[i][columnOutcome].trim() : "",
                        sheet[i][columnRequiresMod] ? sheet[i][columnRequiresMod].trim() === "TRUE" : false,
                        sheet[i][columnLocation] ? sheet[i][columnLocation].trim() : "",
                        sheet[i][columnParentObject] ? sheet[i][columnParentObject].trim() : "",
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
                        i + 2
                    )
                );
            }
            var errors = [];
            for (let i = 0; i < game.puzzles.length; i++) {
                game.puzzles[i].location = game.rooms.find(room => room.name === game.puzzles[i].location && room.name !== "");
                let parentObject = game.objects.find(object => object.name === game.puzzles[i].parentObjectName && object.location instanceof Room && game.puzzles[i].location instanceof Room && object.location.name === game.puzzles[i].location.name);
                if (parentObject) game.puzzles[i].parentObject = parentObject;
                for (let j = 0; j < game.puzzles[i].requirementsStrings.length; j++) {
                    let requirement = null;
                    if (game.puzzles[i].requirementsStrings[j].startsWith("Item:") || game.puzzles[i].requirementsStrings[j].startsWith("Prefab:")) {
                        requirement = game.prefabs.find(prefab => prefab.id === game.puzzles[i].requirementsStrings[j].substring(game.puzzles[i].requirementsStrings[j].indexOf(':') + 1).trim());
                        if (requirement) game.puzzles[i].requirements[j] = requirement;
                    }
                    else
                        requirement = game.puzzles.find(puzzle => puzzle.name === game.puzzles[i].requirementsStrings[j] || game.puzzles[i].requirementsStrings[j] === `Puzzle: ${puzzle.name}`);
                    if (requirement) game.puzzles[i].requirements[j] = requirement;
                }
                if (doErrorChecking) {
                    let error = exports.checkPuzzle(game.puzzles[i]);
                    if (error instanceof Error) errors.push(error);
                }
            }
            for (let i = 0; i < game.objects.length; i++) {
                if (game.objects[i].childPuzzleName !== "")
                    game.objects[i].childPuzzle = game.puzzles.find(puzzle => puzzle.name === game.objects[i].childPuzzleName && puzzle.location instanceof Room && game.objects[i].location instanceof Room && puzzle.location.name === game.objects[i].location.name);
            }
            for (let i = 0; i < game.items.length; i++) {
                if (game.items[i].containerName.startsWith("Puzzle:"))
                    game.items[i].container = game.puzzles.find(puzzle => puzzle.name === game.items[i].containerName.substring("Puzzle:".length).trim() && puzzle.location instanceof Room && game.items[i].location instanceof Room && puzzle.location.name === game.items[i].location.name);
            }
            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkPuzzle = function (puzzle) {
    if (puzzle.name === "" || puzzle.name === null || puzzle.name === undefined)
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. No puzzle name was given.`);
    if (!(puzzle.location instanceof Room))
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The location given is not a room.`);
    if (puzzle.parentObjectName !== "" && !(puzzle.parentObject instanceof Object))
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
                if (!requiredItems[j].trim().startsWith("Item: "))
                    return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a container-type puzzle, but the solution "${requiredItems[j]}" does not have the "Item: " prefix.`);
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
            if (!puzzle.solutions[i].startsWith("Item: "))
                return new Error(`Couldn't load puzzle on row ${puzzle.row}. The puzzle is a media-type puzzle, but the solution "${puzzle.solutions[i]}" does not have the "Item: " prefix.`);
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
        if ((puzzle.requirementsStrings[i].startsWith("Item:") || puzzle.requirementsStrings[i].startsWith("Prefab:")) && !(puzzle.requirements[i] instanceof Prefab))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.requirementsStrings[i]}" in requires is not a prefab.`);
        else if (!puzzle.requirementsStrings[i].startsWith("Item:") && !puzzle.requirementsStrings[i].startsWith("Prefab:") && !(puzzle.requirements[i] instanceof Puzzle))
            return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.requirementsStrings[i]}" in requires is not a puzzle.`);
    }
    return;
};

module.exports.loadEvents = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        // Clear timers for all events first.
        for (let i = 0; i < game.events.length; i++) {
            if (game.events[i].timer !== null)
                game.events[i].timer.stop();
            if (game.events[i].effectsTimer !== null)
                game.events[i].effectsTimer.stop();
        }

        sheets.getData(constants.eventSheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
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
            game.events_by_name = new CaseInsensitiveMap();
            for (let i = 0; i < sheet.length; i++) {
                const durationString = sheet[i][columnDuration] ? sheet[i][columnDuration].toString() : "";
                let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
                let durationUnit = durationString.charAt(durationString.length - 1);
                // If an invalid unit was given, pass NaN for both parameters. This produces an invalid duration.
                if (!"yMwdhms".includes(durationUnit)) {
                    durationInt = NaN;
                    durationUnit = NaN;
                }
                var duration = durationString ? moment.duration(durationInt, durationUnit) : null;
                var timeRemaining = sheet[i][columnTimeRemaining] ? moment.duration(sheet[i][columnTimeRemaining]) : null;
                var triggerTimes = sheet[i][columnTriggersAt] ? sheet[i][columnTriggersAt].split(',') : [];
                for (let j = 0; j < triggerTimes.length; j++)
                    triggerTimes[j] = triggerTimes[j].trim();
                const commandString = sheet[i][columnCommands] ? sheet[i][columnCommands].replace(/(?<=http(s?):.*?)\/(?! )(?=.*?(jpg|png))/g, '\\') : "";
                const commands = commandString ? commandString.split('/') : ["", ""];
                var triggeredCommands = commands[0] ? commands[0].split(',') : [];
                for (let j = 0; j < triggeredCommands.length; j++)
                    triggeredCommands[j] = triggeredCommands[j].trim();
                var endedCommands = commands[1] ? commands[1].split(',') : [];
                for (let j = 0; j < endedCommands.length; j++)
                    endedCommands[j] = endedCommands[j].trim();
                var effects = sheet[i][columnStatusEffects] ? sheet[i][columnStatusEffects].split(',') : [];
                for (let j = 0; j < effects.length; j++)
                    effects[j] = effects[j].trim();
                var refreshes = sheet[i][columnRefreshedEffects] ? sheet[i][columnRefreshedEffects].split(',') : [];
                for (let j = 0; j < refreshes.length; j++)
                    refreshes[j] = refreshes[j].trim();

                let event = new Event(
                    sheet[i][columnName] ? sheet[i][columnName].trim() : "",
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
                    i + 2
                );
                game.events.push(event);
                game.events_by_name.set(event.name, event);
            }
            var errors = [];
            for (let i = 0; i < game.events.length; i++) {
                for (let j = 0; j < game.events[i].effects.length; j++) {
                    let status = game.statusEffects.find(statusEffect => statusEffect.name === game.events[i].effects[j]);
                    if (status) game.events[i].effects[j] = status;
                }
                for (let j = 0; j < game.events[i].refreshes.length; j++) {
                    let status = game.statusEffects.find(statusEffect => statusEffect.name === game.events[i].refreshes[j]);
                    if (status) game.events[i].refreshes[j] = status;
                }
                if (doErrorChecking) {
                    let error = exports.checkEvent(game.events[i], game);
                    if (error instanceof Error) errors.push(error);
                }
            }
            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkEvent = function (event, game) {
    if (event.name === "" || event.name === null || event.name === undefined)
        return new Error(`Couldn't load event on row ${event.row}. No event name was given.`);
    if (game.events.filter(other => other.name === event.name && other.row < event.row).length > 0)
        return new Error(`Couldn't load event on row ${event.row}. Another event with this name already exists.`);
    if (event.duration !== null && !event.duration.isValid())
        return new Error(`Couldn't load event on row ${event.row}. An invalid duration was given.`);
    if (event.remaining !== null && !event.remaining.isValid())
        return new Error(`Couldn't load event on row ${event.row}. An invalid time remaining was given.`);
    if (!event.ongoing && event.remaining !== null)
        return new Error(`Couldn't load event on row ${event.row}. The event is not ongoing, but an amount of time remaining was given.`);
    if (event.ongoing && event.duration !== null && event.remaining === null)
        return new Error(`Couldn't load event on row ${event.row}. The event is ongoing, but no amount of time remaining was given.`);
    for (let i = 0; i < event.triggerTimes.length; i++) {
        let triggerTime = moment(event.triggerTimes[i], Event.formats);
        if (!triggerTime.isValid()) {
            let timeString = triggerTime.inspect().replace(/moment.invalid\(\/\* (.*)\*\/\)/g, '$1').trim();
            return new Error(`Couldn't load event on row ${event.row}. "${timeString}" is not a valid time to trigger at.`);
        }
    }
    for (let i = 0; i < event.effects.length; i++) {
        if (!(event.effects[i] instanceof Status))
            return new Error(`Couldn't load event on row ${event.row}. "${event.effects[i]}" in inflicted status effects is not a status effect.`);
    }
    for (let i = 0; i < event.refreshes.length; i++) {
        if (!(event.refreshes[i] instanceof Status))
            return new Error(`Couldn't load event on row ${event.row}. "${event.refreshes[i]}" in refreshing status effects is not a status effect.`);
    }
    return;
};

module.exports.loadStatusEffects = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getData(constants.statusSheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
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
            game.statusEffects_by_name = new CaseInsensitiveMap();
            for (let i = 0; i < sheet.length; i++) {
                const durationString = sheet[i][columnDuration] ? sheet[i][columnDuration].toString() : "";
                let durationInt = parseInt(durationString.substring(0, durationString.length - 1));
                let durationUnit = durationString.charAt(durationString.length - 1);
                // If an invalid unit was given, pass NaN for both parameters. This produces an invalid duration.
                if (!"yMwdhms".includes(durationUnit)) {
                    durationInt = NaN;
                    durationUnit = NaN;
                }
                var duration = durationString ? moment.duration(durationInt, durationUnit) : null;
                var overriders = sheet[i][columnOverriders] ? sheet[i][columnOverriders].split(',') : [];
                for (let j = 0; j < overriders.length; j++)
                    overriders[j] = overriders[j].trim();
                var cures = sheet[i][columnCures] ? sheet[i][columnCures].split(',') : [];
                for (let j = 0; j < cures.length; j++)
                    cures[j] = cures[j].trim();
                var modifierStrings = sheet[i][columnStatModifier] ? sheet[i][columnStatModifier].split(',') : [];
                var modifiers = [];
                for (let j = 0; j < modifierStrings.length; j++) {
                    modifierStrings[j] = modifierStrings[j].toLowerCase().trim();

                    var modifiesSelf = true;
                    if (modifierStrings[j].charAt(0) === '@') {
                        modifiesSelf = false;
                        modifierStrings[j] = modifierStrings[j].substring(1);
                    }

                    var stat = null;
                    var assignValue = false;
                    var value = null;
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

                let status = new Status(
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
                    sheet[i][columnAttributes] ? sheet[i][columnAttributes].trim() : "",
                    sheet[i][columnInflictedDescription] ? sheet[i][columnInflictedDescription].trim() : "",
                    sheet[i][columnCuredDescription] ? sheet[i][columnCuredDescription].trim() : "",
                    i + 2
                );
                game.statusEffects.push(status);
                game.statusEffects_by_name.set(status.name, status);
            }
            // Now go through and make the nextStage and curedCondition an actual Status object.
            var errors = [];
            for (let i = 0; i < game.statusEffects.length; i++) {
                for (let j = 0; j < game.statusEffects[i].overriders.length; j++) {
                    let overrider = game.statusEffects.find(statusEffect => statusEffect.name === game.statusEffects[i].overriders[j]);
                    if (overrider) game.statusEffects[i].overriders[j] = overrider;
                }
                for (let j = 0; j < game.statusEffects[i].cures.length; j++) {
                    let cure = game.statusEffects.find(statusEffect => statusEffect.name === game.statusEffects[i].cures[j]);
                    if (cure) game.statusEffects[i].cures[j] = cure;
                }
                if (game.statusEffects[i].nextStage) {
                    let nextStage = game.statusEffects.find(statusEffect => statusEffect.name === game.statusEffects[i].nextStage);
                    if (nextStage) game.statusEffects[i].nextStage = nextStage;
                }
                if (game.statusEffects[i].duplicatedStatus) {
                    let duplicatedStatus = game.statusEffects.find(statusEffect => statusEffect.name === game.statusEffects[i].duplicatedStatus);
                    if (duplicatedStatus) game.statusEffects[i].duplicatedStatus = duplicatedStatus;
                }
                if (game.statusEffects[i].curedCondition) {
                    let curedCondition = game.statusEffects.find(statusEffect => statusEffect.name === game.statusEffects[i].curedCondition);
                    if (curedCondition) game.statusEffects[i].curedCondition = curedCondition;
                }
                if (doErrorChecking) {
                    let error = exports.checkStatusEffect(game.statusEffects[i]);
                    if (error instanceof Error) errors.push(error);
                }
            }
            for (let i = 0; i < game.prefabs.length; i++) {
                for (let j = 0; j < game.prefabs[i].effectsStrings.length; j++) {
                    let status = game.statusEffects.find(statusEffect => statusEffect.name === game.prefabs[i].effectsStrings[j]);
                    if (status) game.prefabs[i].effects[j] = status;
                }
                for (let j = 0; j < game.prefabs[i].curesStrings.length; j++) {
                    let status = game.statusEffects.find(statusEffect => statusEffect.name === game.prefabs[i].curesStrings[j]);
                    if (status) game.prefabs[i].cures[j] = status;
                }
            }
            for (let i = 0; i < game.events.length; i++) {
                for (let j = 0; j < game.events[i].effectsStrings.length; j++) {
                    let status = game.statusEffects.find(statusEffect => statusEffect.name === game.events[i].effectsStrings[j]);
                    if (status) game.events[i].effects[j] = status;
                }
                for (let j = 0; j < game.events[i].refreshesStrings.length; j++) {
                    let status = game.statusEffects.find(statusEffect => statusEffect.name === game.events[i].refreshesStrings[j]);
                    if (status) game.events[i].refreshes[j] = status;
                }
            }
            for (let i = 0; i < game.gestures.length; i++) {
                for (let j = 0; j < game.gestures[i].disabledStatusesStrings.length; j++) {
                    let status = game.statusEffects.find(statusEffect => statusEffect.name === game.gestures[i].disabledStatusesStrings[j]);
                    if (status) game.gestures[i].disabledStatuses[j] = status;
                }
            }
            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkStatusEffect = function (status) {
    if (status.name === "" || status.name === null || status.name === undefined)
        return new Error(`Couldn't load status effect on row ${status.row}. No status effect name was given.`);
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
                return new Error(`Couldn't load status effect on row ${status.row}. "${status.overriders[i]}" in "don't inflict if" is not a status effect.`);
    }
    if (status.cures.length > 0) {
        for (let i = 0; i < status.cures.length; i++)
            if (!(status.cures[i] instanceof Status))
                return new Error(`Couldn't load status effect on row ${status.row}. "${status.cures[i]}" in cures is not a status effect.`);
    }
    if (status.nextStage !== null && !(status.nextStage instanceof Status))
        return new Error(`Couldn't load status effect on row ${status.row}. Next stage "${status.nextStage}" is not a status effect.`);
    if (status.duplicatedStatus !== null && !(status.duplicatedStatus instanceof Status))
        return new Error(`Couldn't load status effect on row ${status.row}. Duplicated status "${status.duplicatedStatus}" is not a status effect.`);
    if (status.curedCondition !== null && !(status.curedCondition instanceof Status))
        return new Error(`Couldn't load status effect on row ${status.row}. Cured condition "${status.curedCondition}" is not a status effect.`);
    return;
};

module.exports.loadPlayers = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
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

        sheets.getData(constants.playerSheetDataCells, async function (response) {
            const sheet = response.data.values ? response.data.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnID = 0;
            const columnName = 1;
            const columnTalent = 2;
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
            game.players_by_name = new CaseInsensitiveMap();
            game.players_alive_by_name = new CaseInsensitiveMap();
            game.players_dead_by_name = new CaseInsensitiveMap();
            game.players_by_snowflake = new CaseInsensitiveMap();
            game.players_alive_by_snowflake = new CaseInsensitiveMap();
            game.players_dead_by_snowflake = new CaseInsensitiveMap();

            for (let i = 0; i < sheet.length; i++) {
                const stats = {
                    strength: parseInt(sheet[i][columnStrength]),
                    intelligence: parseInt(sheet[i][columnIntelligence]),
                    dexterity: parseInt(sheet[i][columnDexterity]),
                    speed: parseInt(sheet[i][columnSpeed]),
                    stamina: parseInt(sheet[i][columnStamina])
                };
                var statusList = sheet[i][columnStatus] ? sheet[i][columnStatus].split(',') : [];
                for (let j = 0; j < statusList.length; j++)
                    statusList[j] = statusList[j].trim();
                var member = null;
                var spectateChannel = null;
                if (sheet[i][columnName] && sheet[i][columnTalent] !== "NPC") {
                    try {
                        member = sheet[i][columnID] ? await game.guild.members.fetch(sheet[i][columnID].trim()) : null;
                    } catch (error) {}
                    spectateChannel = game.guild.channels.cache.find(channel => channel.parent && channel.parentId === serverconfig.spectateCategory && channel.name === sheet[i][columnName].toLowerCase());
                    const noSpectateChannels = game.guild.channels.cache.filter(channel => channel.parent && channel.parentId === serverconfig.spectateCategory).size;
                    if (!spectateChannel && noSpectateChannels < 50) {
                        spectateChannel = await game.guild.channels.create({
                            name: sheet[i][columnName].toLowerCase(),
                            type: ChannelType.GuildText,
                            parent: serverconfig.spectateCategory
                        });
                    }
                }
                const player =
                    new Player(
                        sheet[i][columnID] ? sheet[i][columnID].trim() : "",
                        member,
                        sheet[i][columnName] ? sheet[i][columnName].trim() : "",
                        sheet[i][columnName] ? sheet[i][columnName].trim() : "",
                        sheet[i][columnTalent] ? sheet[i][columnTalent].trim() : "",
                        sheet[i][columnPronouns] ? sheet[i][columnPronouns].trim().toLowerCase() : "",
                        sheet[i][columnVoice] ? sheet[i][columnVoice].trim() : "",
                        stats,
                        sheet[i][columnAlive] ? sheet[i][columnAlive].trim() === "TRUE" : "",
                        sheet[i][columnLocation] ? game.rooms.find(room => room.name === sheet[i][columnLocation].trim()) : null,
                        sheet[i][columnHidingSpot] ? sheet[i][columnHidingSpot].trim() : "",
                        [],
                        sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                        [],
                        spectateChannel,
                        i + 3
                    );
                if (player.talent === "NPC") player.displayIcon = player.id;
                player.setPronouns(player.originalPronouns, player.pronounString);
                player.setPronouns(player.pronouns, player.pronounString);
                game.players.push(player);
                game.players_by_name.set(player.name, player);
                game.players_by_snowflake.set(player.id, player);

                if (player.alive) {
                    game.players_alive.push(player);
                    game.players_alive_by_name.set(player.name, player);
                    game.players_alive_by_snowflake.set(player.id, player);

                    if (player.member !== null || player.talent === "NPC") {
                        // Parse statuses and inflict the player with them.
                        const currentPlayer = game.players_alive[game.players_alive.length - 1];
                        for (let j = 0; j < game.statusEffects.length; j++) {
                            for (let k = 0; k < statusList.length; k++) {
                                const statusName = statusList[k].includes('(') ? statusList[k].substring(0, statusList[k].lastIndexOf('(')).trim() : statusList[k];
                                if (game.statusEffects[j].name === statusName) {
                                    const statusRemaining = statusList[k].includes('(') ? statusList[k].substring(statusList[k].lastIndexOf('(') + 1, statusList[k].lastIndexOf(')')) : null;
                                    const timeRemaining = statusRemaining ? moment.duration(statusRemaining) : null;
                                    currentPlayer.inflict(game, statusName, false, false, false, null, timeRemaining);
                                }
                            }
                        }

                        if (currentPlayer.location instanceof Room) {
                            for (let k = 0; k < game.rooms.length; k++) {
                                if (game.rooms[k].name === currentPlayer.location.name) {
                                    game.rooms[k].addPlayer(game, currentPlayer, null, null, false);
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    game.players_dead.push(player);
                    game.players_dead_by_name.set(player.name, player);
                    game.players_dead_by_snowflake.set(player.id, player);
                }
            }

            await exports.loadInventories(game, false);

            var errors = [];
            for (let i = 0; i < game.players.length; i++) {
                if (doErrorChecking) {
                    let error = exports.checkPlayer(game.players[i]);
                    if (error instanceof Error) errors.push(error);

                    let playerInventory = game.inventoryItems.filter(item => item.player instanceof Player && item.player.name === game.players[i].name);
                    for (let j = 0; j < playerInventory.length; j++) {
                        error = exports.checkInventoryItem(playerInventory[j], game);
                        if (error instanceof Error) errors.push(error);
                    }
                }
            }
            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkPlayer = function (player) {
    if (player.talent !== "NPC" && (player.id === "" || player.id === null || player.id === undefined))
        return new Error(`Couldn't load player on row ${player.row}. No Discord ID was given.`);
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|png))$');
    if (player.talent === "NPC" && (player.id === "" || player.id === null || player.id === undefined || !iconURLSyntax.test(player.id)))
        return new Error(`Couldn't load player on row ${player.row}. The Discord ID for an NPC must be a URL with a .jpg or .png extension.`);
    if (player.talent !== "NPC" && (player.member === null || player.member === undefined))
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
    if (player.originalPronouns.plural === null || player.originalPronouns.plural === "")
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
        return new Error(`Couldn't load player on row ${player.row}. The location given is not a room.`);
    return;
};

module.exports.loadInventories = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getData(constants.inventorySheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
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
                const player = sheet[i][columnPlayer] ? game.players.find(player => player.name === sheet[i][columnPlayer].trim() && player.name !== "") : null;
                if (sheet[i][columnPrefab] && sheet[i][columnPrefab].trim() !== "NULL") {
                    // Find the prefab first.
                    const prefab = game.prefabs.find(prefab => prefab.id === sheet[i][columnPrefab].trim() && prefab.id !== "");

                    game.inventoryItems.push(
                        new InventoryItem(
                            player ? player : sheet[i][columnPlayer].trim(),
                            prefab ? prefab : sheet[i][columnPrefab].trim(),
                            sheet[i][columnIdentifier] ? sheet[i][columnIdentifier].trim() : "",
                            sheet[i][columnEquipmentSlot] ? sheet[i][columnEquipmentSlot].trim() : "",
                            sheet[i][columnContainer] ? sheet[i][columnContainer].trim() : "",
                            parseInt(sheet[i][columnQuantity]),
                            parseInt(sheet[i][columnUses]),
                            sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                            i + 2
                        )
                    );
                }
                else {
                    game.inventoryItems.push(
                        new InventoryItem(
                            player ? player : sheet[i][columnPlayer] ? sheet[i][columnPlayer].trim() : "",
                            null,
                            "",
                            sheet[i][columnEquipmentSlot] ? sheet[i][columnEquipmentSlot].trim() : "",
                            "",
                            null,
                            null,
                            "",
                            i + 2
                        )
                    );
                }
            }
            // Create EquipmentSlots for each player.
            for (let i = 0; i < game.players.length; i++) {
                let inventory = [];
                game.players[i].carryWeight = 0;
                let equipmentItems = game.inventoryItems.filter(item => item.player instanceof Player && item.player.name === game.players[i].name && item.equipmentSlot !== "" && item.containerName === "");
                for (let j = 0; j < equipmentItems.length; j++)
                    inventory.push(new EquipmentSlot(equipmentItems[j].equipmentSlot, equipmentItems[j].row));
                game.players[i].inventory = inventory;
            }
            var errors = [];
            for (let i = 0; i < game.inventoryItems.length; i++) {
                const prefab = game.inventoryItems[i].prefab;
                if (prefab instanceof Prefab) {
                    for (let j = 0; j < prefab.inventory.length; j++)
                        game.inventoryItems[i].inventory.push({
                            name: prefab.inventory[j].name,
                            capacity: prefab.inventory[j].capacity,
                            takenSpace: prefab.inventory[j].takenSpace,
                            weight: prefab.inventory[j].weight,
                            item: []
                        });
                }
                if (game.inventoryItems[i].player instanceof Player) {
                    const player = game.inventoryItems[i].player;
                    for (let slot = 0; slot < player.inventory.length; slot++) {
                        if (player.inventory[slot].name === game.inventoryItems[i].equipmentSlot) {
                            game.inventoryItems[i].foundEquipmentSlot = true;
                            if (game.inventoryItems[i].quantity !== 0) player.inventory[slot].items.push(game.inventoryItems[i]);
                            if (game.inventoryItems[i].containerName === "") {
                                if (prefab === null) player.inventory[slot].equippedItem = null;
                                else player.inventory[slot].equippedItem = game.inventoryItems[i];
                            }
                            else {
                                const splitContainer = game.inventoryItems[i].containerName.split('/');
                                const containerItemIdentifier = splitContainer[0] ? splitContainer[0].trim() : "";
                                const containerItemSlot = splitContainer[1] ? splitContainer[1].trim() : "";
                                game.inventoryItems[i].slot = containerItemSlot;
                                for (let j = 0; j < player.inventory[slot].items.length; j++) {
                                    if (player.inventory[slot].items[j].prefab && player.inventory[slot].items[j].identifier === containerItemIdentifier) {
                                        game.inventoryItems[i].container = player.inventory[slot].items[j];
                                        for (let k = 0; k < game.inventoryItems[i].container.inventory.length; k++) {
                                            if (game.inventoryItems[i].container.inventory[k].name === containerItemSlot)
                                                game.inventoryItems[i].container.inventory[k].item.push(game.inventoryItems[i]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // Create a recursive function for properly inserting item inventories.
            let insertInventory = function (item) {
                var createdItem = new InventoryItem(
                    item.player,
                    item.prefab,
                    item.identifier,
                    item.equipmentSlot,
                    item.containerName,
                    item.quantity,
                    item.uses,
                    item.description,
                    item.row
                );
                createdItem.foundEquipmentSlot = item.foundEquipmentSlot;
                if (item.container instanceof InventoryItem) createdItem.container = game.inventoryItems.find(gameItem => gameItem.row === item.container.row);
                else createdItem.container = item.container;
                createdItem.slot = item.slot;
                createdItem.weight = item.weight;

                // Initialize the item's inventory slots.
                for (let i = 0; i < item.prefab.inventory.length; i++)
                    createdItem.inventory.push({
                        name: item.prefab.inventory[i].name,
                        capacity: item.prefab.inventory[i].capacity,
                        takenSpace: item.prefab.inventory[i].takenSpace,
                        weight: item.prefab.inventory[i].weight,
                        item: []
                    });

                for (let i = 0; i < item.inventory.length; i++) {
                    for (let j = 0; j < item.inventory[i].item.length; j++) {
                        let inventoryItem = insertInventory(item.inventory[i].item[j]);
                        let foundItem = false;
                        for (var k = 0; k < game.inventoryItems.length; k++) {
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
                            else createdItem.inventory[i].item.push(game.inventoryItems[k]);
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
                        const containerItemIdentifier = splitContainer[0] ? splitContainer[0].trim() : "";
                        const containerItemSlot = splitContainer[1] ? splitContainer[1].trim() : "";
                        let container = game.inventoryItems.find(item =>
                            item.player instanceof Player &&
                            item.player.name === game.inventoryItems[i].player.name &&
                            item.identifier === containerItemIdentifier &&
                            item.quantity !== 0
                        );
                        if (container) {
                            game.inventoryItems[i].container = container;
                            for (let j = 0; j < game.inventoryItems[i].container.inventory.length; j++) {
                                if (game.inventoryItems[i].container.inventory[j].name === containerItemSlot)
                                    game.inventoryItems[i].container.inventory[j].item.push(game.inventoryItems[i]);
                            }
                        }
                    }
                    let container = game.inventoryItems[i].container;
                    if (game.inventoryItems[i].container instanceof InventoryItem) {
                        for (let slot = 0; slot < container.inventory.length; slot++) {
                            for (let j = 0; j < container.inventory[slot].item.length; j++) {
                                if (container.inventory[slot].item[j].row === game.inventoryItems[i].row) {
                                    game.inventoryItems[i] = container.inventory[slot].item[j];
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
                        if (player.inventory[slot].name === game.inventoryItems[i].equipmentSlot && game.inventoryItems[i].containerName === "" && game.inventoryItems[i].prefab !== null) {
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
                    let error = exports.checkInventoryItem(game.inventoryItems[i], game);
                    if (error instanceof Error) errors.push(error);
                }
            }

            if (errors.length > 0) {
                if (errors.length > 15) {
                    errors = errors.slice(0, 15);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkInventoryItem = function (item, game) {
    if (item.player === "")
        return new Error(`Couldn't load inventory item on row ${item.row}. No player name was given.`);
    if (!(item.player instanceof Player))
        return new Error(`Couldn't load inventory item on row ${item.row}. The player name given is not a player.`);
    if (isNaN(item.quantity))
        return new Error(`Couldn't load inventory item on row ${item.row}. No quantity was given.`);
    if (item.prefab !== null) {
        if (!(item.prefab instanceof Prefab))
            return new Error(`Couldn't load inventory item on row ${item.row}. The prefab given is not a prefab.`);
        if (item.inventory.length > 0 && item.identifier === "")
            return new Error(`Couldn't load inventory item on row ${item.row}. This item is capable of containing items, but no container identifier was given.`);
        if (item.inventory.length > 0 && (item.quantity > 1 || isNaN(item.quantity)))
            return new Error(`Couldn't load inventory item on row ${item.row}. Items capable of containing items must have a quantity of 1.`);
        if (item.identifier !== "" && item.quantity !== 0 &&
            game.items.filter(other => other.identifier === item.identifier && other.quantity !== 0).length
            + game.inventoryItems.filter(other => other.identifier === item.identifier && other.row < item.row && other.quantity !== 0).length > 0)
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
                if (item.container.inventory[i].name === item.slot) {
                    foundSlot = true;
                    if (item.container.inventory[i].takenSpace > item.container.inventory[i].capacity)
                        return new Error(`Couldn't load inventory item on row ${item.row}. The item's container is over capacity.`);
                }
            }
            if (!foundSlot) return new Error(`Couldn't load inventory item on row ${item.row}. The item's container prefab on row ${item.container.prefab.row} has no inventory slot "${item.slot}".`);
        }
    }
    return;
};

module.exports.loadGestures = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getData(constants.gestureSheetDataCells, function (response) {
            const sheet = response.data.values ? response.data.values : [];
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnRequires = 1;
            const columnDontAllowIf = 2;
            const columnDescription = 3;
            const columnNarration = 4;

            game.gestures.length = 0;
            game.gestures_by_name = new CaseInsensitiveMap();
            for (let i = 0; i < sheet.length; i++) {
                var requires = sheet[i][columnRequires] ? sheet[i][columnRequires].split(',') : [];
                for (let j = 0; j < requires.length; j++)
                    requires[j] = requires[j].trim();
                var disabledStatuses = sheet[i][columnDontAllowIf] ? sheet[i][columnDontAllowIf].split(',') : [];
                for (let j = 0; j < disabledStatuses.length; j++)
                    disabledStatuses[j] = disabledStatuses[j].trim();
                let gesture = new Gesture(
                    sheet[i][columnName] ? sheet[i][columnName].trim() : "",
                    requires,
                    disabledStatuses,
                    sheet[i][columnDescription] ? sheet[i][columnDescription].trim() : "",
                    sheet[i][columnNarration] ? sheet[i][columnNarration].trim() : "",
                    i + 2
                );
                game.gestures.push(gesture);
                game.gestures_by_name.set(gesture.name, gesture);
            }
            // Now go through and make the disabledStatuses actual Status objects.
            var errors = [];
            for (let i = 0; i < game.gestures.length; i++) {
                for (let j = 0; j < game.gestures[i].disabledStatusesStrings.length; j++) {
                    let disabledStatus = game.statusEffects.find(statusEffect => statusEffect.name === game.gestures[i].disabledStatusesStrings[j]);
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
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkGesture = function (gesture) {
    if (gesture.name === "" || gesture.name === null || gesture.name === undefined)
        return new Error(`Couldn't load gesture on row ${gesture.row}. No gesture name was given.`);
    for (let i = 0; i < gesture.requires.length; i++) {
        if (gesture.requires[i] !== "Exit" && gesture.requires[i] !== "Object" && gesture.requires[i] !== "Item" && gesture.requires[i] !== "Player" && gesture.requires[i] !== "Inventory Item")
            return new Error(`Couldn't load gesture on row ${gesture.row}. "${gesture.requires[i]}" is not a valid requirement.`);
    }
    if (gesture.disabledStatuses.length > 0) {
        for (let i = 0; i < gesture.disabledStatuses.length; i++)
            if (!(gesture.disabledStatuses[i] instanceof Status))
                return new Error(`Couldn't load gesture on row ${gesture.row}. "${gesture.disabledStatuses[i]}" in "don't allow if" is not a status effect.`);
    }
    if (gesture.description === "")
        return new Error(`Couldn't load gesture on row ${gesture.row}. No description was given.`);
    if (gesture.narration === "")
        return new Error(`Couldn't load gesture on row ${gesture.row}. No narration was given.`);
    return;
};
