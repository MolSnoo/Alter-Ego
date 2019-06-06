const discord = require("discord.js");
const settings = require("../settings.json");

module.exports.run = async (bot, config, message, args) => {
    message.channel.send("It worked.");
    return;
};

module.exports.config = {
    name: "example",
    description: "An example command.",
    usage: `${settings.commandPrefix}example`,
    usableBy: "Moderator",
    aliases: ["ex", "test"]
};
