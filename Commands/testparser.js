const discord = require("discord.js");
const settings = require("../settings.json");
const fs = require('fs');
const os = require('os');

const sheet = require("../House-Data/sheets.js");
const parser = require("../House-Data/parser.js");


module.exports.run = async (bot, config, message, args) => {
    const file = "./parsedText.txt";

    fs.writeFile(file, "", function (err) {
        if (err) {
            return console.log(err);
        }
    });

    if (message.member.roles.find(role => role.name === config.role_needed)) {
        let usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}testparser parse|add (formatted)|remove (formatted)`);
        if (!args.length) {
            message.reply("you need to specify what function to test. Usage:");
            message.channel.send(usage);
            return;
        }
        const text = await testparser(file, config, args);
        message.channel.send("Text parsed.", {
            files: [
                {
                    attachment: file,
                    name: `parsedText-${args[0]}.txt`
                }
            ]
        });
    }
}

async function testparser(file, config, args) {
    var format = 1;
    if (args[1] && args[1] === "formatted") format = 0;

    {
        const response = await fetchData("Rooms!A1:H");

        const sheet = response.data.values;
        const columnRoomName = 0;
        const columnDescription = 6;
        const columnParsedDescription = 7;

        await appendText(file, "ROOMS:");
        for (var i = 1; i < sheet.length; i++) {
            if (sheet[i][columnRoomName] !== "") {
                if (args[0] === "parse") {
                    var text = "   ";
                    text += sheet[i][columnRoomName] + os.EOL;

                    const oldDescription = sheet[i][columnDescription];
                    const newDescription = parser.parseDescription(oldDescription);

                    text += "       ";
                    text += "formattedDescription === unformattedDescription ? ";
                    if (oldDescription === newDescription) text += "TRUE" + os.EOL;
                    else text += "FALSE" + os.EOL;

                    text += "          ";
                    text += oldDescription + os.EOL;

                    text += "          ";
                    text += newDescription + os.EOL;

                    await appendText(file, text);
                }
                else if (args[0] === "remove") {
                    if (sheet[i][columnDescription].includes('{')) {
                        var text = "   ";
                        text += sheet[i][columnRoomName] + os.EOL;

                        text += "       ";
                        if (format === 0) text += sheet[i][columnDescription] + os.EOL;
                        else text += sheet[i][columnParsedDescription] + os.EOL;

                        var items = new Array();
                        var itemNames = new Array();
                        for (var j = 0; j < config.items.length; j++) {
                            if ((config.items[j].location === sheet[i][columnRoomName])
                                && (config.items[j].sublocation === "")
                                && (config.items[j].accessible)) {
                                items.push(config.items[j]);
                                itemNames.push(config.items[j].name);
                            }
                        }

                        const orders = permute(itemNames);
                        //console.log(orders);

                        for (var j = 0; j < orders.length; j++) {
                            var description = [sheet[i][columnDescription], null];
                            var tabs = 1;
                            const permutation = orders[j].split(',');
                            for (var k = 0; k < permutation.length; k++) {
                                text += "       ";
                                for (var l = 0; l < tabs; l++)
                                    text += "       ";
                                var item;
                                for (var l = 0; l < items.length; l++) {
                                    if (permutation[k] === items[l].name) {
                                        item = items[l];
                                        item.quantity = 0;
                                        break;
                                    }
                                }
                                text += "(Take " + permutation[k] + "): ";
                                description = parser.removeItem(description[0], item);
                                text += description[format] + os.EOL;
                                tabs++;
                            }
                        }
                        await appendText(file, text);
                    }
                }
            }
        }
    }

    {
        const response = await fetchData("Objects!A1:H");
        const sheet = response.data.values;
        const columnObjectName = 0;
        const columnObjectLocation = 1;
        const columnDescription = 6;
        const columnParsedDescription = 7;

        await appendText(file, "OBJECTS:");
        for (var i = 1; i < sheet.length; i++) {
            if (sheet[i][columnObjectName] !== "") {
                if (args[0] === "parse") {
                    var text = "   ";
                    text += sheet[i][columnObjectName] + os.EOL;

                    const oldDescription = sheet[i][columnDescription];
                    const newDescription = parser.parseDescription(oldDescription);

                    text += "       ";
                    text += "formattedDescription === unformattedDescription ? ";
                    if (oldDescription === newDescription) text += "TRUE" + os.EOL;
                    else text += "FALSE" + os.EOL;

                    text += "          ";
                    text += oldDescription + os.EOL;

                    text += "          ";
                    text += newDescription + os.EOL;

                    await appendText(file, text);
                }
                else if (args[0] === "add") {
                    if (sheet[i][columnDescription].includes('<')) {
                        var text = "   ";
                        text += sheet[i][columnObjectName] + os.EOL;

                        text += "       ";
                        if (format === 0) text += sheet[i][columnDescription] + os.EOL;
                        else text += sheet[i][columnParsedDescription] + os.EOL;

                        var items = new Array();
                        var itemNames = "";
                        for (var j = 0; j < 4; j++) {
                            var randomIndex = Math.floor(Math.random() * config.items.length);
                            while (itemNames.includes(config.items[randomIndex].name) || sheet[i][columnDescription].includes(config.items[randomIndex].name))
                                randomIndex = Math.floor(Math.random() * config.items.length);
                            items.push(config.items[randomIndex]);
                            itemNames += config.items[randomIndex].name + " ";
                        }

                        var description = [sheet[i][columnDescription], null];
                        var tabs = 1;
                        for (var j = 0; j < items.length; j++) {
                            text += "       ";
                            for (var l = 0; l < tabs; l++)
                                text += "       ";
                            var item = items[j];
                            item.quantity = 0;
                            text += "(Drop " + item.name + "): ";
                            description = parser.addItem(description[0], item);
                            text += description[format] + os.EOL;
                            tabs++;
                        }
                        await appendText(file, text);
                    }
                }
                else if (args[0] === "remove") {
                    if (sheet[i][columnDescription].includes('{')) {
                        var text = "   ";
                        text += sheet[i][columnObjectName] + os.EOL;

                        text += "       ";
                        if (format === 0) text += sheet[i][columnDescription] + os.EOL;
                        else text += sheet[i][columnParsedDescription] + os.EOL;

                        var items = new Array();
                        var itemNames = new Array();
                        for (var j = 0; j < config.items.length; j++) {
                            if ((config.items[j].location === sheet[i][columnObjectLocation])
                                && (config.items[j].sublocation === sheet[i][columnObjectName])
                                && (config.items[j].accessible)) {
                                items.push(config.items[j]);
                                itemNames.push(config.items[j].name);
                            }
                        }

                        const orders = permute(itemNames);
                        //console.log(orders);

                        for (var j = 0; j < orders.length; j++) {
                            var description = [sheet[i][columnDescription], null];
                            var tabs = 1;
                            const permutation = orders[j].split(',');
                            for (var k = 0; k < permutation.length; k++) {
                                text += "       ";
                                for (var l = 0; l < tabs; l++)
                                    text += "       ";
                                var item;
                                for (var l = 0; l < items.length; l++) {
                                    if (permutation[k] === items[l].name) {
                                        item = items[l];
                                        item.quantity = 0;
                                        break;
                                    }
                                }
                                text += "(Take " + permutation[k] + "): ";
                                description = parser.removeItem(description[0], item);
                                text += description[format] + os.EOL;
                                tabs++;
                            }
                        }
                        await appendText(file, text);
                    }
                }
            }
        }

    }

    {
        const response = await fetchData("Puzzles!A1:N");
        const sheet = response.data.values;
        const columnPuzzleName = 0;
        const columnLocation = 3;
        const columnDescription = 12;
        const columnParsedDescription = 13;

        await appendText(file, "PUZZLES:");
        for (var i = 1; i < sheet.length; i++) {
            if (sheet[i][columnPuzzleName] !== "") {
                if (sheet[i][columnDescription] !== undefined) {
                    if (args[0] === "parse") {
                        var text = "   ";
                        text += sheet[i][columnPuzzleName] + os.EOL;

                        const oldDescription = sheet[i][columnDescription];
                        const newDescription = parser.parseDescription(oldDescription);

                        text += "       ";
                        text += "formattedDescription === unformattedDescription ? ";
                        if (oldDescription === newDescription) text += "TRUE" + os.EOL;
                        else text += "FALSE" + os.EOL;

                        text += "          ";
                        text += oldDescription + os.EOL;

                        text += "          ";
                        text += newDescription + os.EOL;

                        await appendText(file, text);
                    }
                    else if (args[0] === "add") {
                        if (sheet[i][columnDescription].includes('<')) {
                            var text = "   ";
                            text += sheet[i][columnPuzzleName] + os.EOL;

                            text += "       ";
                            if (format === 0) text += sheet[i][columnDescription] + os.EOL;
                            else text += sheet[i][columnParsedDescription] + os.EOL;

                            var items = new Array();
                            var itemNames = "";
                            for (var j = 0; j < 4; j++) {
                                var randomIndex = Math.floor(Math.random() * config.items.length);
                                while (itemNames.includes(config.items[randomIndex].name) || sheet[i][columnDescription].includes(config.items[randomIndex].name))
                                    randomIndex = Math.floor(Math.random() * config.items.length);
                                items.push(config.items[randomIndex]);
                                itemNames += config.items[randomIndex].name + " ";
                            }

                            var description = [sheet[i][columnDescription], null];
                            var tabs = 1;
                            for (var j = 0; j < items.length; j++) {
                                text += "       ";
                                for (var l = 0; l < tabs; l++)
                                    text += "       ";
                                var item = items[j];
                                item.quantity = 0;
                                text += "(Drop " + item.name + "): ";
                                description = parser.addItem(description[0], item);
                                text += description[format] + os.EOL;
                                tabs++;
                            }
                            await appendText(file, text);
                        }
                    }
                    else if (args[0] === "remove") {
                        if (sheet[i][columnDescription].includes('{')) {
                            var text = "   ";
                            text += sheet[i][columnPuzzleName] + os.EOL;

                            text += "       ";
                            if (format === 0) text += sheet[i][columnDescription] + os.EOL;
                            else text += sheet[i][columnParsedDescription] + os.EOL;

                            var items = new Array();
                            var itemNames = new Array();
                            for (var j = 0; j < config.items.length; j++) {
                                if ((config.items[j].location === sheet[i][columnLocation])
                                    && (config.items[j].requires === sheet[i][columnPuzzleName])) {
                                    items.push(config.items[j]);
                                    itemNames.push(config.items[j].name);
                                }
                            }

                            const orders = permute(itemNames);
                            //console.log(orders);

                            for (var j = 0; j < orders.length; j++) {
                                var description = [sheet[i][columnDescription], null];
                                var tabs = 1;
                                const permutation = orders[j].split(',');
                                for (var k = 0; k < permutation.length; k++) {
                                    text += "       ";
                                    for (var l = 0; l < tabs; l++)
                                        text += "       ";
                                    var item;
                                    for (var l = 0; l < items.length; l++) {
                                        if (permutation[k] === items[l].name) {
                                            item = items[l];
                                            item.quantity = 0;
                                            break;
                                        }
                                    }
                                    text += "(Take " + permutation[k] + "): ";
                                    description = parser.removeItem(description[0], item);
                                    text += description[format] + os.EOL;
                                    tabs++;
                                }
                            }
                            await appendText(file, text);
                        }
                    }
                }
            }
        }
    }
}

function permute(array) {
    if (array.length < 2) return array;

    var permutations = [];
    for (var i = 0; i < array.length; i++) {
        var element = array[i];

        if (array.indexOf(element) !== i)
            continue;

        var remainingElements = array.filter(piece => piece !== array[i]);

        for (var subPermutation of permute(remainingElements)) {
            permutations.push(element + ',' + subPermutation);
        }
        
    }
    return permutations;
}

function fetchData(datarange) {
    return new Promise((resolve, reject) => {
        sheet.getData(datarange, (response) => {
            resolve(response);
        });
    });
}

function appendText(file, text) {
    return new Promise((resolve) => {
        fs.appendFile(file, text + os.EOL, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("Parsed text.");
            resolve(file);
        });
    });
}

module.exports.help = {
    name: "testparser"
};