const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);
const parser = include(`${settings.modulesDir}/parser.js`);

module.exports.config = {
    name: "parse_moderator",
    description: "Parses the data on the spreadsheet.",
    details: `Takes the given set's formatted descriptions, parses them, and updates the "Parsed Description" `
        + `column with the parsed versions. This must be done after making any manual edits to room, object, `
        + `or solved puzzle descriptions, as the data in the parsed column is what will be sent to players.`,
    usage: `${settings.commandPrefix}parse all\n`
        + `${settings.commandPrefix}parse rooms\n`
        + `${settings.commandPrefix}parse objects\n`
        + `${settings.commandPrefix}parse puzzles`,
    usableBy: "Moderator",
    aliases: ["parse"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0) {
        message.reply("you need to specify what data to parse. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    if (args[0] === "all") {
        await parseRooms();
        await parseObjects();
        await parsePuzzles();
        message.channel.send("Room descriptions, object descriptions, and puzzle results have been parsed and updated on the spreadsheet.");
    }
    else if (args[0] === "rooms") {
        await parseRooms();
        message.channel.send("Room descriptions have been parsed and updated on the spreadsheet.");
    }
    else if (args[0] === "objects") {
        await parseObjects();
        message.channel.send("Object descriptions have been parsed and updated on the spreadsheet.");
    }
    else if (args[0] === "puzzles") {
        await parsePuzzles();
        message.channel.send("Puzzle results have been parsed and updated on the spreadsheet.");
    }
    else message.reply(`function not found. You need to use "rooms", "objects", or "puzzles".`);

    return;
};

function parseRooms() {
    return new Promise((resolve) => {
        sheets.getDataFormulas(settings.roomSheetAllFormattedDescriptions, function (response) {
            const sheet = response.data.values;
            const columnDescription = 0;
            var data = new Array(sheet.length - 1);
            for (let i = 0; i < data.length; i++)
                data[i] = new Array(1);

            for (let i = 1; i < sheet.length; i++) {
                var formattedDescription;
                if (sheet[i][columnDescription]) formattedDescription = sheet[i][columnDescription];
                else formattedDescription = "";
                const parsedDescription = parser.parseDescription(formattedDescription);

                data[i - 1][0] = parsedDescription;
            }
            sheets.updateData(settings.roomSheetAllParsedDescriptions, data);
            resolve(true);
        });
    });
}

function parseObjects() {
    return new Promise((resolve, reject) => {
        sheets.getDataFormulas(settings.objectSheetAllFormattedDescriptions, function (response) {
            const sheet = response.data.values;
            const columnDescription = 0;
            var data = new Array(sheet.length - 1);
            for (let i = 0; i < data.length; i++) {
                data[i] = new Array(1);
            }

            for (let i = 1; i < sheet.length; i++) {
                var formattedDescription;
                if (sheet[i][columnDescription]) formattedDescription = sheet[i][columnDescription];
                else formattedDescription = "";
                const parsedDescription = parser.parseDescription(formattedDescription).replace(`, ${settings.puzzleSheetFormattedAlreadySolvedColumn}`, `, ${settings.puzzleSheetParsedAlreadySolvedColumn}`);

                data[i - 1][0] = parsedDescription;
            }
            sheets.updateData(settings.objectSheetAllParsedDescriptions, data);
            resolve(true);
        });
    });
}

function parsePuzzles() {
    return new Promise((resolve, reject) => {
        sheets.getDataFormulas(settings.puzzleSheetAllFormattedAlreadySolvedCells, function (response) {
            const sheet = response.data.values;
            const columnDescription = 0;
            var data = new Array(sheet.length - 1);
            for (let i = 0; i < data.length; i++) {
                data[i] = new Array(1);
            }

            for (let i = 1; i < sheet.length; i++) {
                var formattedDescription;
                if (sheet[i][columnDescription]) formattedDescription = sheet[i][columnDescription];
                else formattedDescription = "";
                const parsedDescription = parser.parseDescription(formattedDescription);

                data[i - 1][0] = parsedDescription;
            }
            sheets.updateData(settings.puzzleSheetAllParsedAlreadySolvedCells, data);
            resolve(true);
        });
    });
}
