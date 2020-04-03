const settings = include('settings.json');

module.exports.config = {
    name: "status_player",
    description: "Shows your status.",
    details: "Shows you what status effects you're currently afflicted with.",
    usage: `${settings.commandPrefix}status`,
    usableBy: "Player",
    aliases: ["status"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable status");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    const statusMessage = `You are currently:\n${player.generate_statusList(false, false)}`;
    player.member.send(statusMessage);

    return;
};
