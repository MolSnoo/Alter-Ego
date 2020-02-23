const settings = include('settings.json');

module.exports.config = {
    name: "take_moderator",
    description: "Takes the given item for a player.",
    details: "Forcefully takes an item for a player. The player must have a free hand to take an item. You can specify "
        + "which object or item to take the item from, but only items in the same room as the player can be taken. Additionally, if "
        + "the item is contained in another item with multiple inventory slots (such as pockets), you can specify which slot to take it from.",
    usage: `${settings.commandPrefix}take nero food\n`
        + `${settings.commandPrefix}take livida food from floor\n`
        + `${settings.commandPrefix}take cleo sword from desk\n`
        + `${settings.commandPrefix}take taylor hammer from tool box\n`
        + `${settings.commandPrefix}take aria green key from large purse\n`
        + `${settings.commandPrefix}take veronica game system from main pocket of backpack`,
    usableBy: "Moderator",
    aliases: ["take"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2) {
        message.reply("you need to specify a player and an item. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return message.reply(`player "${args[0]}" not found.`);

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
    if (hand === "") return message.reply(`${player.name} does not have a free hand to take an item.`);

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
    // If nothing was found at all, return.
    if (items.length === 0 || item === null || item === undefined) return message.reply(`couldn't find item "${itemName}" in the room.`);
    // If no container was found, make the container the Room.
    if (item !== null && item !== undefined && item.container === null)
        container = item.location;

    player.take(game, item, hand, container, slotName);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object or Puzzle.
    if (container.hasOwnProperty("isHidingSpot") || container.hasOwnProperty("solved"))
        game.logChannel.send(`${time} - ${player.name} forcefully took ${item.name} from ${container.name} in ${player.location.channel}`);
    // Container is an Item.
    else if (container.hasOwnProperty("inventory"))
        game.logChannel.send(`${time} - ${player.name} forcefully took ${item.name} from ${slotName} of ${container.name} in ${player.location.channel}`);
    // Container is a Room.
    else
        game.logChannel.send(`${time} - ${player.name} forcefully took ${item.name} from ${player.location.channel}`);

    message.channel.send(`Successfully took ${item.name} for ${player.name}.`);

    return;
};
