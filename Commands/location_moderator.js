const settings = include('Configs/settings.json');

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
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a player. Usage:\n${exports.config.usage}`);

    let player = game.players_alive_by_name.get(args[0]);
    if (player === undefined) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    game.messageHandler.addGameMechanicMessage(message.channel, `${player.name} is currently in ${player.location.channel}.`);

    return;
};
