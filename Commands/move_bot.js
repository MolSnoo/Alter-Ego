const settings = include('settings.json');

module.exports.config = {
    name: "move_bot",
    description: "Moves the given player(s) to the specified room.",
    details: 'Forcefully moves the specified player to the specified room. If you use "all" in place of the player, '
        + 'it will move all living players to the specified room (skipping over players who are already in that room as well as players with the Headmaster role). '
        + 'If you use "player" in place of the player, then the player who triggered the command will be moved.'
        + 'All of the same things that happen when a player moves to a room of their own volition apply, however you can move players to non-adjacent rooms this way. '
        + 'The bot will not announce which exit the player leaves through or which entrance they enter from when a player is moved to a non-adjacent room.',
    usage: `${settings.commandPrefix}move susie main-office\n`
        + `${settings.commandPrefix}move player general-managers-office`
        + `${settings.commandPrefix}move player cafeteria`
        + `${settings.commandPrefix}move all elevator`,
    usableBy: "Bot",
    aliases: ["move"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");
    if (args.length === 0) {
        game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    // Get all listed players first.
    var players = [];
    if (args[0].toLowerCase() === "player" && player !== null) {
        players.push(player);
        args.splice(0, 1);
    }
    else if (args[0].toLowerCase() === "all") {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].talent !== "NPC" && !game.players_alive[i].member.roles.cache.find(role => role.id === settings.headmasterRole))
                players.push(game.players_alive[i]);
        }
        args.splice(0, 1);
    }
    else {
        player = null;
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
                player = game.players_alive[i];
                break;
            }
        }
        if (player === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find player "${args[0]}".`);
        players.push(player);
        args.splice(0, 1);
    }
    // Args at this point should only include the room name.
    // Check to see that the last argument is the name of a room.
    var input = args.join(" ").replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
    var desiredRoom = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (game.rooms[i].name === input) {
            desiredRoom = game.rooms[i];
            input = input.substring(0, input.indexOf(desiredRoom.name));
            args = input.split("-");
            break;
        }
    }
    if (desiredRoom === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${input}".`);

    for (let i = 0; i < players.length; i++) {
        // Skip over players who are already in the specified room.
        if (players[i].location !== desiredRoom) {
            const currentRoom = players[i].location;
            // Check to see if the given room is adjacent to the current player's room.
            var exit = null;
            let exitPuzzle = null;
            var entrance = null;
            for (let j = 0; j < currentRoom.exit.length; j++) {
                if (currentRoom.exit[j].dest === desiredRoom) {
                    exit = currentRoom.exit[j];
                    exitPuzzle = game.puzzles.find(puzzle => puzzle.location.name === currentRoom.name && puzzle.name === exit.name && puzzle.type === "restricted exit");
                    for (let k = 0; k < desiredRoom.exit.length; k++) {
                        if (desiredRoom.exit[k].name === exit.link) {
                            entrance = desiredRoom.exit[k];
                            break;
                        }
                    }
                    break;
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
            // Solve the exit puzzle, if applicable.
            if (exitPuzzle && exitPuzzle.accessible && exitPuzzle.solutions.includes(players[i].name))
                exitPuzzle.solve(bot, game, players[i], "", players[i].name, true);
            // Move the player.
            currentRoom.removePlayer(game, players[i], exit, exitMessage);
            desiredRoom.addPlayer(game, players[i], entrance, entranceMessage, true);
        }
    }

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
