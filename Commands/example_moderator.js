const settings = include('settings.json');

module.exports.config = {
    name: "example_moderator",
    description: "An example command.",
    details: "Tells you your role.",
    usage: `${settings.commandPrefix}example`,
    usableBy: "Moderator",
    aliases: ["example", "ex", "test"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    message.channel.send("You are a moderator.");
    return;
};
