const settings = require('../Configs/settings.json');

module.exports.config = {
    name: "wake_player",
    description: "Wakes you up.",
    details: "Wakes you up when you're asleep.",
    usage: `${settings.commandPrefix}wake\n`
        + `${settings.commandPrefix}awaken\n`
        + `${settings.commandPrefix}wakeup`,
    usableBy: "Player",
    aliases: ["wake", "awaken", "wakeup"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable wake");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    if (!player.statusString.includes("asleep")) return game.messageHandler.addReply(message, "You are not currently asleep.");
    player.cure(game, "asleep", true, true, true);

    return;
};
