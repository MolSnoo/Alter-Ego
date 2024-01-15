const constants = include('Configs/constants.json');
const commandHandler = include(`${constants.modulesDir}/commandHandler.js`);

const Narration = include(`${constants.dataDir}/Narration.js`);

class Puzzle {
    constructor(name, solved, outcome, requiresMod, location, parentObjectName, type, accessible, requirementsStrings, solutions, remainingAttempts, commandSetsString, commandSets, correctDescription, alreadySolvedDescription, incorrectDescription, noMoreAttemptsDescription, requirementsNotMetDescription, row) {
        this.name = name;
        this.solved = solved;
        this.outcome = outcome;
        this.requiresMod = requiresMod;
        this.location = location;
        this.parentObjectName = parentObjectName;
        this.parentObject = null;
        this.type = type;
        this.accessible = accessible;
        this.requirementsStrings = requirementsStrings;
        this.requirements = [...requirementsStrings];
        this.solutions = solutions;
        this.remainingAttempts = remainingAttempts;
        this.commandSetsString = commandSetsString;
        this.commandSets = commandSets;
        this.correctDescription = correctDescription;
        this.alreadySolvedDescription = alreadySolvedDescription;
        this.incorrectDescription = incorrectDescription;
        this.noMoreAttemptsDescription = noMoreAttemptsDescription;
        this.requirementsNotMetDescription = requirementsNotMetDescription;
        this.row = row;
    }

    setAccessible() {
        this.accessible = true;
    }

    setInaccessible() {
        this.accessible = false;
    }

    async solve(bot, game, player, message, outcome, doSolvedCommands) {
        // Mark it as solved.
        this.solved = true;
        // Set the outcome.
        if (this.solutions.length > 1) {
            if (outcome)
                this.outcome = outcome;
            else this.outcome = this.solutions[0];
        }

        // Let the player and anyone else in the room know that the puzzle was solved.
        if (player !== null)
            player.sendDescription(game, this.correctDescription, this);
        if (message)
            new Narration(game, player, game.rooms.find(room => room.name === this.location.name), message).send();

        if (player !== null) {
            // Post log message.
            const time = new Date().toLocaleTimeString();
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} solved ${this.name} in ${player.location.channel}`);
        }

        if (doSolvedCommands === true) {
            // Find commandSet.
            var commandSet = [];
            if (this.solutions.length > 1) {
                for (let i = 0; i < this.commandSets.length; i++) {
                    let foundCommandSet = false;
                    for (let j = 0; j < this.commandSets[i].outcomes.length; j++) {
                        if (this.commandSets[i].outcomes[j] === this.outcome) {
                            commandSet = this.commandSets[i].solvedCommands;
                            foundCommandSet = true;
                            break;
                        }
                    }
                    if (foundCommandSet) break;
                }
            }
            else commandSet = this.commandSets[0].solvedCommands;
            // Run any needed commands.
            for (let i = 0; i < commandSet.length; i++) {
                if (commandSet[i].startsWith("wait")) {
                    let args = commandSet[i].split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    commandHandler.execute(commandSet[i], bot, game, null, player, this);
                }
            }
        }

        return;
    }

    async unsolve(bot, game, player, message, directMessage, doUnsolvedCommands) {        
        // There's no message when unsolved cell, so let the player know what they did.
        if (player !== null && directMessage !== null) player.notify(game, directMessage);
        // Let everyonne in the room know that the puzzle was unsolved.
        if (message)
            new Narration(game, player, game.rooms.find(room => room.name === this.location.name), message).send();

        // Now mark it as unsolved.
        this.solved = false;

        if (player !== null) {
            // Post log message.
            const time = new Date().toLocaleTimeString();
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} unsolved ${this.name} in ${player.location.channel}`);
        }

        if (doUnsolvedCommands === true) {
            // Find commandSet.
            var commandSet = [];
            if (this.solutions.length > 1) {
                for (let i = 0; i < this.commandSets.length; i++) {
                    let foundCommandSet = false;
                    for (let j = 0; j < this.commandSets[i].outcomes.length; j++) {
                        if (this.commandSets[i].outcomes[j] === this.outcome) {
                            commandSet = this.commandSets[i].unsolvedCommands;
                            foundCommandSet = true;
                            break;
                        }
                    }
                    if (foundCommandSet) break;
                }
            }
            else commandSet = this.commandSets[0].unsolvedCommands;
            // Run any needed commands.
            for (let i = 0; i < commandSet.length; i++) {
                if (commandSet[i].startsWith("wait")) {
                    let args = commandSet[i].split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    commandHandler.execute(commandSet[i], bot, game, null, player, this);
                }
            }
        }

        // Clear the outcome.
        if (this.solutions.length > 1 && this.type !== "channels")
            this.outcome = "";

        return;
    }

    fail(game, player, message) {
        // Decrease the number of remaining attempts, if applicable.
        if (!isNaN(this.remainingAttempts)) {
            this.remainingAttempts--;
            player.sendDescription(game, this.incorrectDescription, this);
        }
        else
            player.sendDescription(game, this.incorrectDescription, this);
        if (message)
            new Narration(game, player, player.location, message).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} failed to solve ${this.name} in ${player.location.channel}`);

        return;
    }

    alreadySolved(game, player, message) {
        player.sendDescription(game, this.alreadySolvedDescription, this);
        new Narration(game, player, player.location, message).send();

        return;
    }

    requirementsNotMet(game, player, message, misc) {
        // If there's no text in the Requirements Not Met cell, then the player shouldn't know about this puzzle.
        if (this.requirementsNotMetDescription === "" && misc.message)
            game.messageHandler.addReply(misc.message, `Couldn't find "${misc.input}" to ${misc.command}. Try using a different command?`);
        // If there is text there, then the object in the puzzle is interactable, but doesn't do anything until the required puzzle has been solved.
        else {
            player.sendDescription(game, this.requirementsNotMetDescription, this);
            if (misc.message) new Narration(game, player, player.location, message).send();
        }
        return;
    }

    correctCell() {
        return constants.puzzleSheetCorrectColumn + this.row;
    }

    alreadySolvedCell() {
        return constants.puzzleSheetAlreadySolvedColumn + this.row;
    }

    incorrectCell() {
        return constants.puzzleSheetIncorrectColumn + this.row;
    }

    noMoreAttemptsCell() {
        return constants.puzzleSheetNoMoreAttemptsColumn + this.row;
    }

    requirementsNotMetCell() {
        return constants.puzzleSheetRequirementsNotMetColumn + this.row;
    }
}

module.exports = Puzzle;

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
