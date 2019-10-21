const settings = include('settings.json');
const commandHandler = include(`${settings.modulesDir}/commandHandler.js`);
const sheets = include(`${settings.modulesDir}/sheets.js`);

const Narration = include(`${settings.dataDir}/Narration.js`);

class Puzzle {
    constructor(name, solved, requiresMod, location, parentObjectName, type, accessible, requires, solution, remainingAttempts, solvedCommands, unsolvedCommands, row) {
        this.name = name;
        this.solved = solved;
        this.requiresMod = requiresMod;
        this.location = location;
        this.parentObjectName = parentObjectName;
        this.parentObject = null;
        this.type = type;
        this.accessible = accessible;
        this.requires = requires;
        this.solution = solution;
        this.remainingAttempts = remainingAttempts;
        this.solvedCommands = solvedCommands;
        this.unsolvedCommands = unsolvedCommands;
        this.row = row;
    }

    setAccessible(game) {
        this.accessible = true;
        sheets.updateCell(this.accessibleCell(), "TRUE", function (response) {
            const loader = include(`${settings.modulesDir}/loader.js`);
            loader.loadObjects(game, false);
            loader.loadItems(game, false);
            loader.loadPuzzles(game, false);
        });
    }

    setInaccessible(game) {
        this.accessible = false;
        sheets.updateCell(this.accessibleCell(), "FALSE", function (response) {
            const loader = include(`${settings.modulesDir}/loader.js`);
            loader.loadObjects(game, false);
            loader.loadItems(game, false);
            loader.loadPuzzles(game, false);
        });
    }

    async solve(bot, game, player, message, doSolvedCommands) {
        // Let the palyer and anyone else in the room know that the puzzle was solved.
        if (player !== null)
            player.sendDescription(this.correctCell());
        if (message)
            new Narration(game, player, game.rooms.find(room => room.name === this.location.name), message).send();

        // Now mark it as solved.
        this.solved = true;
        sheets.updateCell(this.solvedCell(), "TRUE", function (response) {
            const loader = include(`${settings.modulesDir}/loader.js`);
            loader.loadObjects(game, false);
            loader.loadItems(game, false);
            loader.loadPuzzles(game, false);
        });

        if (doSolvedCommands === true) {
            // Run any needed commands.
            for (let i = 0; i < this.solvedCommands.length; i++) {
                if (this.solvedCommands[i].startsWith("wait")) {
                    let args = this.solvedCommands[i].split(" ");
                    if (!args[1]) game.commandChannel.send(`Error: Couldn't execute command "${this.solvedCommands[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.commandChannel.send(`Error: Couldn't execute command "${this.solvedCommands[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    commandHandler.execute(this.solvedCommands[i], bot, game, null, player);
                }
            }
        }

        if (player !== null) {
            // Post log message.
            const time = new Date().toLocaleTimeString();
            game.logChannel.send(`${time} - ${player.name} solved ${this.name} in ${player.location.channel}`);
        }

        return;
    }

    async unsolve(bot, game, player, message, directMessage, doUnsolvedCommands) {        
        // There's no message when unsolved cell, so let the player know what they did.
        if (player !== null && directMessage !== null) player.member.send(directMessage);
        // Let everyonne in the room know that the puzzle was unsolved.
        if (message)
            new Narration(game, player, game.rooms.find(room => room.name === this.location.name), message).send();

        // Now mark it as unsolved.
        this.solved = false;
        sheets.updateCell(this.solvedCell(), "FALSE", function (response) {
            const loader = include(`${settings.modulesDir}/loader.js`);
            loader.loadObjects(game, false);
            loader.loadItems(game, false);
            loader.loadPuzzles(game, false);
        });

        if (doUnsolvedCommands === true) {
            // Run any needed commands.
            for (let i = 0; i < this.unsolvedCommands.length; i++) {
                if (this.unsolvedCommands[i].startsWith("wait")) {
                    let args = this.unsolvedCommands[i].split(" ");
                    if (!args[1]) game.commandChannel.send(`Error: Couldn't execute command "${this.unsolvedCommands[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.commandChannel.send(`Error: Couldn't execute command "${this.unsolvedCommands[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    commandHandler.execute(this.unsolvedCommands[i], bot, game, null, player);
                }
            }
        }

        if (player !== null) {
            // Post log message.
            const time = new Date().toLocaleTimeString();
            game.logChannel.send(`${time} - ${player.name} unsolved ${this.name} in ${player.location.channel}`);
        }

        return;
    }

    fail(game, player, message) {
        // Decrease the number of remaining attempts, if applicable.
        if (!isNaN(this.remainingAttempts)) {
            this.remainingAttempts--;

            // The incorrect cell might use the attempts cell to tell the player how many attempts are remaining,
            // so get the message only after updating the attempts cell.
            let puzzle = this;
            sheets.updateCell(this.attemptsCell(), this.remainingAttempts.toString(), function (response) {
                player.sendDescription(puzzle.incorrectCell());
            });
        }
        else
            player.sendDescription(this.incorrectCell());
        new Narration(game, player, player.location, message).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${player.name} failed to solve ${this.name} in ${player.location.channel}`);

        return;
    }

    alreadySolved(game, player, message) {
        player.sendDescription(this.alreadySolvedCell());
        new Narration(game, player, player.location, message).send();

        return;
    }

    requirementsNotMet(game, player, message, misc) {
        sheets.getData(this.requirementsNotMetCell(), function (response) {
            // If there's no text in the Requirements Not Met cell, then the player shouldn't know about this puzzle.
            if (!response.data.values || response.data.values[0][0] === "")
                misc.message.reply(`couldn't find "${misc.input}" to ${misc.command}. Try using a different command?`);
            // If there is text there, then the object in the puzzle is interactable, but doesn't do anything until the required puzzle has been solved.
            else {
                const parser = include(`${settings.modulesDir}/parser.js`);
                player.member.send(parser.parseDescription(response.data.values[0][0], player));
                new Narration(game, player, player.location, message).send();
            }
        });
        return;
    }

    solvedCell() {
        return settings.puzzleSheetSolvedColumn + this.row;
    }

    accessibleCell() {
        return settings.puzzleSheetAccessibleColumn + this.row;
    }

    attemptsCell() {
        return settings.puzzleSheetAttemptsColumn + this.row;
    }

    correctCell() {
        return settings.puzzleSheetCorrectColumn + this.row;
    }

    alreadySolvedCell() {
        return settings.puzzleSheetAlreadySolvedColumn + this.row;
    }

    incorrectCell() {
        return settings.puzzleSheetIncorrectColumn + this.row;
    }

    noMoreAttemptsCell() {
        return settings.puzzleSheetNoMoreAttemptsColumn + this.row;
    }

    requirementsNotMetCell() {
        return settings.puzzleSheetRequirementsNotMetColumn + this.row;
    }
}

module.exports = Puzzle;

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
