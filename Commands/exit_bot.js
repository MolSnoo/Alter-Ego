const settings = include('settings.json');

module.exports.config = {
    name: "exit_bot",
    description: "Locks or unlocks an exit.",
    details: "Locks or unlocks an exit in the specified room. The corresponding entrance in the room the exit leads to "
        + "will also be locked, so that it goes both ways. When an exit is locked, players will be unable to enter the room "
        + "that exit leads to, and will be unable to enter through the exit from another room.",
    usage: `exit lock carousel door\n`
        + `exit unlock headmasters quarters door\n`
        + `lock warehouse door 3\n`
        + `unlock trial grounds elevator`,
    usableBy: "Bot",
    aliases: ["exit", "room", "lock", "unlock"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");
    var input = cmdString;
    if (command === "exit" || command === "room") {
        if (args[0] === "lock") command = "lock";
        else if (args[0] === "unlock") command = "unlock";
        args = input.substring(input.indexOf(args[1])).split(" ");
    }

    if (args.length === 0) {
        game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    input = args.join(" ");
    var parsedInput = input.replace(/ /g, "-").toLowerCase();

    // First, find the room.
    var room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.startsWith(game.rooms[i].name + '-')) {
            room = game.rooms[i];
            parsedInput = parsedInput.substring(room.name.length).replace(/-/g, " ").toUpperCase().trim();
            input = input.substring(input.toUpperCase().indexOf(parsedInput));
            break;
        }
        else if (parsedInput === game.rooms[i].name) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". No exit was given.`);
    }
    if (room === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${input}".`);

    // Now that the room has been found, find the exit and its corresponding entrance.
    var exitIndex = -1;
    var exit = null;
    var entranceIndex = -1;
    var entrance = null;
    for (let i = 0; i < room.exit.length; i++) {
        if (room.exit[i].name === parsedInput) {
            exitIndex = i;
            exit = room.exit[i];
            for (let j = 0; j < exit.dest.exit.length; j++) {
                if (exit.dest.exit[j].name === exit.link) {
                    entranceIndex = j;
                    entrance = exit.dest.exit[j];
                    break;
                }
            }
            break;
        }
    }
    if (exit === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find exit "${input}" in ${room.name}.`);
    if (entrance === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Found exit ${exit.name} in ${room.name}, but it doesn't have a corresponding entrance in ${exit.dest.name}.`);
    if (command === "unlock" && exit.unlocked && entrance.unlocked) return;
    if (command === "lock" && !exit.unlocked && !entrance.unlocked) return;

    // Now lock or unlock the exit.
    if (command === "lock") {
        room.lock(game, exitIndex);
        exit.dest.lock(game, entranceIndex);
    }
    else if (command === "unlock") {
        room.unlock(game, exitIndex);
        exit.dest.unlock(game, entranceIndex);
    }

    return;
};
