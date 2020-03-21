const settings = include('settings.json');

module.exports.config = {
    name: "inventory_moderator",
    description: "Lists a given player's inventory.",
    details: "Lists the given player's inventory.",
    usage: `${settings.commandPrefix}inventory nero`,
    usableBy: "Moderator",
    aliases: ["inventory"],
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

    const inventoryString = player.viewInventory(`${player.name}'s`, true);
    message.channel.send(inventoryString);

    return;
};
