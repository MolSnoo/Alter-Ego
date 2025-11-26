const settings = include('Configs/settings.json');

module.exports.config = {
    name: "inventory_moderator",
    description: "Lists a given player's inventory.",
    details: "Lists the given player's inventory.",
    usage: `${settings.commandPrefix}inventory nero`,
    usableBy: "Moderator",
    aliases: ["inventory", "i"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a player. Usage:\n${exports.config.usage}`);

    let player = game.players_alive_by_name.get(args[0]);
    if (player === undefined) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    const inventoryString = player.viewInventory(`${player.name}'s`, true);
    game.messageHandler.addGameMechanicMessage(message.channel, inventoryString);

    return;
};
