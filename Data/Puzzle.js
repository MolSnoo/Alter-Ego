const settings = include('settings.json');
const commandHandler = include(`${settings.modulesDir}/commandHandler.js`);
const sheets = include(`${settings.modulesDir}/sheets.js`);
const loader = include(`${settings.modulesDir}/loader.js`);

const Narration = include(`${settings.dataDir}/Narration.js`);

class Puzzle {
    constructor(name, solved, requiresMod, location, parentObject, type, accessible, requires, solution, remainingAttempts, solvedCommands, unsolvedCommands, row) {
        this.name = name;
        this.solved = solved;
        this.requiresMod = requiresMod;
        this.location = location;
        this.parentObject = parentObject;
        this.type = type;
        this.accessible = accessible;
        this.requires = requires;
        this.solution = solution;
        this.remainingAttempts = remainingAttempts;
        this.solvedCommands = solvedCommands;
        this.unsolvedCommands = unsolvedCommands;
        this.row = row;
    }

    solve(bot, game, player, message, doSolvedCommands) {
        // Let the palyer and anyone else in the room know that the puzzle was solved.
        if (player !== null)
            player.sendDescription(this.correctCell());
        if (message)
            new Narration(game, player, game.rooms.find(room => room.name === this.location), message).send();

        // Now mark it as solved.
        this.solved = true;
        sheets.updateCell(this.solvedCell(), "TRUE", function (response) {
            loader.loadObjects(game);
            loader.loadItems(game);
            loader.loadPuzzles(game);
        });

        if (doSolvedCommands === true) {
            // Run any needed commands.
            for (let i = 0; i < this.solvedCommands.length; i++)
                commandHandler.execute(this.solvedCommands[i], bot, game, null, player);
        }

        if (player !== null) {
            // Post log message.
            const time = new Date().toLocaleTimeString();
            game.logChannel.send(`${time} - ${player.name} solved ${this.name} in ${player.location.channel}`);
        }

        return;
    }

    unsolve(bot, game, player, message, directMessage, doUnsolvedCommands) {        
        // There's no message when unsolved cell, so let the player know what they did.
        if (player !== null && directMessage !== null) player.member.send(directMessage);
        // Let everyonne in the room know that the puzzle was unsolved.
        if (message)
            new Narration(game, player, game.rooms.find(room => room.name === this.location), message).send();

        // Now mark it as unsolved.
        this.solved = false;
        sheets.updateCell(this.solvedCell(), "FALSE", function (response) {
            loader.loadObjects(game);
            loader.loadItems(game);
            loader.loadPuzzles(game);
        });

        if (doUnsolvedCommands === true) {
            // Run any needed commands.
            for (let i = 0; i < this.unsolvedCommands.length; i++)
                commandHandler.execute(this.unsolvedCommands[i], bot, game, null, player);
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
                player.member.send(response.data.values[0][0]);
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
