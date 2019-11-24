const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

const Exit = include(`${settings.dataDir}/Exit.js`);
const Room = include(`${settings.dataDir}/Room.js`);
const Object = include(`${settings.dataDir}/Object.js`);
const Prefab = include(`${settings.dataDir}/Prefab.js`);
const Item = include(`${settings.dataDir}/Item.js`);
const Puzzle = include(`${settings.dataDir}/Puzzle.js`);
const InventoryItem = include(`${settings.dataDir}/InventoryItem.js`);
const Status = include(`${settings.dataDir}/Status.js`);
const Player = include(`${settings.dataDir}/Player.js`);
const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

module.exports.loadRooms = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getDataFormulas(settings.roomSheetAllCells, function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnRoomName = 0;
            const columnNumberExits = 1;
            const columnExits = 2;
            const columnPosX = 3;
            const columnPosY = 4;
            const columnPosZ = 5;
            const columnUnlocked = 6;
            const columnLeadsTo = 7;
            const columnFrom = 8;
            const columnDescription = 9;

            game.rooms.length = 0;
            for (let i = 1, j = 0; i < sheet.length; i = i + j) {
                var exits = [];
                for (j = 0; j < parseInt(sheet[i][columnNumberExits]); j++) {
                    const pos = {
                        x: parseInt(sheet[i + j][columnPosX]),
                        y: parseInt(sheet[i + j][columnPosY]),
                        z: parseInt(sheet[i + j][columnPosZ])
                    };
                    exits.push(
                        new Exit(
                            sheet[i + j][columnExits],
                            pos,
                            sheet[i + j][columnUnlocked] === true,
                            sheet[i + j][columnLeadsTo],
                            sheet[i + j][columnFrom],
                            sheet[i + j][columnDescription] ? sheet[i + j][columnDescription] : "",
                            i + j + 1
                        ));
                }
                const channel = game.guild.channels.find(channel => channel.name === sheet[i][columnRoomName]);
                game.rooms.push(
                    new Room(
                        sheet[i][columnRoomName],
                        channel,
                        exits,
                        sheet[i][columnDescription] ? sheet[i][columnDescription] : "",
                        i + 1
                    )
                );
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
                    if (game.players_alive[j].location.name === game.rooms[i].name) {
                        game.rooms[i].addPlayer(game, game.players_alive[j], null, null, false);
                    }
                }
            }
            if (errors.length > 0) {
                if (errors.length > 5) {
                    errors = errors.slice(0, 5);
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
    if (room.channel === null || room.channel === undefined)
        return new Error(`Couldn't load room "${room.name}". There is no corresponding channel on the server.`);
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
        sheets.getDataFormulas(settings.objectSheetAllCells, function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnLocation = 1;
            const columnAccessibility = 2;
            const columnChildPuzzle = 3;
            const columnHidingSpot = 4;
            const columnPreposition = 5;
            const columnDescription = 6;

            game.objects.length = 0;
            for (let i = 1; i < sheet.length; i++) {
                game.objects.push(
                    new Object(
                        sheet[i][columnName],
                        sheet[i][columnLocation],
                        sheet[i][columnAccessibility] === true,
                        sheet[i][columnChildPuzzle] ? sheet[i][columnChildPuzzle] : "",
                        sheet[i][columnHidingSpot] === true,
                        sheet[i][columnPreposition] ? sheet[i][columnPreposition] : "",
                        sheet[i][columnDescription] ? sheet[i][columnDescription] : "",
                        i + 1
                    )
                );
            }
            var errors = [];
            for (let i = 0; i < game.objects.length; i++) {
                game.objects[i].location = game.rooms.find(room => room.name === game.objects[i].location && room.name !== "");
                let childPuzzle = game.puzzles.find(puzzle => puzzle.name === game.objects[i].childPuzzleName && puzzle.location.name === game.objects[i].location.name);
                if (childPuzzle) game.objects[i].childPuzzle = childPuzzle;
                if (doErrorChecking) {
                    let error = exports.checkObject(game.objects[i]);
                    if (error instanceof Error) errors.push(error);
                }
            }
            for (let i = 0; i < game.items.length; i++) {
                if (game.items[i].containerName.startsWith("Object:"))
                    game.items[i].container = game.objects.find(object => object.name === game.items[i].containerName.substring("Object:".length).trim() && game.items[i].location instanceof Room && object.location.name === game.items[i].location.name);
            }
            for (let i = 0; i < game.puzzles.length; i++) {
                if (game.puzzles[i].parentObjectName !== "")
                    game.puzzles[i].parentObject = game.objects.find(object => object.name === game.puzzles[i].parentObjectName && object.location.name === game.puzzles[i].location.name);
            }
            if (errors.length > 0) {
                if (errors.length > 5) {
                    errors = errors.slice(0, 5);
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
    if (object.childPuzzle !== null && object.childPuzzle.parentObject === null)
        return new Error(`Couldn't load object on row ${object.row}. The child puzzle on row ${object.childPuzzle.row} has no parent object.`);
    if (object.childPuzzle !== null && object.childPuzzle.parentObject !== null && object.childPuzzle.parentObject.name !== object.name)
        return new Error(`Couldn't load object on row ${object.row}. The child puzzle has a different parent object.`);
    return;
};

module.exports.loadPrefabs = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getDataFormulas(settings.prefabSheetAllCells, function (response) {
            const sheet = response.data.values;
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
            const columnEquipCommands = 14;
            const columnInventorySlots = 15;
            const columnPreposition = 16;
            const columnDescription = 17;

            game.prefabs.length = 0;
            for (let i = 1; i < sheet.length; i++) {
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
                // Create a list of all prefabs this prefab will turn into when destroyed.
                var nextStages = sheet[i][columnNextStage] ? sheet[i][columnNextStage].split(',') : [];
                for (let j = 0; j < nextStages.length; j++)
                    nextStages[j] = nextStages[j].trim();
                // Create a list of equipment slots this prefab can be equipped to.
                var equipmentSlots = sheet[i][columnSlots] ? sheet[i][columnSlots].split(',') : [];
                for (let j = 0; j < equipmentSlots.length; j++)
                    equipmentSlots[j] = equipmentSlots[j].trim();
                // Create a list of commands to run when this prefab is equipped/unequipped.
                const commands = sheet[i][columnEquipCommands] ? sheet[i][columnEquipCommands].split('/') : new Array("", "");
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

                game.prefabs.push(
                    new Prefab(
                        sheet[i][columnID],
                        name[0] ? name[0].trim() : "",
                        name[1] ? name[1].trim() : "",
                        containingPhrase[0] ? containingPhrase[0].trim() : "",
                        containingPhrase[1] ? containingPhrase[1].trim() : "",
                        sheet[i][columnDiscreet] === true,
                        parseInt(sheet[i][columnSize]),
                        parseInt(sheet[i][columnWeight]),
                        sheet[i][columnUsable] === true,
                        sheet[i][columnUseVerb] ? sheet[i][columnUseVerb] : "",
                        parseInt(sheet[i][columnUses]),
                        effects,
                        cures,
                        nextStages,
                        sheet[i][columnEquippable] === true,
                        equipmentSlots,
                        equipCommands,
                        unequipCommands,
                        inventorySlots,
                        sheet[i][columnPreposition] ? sheet[i][columnPreposition] : "",
                        sheet[i][columnDescription] ? sheet[i][columnDescription] : "",
                        i + 1
                    )
                );
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
                for (let j = 0; j < game.prefabs[i].nextStage.length; j++) {
                    let prefab = game.prefabs.find(prefab => prefab.id === game.prefabs[i].nextStage[j]);
                    if (prefab) game.prefabs[i].nextStage[j] = prefab;
                }
                if (doErrorChecking) {
                    let error = exports.checkPrefab(game.prefabs[i], game);
                    if (error instanceof Error) errors.push(error);
                }
            }
            if (errors.length > 0) {
                if (errors.length > 5) {
                    errors = errors.slice(0, 5);
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
    if (game.prefabs.filter(other => other.id === prefab.id && other.row < prefab.row).length > 0)
        return new Error(`Couldn't load prefab on row ${prefab.row}. Another prefab with this ID already exists.`);
    if (prefab.name === "" || prefab.name === null || prefab.name === undefined)
        return new Error(`Couldn't load prefab on row ${prefab.row}. No prefab name was given.`);
    if (prefab.singleContainingPhrase === "")
        return new Error(`Couldn't load prefab on row ${prefab.row}. No single containing phrase was given.`);
    for (let i = 0; i < prefab.effects.length; i++) {
        if (!(prefab.effects[i] instanceof Status))
            return new Error(`Couldn't load prefab on row ${prefab.row}. "${prefab.effects[i]}" in effects is not a status effect.`);
    }
    for (let i = 0; i < prefab.cures.length; i++) {
        if (!(prefab.cures[i] instanceof Status))
            return new Error(`Couldn't load prefab on row ${prefab.row}. "${prefab.cures[i]}" in cures is not a status effect.`);
    }
    for (let i = 0; i < prefab.nextStage.length; i++) {
        if (!(prefab.nextStage[i] instanceof Prefab))
            return new Error(`Couldn't load prefab on row ${prefab.row}. "${prefab.nextStage[i]}" in turns into is not a prefab.`);
    }
    // TODO: Add error checking to new prefab attributes.
    return;
};

module.exports.loadItems = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getDataFormulas(settings.itemSheetAllCells, function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnPrefab = 0;
            const columnLocation = 1;
            const columnAccessibility = 2;
            const columnContainer = 3;
            const columnQuantity = 4;
            const columnUses = 5;
            const columnDescription = 6;

            game.items.length = 0;
            for (let i = 1; i < sheet.length; i++) {
                game.items.push(
                    new Item(
                        sheet[i][columnPrefab],
                        sheet[i][columnLocation],
                        sheet[i][columnAccessibility] === true,
                        sheet[i][columnContainer] ? sheet[i][columnContainer] : "",
                        parseInt(sheet[i][columnQuantity]),
                        parseInt(sheet[i][columnUses]),
                        sheet[i][columnDescription] ? sheet[i][columnDescription] : "",
                        i + 1
                    )
                );
            }
            var errors = [];
            for (let i = 0; i < game.items.length; i++) {
                game.items[i].location = game.rooms.find(room => room.name === game.items[i].location && room.name !== "");
                game.items[i].prefab = game.prefabs.find(prefab => prefab.id === game.items[i].prefab && prefab.id !== "");
                if (game.items[i].prefab) {
                    const prefab = game.items[i].prefab;
                    game.items[i].weight = game.items[i].prefab.weight;
                    for (let j = 0; j < prefab.inventory.length; j++)
                        game.items[i].inventory.push({ name: prefab.inventory[j].name, capacity: prefab.inventory[j].capacity, takenSpace: prefab.inventory[j].takenSpace, weight: prefab.inventory[j].weight, item: [] });
                }
                if (game.items[i].containerName.startsWith("Object:")) {
                    let container = game.objects.find(object => object.name === game.items[i].containerName.substring("Object:".length).trim() && game.items[i].location instanceof Room && object.location.name === game.items[i].location.name);
                    if (container) game.items[i].container = container;
                }
                else if (game.items[i].containerName.startsWith("Item:")) {
                    const containerName = game.items[i].containerName.substring("Item:".length).trim().split("/");
                    const prefabName = containerName[0] ? containerName[0].trim() : "";
                    const slotName = containerName[1] ? containerName[1].trim() : "";
                    let container = game.items.find(item => item.prefab.id === prefabName && item.location.name === game.items[i].location.name);
                    if (container) {
                        game.items[i].container = container;
                        game.items[i].slot = slotName;
                        container.insertItem(game.items[i], slotName);
                    }
                }
                else if (game.items[i].containerName.startsWith("Puzzle:")) {
                    let container = game.puzzles.find(puzzle => puzzle.name === game.items[i].containerName.substring("Puzzle:".length).trim() && puzzle.location.name === game.items[i].location.name);
                    if (container) game.items[i].container = container;
                }
                if (doErrorChecking) {
                    let error = exports.checkItem(game.items[i]);
                    if (error instanceof Error) errors.push(error);
                }
            }
            if (errors.length > 0) {
                if (errors.length > 5) {
                    errors = errors.slice(0, 5);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    }); 
};

module.exports.checkItem = function (item) {
    if (!(item.prefab instanceof Prefab))
        return new Error(`Couldn't load item on row ${item.row}. The prefab given is not a prefab.`);
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
        return new Error(`Couldn't load item on row ${item.row}. The item's container is an item, but the item's prefab on row ${item.prefab.row} has no inventory slots.`);
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
        sheets.getDataFormulas(settings.puzzleSheetAllCells, function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnSolved = 1;
            const columnRequiresMod = 2;
            const columnLocation = 3;
            const columnParentObject = 4;
            const columnType = 5;
            const columnAccessible = 6;
            const columnRequires = 7;
            const columnSolution = 8;
            const columnAttempts = 9;
            const columnWhenSolved = 10;
            const columnCorrectDescription = 11;
            const columnAlreadySolvedDescription = 12;
            const columnIncorrectDescription = 13;
            const columnNoMoreAttemptsDescription = 14;
            const columnRequirementsNotMetDescription = 15;

            game.puzzles.length = 0;
            for (let i = 1; i < sheet.length; i++) {
                const commands = sheet[i][columnWhenSolved] ? sheet[i][columnWhenSolved].split('/') : new Array("", "");
                var solvedCommands = commands[0] ? commands[0].split(',') : "";
                for (let j = 0; j < solvedCommands.length; j++)
                    solvedCommands[j] = solvedCommands[j].trim();
                var unsolvedCommands = commands[1] ? commands[1].split(',') : "";
                for (let j = 0; j < unsolvedCommands.length; j++)
                    unsolvedCommands[j] = unsolvedCommands[j].trim();
                game.puzzles.push(
                    new Puzzle(
                        sheet[i][columnName],
                        sheet[i][columnSolved] === true,
                        sheet[i][columnRequiresMod] === true,
                        sheet[i][columnLocation],
                        sheet[i][columnParentObject] ? sheet[i][columnParentObject] : "",
                        sheet[i][columnType],
                        sheet[i][columnAccessible] === true,
                        sheet[i][columnRequires] ? sheet[i][columnRequires] : null,
                        sheet[i][columnSolution] ? sheet[i][columnSolution].toString() : "",
                        parseInt(sheet[i][columnAttempts]),
                        solvedCommands,
                        unsolvedCommands,
                        sheet[i][columnCorrectDescription] ? sheet[i][columnCorrectDescription] : "",
                        sheet[i][columnAlreadySolvedDescription] ? sheet[i][columnAlreadySolvedDescription] : "",
                        sheet[i][columnIncorrectDescription] ? sheet[i][columnIncorrectDescription] : "",
                        sheet[i][columnNoMoreAttemptsDescription] ? sheet[i][columnNoMoreAttemptsDescription] : "",
                        sheet[i][columnRequirementsNotMetDescription] ? sheet[i][columnRequirementsNotMetDescription] : "",
                        i + 1
                    )
                );
            }
            var errors = [];
            for (let i = 0; i < game.puzzles.length; i++) {
                game.puzzles[i].location = game.rooms.find(room => room.name === game.puzzles[i].location && room.name !== "");
                let parentObject = game.objects.find(object => object.name === game.puzzles[i].parentObjectName && object.location === game.puzzles[i].location);
                if (parentObject) game.puzzles[i].parentObject = parentObject;
                let requires = game.puzzles.find(puzzle => puzzle.name === game.puzzles[i].requires);
                if (requires) game.puzzles[i].requires = requires;
                if (doErrorChecking) {
                    let error = exports.checkPuzzle(game.puzzles[i]);
                    if (error instanceof Error) errors.push(error);
                }
            }
            for (let i = 0; i < game.objects.length; i++) {
                if (game.objects[i].childPuzzleName !== "")
                    game.objects[i].childPuzzle = game.puzzles.find(puzzle => puzzle.name === game.objects[i].childPuzzleName && puzzle.location.name === game.objects[i].location.name);
            }
            for (let i = 0; i < game.items.length; i++) {
                if (game.items[i].containerName.startsWith("Puzzle:"))
                    game.items[i].container = game.puzzles.find(puzzle => puzzle.name === game.items[i].containerName.substring("Puzzle:".length).trim() && puzzle.location.name === game.items[i].location.name);
            }
            if (errors.length > 0) {
                if (errors.length > 5) {
                    errors = errors.slice(0, 5);
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
    if (puzzle.parentObject !== null && puzzle.parentObject.childPuzzle === null)
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The parent object on row ${puzzle.parentObject.row} has no child puzzle.`);
    if (puzzle.parentObject !== null && puzzle.parentObject.childPuzzle !== null && puzzle.parentObject.childPuzzle.name !== puzzle.name)
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The parent object has a different child puzzle.`);
    if (puzzle.type !== "password" && puzzle.type !== "interact" && puzzle.type !== "toggle" && puzzle.type !== "combination lock" && puzzle.type !== "key lock")
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. "${puzzle.type}" is not a valid puzzle type.`);
    if (puzzle.requires !== null && !(puzzle.requires instanceof Puzzle))
        return new Error(`Couldn't load puzzle on row ${puzzle.row}. The requirement given is not a puzzle.`);
    return;
};

module.exports.loadStatusEffects = function (game, doErrorChecking) {
    return new Promise((resolve, reject) => {
        sheets.getDataFormulas(settings.statusSheetAllCells, function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnDuration = 1;
            const columnFatal = 2;
            const columnCures = 3;
            const columnNextStage = 4;
            const columnDuplicatedStatus = 5;
            const columnCuredCondition = 6;
            const columnRollModifier = 7;
            const columnAttributes = 8;
            const columnInflictedDescription = 10;
            const columnCuredDescription = 11;

            game.statusEffects.length = 0;
            for (let i = 1; i < sheet.length; i++) {
                var cures = sheet[i][columnCures] ? sheet[i][columnCures].split(',') : [];
                for (let j = 0; j < cures.length; j++)
                    cures[j] = cures[j].trim();
                var modifiesSelf = null;
                if (sheet[i][columnRollModifier] && sheet[i][columnRollModifier].charAt(0) === 's') modifiesSelf = true;
                else if (sheet[i][columnRollModifier] && sheet[i][columnRollModifier].charAt(0) === 'o') modifiesSelf = false;
                game.statusEffects.push(
                    new Status(
                        sheet[i][columnName],
                        sheet[i][columnDuration].toLowerCase(),
                        sheet[i][columnFatal] === true,
                        cures,
                        sheet[i][columnNextStage] ? sheet[i][columnNextStage] : null,
                        sheet[i][columnDuplicatedStatus] ? sheet[i][columnDuplicatedStatus] : null,
                        sheet[i][columnCuredCondition] ? sheet[i][columnCuredCondition] : null,
                        sheet[i][columnRollModifier] ? parseInt(sheet[i][columnRollModifier].substring(1)) : "",
                        modifiesSelf,
                        sheet[i][columnAttributes] ? sheet[i][columnAttributes] : "",
                        sheet[i][columnInflictedDescription] ? sheet[i][columnInflictedDescription] : "",
                        sheet[i][columnCuredDescription] ? sheet[i][columnCuredDescription] : "",
                        i + 1
                    )
                );
            }
            // Now go through and make the nextStage and curedCondition an actual Status object.
            var errors = [];
            for (let i = 0; i < game.statusEffects.length; i++) {
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
            for (let i = 0; i < game.players.length; i++) {
                for (let j = 0; j < game.players[i].inventory.length; j++) {
                    for (let k = 0; k < game.players[i].inventory[j].effects.length; k++) {
                        let status = game.statusEffects.find(statusEffect => statusEffect.name === game.players[i].inventory[j].effectsStrings[k]);
                        if (status) game.players[i].inventory[j].effects[k] = status;
                    }
                    for (let k = 0; k < game.players[i].inventory[j].cures.length; k++) {
                        let status = game.statusEffects.find(statusEffect => statusEffect.name === game.players[i].inventory[j].curesStrings[k]);
                        if (status) game.players[i].inventory[j].cures[k] = status;
                    }
                }
            }
            if (errors.length > 0) {
                if (errors.length > 5) {
                    errors = errors.slice(0, 5);
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
    const timeInt = status.duration.substring(0, status.duration.length - 1);
    if (status.duration !== "" && (isNaN(timeInt) || !status.duration.endsWith('m') && !status.duration.endsWith('h')))
        return new Error(`Couldn't load status effect on row ${status.row}. Duration format is incorrect. Must be a number followed by 'm' or 'h'.`);
    if (status.rollModifier === "")
        return new Error(`Couldn't load status effect on row ${status.row}. No roll modifier was given.`);
    if (status.modifiesSelf === null)
        return new Error(`Couldn't load status effect on row ${status.row}. Whether the roll modifier affects self (s) or other (o) was not specified.`);
    if (isNaN(status.rollModifier))
        return new Error(`Couldn't load status effect on row ${status.row}. The roll modifier given is not an integer.`);
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
                clearInterval(game.players[i].status[j].timer);
            }
            game.players[i].isMoving = false;
            clearInterval(game.players[i].moveTimer);
            game.players[i].remainingTime = 0;
        }
        // Clear all rooms of their occupants.
        for (let i = 0; i < game.rooms.length; i++)
            game.rooms[i].occupants.length = 0;

        sheets.getDataFormulas(settings.playerSheetAllCells, function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnID = 0;
            const columnName = 1;
            const columnTalent = 2;
            const columnStrength = 3;
            const columnIntelligence = 4;
            const columnDexterity = 5;
            const columnSpeed = 6;
            const columnStamina = 7;
            const columnAlive = 8;
            const columnLocation = 9;
            const columnHidingSpot = 10;
            const columnStatus = 11;
            const columnItemName = 12;
            const columnItemPluralName = 13;
            const columnItemUses = 14;
            const columnItemDiscreet = 15;
            const columnItemEffect = 16;
            const columnItemCures = 17;
            const columnItemContainingPhrase = 18;
            const columnItemDescription = 19;

            game.players.length = 0;
            game.players_alive.length = 0;
            game.players_dead.length = 0;

            for (let i = 2, j = 0; i < sheet.length; i = i + j) {
                var inventory = new Array(3);
                for (j = 0; j < inventory.length; j++) {
                    if (sheet[i + j][columnItemName] !== "NULL") {
                        const containingPhrase = sheet[i + j][columnItemContainingPhrase] ? sheet[i + j][columnItemContainingPhrase].split(',') : "";
                        var effects = sheet[i + j][columnItemEffect] ? sheet[i + j][columnItemEffect].split(',') : [];
                        for (let k = 0; k < effects.length; k++)
                            effects[k] = effects[k].trim();
                        var cures = sheet[i + j][columnItemCures] ? sheet[i + j][columnItemCures].split(',') : [];
                        for (let k = 0; k < cures.length; k++)
                            cures[k] = cures[k].trim();
                        inventory[j] =
                            new InventoryItem(
                                sheet[i + j][columnItemName],
                                sheet[i + j][columnItemPluralName] ? sheet[i + j][columnItemPluralName] : "",
                                parseInt(sheet[i + j][columnItemUses]),
                                sheet[i + j][columnItemDiscreet] === true,
                                effects,
                                cures,
                                containingPhrase[0] ? containingPhrase[0].trim() : "",
                                containingPhrase[1] ? containingPhrase[1].trim() : "",
                                sheet[i + j][columnItemDescription] ? sheet[i + j][columnItemDescription] : "",
                                i + j + 1
                            );
                    }
                    else
                        inventory[j] =
                            new InventoryItem(
                                null,
                                null,
                                null,
                                null,
                                [],
                                [],
                                null,
                                null,
                                "",
                                i + j + 1
                            );
                }
                const stats = {
                    strength: parseInt(sheet[i][columnStrength]),
                    intelligence: parseInt(sheet[i][columnIntelligence]),
                    dexterity: parseInt(sheet[i][columnDexterity]),
                    speed: parseInt(sheet[i][columnSpeed]),
                    stamina: parseInt(sheet[i][columnStamina])
                };
                const player =
                    new Player(
                        sheet[i][columnID],
                        game.guild.members.find(member => member.id === sheet[i][columnID]),
                        sheet[i][columnName],
                        sheet[i][columnName],
                        sheet[i][columnTalent],
                        stats,
                        sheet[i][columnAlive] === true,
                        game.rooms.find(room => room.name === sheet[i][columnLocation]),
                        sheet[i][columnHidingSpot],
                        new Array(),
                        inventory,
                        i + 1
                    );
                game.players.push(player);

                if (player.alive) {
                    game.players_alive.push(player);

                    // Parse statuses and inflict the player with them.
                    const currentPlayer = game.players_alive[game.players_alive.length - 1];
                    const statuses = sheet[i][columnStatus] ? sheet[i][columnStatus].split(',') : "";
                    for (let k = 0; k < game.statusEffects.length; k++) {
                        for (let l = 0; l < statuses.length; l++) {
                            if (game.statusEffects[k].name === statuses[l].trim()) {
                                currentPlayer.inflict(game, game.statusEffects[k].name, false, false, false, false);
                                break;
                            }
                        }
                    }
                    game.queue.push(new QueueEntry(Date.now(), "updateCell", currentPlayer.statusCell(), currentPlayer.statusString));

                    for (let k = 0; k < game.rooms.length; k++) {
                        if (game.rooms[k].name === currentPlayer.location.name) {
                            game.rooms[k].addPlayer(game, currentPlayer, null, null, false);
                            break;
                        }
                    }
                }
                else
                    game.players_dead.push(player);
            }
            var errors = [];
            for (let i = 0; i < game.players.length; i++) {
                if (doErrorChecking) {
                    let error = exports.checkPlayer(game.players[i]);
                    if (error instanceof Error) errors.push(error);
                }
                for (let j = 0; j < game.players[i].inventory.length; j++) {
                    for (let k = 0; k < game.players[i].inventory[j].effects.length; k++) {
                        let status = game.statusEffects.find(statusEffect => statusEffect.name === game.players[i].inventory[j].effects[k]);
                        if (status) game.players[i].inventory[j].effects[k] = status;
                    }
                    for (let k = 0; k < game.players[i].inventory[j].cures.length; k++) {
                        let status = game.statusEffects.find(statusEffect => statusEffect.name === game.players[i].inventory[j].cures[k]);
                        if (status) game.players[i].inventory[j].cures[k] = status;
                    }
                    if (doErrorChecking) {
                        let error = exports.checkInventoryItem(game.players[i].inventory[j]);
                        if (error instanceof Error) errors.push(error);
                    }
                }
            }
            if (errors.length > 0) {
                if (errors.length > 5) {
                    errors = errors.slice(0, 5);
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
    if (player.id === "" || player.id === null || player.id === undefined)
        return new Error(`Couldn't load player on row ${player.row}. No Discord ID was given.`);
    if (player.member === null || player.member === undefined)
        return new Error(`Couldn't load player on row ${player.row}. There is no member on the server with the ID ${player.id}.`);
    if (player.name === "" || player.name === null || player.name === undefined)
        return new Error(`Couldn't load player on row ${player.row}. No player name was given.`);
    if (player.name.includes(" "))
        return new Error(`Couldn't load player on row ${player.row}. Player names must not have any spaces.`);
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
        sheets.getDataFormulas(settings.playerSheetAllCells, function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnID = 0;
            const columnItemName = 12;
            const columnItemPluralName = 13;
            const columnItemUses = 14;
            const columnItemDiscreet = 15;
            const columnItemEffect = 16;
            const columnItemCures = 17;
            const columnItemContainingPhrase = 18;
            const columnItemDescription = 19;

            for (let i = 0; i < game.players_alive.length; i++) {
                game.players_alive[i].inventory.length = 0;
                var inventory = new Array(3);
                for (let j = 2, k = 0; j < sheet.length; j = j + k) {
                    if (sheet[j][columnID] === game.players_alive[i].id) {
                        for (k = 0; k < inventory.length; k++) {
                            if (sheet[j + k][columnItemName] !== "NULL") {
                                const containingPhrase = sheet[j + k][columnItemContainingPhrase] ? sheet[j + k][columnItemContainingPhrase].split(',') : "";
                                var effects = sheet[j + k][columnItemEffect] ? sheet[j + k][columnItemEffect].split(',') : [];
                                for (let l = 0; l < effects.length; l++)
                                    effects[l] = effects[l].trim();
                                var cures = sheet[j + k][columnItemCures] ? sheet[j + k][columnItemCures].split(',') : [];
                                for (let l = 0; l < cures.length; l++)
                                    cures[l] = cures[l].trim();
                                inventory[k] =
                                    new InventoryItem(
                                        sheet[j + k][columnItemName],
                                        sheet[j + k][columnItemPluralName] ? sheet[j + k][columnItemPluralName] : "",
                                        parseInt(sheet[j + k][columnItemUses]),
                                        sheet[j + k][columnItemDiscreet] === true,
                                        effects,
                                        cures,
                                        containingPhrase[0] ? containingPhrase[0].trim() : "",
                                        containingPhrase[1] ? containingPhrase[1].trim() : "",
                                        sheet[j + k][columnItemDescription] ? sheet[j + k][columnItemDescription] : "",
                                        j + k + 1
                                    );
                            }
                            else {
                                inventory[k] =
                                    new InventoryItem(
                                        null,
                                        null,
                                        null,
                                        null,
                                        [],
                                        [],
                                        null,
                                        null,
                                        "",
                                        j + k + 1
                                    );
                            }
                        }
                        game.players_alive[i].inventory = inventory;
                    }
                    else k = inventory.length;
                }
            }
            var errors = [];
            for (let i = 0; i < game.players.length; i++) {
                for (let j = 0; j < game.players[i].inventory.length; j++) {
                    for (let k = 0; k < game.players[i].inventory[j].effects.length; k++) {
                        let status = game.statusEffects.find(statusEffect => statusEffect.name === game.players[i].inventory[j].effects[k]);
                        if (status) game.players[i].inventory[j].effects[k] = status;
                    }
                    for (let k = 0; k < game.players[i].inventory[j].cures.length; k++) {
                        let status = game.statusEffects.find(statusEffect => statusEffect.name === game.players[i].inventory[j].cures[k]);
                        if (status) game.players[i].inventory[j].cures[k] = status;
                    }
                    if (doErrorChecking) {
                        let error = exports.checkInventoryItem(game.players[i].inventory[j]);
                        if (error instanceof Error) errors.push(error);
                    }
                }
            }
            if (errors.length > 0) {
                if (errors.length > 5) {
                    errors = errors.slice(0, 5);
                    errors.push(new Error("Too many errors."));
                }
                let errorMessage = errors.join('\n');
                reject(errorMessage);
            }
            resolve(game);
        });
    });
};

module.exports.checkInventoryItem = function (item) {
    if (item.name === "" || item.name === undefined)
        return new Error(`Couldn't load inventory item on row ${item.row}. No item name was given. If this inventory slot is empty, its name should be "NULL".`);
    if (item.singleContainingPhrase === "")
        return new Error(`Couldn't load inventory item on row ${item.row}. No single containing phrase was given.`);
    for (let i = 0; i < item.effects.length; i++) {
        if (!(item.effects[i] instanceof Status))
            return new Error(`Couldn't load inventory item on row ${item.row}. "${item.effects[i]}" in effects is not a status effect.`);
    }
    for (let i = 0; i < item.cures.length; i++) {
        if (!(item.cures[i] instanceof Status))
            return new Error(`Couldn't load inventory item on row ${item.row}. "${item.cures[i]}" in cures is not a status effect.`);
    }
    return;
};
