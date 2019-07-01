const settings = include('settings.json');

module.exports.config = {
    name: "drop_moderator",
    description: "Drops the given item from a player's inventory.",
    details: "Forcefully drops an item for a player. You can specify which object to drop the item into, "
        + "but it will default to the floor. Only objects in the same room as the player can be used.",
    usage: `${settings.commandPrefix}drop emily knife\n`
        + `${settings.commandPrefix}drop veronica knife counter\n`
        + `${settings.commandPrefix}drop colin fish sticks oven`,
    usableBy: "Moderator",
    aliases: ["drop"],
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

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check if an object was specified.
    const objects = game.objects.filter(object => object.location === player.location.name && object.accessible);
    var object = null;
    var puzzle = null;
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].name === parsedInput) return message.reply(`you need to specify an item for ${player.name} to drop.`);
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
                if (puzzle === null) return message.reply(`you cannot put items ${object.preposition} ${object.name} right now.`);
            }
            break;
        }
    }
    if (object === null) {
        const defaultDropOpject = objects.find(object => object.name === settings.defaultDropObject);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return message.reply(`${player.location.name} has no object ${settings.defaultDropObject}.`);
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
    if (slotNo === -1) return message.reply(`couldn't find item "${parsedInput}" in ${player.name}'s inventory.`);

    // The player can definitely drop an item now.
    const itemName = player.inventory[slotNo].name;
    const time = new Date().toLocaleTimeString();
    if (puzzle !== null) {
        player.drop(game, slotNo, puzzle);
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} forcefully dropped ${itemName} ${object.preposition} ${object.name} in ${player.location.channel}`);
    }
    else {
        player.drop(game, slotNo, object);
        // Post log message.
        game.logChannel.send(`${time} - ${player.name} forcefully dropped ${itemName} ${object.preposition} ${object.name} in ${player.location.channel}`);
    }

    message.channel.send(`Successfully dropped ${itemName} for ${player.name}.`);

    return;
};
