// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import Die from "../Die.ts";
import type ItemInstance from "../ItemInstance.ts";
import Player from "../Player.ts";
import type Puzzle from "../Puzzle.ts";

/**
 * Represents an attempt action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#attempt-action
 */
export default class AttemptAction extends Action {
    /**
     * Performs an attempt action.
     *
     * @param puzzle - The puzzle to attempt.
     * @param item - The item instance required to attempt the puzzle.
     * @param password - The password the player entered to attempt the puzzle.
     * @param command - The command alias that was used to attempt the puzzle.
     * @param input - The combined arguments of the command.
     * @param targetPlayer - The player who will be treated as the initiating player in subsequent bot command executions called by the puzzle's solved commands, if applicable.
     */
    performAttempt(puzzle: Puzzle, item: ItemInstance, password: string, command: string, input: string, targetPlayer?: Player): void {
        if (this.performed) return;
        super.perform();
        const puzzleName = puzzle.parentFixture ? puzzle.parentFixture.name : puzzle.name;
        // Make sure all the requirements are met.
        let requiredItems: ItemInstance[] = [];
        const allRequirementsMet = puzzle.checkRequirementsMet(this.player, item, requiredItems);
        if (allRequirementsMet && !puzzle.accessible && puzzle.requirements.length !== 0)
            puzzle.setAccessible();
        else if (!allRequirementsMet && puzzle.accessible)
            puzzle.setInaccessible();

        const puzzleAccessible = puzzle.accessible || (puzzle.type === "weight" || puzzle.type === "container") && (command === "take" || command === "drop");
        if (!puzzleAccessible) {
            this.#handleInaccessiblePuzzle(puzzle, input, command);
            return;
        }
        if (puzzle.requiresMod && !puzzle.solved && !this.forced) {
            if (this.message) this.getGame().communicationHandler.reply(this.message, "You need moderator assistance to do that.");
            return;
        }
        if (puzzle.remainingAttempts === 0) {
            this.#narrateAndLogPuzzleHasNoRemainingAttempts(puzzle);
            return;
        }

        const itemSolutionId = this.#checkPlayerHasItemSolution(puzzle, item, requiredItems);
        let hasRequiredItem = itemSolutionId !== undefined;
        if (hasRequiredItem && itemSolutionId !== "") password = itemSolutionId;

        let puzzleSolvable = false;
        if (puzzle.solved || hasRequiredItem || puzzle.type === "media"
        || (puzzle.isAlwaysAccessible()) && (command === "take" || command === "drop"))
            puzzleSolvable = true;

        // The player is missing an item needed to solve the puzzle.
        if (!puzzleSolvable) {
            this.#handleInaccessiblePuzzle(puzzle, input, command, this.getGame().notificationGenerator.generateAttemptPuzzleWithoutItemSolutionNotification(this.player, false, puzzle));
            return;
        }

        // Puzzle is solvable.
        if (puzzle.type === "password") {
            if (puzzle.solved)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            else {
                if (password === "")
                    return this.#reply("You need to enter a password.");
                else if (puzzle.solutions.includes(password))
                    this.#solvePuzzle(puzzle, password, requiredItems, item);
                else
                    this.#failPuzzle(puzzle);
            }
        }
        else if (puzzle.type === "interact" || puzzle.type === "matrix") {
            if (puzzle.solved)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            else
                this.#solvePuzzle(puzzle, password, requiredItems, item);
        }
        else if (puzzle.type === "toggle") {
            if (puzzle.solved && hasRequiredItem)
                this.#unsolvePuzzle(puzzle);
            else if (puzzle.solved)
                this.#handleInaccessiblePuzzle(puzzle, input, command, this.getGame().notificationGenerator.generateAttemptPuzzleWithoutItemSolutionNotification(this.player, false, puzzle));
            else
                this.#solvePuzzle(puzzle, password, requiredItems, item);
        }
        else if (puzzle.type === "combination lock") {
            // The lock is currently unlocked.
            if (puzzle.solved) {
                if (command === "unlock")
                    return this.#reply(`${puzzleName} is already unlocked.`);
                if (command !== "lock" && (password === "" || puzzle.solutions.includes(password)))
                    this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
                // If the player enters something that isn't the solution, lock it.
                else
                    this.#unsolvePuzzle(puzzle);
            }
            // The lock is locked.
            else {
                if (command === "lock")
                    return this.#reply(`${puzzleName} is already locked.`);
                if (password === "")
                    return this.#reply("You need to enter a combination.");
                else if (puzzle.solutions.includes(password))
                    this.#solvePuzzle(puzzle, password, requiredItems, item);
                else
                    this.#failPuzzle(puzzle);
            }
        }
        else if (puzzle.type === "key lock") {
            // The lock is currently unlocked.
            if (puzzle.solved) {
                if (command === "unlock")
                    return this.#reply(`${puzzleName} is already unlocked.`);
                if (command === "lock" && hasRequiredItem)
                    this.#unsolvePuzzle(puzzle);
                else if (command === "lock")
                    this.#handleInaccessiblePuzzle(puzzle, input, command, this.getGame().notificationGenerator.generateAttemptPuzzleWithoutItemSolutionNotification(this.player, false, puzzle));
                else
                    this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            }
            // The lock is locked.
            else {
                if (command === "lock")
                    return this.#reply(`${puzzleName} is already locked.`);
                this.#solvePuzzle(puzzle, password, requiredItems, item);
            }
        }
        else if (puzzle.type === "probability") {
            if (puzzle.solved)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            else {
                const outcome = puzzle.solutions[Math.floor(Math.random() * puzzle.solutions.length)];
                this.#solvePuzzle(puzzle, outcome, requiredItems, item);
            }
        }
        else if (puzzle.type.endsWith("probability")) {
            if (puzzle.solved)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            else {
                const stat = Player.abbreviateStatName(puzzle.type.substring(0, puzzle.type.indexOf(" probability")));
                const dieRoll = this.getGame().rollDie(stat, this.player);
                // Get the ratio of the result as part of the maximum roll, each relative to the minimum roll.
                const ratio = (dieRoll.result - dieRoll.min) / (dieRoll.max - dieRoll.min);
                // Clamp the result so that it can be used to choose an item in the array of solutions.
                const clampedRatio = Math.min(Math.max(ratio, 0), 0.999);
                const outcome = puzzle.solutions[Math.floor(clampedRatio * puzzle.solutions.length)];
                this.#solvePuzzle(puzzle, outcome, requiredItems, item);
            }
        }
        else if (puzzle.type === "channels") {
            if (puzzle.solved) {
                if (password === "")
                    this.#unsolvePuzzle(puzzle);
                else if (puzzle.solutions.includes(password))
                    this.#solvePuzzle(puzzle, password, requiredItems, item);
                else
                    this.#failPuzzle(puzzle);
            }
            else {
                if (password !== "" && !puzzle.solutions.includes(password))
                    this.#failPuzzle(puzzle);
                else {
                    if (password === "")
                        password = puzzle.outcome ? puzzle.outcome : "";
                    this.#solvePuzzle(puzzle, password, requiredItems, item);
                }
            }
        }
        else if (puzzle.type === "weight") {
            const solution = puzzle.getSolutionSatisfiedByWeight(password);
            if (puzzle.solved && !solution)
                this.#unsolvePuzzle(puzzle);
            else if (solution)
                this.#solvePuzzle(puzzle, solution, requiredItems, item);
            else
                this.#failPuzzle(puzzle);
        }
        else if (puzzle.type === "container") {
            if (puzzle.solved)
                this.#unsolvePuzzle(puzzle);
            const solution = puzzle.getSolutionSatisfiedByContainedItems(password);
            if (solution)
                this.#solvePuzzle(puzzle, solution, requiredItems, item);
            else
                this.#failPuzzle(puzzle);
        }
        else if (puzzle.type === "switch") {
            if (puzzle.outcome === password)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            else if (puzzle.solutions.includes(password))
                this.#solvePuzzle(puzzle, password, requiredItems, item);
            else
                this.#failPuzzle(puzzle);
        }
        else if (puzzle.type === "option") {
            if (puzzle.solved && password === "")
                this.#unsolvePuzzle(puzzle);
            else if (puzzle.solved && puzzle.outcome === password)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            else if (puzzle.solutions.includes(password))
                this.#solvePuzzle(puzzle, password, requiredItems, item);
            else
                this.#failPuzzle(puzzle);
        }
        else if (puzzle.type === "media") {
            if (puzzle.solved && item === null)
                this.#unsolvePuzzle(puzzle);
            else if (puzzle.solved && item !== null)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle, item);
            else if (!puzzle.solved && item !== null) {
                const solution = puzzle.getSolutionSatisfiedByItem(item);
                if (solution)
                    this.#solvePuzzle(puzzle, solution, requiredItems, item);
                else
                    this.#failPuzzle(puzzle, item);
            }
            else
                this.#handleInaccessiblePuzzle(puzzle, input, command, this.getGame().notificationGenerator.generateAttemptPuzzleWithoutItemSolutionNotification(this.player, false, puzzle));
        }
        else if ((puzzle.type === "take" || puzzle.type === "drop") && item !== null) {
            const solution = puzzle.getSolutionSatisfiedByItem(item);
            if (solution)
                this.#solvePuzzle(puzzle, solution, requiredItems, item);
            else
                this.#failPuzzle(puzzle, item);
        }
        else if (puzzle.type === "player") {
            if (puzzle.solved)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            else if (puzzle.solutions.includes(this.player.name))
                this.#solvePuzzle(puzzle, this.player.name, requiredItems, item);
            else
                this.#failPuzzle(puzzle);
        }
        else if (puzzle.type === "player toggle") {
            if (puzzle.solved && puzzle.outcome === this.player.name && hasRequiredItem)
                this.#unsolvePuzzle(puzzle);
            else if (puzzle.solved)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            else if (puzzle.solutions.includes(this.player.name))
                this.#solvePuzzle(puzzle, this.player.name, requiredItems, item);
            else
                this.#failPuzzle(puzzle);
        }
        else if (puzzle.type === "room player") {
            let outcome = "";
            if (targetPlayer) {
                for (const solution of puzzle.solutions) {
                    if (solution.toLowerCase() === targetPlayer.displayName.toLowerCase()) {
                        outcome = solution;
                        break;
                    }
                }
            }
            if (puzzle.solved)
                this.#narrateAndLogAlreadySolvedPuzzle(puzzle);
            else if (outcome !== "")
                this.#solvePuzzle(puzzle, outcome, requiredItems, item, targetPlayer);
            else
                this.#failPuzzle(puzzle);
        }
        this.successMessage = `Successfully attempted ${puzzle.name} for ${this.player?.name}.`;
    }

    /**
     * Finds the required entities to call performAttempt.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [Puzzle, ItemInstance, string, string, string, string, Player] {
        const puzzle = this.getGame().entityFinder.getPuzzle(args[0], args[1], args[2]);
        const item = this.getGame().entityFinder.getInventoryItem(args[3], this.player.name, args[4], args[5], args[6]) ?? null;
        const targetPlayer = this.getGame().entityFinder.getLivingPlayers(args[7], null, this.player.location.id, this.player.hidingSpot)[0];
        return [puzzle, item, args[7], args[8], args[9], args[10], targetPlayer];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performAttempt.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [Puzzle, ItemInstance, string, string, string, string, Player]): [Puzzle, ItemInstance, string, string, string, Player] {
        const errorMessageGenerator = this.getGame().errorMessageGenerator;
        if (args.length !== 7) throw new Error(errorMessageGenerator.generateInsufficientArgumentsError());
        if (!args[0] || args[0].getEntityType() !== "Puzzle") throw new Error(errorMessageGenerator.generateInvalidEntityError("Puzzle"));
        const puzzle = args[0];
        if (puzzle.location.id !== this.player.location.id) throw new Error(errorMessageGenerator.generatePlayerLocationMismatchError());
        if (args[6] && args[6].getEntityType() === "Player" && args[6].location?.id !== this.player.location.id)
            throw new Error(errorMessageGenerator.generatePlayerNotFoundInRoomError(args[5]))
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("use");
        if (disabledStatusEffects.length > 0)
            throw new Error(errorMessageGenerator.generateCommandDisabledError(disabledStatusEffects[0]));
        const hiddenStatusEffects = this.player.getBehaviorAttributeStatusEffects("hidden");
        if (hiddenStatusEffects.length > 0 && puzzle.parentFixture && this.player.hidingSpot !== puzzle.parentFixture.name)
            throw new Error(errorMessageGenerator.generateCommandDisabledError(hiddenStatusEffects[0]));
        const item = args[1];
        const password = args[2];
        const command = args[3];
        const input = args[4];
        const targetPlayer = args[6];
        return [puzzle, item, password, command, input, targetPlayer];
    }

    /**
     * Checks if the player has an item listed as one of the puzzle's solutions.
     *
     * @param puzzle - The puzzle to check.
     * @param item - An item the player supplied in their attempt to solve the puzzle.
     * @param requiredItems - An array of required items in the player's inventory. If the item solution is found in the player's inventory, it will be added to this array.
     * @returns The solution to attempt to solve the puzzle with. In this case, an item in the player's inventory. If no items are listed as solutions, returns an empty string. If the player doesn't have the item solution, returns undefined.
     */
    #checkPlayerHasItemSolution(puzzle: Puzzle, item: ItemInstance, requiredItems: ItemInstance[]): string {
        const regex = /((Inventory)?Item|Prefab):/g;
        if (puzzle.type !== "container" && regex.test(puzzle.solutions.join(','))) {
            for (let i = 0; i < puzzle.solutions.length; i++) {
                const solution = puzzle.solutions[i];
                if (solution.startsWith("Item:") || solution.startsWith("InventoryItem:") || solution.startsWith("Prefab:")) {
                    if (item && item.prefab.id === solution.substring(solution.indexOf(':') + 1).trim()) {
                        return solution;
                    }
                    else if (!item) {
                        const requiredItem = this.player.findItem(solution.substring(solution.indexOf(':') + 1).trim());
                        if (requiredItem) {
                            if (!requiredItems.includes(requiredItem))
                                requiredItems.push(requiredItem);
                            return solution;
                        }
                    }
                }
            }
            return undefined;
        }
        else return "";
    }

    /**
     * Checks if the puzzle has a description. If it does, narrates and logs the attempt. If it doesn't, replies to the player's message as if the puzzle doesn't exist.
     *
     * @param puzzle - The puzzle to check.
     * @param input - The combined arguments of the command.
     * @param command - The command alias that was used to attempt the puzzle.
     * @param customNarration - The custom narration to use, if any.
     */
    #handleInaccessiblePuzzle(puzzle: Puzzle, input: string, command: string, customNarration?: string) {
        if (this.#checkInaccessiblePuzzleHasDescription(puzzle)) {
            this.#narrateAndLogPuzzleIsInaccessible(puzzle, this.#getInaccessiblePuzzleCustomNarration(customNarration));
        }
        else this.#reply(`Couldn't find "${input}" to ${command}. Try using a different command?`);
    }

    /**
     * Returns true if the puzzle has a requirementsNotMetDescription.
     *
     * @param puzzle - The puzzle to check.
     */
    #checkInaccessiblePuzzleHasDescription(puzzle: Puzzle): boolean {
        return puzzle.requirementsNotMetDescription.text !== "";
    }

    /**
     * If an inaccessible puzzle was attempted without a message being sent and by a user other than the player (i.e. by a bot command),
     * then passing an empty string as the customNarration will prevent a narration from being sent.
     *
     * @param customNarration - The custom narration to use, if any.
     * @returns Either an empty string if no message was sent and the user is not the player, or the custom narration if one was. If no custom narration was specified, it is undefined.
     */
    #getInaccessiblePuzzleCustomNarration(customNarration?: string): string | undefined {
        return this.message === undefined && this.user !== this.player ? "" : customNarration;
    }

    /**
     * Replies to the message, if there was one.
     *
     * @param messageText - The text of the message to send.
     */
    #reply(messageText: string): void {
        if (this.message) this.getGame().communicationHandler.reply(this.message, messageText);
        else if (!this.forced) this.getGame().communicationHandler.sendMessageToPlayer(this.player, messageText, false);
    }

    /**
     * Solves the puzzle, and sends the narration, correct description, and log message.
     *
     * @param puzzle - The puzzle being attempted.
     * @param outcome - The outcome the puzzle was solved with.
     * @param requiredItems - The actual item instances that were required for this puzzle to be solved.
     * @param item - The item that was used to solve the puzzle, if any.
     * @param targetPlayer - The player who will be treated as the initiating player in subsequent bot command executions called by the puzzle's solved commands, if any.
     */
    #solvePuzzle(puzzle: Puzzle, outcome: string, requiredItems: ItemInstance[], item?: ItemInstance, targetPlayer?: Player): void {
        puzzle.solve();
        puzzle.setOutcome(outcome);
        puzzle.decrementRequiredItemUses(this.player, requiredItems);
        this.getGame().narrationHandler.narrateSolve(this, puzzle, outcome, this.player, item);
        this.getGame().logHandler.logSolve(puzzle, this.player, this.forced);
        puzzle.executeSolvedCommands(targetPlayer ? targetPlayer : this.player);
    }

    /**
     * Unsolves the puzzle, and sends the narration, notifications, and log message.
     *
     * @param puzzle - The puzzle being attempted.
     */
    #unsolvePuzzle(puzzle: Puzzle): void {
        this.getGame().narrationHandler.narrateUnsolve(this, puzzle, this.player);
        this.getGame().logHandler.logUnsolve(puzzle, this.player, this.forced);
        puzzle.unsolve();
        puzzle.executeUnsolvedCommands(this.player);
        puzzle.clearOutcome();
    }

    /**
     * Decrements the puzzle's remaining attempts (if applicable), and sends the narration, incorrect description, and log message.
     *
     * @param puzzle - The puzzle being attempted.
     * @param item - The item that was used to attempt the puzzle, if any.
     */
    #failPuzzle(puzzle: Puzzle, item?: ItemInstance): void {
        puzzle.fail();
        this.getGame().narrationHandler.narrateAttempt(this, puzzle, this.player, puzzle.incorrectDescription, this.getGame().notificationGenerator.generateAttemptAndFailPuzzleNotification(this.player, false, puzzle, item));
        this.getGame().logHandler.logAttemptAndFailPuzzle(puzzle, this.player, this.forced);
    }

    /**
     * Sends the narration and log message indicating the puzzle is already solved.
     *
     * @param puzzle - The puzzle being attempted.
     * @param item - The item that was used to attempt the puzzle, if any.
     * @param customNarration - The custom narration to use, if any. Defaults to a notification that's automatically generated based on the type of puzzle.
     */
    #narrateAndLogAlreadySolvedPuzzle(puzzle: Puzzle, item?: ItemInstance, customNarration: string = this.getGame().notificationGenerator.generateAttemptAlreadySolvedPuzzleNotification(this.player, false, puzzle, item)): void {
        this.getGame().narrationHandler.narrateAttempt(this, puzzle, this.player, puzzle.alreadySolvedDescription, customNarration);
        this.getGame().logHandler.logAttemptAlreadySolvedPuzzle(puzzle, this.player, this.forced);
    }

    /**
     * Sends the narration and log message indicating the puzzle has no remaining attempts.
     *
     * @param puzzle - The puzzle being attempted.
     * @param customNarration - The custom narration to use, if any. Defaults to the no remaining attempts notification.
     */
    #narrateAndLogPuzzleHasNoRemainingAttempts(puzzle: Puzzle, customNarration: string = this.getGame().notificationGenerator.generateAttemptPuzzleWithNoRemainingAttemptsNotification(this.player.displayName, puzzle.getContainingPhrase())): void {
        this.getGame().narrationHandler.narrateAttempt(this, puzzle, this.player, puzzle.noMoreAttemptsDescription, customNarration);
        this.getGame().logHandler.logAttemptPuzzleWithNoRemainingAttempts(puzzle, this.player, this.forced);
    }

    /**
     * Sends the narration and log message indicating the puzzle is not accessible.
     *
     * @param puzzle - The puzzle being attempted.
     * @param customNarration - The custom narration to use, if any. Defaults to the default attempt notification.
     */
    #narrateAndLogPuzzleIsInaccessible(puzzle: Puzzle, customNarration: string = this.getGame().notificationGenerator.generateAttemptPuzzleDefaultNotification(this.player.displayName, puzzle.getContainingPhrase())): void {
        this.getGame().narrationHandler.narrateAttempt(this, puzzle, this.player, puzzle.requirementsNotMetDescription, customNarration);
        this.getGame().logHandler.logAttemptInaccessiblePuzzle(puzzle, this.player, this.forced);
    }
}
