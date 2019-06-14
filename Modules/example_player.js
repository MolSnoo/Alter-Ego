const settings = require("../settings.json");

module.exports.config = {
    name: "example_player",
    description: "An example command.",
    details: "Tells you your role.",
    usage: `${settings.commandPrefix}example`,
    usableBy: "Player",
    aliases: ["example", "ex", "test"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    message.channel.send("You are a player.");
    return;
};
