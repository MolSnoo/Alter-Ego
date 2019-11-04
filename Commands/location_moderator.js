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
        message.reply("you need to specify a player. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            break;
        }
    }
    if (player === null) return message.reply(`player "${args[0]}" not found.`);

    message.channel.send(`${player.name} is currently in ${player.location.channel}.`);

    return;
};
