const discord = require("discord.js");
const settings = require("../settings.json");

module.exports.config = {
    name: "example_player",
    description: "An example command.",
    details: "Tells you your role.",
    usage: `${settings.commandPrefix}example`,
    usableBy: "Player",
    aliases: ["example", "ex", "test"]
};

module.exports.run = async (bot, config, message, command, args) => {
    message.channel.send("You are a player.");
    return;
};
