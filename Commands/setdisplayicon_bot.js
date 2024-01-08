module.exports.config = {
    name: "setdisplayicon_bot",
    description: "Sets a player's display icon.",
    details: "Sets the icon that will display when the given player's dialog appears in spectator channels. It will also appear in Room channels when the "
        + "player uses the say command. The icon given must be a URL with a .jpg or .png extension. When player data is reloaded, their display icon will "
        + "be reverted to their Discord avatar. Note that if the player is inflicted  with or cured of a status effect with the concealed attribute, "
        + "their display icon will be updated, thus overwriting one that was set manually. However, this command can be used to overwrite their new "
        + "display icon afterwards as well. Note that this command will not change the player's avatar when they send messages to Room channels normally. "
        + "If you use \"player\" in place of a player's name, then the player who triggered the command will have their display icon changed. "
        + "To reset a player's display icon to their Discord avatar, simply do not specify a new display icon.",
    usage: `setdisplayicon kyra https://cdn.discordapp.com/attachments/697623260736651335/912103115241697301/mm.png\n`
        + `setdisplayicon player https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png\n`
        + `setdisplayicon player`,
    usableBy: "Bot",
    aliases: ["setdisplayicon"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");
    if (args.length === 0)
        return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);

    if (args[0].toLowerCase() !== "player") {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
                player = game.players_alive[i];
                break;
            }
        }
        if (player === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Player "${args[0]}" not found.`);
    }
    else if (args[0].toLowerCase() === "player" && player === null)
        return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". The "player" argument was used, but no player was passed into the command.`);

    args.splice(0, 1);

    var input = args.join(" ").replace(/(?<=http(s?))@(?=.*?(jpg|png))/g, ':').replace(/(?<=http(s?):.*?)\\(?=.*?(jpg|png))/g, '/');
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|png))$');
    if (input === "") {
        if (player.talent === "NPC") input = player.id;
        else input = null;
    }
    else if (!iconURLSyntax.test(input)) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". The display icon must be a URL with a .jpg or .png extension.`);

    player.displayIcon = input;

    return;
};
