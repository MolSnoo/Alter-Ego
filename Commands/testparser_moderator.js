const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);
const parser = include(`${settings.modulesDir}/parser.js`);
const loader = include(`${settings.modulesDir}/loader.js`);

const fs = require('fs');
const os = require('os');

const Player = include(`${settings.dataDir}/Player.js`);

let game = include('game.json');

module.exports.config = {
    name: "testparser_moderator",
    description: "Tests the parsing module on your descriptions.",
    details: `Tests the parsing algorithm responsible for adding and removing items from descriptions. `
        + `Sends the results as a text file to the command channel. `
        + `If testing the add or remove function, you can add "formatted" to display the formatted descriptions. `
        + `Otherwise, it will display only the unformatted versions. This command should be used to make sure `
        + `you've written properly formatted descriptions.\n\n`
        + `-**parse**: Outputs the formatted and unformatted descriptions and whether or not they're equal, `
        + `as well as their respective values. Use this before using the PARSE command to make sure everything looks good.\n\n`
        + `-**add**: Goes through each object and puzzle description with item containers and adds random items.\n\n`
        + `-**remove**: Goes through each room, object, and puzzle description with items and removes each item `
        + `in every order possible until there are none left. Do NOT use this if there are more than 4 items in a single object, `
        + `as the bot will most likely crash.`,
    usage: `${settings.commandPrefix}testparser parse\n`
        + `${settings.commandPrefix}testparser add\n`
        + `${settings.commandPrefix}testparser add formatted\n`
        + `${settings.commandPrefix}testparser remove\n`
        + `${settings.commandPrefix}testparser remove formatted`,
    usableBy: "Moderator",
    aliases: ["testparser"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0) {
        message.reply("you need to specify what function to test. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const file = "./parsedText.xml";
    fs.writeFile(file, "", function (err) {
        if (err) return console.log(err);
    });

    if (args[0] === "parse") {
        const result = await testparse(file);
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
            message.channel.send(warnings.join('\n'));
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
            message.channel.send(errors.join('\n'));
        }
    }
    else if (args[0] === "add") {
        if (game.items.length === 0)
            await loader.loadItems(game, false);
        let formatted = false;
        if (args[1] && args[1] === "formatted") formatted = true;
        await testadd(file, formatted);
    }
    else if (args[0] === "remove") {
        if (game.items.length === 0)
            await loader.loadItems(game, false);
        let formatted = false;
        if (args[1] && args[1] === "formatted") formatted = true;
        await testremove(file, formatted);
    }
    else return message.reply('Function not found. You need to use "parse", "add", or "remove".');

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

testparse = async (file) => {
    var player = new Player("", null, "Monokuma", "Monokuma", "Ultimate Despair Headmaster", settings.defaultStats, true, "", "", "satisfied, well rested", null, 2);

    var warnings = [];
    var errors = [];
    // Get rooms first.
    {
        const sheet = await getData(settings.roomSheetAllCells);
        const columnRoomName = 0;
        const columnNumberExits = 1;
        const columnExitName = 2;
        const columnDescription = 9;

        await appendText(file, "ROOMS:");
        let text = "";
        for (let i = 1; i < sheet.length; i++) {
            if (sheet[i][columnRoomName] !== "") {
                text += "   ";
                text += sheet[i][columnRoomName] + os.EOL;

                for (let j = 0; j < parseInt(sheet[i][columnNumberExits]); j++) {
                    text += "      ";
                    text += sheet[i + j][columnExitName] + os.EOL;
                    const oldDescription = sheet[i + j][columnDescription];
                    const newDescription = parser.parseDescription(oldDescription, player, true);
                    if (newDescription.warnings.length !== 0) warnings.push({ cell: settings.roomSheetDescriptionColumn + (i + j + 1), warnings: newDescription.warnings });
                    if (newDescription.errors.length !== 0) errors.push({ cell: settings.roomSheetDescriptionColumn + (i + j + 1), errors: newDescription.errors });

                    text += "         ";
                    text += oldDescription + os.EOL;

                    text += "         ";
                    text += newDescription.text + os.EOL;
                }
                text += os.EOL;
            }
        }
        await appendText(file, text);
    }

    // Get objects next.
    {
        const sheet = await getData(settings.objectSheetAllCells);
        const columnObjectName = 0;
        const columnDescription = 6;

        await appendText(file, "OBJECTS:");
        let text = "";
        for (let i = 1; i < sheet.length; i++) {
            text += "   ";
            text += sheet[i][columnObjectName] + os.EOL;

            const oldDescription = sheet[i][columnDescription];
            const newDescription = parser.parseDescription(oldDescription, player, true);
            if (newDescription.warnings.length !== 0) warnings.push({ cell: settings.objectSheetDescriptionColumn + (i + 1), warnings: newDescription.warnings });
            if (newDescription.errors.length !== 0) errors.push({ cell: settings.objectSheetDescriptionColumn + (i + 1), errors: newDescription.errors });

            text += "      ";
            text += oldDescription + os.EOL;

            text += "      ";
            text += newDescription.text + os.EOL;
        }
        await appendText(file, text);
    }

    {
        const sheet = await getData(settings.itemSheetAllCells);
        const columnItemName = 0;
        const columnDescription = 12;

        await appendText(file, "ITEMS:");
        let text = "";
        for (let i = 1; i < sheet.length; i++) {
            if (sheet[i][columnDescription]) {
                text += "   ";
                text += sheet[i][columnItemName] + os.EOL;

                const oldDescription = sheet[i][columnDescription];
                const newDescription = parser.parseDescription(oldDescription, player, true);
                if (newDescription.warnings.length !== 0) warnings.push({ cell: settings.itemSheetDescriptionColumn + (i + 1), warnings: newDescription.warnings });
                if (newDescription.errors.length !== 0) errors.push({ cell: settings.itemSheetDescriptionColumn + (i + 1), errors: newDescription.errors });

                text += "      ";
                text += oldDescription + os.EOL;

                text += "      ";
                text += newDescription + os.EOL;
            }
        }
        await appendText(file, text);
    }

    // Finally, get puzzles.
    {
        const sheet = await getData(settings.puzzleSheetAllCells);
        const columnPuzzleName = 0;
        const columnDescription = 12;

        await appendText(file, "PUZZLES:");
        let text = "";
        for (let i = 1; i < sheet.length; i++) {
            if (sheet[i][columnDescription]) {
                text += "   ";
                text += sheet[i][columnPuzzleName] + os.EOL;

                const oldDescription = sheet[i][columnDescription];
                const newDescription = parser.parseDescription(oldDescription, player, true);
                if (newDescription.warnings.length !== 0) warnings.push({ cell: settings.puzzleSheetAlreadySolvedColumn + (i + 1), warnings: newDescription.warnings });
                if (newDescription.errors.length !== 0) errors.push({ cell: settings.puzzleSheetAlreadySolvedColumn + (i + 1), errors: newDescription.errors });

                text += "      ";
                text += oldDescription + os.EOL;

                text += "      ";
                text += newDescription + os.EOL;
            }
        }
        await appendText(file, text);
    }

    return { warnings: warnings, errors: errors };
};

testadd = async (file, formatted) => {
    var player = new Player("", null, "Monokuma", "Monokuma", "Ultimate Despair Headmaster", settings.defaultStats, true, "", "", "satisfied, well rested", null, 2);
    // Skip over rooms because you can't add items to them.

    // Get objects first.
    {
        const sheet = await sheets.fetchData(settings.objectSheetAllCells);
        const columnObjectName = 0;
        const columnDescription = 6;

        await appendText(file, "OBJECTS:");
        let text = "";
        for (let i = 1; i < sheet.length; i++) {
            if (sheet[i][columnDescription].includes('<il>') && sheet[i][columnDescription].includes('</il>')) {
                text += "   ";
                text += sheet[i][columnObjectName] + os.EOL;

                text += "      ";
                text += (formatted ? sheet[i][columnDescription] : parser.parseDescription(sheet[i][columnDescription], player)) + os.EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.items.length);
                    while (itemNames.includes(game.items[randomIndex].name) || sheet[i][columnDescription].includes(game.items[randomIndex].name) || sheet[i][columnDescription].includes(game.items[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.items.length);
                    items.push(game.items[randomIndex]);
                    itemNames += game.items[randomIndex].name + " ";
                }

                let description = sheet[i][columnDescription];
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let item = items[j];
                    item.quantity = 0;
                    text += `(Drop ${item.name}): `;
                    description = parser.addItem(description, item);
                    text += (formatted ? description : parser.parseDescription(description, player)) + os.EOL;
                    tabs++;
                }
            }
        }
        await appendText(file, text);
    }

    // Finally, get puzzles.
    {
        const sheet = await sheets.fetchData(settings.puzzleSheetAllCells);
        const columnPuzzleName = 0;
        const columnDescription = 12;

        await appendText(file, "PUZZLES:");
        let text = "";
        for (let i = 1; i < sheet.length; i++) {
            if (sheet[i][columnDescription] && sheet[i][columnDescription].includes('<il>') && sheet[i][columnDescription].includes('</il>')) {
                text += "   ";
                text += sheet[i][columnPuzzleName] + os.EOL;

                text += "      ";
                text += (formatted ? sheet[i][columnDescription] : parser.parseDescription(sheet[i][columnDescription], player)) + os.EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.items.length);
                    while (itemNames.includes(game.items[randomIndex].name) || sheet[i][columnDescription].includes(game.items[randomIndex].name) || sheet[i][columnDescription].includes(game.items[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.items.length);
                    items.push(game.items[randomIndex]);
                    itemNames += game.items[randomIndex].name + " ";
                }

                let description = sheet[i][columnDescription];
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let item = items[j];
                    item.quantity = 0;
                    text += `(Drop ${item.name}): `;
                    description = parser.addItem(description, item);
                    text += (formatted ? description : parser.parseDescription(description, player)) + os.EOL;
                    tabs++;
                }
            }
        }
        await appendText(file, text);
    }

    return;
};

testremove = async (file, formatted) => {
    var player = new Player("", null, "Monokuma", "Monokuma", "Ultimate Despair Headmaster", settings.defaultStats, true, "", "", "satisfied, well rested", null, 2);

    // Get rooms first.
    {
        const sheet = await sheets.fetchData(settings.roomSheetAllCells);
        const columnRoomName = 0;
        const columnNumberExits = 1;
        const columnExitName = 2;
        const columnDescription = 9;

        await appendText(file, "ROOMS:");
        let text = "";
        for (let i = 1; i < sheet.length; i++) {
            if (sheet[i][columnRoomName] !== "" && sheet[i][columnDescription].includes('<item>') && sheet[i][columnDescription].includes('</item>')) {
                text += "   ";
                text += sheet[i][columnRoomName] + os.EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let k = 0; k < game.items.length; k++) {
                    if (game.items[k].location.name === sheet[i][columnRoomName]
                        && game.items[k].sublocationName === ""
                        && game.items[k].accessible) {
                        items.push(game.items[k]);
                        itemNames.push(game.items[k].name);
                    }
                }
                const orders = permute(itemNames);

                for (let j = 0; j < parseInt(sheet[i][columnNumberExits]); j++) {
                    text += "      ";
                    text += sheet[i + j][columnExitName] + os.EOL;

                    text += "         ";
                    text += (formatted ? sheet[i + j][columnDescription] : parser.parseDescription(sheet[i + j][columnDescription], player)) + os.EOL;

                    for (let k = 0; k < orders.length; k++) {
                        let description = sheet[i + j][columnDescription];
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
                            description = parser.removeItem(description, item);
                            text += (formatted ? description : parser.parseDescription(description, player)) + os.EOL;
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
        const sheet = await sheets.fetchData(settings.objectSheetAllCells);
        const columnObjectName = 0;
        const columnObjectLocation = 1;
        const columnPreposition = 5;
        const columnDescription = 6;

        await appendText(file, "OBJECTS:");
        let text = "";
        for (let i = 1; i < sheet.length; i++) {
            if (sheet[i][columnDescription].includes('<item>') && sheet[i][columnDescription].includes('</item>')) {
                text += "   ";
                text += sheet[i][columnObjectName] + os.EOL;

                text += "      ";
                text += (formatted ? sheet[i][columnDescription] : parser.parseDescription(sheet[i][columnDescription], player)) + os.EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.items.length; j++) {
                    if (game.items[j].location.name === sheet[i][columnObjectLocation]
                        && game.items[j].sublocationName === sheet[i][columnObjectName]
                        && game.items[j].accessible
                        && sheet[i][columnPreposition] !== "") {
                        items.push(game.items[j]);
                        itemNames.push(game.items[j].name);
                    }
                }
                const orders = permute(itemNames);

                for (let j = 0; j < orders.length; j++) {
                    let description = sheet[i][columnDescription];
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
                        description = parser.removeItem(description, item);
                        text += (formatted ? description : parser.parseDescription(description, player)) + os.EOL;
                        tabs++;
                    }
                }
            }
        }
        await appendText(file, text);
    }

    // Finally, get puzzles.
    {
        const sheet = await sheets.fetchData(settings.puzzleSheetAllCells);
        const columnPuzzleName = 0;
        const columnLocation = 3;
        const columnDescription = 12;

        await appendText(file, "PUZZLES:");
        let text = "";
        for (let i = 1; i < sheet.length; i++) {
            if (sheet[i][columnDescription] && sheet[i][columnDescription].includes('<item>') && sheet[i][columnDescription].includes('</item>')) {
                text += "   ";
                text += sheet[i][columnPuzzleName] + os.EOL;

                text += "      ";
                text += (formatted ? sheet[i][columnDescription] : parser.parseDescription(sheet[i][columnDescription], player)) + os.EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.items.length; j++) {
                    if (game.items[j].location.name === sheet[i][columnLocation]
                        && game.items[j].requiresName === sheet[i][columnPuzzleName]) {
                        items.push(game.items[j]);
                        itemNames.push(game.items[j].name);
                    }
                }
                const orders = permute(itemNames);

                for (let j = 0; j < orders.length; j++) {
                    let description = sheet[i][columnDescription];
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
                        description = parser.removeItem(description, item);
                        text += (formatted ? description : parser.parseDescription(description, player)) + os.EOL;
                        tabs++;
                    }
                }
            }
        }
        await appendText(file, text);
    }
    
    return;
};

function getData (sheetrange) {
    return new Promise((resolve) => {
        sheets.getData(sheetrange, (response) => {
            resolve(response.data.values);
        });
    });
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
