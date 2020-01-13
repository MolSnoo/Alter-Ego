const settings = include('settings.json');

module.exports.config = {
    name: "drop_player",
    description: "Discards an item from your inventory.",
    details: "Discards an item from your inventory and leaves it in the room you're currently in. "
        + "You can specify where in the room you'd like to leave it by putting the name of an object in the room after the item. "
        + "Not all objects can contain items, but it should be fairly obvious which ones can. If you don't specify an object, "
        + "you will simply leave it on the floor. If you drop a very large item (a sword, for example), "
        + "people in the room with you will see you discard it.",
    usage: `${settings.commandPrefix}drop first aid kit\n`
        + `${settings.commandPrefix}discard basketball\n`
        + `${settings.commandPrefix}drop knife sink\n`
        + `${settings.commandPrefix}discard towel benches`,
    usableBy: "Player",
    aliases: ["drop", "discard"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify an item. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable drop");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = null;

    // Check if the player specified an object.
    const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
    var object = null;
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].name === parsedInput) return message.reply(`you need to specify an item to drop.`);
        if (parsedInput.endsWith(objects[i].name)) {
            if (objects[i].preposition === "") return message.reply(`${objects[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
            object = objects[i];
            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(objects[i].name)).trimEnd();
            // Check if the object has a puzzle attached to it.
            if (object.childPuzzle !== null && (!object.childPuzzle.accessible || !object.childPuzzle.solved))
                return message.reply(`you cannot put items ${object.preposition} ${object.name} right now.`);
            newArgs = parsedInput.split(' ');
            var objectPreposition = newArgs[newArgs.length - 1].toLowerCase();
            newArgs.splice(newArgs.length - 1, 1);
            parsedInput = newArgs.join(' ');
            break;
        }
    }

    // Check if the player specified a container item.
    var items = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    var containerItem = null;
    var containerItemSlot = null;
    for (let i = 0; i < items.length; i++) {
        if (parsedInput.endsWith(items[i].name) && parsedInput !== items[i].name) {
            if (object === null || object !== null && items[i].container !== null && (items[i].container.name === object.name || items[i].container.hasOwnProperty("parentObject") && items[i].container.parentObject.name === object.name)) {
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
        }
    }

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
    if (item === null) return message.reply(`couldn't find item "${parsedInput}" in either of your hands. If this item is elsewhere in your inventory, please unequip or unstash it before trying to drop it.`);

    // Now decide what the container should be.
    var container = null;
    var slotName = "";
    if (object !== null && object.childPuzzle === null && containerItem === null)
        container = object;
    else if (object !== null && object.childPuzzle !== null && object.childPuzzle.accessible && object.childPuzzle.solved && containerItem === null)
        container = object.childPuzzle;
    else if (containerItem !== null) {
        container = containerItem;
        if (containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
        slotName = containerItemSlot.name;
        if (item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return message.reply(`${item.name} will not fit in ${containerItemSlot.name} of ${container.name} because it is too large.`);
        else if (item.prefab.size > containerItemSlot.capacity) return message.reply(`${item.name} will not fit in ${container.name} because it is too large.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return message.reply(`${item.name} will not fit in ${containerItemSlot.name} of ${container.name} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return message.reply(`${item.name} will not fit in ${container.name} because there isn't enough space left.`);
    }
    else {
        const defaultDropOpject = objects.find(object => object.name === settings.defaultDropObject);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return message.reply(`you cannot drop items in this room.`);
        container = defaultDropOpject;
    }

    player.drop(game, item, hand, container, slotName);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object.
    if (container.hasOwnProperty("isHidingSpot"))
        game.logChannel.send(`${time} - ${player.name} dropped ${item.name} ${container.preposition} ${container.name} in ${player.location.channel}`);
    else if (container.hasOwnProperty("solved"))
        game.logChannel.send(`${time} - ${player.name} dropped ${item.name} ${container.parentObject.preposition} ${container.name} in ${player.location.channel}`);
    // Container is an Item.
    else if (container.hasOwnProperty("inventory"))
        game.logChannel.send(`${time} - ${player.name} dropped ${item.name} ${container.prefab.preposition} ${slotName} of ${container.name} in ${player.location.channel}`);
    
    return;
};
