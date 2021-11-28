const settings = include('settings.json');

module.exports.config = {
    name: "give_moderator",
    description: "Gives a player's item to another player.",
    details: "Transfers an item from the first player's inventory to the second player's inventory. Both players must be in the same room. "
        + "The item selected must be in one of the first player's hands. The receiving player must also have a free hand, "
        + "or else they will not be able to receive the item. If a particularly large item "
        + "(a chainsaw, for example) is given, people in the room with you will see the player giving it to the recipient.",
    usage: `${settings.commandPrefix}give vivian's yellow key to aria\n`
        + `${settings.commandPrefix}give natalie night vision goggles to shiori`,
    usableBy: "Moderator",
    aliases: ["give"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 3)
        return game.messageHandler.addReply(message, `You need to specify two players and an item. Usage:\n${exports.config.usage}`);

    // First, find the giver.
    var giver = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            giver = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (giver === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    // Next, find the recipient.
    var recipient = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[args.length - 1].toLowerCase().replace(/'s/g, "")) {
            recipient = game.players_alive[i];
            args.splice(args.length - 1, 1);
            break;
        }
    }
    if (recipient === null) return game.messageHandler.addReply(message, `Player "${args[args.length - 1]}" not found.`);
    if (args[args.length - 1].toLowerCase() === "to") args.splice(args.length - 1, 1);

    if (giver.name === recipient.name) return game.messageHandler.addReply(message, `${giver.name} cannot give an item to ${giver.pronouns.ref}.`);
    if (giver.location.name !== recipient.location.name) return game.messageHandler.addReply(message, `${giver.name} and ${recipient.name} are not in the same room.`);

    // Check to make sure that the recipient has a free hand.
    var recipientHand = "";
    for (let slot = 0; slot < recipient.inventory.length; slot++) {
        if (recipient.inventory[slot].name === "RIGHT HAND" && recipient.inventory[slot].equippedItem === null) {
            recipientHand = "RIGHT HAND";
            break;
        }
        else if (recipient.inventory[slot].name === "LEFT HAND" && recipient.inventory[slot].equippedItem === null) {
            recipientHand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (recipient.inventory[slot].name === "LEFT HAND")
            break;
    }
    if (recipientHand === "") return game.messageHandler.addReply(message, `${recipient.name} does not have a free hand to receive an item.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Now find the item in the giver's inventory.
    var item = null;
    var giverHand = "";
    // Get references to the right and left hand equipment slots so we don't have to iterate through the giver's inventory to find them every time.
    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < giver.inventory.length; slot++) {
        if (giver.inventory[slot].name === "RIGHT HAND")
            rightHand = giver.inventory[slot];
        else if (giver.inventory[slot].name === "LEFT HAND")
            leftHand = giver.inventory[slot];
    }
    // Check for the identifier first.
    if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.identifier !== "" && rightHand.equippedItem.identifier === parsedInput) {
        item = rightHand.equippedItem;
        giverHand = "RIGHT HAND";
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.identifier !== "" && leftHand.equippedItem.identifier === parsedInput) {
        item = leftHand.equippedItem;
        giverHand = "LEFT HAND";
    }
    // Check for the prefab ID next.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.prefab.id === parsedInput) {
        item = rightHand.equippedItem;
        giverHand = "RIGHT HAND";
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.prefab.id === parsedInput) {
        item = leftHand.equippedItem;
        giverHand = "LEFT HAND";
    }
    // Check for the name last.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.name === parsedInput) {
        item = rightHand.equippedItem;
        giverHand = "RIGHT HAND";
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.name === parsedInput) {
        item = leftHand.equippedItem;
        giverHand = "LEFT HAND";
    }
    if (item === null) return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" in either of ${giver.name}'s hands.`);

    giver.give(game, item, giverHand, recipient, recipientHand);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${giver.name} forcefully gave ${item.identifier ? item.identifier : item.prefab.id} to ${recipient.name} in ${giver.location.channel}`);

    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully gave ${giver.name}'s ${item.identifier ? item.identifier : item.prefab.id} to ${recipient.name}.`);

    return;
};
