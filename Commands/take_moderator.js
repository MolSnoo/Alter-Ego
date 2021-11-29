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
    aliases: ["take", "get", "t"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a player and an item. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
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
    if (hand === "") return game.messageHandler.addReply(message, `${player.name} does not have a free hand to take an item.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var item = null;
    var container = null;
    var slotName = "";
    const roomItems = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    for (let i = 0; i < roomItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (roomItems[i].identifier !== "" && roomItems[i].identifier === parsedInput ||
            roomItems[i].prefab.id === parsedInput ||
            roomItems[i].name === parsedInput) {
            item = roomItems[i];
            container = roomItems[i].container;
            slotName = roomItems[i].slot;
            break;
        }
        // A container was specified.
        if (roomItems[i].identifier !== "" && parsedInput.startsWith(`${roomItems[i].identifier} FROM `) ||
            parsedInput.startsWith(`${roomItems[i].prefab.id} FROM `) ||
            parsedInput.startsWith(`${roomItems[i].name} FROM `)) {
            let containerName;
            if (roomItems[i].identifier !== "" && parsedInput.startsWith(`${roomItems[i].identifier} FROM `))
                containerName = parsedInput.substring(`${roomItems[i].identifier} FROM `.length).trim();
            else if (parsedInput.startsWith(`${roomItems[i].prefab.id} FROM `))
                containerName = parsedInput.substring(`${roomItems[i].prefab.id} FROM `.length).trim();
            else if (parsedInput.startsWith(`${roomItems[i].name} FROM `))
                containerName = parsedInput.substring(`${roomItems[i].name} FROM `.length).trim();

            if (roomItems[i].container !== null) {
                // Slot name was specified.
                if (roomItems[i].container.hasOwnProperty("prefab") &&
                        (roomItems[i].container.identifier !== "" && containerName.endsWith(` OF ${roomItems[i].container.identifier}`) ||
                        containerName.endsWith(` OF ${roomItems[i].container.prefab.id}`) ||
                        containerName.endsWith(` OF ${roomItems[i].container.name}`))) {
                    let tempSlotName;
                    if (roomItems[i].container.identifier !== "" && containerName.endsWith(` OF ${roomItems[i].container.identifier}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItems[i].container.identifier}`));
                    else if (containerName.endsWith(` OF ${roomItems[i].container.prefab.id}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItems[i].container.prefab.id}`));
                    else if (containerName.endsWith(` OF ${roomItems[i].container.name}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItems[i].container.name}`));

                    for (let slot = 0; slot < roomItems[i].container.inventory.length; slot++) {
                        if (roomItems[i].container.inventory[slot].name === tempSlotName && roomItems[i].slot === tempSlotName) {
                            item = roomItems[i];
                            container = roomItems[i].container;
                            slotName = tempSlotName;
                            break;
                        }
                    }
                    if (item !== null) break;
                }
                // A slot name wasn't specified, but the container is an item.
                else if (roomItems[i].container.hasOwnProperty("prefab") &&
                        (roomItems[i].container.identifier !== "" && roomItems[i].container.identifier === containerName ||
                        roomItems[i].container.prefab.id === containerName ||
                        roomItems[i].container.name === containerName)) {
                    item = roomItems[i];
                    container = roomItems[i].container;
                    slotName = roomItems[i].slot;
                }
                // A puzzle's parent object was specified.
                else if (roomItems[i].container.hasOwnProperty("parentObject") && roomItems[i].container.parentObject.name === containerName) {
                    item = roomItems[i];
                    container = roomItems[i].container;
                    break;
                }
                // Only a container name was specified.
                else if (roomItems[i].container.name === containerName) {
                    item = roomItems[i];
                    container = roomItems[i].container;
                    slotName = roomItems[i].slot;
                    break;
                }
            }
        }
    }
    if (item === null) {
        // Check if the player is trying to take an object.
        const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput)
                return game.messageHandler.addReply(message, `The ${objects[i].name} is not an item.`);
        }
        // Otherwise, the item wasn't found.
        if (parsedInput.includes(" FROM ")) {
            let itemName = parsedInput.substring(0, parsedInput.indexOf(" FROM "));
            let containerName = parsedInput.substring(parsedInput.indexOf(" FROM ") + " FROM ".length);
            return game.messageHandler.addReply(message, `Couldn't find "${containerName}" containing "${itemName}".`);
        }
        else return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" in the room.`);
    }
    // If no container was found, make the container the Room.
    if (item !== null && item.container === null)
        container = item.location;

    let topContainer = container;
    while (topContainer !== null && topContainer.hasOwnProperty("inventory"))
        topContainer = topContainer.container;

    if (topContainer !== null && topContainer.hasOwnProperty("isHidingSpot") && topContainer.autoDeactivate && topContainer.activated)
        return game.messageHandler.addReply(message, `Items cannot be taken from ${topContainer.name} while it is turned on.`);

    player.take(game, item, hand, container, slotName);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object or Puzzle.
    if (container !== null && (container.hasOwnProperty("isHidingSpot") || container.hasOwnProperty("solved"))) {
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcefully took ${item.identifier ? item.identifier : item.prefab.id} from ${container.name} in ${player.location.channel}`);
        // Container is a weight puzzle.
        if (container.hasOwnProperty("solved") && container.type === "weight") {
            const containerItems = game.items.filter(item => item.location.name === container.location.name && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
            const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            const misc = {
                command: "take",
                input: input
            };
            player.attemptPuzzle(bot, game, container, item, weight.toString(), "take", misc);
        }
    }
    // Container is an Item.
    else if (container !== null && container.hasOwnProperty("inventory"))
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcefully took ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} of ${container.identifier} in ${player.location.channel}`);
    // Container is a Room.
    else
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcefully took ${item.identifier ? item.identifier : item.prefab.id} from ${player.location.channel}`);

    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully took ${item.identifier ? item.identifier : item.prefab.id} for ${player.name}.`);

    return;
};
