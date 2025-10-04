module.exports.config = {
    name: "puzzle_bot",
    description: "Solves or unsolves a puzzle.",
    details: 'Solves or unsolves a puzzle. You may specify an outcome, if the puzzle has more than one solution. '
        + 'You may specify a player to solve the puzzle. If you do, players in the room '
        + 'will be notified, so you should generally give a string for the bot to use, '
        + 'otherwise the bot will say "[player] uses the [puzzle]." which may not sound right. '
        + "If you specify a player, only puzzles in the room that player is in can be solved/unsolved. "
        + 'Additionally, if you specify a player, you can make them attempt to solve a puzzle. '
        + 'If you use "player" in place of the player, then the player who triggered the command will be '
        + 'the one to solve/unsolve the puzzle. It will also do the same in the string, if one is specified. '
        + 'You can also use a room name instead of a player name. In that case, only puzzles in the room '
        + 'you specify can be solved/unsolved. This is useful if you have multiple puzzles with the same name '
        + 'spread across the map.',
    usage: `puzzle solve button\n`
        + `puzzle unsolve keypad\n`
        + `solve binder taylor\n`
        + `unsolve lever colin\n`
        + `solve computer PASSWORD1\n`
        + `solve computer PASSWORD2\n`
        + `puzzle solve keypad tool shed\n`
        + `puzzle unsolve lock men's locker room\n`
        + `solve paintings player "player removes the PAINTINGS from the wall."\n`
        + `unsolve lock men's locker room "The LOCK on LOCKER 1 locks itself"\n`
        + `puzzle attempt cyptex lock 05-25-99 player`,
    usableBy: "Bot",
    aliases: ["puzzle", "solve", "unsolve", "attempt"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");
    var input = cmdString;
    if (command === "puzzle") {
        if (args[0] === "solve") command = "solve";
        else if (args[0] === "unsolve") command = "unsolve";
        else if (args[0] === "attempt") command = "attempt";
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }
    else input = args.join(" ");

    if (args.length === 0) {
        game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
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
    if (puzzle === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find puzzle "${input}".`);

    var outcome = "";
    var targetPlayer = null;
    if (player !== null && puzzle.type === "room player") {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].location.name === player.location.name &&
                (game.players_alive[i].displayName.toLowerCase() === input.toLowerCase() || game.players_alive[i].name.toLowerCase() === input.toLowerCase())) {
                targetPlayer = game.players_alive[i];
                break;
            }
        }
    }
    for (let i = 0; i < puzzle.solutions.length; i++) {
        if (targetPlayer && puzzle.solutions[i].toLowerCase() === targetPlayer.displayName.toLowerCase() ||
            puzzle.type !== "room player" && puzzle.solutions[i].toLowerCase() === input.toLowerCase()) {
            outcome = puzzle.solutions[i];
            break;
        }
    }

    if (announcement === "" && player !== null) announcement = `${player.displayName} uses the ${puzzle.name}.`;

    var doCommands = false;
    if (data && !data.hasOwnProperty("solved")) doCommands = true;

    if (command === "solve") {
        if (puzzle.solutions.length > 1 && input !== "" && outcome === "") return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". "${input}" is not a valid solution.`);
        puzzle.solve(bot, game, player, announcement, outcome, doCommands, targetPlayer);
    }
    else if (command === "unsolve") {
        puzzle.unsolve(bot, game, player, announcement, null, doCommands);
    }
    else if (command === "attempt") {
        if (player === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Cannot attempt a puzzle without a player.`);
        const misc = {
            command: command,
            input: input,
            targetPlayer: targetPlayer
        };
        player.attemptPuzzle(bot, game, puzzle, null, input, command, misc);
    }

    return;
};
