const settings = include('settings.json');

module.exports.config = {
    name: "reveal_moderator",
    description: "Gives a player the Dead role.",
    details: "Removes the Player role from the listed players and gives them the Dead role. "
        + "All listed players must be dead.",
    usage: `${settings.commandPrefix}reveal chris\n`
        + `${settings.commandPrefix}reveal micah joshua amber devyn veronica\n`,
    usableBy: "Moderator",
    aliases: ["reveal"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `you need to specify at least one player. Usage:\n${exports.config.usage}`);

    // Get all listed players first.
    var players = [];
    for (let i = 0; i < game.players_dead.length; i++) {
        for (let j = 0; j < args.length; j++) {
            if (args[j].toLowerCase() === game.players_dead[i].name.toLowerCase()) {
                players.push(game.players_dead[i]);
                args.splice(j, 1);
                break;
            }
        }
    }
    if (args.length > 0) {
        const missingPlayers = args.join(", ");
        return game.messageHandler.addReply(message, `couldn't find player(s) on dead list: ${missingPlayers}.`);
    }

    for (let i = 0; i < players.length; i++) {
        if (players[i].talent !== "NPC") {
            players[i].member.roles.remove(settings.playerRole);
            players[i].member.roles.add(settings.deadRole);
        }
    }

    game.messageHandler.addGameMechanicMessage(message.channel, "Listed players have been given the Dead role.");

    return;
};
