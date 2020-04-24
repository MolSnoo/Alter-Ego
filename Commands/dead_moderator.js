const settings = include('settings.json');

module.exports.config = {
    name: "dead_moderator",
    description: "Lists all dead players.",
    details: "Lists all dead players.",
    usage: `${settings.commandPrefix}dead\n`
        + `${settings.commandPrefix}died`,
    usableBy: "Moderator",
    aliases: ["dead", "died"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    var playerList = "Dead players:\n";
    if (game.players_dead.length > 0)
        playerList += game.players_dead[0].name;
    for (let i = 1; i < game.players_dead.length; i++)
        playerList += `, ${game.players_dead[i].name}`;
    game.messageHandler.addGameMechanicMessage(message.channel, playerList);

    return;
};
