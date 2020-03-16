const settings = include('settings.json');

module.exports.config = {
    name: "destroy_moderator",
    description: "Destroys an item.",
    details: "Tells you your role.", // SERIOUSLY DON'T FORGET TO WRITE THIS
    usage: `${settings.commandPrefix}destroy volleyball at beach\n`
        + `${settings.commandPrefix}destroy gasoline on shelves at warehouse\n`
        + `${settings.commandPrefix}destroy note in locker 1 at mens locker room\n`
        + `${settings.commandPrefix}destroy 3 wrench in tool box at beach house\n`
        + `${settings.commandPrefix}destroy gloves in breast pocket of tuxedo at dressing room\n`
        + `${settings.commandPrefix}destroy all in trash can at lounge\n`
        + `${settings.commandPrefix}destroy nero's katana\n`
        + `${settings.commandPrefix}destroy yuda's glasses\n`
        + `${settings.commandPrefix}destroy laptop in vivian's vivians satchel\n`
        + `${settings.commandPrefix}destroy 2 shotput ball in cassie's main pocket of large backpack\n`
        + `${settings.commandPrefix}destroy all in hitoshi's trousers\n`
        + `${settings.commandPrefix}destroy all in charlotte's right pocket of dress`,
    usableBy: "Moderator",
    aliases: ["destroy"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2) {
        message.reply('not enough arguments given. Usage:');
        message.channel.send(exports.config.usage);
        return;
    }

    var destroyAll = false;
    if (args[0].toLowerCase() === "all") {
        destroyAll = true;
        args.splice(0, 1);
    }

    var quantity = NaN;
    if (!isNaN(args[0])) {
        if (destroyAll) return message.reply(`a quantity cannot be specified if the "all" argument is given.`);
        quantity = parseInt(args[0]);
        args.splice(0, 1);
    }

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    const undashedInput = parsedInput.replace(/-/g, " ");

    var item = null;

    let room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        const parsedRoomName = game.rooms[i].name.toUpperCase().replace(/-/g, " ");
        if (undashedInput.endsWith(` AT ${parsedRoomName}`)) {
            room = game.rooms[i];
            parsedInput = parsedInput.substring(0, undashedInput.lastIndexOf(` AT ${parsedRoomName}`));
            break;
        }
    }

    let player = null;
    // Room was found. Look for the container in it.
    if (room !== null) {
        let containerItem = null;
        let containerItemSlot = null;
        // Check if a container item was specified.
        const items = game.items.filter(item => item.location.name === room.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
        for (let i = 0; i < items.length; i++) {
            // If parsedInput is only the identifier or the item's name, we've found the item to delete.
            if (items[i].identifier === parsedInput || items[i].name === parsedInput) {
                item = items[i];
                break;
            }
            if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].name)) {
                if (items[i].inventory.length === 0 || items[i].prefab.preposition === "") return message.reply(`${items[i].identifier ? items[i].identifier : items[i].name} cannot hold items.`);
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
                    if (containerItemSlot === null) return message.reply(`couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);
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
                if (objects[i].name === parsedInput) return message.reply(`you need to supply an item and a preposition.`);
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
    }
    console.log(item); 

    return;
};
