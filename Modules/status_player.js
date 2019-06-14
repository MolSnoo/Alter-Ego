const settings = require("../settings.json");

module.exports.config = {
    name: "status_player",
    description: "Shows your status.",
    details: "Shows you what status effects you're currently afflicted with.",
    usage: `${settings.commandPrefix}status`,
    usableBy: "Player",
    aliases: ["status"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const statusMessage = `You are currently:\n${player.statusString}`;
    player.member.send(statusMessage);

    return;
};
