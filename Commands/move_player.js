﻿const settings = include('settings.json');

module.exports.config = {
    name: "move_player",
    description: "Moves you to another room.",
    details: 'Moves you to another room. You will be removed from the current channel and put into the channel corresponding to the room you specify. '
        + 'You can specify either an exit of the current room or the name of the desired room, if you know it. Note that you can only move to adjacent rooms. '
        + 'It is recommended that you open the new channel immediately so that you can start seeing messages as soon as you\'re added. '
        + 'The room description will be sent to you via DMs.',
    usage: `${settings.commandPrefix}move door 1\n`
        + `${settings.commandPrefix}enter door 1\n`
        + `${settings.commandPrefix}go locker room`,
    usableBy: "Player",
    aliases: ["move", "go", "exit", "enter", "walk"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `you need to specify a room. Usage:\n${exports.config.usage}`);

    const status = player.getAttributeStatusEffects("disable move");
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
    // If the player has the headmaster role, they can move to any room they please.
    if (player.member.roles.find(role => role.id === settings.headmasterRole)) {
        adjacent = true;
        for (let i = 0; i < game.rooms.length; i++) {
            if (game.rooms[i].name === input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase()) {
                desiredRoom = game.rooms[i];
                exitMessage = `${player.displayName} suddenly disappears${appendString}`;
                entranceMessage = `${player.displayName} suddenly appears${appendString}`;
                break;
            }
        }
    }
    // Otherwise, check that the desired room is adjacent to the current room.
    else {
        for (let i = 0; i < currentRoom.exit.length; i++) {
            if (currentRoom.exit[i].dest.name === input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase()
                || currentRoom.exit[i].name === input.toUpperCase()) {
                //if (!currentRoom.exit[i].unlocked) return game.messageHandler.addReply(message, "that exit is locked.");
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
    }
    if (!adjacent) return game.messageHandler.addReply(message, "you can't move to that room.");

    if (desiredRoom) {
        if (exit) {
            await player.move(game, false, currentRoom, desiredRoom, exit, entrance, exitMessage, entranceMessage);
        }
        else {
            currentRoom.removePlayer(game, player, exit, exitMessage);
            desiredRoom.addPlayer(game, player, entrance, entranceMessage, true);

            // Post log message.
            const time = new Date().toLocaleTimeString();
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} moved to ${desiredRoom.channel}`);
        }
    }
    else return game.messageHandler.addReply(message, `couldn't find "${input}"`);

    return;
};
