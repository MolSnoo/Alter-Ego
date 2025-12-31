import { default as Action, ActionType } from "../Action.js";
import Die from "../Die.js";
import Player from "../Player.js";

import { addReply } from "../../Modules/messageHandler.js";

/** @typedef {import("../ItemInstance.js").default} ItemInstance */
/** @typedef {import("../Puzzle.js").default} Puzzle */

/**
 * @class AttemptAction
 * @classdesc Represents an attempt action.
 * @extends Action
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/actions/attempt-action.html
 */
export default class AttemptAction extends Action {
	/**
	 * The type of action being performed.
	 * @override
	 * @readonly
	 * @type {ActionType}
	 */
	type = ActionType.Attempt;

	/**
	 * Performs an attempt action.
	 * @param {Puzzle} puzzle - The puzzle to attempt.
     * @param {ItemInstance} item - The item instance required to attempt the puzzle.
     * @param {string} password - The password the player entered to attempt the puzzle.
     * @param {string} command - The command alias that was used to attempt the puzzle.
     * @param {string} input - The combined arguments of the command.
     * @param {Player} [targetPlayer] - The player who will be treated as the initiating player in subsequent bot command executions called by the puzzle's solved commands, if applicable.
	 */
	performAttempt(puzzle, item, password, command, input, targetPlayer) {
		if (this.performed) return;
		super.perform();
		const puzzleName = puzzle.parentFixture ? puzzle.parentFixture.name : puzzle.name;
		// Make sure all the requirements are met.
		/** @type {ItemInstance[]} */
		let requiredItems = [];
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
		if (puzzle.requiresMod && !puzzle.solved) {
			if (this.message && !this.forced) addReply(this.getGame(), this.message, "You need moderator assistance to do that.");
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
		|| (puzzle.type === "weight" || puzzle.type === "container") && (command === "take" || command === "drop"))
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
				const dieRoll = new Die(this.player.getGame(), stat, this.player);
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
				if (!puzzle.solutions.includes(password))
					password = puzzle.outcome ? puzzle.outcome : "";
				this.#solvePuzzle(puzzle, password, requiredItems, item);
			}
		}
		else if (puzzle.type === "weight") {
			if (puzzle.solved && !puzzle.solutions.includes(password))
				this.#unsolvePuzzle(puzzle);
			else if (puzzle.solutions.includes(password))
				this.#solvePuzzle(puzzle, password, requiredItems, item);
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
			if (puzzle.outcome === password)
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
				return this.#reply(`You cannot insert ${item.singleContainingPhrase} into the ${puzzleName} as something is already inside it. Eject it first by sending \`${this.getGame().settings.commandPrefix}use ${puzzleName}\`.`);
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
		else if (puzzle.type === "player") {
			if (puzzle.solved)
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
	}

	/**
	 * Checks if the player has an item listed as one of the puzzle's solutions.
	 * @param {Puzzle} puzzle - The puzzle to check.
	 * @param {ItemInstance} item - An item the player supplied in their attempt to solve the puzzle. 
	 * @param {ItemInstance[]} requiredItems - An array of required items in the player's inventory. If the item solution is found in the player's inventory, it will be added to this array.
	 * @returns {string} The solution to attempt to solve the puzzle with. In this case, an item in the player's inventory. If no items are listed as solutions, returns an empty string. If the player doesn't have the item solution, returns undefined.
	 */
	#checkPlayerHasItemSolution(puzzle, item, requiredItems) {
		const regex = /((Inventory)?Item|Prefab):/g;
		if (puzzle.type !== "container" && regex.test(puzzle.solutions.join(','))) {
			for (let i = 0; i < puzzle.solutions.length; i++) {
				const solution = puzzle.solutions[i];
				if (solution.startsWith("Item:") || solution.startsWith("InventoryItem:") || solution.startsWith("Prefab:")) {
					if (item !== null && item.prefab.id === solution.substring(solution.indexOf(':') + 1).trim()) {
						return solution;
					}
					else if (item === null) {
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
	 * @param {Puzzle} puzzle - The puzzle to check.
	 * @param {string} input - The combined arguments of the command.
	 * @param {string} command - The command alias that was used to attempt the puzzle.
	 * @param {string} [customNarration] - The custom narration to use, if any.
	 */
	#handleInaccessiblePuzzle(puzzle, input, command, customNarration) {
		if (this.#checkInaccessiblePuzzleHasDescription(puzzle)) {
			this.#narrateAndLogPuzzleIsInaccessible(puzzle, this.#getInaccessiblePuzzleCustomNarration(customNarration));
		}
		else if (this.message) addReply(this.getGame(), this.message, `Couldn't find "${input}" to ${command}. Try using a different command?`);
	}

	/**
	 * Returns true if the puzzle has a requirementsNotMetDescription.
	 * @param {Puzzle} puzzle - The puzzle to check.
	 */
	#checkInaccessiblePuzzleHasDescription(puzzle) {
		return puzzle.requirementsNotMetDescription !== "";
	}

	/**
	 * If an inaccessible puzzle was attempted without a message being sent (i.e. by a bot command), then passing an empty string as the customNarration will prevent a narration from being sent.
	 * @param {string} [customNarration] - The custom narration to use, if any.
	 * @returns {string|undefined} Returns either an empty string if no message was sent, or the custom narration if one was. If no custom narration was specified, it is undefined.
	 */
	#getInaccessiblePuzzleCustomNarration(customNarration) {
		return this.message === undefined ? "" : customNarration;
	}

	/**
	 * Replies to the message, if there was one.
	 * @param {string} messageText - The text of the message to send. 
	 */
	#reply(messageText) {
		if (this.message) addReply(this.getGame(), this.message, messageText);
	}

	/**
	 * Solves the puzzle, and sends the narration, correct description, and log message.
	 * @param {Puzzle} puzzle - The puzzle being attempted.
	 * @param {string} outcome - The outcome the puzzle was solved with.
	 * @param {ItemInstance[]} requiredItems - The actual item instances that were required for this puzzle to be solved.
	 * @param {ItemInstance} [item] - The item that was used to solve the puzzle, if any.
	 * @param {Player} [targetPlayer] - The player who will be treated as the initiating player in subsequent bot command executions called by the puzzle's solved commands, if any.
	 */
	#solvePuzzle(puzzle, outcome, requiredItems, item, targetPlayer) {
		puzzle.solve(this.player, outcome, requiredItems, targetPlayer);
		this.getGame().narrationHandler.narrateSolve(puzzle, outcome, this.player, item);
		this.getGame().logHandler.logSolve(puzzle, this.player, this.forced);
	}

	/**
	 * Unsolves the puzzle, and sends the narration, notifications, and log message.
	 * @param {Puzzle} puzzle - The puzzle being attempted.
	 */
	#unsolvePuzzle(puzzle) {
		this.getGame().narrationHandler.narrateUnsolve(puzzle, this.player);
		this.getGame().logHandler.logUnsolve(puzzle, this.player, this.forced);
		puzzle.unsolve(this.player);
	}

	/**
	 * Decrements the puzzle's remaining attempts (if applicable), and sends the narration, incorrect description, and log message.
	 * @param {Puzzle} puzzle - The puzzle being attempted.
	 * @param {ItemInstance} [item] - The item that was used to attempt the puzzle, if any.
	 */
	#failPuzzle(puzzle, item) {
		puzzle.fail();
		this.getGame().narrationHandler.narrateAttempt(puzzle, this.player, puzzle.incorrectDescription, this.getGame().notificationGenerator.generateAttemptAndFailPuzzleNotification(this.player, false, puzzle, item));
		this.getGame().logHandler.logAttemptAndFailPuzzle(puzzle, this.player, this.forced);
	}

	/**
	 * Sends the narration and log message indicating the puzzle is already solved.
	 * @param {Puzzle} puzzle - The puzzle being attempted.
	 * @param {string} [customNarration] - The custom narration to use, if any. Defaults to a notification that's automatically generated based on the type of puzzle.
	 */
	#narrateAndLogAlreadySolvedPuzzle(puzzle, customNarration = this.getGame().notificationGenerator.generateAttemptAlreadySolvedPuzzleNotification(this.player, false, puzzle)) {
		this.getGame().narrationHandler.narrateAttempt(puzzle, this.player, puzzle.alreadySolvedDescription, customNarration);
		this.getGame().logHandler.logAttemptAlreadySolvedPuzzle(puzzle, this.player, this.forced);
	}

	/**
	 * Sends the narration and log message indicating the puzzle has no remaining attempts.
	 * @param {Puzzle} puzzle - The puzzle being attempted.
	 * @param {string} [customNarration] - The custom narration to use, if any. Defaults to the no remaining attempts notification.
	 */
	#narrateAndLogPuzzleHasNoRemainingAttempts(puzzle, customNarration = this.getGame().notificationGenerator.generateAttemptPuzzleWithNoRemainingAttemptsNotification(this.player.displayName, puzzle.getContainingPhrase())) {
		this.getGame().narrationHandler.narrateAttempt(puzzle, this.player, puzzle.noMoreAttemptsDescription, customNarration);
		this.getGame().logHandler.logAttemptPuzzleWithNoRemainingAttempts(puzzle, this.player, this.forced);
	}

	/**
	 * Sends the narration and log message indicating the puzzle is not accessible.
	 * @param {Puzzle} puzzle - The puzzle being attempted.
	 * @param {string} [customNarration] - The custom narration to use, if any. Defaults to the default attempt notification.
	 */
	#narrateAndLogPuzzleIsInaccessible(puzzle, customNarration = this.getGame().notificationGenerator.generateAttemptPuzzleDefaultNotification(this.player.displayName, puzzle.getContainingPhrase())) {
		this.getGame().narrationHandler.narrateAttempt(puzzle, this.player, puzzle.requirementsNotMetDescription, customNarration);
		this.getGame().logHandler.logAttemptInaccessiblePuzzle(puzzle, this.player, this.forced);
	}
}