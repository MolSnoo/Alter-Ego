const settings = include('Configs/settings.json');

module.exports.config = {
    name: "drop_player",
    description: "Discards an item from your inventory.",
    details: "Discards an item from your inventory and leaves it in the room you're currently in. The item you want to discard must be in either of your hands. "
        + "You can specify where in the room you'd like to leave it by putting the name of an object or item in the room after the item. "
        + "Not all objects and items can contain items, but it should be fairly obvious which ones can. If you want to discard it in an item with multiple "
        + "inventory slots (such as pockets), you can specify which slot to put it in. If you don't specify an object or item, you will simply leave it on the floor. "
        + "If you drop a very large item (a sword, for example), people in the room with you will see you discard it.",
    usage: `${settings.commandPrefix}drop first aid kit\n`
        + `${settings.commandPrefix}discard basketball\n`
        + `${settings.commandPrefix}drop knife in sink\n`
        + `${settings.commandPrefix}discard towel on benches\n`
        + `${settings.commandPrefix}drop key in right pocket of skirt\n`
        + `${settings.commandPrefix}discard wrench on top rack of tool box`,
    usableBy: "Player",
    aliases: ["drop", "discard", "d"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify an item. Usage:\n${exports.config.usage}`);

    const status = player.getAttributeStatusEffects("disable drop");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = null;

    // First, find the item in the player's inventory.
    var item = null;
    var hand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].equippedItem !== null && (parsedInput.startsWith(player.inventory[slot].equippedItem.name + ' ') || player.inventory[slot].equippedItem.name === parsedInput)) {
            if (player.inventory[slot].name === "RIGHT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                hand = "RIGHT HAND";
                break;
            }
            else if (player.inventory[slot].name === "LEFT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                hand = "LEFT HAND";
                break;
            }
        }
        // If it's reached the left hand and it doesn't have the desired item, neither hand has it. Stop looking.
        else if (player.inventory[slot].name === "LEFT HAND")
            break;
    }
    if (item !== null) {
        parsedInput = parsedInput.substring(item.name.length).trim();
        newArgs = parsedInput.split(' ');
    }
    else return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" in either of your hands. If this item is elsewhere in your inventory, please unequip or unstash it before trying to drop it.`);

    // Check if the player specified an object.
    const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
    var object = null;
    if (parsedInput !== "") {
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput) return game.messageHandler.addReply(message, `You need to supply a preposition.`);
            if ((parsedInput === `${objects[i].preposition.toUpperCase()} ${objects[i].name}` || parsedInput === `IN ${objects[i].name}`) && objects[i].preposition !== "") {
                object = objects[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(objects[i].name)).trimEnd();
                // Check if the object has a puzzle attached to it.
                if (object.childPuzzle !== null && object.childPuzzle.type !== "weight" && object.childPuzzle.type !== "container" && (!object.childPuzzle.accessible || !object.childPuzzle.solved) && player.hidingSpot !== object.name)
                    return game.messageHandler.addReply(message, `You cannot put items ${object.preposition} ${object.name} right now.`);
                newArgs = parsedInput.split(' ');
                newArgs.splice(newArgs.length - 1, 1);
                parsedInput = newArgs.join(' ');
                break;
            }
            else if (parsedInput === `${newArgs[0]} ${objects[i].name}` && objects[i].preposition === "") return game.messageHandler.addReply(message, `${objects[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
        }
    }

    // Check if the player specified a container item.
    var items = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    var containerItem = null;
    var containerItemSlot = null;
    if (parsedInput !== "") {
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput) return game.messageHandler.addReply(message, `You need to supply a preposition.`);
            if (parsedInput.endsWith(items[i].name) && parsedInput !== items[i].name) {
                if (object === null || object !== null && items[i].container !== null && (items[i].container.name === object.name || items[i].container.hasOwnProperty("parentObject") && items[i].container.parentObject.name === object.name)) {
                    if (items[i].inventory.length === 0) return game.messageHandler.addReply(message, `${items[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
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
                        if (containerItemSlot === null) return game.messageHandler.addReply(message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.name}.`);
                    }
                    newArgs = parsedInput.split(' ');
                    newArgs.splice(newArgs.length - 1, 1);
                    parsedInput = newArgs.join(' ');
                    break;
                }
            }
        }
    }

    // Now decide what the container should be.
    var container = null;
    var slotName = "";
    if (object !== null && object.childPuzzle === null && containerItem === null)
        container = object;
    else if (object !== null && object.childPuzzle !== null && (object.childPuzzle.type === "weight" || object.childPuzzle.type === "container" || object.childPuzzle.accessible && object.childPuzzle.solved || player.hidingSpot === object.name) && containerItem === null)
        container = object.childPuzzle;
    else if (containerItem !== null) {
        container = containerItem;
        if (containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
        slotName = containerItemSlot.name;
        if (item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return game.messageHandler.addReply(message, `${item.name} will not fit in ${containerItemSlot.name} of ${container.name} because it is too large.`);
        else if (item.prefab.size > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${item.name} will not fit in ${container.name} because it is too large.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return game.messageHandler.addReply(message, `${item.name} will not fit in ${containerItemSlot.name} of ${container.name} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${item.name} will not fit in ${container.name} because there isn't enough space left.`);
    }
    else {
        if (parsedInput !== "") return game.messageHandler.addReply(message, `Couldn't find "${parsedInput}" to drop item into.`);
        const defaultDropOpject = objects.find(object => object.name === settings.defaultDropObject);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return game.messageHandler.addReply(message, `You cannot drop items in this room.`);
        container = defaultDropOpject;
    }

    let topContainer = container;
    while (topContainer !== null && topContainer.hasOwnProperty("inventory"))
        topContainer = topContainer.container;

    if (topContainer !== null) {
        const topContainerPreposition = topContainer.preposition ? topContainer.preposition : "in";
        if (topContainer.hasOwnProperty("hidingSpotCapacity") && topContainer.autoDeactivate && topContainer.activated)
            return game.messageHandler.addReply(message, `You cannot put items ${topContainerPreposition} ${topContainer.name} while it is turned on.`);
    }
    const hiddenStatus = player.getAttributeStatusEffects("hidden");
    if (hiddenStatus.length > 0) {
        if (topContainer !== null && topContainer.hasOwnProperty("parentObject"))
            topContainer = topContainer.parentObject;

        if (topContainer === null || topContainer.hasOwnProperty("hidingSpotCapacity") && topContainer.name !== player.hidingSpot)
            return game.messageHandler.addReply(message, `You cannot do that because you are **${hiddenStatus[0].name}**.`);
    }

    player.drop(game, item, hand, container, slotName);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object.
    if (container.hasOwnProperty("hidingSpotCapacity"))
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} dropped ${item.identifier ? item.identifier : item.prefab.id} ${container.preposition} ${container.name} in ${player.location.channel}`);
    // Container is a Puzzle.
    else if (container.hasOwnProperty("solved")) {
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} dropped ${item.identifier ? item.identifier : item.prefab.id} ${container.parentObject.preposition} ${container.name} in ${player.location.channel}`);
        // Container is a weight puzzle.
        if (container.type === "weight") {
            const containerItems = game.items.filter(item => item.location.name === container.location.name && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
            const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            const misc = {
                command: "drop",
                input: input
            };
            player.attemptPuzzle(bot, game, container, item, weight.toString(), "drop", misc);
        }
        // Container is a container puzzle.
        else if (container.type === "container") {
            const containerItems = game.items.filter(item => item.location.name === container.location.name && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0).sort(function (a, b) {
                if (a.prefab.id < b.prefab.id) return -1;
                if (a.prefab.id > b.prefab.id) return 1;
                return 0;
            });
            const misc = {
                command: "drop",
                input: input
            };
            player.attemptPuzzle(bot, game, container, item, containerItems, "drop", misc);
        }
    }
    // Container is an Item.
    else if (container.hasOwnProperty("inventory"))
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} dropped ${item.identifier ? item.identifier : item.prefab.id} ${container.prefab.preposition} ${slotName} of ${container.identifier} in ${player.location.channel}`);
    
    return;
};
