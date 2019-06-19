const settings = require("../settings.json");

module.exports.config = {
    name: "take_player",
    description: "Takes an item and puts it in your inventory.",
    details: "Adds an item from the room you're in to your inventory. You may hold up to 3 items at a time. "
        + "If there are multiple items with the same name in a room, you can specify which object you want to take it from. "
        + "If you're carrying a very large item (a sword, for example), people will see you carrying it when you enter or exit a room.",
    usage: `${settings.commandPrefix}take butcher's knife\n`
        + `${settings.commandPrefix}get first aid kit\n`
        + `${settings.commandPrefix}take pill bottle medicine cabinet\n`
        + `${settings.commandPrefix}get towel benches`,
    usableBy: "Player",
    aliases: ["take", "get"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify an item. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable take");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    // First, check if the player has free space in their inventory.
    var freeSlot = -1;
    for (let i = 0; i < player.inventory.length; i++) {
        if (player.inventory[i].name === null) {
            freeSlot = i;
            break;
        }
    }
    if (freeSlot === -1) return message.reply("your inventory is full. You cannot take anymore items until you drop something.");

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check if the player specified an object.
    const objects = game.objects.filter(object => object.location === player.location.name && object.accessible);
    var object = null;
    var puzzle = null;
    for (let i = 0; i < objects.length; i++) {
        if (parsedInput.endsWith(objects[i].name)) {
            if (objects[i].preposition === "") return message.reply(`${objects[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
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
        game.logChannel.send(`${time} - ${player.name} took ${item.name} from ${object.name} in ${player.location.channel}`);
    }
    else if (object !== null) {
        player.take(game, item, freeSlot, object);
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} took ${item.name} from ${object.name} in ${player.location.channel}`);
    }
    else {
        player.take(game, item, freeSlot, player.location);
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} took ${item.name} from ${player.location.channel}`);
    }

    return;
};
