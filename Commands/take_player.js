const settings = include('settings.json');

const Narration = include(`${settings.dataDir}/Narration.js`);

module.exports.config = {
    name: "take_player",
    description: "Takes an item and puts it in your inventory.",
    details: "Adds an item from the room you're in to your inventory. You must have a free hand to take an item. "
        + "If there are multiple items with the same name in a room, you can specify which object or item you want to take it from. "
        + "Additionally, if the item is contained in another item with multiple inventory slots (such as pockets), you can specify which slot to "
        + "take it from. If you take a very large item (a sword, for example), people will see you pick it up and see you carrying it when you enter or exit a room.",
    usage: `${settings.commandPrefix}take butcher's knife\n`
        + `${settings.commandPrefix}get first aid kit\n`
        + `${settings.commandPrefix}take pill bottle from medicine cabinet\n`
        + `${settings.commandPrefix}get towel from benches\n`
        + `${settings.commandPrefix}take hammer from tool box\n`
        + `${settings.commandPrefix}get key from pants\n`
        + `${settings.commandPrefix}take key from left pocket of pants`,
    usableBy: "Player",
    aliases: ["take", "get"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `you need to specify an item. Usage:\n${exports.config.usage}`);

    const status = player.getAttributeStatusEffects("disable take");
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
    if (hand === "") return game.messageHandler.addReply(message, "you do not have a free hand to take an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var item = null;
    var container = null;
    var slotName = "";
    const roomItems = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    for (let i = 0; i < roomItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (roomItems[i].name === parsedInput) {
            item = roomItems[i];
            container = roomItems[i].container;
            slotName = roomItems[i].slot;
            break;
        }
        // A container was specified.
        if (parsedInput.startsWith(`${roomItems[i].name} FROM `)) {
            let containerName = parsedInput.substring(`${roomItems[i].name} FROM `.length).trim();
            if (roomItems[i].container !== null) {
                // Slot name was specified.
                if (containerName.endsWith(` OF ${roomItems[i].container.name}`)) {
                    let tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItems[i].container.name}`));
                    if (roomItems[i].container.hasOwnProperty("inventory")) {
                        for (let slot = 0; slot < roomItems[i].container.inventory.length; slot++) {
                            if (roomItems[i].container.inventory[slot].name === tempSlotName && roomItems[i].slot === tempSlotName) {
                                item = roomItems[i];
                                container = roomItems[i].container;
                                slotName = tempSlotName;
                                break;
                            }
                        }
                    }
                    if (item !== null) break;
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
                return game.messageHandler.addReply(message, `the ${objects[i].name} is not an item.`);
        }
        // Otherwise, the item wasn't found.
        if (parsedInput.includes(" FROM ")) {
            let itemName = parsedInput.substring(0, parsedInput.indexOf(" FROM "));
            let containerName = parsedInput.substring(parsedInput.indexOf(" FROM ") + " FROM ".length);
            return game.messageHandler.addReply(message, `couldn't find "${containerName}" containing "${itemName}".`);
        }
        else return game.messageHandler.addReply(message, `couldn't find item "${parsedInput}" in the room.`);
    }
    // If no container was found, make the container the Room.
    if (item !== null && item.container === null)
        container = item.location;
    
    let topContainer = container;
    while (topContainer !== null && topContainer.hasOwnProperty("inventory"))
        topContainer = topContainer.container;

    if (topContainer !== null && topContainer.hasOwnProperty("isHidingSpot") && topContainer.autoDeactivate && topContainer.activated)
        return game.messageHandler.addReply(message, `you cannot take items from ${topContainer.name} while it is turned on.`);
    if (item.weight > player.maxCarryWeight) {
        player.notify(game, `You try to take ${item.singleContainingPhrase}, but it is too heavy.`);
        if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} tries to take ${item.singleContainingPhrase}, but it is too heavy for ${player.pronouns.obj} to lift.`).send();
        return;
    }
    else if (player.carryWeight + item.weight > player.maxCarryWeight) return game.messageHandler.addReply(message, `you try to take ${item.singleContainingPhrase}, but you're carrying too much weight.`);

    player.take(game, item, hand, container, slotName);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object or Puzzle.
    if (container.hasOwnProperty("isHidingSpot") || container.hasOwnProperty("solved")) {
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} took ${item.identifier ? item.identifier : item.prefab.id} from ${container.name} in ${player.location.channel}`);
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
    else if (container.hasOwnProperty("inventory"))
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} took ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} of ${container.identifier} in ${player.location.channel}`);
    // Container is a Room.
    else
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} took ${item.identifier ? item.identifier : item.prefab.id} from ${player.location.channel}`);
        
    return;
};
