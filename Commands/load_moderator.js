﻿const settings = include('settings.json');
const loader = include(`${settings.modulesDir}/loader.js`);
const queuer = include(`${settings.modulesDir}/queuer.js`);

module.exports.config = {
    name: "load_moderator",
    description: 'Loads game data.',
    details: 'Gathers the game data by reading it off the spreadsheet. Can specify what data to collect. '
        + '"all start" must be used at the beginning of the game after the startgame timer is over, as it will '
        + 'gather all the data and send the room description of the room they start in to each player. '
        + 'If at any point you restart the bot, use "all resume". Any data that was previously gathered will be updated. '
        + 'Any data you edit manually, including descriptions, will require use of this command. Note that when updating players, '
        + 'all of the timers associated with player status effects will be reset, so try to avoid manually '
        + 'editing the player sheet. If you just need to refresh player inventories, use the "inventor ies" argument.',
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

    // Push the queue before loading anything.
    await queuer.pushQueue();

    if (args[0] === "all") {
        await loader.loadRooms(game, false);
        await loader.loadObjects(game, false);
        await loader.loadItems(game, false);
        await loader.loadPuzzles(game, false);
        await loader.loadStatusEffects(game, false);
        await loader.loadPlayers(game, false);

        var errors = [];
        for (let i = 0; i < game.rooms.length; i++) {
            let error = loader.checkRoom(game.rooms[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.objects.length; i++) {
            let error = loader.checkObject(game.objects[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.items.length; i++) {
            let error = loader.checkItem(game.items[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.puzzles.length; i++) {
            let error = loader.checkPuzzle(game.puzzles[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.statusEffects.length; i++) {
            let error = loader.checkStatusEffect(game.statusEffects[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.players.length; i++) {
            let error = loader.checkPlayer(game.players[i]);
            if (error instanceof Error) errors.push(error);
            for (let j = 0; j < game.players[i].inventory.length; j++) {
                error = loader.checkInventoryItem(game.players[i].inventory[j]);
                if (error instanceof Error) errors.push(error);
            }
        }
        if (errors.length > 0) {
            if (errors.length > 5) {
                errors = errors.slice(0, 5);
                errors.push(new Error("Too many errors."));
            }
            message.channel.send(errors.join('\n'));
        }
        else {
            if (settings.debug) {
                printData(game.rooms);
                printData(game.objects);
                printData(game.items);
                printData(game.puzzles);
                printData(game.statusEffects);
                printData(game.players);
            }

            message.channel.send(
                game.rooms.length + " rooms, " +
                game.objects.length + " objects, " +
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
                for (let i = 0; i < game.players_alive.length; i++)
                    game.players_alive[i].sendDescription(game.players_alive[i].location.description, game.players_alive[i].location);
            }
            else if (args[1] && args[1] === "resume") {
                game.game = true;
                game.canJoin = false;
                if (!settings.debug)
                    bot.user.setActivity(settings.gameInProgressActivity.string, { type: settings.gameInProgressActivity.type, url: settings.gameInProgressActivity.url });
            }
        }
    }
    else if (args[0] === "rooms") {
        try {
            await loader.loadRooms(game, true);
            if (settings.debug) printData(game.rooms);
            message.channel.send(game.rooms.length + " rooms retrieved.");
        }
        catch (err) {
            message.channel.send(err);
        }
    }
    else if (args[0] === "objects") {
        try {
            await loader.loadObjects(game, true);
            if (settings.debug) printData(game.objects);
            message.channel.send(game.objects.length + " objects retrieved.");
        }
        catch (err) {
            message.channel.send(err);
        }
    }
    else if (args[0] === "items") {
        try {
            await loader.loadItems(game, true);
            if (settings.debug) printData(game.items);
            message.channel.send(game.items.length + " items retrieved.");
        }
        catch (err) {
            message.channel.send(err);
        }
    }
    else if (args[0] === "puzzles") {
        try {
            await loader.loadPuzzles(game, true);
            if (settings.debug) printData(game.puzzles);
            message.channel.send(game.puzzles.length + " puzzles retrieved.");
        }
        catch (err) {
            message.channel.send(err);
        }
    }
    else if (args[0] === "statuses" || args[0] === "effects" || args[0] === "status" && args[1] === "effects") {
        try {
            await loader.loadStatusEffects(game, true);
            if (settings.debug) printData(game.statusEffects);
            message.channel.send(game.statusEffects.length + " status effects retrieved.");
        }
        catch (err) {
            message.channel.send(err);
        }
    }
    else if (args[0] === "players") {
        try {
            await loader.loadPlayers(game, true);
            if (settings.debug) printData(game.players);
            message.channel.send(game.players.length + " players retrieved.");
        }
        catch (err) {
            message.channel.send(err);
        }
    }
    else if (args[0] === "inventories") {
        try {
            await loader.loadInventories(game, true);
            if (settings.debug) printData(game.players_alive);
            message.channel.send(game.players_alive.length + " player inventories retrieved.");
        }
        catch (err) {
            message.channel.send(err);
        }
    }
};

function printData(data) {
    for (var i = 0; i < data.length; i++) {
        console.log(data[i]);
    }
}
