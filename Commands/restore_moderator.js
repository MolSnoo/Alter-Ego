const settings = include('Configs/settings.json');

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

    let player = game.players_alive_by_name.get(args[0]);
    if (player === undefined) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    player.stamina = player.maxStamina;
    game.messageHandler.addGameMechanicMessage(message.channel, `Fully restored ${player.name}'s stamina.`);

    return;
};
