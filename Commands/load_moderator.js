const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);
const loader = include(`${settings.modulesDir}/loader.js`);

module.exports.config = {
    name: "load_moderator",
    description: 'Loads game data.',
    details: 'Gathers the house data by reading it off the spreadsheet. Can specify what data to collect. "all start" must be used at the beginning of the game after the startgame timer is over, as it will gather all the data and send the room description of the room they start in to each player. If at any point you restart the bot, use "all resume". Any data that was previously gathered will be updated. You do NOT need to use this command  when you update descriptions, as the bot does not store those. Any other data you edit manually will require use of this command. Note that when updating players, all of the timers associated with player status effects will be reset, so try to avoid manually editing the player sheet. If you just need to refresh player inventories, use the "inventories" argument.',
    usage: `${settings.commandPrefix}load all start\n`
        + `${settings.commandPrefix}load all resume\n`
        + `${settings.commandPrefix}load all\n`
        + `${settings.commandPrefix}load rooms\n`
        + `${settings.commandPrefix}load objects\n`
        + `${settings.commandPrefix}load items\n`
        + `${settings.commandPrefix}load puzzles\n`
        + `${settings.commandPrefix}load status effects\n`
        + `${settings.commandPrefix}load players\n`
        + `${settings.commandPrefix}load inventories`,
    usableBy: "Moderator",
    aliases: ["load", "reload", "gethousedata"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0) {
        message.reply("you need to specify what data to get. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    if (args[0] === "all") {
        await loader.loadRooms(game);
        if (settings.debug) printData(game.rooms);
        await loader.loadObjects(game);
        if (settings.debug) printData(game.objects);
        await loader.loadClues(game);
        if (settings.debug) printData(game.clues);
        await loader.loadItems(game);
        if (settings.debug) printData(game.items);
        await loader.loadPuzzles(game);
        if (settings.debug) printData(game.puzzles);
        await loader.loadStatusEffects(game);
        if (settings.debug) printData(game.statusEffects);
        await loader.loadPlayers(game);
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

        if (args[1] && args[1] === "start") {
            game.game = true;
            game.canJoin = false;
            if (!settings.debug)
                bot.user.setActivity(settings.gameInProgressActivity.string, { type: settings.gameInProgressActivity.type, url: settings.gameInProgressActivity.url });
            for (let i = 0; i < game.players_alive.length; i++) {
                sheets.getData(game.players_alive[i].location.parsedDescriptionCell(), function (response) {
                    game.players_alive[i].member.send(response.data.values[0][0]);
                });
            }
        }
        else if (args[1] && args[1] === "resume") {
            game.game = true;
            game.canJoin = false;
            if (!settings.debug)
                bot.user.setActivity(settings.gameInProgressActivity.string, { type: settings.gameInProgressActivity.type, url: settings.gameInProgressActivity.url });
        }
    }
    else if (args[0] === "rooms") {
        await loader.loadRooms(game);
        if (settings.debug) printData(game.rooms);
        message.channel.send(game.rooms.length + " rooms retrieved.");
    }
    else if (args[0] === "objects") {
        await loader.loadObjects(game);
        if (settings.debug) printData(game.objects);
        message.channel.send(game.objects.length + " objects retrieved.");
    }
    else if (args[0] === "clues") {
        await loader.loadClues(game);
        if (settings.debug) printData(game.clues);
        message.channel.send(game.clues.length + " clues retrieved.");
    }
    else if (args[0] === "items") {
        await loader.loadItems(game);
        if (settings.debug) printData(game.items);
        message.channel.send(game.items.length + " items retrieved.");
    }
    else if (args[0] === "puzzles") {
        await loader.loadPuzzles(game);
        if (settings.debug) printData(game.puzzles);
        message.channel.send(game.puzzles.length + " puzzles retrieved.");
    }
    else if (args[0] === "statuses" || args[0] === "effects" || (args[0] === "status" && args[1] === "effects")) {
        await loader.loadStatusEffects(game);
        if (settings.debug) printData(game.statusEffects);
        message.channel.send(game.statusEffects.length + " status effects retrieved.");
    }
    else if (args[0] === "players") {
        await loader.loadPlayers(game);
        if (settings.debug) printData(game.players);
        message.channel.send(game.players.length + " players retrieved.");
    }
    else if (args[0] === "inventories") {
        await loader.loadInventories(game);
        if (settings.debug) printData(game.players_alive);
        message.channel.send(game.players_alive.length + " player inventories retrieved.");
    }
};

function printData(data) {
    for (var i = 0; i < data.length; i++) {
        console.log(data[i]);
    }
}
