const settings = include('settings.json');

module.exports.config = {
    name: "puzzle_bot",
    description: "Solves or unsolves a puzzle.",
    details: 'Solves or unsolves a puzzle. You may specify a player to solve the puzzle. If you do, '
        + 'players in the room will be notified, so you should generally give a string for the bot to use, '
        + 'otherwise the bot will say "[player] uses the [puzzle]." which may not sound right. '
        + "If you specify a player, only puzzles in the room that player is in can be solved/unsolved. "
        + 'If you use "player" in place of the player, then the player who triggered the command will be '
        + 'the one to solve/unsolve the puzzle. It will also do the same in the string, if one is specified. '
        + 'You can also use a room name instead of a player name. In that case, only puzzles in the room '
        + 'you specify can be solved/unsolved. This is useful if you have multiple puzzles with the same name '
        + 'spread across the map.',
    usage: `${settings.commandPrefix}puzzle solve button\n`
        + `${settings.commandPrefix}puzzle unsolve keypad\n`
        + `${settings.commandPrefix}solve binder taylor\n`
        + `${settings.commandPrefix}unsolve lever colin\n`
        + `${settings.commandPrefix}puzzle solve keypad tool shed\n`
        + `${settings.commandPrefix}puzzle unsolve lock men's locker room\n`
        + `${settings.commandPrefix}solve paintings player "player removes the PAINTINGS from the wall."\n`
        + `${settings.commandPrefix}unsolve lock men's locker room "The LOCK on LOCKER 1 locks itself"`,
    usableBy: "Bot",
    aliases: ["puzzle", "solve", "unsolve"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");
    var input = cmdString;
    if (command === "puzzle") {
        if (args[0] === "solve") command = "solve";
        else if (args[0] === "unsolve") command = "unsolve";
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }
    else input = args.join(" ");

    if (args.length === 0) {
        game.commandChannel.send(`Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    // The message, if it exists, is the easiest to find at the beginning. Look for that first.
    var announcement = "";
    var index = input.indexOf('"');
    if (index === -1) index = input.indexOf('“');
    if (index !== -1) {
        announcement = input.substring(index + 1);
        // Remove the announcement from the list of arguments.
        input = input.substring(0, index - 1);
        args = input.split(" ");
        // Now clean up the announcement text.
        if (announcement.endsWith('"') || announcement.endsWith('”'))
            announcement = announcement.substring(0, announcement.length - 1);
        if (!announcement.endsWith('.') && !announcement.endsWith('!'))
            announcement += '.';
    }

    // Find the prospective list of puzzles.
    var puzzles = game.puzzles.filter(puzzle => input.toUpperCase().startsWith(puzzle.name + ' ') || input.toUpperCase() === puzzle.name);
    if (puzzles.length > 0) {
        input = input.substring(puzzles[0].name.length).trim();
        args = input.split(" ");
    }

    // Now find the player, who should be the last argument.
    if (args[args.length - 1] === "player" && player !== null) {
        args.splice(args.length - 1, 1);
        input = args.join(" ");
        announcement = announcement.replace(/player/g, player.displayName);
    }
    else {
        player = null;
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[args.length - 1].toLowerCase()) {
                player = game.players_alive[i];
                args.splice(args.length - 1, 1);
                input = args.join(" ");
                break;
            }
        }
    }

    // If a player wasn't specified, check if a room name was.
    var room = null;
    if (player === null) {
        const parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
        for (let i = 0; i < game.rooms.length; i++) {
            if (parsedInput.endsWith(game.rooms[i].name)) {
                room = game.rooms[i];
                input = input.substring(0, parsedInput.indexOf(room.name) - 1);
                break;
            }
        }
    }

    // Finally, find the puzzle.
    var puzzle = null;
    for (let i = 0; i < puzzles.length; i++) {
        if ((player !== null && puzzles[i].location.name === player.location.name)
            || (room !== null && puzzles[i].location.name === room.name)) {
            puzzle = puzzles[i];
            break;
        }
    }
    if (puzzle === null && player === null && room === null && puzzles.length > 0) puzzle = puzzles[0];
    if (puzzle === null) return game.commandChannel.send(`Error: Couldn't execute command "${cmdString}". Couldn't find puzzle "${input}".`);

    if (announcement === "" && player !== null) announcement = `${player.displayName} uses the ${puzzle.name}.`;

    var doCommands = false;
    if (data && !data.hasOwnProperty("solved")) doCommands = true;

    if (command === "solve") {
        if (player === null && puzzle.solvedCommands.toString().includes("player"))
            return game.commandChannel.send(`Error: Couldn't execute command "${cmdString}". That puzzle will trigger a command on the player who solves it, so you need to specify one.`);
        puzzle.solve(bot, game, player, announcement, doCommands);
    }
    else if (command === "unsolve") {
        if (player === null && puzzle.unsolvedCommands.toString().includes("player"))
            return game.commandChannel.send(`Error: Couldn't execute command "${cmdString}". That puzzle will trigger a command on the player who unsolves it, so you need to specify one.`);
        puzzle.unsolve(bot, game, player, announcement, null, doCommands);
    }

    return;
};
