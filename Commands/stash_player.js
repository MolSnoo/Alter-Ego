const settings = include('settings.json');

module.exports.config = {
    name: "stash_player",
    description: "An example command.",
    details: "Tells you your role.",
    usage: `${settings.commandPrefix}example`,
    usableBy: "Player",
    aliases: ["stash", "store"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify two items. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable stash");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = parsedInput.split(' ');

    // Look for the container item.
    var items = game.inventoryItems.filter(item => item.player.id === player.id);
    var containerItem = null;
    var containerItemSlot = null;
    for (let i = 0; i < items.length; i++) {
        if (items[i].prefab !== null && parsedInput.endsWith(items[i].name) && parsedInput !== items[i].name) {
            if (items[i].inventory.length === 0) return message.reply(`${items[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
            containerItem = items[i];
            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
            // Check if a slot was specified.
            if (parsedInput.endsWith(" OF")) {
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                newArgs = parsedInput.split(' ');
                for (let slot = 0; slot < containerItem.inventory.length; slot++) {
                    if (parsedInput.endsWith(containerItem.inventory[slot].name)) {
                        containerItemSlot = containerItem.inventory[slot];
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItemSlot.name)).trimEnd();
                        break;
                    }
                }
                if (containerItemSlot === null) return message.reply(`couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.name}.`);
            }
            newArgs = parsedInput.split(' ');
            var itemPreposition = newArgs[newArgs.length - 1].toLowerCase();
            newArgs.splice(newArgs.length - 1, 1);
            parsedInput = newArgs.join(' ');
            break;
        }
        else if (parsedInput === items[i].name) {
            message.reply(`you need to specify two items. Usage:`);
            message.channel.send(exports.config.usage);
            return;
        }
    }
    if (containerItem === null) return message.reply(`couldn't find container item "${newArgs[newArgs.length - 1]}".`);

    // Now find the item in the player's inventory.
    var item = null;
    var hand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND" && player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name === parsedInput) {
            item = player.inventory[slot].equippedItem;
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[slot].name === "LEFT HAND" && player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name === parsedInput) {
            item = player.inventory[slot].equippedItem;
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it doesn't have the desired item, neither hand has it. Stop looking.
        else if (player.inventory[slot].name === "LEFT HAND")
            break;
    }
    if (item === null) return message.reply(`couldn't find item "${parsedInput}" in either of your hands. If this item is elsewhere in your inventory, please unequip or unstash it before trying to stash it.`);
    // Make sure item and containerItem aren't the same item.
    if (item.row === containerItem.row) return message.reply(`can't stash ${item.name} ${itemPreposition} itself.`);

    if (containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
    if (item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return message.reply(`${item.name} will not fit in ${containerItemSlot.name} of ${container.name} because it is too large.`);
    else if (item.prefab.size > containerItemSlot.capacity) return message.reply(`${item.name} will not fit in ${container.name} because it is too large.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return message.reply(`${item.name} will not fit in ${containerItemSlot.name} of ${container.name} because there isn't enough space left.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return message.reply(`${item.name} will not fit in ${container.name} because there isn't enough space left.`);

    player.stash(game, item, hand, containerItem, containerItemSlot.name);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${player.name} stashed ${item.name} ${containerItem.prefab.preposition} ${containerItemSlot.name} of ${containerItem.name} in ${player.location.channel}`);

    return;
};
