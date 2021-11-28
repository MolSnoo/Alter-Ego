const settings = include('settings.json');
const itemManager = include(`${settings.modulesDir}/itemManager.js`);

module.exports.config = {
    name: "destroy_moderator",
    description: "Destroys an item.",
    details: "Destroys an item in the specified location or in the player's inventory. The prefab ID or container identifier of the item must be given. "
        + "In order to destroy an item, the name of the room must be given, following \"at\". The name of the container it belongs to can also be specified. "
        + "If the container is another item, the identifier of the item or its prefab ID must be used. "
        + "The name of the inventory slot to destroy the item from can also be specified.\n\n"
        + "To destroy an inventory item, the name of the player must be given followed by \"'s\". A container item can also be specified, "
        + "as well as which slot to delete the item from. The player will not be notified if a container item is specified. "
        + "An equipment slot can also be specified isntead of a container item. This will destroy whatever item is equipped to it. "
        + "The player will be notified in this case, and the item's unequipped commands will be run.\n\n"
        + "Note that using the \"all\" argument with a container will destroy all items in that container.",
    usage: `${settings.commandPrefix}destroy volleyball at beach\n`
        + `${settings.commandPrefix}destroy gasoline on shelves at warehouse\n`
        + `${settings.commandPrefix}destroy note in locker 1 at mens locker room\n`
        + `${settings.commandPrefix}destroy wrench in tool box at beach house\n`
        + `${settings.commandPrefix}destroy gloves in breast pocket of tuxedo at dressing room\n`
        + `${settings.commandPrefix}destroy all in trash can at lounge\n`
        + `${settings.commandPrefix}destroy nero's katana\n`
        + `${settings.commandPrefix}destroy yuda's glasses\n`
        + `${settings.commandPrefix}destroy vivians laptop in vivian's vivians satchel\n`
        + `${settings.commandPrefix}destroy shotput ball in cassie's main pocket of large backpack\n`
        + `${settings.commandPrefix}destroy all in hitoshi's trousers\n`
        + `${settings.commandPrefix}destroy all in charlotte's right pocket of dress`,
    usableBy: "Moderator",
    aliases: ["destroy"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `Not enough arguments given. Usage:\n${exports.config.usage}`);

    var destroyAll = false;
    if (args[0].toLowerCase() === "all") {
        destroyAll = true;
        args.splice(0, 1);
    }

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    const undashedInput = parsedInput.replace(/-/g, " ");

    let room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        const parsedRoomName = game.rooms[i].name.toUpperCase().replace(/-/g, " ");
        if (undashedInput.endsWith(` AT ${parsedRoomName}`)) {
            room = game.rooms[i];
            parsedInput = parsedInput.substring(0, undashedInput.lastIndexOf(` AT ${parsedRoomName}`));
            break;
        }
        else if (undashedInput.endsWith(`AT ${parsedRoomName}`)) {
            room = game.rooms[i];
            parsedInput = parsedInput.substring(0, undashedInput.lastIndexOf(`AT ${parsedRoomName}`));
            break;
        }
    }

    var item = null;
    let player = null;
    // Room was found. Look for the container in it.
    if (room !== null) {
        let containerItem = null;
        let containerItemSlot = null;
        // Check if a container item was specified.
        const roomItems = game.items.filter(item => item.location.name === room.name && (item.quantity > 0 || isNaN(item.quantity)));
        for (let i = 0; i < roomItems.length; i++) {
            // If parsedInput is only the identifier or the item's name, we've found the item to delete.
            if (roomItems[i].identifier !== "" && roomItems[i].identifier === parsedInput || roomItems[i].prefab.id === parsedInput) {
                item = roomItems[i];
                break;
            }
            if (parsedInput.endsWith(roomItems[i].identifier) && roomItems[i].identifier !== "") {
                if (roomItems[i].inventory.length === 0 || roomItems[i].prefab.preposition === "") return game.messageHandler.addReply(message, `${roomItems[i].identifier ? roomItems[i].identifier : roomItems[i].prefab.id} cannot hold items.`);
                containerItem = roomItems[i];

                if (parsedInput.endsWith(roomItems[i].identifier) && roomItems[i].identifier !== "")
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(roomItems[i].identifier)).trimEnd();
                else if (parsedInput.endsWith(roomItems[i].prefab.id))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(roomItems[i].prefab.id)).trimEnd();
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
                    if (containerItemSlot === null) return game.messageHandler.addReply(message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.prefab.id}.`);
                }
                if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                else if (parsedInput.endsWith(" IN"))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                break;
            }
        }
        if (containerItem !== null && containerItemSlot === null) containerItemSlot = containerItem.inventory[0];

        // Check if an object was specified.
        let object = null;
        if (containerItem === null && item === null) {
            const objects = game.objects.filter(object => object.location.name === room.name && object.accessible);
            for (let i = 0; i < objects.length; i++) {
                if (objects[i].name === parsedInput) return game.messageHandler.addReply(message, `You need to supply an item and a preposition.`);
                if (parsedInput.endsWith(`${objects[i].preposition.toUpperCase()} ${objects[i].name}`) || parsedInput.endsWith(`IN ${objects[i].name}`)) {
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
        else if (item !== null)
            container = item.container;
        else
            container = null;

        let containerItems = [];
        let containerName = "";
        let preposition = "in";
        // Container is a Room.
        if (container === null) {
            containerItems = roomItems;
            containerName = `${room.name}`;
            preposition = "at";
        }
        // Container is an Object.
        else if (container.hasOwnProperty("isHidingSpot")) {
            containerItems = roomItems.filter(item => item.containerName === `Object: ${container.name}`);
            containerName = `${container.name} at ${room.name}`;
            preposition = container.preposition ? container.preposition : "in";
        }
        // Container is a Puzzle.
        else if (container.hasOwnProperty("solved")) {
            containerItems = roomItems.filter(item => item.containerName === `Puzzle: ${container.name}`);
            containerName = `${container.parentObject.name} at ${room.name}`;
            preposition = container.parentObject.preposition ? container.parentObject.preposition : "in";
        }
        // Container is an Item.
        else if (container.hasOwnProperty("inventory")) {
            containerItems = roomItems.filter(item => item.containerName === `Item: ${container.identifier}/${slotName}`);
            containerName = `${slotName} of ${container.identifier} at ${room.name}`;
            preposition = container.prefab.preposition ? container.prefab.preposition : "in";
        }

        if (destroyAll) {
            if (parsedInput !== "") return game.messageHandler.addReply(message, `Couldn't find "${parsedInput}" at ${room.name}`);
            for (let i = 0; i < containerItems.length; i++)
                itemManager.destroyItem(containerItems[i], containerItems[i].quantity, true);
            game.messageHandler.addGameMechanicMessage(message.channel, `Successfully destroyed ${containerItems.length} items ${preposition} ${containerName}.`);
        }
        else {
            // Find the item if it hasn't been found already.
            if (item === null) {
                for (let i = 0; i < containerItems.length; i++) {
                    if (containerItems[i].identifier === parsedInput || containerItems[i].prefab.id === parsedInput) {
                        item = containerItems[i];
                        break;
                    }
                }
            }
            if (item === null) return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" ${preposition} ${containerName}.`);

            itemManager.destroyItem(item, item.quantity, true);
            game.messageHandler.addGameMechanicMessage(message.channel, `Successfully destroyed ${item.identifier ? item.identifier : item.prefab.id} ${preposition} ${containerName}.`);
        }
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
        if (player === null) return game.messageHandler.addReply(message, `Couldn't find a room or player in your input.`);

        parsedInput = args.join(" ").toUpperCase().replace(/\'/g, "");

        // Check if an inventory item was specified.
        let containerItem = null;
        let containerItemSlot = null;
        const playerItems = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null && (item.quantity > 0 || isNaN(item.quantity)));
        for (let i = 0; i < playerItems.length; i++) {
            // If parsedInput is only the identifier or the item's name, we've found the item to delete.
            if (playerItems[i].identifier !== "" && playerItems[i].identifier === parsedInput || playerItems[i].prefab.id === parsedInput) {
                item = playerItems[i];
                break;
            }
            if (parsedInput.endsWith(playerItems[i].identifier) && playerItems[i].identifier !== "" || parsedInput.endsWith(playerItems[i].prefab.id)) {
                if (playerItems[i].inventory.length === 0 || playerItems[i].prefab.preposition === "") return game.messageHandler.addReply(message, `${playerItems[i].identifier ? playerItems[i].identifier : playerItems[i].prefab.id} cannot hold items.`);
                containerItem = playerItems[i];

                if (parsedInput.endsWith(playerItems[i].identifier) && playerItems[i].identifier !== "")
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(playerItems[i].identifier)).trimEnd();
                else if (parsedInput.endsWith(playerItems[i].prefab.id))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(playerItems[i].prefab.id)).trimEnd();
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
                    if (containerItemSlot === null) return game.messageHandler.addReply(message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);
                }
                if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                else if (parsedInput.endsWith(" IN"))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                break;
            }
        }
        if (containerItem !== null && containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
        let slotName = containerItem !== null ? containerItemSlot.name : "";

        let containerItems = [];
        let containerName = "";
        let preposition = "in";
        // If the item still hasn't been found, but a containerItem was, find it in the container.
        if (containerItem !== null) {
            containerItems = playerItems.filter(item => item.containerName === `${containerItem.identifier}/${slotName}`);
            containerName = `${slotName} of ${containerItem.identifier} in ${player.name}'s inventory`;
            preposition = containerItem.prefab.preposition ? containerItem.prefab.preposition : "in";

            if (destroyAll) {
                for (let i = 0; i < containerItems.length; i++)
                    itemManager.destroyInventoryItem(containerItems[i], containerItems[i].quantity, bot, true);
                game.messageHandler.addGameMechanicMessage(message.channel, `Successfully destroyed ${containerItems.length} items ${preposition} ${containerName}.`);
                return;
            }
            else {
                // Find the item if it hasn't been found already.
                if (item === null) {
                    for (let i = 0; i < containerItems.length; i++) {
                        if (containerItems[i].identifier === parsedInput || containerItems[i].prefab.id === parsedInput) {
                            item = containerItems[i];
                            break;
                        }
                    }
                    if (item === null) return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" ${preposition} ${containerName}.`);
                }
            }
        }
        else {
            // Check if an equipment slot was specified.
            let equipmentSlotName = "";
            for (let i = 0; i < player.inventory.length; i++) {
                if (player.inventory[i].name === parsedInput) {
                    item = player.inventory[i].equippedItem;
                    equipmentSlotName = player.inventory[i].name;
                    if (item === null) return game.messageHandler.addReply(message, `Cannot destroy item equipped to ${equipmentSlotName} because nothing is equipped to it.`);
                    if (destroyAll) return game.messageHandler.addReply(message, `The "all" argument cannot be used when the container is an equipment slot.`);
                    break;
                }
                else if (player.inventory[i].equippedItem !== null &&
                    (player.inventory[i].equippedItem.identifier !== "" && player.inventory[i].equippedItem.identifier === parsedInput || player.inventory[i].equippedItem.prefab.id === parsedInput)) {
                    item = player.inventory[i].equippedItem;
                    equipmentSlotName = player.inventory[i].name;
                    if (destroyAll) return game.messageHandler.addReply(message, `The "all" argument cannot be used when the container is an equipped item.`);
                    break;
                }
            }
            if (item !== null && equipmentSlotName !== "") {
                itemManager.destroyInventoryItem(item, item.quantity, bot, true);
                game.messageHandler.addGameMechanicMessage(message.channel, `Successfully destroyed ${item.identifier ? item.identifier : item.prefab.id} equipped to ${player.name}'s ${equipmentSlotName}.`);
                return;
            }
        }

        if (item !== null) {
            if (containerName === "") containerName = `${item.slot} of ${item.container.identifier} in ${player.name}'s inventory`;
            if (item.container.prefab.preposition) preposition = item.container.prefab.preposition;

            itemManager.destroyInventoryItem(item, item.quantity, bot, true);
            game.messageHandler.addGameMechanicMessage(message.channel, `Successfully destroyed ${item.identifier ? item.identifier : item.prefab.id} ${preposition} ${containerName}.`);
        }
        else return game.messageHandler.addReply(message, `Couldn't find "${parsedInput}" in ${player.name}'s inventory.`);
    }

    return;
};
