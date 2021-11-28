const settings = include('settings.json');

const Narration = include(`${settings.dataDir}/Narration.js`);

module.exports.config = {
    name: "give_player",
    description: "Gives an item to another player.",
    details: "Transfers an item from your inventory to another player in the room. The item selected must be in one of your hands. "
        + "The receiving player must also have a free hand, or else they will not be able to receive the item. If a particularly large item "
        + "(a chainsaw, for example) is given, people in the room with you will see you giving it to the recipient.",
    usage: `${settings.commandPrefix}give keiko moldy bread`,
    usableBy: "Player",
    aliases: ["give", "g"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a player and an item. Usage:\n${exports.config.usage}`);

    const status = player.getAttributeStatusEffects("disable give");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // First, find the recipient.
    var recipient = null;
    for (let i = 0; i < player.location.occupants.length; i++) {
        const occupant = player.location.occupants[i];
        if (parsedInput.startsWith(occupant.displayName.toUpperCase()) && !occupant.hasAttribute("hidden")) {
            // Player cannot give to themselves.
            if (occupant.name === player.name) return game.messageHandler.addReply(message, "You can't give to yourself.");

            recipient = occupant;
            parsedInput = parsedInput.substring(occupant.displayName.length).trim();
            break;
        }
    }
    if (recipient === null) return game.messageHandler.addReply(message, `Couldn't find player "${args[0]}" in the room with you. Make sure you spelled it right.`);

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
    if (recipientHand === "") return game.messageHandler.addReply(message, `${recipient.displayName} does not have a free hand to receive an item.`);

    // Find the item in the player's inventory.
    var item = null;
    var giverHand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name === parsedInput) {
            if (player.inventory[slot].name === "RIGHT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                giverHand = "RIGHT HAND";
                break;
            }
            else if (player.inventory[slot].name === "LEFT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                giverHand = "LEFT HAND";
                break;
            }
        }
        // If it's reached the left hand and it doesn't have the desired item, neither hand has it. Stop looking.
        else if (player.inventory[slot].name === "LEFT HAND")
            break;
    }
    if (item === null) return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" in either of your hands. If this item is elsewhere in your inventory, please unequip or unstash it before trying to give it.`);

    if (item.weight > recipient.maxCarryWeight) {
        player.notify(game, `You try to give ${recipient.displayName} ${item.singleContainingPhrase}, but it is too heavy for ${recipient.pronouns.obj}.`);
        if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} tries to give ${item.singleContainingPhrase} to ${recipient.displayName}, but it is too heavy for ${recipient.pronouns.obj} to lift.`).send();
        return;
    }
    else if (recipient.carryWeight + item.weight > recipient.maxCarryWeight) return game.messageHandler.addGameMechanicMessage(message.channel, `you try to give ${recipient.displayName} ${item.singleContainingPhrase}, but ${recipient.pronouns.sbj} ` + (recipient.pronouns.plural ? `are` : `is`) + ` carrying too much weight.`);

    player.give(game, item, giverHand, recipient, recipientHand);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} gave ${item.identifier ? item.identifier : item.prefab.id} to ${recipient.name} in ${player.location.channel}`);

    return;
};
