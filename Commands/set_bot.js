const settings = include('settings.json');

module.exports.config = {
    name: "set_bot",
    description: "Sets a puzzle as accessible or inaccessible.",
    details: 'Sets a puzzle as accessible or inaccessible. You can also specify a room name. '
        + 'If you do, only puzzles in the room you specify can be set as accessible/inaccessible. '
        + 'This is useful if you have multiple puzzles with the same name spread across the map.',
    usage: `${settings.commandPrefix}set accessible button\n`
        + `${settings.commandPrefix}set inaccesible keypad\n`
        + `${settings.commandPrefix}set accessible keypad tool shed\n`
        + `${settings.commandPrefix}set inaccesible lock men's locker room`,
    usableBy: "Bot",
    aliases: ["set"]
};

module.exports.run = async (bot, game, command, args, player) => {
    if (args.length < 2) {
        game.commandChannel.send(`Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }
    var message;
    var input = args.join(" ");
    if (args[0] === "accessible") command = "accessible";
    else if (args[0] === "inaccessible") command = "inaccessible";
    else {
        game.commandChannel.send(`Error: Couldn't execute command "${cmdString}". The first argument must be "accessible" or "inaccessible".`);
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
    if (puzzle === null) return game.commandChannel.send(`Error: Couldn't execute command "${cmdString}". Couldn't find puzzle "${input}".`);

    if (command === "accessible") {
        puzzle.setAccessible(game);
    }
    else if (command === "inaccessible") {
        puzzle.setInaccessible(game);
    }

    return;
};
