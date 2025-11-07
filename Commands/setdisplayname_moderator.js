const settings = require('../Configs/settings.json');

module.exports.config = {
    name: "setdisplayname_moderator",
    description: "Sets a player's display name.",
    details: "Sets the name that will display whenever the given player does something in-game. This will not change their name on the spreadsheet, "
        + "and when player data is reloaded, their display name will be reverted to their true name. Note that if the player is inflicted with "
        + "or cured of a status effect with the concealed attribute, their display name will be updated, thus overwriting one that was set manually. "
        + "However, this command can be used to overwrite their new display name afterwards as well. Note that this command will not change the player's "
        + "nickname in the server.",
    usage: `${settings.commandPrefix}setdisplayname usami Monomi\n`
        + `${settings.commandPrefix}setdisplayname faye An individual wearing a MINOTAUR MASK`,
    usableBy: "Moderator",
    aliases: ["setdisplayname"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a player and a display name. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    var input = args.join(" ");
    if (input.length > 32) return game.messageHandler.addReply(message, `A name cannot exceed 32 characters.`);

    player.displayName = input;
    player.location.occupantsString = player.location.generate_occupantsString(player.location.occupants.filter(occupant => !occupant.hasAttribute("hidden")));
    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully updated ${player.name}'s display name.`);

    return;
};
