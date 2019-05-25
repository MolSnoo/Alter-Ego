const discord = require("discord.js");
const settings = require("../settings.json");

const sheet = require("../House-Data/sheets.js");
const house = require("./gethousedata.js");
const move = require("./move.js");
const status = require("./status.js");
const room = require("./room.js");

//>use [object]

module.exports.run = async (bot, config, message, args) => {
    // Determine if the user is a player.
    var isPlayer = false;
    var currentPlayer;
    for (var i = 0; i < config.players_alive.length; i++) {
        if (message.author.id === config.players_alive[i].id) {
            isPlayer = true;
            currentPlayer = config.players_alive[i];
            break;
        }
    }

    if ((message.channel.parentID !== config.parent_channel)
        && (!isPlayer || message.channel.type !== "dm")) return;

    let usage = new discord.RichEmbed()
        .setTitle("Command Help")
        .setColor("a42004")
        .setDescription(`${settings.prefix}use [object] OR ${settings.prefix}use [object] [password]`);

    if (!config.game) return message.reply("There is no game currently running");

    if (!args.length) {
        message.reply("you need to specify an object. Usage:");
        message.channel.send(usage);
        return;
    }

    const statuses = currentPlayer.statusString;
    if (statuses.includes("asleep")) return message.reply("you are **asleep**. You cannot do anything.");
    if (statuses.includes("unconscious")) return message.reply("you are **unconscious**. You cannot do anything.");
    if (statuses.includes("heated")) return message.reply("the situation is **heated**. Moderator intervention is required.");
    if (statuses.includes("restricted")) return message.reply("you are **restricted**. You cannot move.");
    if (statuses.includes("hidden")) return message.reply(`you are currently **hidden**. Use "${settings.prefix}hide unhide" first.`);

    const guild = bot.guilds.find(guild => guild.id === config);
    const channel = guild.channels.find(channel => channel.name === currentPlayer.location);
    const moderators = guild.roles.find(role => role.name === config.role_needed);
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase();
    parsedInput = parsedInput.replace(/\'/g, "");
    var arguments;

    const inventory = currentPlayer.inventory;
    var hasItem = false;

    var current = 0;
    for (current; current < inventory.length; current++) {
        if (inventory[current].name === parsedInput) {
            hasItem = true;
            break;
        }
    }

    if (hasItem) {
        if (inventory[current].uses === 0) return message.reply("that item has no uses left.");
        if (inventory[current].name !== "MASK" && inventory[current].effect !== "" && statuses.includes(inventory[current].effect)) return message.reply("you cannot use that item as you are already under its effect.");
        if (!inventory[current].effect && !inventory[current].cures) return message.reply("that item has no programmed use.");
        else {
            for (var i = 0; i < config.statusEffects.length; i++) {
                if (inventory[current].effect !== "") {
                    if (inventory[current].name === "MASK" && config.statusEffects[i].name === "concealed" && statuses.includes("concealed"))
                        status.cure(currentPlayer, config.statusEffects[i], config, bot, true);
                    else if (config.statusEffects[i].name === inventory[current].effect)
                        status.inflict(currentPlayer, config.statusEffects[i], config, bot, true);
                }
                if (inventory[current].cures !== "") {
                    if (config.statusEffects[i].name === inventory[current].cures) {
                        const statusMessage = status.cure(currentPlayer, config.statusEffects[i], config, bot, true, true);
                        if (statusMessage === "Specified player doesn't have that status.")
                            return message.reply("you attempted to use the " + inventory[current].name + ", but it had no effect.");
                    }
                }
            }
            if (!isNaN(inventory[current].uses)) {
                inventory[current].uses--;
                sheet.updateCell(inventory[current].usesCell(), inventory[current].uses);
            }
            if (inventory[current].name !== "MASK")
                channel.send(currentPlayer.name + " takes out " + inventory[current].singleContainingPhrase + " and uses it.");
        }
    }
    else {
        // We're going to be using this conditional a lot, so let's make it more concise.
        var concealedPlayerinRoom = false;
        let concealedPlayer = config.concealedPlayer.member;
        if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
            concealedPlayerinRoom = true;
        }

        // Check if the input is a puzzle.
        const puzzles = config.puzzles;
        var isPuzzle = false;

        current = 0;
        for (current; current < puzzles.length; current++) {
            if (puzzles[current].parentObject !== ""
                && parsedInput.startsWith(puzzles[current].parentObject + ' ')
                && (puzzles[current].location === currentPlayer.location)) {
                isPuzzle = true;
                arguments = input.substring(puzzles[current].parentObject.length + 1);
                break;
            }
            else if (puzzles[current].parentObject !== ""
                && parsedInput === puzzles[current].parentObject
                && (puzzles[current].location === currentPlayer.location)) {
                isPuzzle = true;
                arguments = input.substring(puzzles[current].parentObject.length + 1);
                break;
            }
            else if (parsedInput.startsWith(puzzles[current].name)
                && (puzzles[current].location === currentPlayer.location)) {
                isPuzzle = true;
                arguments = input.substring(puzzles[current].name.length + 1);
                break;
            }
        }

        if (isPuzzle) {
            const scope = {
                bot: bot,
                config: config,
                message: message,
                currentPlayer: currentPlayer,
                input: input,
                puzzle: puzzles[current],
                statuses: statuses,
                concealedPlayerinRoom: concealedPlayerinRoom,
                concealedPlayer: concealedPlayer,
                channel: channel,
                logchannel: logchannel
            }
            // Determine if puzzle should be accessible or not by checking if it requires another puzzle to be solved.
            if (puzzles[current].requires.startsWith("Puzzle: ")) {
                for (var i = 0; i < puzzles.length; i++) {
                    if ((puzzles[i].name === puzzles[current].requires.substring(("Puzzle: ").length))
                        && (puzzles[i].location === puzzles[current].location)) {
                        if (puzzles[i].solved) {
                            puzzles[current].accessible = true;
                            //sheet.updateCell(puzzles[current].accessibleCell(), "TRUE");
                            break;
                        }
                        else {
                            puzzles[current].accessible = false;
                            //sheet.updateCell(puzzles[current].accessibleCell(), "FALSE");
                            break;
                        }
                    }
                }
            }
            if (puzzles[current].accessible) {
                // Check if puzzle is solvable.
                //if (puzzles[current].solved && !puzzles[current].type.endsWith("lock")) return message.reply("this puzzle has already been solved.");
                if (!puzzles[current].solved) {
                    if (puzzles[current].requiresMod && message.channel.type !== "dm") return message.reply(`you need ${moderators} assistance to do that.`);
                    else if (puzzles[current].requiresMod && message.channel.type === "dm") return message.reply(`you need moderator assistance to do that.`);
                }
                if (puzzles[current].remainingAttempts === 0) {
                    sheet.getData(puzzles[current].noMoreAttemptsCell(), function (response) {
                        if (statuses.includes("concealed")) channel.send("A masked figure attempts and fails to use the " + puzzles[current].name + ".");
                        else {
                            const announcement = currentPlayer.name + " attempts and fails to use the " + puzzles[current].name + ".";
                            channel.send(announcement);
                            if (concealedPlayerinRoom) concealedPlayer.send(announcement);
                        }
                        message.author.send(response.data.values[0][0]);
                    });
                    if (message.channel.type !== "dm")
                        message.delete().catch();
                    return;
                }
                var hasRequiredItem = false;
                var requirementsMet = false;
                if (puzzles[current].requires.startsWith("Item: ")) {
                    for (var i = 0; i < currentPlayer.inventory.length; i++) {
                        if (currentPlayer.inventory[i].name === puzzles[current].requires.substring(("Item: ").length)) {
                            hasRequiredItem = true;
                            break;
                        }
                    }
                }
                else hasRequiredItem = true;
                if (puzzles[current].solved || hasRequiredItem)
                    requirementsMet = true;

                // Puzzle is solvable. 
                if (requirementsMet) {
                    if (puzzles[current].type === "password") {
                        if (puzzles[current].solved) {
                            puzzleAlreadySolved(
                                scope,
                                "uses the " + puzzles[current].name + "."
                            );
                        }
                        else {
                            if (arguments === "")
                                return message.reply("you need to enter a password.");
                            else if (arguments === puzzles[current].solution) {
                                exports.solvePuzzle(
                                    scope,
                                    "uses the " + puzzles[current].name + ".",
                                    currentPlayer.name + " solved " + puzzles[current].name + " in " + channel
                                );
                            }
                            else {
                                failPuzzle(
                                    scope,
                                    "uses the " + puzzles[current].name + ".",
                                    currentPlayer.name + " attempted and failed to solve " + puzzles[current].name + " in " + channel
                                );
                            }
                        }
                    }

                    else if (puzzles[current].type === "interact") {
                        if (puzzles[current].solved) {
                            puzzleAlreadySolved(
                                scope,
                                "uses the " + puzzles[current].name + "."
                            );
                        }
                        else {
                            exports.solvePuzzle(
                                scope,
                                "uses the " + puzzles[current].name + ".",
                                currentPlayer.name + " solved " + puzzles[current].name + " in " + channel
                            );
                        }
                    }

                    else if (puzzles[current].type.endsWith("lock")) {
                        // The lock is currently unlocked.
                        if (puzzles[current].solved) {
                            if (arguments === "" || arguments === puzzles[current].solution) {
                                puzzleAlreadySolved(
                                    scope,
                                    "opens the " + puzzles[current].parentObject + "."
                                );
                            }
                            // If the player enters something that isn't the solution, lock it.
                            else if (hasRequiredItem) {
                                exports.unsolvePuzzle(
                                    scope,
                                    "locks the " + puzzles[current].parentObject + ".",
                                    "You lock the " + puzzles[current].parentObject + ".",
                                    currentPlayer.name + " locked " + puzzles[current].parentObject + " in " + channel
                                );
                            }
                        }
                        // The lock is locked.
                        else {
                            if (puzzles[current].type === "combination lock" && arguments === "")
                                return message.reply("you need to enter a combination. The format is #-#-#.");
                            else if (arguments === puzzles[current].solution) {
                                exports.solvePuzzle(
                                    scope,
                                    "unlocks the " + puzzles[current].parentObject + ".",
                                    currentPlayer.name + " unlocked " + puzzles[current].parentObject + " in " + channel
                                );
                            }
                            else {
                                failPuzzle(
                                    scope,
                                    "attempts and fails to unlock " + puzzles[current].parentObject + ".",
                                    currentPlayer.name + " attempted and failed to unlock " + puzzles[current].parentObject + " in " + channel
                                );
                            }
                        }
                    }

                    else if (puzzles[current].type === "hidden object") {
                        if (puzzles[current].solved) {
                            puzzleAlreadySolved(
                                scope,
                                "inspects the " + puzzles[current].name + "."
                            );
                        }
                    }

                    else {
                        if (message.channel.type !== "dm") return message.reply(`this puzzle is supposed to be solvable, but I am not programmed to do it. ${moderators} assistance required.`);
                        else return message.reply(`this puzzle is supposed to be solvable, but I am not programmed to do it. Moderator assistance required.`);
                    }
                }
                // The player is missing an item needed to solve the puzzle.
                else {
                    requirementsNotMet(
                        scope,
                        "attempts to use the " + puzzles[current].name + ", but struggles."
                    );
                }

                if (message.channel.type !== "dm")
                    message.delete().catch();
            }
            // The puzzle isn't accessible.
            else {
                requirementsNotMet(
                    scope,
                    "uses the " + puzzles[current].name + "."
                );
            }
        }
        else message.reply("couldn't find \"" + input + "\". Contact a moderator if you believe this to be a mistake.");
    }
};

module.exports.solvePuzzle = function (scope, message, logmessage) {
    sheet.getData(scope.puzzle.correctCell(), function (response) {
        if (scope.statuses.includes("concealed")) scope.channel.send("A masked figure " + message);
        else {
            const announcement = scope.currentPlayer.name + ' ' + message;
            scope.channel.send(announcement);
            if (scope.concealedPlayerinRoom) scope.concealedPlayer.send(announcement);
        }
        const member = scope.channel.guild.members.find(member => member.id === scope.currentPlayer.id);
        member.send(response.data.values[0][0]);
        scope.puzzle.solved = true;
        sheet.updateCell(scope.puzzle.solvedCell(), "TRUE", function (response) {
            house.getObjects(scope.config);
            house.getItems(scope.config);
            house.getPuzzles(scope.config);
        });
    });

    const guild = scope.bot.guilds.find(guild => guild.name === scope.config.server_name);

    const solvedCommands = scope.puzzle.solvedCommand.split(',');
    for (var i = 0; i < solvedCommands.length; i++) {
        const command = solvedCommands[i].split(' ');
        if (command[0] === "status") {
            const statusArg = solvedCommands[i].slice(solvedCommands[i].indexOf(command[3]));
            var currentStatus;
            for (var j = 0; j < scope.config.statusEffects.length; j++) {
                if (scope.config.statusEffects[j].name === statusArg) {
                    currentStatus = scope.config.statusEffects[j];
                    break;
                }
            }
            if (command[1] === "add") {
                if (command[2] === "all") {
                    for (var j = 0; j < scope.config.players_alive.length; j++)
                        status.inflict(scope.config.players_alive[j], currentStatus, scope.config, scope.bot, false);
                    sheet.getData(currentStatus.inflictedCell(), function (response) {
                        scope.channel.guild.channels.find(channel => channel.name === "announcements").send(response.data.values[0][0]);

                    });
                    if (statusArg === "deaf")
                        scope.config.playersDeafened = true;
                }
                else if (command[2] === "player")
                    status.inflict(scope.currentPlayer, currentStatus, scope.config, scope.bot, true);
            }
            else if (command[1] === "remove") {
                if (command[2] === "all") {
                    for (var j = 0; j < scope.config.players_alive.length; j++)
                        status.cure(scope.config.players_alive[j], currentStatus, scope.config, scope.bot, false);
                    sheet.getData(currentStatus.curedCell(), function (response) {
                        scope.channel.guild.channels.find(channel => channel.name === "announcements").send(response.data.values[0][0]);
                    });
                    if (statusArg === "deaf")
                        scope.config.playersDeafened = false;
                }
                else if (command[2] === "player")
                    status.cure(scope.currentPlayer, currentStatus, scope.config, scope.bot, true);
            }
        }
        else if (command[0] === "puzzle") {
            const puzzleArg = solvedCommands[i].slice(solvedCommands[i].indexOf(command[2]));
            var currentPuzzle;
            for (var j = 0; j < scope.config.puzzles.length; j++) {
                if (scope.config.puzzles[j].name === puzzleArg) {
                    currentPuzzle = scope.config.puzzles[j];
                    break;
                }
            }
            if (command[1] === "unsolve") {
                currentPuzzle.solved = false;
                sheet.updateCell(currentPuzzle.solvedCell(), "FALSE", function (response) {
                    house.getObjects(scope.config);
                    house.getItems(scope.config);
                    house.getPuzzles(scope.config);
                });
            }
        }
        else if (command[0] === "room") {
            var currentRoom;
            for (var j = 0; j < scope.config.rooms.length; j++) {
                if (scope.config.rooms[j].name === command[2]) {
                    currentRoom = scope.config.rooms[j];
                    break;
                }
            }

            const channel = guild.channels.find(channel => channel.name === currentRoom.name);
            const scopeParam = {
                channel: channel,
                config: scope.config
            };

            if (command[1] === "lock")
                room.lockRoom(scopeParam, currentRoom);
            else if (command[1] === "unlock")
                room.unlockRoom(scopeParam, currentRoom);
        }
        else if (command[0] === "move") {
            var desiredRoom;
            for (var j = 0; j < scope.config.rooms.length; j++) {
                if (scope.config.rooms[j].name === command[2]) {
                    desiredRoom = j;
                    break;
                }
            }

            if (command[1] === "all") {
                for (var j = 0; j < scope.config.players_alive.length; j++) {
                    var currentPlayer = scope.config.players_alive[j];
                    var currentRoom;
                    for (var k = 0; k < scope.config.rooms.length; k++) {
                        if (scope.config.rooms[k].name === currentPlayer.location) {
                            currentRoom = k;
                            break;
                        }
                    }
                    const scopeParam = {
                        guild: guild,
                        config: scope.config,
                        message: scope.message,
                        currentPlayer: currentPlayer,
                        statuses: currentPlayer.statusString,
                        room: scope.config.rooms,
                        currentRoom: currentRoom,
                        desiredRoom: desiredRoom
                    }
                    if (currentPlayer.location !== scope.config.rooms[desiredRoom.name])
                        move.movePlayer(scopeParam, "enters", "exits");
                }
            }
            else if (command[1] === "player") {
                var currentRoom;
                for (var j = 0; j < scope.config.rooms.length; j++) {
                    if (scope.config.rooms[j].name === scope.currentPlayer.location) {
                        currentRoom = j;
                        break;
                    }
                }
                const scopeParam = {
                    guild: guild,
                    config: scope.config,
                    message: scope.message,
                    currentPlayer: scope.currentPlayer,
                    statuses: scope.currentPlayer.statusString,
                    room: scope.config.rooms,
                    currentRoom: currentRoom,
                    desiredRoom: desiredRoom
                }
                if (scope.currentPlayer.location !== scope.config.rooms[desiredRoom.name])
                    move.movePlayer(scopeParam, "enters", "exits");
            }
        }
    }

    // Post log message
    var time = new Date();
    scope.logchannel.send(time.toLocaleTimeString() + " - " + logmessage);
}

function failPuzzle(scope, message, logmessage) {
    var remainingAttempts = "";
    if (!isNaN(scope.puzzle.remainingAttempts)) {
        scope.puzzle.remainingAttempts--;
        remainingAttempts = scope.puzzle.remainingAttempts.toString();
    }

    sheet.updateCell(scope.puzzle.attemptsCell(), remainingAttempts, function (response) {
        sheet.getData(scope.puzzle.incorrectCell(), function (response) {
            if (scope.statuses.includes("concealed")) scope.channel.send("A masked figure " + message);
            else {
                const announcement = scope.currentPlayer.name + ' ' + message;
                scope.channel.send(announcement);
                if (scope.concealedPlayerinRoom) scope.concealedPlayer.send(announcement);
            }
            scope.message.author.send(response.data.values[0][0]);
        });
    });

    // Post log message
    var time = new Date();
    scope.logchannel.send(time.toLocaleTimeString() + " - " + logmessage);
}

function puzzleAlreadySolved(scope, message) {
    sheet.getData(scope.puzzle.alreadySolvedCell(), function (response) {
        if (scope.statuses.includes("concealed")) scope.channel.send("A masked figure " + message);
        else {
            const announcement = scope.currentPlayer.name + ' ' + message;
            scope.channel.send(announcement);
            if (scope.concealedPlayerinRoom) scope.concealedPlayer.send(announcement);
        }
        scope.message.author.send(response.data.values[0][0]);
    });
}

module.exports.unsolvePuzzle = function (scope, message, directMessage, logmessage) {
    if (scope.statuses.includes("concealed")) scope.channel.send("A masked figure " + message);
    else {
        const announcement = scope.currentPlayer.name + ' ' + message;
        scope.channel.send(announcement);
        if (scope.concealedPlayerinRoom) scope.concealedPlayer.send(announcement);
    }
    const member = scope.channel.guild.members.find(member => member.id === scope.currentPlayer.id);
    member.send(directMessage);
    scope.puzzle.solved = false;
    sheet.updateCell(scope.puzzle.solvedCell(), "FALSE", function (response) {
        house.getObjects(scope.config);
        house.getItems(scope.config);
        house.getPuzzles(scope.config);
    });

    // Post log message
    var time = new Date();
    scope.logchannel.send(time.toLocaleTimeString() + " - " + logmessage);
}

function requirementsNotMet(scope, message) {
    sheet.getData(scope.puzzle.requirementsNotMetCell(), function (response) {
        // If there's no text in the Requirements Not Met cell, then the player shouldn't know about this puzzle.
        if (!response.data.values || response.data.values[0][0] === "") {
            scope.message.reply("couldn't find \"" + scope.input + "\". Contact a moderator if you believe this to be a mistake.");
        }
        // If there is text there, then the object in the puzzle is interactable, but doesn't do anything until the required puzzle has been solved.
        else {
            if (scope.statuses.includes("concealed")) scope.channel.send("A masked figure " + message);
            else {
                const announcement = scope.currentPlayer.name + ' ' + message;
                scope.channel.send(announcement);
                if (scope.concealedPlayerinRoom) scope.concealedPlayer.send(announcement);
            }
            scope.message.author.send(response.data.values[0][0]);
        }
    });
}

module.exports.help = {
    name: "use"
};