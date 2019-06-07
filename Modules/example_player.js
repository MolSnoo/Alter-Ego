const discord = require("discord.js");
const settings = require("../settings.json");

module.exports = {
    config: {
        name: "example_player",
        description: "An example command.",
        usage: `${settings.commandPrefix}example`,
        usableBy: "Player",
        aliases: ["example", "ex", "test"]
    },
    run: async (bot, config, message, args) => {
        message.channel.send("You are a player.");
        return;
    }
};