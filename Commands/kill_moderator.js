import settings from '../Configs/settings.json' with { type: 'json' };

module.exports.config = {
    name: "kill_moderator",
    description: "Makes a player dead.",
    details: "Moves the listed players from the living list to the dead list. "
        + "The player will be removed from whatever room channel they're in as well as any whispers. "
        + "A dead player will retain any items they had in their inventory, but they will not be accessible "
        + "unless they are manually added to the spreadsheet. A dead player will retain the Player role. "
        + "When a dead player's body is officially discovered, use the reveal command to remove the Player role "
        + "and give them the Dead role.",
    usage: `${settings.commandPrefix}kill chris\n`
        + `${settings.commandPrefix}die micah joshua amber devyn veronica`,
    usableBy: "Moderator",
    aliases: ["kill", "die"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify at least one player. Usage:\n${exports.config.usage}`);

    // Get all listed players first.
    var players = [];
    for (let i = 0; i < game.players_alive.length; i++) {
        for (let j = 0; j < args.length; j++) {
            if (args[j].toLowerCase() === game.players_alive[i].name.toLowerCase()) {
                players.push(game.players_alive[i]);
                args.splice(j, 1);
                break;
            }
        }
    }
    if (args.length > 0) {
        const missingPlayers = args.join(", ");
        return game.messageHandler.addReply(message, `Couldn't find player(s): ${missingPlayers}.`);
    }

    for (let i = 0; i < players.length; i++)
        players[i].die(game);

    game.messageHandler.addGameMechanicMessage(message.channel, "Listed players are now dead. Remember to use the reveal command when their bodies are discovered!");

    return;
};
