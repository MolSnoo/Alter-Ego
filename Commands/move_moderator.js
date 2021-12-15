const settings = include('settings.json');

module.exports.config = {
    name: "move_moderator",
    description: "Moves the given player(s) to the specified room or exit.",
    details: 'Forcefully moves the specified players to the specified room or exit. If you use "living" or "all" in place of the players, '
        + 'it will move all living players to the specified room (skipping over players who are already in that room as well as players with the Headmaster role). '
        + 'All of the same things that happen when a player moves to a room of their own volition apply, however you can move players to non-adjacent rooms this way. '
        + 'The bot will not announce which exit the player leaves through or which entrance they enter from when a player is moved to a non-adjacent room.',
    usage: `${settings.commandPrefix}move joshua door 2\n`
        + `${settings.commandPrefix}move val amber devyn trial grounds\n`
        + `${settings.commandPrefix}move living diner\n`
        + `${settings.commandPrefix}move all elevator`,
    usableBy: "Moderator",
    aliases: ["move", "go", "enter", "walk", "m"],
    requiresGame: true
};

module.exports.run = async(bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify at least one player and a room. Usage:\n${exports.config.usage}`);

    // Get all listed players first.
    var players = [];
    if (args[0] === "all" || args[0] === "living") {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].talent !== "NPC" && !game.players_alive[i].member.roles.cache.find(role => role.id === settings.headmasterRole))
                players.push(game.players_alive[i]);
        }
        args.splice(0, 1);
    }
    else {
        for (let i = 0; i < game.players_alive.length; i++) {
            for (let j = 0; j < args.length; j++) {
                if (args[j].toLowerCase() === game.players_alive[i].name.toLowerCase()) {
                    players.push(game.players_alive[i]);
                    args.splice(j, 1);
                    break;
                }
            }
        }
    }
    // Args at this point should only include the room/exit name, as well as any players that weren't found.
    // Check to see that the last argument is the name of a room.
    var input = args.join(" ").replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
    var desiredRoom = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (input.endsWith(game.rooms[i].name)) {
            desiredRoom = game.rooms[i];
            input = input.substring(0, input.indexOf(desiredRoom.name));
            args = input.split("-");
            break;
        }
    }
    // Now, if the room couldn't be found, try looking for the name of an exit.
    // All given players must be in the same room for this to work.
    var isExit = false;
    var exit = null;
    var entrance = null;
    if (desiredRoom === null) {
        const currentRoom = players[0].location;
        for (let i = 1; i < players.length; i++) {
            if (players[i].location !== currentRoom) return game.messageHandler.addReply(message, "All listed players must be in the same room to use an exit name.");
        }
        input = args.join(" ").toUpperCase();
        for (let i = 0; i < currentRoom.exit.length; i++) {
            if (input.endsWith(currentRoom.exit[i].name)) {
                isExit = true;
                exit = currentRoom.exit[i];
                desiredRoom = exit.dest;
                for (let j = 0; j < desiredRoom.exit.length; j++) {
                    if (desiredRoom.exit[j].name === exit.link) {
                        entrance = desiredRoom.exit[j];
                        break;
                    }
                }

                input = input.substring(0, input.indexOf(exit.name));
                args = input.split(" ");
                break;
            }
        }
    }
    // Remove any blank entries in args.
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '') {
            args.splice(i, 1);
            i--;
        }
    }
    if (args.length > 0) {
        if (desiredRoom === null && exit === null) {
            const roomName = args.join(" ");
            return game.messageHandler.addReply(message, `Couldn't find room or exit "${roomName}".`);
        }
        else {
            const missingPlayers = args.join(", ");
            return game.messageHandler.addReply(message, `Couldn't find player(s): ${missingPlayers}.`);
        }
    }
    if (players.length === 0) return game.messageHandler.addReply(message, "You need to specify at least one player.");

    for (let i = 0; i < players.length; i++) {
        // Skip over players who are already in the specified room.
        if (players[i].location !== desiredRoom) {
            const currentRoom = players[i].location;
            // If an exit name was used, don't try and find it again.
            if (!isExit) {
                // Check to see if the given room is adjacent to the current player's room.
                exit = null;
                entrance = null;
                for (let j = 0; j < currentRoom.exit.length; j++) {
                    if (currentRoom.exit[j].dest === desiredRoom) {
                        exit = currentRoom.exit[j];
                        for (let k = 0; k < desiredRoom.exit.length; k++) {
                            if (desiredRoom.exit[k].name === exit.link) {
                                entrance = desiredRoom.exit[k];
                                break;
                            }
                        }
                        break;
                    }
                }
            }

            const appendString = players[i].createMoveAppendString();
            var exitMessage; 
            if (exit) exitMessage = `${players[i].displayName} exits into ${exit.name}${appendString}`;
            else exitMessage = `${players[i].displayName} exits${appendString}`;
            var entranceMessage;
            if (entrance) entranceMessage = `${players[i].displayName} enters from ${entrance.name}${appendString}`;
            else entranceMessage = `${players[i].displayName} enters${appendString}`;
            // Clear the player's movement timer first.
            players[i].isMoving = false;
            clearInterval(players[i].moveTimer);
            players[i].remainingTime = 0;
            players[i].moveQueue.length = 0;
            // Move the player.
            currentRoom.removePlayer(game, players[i], exit, exitMessage);
            desiredRoom.addPlayer(game, players[i], entrance, entranceMessage, true);
        }
    }

    game.messageHandler.addGameMechanicMessage(message.channel, `The listed players have been moved to ${desiredRoom.channel}.`);

    // Create a list of players moved for the log message.
    var playerList = players[0].name;
    if (players.length === 2) playerList += ` and ${players[1].name}`;
    else if (players.length >= 3) {
        for (let i = 1; i < players.length; i++) {
            if (i === players.length - 1) playerList += `, and ${players[i].name}`;
            else playerList += `, ${players[i].name}`;
        }
    }

    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${playerList} forcefully moved to ${desiredRoom.channel}`);

    return;
};
