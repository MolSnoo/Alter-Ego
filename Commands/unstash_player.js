const settings = include('settings.json');

module.exports.config = {
    name: "unstash_player",
    description: "Moves an inventory item into your hand.",
    details: "Moves an inventory item from another item in your inventory into your hand. You can specify which item to remove it from, if you have "
        + "multiple items with the same name. If the inventory item you choose to move it from has multiple slots for items (such as multiple pockets), "
        + "you can specify which slot you want to take it from as well. If you attempt to unstash a very large item (a sword, for example), "
        + "people in the room with you will see you doing so.",
    usage: `${settings.commandPrefix}unstash laptop\n`
        + `${settings.commandPrefix}retrieve sword from sheath\n`
        + `${settings.commandPrefix}unstash old key from right pocket of pants\n`
        + `${settings.commandPrefix}retrieve water bottle from side pouch of backpack`,
    usableBy: "Player",
    aliases: ["unstash", "retrieve"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        game.messageHandler.addReply(message, "you need to specify an item. Usage:");
        game.messageHandler.addGameMechanicMessage(message.channel, exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable unstash");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

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
    if (hand === "") return game.messageHandler.addReply(message, "you do not have a free hand to retrieve an item. Either drop an item you're currently holding or stash it in one of your equipped items.");
    
    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var item = null;
    var container = null;
    var slotName = "";
    const playerItems = game.inventoryItems.filter(item => item.player.id === player.id && item.prefab !== null && (item.quantity > 0 || isNaN(item.quantity)));
    for (let i = 0; i < playerItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (playerItems[i].name === parsedInput) {
            item = playerItems[i];
            container = playerItems[i].container;
            slotName = playerItems[i].slot;
            if (playerItems[i].container === null) continue;
            break;
        }
        // A container was specified.
        if (parsedInput.startsWith(`${playerItems[i].name} FROM `)) {
            let containerName = parsedInput.substring(`${playerItems[i].name} FROM `.length).trim();
            if (playerItems[i].container !== null) {
                // Slot name was specified.
                if (containerName.endsWith(` OF ${playerItems[i].container.name}`)) {
                    let tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${playerItems[i].container.name}`));
                    if (playerItems[i].container.hasOwnProperty("inventory")) {
                        for (let slot = 0; slot < playerItems[i].container.inventory.length; slot++) {
                            if (playerItems[i].container.inventory[slot].name === tempSlotName && playerItems[i].slot === tempSlotName) {
                                item = playerItems[i];
                                container = playerItems[i].container;
                                slotName = tempSlotName;
                                break;
                            }
                        }
                    }
                    if (item !== null) break;
                }
                // Only a container name was specified.
                else if (playerItems[i].container.name === containerName) {
                    item = playerItems[i];
                    container = playerItems[i].container;
                    slotName = playerItems[i].slot;
                    break;
                }
            }
        }
    }
    if (item === null) {
        if (parsedInput.includes(" FROM ")) {
            let itemName = parsedInput.substring(0, parsedInput.indexOf(" FROM "));
            let containerName = parsedInput.substring(parsedInput.indexOf(" FROM ") + " FROM ".length);
            return game.messageHandler.addReply(message, `couldn't find "${containerName}" in your inventory containing "${itemName}".`);
        }
        else return game.messageHandler.addReply(message, `couldn't find item "${parsedInput}" in your inventory.`);
    }
    if (item !== null && container === null) return game.messageHandler.addReply(message, `${item.name} is not contained in another item and cannot be unstashed.`);

    player.unstash(game, item, hand, container, slotName);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} unstashed ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} of ${container.identifier} in ${player.location.channel}`);

    return;
};
