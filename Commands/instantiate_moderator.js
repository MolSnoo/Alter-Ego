const settings = include('settings.json');
const itemManager = include(`${settings.modulesDir}/itemManager.js`);

module.exports.config = {
    name: "instantiate_moderator",
    description: "Generates an item.",
    details: "Generates an item in the specified location on the map or in the given player's inventory. The prefab ID must be given. A quantity can also be specified.\n\n"
        + "In order to instantiate an item, the name of the room must be given at the end, following \"at\". The name of the container it will be created in "
        + "must also be specified. If the container is an object with a child puzzle, the item will be instantiated in that puzzle. If the container is another item, "
        + "the name of the item or its container identifier can be used. The name of the inventory slot to instantiate the item in can also be specified.\n\n"
        + "To instantiate an inventory item, the name of the player must be given followed by \"'s\". A container item can be specified, as well as which slot to "
        + "instantiate the item into. The player will not be notified if a container item is specified. An equipment slot can also be specified instead of a container item. "
        + "The player will be notified of obtaining the item in this case, and the prefab's equipped commands will be run.",
    usage: `${settings.commandPrefix}instantiate raw fish on floor at beach\n`
        + `${settings.commandPrefix}create pickaxe in locker 1 at mining hub\n`
        + `${settings.commandPrefix}generate 3 empty drain cleaner in cupboards at kitchen\n`
        + `${settings.commandPrefix}instantiate green book in main pocket of large backpack 1 at dorm library\n`
        + `${settings.commandPrefix}create 4 screwdriver in tool box at beach house\n`
        + `${settings.commandPrefix}generate katana in nero's right hand\n`
        + `${settings.commandPrefix}instantiate gorilla mask on seamus's face\n`
        + `${settings.commandPrefix}create laptop in vivian's vivians satchel\n`
        + `${settings.commandPrefix}generate 2 shotput ball in cassie's main pocket of large backpack`,
    usableBy: "Moderator",
    aliases: ["instantiate", "create", "generate"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 4) {
        game.messageHandler.addReply(message, 'not enough arguments given. Usage:');
        game.messageHandler.addGameMechanicMessage(message.channel, exports.config.usage);
        return;
    }

    var quantity = 1;
    if (!isNaN(args[0])) {
        quantity = parseInt(args[0]);
        args.splice(0, 1);
    }

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    const undashedInput = parsedInput.replace(/-/g, " ");

    // Some prefabs might have similar names. Make a list of all the ones that are found at the beginning of parsedInput.
    var prefab = null;
    var matches = [];
    for (let i = 0; i < game.prefabs.length; i++) {
        if (parsedInput.startsWith(`${game.prefabs[i].id} `))
            matches.push(game.prefabs[i]);
    }

    let room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        const parsedRoomName = game.rooms[i].name.toUpperCase().replace(/-/g, " ");
        if (undashedInput.endsWith(` AT ${parsedRoomName}`)) {
            room = game.rooms[i];
            parsedInput = parsedInput.substring(0, undashedInput.lastIndexOf(` AT ${parsedRoomName}`));
            break;
        }
    }

    var player = null;
    // Room was found. Look for the container in it.
    if (room !== null) {
        // Check if an object was specified.
        var object = null;
        const objects = game.objects.filter(object => object.location.name === room.name && object.accessible);
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput) return game.messageHandler.addReply(message, `you need to supply a prefab and a preposition.`);
            if (parsedInput.endsWith(`${objects[i].preposition.toUpperCase()} ${objects[i].name}`) || parsedInput.endsWith(`IN ${objects[i].name}`)) {
                if (objects[i].preposition === "") return game.messageHandler.addReply(message, `${objects[i].name} cannot hold items.`);
                object = objects[i];
                if (parsedInput.endsWith(`${objects[i].preposition.toUpperCase()} ${objects[i].name}`))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(`${objects[i].preposition.toUpperCase()} ${objects[i].name}`)).trimEnd();
                else if (parsedInput.endsWith(`IN ${objects[i].name}`))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(`IN ${objects[i].name}`)).trimEnd();
                else
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(objects[i].name)).trimEnd();
                break;
            }
        }

        let containerItem = null;
        let containerItemSlot = null;
        if (object === null) {
            // Check if a container item was specified.
            const items = game.items.filter(item => item.location.name === room.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
            for (let i = 0; i < items.length; i++) {
                if (items[i].identifier === parsedInput || items[i].name === parsedInput) return game.messageHandler.addReply(message, `you need to supply a prefab and a preposition.`);
                if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].name)) {
                    if (items[i].inventory.length === 0 || items[i].prefab.preposition === "") return game.messageHandler.addReply(message, `${items[i].identifier ? items[i].identifier : items[i].name} cannot hold items.`);
                    containerItem = items[i];

                    if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "")
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].identifier)).trimEnd();
                    else if (parsedInput.endsWith(items[i].name))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    let newArgs = parsedInput.split(' ');
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
                        if (containerItemSlot === null) return game.messageHandler.addReply(message, `couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);
                    }
                    if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                    else if (parsedInput.endsWith(" IN"))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                    break;
                }
            }
            if (containerItem !== null && containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
        }

        // Now decide what the container should be.
        let container = null;
        let slotName = "";
        if (object !== null && object.childPuzzle === null && containerItem === null)
            container = object;
        else if (object !== null && object.childPuzzle !== null && containerItem === null)
            container = object.childPuzzle;
        else if (containerItem !== null) {
            container = containerItem;
            slotName = containerItemSlot.name;
        }

        // Finally, find the prefab.
        if (matches.length === 1) prefab = matches[0];
        else {
            for (let i = 0; i < matches.length; i++) {
                if (matches[i].id === parsedInput) {
                    prefab = matches[i];
                    break;
                }
            }
        }

        if (prefab !== null && container === null) {
            parsedInput = parsedInput.substring(prefab.id.length).trimStart();
            parsedInput = parsedInput.substring(parsedInput.indexOf(' ')).trimStart();
            return game.messageHandler.addReply(message, `couldn't find "${parsedInput}" to instantiate ${prefab.id} into.`);
        }
        else if (prefab === null && container !== null) return game.messageHandler.addReply(message, `couldn't find prefab with id "${parsedInput}".`);
        else if (prefab === null && container === null) return game.messageHandler.addReply(message, `couldn't find "${parsedInput}".`);

        if (containerItem !== null) {
            if (prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return game.messageHandler.addReply(message, `${prefab.id} will not fit in ${containerItemSlot.name} of ${container.name} because it is too large.`);
            else if (prefab.size > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${prefab.id} will not fit in ${container.name} because it is too large.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return game.messageHandler.addReply(message, `${prefab.id} will not fit in ${containerItemSlot.name} of ${container.name} because there isn't enough space left.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${prefab.id} will not fit in ${container.name} because there isn't enough space left.`);
        }

        // Now instantiate the item.
        // If the prefab has inventory slots, run the instantiate function quantity times so that it generates items with different identifiers.
        if (prefab.inventory.length > 0) {
            for (let i = 0; i < quantity; i++)
                itemManager.instantiateItem(prefab, room, container, slotName, 1);
        }
        else itemManager.instantiateItem(prefab, room, container, slotName, quantity);

        game.messageHandler.addGameMechanicMessage(message.channel, "Successfully instantiated item.");
    }
    else {
        for (let i = 0; i < game.players_alive.length; i++) {
            for (let j = 0; j < args.length; j++) {
                if (args[j].toUpperCase() === `${game.players_alive[i].name.toUpperCase()}'S`) {
                    player = game.players_alive[i];
                    args.splice(j, 1);
                    break;
                }
            }
            if (player !== null) break;
        }
        if (player === null) return game.messageHandler.addReply(message, `couldn't find a room or player in your input.`);

        parsedInput = args.join(" ").toUpperCase().replace(/\'/g, "");

        // Check if an inventory item was specified.
        let containerItem = null;
        let containerItemSlot = null;
        const items = game.inventoryItems.filter(item => item.player.id === player.id && item.prefab !== null);
        for (let i = 0; i < items.length; i++) {
            if (items[i].identifier === parsedInput || items[i].name === parsedInput) return game.messageHandler.addReply(message, `you need to supply a prefab and a preposition.`);
            if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].name)) {
                if (items[i].inventory.length === 0 || items[i].prefab.preposition === "") return game.messageHandler.addReply(message, `${items[i].identifier ? items[i].identifier : items[i].name} cannot hold items.`);
                containerItem = items[i];

                if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "")
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].identifier)).trimEnd();
                else if (parsedInput.endsWith(items[i].name))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                let newArgs = parsedInput.split(' ');
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
                    if (containerItemSlot === null) return game.messageHandler.addReply(message, `couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);

                    if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                    else if (parsedInput.endsWith(" IN"))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                    break;
                }
            }
        }
        if (containerItem !== null && containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
        let slotName = containerItem !== null ? containerItemSlot.name : "";

        // Check if an equipment slot was specified.
        let equipmentSlotName = "";
        if (containerItem === null) {
            for (let i = 0; i < player.inventory.length; i++) {
                if (parsedInput.endsWith(player.inventory[i].name)) {
                    equipmentSlotName = player.inventory[i].name;
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(equipmentSlotName)).trimEnd();
                    let newArgs = parsedInput.split(' ');
                    newArgs.splice(newArgs.length - 1, 1);
                    parsedInput = newArgs.join(' ');
                    if (player.inventory[i].equippedItem !== null) return game.messageHandler.addReply(message, `cannot equip items to ${equipmentSlotName} because ${player.inventory[i].equippedItem.name} is already equipped to it.`);
                    break;
                }
            }
        }

        // Finally, find the prefab.
        if (matches.length === 1) prefab = matches[0];
        else {
            for (let i = 0; i < matches.length; i++) {
                if (matches[i].id === parsedInput) {
                    prefab = matches[i];
                    break;
                }
            }
        }

        if (prefab !== null && containerItem === null && equipmentSlotName === "") {
            parsedInput = parsedInput.substring(prefab.id.length).trimStart();
            parsedInput = parsedInput.substring(parsedInput.indexOf(' ')).trimStart();
            return game.messageHandler.addReply(message, `couldn't find "${parsedInput}" to instantiate ${prefab.id} into.`);
        }
        else if (prefab === null && (containerItem !== null || equipmentSlotName !== "")) {
            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(' '));
            return game.messageHandler.addReply(message, `couldn't find prefab with id "${parsedInput}".`);
        }
        else if (prefab === null && containerItem === null && equipmentSlotName === "") return game.messageHandler.addReply(message, `couldn't find "${parsedInput}".`);

        if (equipmentSlotName !== "" && quantity !== 1) return game.messageHandler.addReply(message, `cannot instantiate more than 1 item to a player's equipment slot.`);
        if (containerItem !== null) {
            equipmentSlotName = containerItem.equipmentSlot;
            if (prefab.size > containerItemSlot.capacity && containerItem.inventory.length !== 1) return game.messageHandler.addReply(message, `${prefab.id} will not fit in ${containerItemSlot.name} of ${player.name}'s ${containerItem.name} because it is too large.`);
            else if (prefab.size > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${prefab.id} will not fit in ${player.name}'s ${containerItem.name} because it is too large.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity && containerItem.inventory.length !== 1) return game.messageHandler.addReply(message, `${prefab.id} will not fit in ${containerItemSlot.name} of ${player.name}'s ${containerItem.name} because there isn't enough space left.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity) return game.messageHandler.addReply(message, `${prefab.id} will not fit in ${player.name}'s ${containerItem.name} because there isn't enough space left.`);
        }

        // Now instantiate the item.
        // If the prefab has inventory slots, run the instantiate function quantity times so that it generates items with different identifiers.
        if (prefab.inventory.length > 0) {
            for (let i = 0; i < quantity; i++)
                itemManager.instantiateInventoryItem(prefab, player, equipmentSlotName, containerItem, slotName, 1, bot);
        }
        else itemManager.instantiateInventoryItem(prefab, player, equipmentSlotName, containerItem, slotName, quantity, bot);

        game.messageHandler.addGameMechanicMessage(message.channel, "Successfully instantiated inventory item.");
    }

    return;
};
