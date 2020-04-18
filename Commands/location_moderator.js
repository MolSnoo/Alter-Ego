const settings = include('settings.json');

module.exports.config = {
    name: "location_moderator",
    description: "Tells you a player's location.",
    details: "Tells you the given player's location, with a link to the channel.",
    usage: `${settings.commandPrefix}location faye`,
    usableBy: "Moderator",
    aliases: ["location"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0) {
        game.messageHandler.addReply(message, "you need to specify a player. Usage:");
        game.messageHandler.addGameMechanicMessage(message.channel, exports.config.usage);
        return;
    }

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `player "${args[0]}" not found.`);

    game.messageHandler.addGameMechanicMessage(message.channel, `${player.name} is currently in ${player.location.channel}.`);

    return;
};
