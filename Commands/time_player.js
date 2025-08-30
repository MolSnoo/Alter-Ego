const settings = include('Configs/settings.json');

module.exports.config = {
    name: "time_player",
    description: "Check the current in-game time.",
    details: "Check the current in-game time.",
    usage: `${settings.commandPrefix}time`,
    usableBy: "Player",
    aliases: ["time"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable time");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    const timeMessage = `The time is **${new Date().toLocaleTimeString()}**`;
    game.messageHandler.addGameMechanicMessage(player.member, timeMessage);

    return;
};
