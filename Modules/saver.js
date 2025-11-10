const constants = include('Configs/constants.json');
const demodata = include('Configs/demodata.json');
const sheets = include(`${constants.modulesDir}/sheets.js`);

var game = include('game.json');

module.exports.saveGame = async function (deletedItemsCount = 0, deletedInventoryItemsCount = 0) {
    return new Promise(async (resolve, reject) => {
        var data = [];

        var roomValues = [];
        for (let i = 0; i < game.rooms.length; i++) {
            for (let j = 0; j < game.rooms[i].exit.length; j++) {
                roomValues.push([
                    j === 0 ? game.rooms[i].name : "",
                    j === 0 ? game.rooms[i].tags.join(", ") : "",
                    j === 0 ? game.rooms[i].iconURL : "",
                    game.rooms[i].exit[j].name,
                    game.rooms[i].exit[j].pos.x,
                    game.rooms[i].exit[j].pos.y,
                    game.rooms[i].exit[j].pos.z,
                    game.rooms[i].exit[j].unlocked ? "TRUE" : "FALSE",
                    game.rooms[i].exit[j].dest.name,
                    game.rooms[i].exit[j].link,
                    game.rooms[i].exit[j].description
                ]);
            }
        }
        data.push({ range: constants.roomSheetDataCells, values: roomValues });

        var objectValues = [];
        for (let i = 0; i < game.objects.length; i++) {
            objectValues.push([
                game.objects[i].name,
                game.objects[i].location.name,
                game.objects[i].accessible ? "TRUE" : "FALSE",
                game.objects[i].childPuzzleName,
                game.objects[i].recipeTag,
                game.objects[i].activatable ? "TRUE" : "FALSE",
                game.objects[i].activated ? "TRUE" : "FALSE",
                game.objects[i].autoDeactivate ? "TRUE" : "FALSE",
                game.objects[i].hidingSpotCapacity,
                game.objects[i].preposition,
                game.objects[i].description
            ]);
        }
        data.push({ range: constants.objectSheetDataCells, values: objectValues });

        var itemValues = [];
        for (let i = 0; i < game.items.length; i++) {
            itemValues.push([
                game.items[i].prefab.id,
                game.items[i].identifier,
                game.items[i].location.name,
                game.items[i].accessible ? "TRUE" : "FALSE",
                game.items[i].containerName,
                !isNaN(game.items[i].quantity) ? game.items[i].quantity : "",
                !isNaN(game.items[i].uses) ? game.items[i].uses : "",
                game.items[i].description
            ]);
            // If any items were deleted, row numbers may be incorrect. Fix them now.
            if (deletedItemsCount > 0) {
                if (i === 0) game.items[i].row = 2;
                else game.items[i].row = game.items[i - 1].row + 1;
            }
        }
        for (let i = 0; i < deletedItemsCount; i++)
            itemValues.push([
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                ""
            ]);
        data.push({ range: constants.itemSheetDataCells, values: itemValues });

        var puzzleValues = [];
        for (let i = 0; i < game.puzzles.length; i++) {
            puzzleValues.push([
                game.puzzles[i].name,
                game.puzzles[i].solved ? "TRUE" : "FALSE",
                game.puzzles[i].outcome,
                game.puzzles[i].requiresMod ? "TRUE" : "FALSE",
                game.puzzles[i].location.name,
                game.puzzles[i].parentObjectName,
                game.puzzles[i].type,
                game.puzzles[i].accessible ? "TRUE" : "FALSE",
                game.puzzles[i].requirementsStrings.join(", "),
                game.puzzles[i].solutions.join(", "),
                !isNaN(game.puzzles[i].remainingAttempts) ? game.puzzles[i].remainingAttempts : "",
                game.puzzles[i].commandSetsString,
                game.puzzles[i].correctDescription,
                game.puzzles[i].alreadySolvedDescription,
                game.puzzles[i].incorrectDescription,
                game.puzzles[i].noMoreAttemptsDescription,
                game.puzzles[i].requirementsNotMetDescription
            ]);
        }
        data.push({ range: constants.puzzleSheetDataCells, values: puzzleValues });

        var eventValues = [];
        for (let i = 0; i < game.events.length; i++) {
            eventValues.push([
                game.events[i].name,
                game.events[i].ongoing ? "TRUE" : "FALSE",
                game.events[i].durationString,
                game.events[i].remainingString,
                game.events[i].triggerTimesString,
                game.events[i].roomTag,
                game.events[i].commandsString,
                game.events[i].effectsStrings.join(", "),
                game.events[i].refreshesStrings.join(", "),
                game.events[i].triggeredNarration,
                game.events[i].endedNarration
            ]);
        }
        data.push({ range: constants.eventSheetDataCells, values: eventValues });

        var playerValues = [];
        for (let i = 0; i < game.players.length; i++) {
            playerValues.push([
                game.players[i].id,
                game.players[i].name,
                game.players[i].talent,
                game.players[i].pronounString,
                game.players[i].originalVoiceString,
                game.players[i].defaultStrength,
                game.players[i].defaultIntelligence,
                game.players[i].defaultDexterity,
                game.players[i].defaultSpeed,
                game.players[i].defaultStamina,
                game.players[i].alive ? "TRUE" : "FALSE",
                game.players[i].location ? game.players[i].location.name : "",
                game.players[i].hidingSpot ? game.players[i].hidingSpot : "",
                game.players[i].statusString,
                game.players[i].description
            ]);
        }
        data.push({ range: constants.playerSheetDataCells, values: playerValues });

        var inventoryValues = [];
        for (let i = 0; i < game.inventoryItems.length; i++) {
            inventoryValues.push([
                game.inventoryItems[i].player.name,
                game.inventoryItems[i].prefab ? game.inventoryItems[i].prefab.id : "NULL",
                game.inventoryItems[i].identifier,
                game.inventoryItems[i].equipmentSlot,
                game.inventoryItems[i].containerName,
                !isNaN(game.inventoryItems[i].quantity) && game.inventoryItems[i].quantity !== null ? game.inventoryItems[i].quantity : "",
                !isNaN(game.inventoryItems[i].uses) && game.inventoryItems[i].uses !== null ? game.inventoryItems[i].uses : "",
                game.inventoryItems[i].description
            ]);
            // If any inventory items were deleted, row numbers may be incorrect. Fix them now.
            if (deletedInventoryItemsCount > 0) {
                if (i === 0) game.inventoryItems[i].row = 2;
                else game.inventoryItems[i].row = game.inventoryItems[i - 1].row + 1;
            }
        }
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
        data.push({ range: constants.inventorySheetDataCells, values: inventoryValues });

        var flagValues = [];
        game.flags.forEach(flag => {
            flagValues.push([
                flag.id,
                flag.value === null ? "" : flag.value === true ? "TRUE" : flag.value === false ? "FALSE" : flag.value,
                flag.commandSetsString
            ]);
        });
        data.push({ range: constants.flagSheetDataCells, values: flagValues });

        try {
            await sheets.batchUpdateData(data);
            resolve();
        }
        catch (err) {
            reject(err);
        }
    });
};

module.exports.setupdemo = async function () {
    return new Promise (async (resolve, reject) =>  {
        var data = [];

        var roomValues = demodata.rooms;
        var objectValues = demodata.objects;
        var prefabValues = demodata.prefabs;
        var recipeValues = demodata.recipes;
        var itemValues = demodata.items;
        var puzzleValues = demodata.puzzles;
        var eventValues = demodata.events;
        var statusValues = demodata.statusEffects;
        var gestureValues = demodata.gestures;

        data.push({ range: constants.roomSheetDataCells, values: roomValues });
        data.push({ range: constants.objectSheetDataCells, values: objectValues });
        data.push({ range: constants.prefabSheetDataCells, values: prefabValues });
        data.push({ range: constants.recipeSheetDataCells, values: recipeValues });
        data.push({ range: constants.itemSheetDataCells, values: itemValues });
        data.push({ range: constants.puzzleSheetDataCells, values: puzzleValues });
        data.push({ range: constants.eventSheetDataCells, values: eventValues });
        data.push({ range: constants.statusSheetDataCells, values: statusValues });
        data.push({ range: constants.gestureSheetDataCells, values: gestureValues });

        try {
            await sheets.batchUpdateData(data);
            resolve(roomValues);
        }
        catch (err) {
            reject(err);
        }
    });
};
