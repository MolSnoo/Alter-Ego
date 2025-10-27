const settings = include('Configs/settings.json');

module.exports.config = {
    name: "time_player",
    description: "Shows the current in-game time.",
    details: "Shows the current in-game time and date. This will show you the time in the timezone "
        + "that the bot is currently operating in. This may differ from your local time.",
    usage: `${settings.commandPrefix}time`,
    usableBy: "Player",
    aliases: ["time"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable time");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    const timeMessage = `It is currently **${new Date().toLocaleTimeString()}** on **${new Date().toDateString()}**.`;
    game.messageHandler.addGameMechanicMessage(player.member, timeMessage);

    return;
};
