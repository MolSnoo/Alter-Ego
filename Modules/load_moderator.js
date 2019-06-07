const discord = require("discord.js");
const settings = require("../settings.json");

const sheets = require("../House-Data/sheets.js");
const Exit = require("../House-Data/Exit.js");
const Room = require("../House-Data/Room.js");
const InventoryItem = require("../House-Data/InventoryItem.js");
const Player = require("../House-Data/Player.js");

module.exports.config = {
    name: "load_moderator",
    description: 'Gathers the house data by reading it off the spreadsheet. Can specify what data to collect. "all start" must be used at the beginning of the game after the startgame timer is over, as it will gather all the data and send the room description of the room they start in to each player. If at any point you restart the bot, use "all resume". Any data that was previously gathered will be updated. You do NOT need to use this command  when you update descriptions, as the bot does not store those. Any other data you edit manually will require use of this command. Note that when updating players, all of the timers associated with player status effects will be reset, so try to avoid manually editing the player sheet. If you just need to refresh player inventories, use the "inventories" argument.',
    usage: `${settings.prefix}load all (start|resume)|rooms|objects|items|puzzles|status effects|players|inventories`,
    usableBy: "Moderator",
    aliases: ["load", "reload", "gethousedata"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, args) => {
    if (args.length === 0) {
        message.reply("you need to specify what data to get. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    if (args[0] === "all") {
        await exports.loadRooms(game);
        if (settings.debug) printData(game.rooms);
        await exports.loadPlayers(game);
        if (settings.debug) printData(game.players);

        message.channel.send(
            game.rooms.length + " rooms, " +
            game.objects.length + " objects, " +
            game.clues.length + " clues, " +
            game.items.length + " items, " +
            game.puzzles.length + " puzzles, " +
            game.statusEffects.length + " status effects, and " +
            game.players.length + " players retrieved."
        );
    }
    else if (args[0] === "rooms") {
        await exports.loadRooms(game);
        if (settings.debug) printData(game.rooms);
        message.channel.send(game.rooms.length + " rooms retrieved.");
    }
    else if (args[0] === "players") {
        await exports.loadPlayers(game);
    }
};

module.exports.loadRooms = function (game) {
    return new Promise((resolve) => {
        sheets.getData("Rooms!A1:F", function (response) {
            const sheet = response.data.values;
            // These constants are the column numbers corresponding to that data on the spreadsheet.
            const columnRoomName = 0;
            const columnAccessibility = 1;
            const columnNumberExits = 2;
            const columnExits = 3;
            const columnLeadsTo = 4;
            const columnFrom = 5;

            game.rooms.length = 0;
            for (let i = 1, j = 0; i < sheet.length; i = i + j) {
                var exits = [];
                for (j = 0; j < parseInt(sheet[i][columnNumberExits]); j++) {
                    exits.push(
                        new Exit(
                            sheet[i + j][columnExits],
                            sheet[i + j][columnLeadsTo],
                            sheet[i + j][columnFrom],
                            i + j + 1
                        ));
                }
                const channel = game.guild.channels.find(channel => channel.name === sheet[i][columnRoomName]);
                game.rooms.push(
                    new Room(
                        sheet[i][columnRoomName],
                        sheet[i][columnAccessibility] === "TRUE",
                        channel,
                        exits,
                        i + 1
                    )
                );
            }
            // Now go through and make the dest for each exit an actual Room object.
            for (let i = 0; i < game.rooms.length; i++) {
                for (let j = 0; j < game.rooms[i].exit.length; j++) {
                    game.rooms[i].exit[j].dest = game.rooms.find(room => room.name === game.rooms[i].exit[j].dest);
                }
            }
            resolve(game);
        });
    });
};

module.exports.loadPlayers = function (game) {
    return new Promise((resolve) => {
        // Clear all player status effects first.
        for (let i = 0; i < game.players.length; i++) {
            for (let j = 0; j < game.players[i].status.length; j++) {
                clearInterval(game.players[i].status[j].timer);
            }
        }

        sheets.getData("Players!A1:O", function (response) {
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

            game.players.length = 0;
            game.players_alive.length = 0;
            game.players_dead.length = 0;

            for (let i = 2, j = 0; i < sheet.length; i = i + j) {
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
                        game.rooms.find(room => room.name === sheet[i][columnLocation]),
                        sheet[i][columnHidingSpot],
                        new Array(),
                        inventory,
                        i + 1,
                        game.guild.members.find(member => member.id === sheet[i][columnID])
                    );
                game.players.push(player);

                if (player.alive) {
                    game.players_alive.push(player);

                    // Parse statuses and inflict the player with them.
                    const currentPlayer = game.players_alive[game.players_alive.length - 1];
                    const statuses = sheet[i][columnStatus].split(',');
                    for (let k = 0; k < game.statusEffects.length; k++) {
                        for (let l = 0; l < statuses.length; l++) {
                            if (game.statusEffects[k].name === statuses[l].trim()) {
                                const status = require("../Commands/status.js");
                                status.inflict(currentPlayer, game.statusEffects[k], game, null, false, false);
                                break;
                            }
                        }
                    }
                    sheets.updateCell(currentPlayer.statusCell(), currentPlayer.statusString);

                    for (let k = 0; k < game.rooms.length; k++) {
                        if (game.rooms[k].name === currentPlayer.location.name) {
                            game.rooms[k].addPlayer(currentPlayer);
                            break;
                        }
                    }
                }
                else
                    game.players_dead.push(player);
            }
            resolve(game);
        });
    });
};

function printData(data) {
    for (var i = 0; i < data.length; i++) {
        console.log(data[i]);
    }
}
