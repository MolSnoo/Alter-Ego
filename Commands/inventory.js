const discord = require("discord.js");
const settings = require("../settings.json");

//>inventory

module.exports.run = async (bot, config, message, args) => {
    // Determine if the user is a player.
    var isPlayer = false;
    var currentPlayer;
    for (var i = 0; i < config.players_alive.length; i++) {
        if (message.author.id === config.players_alive[i].id) {
            isPlayer = true;
            currentPlayer = config.players_alive[i];
            break;
        }
    }

    if (!config.room_categories.includes(message.channel.parentID)
        && (!isPlayer || message.channel.type !== "dm")) return;

    if (!config.game) return message.reply("There is no game currently running");

    var itemString = "Your inventory: \n";
    for (var i = 0; i < currentPlayer.inventory.length; i++) {
        itemString += "[";
        if (currentPlayer.inventory[i].name !== null)
            itemString += currentPlayer.inventory[i].name;
        else
            itemString += " ";
        itemString += "] ";
    }

    message.author.send(itemString);

    if (message.channel.type !== "dm")
        message.delete().catch();
};

module.exports.help = {
    name: "inventory"
};