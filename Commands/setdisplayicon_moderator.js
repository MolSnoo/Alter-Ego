const settings = include('Configs/settings.json');

module.exports.config = {
    name: "setdisplayicon_moderator",
    description: "Sets a player's display icon.",
    details: "Sets the icon that will display when the given player's dialog appears in spectator channels. It will also appear in Room channels when the "
        + "player uses the say command. The icon given must be a URL with a .jpg or .png extension. When player data is reloaded, their display icon will "
        + "be reverted to their Discord avatar. Note that if the player is inflicted  with or cured of a status effect with the concealed attribute, "
        + "their display icon will be updated, thus overwriting one that was set manually. However, this command can be used to overwrite their new "
        + "display icon afterwards as well. Note that this command will not change the player's avatar when they send messages to Room channels normally. "
        + "To reset a player's display icon to their Discord avatar, simply do not specify a new display icon.",
    usage: `${settings.commandPrefix}setdisplayicon kyra https://cdn.discordapp.com/attachments/697623260736651335/912103115241697301/mm.png\n`
        + `${settings.commandPrefix}setdisplayicon kyra`,
    usableBy: "Moderator",
    aliases: ["setdisplayicon"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a player. Usage:\n${exports.config.usage}`);

    let player = game.players_alive_by_name.get(args[0]);
    if (player === undefined) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|png))$');
    var input = args.join(" ");
    if (input === "") {
        if (player.talent === "NPC") input = player.id;
        else input = null;
    }
    else if (!iconURLSyntax.test(input)) return game.messageHandler.addReply(message, `The display icon must be a URL with a .jpg or .png extension.`);

    player.displayIcon = input;
    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully updated ${player.name}'s display icon.`);

    return;
};
