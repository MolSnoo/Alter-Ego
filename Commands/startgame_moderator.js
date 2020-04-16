const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

module.exports.config = {
    name: "startgame_moderator",
    description: "Starts a game.",
    details: 'Starts a new game. You must specify a timer using either hours (h) or minutes (m). '
        + 'During this time, any players with the Student role will be able to join using the PLAY command, '
        + 'at which point they will be given the Player role. When the timer reaches 0, '
        + 'all of the players will be uploaded to the Players spreadsheet. '
        + 'After making any needed modifications, use ".load all start" to begin the game.',
    usage: `${settings.commandPrefix}startgame 24h\n`
        + `${settings.commandPrefix}start 0.25m`,
    usableBy: "Moderator",
    aliases: ["startgame", "start"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0) return message.reply("remember to specify how long players have to join!");
    if (game.game) return message.reply("there is already a game running.");
    
    const timeInt = args[0].substring(0, args[0].length - 1);
    if (isNaN(timeInt) || (!args[0].endsWith('m') && !args[0].endsWith('h')))
        return message.reply("couldn't understand your timer. Must be a number followed by 'm' or 'h'.");

    var channel;
    if (settings.debug) channel = game.guild.channels.get(settings.testingChannel);
    else channel = game.guild.channels.get(settings.generalChannel);

    var time;
    var halfTime;
    var interval;
    if (args[0].endsWith('m')) {
        // Set the time in minutes.
        time = timeInt * 60000;
        halfTime = time / 2;
        interval = "minutes";
    }
    else if (args[0].endsWith('h')) {
        // Set the time in hours.
        time = timeInt * 3600000;
        halfTime = time / 2;
        interval = "hours";
    }

    game.halfTimer = setTimeout(function () {
        channel.send(`${timeInt / 2} ${interval} remaining to join the game. Use ${settings.commandPrefix}play to join!`);
    }, halfTime);

    game.endTimer = setTimeout(function () {
        game.canJoin = false;
        const playerRole = game.guild.roles.find(role => role.id === settings.playerRole);
        channel.send(`${playerRole}, time's up! The game will begin once the moderator is ready.`);

        game.players.sort(function (a, b) {
            var nameA = a.name.toLowerCase();
            var nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });

        var playerCells = [];
        var inventoryCells = [];
        for (let i = 0; i < game.players.length; i++) {
            const player = game.players[i];
            const playerData = [
                player.id,
                player.name,
                player.talent,
                player.pronounString,
                player.strength,
                player.intelligence,
                player.dexterity,
                player.speed,
                player.stamina,
                player.alive,
                player.location,
                player.hidingSpot,
                player.status,
                player.description,
                player.spectateId
            ];
            playerCells.push(playerData);

            for (let j = 0; j < settings.defaultInventory.length; j++) {
                // Update this so it replaces the number smybol in any cell.
                var row = [player.name];
                row = row.concat(settings.defaultInventory[j]);
                for (let k = 0; k < row.length; k++) {
                    if (row[k].includes('#'))
                        row[k] = row[k].replace(/#/g, i + 1);
                }
                inventoryCells.push(row);
            }
        }
        sheets.updateData(settings.playerSheetInitCells, playerCells);
        sheets.updateData(settings.inventorySheetInitCells, inventoryCells);
    }, time);

    game.game = true;
    game.canJoin = true;
    let announcement = `${message.member.displayName} has started a game. You have ${timeInt} ${interval} to join the game with ${settings.commandPrefix}play.`;
    channel.send(announcement);

    if (settings.debug) message.channel.send("Started game in debug mode.");
    else message.channel.send("Started game.");

    return;
};
