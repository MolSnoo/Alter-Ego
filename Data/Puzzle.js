const constants = require('../Configs/constants.json');
const commandHandler = require('../Modules/commandHandler.js');

const Narration = require('./Narration.js');
const Player = require("./Player");
const Prefab = require("./Prefab");
const Room = require("./Room");
const {Client} = require("discord.js");

/**
 * @class Puzzle
 * @classdesc Represents a puzzle in the game world.
 * @constructor
 * @param {string} name - The name of the puzzle.
 * @param {boolean} solved - Whether the puzzle is solved.
 * @param {string} outcome - String indicating which solution the puzzle has been solved with.
 * @param {boolean} requiresMod - Whether the puzzle requires a moderator to solve it.
 * @param {Room} location - The location the puzzle is found in.
 * @param {string} parentObjectName - The name of the object associated with the puzzle.
 * @param {string} type - The type of puzzle. @see {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/puzzle.html#type}
 * @param {boolean} accessible - Whether the puzzle can be interacted with.
 * @param {string[]} requirementsStrings - Puzzle names and/or prefabs that are required for the puzzle to be made accessible.
 * @param {string[]} solutions - The solutions to the puzzle.
 * @param {number} remainingAttempts - The number of attempts the player has left to solve the puzzle.
 * @param {string} commandSetsString - Bot commands that will be executed when the puzzle is solved or unsolved.
 * @param {PuzzleCommandSet[]} commandSets - A list of command set objects.
 * @param {string} correctDescription - The description of the puzzle when it is solved.
 * @param {string} alreadySolvedDescription - The description of the puzzle when it is already solved.
 * @param {string} incorrectDescription - The description of the puzzle when it is incorrect.
 * @param {string} noMoreAttemptsDescription - The description of the puzzle when the player has no more attempts left to solve it.
 * @param {string} requirementsNotMetDescription - The description of the puzzle when all of the requirements are not met.
 * @param {number} row - The row number of the puzzle in the sheet.
 */
class Puzzle {
    /**
     * @param {string} name - The name of the puzzle.
     * @param {boolean} solved - Whether the puzzle is solved.
     * @param {string} outcome - String indicating which solution the puzzle has been solved with.
     * @param {boolean} requiresMod - Whether the puzzle requires a moderator to solve it.
     * @param {Room} location - The location the puzzle is found in.
     * @param {string} parentObjectName - The name of the object associated with the puzzle.
     * @param {string} type - The type of puzzle. @see {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/puzzle.html#type}
     * @param {boolean} accessible - Whether the puzzle can be interacted with.
     * @param {string[]} requirementsStrings - Puzzle names and/or prefabs that are required for the puzzle to be made accessible.
     * @param {string[]} solutions - The solutions to the puzzle.
     * @param {number} remainingAttempts - The number of attempts the player has left to solve the puzzle.
     * @param {string} commandSetsString - Bot commands that will be executed when the puzzle is solved or unsolved.
     * @param {PuzzleCommandSet[]} commandSets - A list of command set objects.
     * @param {string} correctDescription - The description of the puzzle when it is solved.
     * @param {string} alreadySolvedDescription - The description of the puzzle when it is already solved.
     * @param {string} incorrectDescription - The description of the puzzle when it is incorrect.
     * @param {string} noMoreAttemptsDescription - The description of the puzzle when the player has no more attempts left to solve it.
     * @param {string} requirementsNotMetDescription - The description of the puzzle when all of the requirements are not met.
     * @param {number} row - The row number of the puzzle in the sheet.
     */
    constructor(name, solved, outcome, requiresMod, location, parentObjectName, type, accessible, requirementsStrings, solutions, remainingAttempts, commandSetsString, commandSets, correctDescription, alreadySolvedDescription, incorrectDescription, noMoreAttemptsDescription, requirementsNotMetDescription, row) {
        this.name = name;
        this.solved = solved;
        this.outcome = outcome;
        this.requiresMod = requiresMod;
        this.location = location;
        this.parentObjectName = parentObjectName;
        /** @type {Object | null} */
        this.parentObject = null;
        this.type = type;
        this.accessible = accessible;
        this.requirementsStrings = requirementsStrings;
        /** @type {Array<string | Puzzle | Prefab>} */
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

    /**
     * Sets the puzzle as accessible.
     */
    setAccessible() {
        this.accessible = true;
    }

    /**
     * Sets the puzzle as inaccessible.
     */
    setInaccessible() {
        this.accessible = false;
    }

    /**
     * Sets the puzzle as solved.
     * @param {Client} bot
     * @param {Game} game
     * @param {Player} player
     * @param {string} message
     * @param {string} outcome
     * @param {boolean} doSolvedCommands
     * @param {Player} [targetPlayer]
     * @returns {Promise<void>}
     */
    async solve(bot, game, player, message, outcome, doSolvedCommands, targetPlayer = null) {
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
            /** @type {string[]} */
            let commandSet = [];
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
            } else commandSet = this.commandSets[0].solvedCommands;
            // Run any needed commands.
            for (let i = 0; i < commandSet.length; i++) {
                if (commandSet[i].startsWith("wait")) {
                    let args = commandSet[i].split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                } else {
                    let command = commandSet[i];
                    if (this.type === "matrix") {
                        const regex = /{([^{},/]+?)}/g;
                        let match;
                        while (match = regex.exec(commandSet[i])) {
                            for (const requirement of this.requirements) {
                                if (requirement instanceof Puzzle && requirement.name.toUpperCase() === match[1].toUpperCase() && requirement.outcome !== "") {
                                    command = command.replace(match[0], requirement.outcome);
                                }
                            }
                        }
                    }
                    commandHandler.execute(command, bot, game, null, targetPlayer ? targetPlayer : player, this);
                }
            }
        }
    }

    /**
     * Sets the puzzle as unsolved.
     * @param {Client} bot
     * @param {Game} game
     * @param {Player} player
     * @param {string} message
     * @param {string} directMessage
     * @param {boolean} doUnsolvedCommands
     * @returns {Promise<void>}
     */
    async unsolve(bot, game, player, message, directMessage, doUnsolvedCommands) {
        // There's no message when unsolved cell, so let the player know what they did.
        if (player !== null && directMessage !== null) player.notify(game, directMessage);
        // Let everyone in the room know that the puzzle was unsolved.
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
            /** @type {string[]} */
            let commandSet = [];
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
            } else commandSet = this.commandSets[0].unsolvedCommands;
            // Run any needed commands.
            for (let i = 0; i < commandSet.length; i++) {
                if (commandSet[i].startsWith("wait")) {
                    let args = commandSet[i].split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                } else {
                    commandHandler.execute(commandSet[i], bot, game, null, player, this);
                }
            }
        }

        // Clear the outcome.
        if (this.solutions.length > 1 && this.type !== "channels")
            this.outcome = "";
    }

    /**
     * Set the puzzle as failed.
     * @param {Game} game
     * @param {Player} player
     * @param {string} message
     */
    fail(game, player, message) {
        // Decrease the number of remaining attempts, if applicable.
        if (!isNaN(this.remainingAttempts)) {
            this.remainingAttempts--;
            player.sendDescription(game, this.incorrectDescription, this);
        } else
            player.sendDescription(game, this.incorrectDescription, this);
        if (message)
            new Narration(game, player, player.location, message).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} failed to solve ${this.name} in ${player.location.channel}`);
    }

    /**
     * Sends narration indicating that puzzle is already solved.
     * @param {Game} game
     * @param {Player} player
     * @param {string} message
     */
    alreadySolved(game, player, message) {
        player.sendDescription(game, this.alreadySolvedDescription, this);
        new Narration(game, player, player.location, message).send();
    }

    /**
     * Sends narration indicating that puzzle requirements are not met.
     * @param {Game} game
     * @param {Player} player
     * @param {string} message
     * @param {Misc} misc
     */
    requirementsNotMet(game, player, message, misc) {
        // If there's no text in the Requirements Not Met cell, then the player shouldn't know about this puzzle.
        if (this.requirementsNotMetDescription === "" && misc.message)
            game.messageHandler.addReply(misc.message, `Couldn't find "${misc.input}" to ${misc.command}. Try using a different command?`);
        // If there is text there, then the object in the puzzle is interactable, but doesn't do anything until the required puzzle has been solved.
        else {
            player.sendDescription(game, this.requirementsNotMetDescription, this);
            if (misc.message) new Narration(game, player, player.location, message).send();
        }
    }

    /** @returns {string} */
    correctCell() {
        return constants.puzzleSheetCorrectColumn + this.row;
    }

    /** @returns {string} */
    alreadySolvedCell() {
        return constants.puzzleSheetAlreadySolvedColumn + this.row;
    }

    /** @returns {string} */
    incorrectCell() {
        return constants.puzzleSheetIncorrectColumn + this.row;
    }

    /** @returns {string} */
    noMoreAttemptsCell() {
        return constants.puzzleSheetNoMoreAttemptsColumn + this.row;
    }

    /** @returns {string} */
    requirementsNotMetCell() {
        return constants.puzzleSheetRequirementsNotMetColumn + this.row;
    }
}

module.exports = Puzzle;

/**
 * Sleeps for a specified number of seconds.
 * @param {number} seconds
 * @returns {Promise<NodeJS.Timeout>}
 */
function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
