const settings = require("../settings.json");

module.exports.config = {
    name: "exit_moderator",
    description: "Locks or unlocks an exit.",
    details: "Locks or unlocks an exit in the specified room. The corresponding entrance in the room the exit leads to "
        + "will also be locked, so that it goes both ways. When an exit is locked, players will be unable to enter the room "
        + "that exit leads to, and will be unable to enter through the exit from another room. If the exit can also be locked "
        + "or unlocked via a puzzle, you should NOT lock/unlock it with this command. Instead, use the puzzle command to "
        + "solve/unsolve it.",
    usage: `${settings.commandPrefix}exit lock carousel door\n`
        + `${settings.commandPrefix}exit unlock headmasters quarters door\n`
        + `${settings.commandPrefix}lock warehouse door 3\n`
        + `${settings.commandPrefix}unlock trial grounds elevator`,
    usableBy: "Moderator",
    aliases: ["exit", "room", "lock", "unlock"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    var input = command + " " + args.join(" ");
    if (command === "exit" || command === "room") {
        if (args[0] === "lock") command = "lock";
        else if (args[0] === "unlock") command = "unlock";
        args = input.substring(input.indexOf(args[1])).split(" ");
    }

    if (args.length === 0) {
        message.reply("you need to input a room and an exit. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    input = args.join(" ");
    var parsedInput = input.replace(/ /g, "-").toLowerCase();

    // First, find the room.
    var room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.startsWith(game.rooms[i].name)) {
            room = game.rooms[i];
            parsedInput = parsedInput.substring(room.name.length).replace(/-/g, " ").toUpperCase().trim();
            input = input.substring(input.toUpperCase().indexOf(parsedInput));
            break;
        }
    }
    if (room === null) return message.reply(`couldn't find room "${input}".`);

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
    if (exit === null) return message.reply(`couldn't find exit "${input}" in ${room.name}.`);
    if (entrance === null) return message.reply(`found exit ${exit.name} in ${room.name}, but it doesn't have a corresponding entrance in ${exit.dest.name}.`);
    if (command === "unlock" && exit.unlocked && entrance.unlocked) return message.reply(`${exit.name} in ${room.name} and ${entrance.name} in ${exit.dest.name} are already unlocked.`);
    if (command === "lock" && !exit.unlocked && !entrance.unlocked) return message.reply(`${exit.name} in ${room.name} and ${entrance.name} in ${exit.dest.name} are already locked.`);

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
