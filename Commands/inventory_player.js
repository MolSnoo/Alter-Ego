const settings = require('../Configs/settings.json');

module.exports.config = {
    name: "inventory_player",
    description: "Lists the items in your inventory.",
    details: "Shows you what items you currently have. Your inventory will be sent to you via DMs.",
    usage: `${settings.commandPrefix}inventory`,
    usableBy: "Player",
    aliases: ["inventory", "i"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable inventory");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    const inventoryString = player.viewInventory("Your", false);
    player.notify(game, inventoryString);

    return;
};
