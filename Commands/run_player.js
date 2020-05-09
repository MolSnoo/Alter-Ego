const settings = include('settings.json');

module.exports.config = {
    name: "run_player",
    description: "Runs to another room.",
    details: 'Moves you to another room by running. This functions the same as the move command, however you will move twice as quickly and lose stamina '
        + 'at three times the normal rate. You will be removed from the current channel and put into the channel corresponding to the room you specify. '
        + 'You can specify either an exit of the current room or the name of the desired room, if you know it. Note that you can only move to adjacent rooms. '
        + 'It is recommended that you open the new channel immediately so that you can start seeing messages as soon as you\'re added. '
        + 'The room description will be sent to you via DMs.',
    usage: `${settings.commandPrefix}run hall 1\n`
        + `${settings.commandPrefix}run botanical garden`,
    usableBy: "Player",
    aliases: ["run"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `you need to specify a room. Usage:\n${exports.config.usage}`);

    const status = player.getAttributeStatusEffects("disable run");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    if (player.isMoving) return game.messageHandler.addReply(message, `You cannot do that because you are already moving.`);

    var input = args.join(" ");

    const currentRoom = player.location;
    var adjacent = false;
    var exit = null;
    var exitMessage = "";
    var desiredRoom = null;
    var entrance = null;
    var entranceMessage = "";
    const appendString = player.createMoveAppendString();
    for (let i = 0; i < currentRoom.exit.length; i++) {
        if (currentRoom.exit[i].dest.name === input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase()
            || currentRoom.exit[i].name === input.toUpperCase()) {
            if (!currentRoom.exit[i].unlocked) return game.messageHandler.addReply(message, "that exit is locked.");
            adjacent = true;
            exit = currentRoom.exit[i];
            exitMessage = `${player.displayName} exits into ${exit.name}${appendString}`;
            desiredRoom = exit.dest;

            // Find the correct entrance.
            for (let j = 0; j < desiredRoom.exit.length; j++) {
                if (desiredRoom.exit[j].name === currentRoom.exit[i].link) {
                    entrance = desiredRoom.exit[j];
                    entranceMessage = `${player.displayName} enters from ${entrance.name}${appendString}`;
                    break;
                }
            }
            break;
        }
    }
    if (!adjacent) return game.messageHandler.addReply(message, "you can't move to that room.");

    if (desiredRoom && exit) await player.move(game, true, currentRoom, desiredRoom, exit, entrance, exitMessage, entranceMessage);
    else return game.messageHandler.addReply(message, `couldn't find "${input}"`);

    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} ran to ${desiredRoom.channel}`);

    return;
};
