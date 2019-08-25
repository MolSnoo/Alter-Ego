const settings = include('settings.json');

module.exports.config = {
    name: "take_moderator",
    description: "Takes the given item for a player.",
    details: "Forcefully takes an item for a player. You can specify which object to take the item from, "
        + "but only items in the same room as the player can be taken. Will fail if the player's inventory is full.",
    usage: `${settings.commandPrefix}take nero food\n`
        + `${settings.commandPrefix}take livida food floor\n`
        + `${settings.commandPrefix}take cleo sword desk`,
    usableBy: "Moderator",
    aliases: ["take"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2) {
        message.reply("you need to specify a player and an item. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return message.reply(`player "${args[0]}" not found.`);

    // First, check if the player has free space in their inventory.
    var freeSlot = -1;
    for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i].name === null) {
            freeSlot = i;
            break;
        }
    }
    if (freeSlot === -1) return message.reply(`${player.name}'s inventory is full.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check if an object was specified.
    const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
    var object = null;
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].name === parsedInput) return message.reply(`the ${objects[i].name} is not an item.`);
        if (parsedInput.endsWith(objects[i].name)) {
            if (objects[i].preposition === "") return message.reply(`${objects[i].name} cannot hold items.`);
            object = objects[i];
            parsedInput = parsedInput.substring(0, parsedInput.indexOf(objects[i].name)).trimEnd();
            // Check if the object has a puzzle attached to it.
            if (object.childPuzzle !== null && (!object.childPuzzle.accessible || !object.childPuzzle.solved))
                return message.reply(`any items ${object.preposition} ${object.name} are currently inaccessible.`);
            break;
        }
    }

    // Now find the item.
    var item = null;
    if (object !== null && object.childPuzzle !== null) {
        const items = game.items.filter(item => item.location.name === player.location.name && item.accessible && item.requires !== null && item.requires.name === object.childPuzzle.name && (item.quantity > 0 || isNaN(item.quantity)));
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput || items[i].pluralName === parsedInput) {
                item = items[i];
                break;
            }
        }
        if (item === null) return message.reply(`couldn't find item "${parsedInput}" ${object.preposition} ${object.name}.`);
    }
    else if (object !== null) {
        const items = game.items.filter(item => item.location.name === player.location.name && item.accessible && item.sublocation !== null && item.sublocation.name === object.name && (item.quantity > 0 || isNaN(item.quantity)));
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput || items[i].pluralName === parsedInput) {
                item = items[i];
                break;
            }
        }
        if (item === null) return message.reply(`couldn't find item "${parsedInput}" ${object.preposition} ${object.name}.`);
    }
    else {
        const items = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput || items[i].pluralName === parsedInput) {
                item = items[i];
                if (item.requires !== null) {
                    const puzzles = game.puzzles.filter(puzzle => puzzle.location.name === item.location.name && puzzle.accessible && puzzle.solved);
                    for (let j = 0; j < puzzles.length; j++) {
                        if (puzzles[j].name === item.requires.name) {
                            object = puzzles[j].parentObject;
                            break;
                        }
                    }
                }
                else if (item.sublocation !== null) {
                    const objects = game.objects.filter(object => object.location.name === item.location.name && object.accessible);
                    for (let j = 0; j < objects.length; j++) {
                        if (objects[j].name === item.sublocation.name) {
                            object = objects[j];
                            break;
                        }
                    }
                }
                break;
            }
        }
        if (item === null) return message.reply(`couldn't find item "${parsedInput}" in the room.`);
    }

    const time = new Date().toLocaleTimeString();
    if (object !== null && object.childPuzzle !== null) {
        player.take(game, item, freeSlot, object.childPuzzle);
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} forcefully took ${item.name} from ${object.name} in ${player.location.channel}`);
    }
    else if (object !== null) {
        player.take(game, item, freeSlot, object);
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} forcefully took ${item.name} from ${object.name} in ${player.location.channel}`);
    }
    else {
        player.take(game, item, freeSlot, player.location);
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} forcefully took ${item.name} from ${player.location.channel}`);
    }

    message.channel.send(`Successfully took ${item.name} for ${player.name}.`);

    return;
};
