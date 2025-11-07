const settings = require('../Configs/settings.json');

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
    aliases: ["unstash", "retrieve", "r"],
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
    if (hand === "") return game.messageHandler.addReply(message, `${player.name} does not have a free hand to retrieve an item.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var item = null;
    var container = null;
    var slotName = "";
    const playerItems = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null && (item.quantity > 0 || isNaN(item.quantity)));
    for (let i = 0; i < playerItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (playerItems[i].identifier !== "" && playerItems[i].identifier === parsedInput ||
            playerItems[i].prefab.id === parsedInput ||
            playerItems[i].name === parsedInput) {
            item = playerItems[i];
            container = playerItems[i].container;
            slotName = playerItems[i].slot;
            if (playerItems[i].container === null) continue;
            break;
        }
        // A container was specified.
        if (playerItems[i].identifier !== "" && parsedInput.startsWith(`${playerItems[i].identifier} FROM `) ||
            parsedInput.startsWith(`${playerItems[i].prefab.id} FROM `) ||
            parsedInput.startsWith(`${playerItems[i].name} FROM `)) {
            let containerName;
            if (playerItems[i].identifier !== "" && parsedInput.startsWith(`${playerItems[i].identifier} FROM `))
                containerName = parsedInput.substring(`${playerItems[i].identifier} FROM `.length).trim();
            else if (parsedInput.startsWith(`${playerItems[i].prefab.id} FROM `))
                containerName = parsedInput.substring(`${playerItems[i].prefab.id} FROM `.length).trim();
            else if (parsedInput.startsWith(`${playerItems[i].name} FROM `))
                containerName = parsedInput.substring(`${playerItems[i].name} FROM `.length).trim();

            if (playerItems[i].container !== null) {
                // Slot name was specified.
                if (playerItems[i].container.identifier !== "" && containerName.endsWith(` OF ${playerItems[i].container.identifier}`) ||
                    containerName.endsWith(` OF ${playerItems[i].container.prefab.id}`) ||
                    containerName.endsWith(` OF ${playerItems[i].container.name}`)) {
                    let tempSlotName;
                    if (playerItems[i].container.identifier !== "" && containerName.endsWith(` OF ${playerItems[i].container.identifier}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${playerItems[i].container.identifier}`));
                    else if (containerName.endsWith(` OF ${playerItems[i].container.prefab.id}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${playerItems[i].container.prefab.id}`));
                    else if (containerName.endsWith(` OF ${playerItems[i].container.name}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${playerItems[i].container.name}`));

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
                else if (playerItems[i].container.identifier !== "" && playerItems[i].container.identifier === containerName ||
                    playerItems[i].container.prefab.id === containerName ||
                    playerItems[i].container.name === containerName) {
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
            return game.messageHandler.addReply(message, `Couldn't find "${containerName}" in ${player.name}'s inventory containing "${itemName}".`);
        }
        else return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" in ${player.name}'s inventory.`);
    }
    if (item !== null && container === null) return game.messageHandler.addReply(message, `${item.identifier ? item.identifier : item.prefab.id} is not contained in another item and cannot be unstashed.`);

    player.unstash(game, item, hand, container, slotName);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly unstashed ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} of ${container.identifier} in ${player.location.channel}`);

    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully unstashed ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} of ${container.identifier} for ${player.name}.`);

    return;
};
