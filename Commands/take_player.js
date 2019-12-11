const settings = include('settings.json');

module.exports.config = {
    name: "take_player",
    description: "Takes an item and puts it in your inventory.",
    details: "Adds an item from the room you're in to your inventory. You may hold up to 3 items at a time. "
        + "If there are multiple items with the same name in a room, you can specify which object you want to take it from. "
        + "If you're carrying a very large item (a sword, for example), people will see you carrying it when you enter or exit a room.",
    usage: `${settings.commandPrefix}take butcher's knife\n`
        + `${settings.commandPrefix}get first aid kit\n`
        + `${settings.commandPrefix}take pill bottle medicine cabinet\n`
        + `${settings.commandPrefix}get towel benches`,
    usableBy: "Player",
    aliases: ["take", "get"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify an item. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable take");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    /*// First, check if the player has free space in their inventory.
    var freeSlot = -1;
    for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i].name === null) {
            freeSlot = i;
            break;
        }
    }
    if (freeSlot === -1) return message.reply("your inventory is full. You cannot take anymore items until you drop something.");
    */

    // First, check if the player has a free hand.
    var hand = "";
    for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i].name === "RIGHT HAND" && player.inventory[i].equippedItem === null) {
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[i].name === "LEFT HAND" && player.inventory[i].equippedItem === null) {
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (player.inventory[i].name === "LEFT HAND")
            break;
    }
    if (hand === "") return message.reply("you do not have a free hand to take an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var newArgs = parsedInput.split(" FROM ");
    var itemName = newArgs[0].trim();
    newArgs = newArgs[1] ? newArgs[1].split(" OF ") : [];
    var containerName = newArgs[1] ? newArgs[1] : newArgs[0];
    var slotName = newArgs[1] ? newArgs[0] : "";

    // Gather all items in the room with a matching name.
    var items = game.items.filter(item => item.prefab.name === itemName && item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    if (items.length > 0) {
        // Look for the container.
        var matches = [];
        var container = null;
        var item = null;
        // Container name was specified.
        if (containerName !== "" && containerName !== null && containerName !== undefined) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].container !== null && (items[i].container.name === containerName || items[i].container.hasOwnProperty("parentObject") && items[i].container.parentObject.name === containerName))
                    matches.push({ container: items[i].container, slot: items[i].slot, item: items[i] });
            }
            if (matches.length === 0) return message.reply(`couldn't find "${containerName}" containing item "${itemName}".`);

            // Slot name was specified.
            if (slotName !== "" && slotName !== null && slotName !== undefined) {
                for (let i = 0; i < matches.length; i++) {
                    // Only Items have an inventory property, so skip this part if the container is an Object or Puzzle.
                    if (matches[i].container.hasOwnProperty("inventory")) {
                        for (let slot = 0; slot < matches[i].container.inventory.length; slot++) {
                            if (matches[i].container.inventory[slot].name === slotName && matches[i].slot === slotName) {
                                container = matches[i].container;
                                item = matches[i].item;
                                break;
                            }
                        }
                    }
                }
                if (container === null) return message.reply(`couldn't find "${containerName}" with inventory slot "${slotName}".`);
            }
            // Slot name wasn't specified. Pick the first container.
            else {
                item = matches[0].item;
                container = item.container;
                slotName = item.slot;
            }
        }
        // Container name wasn't specified. Select the first item in the room.
        else {
            item = items[0];
            container = item ? item.container : null;
            slotName = item ? item.slot : null;
        }
    }
    if (items.length === 0 || item === null || item === undefined) {
        // Check if the player is trying to take an object.
        const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === itemName)
                return message.reply(`the ${objects[i].name} is not an item.`);
        }
        // If nothing was found at all, tell the player.
        return message.reply(`couldn't find item "${itemName}" in the room.`);
    }
    // If no container was found, make the container the Room.
    if (item !== null && item !== undefined && item.container === null)
        container = item.location;

    console.log(item);
    console.log(container);
    console.log(`"${slotName}"`);

    player.take(game, item, hand, container, slotName);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object or Puzzle.
    if (container.hasOwnProperty("isHidingSpot") || container.hasOwnProperty("solved"))
        game.logChannel.send(`${time} - ${player.name} took ${item.name} from ${container.name} in ${player.location.channel}`);
    // Container is an Item.
    else if (container.hasOwnProperty("inventory"))
        game.logChannel.send(`${time} - ${player.name} took ${item.name} from ${slotName} of ${container.name} in ${player.location.channel}`);
    // Container is a Room.
    else
        game.logChannel.send(`${time} - ${player.name} took ${item.name} from ${player.location.channel}`);

    return;
};
