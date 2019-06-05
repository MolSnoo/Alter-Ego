const discord = require("discord.js");
const settings = require("../settings.json");

const sheet = require("../House-Data/sheets.js");

const Exit = require("../House-Data/Exit.js");
const Room = require("../House-Data/Room.js");
const Object = require("../House-Data/Object.js");
const Clue = require("../House-Data/Clue.js");
const Item = require("../House-Data/Item.js");
const Puzzle = require("../House-Data/Puzzle.js");
const InventoryItem = require("../House-Data/InventoryItem.js");
const Status = require("../House-Data/Status.js");
const Player = require("../House-Data/Player.js");

//>gethousedata all (start|resume)|rooms|objects|items|puzzles|status effects|players

module.exports.run = async (bot, config, message, args) => {
    if (message.member.roles.find(role => role.name === config.role_needed)) {
        let usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}gethousedata all (start|resume)|rooms|objects|items|puzzles|status effects|players|inventories`);

        if (!args.length) {
            message.reply("you need to specify what data to get. Usage:");
            message.channel.send(usage);
            return;
        }

        if (args[0] === "all") {
            await exports.getRooms(config);
            printData(config.rooms);
            await exports.getObjects(config);
            printData(config.objects);
            await exports.getClues(config);
            printData(config.clues);
            await exports.getItems(config);
            printData(config.items);
            await exports.getPuzzles(config);
            printData(config.puzzles);
            await exports.getStatusEffects(config);
            printData(config.statusEffects);
            await exports.getPlayers(config, bot);
            printData(config.players);

            message.channel.send(
                config.rooms.length + " rooms, " +
                config.objects.length + " objects, " +
                config.clues.length + " clues, " +
                config.items.length + " items, " +
                config.puzzles.length + " puzzles, " +
                config.statusEffects.length + " status effects, and " +
                config.players.length + " players retrieved."
            );

            if (args[1] && args[1] === "start") {
                config.game = true;
                config.isNormal = false;
                config.canJoin = false;
                if (!settings.debug)
                    bot.user.setActivity("Neo World Program", { type: 'STREAMING', url: 'https://www.twitch.tv/molsno' });
                for (var i = 0; i < config.rooms.length; i++) {
                    config.rooms[i].occupants.length = 0;
                    config.rooms[i].occupantsString = "";

                    for (var j = 0; j < config.players_alive.length; j++) {
                        if (config.players_alive[j].location === config.rooms[i].name) {
                            const scope = {
                                guild: message.guild,
                                config: config,
                                message: message,
                                currentPlayer: config.players_alive[j],
                                statuses: config.players_alive[j].statusString,
                                room: config.rooms,
                                currentRoom: null,
                                desiredRoom: i
                            };

                            const move = require("./move.js");
                            move.movePlayer(scope);
                        }
                    }
                }
            }
            else if (args[1] && args[1] === "resume") {
                config.game = true;
                config.isNormal = false;
                config.canJoin = false;
                if (!settings.debug)
                    bot.user.setActivity("Neo World Program", { type: 'STREAMING', url: 'https://www.twitch.tv/molsno' });
            }
        }
        else if (args[0] === "rooms") {
            await exports.getRooms(config);
            printData(config.rooms);
            message.channel.send(config.rooms.length + " rooms retrieved.");
        }
        else if (args[0] === "objects") {
            await exports.getObjects(config);
            printData(config.objects);
            message.channel.send(config.objects.length + " objects retrieved.");
        }
        else if (args[0] === "clues") {
            await exports.getClues(config);
            printData(config.clues);
            message.channel.send(config.clues.length + " clues retrieved.");
        }
        else if (args[0] === "items") {
            await exports.getItems(config);
            printData(config.items);
            message.channel.send(config.items.length + " items retrieved.");
        }
        else if (args[0] === "puzzles") {
            await exports.getPuzzles(config);
            printData(config.puzzles);
            message.channel.send(config.puzzles.length + " puzzles retrieved.");
        }
        else if (args[0] === "statuses" || args[0] === "effects" || (args[0] === "status" && args[1] === "effects")) {
            await exports.getStatusEffects(config);
            printData(config.statusEffects);
            message.channel.send(config.statusEffects.length + " status effects retrieved.");
        }
        else if (args[0] === "players") {
            await exports.getPlayers(config, bot);
            printData(config.players);
            message.channel.send(config.players.length + " players retrieved.");
        }
        else if (args[0] === "inventories") {
            await exports.getInventories(config);
            printData(config.players_alive);
            message.channel.send(config.players_alive.length + " player inventories refreshed.");
        }
    }
};

module.exports.getRooms = function (config) {
    return new Promise((resolve, reject) => {
        sheet.getData("Rooms!A1:F", function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnRoomName = 0;
            const columnAccessibility = 1;
            const columnNumberExits = 2;
            const columnExits = 3;
            const columnLeadsTo = 4;
            const columnFrom = 5;

            config.rooms.length = 0;
            for (var i = 1, j = 0; i < sheet.length; i = i + j) {
                var exits = new Array();
                for (j = 0; j < parseInt(sheet[i][columnNumberExits]); j++) {
                    exits.push(
                        new Exit(
                            sheet[i + j][columnExits],
                            sheet[i + j][columnLeadsTo],
                            sheet[i + j][columnFrom],
                            i + j + 1
                        ));
                }
                config.rooms.push(
                    new Room(
                        sheet[i][columnRoomName],
                        sheet[i][columnAccessibility] === "TRUE",
                        exits,
                        i + 1
                    )
                );
            }
            resolve(config);
        });
    });
}

module.exports.getObjects = function (config) {
    return new Promise((resolve, reject) => {
        sheet.getData("Objects!A1:F", function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnLocation = 1;
            const columnAccessibility = 2;
            const columnRequires = 3;
            const columnHidingSpot = 4;
            const columnPreposition = 5;

            config.objects.length = 0;
            for (var i = 1; i < sheet.length; i++) {
                config.objects.push(
                    new Object(
                        sheet[i][columnName],
                        sheet[i][columnLocation],
                        sheet[i][columnAccessibility] === "TRUE",
                        sheet[i][columnRequires] ? sheet[i][columnRequires] : "",
                        sheet[i][columnHidingSpot] === "TRUE",
                        sheet[i][columnPreposition] ? sheet[i][columnPreposition] : "",
                        i + 1
                    )
                );
            }
            resolve(config);
        });
    });
}

module.exports.getClues = function (config) {
    return new Promise((resolve, reject) => {
        sheet.getData("Clues!A1:D", function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnLocation = 1;
            const columnAccessibility = 2;
            const columnRequires = 3;

            config.clues.length = 0;
            for (var i = 1; i < sheet.length; i++) {
                config.clues.push(
                    new Clue(
                        sheet[i][columnName],
                        sheet[i][columnLocation],
                        sheet[i][columnAccessibility] === "TRUE",
                        sheet[i][columnRequires] ? sheet[i][columnRequires] : "",
                        i + 1
                    )
                );
            }
            resolve(config);
        });
    });
}

module.exports.getItems = function (config) {
    return new Promise((resolve, reject) => {
        sheet.getData("Items!A1:L", function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnPluralName = 1;
            const columnLocation = 2;
            const columnSublocation = 3;
            const columnAccessibility = 4;
            const columnRequires = 5;
            const columnQuantity = 6;
            const columnUses = 7;
            const columnDiscreet = 8;
            const columnEffect = 9;
            const columnCures = 10;
            const columnContainingPhrase = 11;

            config.items.length = 0;
            for (var i = 1; i < sheet.length; i++) {
                const containingPhrase = sheet[i][columnContainingPhrase].split(',');
                config.items.push(
                    new Item(
                        sheet[i][columnName],
                        sheet[i][columnPluralName] ? sheet[i][columnPluralName] : "",
                        sheet[i][columnLocation],
                        sheet[i][columnSublocation],
                        sheet[i][columnAccessibility] === "TRUE",
                        sheet[i][columnRequires],
                        parseInt(sheet[i][columnQuantity]),
                        parseInt(sheet[i][columnUses]),
                        sheet[i][columnDiscreet] === "TRUE",
                        sheet[i][columnEffect] ? sheet[i][columnEffect] : "",
                        sheet[i][columnCures] ? sheet[i][columnCures] : "",
                        containingPhrase[0].trim(),
                        containingPhrase[1] ? containingPhrase[1].trim() : "",
                        i + 1
                    )
                );
            }
            resolve(config);
        });
    });
}

module.exports.getPuzzles = function (config) {
    return new Promise((resolve, reject) => {
        sheet.getData("Puzzles!A1:K", function (response) {
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

            config.puzzles.length = 0;
            for (var i = 1; i < sheet.length; i++) { 
                config.puzzles.push(
                    new Puzzle(
                        sheet[i][columnName],
                        sheet[i][columnSolved] === "TRUE",
                        sheet[i][columnRequiresMod] === "TRUE",
                        sheet[i][columnLocation],
                        sheet[i][columnParentObject],
                        sheet[i][columnType],
                        sheet[i][columnAccessible] === "TRUE",
                        sheet[i][columnRequires],
                        sheet[i][columnSolution] ? sheet[i][columnSolution] : "",
                        parseInt(sheet[i][columnAttempts]),
                        sheet[i][columnWhenSolved] ? sheet[i][columnWhenSolved] : "",
                        i + 1
                    ));
            }
            resolve(config);
        });
    });
}

module.exports.getStatusEffects = function (config) {
    return new Promise((resolve, reject) => {
        sheet.getData("Status Effects!A1:G", function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnName = 0;
            const columnDuration = 1;
            const columnFatal = 2;
            const columnCure = 3;
            const columnNextStage = 4;
            const columnCuredCondition = 5;
            const columnRollModifier = 6;

            config.statusEffects.length = 0;
            for (var i = 1; i < sheet.length; i++) {
                config.statusEffects.push(
                    new Status(
                        sheet[i][columnName],
                        sheet[i][columnDuration],
                        sheet[i][columnFatal] === "TRUE",
                        sheet[i][columnCure],
                        sheet[i][columnNextStage],
                        sheet[i][columnCuredCondition],
                        parseInt(sheet[i][columnRollModifier]),
                        i + 1
                    )
                );
            }
            resolve(config);
        });
    });
}

module.exports.getPlayers = function (config, bot) {
    return new Promise((resolve, reject) => {
        // Clear all player status effects first.
        for (var i = 0; i < config.players.length; i++) {
            for (var j = 0; j < config.players[i].status.length; j++) {
                clearInterval(config.players[i].status[j].timer);
            }
        }

        const spreadsheet = sheet;
        sheet.getData("Players!A1:O", function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnID = 0;
            const columnName = 1;
            const columnTalent = 2;
            const columnClueLevel = 3;
            const columnAlive = 4;
            const columnLocation = 5;
            const columnHidingSpot = 6;
            const columnStatus = 7;
            const columnItemName = 8;
            const columnItemPluralName = 9;
            const columnItemUses = 10;
            const columnItemDiscreet = 11;
            const columnItemEffect = 12;
            const columnItemCures = 13;
            const columnItemContainingPhrase = 14;

            config.players.length = 0;
            config.players_alive.length = 0;
            config.players_dead.length = 0;

            for (var i = 2, j = 0; i < sheet.length; i = i + j) {
                var inventory = new Array(3);
                for (j = 0; j < inventory.length; j++) {
                    if (sheet[i + j][columnItemName] !== "NULL") {
                        const containingPhrase = sheet[i + j][columnItemContainingPhrase].split(',');
                        inventory[j] =
                            new InventoryItem(
                                sheet[i + j][columnItemName],
                                sheet[i + j][columnItemPluralName] ? sheet[i + j][columnItemPluralName] : "",
                                parseInt(sheet[i + j][columnItemUses]),
                                sheet[i + j][columnItemDiscreet] === "TRUE",
                                sheet[i + j][columnItemEffect] ? sheet[i + j][columnItemEffect] : "",
                                sheet[i + j][columnItemCures] ? sheet[i + j][columnItemCures] : "",
                                containingPhrase[0].trim(),
                                containingPhrase[1] ? containingPhrase[1].trim() : "",
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
                                null,
                                null,
                                null,
                                null,
                                i + j + 1
                            );
                }
                const player =
                    new Player(
                        sheet[i][columnID],
                        sheet[i][columnName],
                        sheet[i][columnTalent],
                        parseInt(sheet[i][columnClueLevel]),
                        sheet[i][columnAlive] === "TRUE",
                        sheet[i][columnLocation],
                        sheet[i][columnHidingSpot],
                        new Array(),
                        inventory,
                        i + 1
                    );
                config.players.push(player);

                if (player.alive) {
                    config.players_alive.push(player);

                    // Parse statuses and inflict the player with them.
                    const currentPlayer = config.players_alive[config.players_alive.length - 1];
                    const statuses = sheet[i][columnStatus].split(',');
                    for (var k = 0; k < config.statusEffects.length; k++) {
                        for (var l = 0; l < statuses.length; l++) {
                            if (config.statusEffects[k].name === statuses[l].trim()) {   
                                const status = require("./status.js");
                                status.inflict(currentPlayer, config.statusEffects[k], config, bot, false, false);
                                break;
                            }
                        }
                    }
                    spreadsheet.updateCell(currentPlayer.statusCell(), currentPlayer.statusString);

                    for (var k = 0; k < config.rooms.length; k++) {
                        if (config.rooms[k].name === currentPlayer.location) {
                            config.rooms[k].addPlayer(currentPlayer);
                            break;
                        }
                    }
                }
                else
                    config.players_dead.push(player);
            }
            resolve(config);
        });
    });
}

module.exports.getInventories = function (config) {
    return new Promise((resolve, reject) => {
        sheet.getData("Players!A1:O", function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnID = 0;
            const columnItemName = 8;
            const columnItemPluralName = 9;
            const columnItemUses = 10;
            const columnItemDiscreet = 11;
            const columnItemEffect = 12;
            const columnItemCures = 13;
            const columnItemContainingPhrase = 14;

            for (var k = 0; k < config.players_alive.length; k++) {
                config.players_alive[k].inventory.length = 0;
                var inventory = new Array(3);
                for (var i = 2, j = 0; i < sheet.length; i = i + j) {
                    if (sheet[i][columnID] === config.players_alive[k].id) {
                        for (j = 0; j < inventory.length; j++) {
                            if (sheet[i + j][columnItemName] !== "NULL") {
                                const containingPhrase = sheet[i + j][columnItemContainingPhrase].split(',');
                                inventory[j] =
                                    new InventoryItem(
                                        sheet[i + j][columnItemName],
                                        sheet[i + j][columnItemPluralName] ? sheet[i + j][columnItemPluralName] : "",
                                        parseInt(sheet[i + j][columnItemUses]),
                                        sheet[i + j][columnItemDiscreet] === "TRUE",
                                        sheet[i + j][columnItemEffect] ? sheet[i + j][columnItemEffect] : "",
                                        sheet[i + j][columnItemCures] ? sheet[i + j][columnItemCures] : "",
                                        containingPhrase[0].trim(),
                                        containingPhrase[1] ? containingPhrase[1].trim() : "",
                                        i + j + 1
                                    );
                            }
                            else {
                                inventory[j] =
                                    new InventoryItem(
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        i + j + 1
                                    );
                            }
                        }
                        config.players_alive[k].inventory = inventory;
                    }
                    else j = inventory.length;
                }
            }
            resolve(config);
        });
    });
}

function printData(data) {
    for (var i = 0; i < data.length; i++) {
        console.log(data[i]);
    }
}

function fetchDescription(descriptionCell) {
    return new Promise((resolve, reject) => {
        sheet.getData(descriptionCell, (response) => {
            resolve(response.data.values[0][0]);
        });
    });
}

module.exports.help = {
	name: "gethousedata"
};