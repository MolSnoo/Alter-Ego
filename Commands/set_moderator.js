const settings = include('settings.json');

module.exports.config = {
    name: "set_moderator",
    description: "Sets a puzzle as accessible or inaccessible.",
    details: 'Sets a puzzle as accessible or inaccessible. You can also specify a room name. '
        + 'If you do, only puzzles in the room you specify can be set as accessible/inaccessible. '
        + 'This is useful if you have multiple puzzles with the same name spread across the map.',
    usage: `${settings.commandPrefix}set accessible button\n`
        + `${settings.commandPrefix}set inaccesible keypad\n`
        + `${settings.commandPrefix}set accessible keypad tool shed\n`
        + `${settings.commandPrefix}set inaccesible lock men's locker room`,
    usableBy: "Moderator",
    aliases: ["set"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2) {
        message.reply("you need to input all required arguments. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    var input = args.join(" ");
    if (args[0] === "accessible") command = "accessible";
    else if (args[0] === "inaccessible") command = "inaccessible";
    else {
        message.reply('the first argument must be "accessible" or "inaccessible". Usage:');
        message.channel.send(exports.config.usage);
        return;
    }
    input = input.substring(input.indexOf(args[1]));
    args = input.split(" ");

    // Find the prospective list of puzzles.
    var puzzles = game.puzzles.filter(puzzle => input.toUpperCase().startsWith(puzzle.name));
    if (puzzles.length > 0) {
        input = input.substring(puzzles[0].name.length).trim();
        args = input.split(" ");
    }

    // Check if a room name was specified.
    var room = null;
    const parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.endsWith(game.rooms[i].name)) {
            room = game.rooms[i];
            input = input.substring(0, parsedInput.indexOf(room.name) - 1);
            break;
        }
    }

    // Finally, find the puzzle.
    var puzzle = null;
    for (let i = 0; i < puzzles.length; i++) {
        if (room !== null && puzzles[i].location.name === room.name) {
            puzzle = puzzles[i];
            break;
        }
    }
    if (puzzle === null && room === null && puzzles.length > 0) puzzle = puzzles[0];
    else if (puzzle === null) return message.reply(`couldn't find puzzle "${input}".`);

    if (command === "accessible") {
        puzzle.setAccessible(game);
        message.channel.send(`Successfully made ${puzzle.name} accessible.`);
    }
    else if (command === "inaccessible") {
        puzzle.setInaccessible(game);
        message.channel.send(`Successfully made ${puzzle.name} inaccessible.`);
    }

    return;
};
