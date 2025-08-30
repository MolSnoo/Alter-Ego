const settings = include('Configs/settings.json');

module.exports.config = {
    name: "uncraft_player",
    description: "Uncraft an item in your inventory.",
    details: 'Seperates an item in your hand. '
        + "If no valid recipe for the item exists, the item cannot be uncrafted.",
    usage: `${settings.commandPrefix}uncraft shovel`,
    usableBy: "Player",
    aliases: ["uncraft"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable craft");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND") rightHand = player.inventory[slot];
        else if (player.inventory[slot].name === "LEFT HAND") leftHand = player.inventory[slot];
    }

    // Now find the item in the player's inventory.
    var item = null;
    var rightEmpty = true;
    var leftEmpty = true;
    if (rightHand.equippedItem !== null) {
        if (parsedInput === rightHand.equippedItem.name) {
            item = rightHand.equippedItem;
        }
        rightEmpty = false;
    }
    if (leftHand.equippedItem !== null) {
        if (parsedInput === leftHand.equippedItem.name) {
            item = leftHand.equippedItem;
        }
        leftEmpty = false;
    }

    if (item === null) {
        return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" in either of your hands.`);
    }

    if (!rightEmpty && !leftEmpty) {
        return game.messageHandler.addReply(message, `You need an empty hand to dismantle "${parsedInput}"`);
    }

    // Locate uncrafting recipe.
    const recipes = game.recipes.filter(recipe => recipe.uncraftable === true);
    var recipe = null;
    for (let i = 0; i < recipes.length; i++) {
        if (recipes[i].products[0].id === item.prefab.id) {
            recipe = recipes[i];
            break;
        }
    }
    if (recipe === null) return game.messageHandler.addReply(message, `Couldn't find uncraftable recipe producing ${item.name}. Contact a moderator if you think there should be one.`);

    player.uncraft(game, item, recipe, bot);

    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} uncrafted ${parsedInput} in ${player.location.channel}`);

    return;
};
