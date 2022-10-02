const settings = include('settings.json');

module.exports.config = {
    name: "use_moderator",
    description: "Uses an item in the given player's inventory.",
    details: "Uses an item in one of the given player's hands. Note that you cannot solve puzzles using this command. "
        + "To do that, use the puzzle command.",
    usage: `${settings.commandPrefix}use veronica first aid kit\n`
        + `${settings.commandPrefix}use colin's food`,
    usableBy: "Moderator",
    aliases: ["use"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a player and an item in their inventory. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // First, find the item in the player's inventory.
    var item = null;
    // Get references to the right and left hand equipment slots so we don't have to iterate through the player's inventory to find them every time.
    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND")
            rightHand = player.inventory[slot];
        else if (player.inventory[slot].name === "LEFT HAND")
            leftHand = player.inventory[slot];
    }
    // Check for the identifier first.
    if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.identifier !== "" && rightHand.equippedItem.identifier === parsedInput)
        item = rightHand.equippedItem;
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.identifier !== "" && leftHand.equippedItem.identifier === parsedInput)
        item = leftHand.equippedItem;
    // Check for the prefab ID next.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.prefab.id === parsedInput)
        item = rightHand.equippedItem;
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.prefab.id === parsedInput)
        item = leftHand.equippedItem;
    // Check for the name last.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.name === parsedInput)
        item = rightHand.equippedItem;
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.name === parsedInput)
        item = leftHand.equippedItem;
    if (item === null) return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" in either of ${player.name}'s hands.`);

    // Use the player's item.
    const itemName = item.identifier ? item.identifier : item.prefab.id;
    const response = player.use(game, item);
    if (response === "" || !response) {
        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully used ${itemName} for ${player.name}.`);
        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly used ${itemName} from ${player.originalPronouns.dpos} inventory in ${player.location.channel}`);
        return;
    }
    else if (response.startsWith("that item has no programmed use")) return game.messageHandler.addReply(message, "That item has no programmed use.");
    else if (response.startsWith("you attempt to use the")) return game.messageHandler.addReply(message, `${itemName} currently has no effect on ${player.name}.`);
    else return game.messageHandler.addReply(message, response);
};
