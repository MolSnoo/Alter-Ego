const settings = include('Configs/settings.json');

module.exports.config = {
    name: "player_moderator",
    description: "Adds a player to the game.",
    details: "Adds a player to the list of players for the current game. You can additionally specify a "
        + "non-default starting room and a list of non-default status effects.",
    usage: `${settings.commandPrefix}addplayer @MolSno\n`
        + `${settings.commandPrefix}addplayer @MolSno kitchen\n`
        + `${settings.commandPrefix}addplayer @MolSno living-room warm, well rested, full\n`,
    usableBy: "Moderator",
    aliases: ["play"]
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to mention a user to add. Usage:\n${exports.config.usage}`);

    const user = message.mentions.users.first();

    return;
};
