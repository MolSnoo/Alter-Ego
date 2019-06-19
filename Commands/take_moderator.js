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
    const objects = game.objects.filter(object => object.location === player.location.name && object.accessible);
    var object = null;
    var puzzle = null;
    for (let i = 0; i < objects.length; i++) {
        if (parsedInput.endsWith(objects[i].name)) {
            if (objects[i].preposition === "") return message.reply(`${objects[i].name} cannot hold items.`);
            object = objects[i];
            parsedInput = parsedInput.substring(0, parsedInput.indexOf(objects[i].name)).trimEnd();
            // Check if the object has a puzzle attached to it.
            if (object.requires !== "") {
                const puzzles = game.puzzles.filter(puzzle => puzzle.location === object.location && puzzle.accessible && puzzle.solved);
                for (let j = 0; j < puzzles.length; j++) {
                    if (puzzles[j].parentObject === object.name) {
                        puzzle = puzzles[j];
                        break;
                    }
                }
                if (puzzle === null) return message.reply(`any items ${object.preposition} ${object.name} are currently inaccessible.`);
            }
            break;
        }
    }

    // Now find the item.
    var item = null;
    if (puzzle !== null) {
        const items = game.items.filter(item => item.location === player.location.name && item.accessible && item.requires === puzzle.name && (item.quantity > 0 || isNaN(item.quantity)));
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput || items[i].pluralName === parsedInput) {
                item = items[i];
                break;
            }
        }
        if (item === null) return message.reply(`couldn't find item "${parsedInput}" in ${puzzle.parentObject}.`);
    }
    else if (object !== null) {
        const items = game.items.filter(item => item.location === player.location.name && item.accessible && item.sublocation === object.name && (item.quantity > 0 || isNaN(item.quantity)));
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput || items[i].pluralName === parsedInput) {
                item = items[i];
                break;
            }
        }
        if (item === null) return message.reply(`couldn't find item "${parsedInput}" in ${object.name}.`);
    }
    else {
        const items = game.items.filter(item => item.location === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput || items[i].pluralName === parsedInput) {
                item = items[i];
                if (item.requires !== "") {
                    const puzzles = game.puzzles.filter(puzzle => puzzle.location === item.location && puzzle.accessible && puzzle.solved);
                    for (let j = 0; j < puzzles.length; j++) {
                        if (puzzles[j].name === item.requires) {
                            puzzle = puzzles[j];
                            object = game.objects.find(object => object.location === item.location && object.name === puzzle.parentObject && object.requires === puzzle.name);
                            break;
                        }
                    }
                }
                else if (item.sublocation !== "") {
                    const objects = game.objects.filter(object => object.location === item.location && object.accessible);
                    for (let j = 0; j < objects.length; j++) {
                        if (objects[j].name === item.sublocation) {
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
    if (puzzle !== null) {
        player.take(game, item, freeSlot, puzzle);
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
