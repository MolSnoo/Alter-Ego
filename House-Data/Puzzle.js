const settings = require("../settings.json");

class Puzzle {
    constructor(name, solved, requiresMod, location, parentObject, type, accessible, requires, solution, remainingAttempts, solvedCommand, row) {
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
        this.solvedCommand = solvedCommand;
        this.row = row;
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

    formattedAlreadySolvedCell() {
        return settings.puzzleSheetFormattedAlreadySolvedColumn + this.row;
    }

    parsedAlreadySolvedCell() {
        return settings.puzzleSheetParsedAlreadySolvedColumn + this.row;
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
