const settings = include('settings.json');

module.exports.config = {
    name: "stash_moderator",
    description: "Stores a player's inventory item inside another inventory item.",
    details: "Moves an item from the given player's hand to another item in their inventory. You can specify any item in their inventory "
        + "that has the capacity to hold items. If the inventory item you choose has multiple slots for items (such as multiple pockets), "
        + "you can specify which slot you want to store the item in. Note that each slot has a maximum capacity that it can hold, so if it's "
        + "too full or too small to contain the item you're trying to stash, you won't be able to stash it there. If you attempt to stash a "
        + "very large item (a sword, for example), people in the room with the player will see them doing so.",
    usage: `${settings.commandPrefix}stash vivian laptop in satchel\n`
        + `${settings.commandPrefix}store nero's sword in sheath\n`
        + `${settings.commandPrefix}stash antimony's old key in right pocket of pants\n`
        + `${settings.commandPrefix}store cassie water bottle in side pouch of backpack`,
    usableBy: "Moderator",
    aliases: ["stash", "store"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 3) {
        message.reply("you need to specify a player and two items. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return message.reply(`player "${args[0]}" not found.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = parsedInput.split(' ');

    // Look for the container item.
    var items = game.inventoryItems.filter(item => item.player.id === player.id);
    var containerItem = null;
    var containerItemSlot = null;
    for (let i = 0; i < items.length; i++) {
        if (items[i].prefab !== null && parsedInput.endsWith(items[i].name) && parsedInput !== items[i].name) {
            if (items[i].inventory.length === 0) return message.reply(`${items[i].name} cannot hold items.`);
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
    if (item === null) return message.reply(`couldn't find item "${parsedInput}" in either of ${player.name}'s hands.`);
    // Make sure item and containerItem aren't the same item.
    if (item.row === containerItem.row) return message.reply(`can't stash ${item.name} ${itemPreposition} itself.`);

    if (containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
    if (item.prefab.size > containerItemSlot.capacity && containerItem.inventory.length !== 1) return message.reply(`${item.name} will not fit in ${containerItemSlot.name} of ${containerItem.name} because it is too large.`);
    else if (item.prefab.size > containerItemSlot.capacity) return message.reply(`${item.name} will not fit in ${containerItem.name} because it is too large.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && containerItem.inventory.length !== 1) return message.reply(`${item.name} will not fit in ${containerItemSlot.name} of ${containerItem.name} because there isn't enough space left.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return message.reply(`${item.name} will not fit in ${containerItem.name} because there isn't enough space left.`);

    player.stash(game, item, hand, containerItem, containerItemSlot.name);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${player.name} forcefully stashed ${item.name} ${containerItem.prefab.preposition} ${containerItemSlot.name} of ${containerItem.name} in ${player.location.channel}`);

    message.channel.send(`Successfully stashed ${item.name} ${containerItem.prefab.preposition} ${containerItemSlot.name} of ${containerItem.name} for ${player.name}.`);

    return;
};
