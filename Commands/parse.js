const discord = require("discord.js");
const settings = require("../settings.json");

const sheet = require("../House-Data/sheets.js");
const parser = require("../House-Data/parser.js");

module.exports.run = async (bot, config, message, args) => {
    if (message.member.roles.find(role => role.name === config.role_needed)) {
        let usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}parse all|rooms|objects|puzzles`);
        if (!args.length) {
            message.reply("you need to specify what data to parse. Usage:");
            message.channel.send(usage);
            return;
        }

        if (args[0] === "all") {
            await exports.parseRooms();
            await exports.parseObjects();
            await exports.parsePuzzles();

            message.channel.send("Room descriptions, object descriptions, and puzzle results have been parsed and updated on the spreadsheet.");
        }
        else if (args[0] === "rooms") {
            await exports.parseRooms();
            message.channel.send("Room descriptions have been parsed and updated on the spreadsheet.");
        }
        else if (args[0] === "objects") {
            await exports.parseObjects("Object descriptions have been parsed and updated on the spreadsheet.");
        }
        else if (args[0] === "puzzles") {
            await exports.parsePuzzles("Puzzle results have been parsed and updated on the spreadsheet.");
        }
    }
};

module.exports.parseRooms = function () {
    return new Promise((resolve, reject) => {
        sheet.getDataFormulas("Rooms!G1:G", function (response) {
            const spreadsheet = response.data.values;
            const columnDescription = 0;
            var data = new Array(spreadsheet.length - 1);
            for (var i = 0; i < data.length; i++) {
                data[i] = new Array(1);
            }

            for (var i = 1; i < spreadsheet.length; i++) {
                var formattedDescription;
                if (spreadsheet[i][columnDescription]) formattedDescription = spreadsheet[i][columnDescription];
                else formattedDescription = "";
                const parsedDescription = parser.parseDescription(formattedDescription);

                data[i - 1][0] = parsedDescription;
            }
            sheet.updateData("Rooms!H2:H", data);
            resolve(true);
        });
    });
}

module.exports.parseObjects = function () {
    return new Promise((resolve, reject) => {
        sheet.getDataFormulas("Objects!G1:G", function (response) {
            const spreadsheet = response.data.values;
            const columnDescription = 0;
            var data = new Array(spreadsheet.length - 1);
            for (var i = 0; i < data.length; i++) {
                data[i] = new Array(1);
            }

            for (var i = 1; i < spreadsheet.length; i++) {
                var formattedDescription;
                if (spreadsheet[i][columnDescription]) formattedDescription = spreadsheet[i][columnDescription];
                else formattedDescription = "";
                const parsedDescription = parser.parseDescription(formattedDescription).replace(", Puzzles!M", ", Puzzles!N");

                data[i - 1][0] = parsedDescription;
            }
            sheet.updateData("Objects!H2:H", data);
            resolve(true);
        });
    });
}

module.exports.parsePuzzles = function () {
    return new Promise((resolve, reject) => {
        sheet.getDataFormulas("Puzzles!M1:M", function (response) {
            const spreadsheet = response.data.values;
            const columnDescription = 0;
            var data = new Array(spreadsheet.length - 1);
            for (var i = 0; i < data.length; i++) {
                data[i] = new Array(1);
            }

            for (var i = 1; i < spreadsheet.length; i++) {
                var formattedDescription;
                if (spreadsheet[i][columnDescription]) formattedDescription = spreadsheet[i][columnDescription];
                else formattedDescription = "";
                const parsedDescription = parser.parseDescription(formattedDescription);

                data[i - 1][0] = parsedDescription;
            }
            sheet.updateData("Puzzles!N2:N", data);
            resolve(true);
        });
    });
}

module.exports.help = {
    name: "parse"
};