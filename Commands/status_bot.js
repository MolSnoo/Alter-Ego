﻿const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);
const parser = include(`${settings.modulesDir}/parser.js`);

module.exports.config = {
    name: "status_bot",
    description: "Deals with status effects on players.",
    details: 'Deals with status effects on players.\n'
        + '-**add**/**inflict**: Inflicts the specified player with the given status effect. '
        + 'If the "player" argument is used in place of a name, then the player who triggered '
        + 'the command will be inflicted. If the "all" argument is used instead, then all living '
        + 'players will be inflicted, and the "Message when Inflicted" will be sent to announcements '
        + 'channel instead of directly to players. If the "room" argument is used in place of a name, '
        + 'then all players in the same room as the player who solved it will be inflicted.\n'
        + '-**remove**/**cure**: Cures the specified player of the given status effect. '
        + 'If the "player" argument is used in place of a name, then the player who triggered '
        + 'the command will be cured. If the "all" argument is used instead, then all living '
        + 'players will be cured, and the "Message when Cured" will be sent to announcements '
        + 'channel instead of directly to players. If the "room" argument is used in place of a name, '
        + 'then all players in the same room as the player who solved it will be cured.',
    usage: `${settings.commandPrefix}status add player heated\n`
        + `${settings.commandPrefix}status add room safe\n`
        + `${settings.commandPrefix}inflict all deaf\n`
        + `${settings.commandPrefix}inflict diego heated\n`
        + `${settings.commandPrefix}status remove player injured\n`
        + `${settings.commandPrefix}status remove room restricted\n`
        + `${settings.commandPrefix}cure antoine injured\n`
        + `${settings.commandPrefix}cure all deaf`,
    usableBy: "Bot",
    aliases: ["status", "inflict", "cure"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");
    if (command === "status") {
        if (args[0] === "add" || args[0] === "inflict") command = "inflict";
        else if (args[0] === "remove" || args[0] === "cure") command = "cure";
        args.splice(0, 1);
    }

    if (args.length === 0) {
        game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    // Determine which player(s) are being inflicted/cured with a status effect.
    var players = new Array();
    if (args[0].toLowerCase() === "player" && player !== null)
        players.push(player);
    else if (args[0].toLowerCase() === "room" && player !== null)
        players = player.location.occupants;
    else if (args[0].toLowerCase() === "all") {
        for (let i = 0; i < game.players_alive.length; i++)
            players.push(game.players_alive[i]);
    }
    else {
        player = null;
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
                player = game.players_alive[i];
                break;
            }
        }
        if (player === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find player "${args[0]}".`);
        players.push(player);
    }
    args.splice(0, 1);

    var statusName = args.join(" ").toLowerCase();
    for (let i = 0; i < players.length; i++) {
        if (command === "inflict")
            players[i].inflict(game, statusName, true, true, true, data);
        else if (command === "cure")
            players[i].cure(game, statusName, true, true, true, data);
    }

    return;
};
