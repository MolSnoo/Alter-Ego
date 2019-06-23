const settings = include('settings.json');

module.exports.config = {
    name: "use_moderator",
    description: "Uses an item in the given player's inventory.",
    details: "Uses an item in the given player's inventory. Note that you cannot solve puzzles using this command. "
        + "To do that, use the puzzle command.",
    usage: `${settings.commandPrefix}use veronica first aid kit\n`
        + `${settings.commandPrefix}use colin food`,
    usableBy: "Moderator",
    aliases: ["use"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2) {
        message.reply("you need to specify a player and an item in their inventory. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return message.reply(`player "${args[0]}" not found.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // First find the item in the player's inventory, if applicable.
    var item = null;
    for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i].name === parsedInput) {
            item = player.inventory[i];
            break;
        }
    }
    if (item === null) return message.reply(`couldn't find item "${input}" in ${player.name}'s inventory.`);

    // Use the player's item.
    const response = player.use(game, item);
    if (response === "" || !response) {
        message.channel.send(`${player.name} uses the ${item.name}.`);
        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${player.name} forcefully used ${item.name} from their inventory in ${player.location.channel}`);
        return;
    }
    else if (response.startsWith("that item has no programmed use")) return message.reply("that item has no programmed use.");
    else if (response.startsWith("you cannot use that item")) return message.reply(`${player.name} is already under the efffect of ${item.name}.`);
    else if (response.startsWith("you attempted to use the")) return message.reply(`${item.name} currently has no effect on ${player.name}.`);
    else return message.reply(response);
};
