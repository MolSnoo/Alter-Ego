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

    puzzleCells() {
        return ("Puzzles!A" + this.row + ":Q" + this.row);
    }

    solvedCell() {
        return ("Puzzles!B" + this.row);
    }

    accessibleCell() {
        return ("Puzzles!G" + this.row);
    }

    attemptsCell() {
        return ("Puzzles!J" + this.row);
    }

    correctCell() {
        return ("Puzzles!L" + this.row);
    }

    formattedAlreadySolvedCell() {
        return ("Puzzles!M" + this.row);
    }

    alreadySolvedCell() {
        return ("Puzzles!N" + this.row);
    }

    incorrectCell() {
        return ("Puzzles!O" + this.row);
    }

    noMoreAttemptsCell() {
        return ("Puzzles!P" + this.row);
    }

    requirementsNotMetCell() {
        return ("Puzzles!Q" + this.row);
    }
}

module.exports = Puzzle;