const settings = include('settings.json');

module.exports.config = {
    name: "example_bot",
    description: "An example command.",
    details: "Tells you your role.",
    usage: `${settings.commandPrefix}example`,
    usableBy: "Bot",
    aliases: ["example", "ex", "test"]
};

module.exports.run = async (bot, game, command, args, player) => {
    return;
};
