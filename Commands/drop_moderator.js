const settings = require('../Configs/settings.json');

module.exports.config = {
    name: "drop_moderator",
    description: "Drops the given item from a player's inventory.",
    details: "Forcibly drops an item for a player. The item must be in either of the player's hands. You can specify "
        + "where in the room to drop the item into by putting the name of an object or item in the room after the item. "
        + "If you want to discard the item in an item with multiple inventory slots, you can specify which slot to put it in. "
        + `If no object or item is specified, they will drop it on the ${settings.defaultDropObject}. This can be changed in the settings file. `
        + "Only objects and item in the same room as the player can be specified.",
    usage: `${settings.commandPrefix}drop emily's knife\n`
        + `${settings.commandPrefix}drop veronica knife on counter\n`
        + `${settings.commandPrefix}drop colin's fish sticks in oven\n`
        + `${settings.commandPrefix}drop aria yellow key in large purse\n`
        + `${settings.commandPrefix}drop devyn wrench on top rack of tool box`,
    usableBy: "Moderator",
    aliases: ["drop", "discard", "d"],
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

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = null;

    // First, find the item in the player's inventory.
    var item = null;
    var hand = "";
    // Get references to the right and left hand equipment slots so we don't have to iterate through the player's inventory to find them every time.
    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND")
            rightHand = player.inventory[slot];
        else if (player.inventory[slot].name === "LEFT HAND")
            leftHand = player.inventory[slot];
    }
    // Check for the identifier first.
    if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.identifier !== "" &&
        (parsedInput.startsWith(rightHand.equippedItem.identifier + ' ') || rightHand.equippedItem.identifier === parsedInput)) {
        item = rightHand.equippedItem;
        hand = "RIGHT HAND";
        parsedInput = parsedInput.substring(item.identifier.length).trim();
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.identifier !== "" &&
        (parsedInput.startsWith(leftHand.equippedItem.identifier + ' ') || leftHand.equippedItem.identifier === parsedInput)) {
        item = leftHand.equippedItem;
        hand = "LEFT HAND";
        parsedInput = parsedInput.substring(item.identifier.length).trim();
    }
    // Check for the prefab ID next.
    else if (item === null && rightHand.equippedItem !== null && (parsedInput.startsWith(rightHand.equippedItem.prefab.id + ' ') || rightHand.equippedItem.prefab.id === parsedInput)) {
        item = rightHand.equippedItem;
        hand = "RIGHT HAND";
        parsedInput = parsedInput.substring(item.prefab.id.length).trim();
    }
    else if (item === null && leftHand.equippedItem !== null && (parsedInput.startsWith(leftHand.equippedItem.prefab.id + ' ') || leftHand.equippedItem.prefab.id === parsedInput)) {
        item = leftHand.equippedItem;
        hand = "LEFT HAND";
        parsedInput = parsedInput.substring(item.prefab.id.length).trim();
    }
    // Check for the name last.
    else if (item === null && rightHand.equippedItem !== null && (parsedInput.startsWith(rightHand.equippedItem.name + ' ') || rightHand.equippedItem.name === parsedInput)) {
        item = rightHand.equippedItem;
        hand = "RIGHT HAND";
        parsedInput = parsedInput.substring(item.name.length).trim();
    }
    else if (item === null && leftHand.equippedItem !== null && (parsedInput.startsWith(leftHand.equippedItem.name + ' ') || leftHand.equippedItem.name === parsedInput)) {
        item = leftHand.equippedItem;
        hand = "LEFT HAND";
        parsedInput = parsedInput.substring(item.name.length).trim();
    }
    if (item === null) return game.messageHandler.addReply(message, `Couldn't find item "${input}" in either of ${player.name}'s hands.`);
    newArgs = parsedInput.split(' ');

    // Check if an object was specified.
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
            else if (parsedInput === `${newArgs[0]} ${objects[i].name}` && objects[i].preposition === "") return game.messageHandler.addReply(message, `${objects[i].name} cannot hold items.`);
        }
    }

    // Check if a container item was specified.
    var items = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    var containerItem = null;
    var containerItemSlot = null;
    if (parsedInput !== "") {
        for (let i = 0; i < items.length; i++) {
            if (items[i].identifer !== "" && items[i].identifier === parsedInput ||
                items[i].prefab.id === parsedInput ||
                items[i].name === parsedInput) return game.messageHandler.addReply(message, `You need to supply a preposition.`);
            if (items[i].identifier !== "" && parsedInput.endsWith(items[i].identifier) ||
                parsedInput.endsWith(items[i].prefab.id) ||
                parsedInput.endsWith(items[i].name)) {
                if (object === null || object !== null && items[i].container !== null && (items[i].container.name === object.name || items[i].container.hasOwnProperty("parentObject") && items[i].container.parentObject.name === object.name)) {
                    if (items[i].inventory.length === 0) return game.messageHandler.addReply(message, `${items[i].prefab.id} cannot hold items.`);
                    containerItem = items[i];

                    if (items[i].identifer !== "" && parsedInput.endsWith(items[i].identifier))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].identifier)).trimEnd();
                    else if (parsedInput.endsWith(items[i].prefab.id))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].prefab.id)).trimEnd();
                    else if (parsedInput.endsWith(items[i].name))
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
                        if (containerItemSlot === null) return game.messageHandler.addReply(message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier}.`);
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
        if (item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return game.messageHandler.addReply(message, `${item.identifier ? item.identifier : item.prefab.id} will not fit in ${containerItemSlot.name} of ${container.identifier} because it is too large.`);
        else if (item.prefab.size > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${item.identifier ? item.identifier : item.prefab.id} will not fit in ${container.identifier} because it is too large.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return game.messageHandler.addReply(message, `${item.identifier ? item.identifier : item.prefab.id} will not fit in ${containerItemSlot.name} of ${container.identifier} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${item.identifier ? item.identifier : item.prefab.id} will not fit in ${container.identifier} because there isn't enough space left.`);
    }
    else {
        if (parsedInput !== "") return game.messageHandler.addReply(message, `Couldn't find "${parsedInput}" to drop item into.`);
        const defaultDropOpject = objects.find(object => object.name === settings.defaultDropObject);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return game.messageHandler.addReply(message, `There is no default drop object "${settings.defaultDropObject}" in ${player.location.name}.`);
        container = defaultDropOpject;
    }

    let topContainer = container;
    while (topContainer !== null && topContainer.hasOwnProperty("inventory"))
        topContainer = topContainer.container;

    if (topContainer !== null) {
        const topContainerPreposition = topContainer.preposition ? topContainer.preposition : "in";
        if (topContainer.hasOwnProperty("hidingSpotCapacity") && topContainer.autoDeactivate && topContainer.activated)
            return game.messageHandler.addReply(message, `Items cannot be put ${topContainerPreposition} ${topContainer.name} while it is turned on.`);
    }

    player.drop(game, item, hand, container, slotName);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object.
    if (container.hasOwnProperty("hidingSpotCapacity"))
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly dropped ${item.identifier ? item.identifier : item.prefab.id} ${container.preposition} ${container.name} in ${player.location.channel}`);
    // Container is a Puzzle.
    else if (container.hasOwnProperty("solved")) {
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly dropped ${item.identifier ? item.identifier : item.prefab.id} ${container.parentObject.preposition} ${container.name} in ${player.location.channel}`);
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
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly dropped ${item.identifier ? item.identifier : item.prefab.id} ${container.prefab.preposition} ${slotName} of ${container.identifier} in ${player.location.channel}`);

    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully dropped ${item.identifier ? item.identifier : item.prefab.id} for ${player.name}.`);

    return;
};
