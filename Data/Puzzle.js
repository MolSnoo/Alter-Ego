import Event from './Event.js';
import Fixture from './Fixture.js';
import Flag from './Flag.js';
import Game from './Game.js';
import InventoryItem from './InventoryItem.js';
import ItemContainer from './ItemContainer.js';
import ItemInstance from './ItemInstance.js';
import Narration from '../Data/Narration.js';
import Player from './Player.js';
import Prefab from './Prefab.js';
import Room from './Room.js';
import RoomItem from './RoomItem.js';
import { parseAndExecuteBotCommands } from '../Modules/commandHandler.js';
import { addLogMessage, addReply } from '../Modules/messageHandler.js';
import { addItem as addItemToList, removeItem as removeItemFromList } from "../Modules/parser.js";


/**
 * @class Puzzzle
 * @classdesc Represents an interactable entity with correct, incorrect, and limited ways to engage with it.
 * @extends ItemContainer
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/puzzle.html
 */
export default class Puzzle extends ItemContainer {
    /**
     * The name of the puzzle. 
     * @readonly
     * @type {string} 
     */
    name;
    /**
     * Whether the puzzle is solved. 
     * @type {boolean} 
     */
    solved;
    /**
     * String indicating which solution the puzzle has been solved with. 
     * @type {string} 
     */
    outcome;
    /**
     * Whether the puzzle requires a moderator to solve it.
     * @readonly 
     * @type {boolean} 
     */
    requiresMod;
    /**
     * The display name of the location the puzzle is found in.
     * @readonly
     * @type {string}
     */
    locationDisplayName;
    /**
     * The location the puzzle is found in. 
     * @type {Room} 
     */
    location;
    /**
     * The name of the object associated with the puzzle. Deprecated. Use parentFixtureName instead.
     * @deprecated
     * @readonly
     * @type {string} 
     */
    parentObjectName;
    /**
     * The name of the fixture associated with the puzzle.
     * @readonly
     * @type {string}
     */
    parentFixtureName;
    /**
     * The puzzle's parent object. Deprecated. Use parentFixture instead. If there isn't one, this is `null`.
     * @deprecated
     * @type {Fixture}
     */
    parentObject;
    /**
     * The puzzle's parent fixture. If there isn't one, this is `null`.
     * @type {Fixture}
     */
    parentFixture;
    /**
     * The type of puzzle.
     * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/puzzle.html#type
     * @readonly
     * @type {string} 
     */
    type;
    /**
     * Whether the puzzle can be interacted with. 
     * @type {boolean} 
     */
    accessible;
    /**
     * Puzzle names, event IDs, prefab IDs or flag IDs that are required for the puzzle to be made accessible. 
     * @readonly
     * @type {PuzzleRequirement[]} 
     */
    requirementsStrings;
    /** 
     * An array of game entities required for the puzzle to be solved when attempted.
     * @type {Array<Puzzle|Event|Prefab|Flag>}
     */
    requirements;
    /**
     * The solutions to the puzzle. 
     * @readonly
     * @type {string[]} 
     */
    solutions;
    /**
     * The number of attempts the player has left to solve the puzzle. 
     * @type {number} 
     */
    remainingAttempts;
    /**
     * The string representation of the bot commands to be executed when the puzzle is solved or unsolved with specified outcomes.
     * @readonly 
     * @type {string} 
     */
    commandSetsString;
    /**
     * Sets of commands to be executed when the puzzle is solved or unsolved with specified outcomes. 
     * @readonly
     * @type {PuzzleCommandSet[]} 
     */
    commandSets;
    /**
     * The description of the puzzle when it is solved by a player. 
     * @readonly
     * @type {string} 
     */
    correctDescription;
    /**
     * The description of the puzzle when it is already solved. Can contain an item list. 
     * @type {string} 
     */
    alreadySolvedDescription;
    /**
     * The description of the puzzle when the incorrect answer is given. 
     * @readonly
     * @type {string} 
     */
    incorrectDescription;
    /**
     * The description of the puzzle when the player attempts to solve it when the number of remainingAttempts is 0. 
     * @readonly
     * @type {string} 
     */
    noMoreAttemptsDescription;
    /**
     * The description of the puzzle when a player attempts to solve it while all of the requirements are not met. 
     * @readonly
     * @type {string} 
     */
    requirementsNotMetDescription;

    /**
     * @constructor
     * @param {string} name - The name of the puzzle.
     * @param {boolean} solved - Whether the puzzle is solved.
     * @param {string} outcome - String indicating which solution the puzzle has been solved with.
     * @param {boolean} requiresMod - Whether the puzzle requires a moderator to solve it.
     * @param {string} locationDisplayName - The display name of the location the puzzle is found in.
     * @param {string} parentFixtureName - The name of the fixture associated with the puzzle.
     * @param {string} type - The type of puzzle. {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/puzzle.html#type}
     * @param {boolean} accessible - Whether the puzzle can be interacted with.
     * @param {PuzzleRequirement[]} requirementsStrings - Puzzle names, event IDs, prefab IDs or flag IDs that are required for the puzzle to be made accessible.
     * @param {string[]} solutions - The solutions to the puzzle.
     * @param {number} remainingAttempts - The number of attempts the player has left to solve the puzzle.
     * @param {string} commandSetsString - The string representation of the bot commands to be executed when the puzzle is solved or unsolved with specified outcomes.
     * @param {PuzzleCommandSet[]} commandSets - Sets of commands to be executed when the puzzle is solved or unsolved with specified outcomes.
     * @param {string} correctDescription - The description of the puzzle when it is solved by a player.
     * @param {string} alreadySolvedDescription - The description of the puzzle when it is already solved. Can contain an item list.
     * @param {string} incorrectDescription - The description of the puzzle when the incorrect answer is given.
     * @param {string} noMoreAttemptsDescription - The description of the puzzle when the player attempts to solve it when the number of remainingAttempts is 0.
     * @param {string} requirementsNotMetDescription - The description of the puzzle when a player attempts to solve it while all of the requirements are not met.
     * @param {number} row - The row number of the puzzle in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(name, solved, outcome, requiresMod, locationDisplayName, parentFixtureName, type, accessible, requirementsStrings, solutions, remainingAttempts, commandSetsString, commandSets, correctDescription, alreadySolvedDescription, incorrectDescription, noMoreAttemptsDescription, requirementsNotMetDescription, row, game) {
        super(game, row, alreadySolvedDescription);
        this.name = name;
        this.solved = solved;
        this.outcome = outcome;
        this.requiresMod = requiresMod;
        this.locationDisplayName = locationDisplayName;
        this.location = null;
        this.parentFixtureName = parentFixtureName;
        this.parentObjectName = parentFixtureName;
        this.parentFixture = null;
        this.parentObject = null;
        this.type = type;
        this.accessible = accessible;
        this.requirementsStrings = requirementsStrings;
        this.requirements = new Array(this.requirementsStrings.length);
        this.solutions = solutions;
        this.remainingAttempts = remainingAttempts;
        this.commandSetsString = commandSetsString;
        this.commandSets = commandSets;
        this.correctDescription = correctDescription;
        this.alreadySolvedDescription = alreadySolvedDescription;
        this.incorrectDescription = incorrectDescription;
        this.noMoreAttemptsDescription = noMoreAttemptsDescription;
        this.requirementsNotMetDescription = requirementsNotMetDescription;
    }

    /**
     * Sets the location.
     * @param {Room} room
     */
    setLocation(room) {
        this.location = room;
    }

    /**
     * Sets the parent fixture.
     * @param {Fixture} fixture 
     */
    setParentFixture(fixture) {
        this.parentFixture = fixture;
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
     * @param {Player} player - The player who solved the puzzle.
     * @param {string} narration - The message to be narrated in the room.
     * @param {string} outcome - The solution the puzzle was solved with.
     * @param {boolean} doSolvedCommands - Whether or not to execute the puzzle's solved commands.
     * @param {Array<RoomItem|InventoryItem>} [requiredItems] - The actual item instances that were required for this puzzle to be solved.
     * @param {Player} [targetPlayer] - The player who will be treated as the initiating player in subsequent bot command executions called by this puzzle's solved commands, if applicable.
     */
    solve(player, narration, outcome, doSolvedCommands, requiredItems = [], targetPlayer = null) {
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
            player.sendDescription(this.correctDescription, this);
        if (narration)
            new Narration(this.getGame(), player, this.location, narration).send();

        if (player !== null) {
            // Post log message.
            const time = new Date().toLocaleTimeString();
            addLogMessage(this.getGame(), `${time} - ${player.name} solved ${this.name} in ${player.location.channel}`);
        }

        for (const requiredItem of requiredItems) {
            if (!isNaN(requiredItem.uses))
                requiredItem.decreaseUses(player);
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
            }
            else commandSet = this.commandSets[0].solvedCommands;
            // Execute the command set's solved commands.
            parseAndExecuteBotCommands(commandSet, this.getGame(), this, targetPlayer ? targetPlayer : player);
        }
    }

    /**
     * Sets the puzzle as unsolved.
     * @param {Player} player - The player who unsolved the puzzle.
     * @param {string} narration - The message to be narrated in the room.
     * @param {string} directMessage - The message that will be sent directly to the player for unsolving the puzzle.
     * @param {boolean} doUnsolvedCommands - Whether or not to execute the puzzle's unsolved commands.
     */
    unsolve(player, narration, directMessage, doUnsolvedCommands) {
        // There's no message when unsolved cell, so let the player know what they did.
        if (player !== null && directMessage !== null) player.notify(directMessage);
        // Let everyonne in the room know that the puzzle was unsolved.
        if (narration)
            new Narration(this.getGame(), player, this.location, narration).send();

        // Now mark it as unsolved.
        this.solved = false;

        if (player !== null) {
            // Post log message.
            const time = new Date().toLocaleTimeString();
            addLogMessage(this.getGame(), `${time} - ${player.name} unsolved ${this.name} in ${player.location.channel}`);
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
            }
            else commandSet = this.commandSets[0].unsolvedCommands;
            // Execute the command set's unsolved commands.
            parseAndExecuteBotCommands(commandSet, this.getGame(), this, player);
        }

        // Clear the outcome.
        if (this.solutions.length > 1 && this.type !== "channels")
            this.outcome = "";
    }

    /**
     * A player fails to solve the puzzle.
     * @param {Player} player - The player who attempted and failed to solve the puzzle.
     * @param {string} narration - The message to be narrated in the room.
     */
    fail(player, narration) {
        // Decrease the number of remaining attempts, if applicable.
        if (!isNaN(this.remainingAttempts)) {
            this.remainingAttempts--;
            player.sendDescription(this.incorrectDescription, this);
        }
        else
            player.sendDescription(this.incorrectDescription, this);
        if (narration)
            new Narration(this.getGame(), player, player.location, narration).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(this.getGame(), `${time} - ${player.name} failed to solve ${this.name} in ${player.location.channel}`);
    }

    /**
     * A player attempts to solve the puzzle while it is already solved.
     * @param {Player} player - The player who attempted to solve the puzzle.
     * @param {string} narration - The message to be narrated in the room.
     */
    alreadySolved(player, narration) {
        player.sendDescription(this.alreadySolvedDescription, this);
        new Narration(this.getGame(), player, player.location, narration).send();
    }

    /**
     * A player attempts to solve the puzzle while its requirements are not met.
     * @param {Player} player - The player who attempted to solve the puzzle.
     * @param {string} narration - The message to be narrated in the room.
     * @param {string} command - The command alias that was used to attempt the puzzle.
     * @param {string} input - The combined arguments of the command.
     * @param {UserMessage} [message] - The message that triggered the puzzle attempt.
     */
    requirementsNotMet(player, narration, command, input, message) {
        // If there's no text in the Requirements Not Met cell, then the player shouldn't know about this puzzle.
        if (this.requirementsNotMetDescription === "" && message)
            addReply(this.getGame(), message, `Couldn't find "${input}" to ${command}. Try using a different command?`);
        // If there is text there, then the fixture in the puzzle is interactable, but doesn't do anything until the required puzzle has been solved.
        else {
            player.sendDescription(this.requirementsNotMetDescription, this);
            if (message) new Narration(this.getGame(), player, player.location, narration).send();
        }
    }

    /**
     * Gets the alreadySolvedDescription.
     * @override
     * @returns {string}
     */
    getDescription() {
        return this.alreadySolvedDescription;
    }

    /**
     * Sets the alreadySolvedDescription.
     * @param {string} description 
     */
    #setDescription(description) {
        this.alreadySolvedDescription = description;
    }

    /**
     * Adds an item to the specified item list in the puzzle's already solved description.
     * @override
     * @param {ItemInstance} item - The item to add.
     * @param {string} [list] - The item list to add the item to.
     * @param {number} [quantity] - The quantity of the item to add. If none is provided, defaults to 1.
     */
    addItemToDescription(item, list, quantity) {
        this.#setDescription(addItemToList(this.getDescription(), item, list, quantity));
    }

    /**
     * Removes an item from the specified item list in the puzzle's already solved description.
     * @override
     * @param {ItemInstance} item - The item to remove.
     * @param {string} list - The item list to remove the item from.
     * @param {number} [quantity] - The quantity of the item to remove. If none is provided, defaults to 1.
     */
    removeItemFromDescription(item, list, quantity) {
        this.#setDescription(removeItemFromList(this.getDescription(), item, list, quantity));
    }

    /**
     * Gets the name of the parent fixture preceded by "the". If no parent fixture exists, returns the puzzle's name preceded by "the" instead.
     */
    getContainingPhrase() {
        return this.parentFixture ? this.parentFixture.getContainingPhrase() : `the ${this.name}`;
    }

    /**
     * Gets the preposition of the parent fixture, if applicable. If no parent fixture exists, returns "in".
     */
    getPreposition() {
        return this.parentFixture ? this.parentFixture.getPreposition() : "in";
    }

    /** @returns {string} */
    correctCell() {
        return this.getGame().constants.puzzleSheetCorrectColumn + this.row;
    }

    /** @returns {string} */
    alreadySolvedCell() {
        return this.getGame().constants.puzzleSheetAlreadySolvedColumn + this.row;
    }

    /** @returns {string} */
    incorrectCell() {
        return this.getGame().constants.puzzleSheetIncorrectColumn + this.row;
    }

    /** @returns {string} */
    noMoreAttemptsCell() {
        return this.getGame().constants.puzzleSheetNoMoreAttemptsColumn + this.row;
    }

    /** @returns {string} */
    requirementsNotMetCell() {
        return this.getGame().constants.puzzleSheetRequirementsNotMetColumn + this.row;
    }
}
