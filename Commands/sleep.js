const discord = require("discord.js");
const settings = require("../settings.json");

const status = require("./status.js");
const sheet = require("../House-Data/sheets.js");

//>sleep

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

    if (!config.game) return message.reply("There is no game currently running");

    if ((message.channel.parentID !== config.parent_channel)
        && (!isPlayer || message.channel.type !== "dm")) return;

    const statuses = currentPlayer.statusString;
    if (statuses.includes("asleep")) return message.reply("you are already **asleep**.");
    if (statuses.includes("unconscious")) return message.reply("you are **unconscious**. You cannot do anything.");
    if (statuses.includes("heated")) return message.reply("the situation is **heated**. Moderator intervention is required.");
    if (statuses.includes("restricted")) return message.reply("you are **restricted**. You cannot move.");

    // Get asleep status effect.
    var currentStatus;
    for (var i = 0; i < config.statusEffects.length; i++) {
        if (config.statusEffects[i].name === "asleep") {
            currentStatus = config.statusEffects[i];
            break;
        }
    }

    status.inflict(currentPlayer, currentStatus, config, bot, true, true);

    if (message.channel.type !== "dm")
        message.delete().catch();
};

module.exports.help = {
    name: "sleep"
};