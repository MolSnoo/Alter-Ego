const settings = include('settings.json');

module.exports.config = {
    name: "restore_moderator",
    description: "Restores a player's stamina.",
    details: "Sets the given player's stamina to its maximum value. Note that this does not automatically cure the weary status effect.",
    usage: `${settings.commandPrefix}restore flint`,
    usableBy: "Moderator",
    aliases: ["restore"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a player. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    player.stamina = player.maxStamina;
    game.messageHandler.addGameMechanicMessage(message.channel, `Fully restored ${player.name}'s stamina.`);

    return;
};
