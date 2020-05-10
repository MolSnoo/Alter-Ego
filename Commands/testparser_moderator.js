const settings = include('settings.json');
const parser = include(`${settings.modulesDir}/parser.js`);

const fs = require('fs');
const os = require('os');

const Player = include(`${settings.dataDir}/Player.js`);

let game = include('game.json');

module.exports.config = {
    name: "testparser_moderator",
    description: "Tests the parsing module on your descriptions.",
    details: `Tests the parsing algorithm responsible for interpreting and editing descriptions. `
        + `Sends the results as a text file to the command channel. `
        + `If testing the add or remove function, you can add "formatted" to display the formatted descriptions. `
        + `Otherwise, it will display the parsed versions. For all functions, you can input a player name to `
        + `parse the text as if that player is reading it. Note that if using the "formatted" argument, `
        + `a player name cannot be used. This command should be used to make sure you've written properly formatted descriptions.\n`
        + `-**parse**: Outputs the formatted and parsed descriptions.\n`
        + `-**add**: Goes through each object, item, puzzle, player, and inventory item description with item containers and adds random items.\n`
        + `-**remove**: Goes through each room, object, item, puzzle, player, and inventory item description with items and removes each item `
        + `in the list. In "formatted" mode, items will be removed in every possible order. However, it will only remove up to 4 items in a description.`,
    usage: `${settings.commandPrefix}testparser parse\n`
        + `${settings.commandPrefix}testparser parse nero\n`
        + `${settings.commandPrefix}testparser add\n`
        + `${settings.commandPrefix}testparser add vivian\n`
        + `${settings.commandPrefix}testparser add formatted\n`
        + `${settings.commandPrefix}testparser remove\n`
        + `${settings.commandPrefix}testparser remove aria\n`
        + `${settings.commandPrefix}testparser remove formatted`,
    usableBy: "Moderator",
    aliases: ["testparser"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `you need to specify what function to test. Usage:\n${exports.config.usage}`);

    const file = "./parsedText.xml";
    fs.writeFile(file, "", function (err) {
        if (err) return console.log(err);
    });

    var player = new Player("", null, "Monokuma", "Monokuma", "Ultimate Despair Headmaster", settings.defaultStats, true, "", "", "satisfied, well rested", "", [], null, 2);
    if (args[1] && args[1] !== "formatted") {
        let found = false;
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[1].toLowerCase()) {
                player = game.players_alive[i];
                found = true;
                break;
            }
        }
        if (!found) return game.messageHandler.addReply(message, `couldn't find player "${args[1]}".`);
    }

    if (args[0] === "parse") {
        const result = await testparse(file, player);
        let warnings = [];
        for (let i = 0; i < result.warnings.length; i++) {
            for (let j = 0; j < result.warnings[i].warnings.length; j++) {
                result.warnings[i].warnings[j] = result.warnings[i].warnings[j].replace(/\t/g, " ").replace(/\n/g, " ");
                warnings.push(`Warning on ${result.warnings[i].cell}: ${result.warnings[i].warnings[j]}`);
            }
        }
        if (warnings.length > 0) {
            if (warnings.length > 5) {
                warnings = warnings.slice(0, 5);
                warnings.push("Too many warnings.");
            }
            game.messageHandler.addGameMechanicMessage(message.channel, warnings.join('\n'));
        }
        let errors = [];
        for (let i = 0; i < result.errors.length; i++) {
            for (let j = 0; j < result.errors[i].errors.length; j++) {
                result.errors[i].errors[j] = result.errors[i].errors[j].replace(/\t/g, " ").replace(/\n/g, " ");
                errors.push(`Error on ${result.errors[i].cell}: ${result.errors[i].errors[j]}`);
            }
        }
        if (errors.length > 0) {
            if (errors.length > 5) {
                errors = errors.slice(0, 5);
                errors.push("Too many errors.");
            }
            game.messageHandler.addGameMechanicMessage(message.channel, errors.join('\n'));
        }
    }
    else if (args[0] === "add") {
        let formatted = false;
        if (args[1] && args[1] === "formatted") formatted = true;
        await testadd(file, formatted, player);
    }
    else if (args[0] === "remove") {
        let formatted = false;
        if (args[1] && args[1] === "formatted") formatted = true;
        await testremove(file, formatted, player);
    }
    else return game.messageHandler.addReply(message, 'Function not found. You need to use "parse", "add", or "remove".');

    message.channel.send("Text parsed.", {
        files: [
            {
                attachment: file,
                name: `parsedText-${args[0]}.xml`
            }
        ]
    });

    return;
};

testparse = async (file, player) => {
    var warnings = [];
    var errors = [];

    // Get rooms first.
    {
        await appendText(file, "ROOMS:");
        let text = "";
        for (let i = 0; i < game.rooms.length; i++) {
            text += "   ";
            text += game.rooms[i].name + os.EOL;

            for (let j = 0; j < game.rooms[i].exit.length; j++) {
                text += "      ";
                text += game.rooms[i].exit[j].name + os.EOL;
                const parsedDescription = parser.parseDescription(game.rooms[i].exit[j].description, game.rooms[i], player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.rooms[i].exit[j].descriptionCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: game.rooms[i].exit[j].descriptionCell(), errors: parsedDescription.errors });

                text += "         ";
                text += game.rooms[i].exit[j].description + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }
            text += os.EOL;
        }
        await appendText(file, text);
    }

    // Get objects next.
    {
        await appendText(file, "OBJECTS:");
        let text = "";
        for (let i = 0; i < game.objects.length; i++) {
            text += "   ";
            text += game.objects[i].name + os.EOL;

            const parsedDescription = parser.parseDescription(game.objects[i].description, game.objects[i], player, true);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.objects[i].descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: game.objects[i].descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += game.objects[i].description + os.EOL;

            text += "      ";
            text += parsedDescription.text + os.EOL;
        }
        await appendText(file, text);
    }

    // Get prefabs next.
    {
        await appendText(file, "PREFABS:");
        let text = "";
        for (let i = 0; i < game.prefabs.length; i++) {
            text += "   ";
            text += game.prefabs[i].id + os.EOL;

            const parsedDescription = parser.parseDescription(game.prefabs[i].description, game.prefabs[i], player, true);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.prefabs[i].descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: game.prefabs[i].descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += game.prefabs[i].description + os.EOL;

            text += "      ";
            text += parsedDescription.text + os.EOL;
        }
        await appendText(file, text);
    }

    // Get recipes next.
    {
        await appendText(file, "RECIPES:");
        let text = "";
        for (let i = 0; i < game.recipes.length; i++) {
            text += "   ";
            text += "ROW " + game.recipes[i].row + os.EOL;

            const taggedObject = game.objects.find(object => object.recipeTag === game.recipes[i].objectTag);
            // First, do the initiated text.
            if (game.recipes[i].initiatedDescription !== "") {
                text += "      MESSAGE WHEN INITIATED:" + os.EOL;

                const parsedDescription = parser.parseDescription(game.recipes[i].initiatedDescription, taggedObject ? taggedObject : game.recipes[i], player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.recipes[i].initiatedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: game.recipes[i].initiatedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += game.recipes[i].initiatedDescription + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            // Finally, do the completed text.
            if (game.recipes[i].completedDescription !== "") {
                text += "      MESSAGE WHEN COMPLETED:" + os.EOL;

                const parsedDescription = parser.parseDescription(game.recipes[i].completedDescription, taggedObject ? taggedObject : game.recipes[i], player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.recipes[i].completedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: game.recipes[i].completedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += game.recipes[i].completedDescription + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }
        }
        await appendText(file, text);
    }

    // Get items next.
    {
        await appendText(file, "ITEMS:");
        let text = "";
        for (let i = 0; i < game.items.length; i++) {
            text += "   ";
            text += game.items[i].name + os.EOL;

            const parsedDescription = parser.parseDescription(game.items[i].description, game.items[i], player, true);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.items[i].descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: game.items[i].descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += game.items[i].description + os.EOL;

            text += "      ";
            text += parsedDescription.text + os.EOL;
        }
        await appendText(file, text);
    }

    // Get puzzles next.
    {
        await appendText(file, "PUZZLES:");
        let text = "";
        for (let i = 0; i < game.puzzles.length; i++) {
            text += "   ";
            text += game.puzzles[i].name + os.EOL;

            const puzzle = game.puzzles[i];
            // First, do the correct description.
            if (puzzle.correctDescription !== "") {
                text += "      CORRECT ANSWER:" + os.EOL;

                const parsedDescription = parser.parseDescription(puzzle.correctDescription, puzzle, player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.solvedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.solvedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.correctDescription + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            // Next, do the already solved description.
            if (puzzle.alreadySolvedDescription !== "") {
                text += "      ALREADY SOLVED:" + os.EOL;

                const parsedDescription = parser.parseDescription(puzzle.alreadySolvedDescription, puzzle, player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.alreadySolvedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.alreadySolvedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.alreadySolvedDescription + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            // Next, do the incorrect description.
            if (puzzle.incorrectDescription !== "") {
                text += "      INCORRECT ANSWER:" + os.EOL;

                const parsedDescription = parser.parseDescription(puzzle.incorrectDescription, puzzle, player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.incorrectCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.incorrectCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.incorrectDescription + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            // Next, do the no more attempts description.
            if (puzzle.noMoreAttemptsDescription !== "") {
                text += "      NO MORE ATTEMPTS:" + os.EOL;

                const parsedDescription = parser.parseDescription(puzzle.noMoreAttemptsDescription, puzzle, player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.noMoreAttemptsCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.noMoreAttemptsCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.noMoreAttemptsDescription + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            // Finally, do the requirements not met description.
            if (puzzle.requirementsNotMetDescription !== "") {
                text += "      REQUIREMENTS NOT MET:" + os.EOL;

                const parsedDescription = parser.parseDescription(puzzle.requirementsNotMetDescription, puzzle, player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.requirementsNotMetCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.requirementsNotMetCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.requirementsNotMetDescription + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            text += os.EOL;
        }
        await appendText(file, text);
    }

    // Get events next.
    {
        await appendText(file, "EVENTS:");
        let text = "";
        for (let i = 0; i < game.events.length; i++) {
            text += "   ";
            text += game.events[i].name + os.EOL;

            const event = game.events[i];
            // First, do the triggered text.
            if (event.triggeredNarration !== "") {
                text += "      MESSAGE WHEN TRIGGERED:" + os.EOL;

                const parsedDescription = parser.parseDescription(event.triggeredNarration, event, null, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: event.triggeredCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: event.triggeredCell(), errors: parsedDescription.errors });

                text += "         ";
                text += event.triggeredNarration + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            // Finally, do the ended text.
            if (event.endedNarration !== "") {
                text += "      MESSAGE WHEN ENDED:" + os.EOL;

                const parsedDescription = parser.parseDescription(event.endedNarration, event, null, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: event.endedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: event.endedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += event.endedNarration + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            text += os.EOL;
        }
        await appendText(file, text);
    }

    // Get status effects next.
    {
        await appendText(file, "STATUS EFFECTS:");
        let text = "";
        for (let i = 0; i < game.statusEffects.length; i++) {
            text += "   ";
            text += game.statusEffects[i].name + os.EOL;

            const status = game.statusEffects[i];
            // First, do the inflicted text.
            if (status.inflictedDescription !== "") {
                text += "      MESSAGE WHEN INFLICTED:" + os.EOL;

                const parsedDescription = parser.parseDescription(status.inflictedDescription, status, player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: status.inflictedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: status.inflictedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += status.inflictedDescription + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            // Finally, do the cured text.
            if (status.curedDescription !== "") {
                text += "      MESSAGE WHEN CURED:" + os.EOL;

                const parsedDescription = parser.parseDescription(status.curedDescription, status, player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: status.curedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: status.curedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += status.curedDescription + os.EOL;

                text += "         ";
                text += parsedDescription.text + os.EOL;
            }

            text += os.EOL;
        }
        await appendText(file, text);
    }

    // Get players next.
    {
        await appendText(file, "PLAYERS:");
        let text = "";
        for (let i = 0; i < game.players.length; i++) {
            text += "   ";
            text += game.players[i].name + os.EOL;

            const parsedDescription = parser.parseDescription(game.players[i].description, game.players[i], player, true);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.players[i].descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: game.players[i].descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += game.players[i].description + os.EOL;

            text += "      ";
            text += parsedDescription.text + os.EOL;
        }
        await appendText(file, text);
    }

    // Finally, get inventory items.
    {
        await appendText(file, "INVENTORY ITEMS:");
        let text = "";
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].prefab !== null) {
                text += "   ";
                text += game.inventoryItems[i].name + os.EOL;

                const parsedDescription = parser.parseDescription(game.inventoryItems[i].description, game.inventoryItems[i], player, true);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.inventoryItems[i].descriptionCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: game.inventoryItems[i].descriptionCell(), errors: parsedDescription.errors });

                text += "      ";
                text += game.inventoryItems[i].description + os.EOL;

                text += "      ";
                text += parsedDescription.text + os.EOL;
            }
        }
        await appendText(file, text);
    }

    return { warnings: warnings, errors: errors };
};

testadd = async (file, formatted, player) => {
    // Skip over rooms because you can't add items to them.

    // Get objects first.
    {
        await appendText(file, "OBJECTS:");
        let text = "";
        for (let i = 0; i < game.objects.length; i++) {
            const object = game.objects[i];
            if (object.description.includes('<il>') && object.description.includes('</il>')) {
                text += "   ";
                text += object.name + os.EOL;

                text += "      ";
                text += (formatted ? object.description : parser.parseDescription(object.description, object, player)) + os.EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.items.length);
                    while (itemNames.includes(game.items[randomIndex].name) || object.description.includes(game.items[randomIndex].name) || object.description.includes(game.items[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.items.length);
                    items.push(game.items[randomIndex]);
                    itemNames += game.items[randomIndex].name + " ";
                }

                let description = object.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let item = items[j];
                    item.quantity = 0;
                    text += `(Drop ${item.name}): `;
                    description = parser.addItem(description, item);
                    text += (formatted ? description : parser.parseDescription(description, object, player)) + os.EOL;
                    tabs++;
                }
            }
        }
        await appendText(file, text);
    }

    // Prefabs can't have items inside them.

    // Get items next.
    {
        await appendText(file, "ITEMS:");
        let text = "";
        for (let i = 0; i < game.items.length; i++) {
            const item = game.items[i];
            if (item.description.includes('<il') && item.description.includes('</il>')) {
                text += "   ";
                text += item.name + os.EOL;

                text += "      ";
                text += (formatted ? item.description : parser.parseDescription(item.description, item, player)) + os.EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.items.length);
                    while (itemNames.includes(game.items[randomIndex].name) || item.description.includes(game.items[randomIndex].name) || item.description.includes(game.items[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.items.length);
                    items.push(game.items[randomIndex]);
                    itemNames += game.items[randomIndex].name + " ";
                }

                let description = item.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let newItem = items[j];
                    newItem.quantity = 0;
                    text += `(Drop ${newItem.name}): `;
                    let slot = item.inventory[Math.floor(Math.random() * item.inventory.length)].name;
                    description = parser.addItem(description, newItem, slot);
                    text += (formatted ? description : parser.parseDescription(description, item, player)) + os.EOL;
                    tabs++;
                }
            }
        }
        await appendText(file, text);
    }

    // Get puzzles next.
    {
        await appendText(file, "PUZZLES:");
        let text = "";
        for (let i = 0; i < game.puzzles.length; i++) {
            const puzzle = game.puzzles[i];
            if (puzzle.alreadySolvedDescription.includes('<il>') && puzzle.alreadySolvedDescription.includes('</il>')) {
                text += "   ";
                text += puzzle.name + os.EOL;

                text += "      ";
                text += (formatted ? puzzle.alreadySolvedDescription : parser.parseDescription(puzzle.alreadySolvedDescription, puzzle, player)) + os.EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.items.length);
                    while (itemNames.includes(game.items[randomIndex].name) || puzzle.alreadySolvedDescription.includes(game.items[randomIndex].name) || puzzle.alreadySolvedDescription.includes(game.items[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.items.length);
                    items.push(game.items[randomIndex]);
                    itemNames += game.items[randomIndex].name + " ";
                }

                let description = puzzle.alreadySolvedDescription;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let item = items[j];
                    item.quantity = 0;
                    text += `(Drop ${item.name}): `;
                    description = parser.addItem(description, item);
                    text += (formatted ? description : parser.parseDescription(description, puzzle, player)) + os.EOL;
                    tabs++;
                }
            }
        }
        await appendText(file, text);
    }

    // Get players next.
    {
        await appendText(file, "PLAYERS:");
        let text = "";
        for (let i = 0; i < game.players.length; i++) {
            const currentPlayer = game.players[i];
            if (currentPlayer.description.includes('<il') && currentPlayer.description.includes('</il>')) {
                text += "   ";
                text += currentPlayer.name + os.EOL;

                text += "      ";
                text += (formatted ? currentPlayer.description : parser.parseDescription(currentPlayer.description, currentPlayer, player)) + os.EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.items.length);
                    while (itemNames.includes(game.items[randomIndex].name) || currentPlayer.description.includes(game.items[randomIndex].name) || currentPlayer.description.includes(game.items[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.items.length);
                    items.push(game.items[randomIndex]);
                    itemNames += game.items[randomIndex].name + " ";
                }

                let description = currentPlayer.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let item = items[j];
                    item.quantity = 0;
                    text += `(Equip ${item.name}): `;
                    description = parser.addItem(description, item, "equipment");
                    text += (formatted ? description : parser.parseDescription(description, currentPlayer, player)) + os.EOL;
                    tabs++;
                }
            }
        }
        await appendText(file, text);
    }

    // Finally, get inventory items.
    {
        await appendText(file, "INVENTORY ITEMS:");
        let text = "";
        for (let i = 0; i < game.inventoryItems.length; i++) {
            const inventoryItem = game.inventoryItems[i];
            if (inventoryItem.prefab !== null && inventoryItem.description.includes('<il') && inventoryItem.description.includes('</il>')) {
                text += "   ";
                text += inventoryItem.name + os.EOL;

                text += "      ";
                text += (formatted ? inventoryItem.description : parser.parseDescription(inventoryItem.description, inventoryItem, player)) + os.EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.items.length);
                    while (itemNames.includes(game.items[randomIndex].name) || inventoryItem.description.includes(game.items[randomIndex].name) || inventoryItem.description.includes(game.items[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.items.length);
                    items.push(game.items[randomIndex]);
                    itemNames += game.items[randomIndex].name + " ";
                }

                let description = inventoryItem.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let newItem = items[j];
                    newItem.quantity = 0;
                    text += `(Stash ${newItem.name}): `;
                    let slot = inventoryItem.inventory[Math.floor(Math.random() * inventoryItem.inventory.length)].name;
                    description = parser.addItem(description, newItem, slot);
                    text += (formatted ? description : parser.parseDescription(description, inventoryItem, player)) + os.EOL;
                    tabs++;
                }
            }
        }
        await appendText(file, text);
    }

    return;
};

testremove = async (file, formatted, player) => {
    // Get rooms first.
    {
        await appendText(file, "ROOMS:");
        let text = "";
        for (let i = 0; i < game.rooms.length; i++) {
            const room = game.rooms[i];
            if (room.description.includes('<item>') && room.description.includes('</item>')) {
                text += "   ";
                text += room.name + os.EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let k = 0; k < game.items.length; k++) {
                    if (game.items[k].location.name === room.name
                        && game.items[k].containerName === ""
                        && game.items[k].container === null
                        && game.items[k].accessible
                        && !items.find(item => item.singleContainingPhrase === game.items[k].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.items[k].pluralContainingPhrase)) {
                        items.push(game.items[k]);
                        itemNames.push(game.items[k].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < room.exit.length; j++) {
                    const exit = room.exit[j];
                    text += "      ";
                    text += exit.name + os.EOL;

                    text += "         ";
                    text += (formatted ? exit.description : parser.parseDescription(exit.description, room, player)) + os.EOL;

                    for (let k = 0; k < orders.length; k++) {
                        let description = exit.description;
                        let tabs = 1;
                        const permutation = orders[k].split(',');
                        for (let l = 0; l < permutation.length; l++) {
                            text += "         ";
                            for (let m = 0; m < tabs; m++)
                                text += "   ";
                            let item;
                            for (let m = 0; m < items.length; m++) {
                                if (permutation[l] === items[m].name) {
                                    item = items[m];
                                    item.quantity = 0;
                                    break;
                                }
                            }
                            text += `(Take ${permutation[l]}): `;
                            if (item) description = parser.removeItem(description, item, null, NaN);
                            text += (formatted ? description : parser.parseDescription(description, room, player)) + os.EOL;
                            tabs++;
                        }
                    }
                }
                text += os.EOL;
            }
        }
        await appendText(file, text);
    }

    // Get objects next.
    {
        await appendText(file, "OBJECTS:");
        let text = "";
        for (let i = 0; i < game.objects.length; i++) {
            const object = game.objects[i];
            if (object.description.includes('<item>') && object.description.includes('</item>')) {
                text += "   ";
                text += object.name + os.EOL;

                text += "      ";
                text += (formatted ? object.description : parser.parseDescription(object.description, object, player)) + os.EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.items.length; j++) {
                    if (game.items[j].location.name === object.location.name
                        && game.items[j].containerName === `Object: ${object.name}`
                        && game.items[j].container.row === object.row
                        && game.items[j].accessible
                        && object.preposition !== ""
                        && !items.find(item => item.singleContainingPhrase === game.items[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.items[j].pluralContainingPhrase)) {
                        items.push(game.items[j]);
                        itemNames.push(game.items[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = object.description;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let item;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                item = items[l];
                                item.quantity = 0;
                                break;
                            }
                        }
                        text += `(Take ${permutation[k]}): `;
                        if (item) description = parser.removeItem(description, item, null, NaN);
                        text += (formatted ? description : parser.parseDescription(description, object, player)) + os.EOL;
                        tabs++;
                    }
                }
            }
        }
        await appendText(file, text);
    }

    // Prefabs can't have items inside them.

    // Get items next.
    {
        await appendText(file, "ITEMS:");
        let text = "";
        for (let i = 0; i < game.items.length; i++) {
            const item = game.items[i];
            if (item.description.includes('<item>') && item.description.includes('</item>')) {
                text += "   ";
                text += item.name + os.EOL;

                text += "      ";
                text += (formatted ? item.description : parser.parseDescription(item.description, item, player)) + os.EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.items.length; j++) {
                    if (game.items[j].location.name === item.location.name
                        && game.items[j].containerName.startsWith(`Item: ${item.prefab.id}/`)
                        && game.items[j].container.row === item.row
                        && game.items[j].accessible
                        && item.prefab.preposition !== ""
                        && !items.find(item => item.singleContainingPhrase === game.items[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.items[j].pluralContainingPhrase)) {
                        items.push(game.items[j]);
                        itemNames.push(game.items[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = item.description;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let newItem;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                newItem = items[l];
                                newItem.quantity = 0;
                                break;
                            }
                        }
                        text += `(Take ${permutation[k]}): `;
                        if (newItem) description = parser.removeItem(description, newItem, newItem.slot, NaN);
                        text += (formatted ? description : parser.parseDescription(description, item, player)) + os.EOL;
                        tabs++;
                    }
                }
            }
        }
        await appendText(file, text);
    }

    // Get puzzles next.
    {
        await appendText(file, "PUZZLES:");
        let text = "";
        for (let i = 0; i < game.puzzles.length; i++) {
            const puzzle = game.puzzles[i];
            if (puzzle.alreadySolvedDescription !== "" && puzzle.alreadySolvedDescription.includes('<item>') && puzzle.alreadySolvedDescription.includes('</item>')) {
                text += "   ";
                text += puzzle.name + os.EOL;

                text += "      ";
                text += (formatted ? puzzle.alreadySolvedDescription : parser.parseDescription(puzzle.alreadySolvedDescription, puzzle, player)) + os.EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.items.length; j++) {
                    if (game.items[j].location.name === puzzle.location.name
                        && game.items[j].containerName === `Puzzle: ${puzzle.name}`
                        && !items.find(item => item.singleContainingPhrase === game.items[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.items[j].pluralContainingPhrase)) {
                        items.push(game.items[j]);
                        itemNames.push(game.items[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = puzzle.alreadySolvedDescription;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let item;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                item = items[l];
                                item.quantity = 0;
                                break;
                            }
                        }
                        text += `(Take ${permutation[k]}): `;
                        if (item) description = parser.removeItem(description, item, null, NaN);
                        text += (formatted ? description : parser.parseDescription(description, puzzle, player)) + os.EOL;
                        tabs++;
                    }
                }
            }
        }
        await appendText(file, text);
    }

    // Get players next.
    {
        await appendText(file, "PLAYERS:");
        let text = "";
        for (let i = 0; i < game.players.length; i++) {
            const currentPlayer = game.players[i];
            if (currentPlayer.description.includes('<item>') && currentPlayer.description.includes('</item>')) {
                text += "   ";
                text += currentPlayer.name + os.EOL;

                text += "      ";
                text += (formatted ? currentPlayer.description : parser.parseDescription(currentPlayer.description, currentPlayer, player)) + os.EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.inventoryItems.length; j++) {
                    if (game.inventoryItems[j].player.name === currentPlayer.name
                        && game.inventoryItems[j].prefab !== null
                        && game.inventoryItems[j].container === null
                        && !items.find(item => item.singleContainingPhrase === game.inventoryItems[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.inventoryItems[j].pluralContainingPhrase)) {
                        items.push(game.inventoryItems[j]);
                        itemNames.push(game.inventoryItems[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = currentPlayer.description;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let item;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                item = items[l];
                                item.quantity = 0;
                                break;
                            }
                        }
                        text += `(Unequip ${permutation[k]}): `;
                        if (item) {
                            if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") description = parser.removeItem(description, item, "hands", NaN);
                            else description = parser.removeItem(description, item, "equipment", NaN);
                        }
                        text += (formatted ? description : parser.parseDescription(description, currentPlayer, player)) + os.EOL;
                        tabs++;
                    }
                }
            }
        }
        await appendText(file, text);
    }

    // Finally, get inventory items.
    {
        await appendText(file, "INVENTORY ITEMS:");
        let text = "";
        for (let i = 0; i < game.inventoryItems.length; i++) {
            const inventoryItem = game.inventoryItems[i];
            if (inventoryItem.prefab !== null && inventoryItem.description.includes('<item>') && inventoryItem.description.includes('</item>')) {
                text += "   ";
                text += inventoryItem.name + os.EOL;

                text += "      ";
                text += (formatted ? inventoryItem.description : parser.parseDescription(inventoryItem.description, inventoryItem, player)) + os.EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.inventoryItems.length; j++) {
                    if (game.inventoryItems[j].player.name === inventoryItem.player.name
                        && game.inventoryItems[j].prefab !== null
                        && game.inventoryItems[j].containerName.startsWith(`${inventoryItem.prefab.id}/`)
                        && game.inventoryItems[j].container !== null
                        && game.inventoryItems[j].container.row === inventoryItem.row
                        && inventoryItem.prefab.preposition !== ""
                        && !items.find(item => item.singleContainingPhrase === game.inventoryItems[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.inventoryItems[j].pluralContainingPhrase)) {
                        items.push(game.inventoryItems[j]);
                        itemNames.push(game.inventoryItems[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = inventoryItem.description;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let item;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                item = items[l];
                                item.quantity = 0;
                                break;
                            }
                        }
                        text += `(Unstash ${permutation[k]}): `;
                        if (item) description = parser.removeItem(description, item, item.slot, NaN);
                        text += (formatted ? description : parser.parseDescription(description, inventoryItem, player)) + os.EOL;
                        tabs++;
                    }
                }
            }
        }
        await appendText(file, text);
    }
    
    return;
};

function permute(array) {
    if (array.length < 2) return array;

    var permutations = [];
    for (let i = 0; i < array.length; i++) {
        let element = array[i];

        if (array.indexOf(element) !== i)
            continue;

        let remainingElements = array.filter(piece => piece !== array[i]);

        for (var subPermutation of permute(remainingElements))
            permutations.push(`${element},${subPermutation}`);
    }
    return permutations;
}

function appendText(file, text) {
    return new Promise((resolve) => {
        fs.appendFile(file, text + os.EOL, function (err) {
            if (err) return console.log(err);
            resolve(file);
        });
    });
}
