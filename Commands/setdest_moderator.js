const settings = include('Configs/settings.json');

module.exports.config = {
    name: "setdest_moderator",
    description: "Updates an exit's destination.",
    details: "Replaces the destination for the specified room's exit. Given the following initial room setup:\n```"
        + "Room Name|Exits |Leads To|From\n"
        + "---------------------------------\n"
        + "room-1   |EXIT A|room-2  | EXIT B\n"
        + "---------------------------------\n"
        + "room-2   |EXIT B|room-1  | EXIT A\n"
        + "         |EXIT C|room-3  | EXIT D\n"
        + "---------------------------------\n"
        + "room-3   |EXIT D|room-2  | EXIT C```\n"
        + "If the destination for room-1's EXIT A is set to room-3's EXIT D, players passing through EXIT A would emerge from EXIT D from that point onward. "
        + "The Rooms sheet will be updated to reflect the updated destination, like so:\n```"
        + "room-1   |EXIT A|room-3  | EXIT D\n"
        + "---------------------------------\n"
        + "...\n"
        + "---------------------------------\n"
        + "room-3   |EXIT D|room-1  | EXIT A```\n"
        + "Note that this will leave room-2's EXIT B and EXIT C without exits that lead back to them, which will result in errors next time rooms are loaded. "
        + "To prevent this, this command should be used sparingly, and all affected exits should have their destinations reassigned.",
    usage: `${settings.commandPrefix}setdest corolla DOOR wharf VEHICLE\n`
        + `${settings.commandPrefix}setdest motor boat PORT docks BOAT\n`
        + `${settings.commandPrefix}setdest wharf MOTOR BOAT wharf MOTOR BOAT`,
    usableBy: "Moderator",
    aliases: ["setdest"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 4)
        return game.messageHandler.addReply(message, `You need to specify a room, an exit, another room, and another exit. Usage:\n${exports.config.usage}`);

    var input = args.join(" ");
    var parsedInput = input.replace(/ /g, "-").toLowerCase();

    // First, find the room.
    var room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.startsWith(game.rooms[i].name + '-')) {
            room = game.rooms[i];
            parsedInput = parsedInput.substring(room.name.length).replace(/-/g, " ").toUpperCase().trim();
            input = input.substring(input.toUpperCase().indexOf(parsedInput)).trim();
            break;
        }
        else if (parsedInput === game.rooms[i].name) return game.messageHandler.addReply(message, `You need to specify an exit in ${game.rooms[i].name}, another room, and another exit.`);
    }
    if (room === null) return game.messageHandler.addReply(message, `Couldn't find room "${input}".`);

    // Now that the room has been found, find the exit.
    var exit = null;
    for (let i = 0; i < room.exit.length; i++) {
        if (parsedInput.startsWith(room.exit[i].name + ' ')) {
            exit = room.exit[i];
            parsedInput = parsedInput.substring(exit.name.length).toLowerCase().trim().replace(/ /g, "-");
            input = input.substring(input.replace(/ /g, "-").toLowerCase().indexOf(parsedInput)).trim();
            break;
        }
        else if (parsedInput === room.exit[i].name) return game.messageHandler.addReply(message, `You need to specify another room and another exit for ${exit.name} of ${room.name} to lead to.`);
    }
    if (exit === null) return game.messageHandler.addReply(message, `Couldn't find exit "${input}" in ${room.name}.`);

    // Now find the destination room.
    var destRoom = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.startsWith(game.rooms[i].name + '-')) {
            destRoom = game.rooms[i];
            parsedInput = parsedInput.substring(destRoom.name.length).replace(/-/g, " ").toUpperCase().trim();
            input = input.substring(input.toUpperCase().indexOf(parsedInput)).trim();
            break;
        }
        else if (parsedInput === game.rooms[i].name) return game.messageHandler.addReply(message, `You need to specify an exit in ${game.rooms[i].name} for ${exit.name} of ${room.name} to lead to.`);
    }
    if (destRoom === null) return game.messageHandler.addReply(message, `Couldn't find room "${input}".`);

    // Now that the destination room has been found, find the destination exit.
    var destExit = null;
    for (let i = 0; i < destRoom.exit.length; i++) {
        if (destRoom.exit[i].name === parsedInput) {
            destExit = destRoom.exit[i];
            parsedInput = parsedInput.substring(destExit.name.length).toLowerCase().trim().replace(/ /g, "-");
            input = input.substring(input.replace(/ /g, "-").toLowerCase().indexOf(parsedInput)).trim();
            break;
        }
    }
    if (destExit === null) return game.messageHandler.addReply(message, `Couldn't find exit "${input}" in ${destRoom.name}.`);

    exit.dest = destRoom;
    exit.link = destExit.name;
    destExit.dest = room;
    destExit.link = exit.name;

    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully updated destination of ${exit.name} in ${room.name}.`);

    return;
};
