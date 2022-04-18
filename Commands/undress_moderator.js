const settings = include('settings.json');

module.exports.config = {
    name: "undress_moderator",
    description: "Unequips and drops all items for a player.",
    details: "Unequips all items the given player has equipped and drops them into a container of your choosing. If no container is chosen, then items will be "
        + `dropped on the ${settings.defaultDropObject}. The given container must have a large enough capacity to hold all of the items in the given player's `
        + "inventory. This command will also drop any items in their hands.",
    usage: `${settings.commandPrefix}undress haru\n`
        + `${settings.commandPrefix}undress yuko locker 1\n`
        + `${settings.commandPrefix}undress aki laundry basket\n`
        + `${settings.commandPrefix}undress stella main pocket of backpack`,
    usableBy: "Moderator",
    aliases: ["undress"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a player. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check if an object was specified.
    const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
    var object = null;
    if (parsedInput !== "") {
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput && objects[i].preposition !== "") {
                object = objects[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(objects[i].name)).trimEnd();
                // Check if the object has a puzzle attached to it.
                if (object.childPuzzle !== null && object.childPuzzle.type !== "weight" && object.childPuzzle.type !== "container" && (!object.childPuzzle.accessible || !object.childPuzzle.solved) && player.hidingSpot !== object.name)
                    return game.messageHandler.addReply(message, `You cannot put items ${object.preposition} ${object.name} right now.`);
                break;
            }
            else if (objects[i].name === parsedInput) return game.messageHandler.addReply(message, `${objects[i].name} cannot hold items.`);
        }
    }

    // Check if the player specified a container item.
    var items = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    var containerItem = null;
    var containerItemSlot = null;
    if (parsedInput !== "") {
        for (let i = 0; i < items.length; i++) {
            if (parsedInput.endsWith(items[i].name)) {
                if (object === null || object !== null && items[i].container !== null && (items[i].container.name === object.name || items[i].container.hasOwnProperty("parentObject") && items[i].container.parentObject.name === object.name)) {
                    if (items[i].inventory.length === 0) return game.messageHandler.addReply(message, `${items[i].prefab.id} cannot hold items.`);
                    containerItem = items[i];
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    // Check if a slot was specified.
                    if (parsedInput.endsWith(" OF")) {
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                        for (let slot = 0; slot < containerItem.inventory.length; slot++) {
                            if (parsedInput.endsWith(containerItem.inventory[slot].name)) {
                                containerItemSlot = containerItem.inventory[slot];
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItemSlot.name)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return game.messageHandler.addReply(message, `Couldn't find "${parsedInput}" of ${containerItem.name}.`);
                    }
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
        let totalSize = 0;
        for (let i = 0; i < player.inventory.length; i++) {
            if (player.inventory[i].equippedItem !== null)
                totalSize += player.inventory[i].equippedItem.prefab.size;
        }
        if (totalSize > containerItemSlot.capacity && container.inventory.length !== 1) return game.messageHandler.addReply(message, `${player.name}'s inventory will not fit in ${containerItemSlot.name} of ${container.name} because it is too large.`);
        else if (totalSize > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${player.name}'s inventory will not fit in ${container.name} because it is too large.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity && container.inventory.length !== 1) return game.messageHandler.addReply(message, `${player.name}'s inventory will not fit in ${containerItemSlot.name} of ${container.name} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${player.name}'s inventory will not fit in ${container.name} because there isn't enough space left.`);
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

    var rightHand = 0;
    // First, drop the items in the player's hands.
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND") rightHand = slot;
        if (player.inventory[slot].name === "RIGHT HAND" && player.inventory[slot].equippedItem !== null)
            player.drop(game, player.inventory[slot].equippedItem, "RIGHT HAND", container, slotName, false);
        else if (player.inventory[slot].name === "LEFT HAND" && player.inventory[slot].equippedItem !== null)
            player.drop(game, player.inventory[slot].equippedItem, "LEFT HAND", container, slotName, false);
    }
    // Now, unequip all equipped items.
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.prefab.equippable) {
            player.unequip(game, player.inventory[slot].equippedItem, player.inventory[slot].name, "RIGHT HAND", bot, false);
            player.drop(game, player.inventory[rightHand].equippedItem, "RIGHT HAND", container, slotName, false);
        }
    }

    player.notify(game, `You undress.`);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object.
    if (container.hasOwnProperty("hidingSpotCapacity"))
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcefully undressed into ${container.name} in ${player.location.channel}`);
    // Container is a Puzzle.
    else if (container.hasOwnProperty("solved")) {
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcefully undressed into ${container.name} in ${player.location.channel}`);
        // Container is a weight puzzle.
        if (container.type === "weight") {
            const containerItems = game.items.filter(item => item.location.name === container.location.name && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
            const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            const misc = {
                command: "drop",
                input: input
            };
            player.attemptPuzzle(bot, game, container, null, weight.toString(), "drop", misc);
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
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcefully undressed into ${slotName} of ${container.identifier} in ${player.location.channel}`);

    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully undressed ${player.name}.`);

    return;
};
