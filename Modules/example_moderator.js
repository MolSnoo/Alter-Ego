const discord = require("discord.js");
const settings = require("../settings.json");

module.exports = {
    config: {
        name: "example_moderator",
        description: "An example command.",
        usage: `${settings.commandPrefix}example`,
        usableBy: "Moderator",
        aliases: ["example", "ex", "test"]
    },
    run: async (bot, config, message, args) => {
        message.channel.send("You are a moderator.");
        return;
    }
};