const settings = include('settings.json');

module.exports.config = {
    name: "sleep_player",
    description: "Puts you to sleep.",
    details: "Puts you to sleep by inflicting you with the **asleep** status effect. "
        + "This should be used at the end of the day before the game pauses to ensure you wake up feeling well-rested.",
    usage: `${settings.commandPrefix}sleep`,
    usableBy: "Player",
    aliases: ["sleep"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable sleep");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    player.inflict(game, "asleep", true, true, true);
    player.setOffline();

    return;
};
