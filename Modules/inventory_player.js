const settings = require("../settings.json");

module.exports.config = {
    name: "inventory_player",
    description: "Lists the items in your inventory.",
    details: "Shows you what items you currently have. Your inventory will be sent to you via DMs.",
    usage: `${settings.commandPrefix}inventory`,
    usableBy: "Player",
    aliases: ["inventory"]
};

module.exports.run = async (bot, game, message, args, player) => {
    const inventoryString = player.viewInventory("Your");
    player.member.send(inventoryString);

    return;
};
