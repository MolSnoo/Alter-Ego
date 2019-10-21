const settings = include('settings.json');

module.exports.config = {
    name: "drop_player",
    description: "Discards an item from your inventory.",
    details: "Discards an item from your inventory and leaves it in the room you're currently in. "
        + "You can specify where in the room you'd like to leave it by putting the name of an object in the room after the item. "
        + "Not all objects can contain items, but it should be fairly obvious which ones can. If you don't specify an object, "
        + "you will simply leave it on the floor. If you drop a very large item (a sword, for example), "
        + "people in the room with you will see you discard it.",
    usage: `${settings.commandPrefix}drop first aid kit\n`
        + `${settings.commandPrefix}discard basketball\n`
        + `${settings.commandPrefix}drop knife sink\n`
        + `${settings.commandPrefix}discard towel benches`,
    usableBy: "Player",
    aliases: ["drop", "discard"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify an item. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable drop");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check if the player specified an object.
    const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
    var object = null;
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].name === parsedInput) return message.reply(`you need to specify an item to drop.`);
        if (parsedInput.endsWith(objects[i].name)) {
            if (objects[i].preposition === "") return message.reply(`${objects[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
            object = objects[i];
            parsedInput = parsedInput.substring(0, parsedInput.indexOf(objects[i].name)).trimEnd();
            // Check if the object has a puzzle attached to it.
            if (object.childPuzzle !== null && (!object.childPuzzle.accessible || !object.childPuzzle.solved))
                return message.reply(`you cannot put items ${object.preposition} ${object.name} right now.`);
            break;
        }
    }
    if (object === null) {
        const defaultDropOpject = objects.find(object => object.name === settings.defaultDropObject);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return message.reply(`you cannot drop items in this room.`);
        object = defaultDropOpject;
    }

    // Now find the item in the player's inventory.
    var slotNo = -1;
    for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i].name === parsedInput) {
            slotNo = i;
            break;
        }
    }
    if (slotNo === -1) return message.reply(`couldn't find item "${parsedInput}" in your inventory.`);

    // The player can definitely drop an item now.
    const itemName = player.inventory[slotNo].name;
    const time = new Date().toLocaleTimeString();
    if (object.childPuzzle !== null) {
        player.drop(game, slotNo, object.childPuzzle);
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} dropped ${itemName} ${object.preposition} ${object.name} in ${player.location.channel}`);
    }
    else {
        player.drop(game, slotNo, object);
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} dropped ${itemName} ${object.preposition} ${object.name} in ${player.location.channel}`);
    }
    
    return;
};
