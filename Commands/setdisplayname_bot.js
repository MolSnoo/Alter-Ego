const settings = include('settings.json');

module.exports.config = {
    name: "setdisplayname_bot",
    description: "Sets a player's display name.",
    details: "Sets the name that will display whenever the given player does something in-game. This will not change their name on the spreadsheet, "
        + "and when player data is reloaded, their display name will be reverted to their true name. Note that if the player is inflicted with "
        + "or cured of a status effect with the concealed attribute, their display name will be updated, thus overwriting one that was set manually. "
        + "However, this command can be used to overwrite their new display name afterwards as well. Note that this command will not change the player's "
        + "nickname in the server. If you use \"player\" in place of a player's name, then the player who triggered the command will have their "
        + "display name changed. To reset a player's display name to their real name, simply do not specify a new display name.",
    usage: `setdisplayname usami Monomi\n`
        + `setdisplayname player An individual wearing a MINOTAUR MASK\n`
        + `setdisplayname player`,
    usableBy: "Bot",
    aliases: ["setdisplayname"]
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

    var input = args.join(" ");
    if (input === "") input = player.name;
    if (input.length > 32) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". A name cannot exceed 32 characters.`);

    player.displayName = input;
    player.location.occupantsString = player.location.generate_occupantsString(player.location.occupants.filter(occupant => !occupant.hasAttribute("hidden")));

    return;
};
