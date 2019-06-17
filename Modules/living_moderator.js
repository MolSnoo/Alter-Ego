const settings = require("../settings.json");

module.exports.config = {
    name: "living_moderator",
    description: "Lists all living players.",
    details: "Lists all living players.",
    usage: `${settings.commandPrefix}living\n`
        + `${settings.commandPrefix}alive`,
    usableBy: "Moderator",
    aliases: ["living", "alive"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    var playerList = "Living players:\n";
    if (game.players_alive.length > 0)
        playerList += game.players_alive[0].name;
    for (let i = 1; i < game.players_alive.length; i++)
        playerList += `, ${game.players_alive[i].name}`;
    message.channel.send(playerList);

    return;
};
