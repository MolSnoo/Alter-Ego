const settings = require('../Configs/settings.json');

module.exports.config = {
    name: "unequip_moderator",
    description: "Unequips an item for a player.",
    details: "Unequips an item the given player currently has equipped. The unequipped item will be placed in one of the player's free hands. "
        + "You can specify which equipment slot you want the item to be unequipped from. Any item can be unequipped, whether it's equippable "
        + "or not. People in the room will see the player unequip an item, regardless of its size.",
    usage: `${settings.commandPrefix}unequip lavris's mask\n`
        + `${settings.commandPrefix}unequip keiko lab coat\n`
        + `${settings.commandPrefix}unequip cara's sweater from shirt\n`
        + `${settings.commandPrefix}unequip aria large purse from glasses`,
    usableBy: "Moderator",
    aliases: ["unequip", "u"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a player and an item. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    // First, check if the player has a free hand.
    var hand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND" && player.inventory[slot].equippedItem === null) {
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[slot].name === "LEFT HAND" && player.inventory[slot].equippedItem === null) {
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (player.inventory[slot].name === "LEFT HAND")
            break;
    }
    if (hand === "") return game.messageHandler.addReply(message, `${player.name} does not have a free hand to unequip an item.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var item = null;
    var slotName = "";
    for (let i = 0; i < player.inventory.length; i++) {
        if (parsedInput.endsWith(` FROM ${player.inventory[i].name}`)) {
            slotName = player.inventory[i].name;
            let itemName = parsedInput.substring(0, parsedInput.lastIndexOf(` FROM ${slotName}`)).trim();
            if (player.inventory[i].equippedItem === null) return game.messageHandler.addReply(message, `Nothing is equipped to ${slotName}.`);
            if (player.inventory[i].equippedItem.identifier !== "" && player.inventory[i].equippedItem.identifier === itemName ||
                player.inventory[i].equippedItem.prefab.id === itemName ||
                player.inventory[i].equippedItem.name === itemName) {
                item = player.inventory[i].equippedItem;
                break;
            }
            else return game.messageHandler.addReply(message, `Couldn't find "${itemName}" equipped to ${slotName}.`);
        }
        else if (player.inventory[i].equippedItem !== null &&
            (player.inventory[i].equippedItem.identifier !== "" && player.inventory[i].equippedItem.identifier === parsedInput ||
            player.inventory[i].equippedItem.prefab.id === parsedInput ||
            player.inventory[i].equippedItem.name === parsedInput)) {
            item = player.inventory[i].equippedItem;
            slotName = player.inventory[i].name;
            break;
        }
    }
    if (slotName === "RIGHT HAND" || slotName === "LEFT HAND")
        return game.messageHandler.addReply(message, `Cannot unequip items from either of ${player.name}'s hands. To get rid of this item, use the drop command.`);
    if (parsedInput.includes(" FROM ") && slotName === "") {
        slotName = parsedInput.substring(parsedInput.lastIndexOf(" FROM ") + " FROM ".length).trim();
        return game.messageHandler.addReply(message, `Couldn't find equipment slot "${slotName}".`);
    }
    if (item === null) return game.messageHandler.addReply(message, `Couldn't find equipped item "${parsedInput}".`);

    player.unequip(game, item, slotName, hand, bot);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly unequipped ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} in ${player.location.channel}`);

    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully unequipped ${item.identifier ? item.identifier : item.prefab.id} from ${player.name}'s ${slotName}.`);

    return;
};
