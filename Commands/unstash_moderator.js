const settings = include('settings.json');

module.exports.config = {
    name: "unstash_moderator",
    description: "Moves an inventory item into a player's hand.",
    details: "Moves a player's inventory item from another item in their inventory into their hand. You can specify which item to remove it from, if they have "
        + "multiple items with the same name. If the inventory item you choose to move it from has multiple slots for items (such as multiple pockets), "
        + "you can specify which slot you want to take it from as well. If you attempt to unstash a very large item (a sword, for example), "
        + "people in the room with the player will see them doing so.",
    usage: `${settings.commandPrefix}unstash vivian's laptop\n`
        + `${settings.commandPrefix}retrieve nero sword from sheath\n`
        + `${settings.commandPrefix}unstash antimony's old key from right pocket of pants\n`
        + `${settings.commandPrefix}retrieve cassie water bottle from side pouch of backpack`,
    usableBy: "Moderator",
    aliases: ["unstash", "retrieve"],
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
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
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
    if (hand === "") return message.reply(`${player.name} does not have a free hand to retrieve an item.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = parsedInput.split(" FROM ");
    var itemName = newArgs[0].trim();
    newArgs = newArgs[1] ? newArgs[1].split(" OF ") : [];
    var containerName = newArgs[1] ? newArgs[1] : newArgs[0];
    var slotName = newArgs[1] ? newArgs[0] : "";

    // Gather all items in the player's inventory with a matching name.
    var items = game.inventoryItems.filter(item => item.player.id === player.id && item.prefab !== null && item.prefab.name === itemName && (item.quantity > 0 || isNaN(item.quantity)));
    if (items.length > 0) {
        // Look for the container.
        var matches = [];
        var container = null;
        var item = null;
        // Container name was specified.
        if (containerName !== "" && containerName !== null && containerName !== undefined) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].container !== null && items[i].container.name === containerName)
                    matches.push({ container: items[i].container, slot: items[i].slot, item: items[i] });
            }
            if (matches.length === 0) return message.reply(`couldn't find "${containerName}" in ${player.name}'s inventory containing "${itemName}".`);

            // Slot name was specified.
            if (slotName !== "" && slotName !== null && slotName !== undefined) {
                for (let i = 0; i < matches.length; i++) {
                    for (let slot = 0; slot < matches[i].container.inventory.length; slot++) {
                        if (matches[i].container.inventory[slot].name === slotName && matches[i].slot === slotName) {
                            container = matches[i].container;
                            item = matches[i].item;
                            break;
                        }
                    }
                }
                if (container === null) return message.reply(`couldn't find "${containerName}" in ${player.name}'s inventory with inventory slot "${slotName}".`);
            }
            // Slot name wasn't specified. Pick the first container.
            else {
                item = matches[0].item;
                container = item.container;
                slotName = item.slot;
            }
        }
        // Container name wasn't specified. Select the first item in the player's inventory with a matching name.
        else {
            item = items[0];
            container = item ? item.container : null;
            slotName = item ? item.slot : null;
        }
    }
    if (items.length === 0 || item === null || item === undefined) return message.reply(`couldn't find item "${itemName}" in ${player.name}'s inventory.`);
    if (item !== null && item !== undefined && container === null) return message.reply(`${item.name} is not contained in another item and cannot be unstashed.`);

    player.unstash(game, item, hand, container, slotName);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${player.name} forcefully unstashed ${item.name} from ${slotName} of ${container.name} in ${player.location.channel}`);

    message.channel.send(`Successfully unstashed ${item.name} from ${slotName} of ${container.name} for ${player.name}.`);

    return;
};
