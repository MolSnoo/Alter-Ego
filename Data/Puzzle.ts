// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { itemIdentifierMatches } from "../Modules/matchers.ts";
import { round } from "../Modules/helpers.ts";
import Description from "./Description.ts";
import Event from "./Event.ts";
import type Fixture from "./Fixture.ts";
import Flag from "./Flag.ts";
import type Game from "./Game.ts";
import type InventoryItem from "./InventoryItem.ts";
import ItemContainer from "./ItemContainer.ts";
import type ItemInstance from "./ItemInstance.ts";
import type Player from "./Player.ts";
import Prefab from "./Prefab.ts";
import type Room from "./Room.ts";
import type RoomItem from "./RoomItem.ts";

export type PuzzleField =
    "name" |
    "solved" |
    "outcome" |
    "requiresMod" |
    "location" |
    "parentFixture" |
    "type" |
    "accessible" |
    "requirements" |
    "solutions" |
    "remainingAttempts" |
    "commandSetsString" |
    "correctDescription" |
    "alreadySolvedDescription" |
    "unsolvedDescription" |
    "incorrectDescription" |
    "noMoreAttemptsDescription" |
    "requirementsNotMetDescription";

export interface PuzzleRequirement {
    /** The type of entity required. */
    type: string;
    /** The ID of the entity required. */
    entityId: string
}

export interface PuzzleCommandSet {
    /** Strings indicating which puzzle solutions will execute the commands in this command set. Optional. */
    outcomes?: string[];
    /** Bot commands that will be executed when the puzzle is solved. */
    solvedCommands: string[];
    /** Bot commands that will be executed when the puzzle is unsolved. */
    unsolvedCommands: string[];
}

/**
 * Represents an interactable entity with correct, incorrect, and limited ways to engage with it.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/puzzle.html
 */
export default class Puzzle extends ItemContainer implements PersistentGameEntity<PuzzleField> {
    /**
     * The name of the puzzle.
     */
    readonly name: string;
    /**
     * Whether the puzzle is solved.
     */
    solved: boolean;
    /**
     * String indicating which solution the puzzle has been solved with.
     */
    outcome: string;
    /**
     * Whether the puzzle requires a moderator to solve it.
     */
    readonly requiresMod: boolean;
    /**
     * The display name of the location the puzzle is found in.
     */
    readonly locationDisplayName: string;
    /**
     * The location the puzzle is found in.
     */
    location: Room;
    /**
     * The name of the object associated with the puzzle.
     *
     * @deprecated Use parentFixtureName instead.
     */
    readonly parentObjectName: string;
    /**
     * The name of the fixture associated with the puzzle.
     */
    readonly parentFixtureName: string;
    /**
     * The puzzle's parent object. If there isn't one, this is `null`.
     *
     * @deprecated Use parentFixture instead.
     */
    readonly parentObject: Fixture | null;
    /**
     * The puzzle's parent fixture. If there isn't one, this is `null`.
     */
    parentFixture: Fixture | null;
    /**
     * The type of puzzle.
     *
     * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/puzzle.html#type
     */
    readonly type: string;
    /**
     * Whether the puzzle can be interacted with.
     */
    accessible: boolean;
    /**
     * Puzzle names, event IDs, prefab IDs or flag IDs that are required for the puzzle to be made accessible.
     */
    readonly requirementsStrings: PuzzleRequirement[];
    /**
     * An array of game entities required for the puzzle to be solved when attempted.
     */
    requirements: Array<Puzzle | Event | Prefab | Flag>;
    /**
     * The solutions to the puzzle.
     */
    readonly solutions: string[];
    /**
     * The number of attempts the player has left to solve the puzzle.
     */
    remainingAttempts: number;
    /**
     * The string representation of the bot commands to be executed when the puzzle is solved or unsolved with specified outcomes.
     */
    readonly commandSetsString: string;
    /**
     * Sets of commands to be executed when the puzzle is solved or unsolved with specified outcomes.
     */
    readonly commandSets: PuzzleCommandSet[];
    /**
     * The description of the puzzle when it is solved by a player.
     */
    readonly correctDescription: Description;
    /**
     * The description of the puzzle when it is already solved. Can contain an item list.
     */
    readonly alreadySolvedDescription: Description;
    /**
     * The description of the puzzle when it is unsolved.
     */
    readonly unsolvedDescription: Description;
    /**
     * The description of the puzzle when the incorrect answer is given.
     */
    readonly incorrectDescription: Description;
    /**
     * The description of the puzzle when the player attempts to solve it when the number of remainingAttempts is 0.
     */
    readonly noMoreAttemptsDescription: Description;
    /**
     * The description of the puzzle when a player attempts to solve it while all of the requirements are not met.
     */
    readonly requirementsNotMetDescription: Description;
    /**
     * Puzzle types that players can attempt with no additional input.
     */
    static readonly SimpleInteractTypes = new Set(["interact", "toggle", "player", "player toggle", "matrix"]);
    /**
     * Puzzle types that players can attempt by supplying one of a small, set number of known options.
     */
    static readonly SelectInteractTypes = new Set(["switch", "room player"]);
    /**
     * Puzzle types that players can attempt by supplying any string of text.
     */
    static readonly TextInputInteractTypes = new Set(["password", "combination lock"]);
    /**
     * Puzzle types whose method of interaction varies based on the puzzle's solved state.
     */
    static readonly MixedInteractTypes = new Set(["channels", "option", "media", "key lock"]);

    /**
     * @param name - The name of the puzzle.
     * @param solved - Whether the puzzle is solved.
     * @param outcome - String indicating which solution the puzzle has been solved with.
     * @param requiresMod - Whether the puzzle requires a moderator to solve it.
     * @param locationDisplayName - The display name of the location the puzzle is found in.
     * @param parentFixtureName - The name of the fixture associated with the puzzle.
     * @param type - The type of puzzle. {@link https://msvblank.github.io/Alter-Ego/reference/data_structures/puzzle.html#type}
     * @param accessible - Whether the puzzle can be interacted with.
     * @param requirementsStrings - Puzzle names, event IDs, prefab IDs or flag IDs that are required for the puzzle to be made accessible.
     * @param solutions - The solutions to the puzzle.
     * @param remainingAttempts - The number of attempts the player has left to solve the puzzle.
     * @param commandSetsString - The string representation of the bot commands to be executed when the puzzle is solved or unsolved with specified outcomes.
     * @param commandSets - Sets of commands to be executed when the puzzle is solved or unsolved with specified outcomes.
     * @param correctDescription - The description of the puzzle when it is solved by a player.
     * @param alreadySolvedDescription - The description of the puzzle when it is already solved. Can contain an item list.
     * @param unsolvedDescription - The description of the puzzle when it is unsolved.
     * @param incorrectDescription - The description of the puzzle when the incorrect answer is given.
     * @param noMoreAttemptsDescription - The description of the puzzle when the player attempts to solve it when the number of remainingAttempts is 0.
     * @param requirementsNotMetDescription - The description of the puzzle when a player attempts to solve it while all of the requirements are not met.
     * @param row - The row number of the puzzle in the sheet.
     * @param game - The game this belongs to.
     */
    constructor(name: string, solved: boolean, outcome: string, requiresMod: boolean, locationDisplayName: string,
        parentFixtureName: string, type: string, accessible: boolean, requirementsStrings: PuzzleRequirement[],
        solutions: string[], remainingAttempts: number, commandSetsString: string, commandSets: PuzzleCommandSet[],
        correctDescription: string, alreadySolvedDescription: string, unsolvedDescription: string,
        incorrectDescription: string, noMoreAttemptsDescription: string, requirementsNotMetDescription: string,
        row: number, game: Game) {
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
        this.correctDescription = new Description(correctDescription, this, game);
        this.alreadySolvedDescription = new Description(alreadySolvedDescription, this, game);
        this.unsolvedDescription = new Description(unsolvedDescription, this, game);
        this.incorrectDescription = new Description(incorrectDescription, this, game);
        this.noMoreAttemptsDescription = new Description(noMoreAttemptsDescription, this, game);
        this.requirementsNotMetDescription = new Description(requirementsNotMetDescription, this, game);
    }

    /** Gets the entity's location. */
    getLocation(): Room {
        return this.location;
    }

    /**
     * Sets the location.
     */
    setLocation(room: Room): void {
        this.location = room;
    }

    /**
     * Sets the parent fixture.
     */
    setParentFixture(fixture: Fixture): void {
        this.parentFixture = fixture;
    }

    /**
     * Sets the puzzle as accessible.
     */
    setAccessible(): void {
        this.accessible = true;
    }

    /**
     * Sets the puzzle as inaccessible.
     */
    setInaccessible(): void {
        this.accessible = false;
    }

    /**
     * Returns true if the puzzle is always accessible, meaning it doesn't require being made accessible through solving or other interactions.
     * Weight, container, take, and drop puzzles are always accessible.
     */
    isAlwaysAccessible(): boolean {
        return this.type === "weight" || this.type === "container" || this.type === "take" || this.type === "drop";
    }

    /**
     * Gets a second-person verb to use to describe how a player attempts this puzzle.
     * The verb chosen largely depends on the puzzle's display name, type, and solved state.
     * The default verb is "use".
     * @param solved - Whether or not to consider the puzzle solved. Defaults to its current solved state.
     */
    getAttemptVerb(solved = this.solved): string {
        if ((this.type === "key lock" || this.type === "combination lock") && solved) return "lock";
        else if ((this.type === "key lock" || this.type === "combination lock")) return "unlock";
        if (this.type === "media" && solved) return "eject";
        else if (this.type === "media") return "insert";
        if (this.type === "switch" || this.type === "room player") return "set";
        if (this.type === "option" && solved) return "clear";
        else if (this.type === "option") return "set";
        const nameWords = new Set(this.getDisplayName().split(' '));
        if (nameWords.has("USERNAME") || nameWords.has("PASSWORD")) return "enter";
        if (nameWords.has("INPUT")) return "enter";
        if (nameWords.has("KEYPAD") || nameWords.has("KEYBOARD")) return "type on";
        if (nameWords.has("BUTTON")) return "press";
        if (nameWords.has("SWITCH") || nameWords.has("lever")) return "flip";
        if (nameWords.has("BOLT") && this.type === "toggle") return "flip";
        if (nameWords.has("SHOWER") && solved) return "turn off";
        if (nameWords.has("TELEVISION") && solved) return "turn off";
        return "use";
    }

    /**
     * Gets a preposition to describe how an item is used on this puzzle.
     * The preposition chosen largely depends on the puzzle's type and solved state.
     * The default is "on".
     * @param solved - Whether or not to consider the puzzle solved. Defaults to its current solved state.
     */
    getAttemptWithItemPreposition(solved = this.solved): string {
        if ((this.type === "key lock" || this.type === "combination lock") && solved) return "with";
        else if ((this.type === "key lock" || this.type === "combination lock")) return "with";
        if (this.type === "media" && solved) return "from";
        else if (this.type === "media") return "into";
        if (this.type === "switch" || this.type === "room player") return "to";
        if (this.type === "option" && !solved) return "to";
        return "on";
    }

    /**
     * Returns the args for the Attempt ActionDirective for this puzzle.
     * Intended to be used for puzzles that can be attempted with a simple interaction or with the use of an inventory item.
     * @param solved - Whether or not to consider the puzzle solved. Used to generate the command. Optional.
     * @param item - The item to attempt the puzzle with. Optional.
     * @param password - The password to attempt the puzzle with. Optional.
     * @param targetPlayerDisplayName - The display name of the player to target. Optional.
     * @returns [name, location, type, item identifier, item containerName, item equipmentSlot, item proceduralSelectionsString, password, getAttemptVerb() (command), name (input), targetPlayer displayName]
     */
    getAttemptActionDirectiveArgs(solved?: boolean, item?: InventoryItem, password: string = "", targetPlayerDisplayName: string = ""): [string, string, string, string, string, string, string, string, string, string, string] {
        return [
            this.name,
            this.location.id,
            this.type,
            item?.getIdentifier() ?? undefined,
            item?.containerName ?? undefined,
            item?.equipmentSlot ?? undefined,
            item?.proceduralSelectionsString ?? undefined,
            password,
            this.getAttemptVerb(solved),
            this.name,
            targetPlayerDisplayName
        ];
    }

    /**
     * Returns the args for the InstantiateRoomItem ActionDirective for this puzzle.
     * @returns ["PZ", name, location, preposition, type]
     */
    getPartialInstantiateActionDirectiveArgs(): [string, string, string, string, string] {
        return ["PZ", this.name, this.location.displayName, this.getPreposition(), this.type];
    }

    /**
     * Returns the args for the DestroyRoomItem ActionDirective for this puzzle.
     * @returns ["ALL", identifier, location, accessible, containerType, containerName, slotId]
     */
    getDestroyAllRoomItemActionDirectiveArgs(): [string, string, string, string, string, string, string] {
        return ["ALL", undefined, this.location.id, undefined, 'Puzzle', this.name, undefined];
    }

    /**
     * Returns the args for the Find ActionDirective to get the contained items for this item container.
     */
    getFindChildItemsActionDirectiveArgs(inventorySlotID?: string): [string] {
        return [`RoomItems ${this.getPreposition()} ${this.getEntityID()} at ${this.getLocation().id}`];
    }

    /**
     * Returns true if the puzzle is capable of containing items.
     */
    isItemContainer(): boolean {
        return this.parentFixture !== null && this.parentFixture.preposition !== "";
    }

    /**
     * Returns true if the puzzle is currently capable of being taken from/dropped into.
     * @param requireEmptySpace - Whether the container needs to be below max capacity. Defaults to true. Does nothing for puzzles.
     * @param bypassLimitations - Whether limitations should be bypassed. If true, the puzzle does not need to be accessible or solved. Defaults to false.
     */
    canCurrentlyContainItems(requireEmptySpace = true, bypassLimitations = false): boolean {
        return this.isAlwaysAccessible() || bypassLimitations || this.accessible && this.solved;
    }

    /**
     * Gets all of the items this entity contains.
     */
    override getContainedItems(): RoomItem[] {
        return this.getGame().entityFinder.getRoomItems(undefined, this.location.id, undefined, 'Puzzle', this.name);
    }

    /**
     * Gets all of the items that should appear in the puzzle's item list.
     *
     * @param itemListName - The name of the item list. Unused.
     * @param player - The player the description is being sent to. Unused.
     */
    override getContainedItemsForItemList(itemListName?: string, player?: Player): RoomItem[] {
        return this.getGame().entityFinder.getRoomItems(undefined, this.location.id, undefined, 'Puzzle', this.name);
    }

    /**
     * Returns true if this entity contains an item with the given identifier or prefab ID.
     * @param identifier - The identifier or prefab ID to search for.
     */
    override containsItem(identifier: string): boolean {
        const containedItems = this.getContainedItems();
        for (const item of containedItems) {
            if (itemIdentifierMatches(item, identifier, true)) return true;
        }
        return false;
    }

    /**
     * Returns the item contained inside of this container with the given identifier or prefab ID.
     * If no such item exists, returns undefined.
     * @param identifier - The identifier or prefab ID to search for.
     */
    override getContainedItem(identifier: string): ItemInstance {
        return this.getGame().entityFinder.getRoomItem(identifier, this.location.id, 'Puzzle', this.name);
    }

    /**
     * Sets the puzzle as solved.
     */
    solve(): void {
        // Mark it as solved.
        this.solved = true;
    }

    /**
     * Sets the puzzle's outcome.
     *
     * @param outcome - The solution the puzzle was solved with.
     */
    setOutcome(outcome: string): void {
        if (this.solutions.length > 1) {
            if (outcome)
                this.outcome = outcome;
            else this.outcome = this.solutions[0];
        }
    }

    /**
     * Decrements the uses of the required items that were used to solve the puzzle.
     *
     * @param player - The player who solved the puzzle.
     * @param requiredItems - The actual item instances that were required for this puzzle to be solved.
     */
    decrementRequiredItemUses(player: Player, requiredItems: ItemInstance[] = []): void {
        for (const requiredItem of requiredItems) {
            if (!isNaN(requiredItem.uses))
                requiredItem.decreaseUses(player);
        }
    }

    /**
     * Executes the puzzle's solved commands.
     *
     * @param targetPlayer - The player who will be treated as the initiating player in subsequent bot command executions called by this puzzle's solved commands, if applicable.
     */
    executeSolvedCommands(targetPlayer: Player = null): void {
        // Find commandSet.
        let commandSet: string[] = [];
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
        this.getGame().clientContext.commandHandler.parseAndExecuteBotCommands(commandSet, this.getGame(), this, targetPlayer);
    }

    /**
     * Sets the puzzle as unsolved.
     */
    unsolve(): void {
        this.solved = false;
    }

    /**
     * Clears the puzzle's outcome.
     */
    clearOutcome(): void {
        if (this.solutions.length > 1 && this.type !== "channels")
            this.outcome = "";
    }

    /**
     * Executes the puzzle's unsolved commands.
     *
     * @param targetPlayer - The player who will be treated as the initiating player in subsequent bot command executions called by this puzzle's unsolved commands, if applicable.
     */
    executeUnsolvedCommands(targetPlayer: Player = null): void {
        // Find commandSet.
        let commandSet: string[] = [];
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
        this.getGame().clientContext.commandHandler.parseAndExecuteBotCommands(commandSet, this.getGame(), this, targetPlayer);
    }

    /**
     * A player fails to solve the puzzle. Decrements the number of remaining attempts, if applicable.
     */
    fail(): void {
        if (!isNaN(this.remainingAttempts))
            this.remainingAttempts--;
    }

    /**
     * Gets the alreadySolvedDescription.
     */
    override getDescription(): Description {
        return this.alreadySolvedDescription;
    }

    /**
     * Gets the name of the parent fixture, if it exists. Otherwise, gets the puzzle's name.
     */
    getDisplayName(): string {
        return this.parentFixture ? this.parentFixture.name : this.name;
    }

    /**
     * Gets the name of the parent fixture preceded by "the". If no parent fixture exists, returns the puzzle's name preceded by "the" instead.
     * If the puzzle's name or the name of its parent fixture ends with a number, it will not be preceded by "the".
     */
    getContainingPhrase(): string {
        return this.parentFixture
            ? this.parentFixture.getContainingPhrase()
            : this.name.match(/.*\d+$/)
                ? this.name
                : `the ${this.name}`;
    }

    /**
     * Checks if only the puzzle's static requirements are met.
     * Requirements are considered static only if they're Puzzle or Event requirements.
     * Flag and Prefab requirements are evaluated dynamically, so those are skipped over in this function.
     */
    checkStaticRequirementsMet(): boolean {
        for (const requirement of this.requirements) {
            if (requirement instanceof Puzzle && !requirement.solved || requirement instanceof Event && !requirement.ongoing)
                return false;
        }
        return true;
    }

    /**
     * Checks if all of the puzzle's requirements are met.
     *
     * @param player - The player attempting the puzzle.
     * @param item - An item the player supplied in their attempt to solve the puzzle.
     * @param requiredItems - An array of required items in the player's inventory. The array will be populated during execution.
     * @returns Whether or not the puzzle's requirements have all been met.
     */
    checkRequirementsMet(player: Player, item: ItemInstance, requiredItems: ItemInstance[]): boolean {
        for (const requirement of this.requirements) {
            if (requirement instanceof Puzzle && !requirement.solved || requirement instanceof Event && !requirement.ongoing)
                return false;
            else if (requirement instanceof Flag) {
                if (requirement.valueScript !== "") {
                    const value = requirement.evaluate(requirement.valueScript, player);
                    requirement.setValue(value, true, player);
                }
                if (typeof requirement.value === 'string' && (requirement.value === null || requirement.value === "")) return false;
                if (typeof requirement.value !== 'string' && requirement.value !== true) return false;
            }
            else if (requirement instanceof Prefab) {
                if (item && item.prefab.id !== requirement.id) return false;
                else if (!item) {
                    const requiredItem = player ? player.findItem(requirement.id) : undefined;
                    if (!requiredItem) return false;
                    else if (!requiredItems.includes(requiredItem))
                        requiredItems.push(requiredItem);
                }
            }
        }
        return true;
    }

    /**
     * Returns the solution that is satisfied by a list of items contained in the puzzle.
     * If the list doesn't satisfy any solutions, returns undefined.
     *
     * @param containedItemsListString - A comma-separated list of items contained inside of the puzzle.
     */
    getSolutionSatisfiedByContainedItems(containedItemsListString: string): string {
        const containedItems = containedItemsListString.split(',');
        const itemsMatch = function (solution: string): boolean {
            let requiredItems = solution.split('+');
            if (requiredItems.length !== containedItems.length) return false;
            for (let i = 0; i < requiredItems.length; i++)
                requiredItems[i] = requiredItems[i].substring(requiredItems[i].indexOf(':') + 1).trim();
            requiredItems.sort(function (a, b) {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            });
            for (let i = 0; i < containedItems.length; i++)
                if (containedItems[i] !== requiredItems[i]) return false;
            return true;
        };
        for (const solution of this.solutions) {
            if (itemsMatch(solution)) return solution;
        }
        return undefined;
    }

    /**
     * Returns the solution that is satisfied by the given weight. If the weight doesn't satisfy any solutions, returns undefined.
     * The weight and solutions are rounded by the {@link round} function to the default number of decimal places.
     *
     * @param weightString - The weight being used to attempt the puzzle, in the form of a string.
     */
    getSolutionSatisfiedByWeight(weightString: string): string {
        const weight = round(parseFloat(weightString));
        if (!isNaN(weight)) {
            for (const solution of this.solutions) {
                const solutionValue = round(parseFloat(solution));
                if (isNaN(solutionValue)) continue;
                if (solutionValue === weight) return solution;
            }
        }
        return undefined;
    }

    /**
     * Returns the solution that is satisfied by the given item. If the item doesn't satisfy any solutions, returns undefined.
     *
     * @param item - The item being used to attempt the puzzle.
     */
    getSolutionSatisfiedByItem(item: ItemInstance): string {
        for (const solution of this.solutions) {
            if ((solution.startsWith("Item:") || solution.startsWith("InventoryItem:") || solution.startsWith("Prefab:"))
                && item.prefab.id === solution.substring(solution.indexOf(':') + 1).trim()) {
                return solution;
            }
        }
        return undefined;
    }

    /**
     * Gets the preposition of the parent fixture, if applicable. If no parent fixture exists, returns "in".
     */
    getPreposition(): string {
        return this.parentFixture ? this.parentFixture.getPreposition() : "in";
    }

    correctCell(): string {
        return this.getGame().constants.puzzleSheetCorrectColumn + this.row;
    }

    alreadySolvedCell(): string {
        return this.getGame().constants.puzzleSheetAlreadySolvedColumn + this.row;
    }

    unsolvedCell(): string {
        return this.getGame().constants.puzzleSheetUnsolvedColumn + this.row;
    }

    incorrectCell(): string {
        return this.getGame().constants.puzzleSheetIncorrectColumn + this.row;
    }

    noMoreAttemptsCell(): string {
        return this.getGame().constants.puzzleSheetNoMoreAttemptsColumn + this.row;
    }

    requirementsNotMetCell(): string {
        return this.getGame().constants.puzzleSheetRequirementsNotMetColumn + this.row;
    }

    getContainerIdentifier(): string {
        return this.getEntityID();
    }

    getContainerType(): string {
        return "Puzzle";
    }

    getEntityID(): string {
        return this.name;
    }

    getLabel(field: PuzzleField): string {
        switch (field) {
            case "name": return "Puzzle Name";
            case "solved": return "Solved?";
            case "outcome": return "Outcome";
            case "requiresMod": return "Requires Mod?";
            case "location": return "Location";
            case "parentFixture": return "Parent Fixture";
            case "type": return "Type";
            case "accessible": return "Accessible?";
            case "requirements": return "Requires";
            case "solutions": return "Solution(s)";
            case "remainingAttempts": return "Remaining Attempts";
            case "commandSetsString": return "When Solved / Unsolved";
            case "correctDescription": return "Description When Solved";
            case "alreadySolvedDescription": return "Description When Already Solved";
            case "unsolvedDescription": return "Description When Unsolved";
            case "incorrectDescription": return "Description When Incorrect Answer Given";
            case "noMoreAttemptsDescription": return "Description When No Attempts Remain";
            case "requirementsNotMetDescription": return "Description When Requirements Not Met";
        }
    }

    getValue(field: PuzzleField): string {
        switch (field) {
            case "name": return this.name;
            case "solved": return this.solved ? "TRUE" : "FALSE";
            case "outcome": return this.outcome;
            case "requiresMod": return this.requiresMod ? "TRUE" : "FALSE";
            case "location": return this.location.displayName;
            case "parentFixture": return this.parentFixture?.name ?? "";
            case "type": return this.type;
            case "accessible": return this.accessible ? "TRUE" : "FALSE";
            case "requirements": return this.requirementsStrings.map(requirement => (requirement.type ? `${requirement.type}: ` : ``) + `${requirement.entityId}`).join(", ");
            case "solutions": return this.solutions.join(", ");
            case "remainingAttempts": return isNaN(this.remainingAttempts) ? "" : String(this.remainingAttempts);
            case "commandSetsString": return this.commandSetsString;
            case "correctDescription": return this.correctDescription.text;
            case "alreadySolvedDescription": return this.alreadySolvedDescription.text;
            case "unsolvedDescription": return this.unsolvedDescription.text;
            case "incorrectDescription": return this.incorrectDescription.text;
            case "noMoreAttemptsDescription": return this.noMoreAttemptsDescription.text;
            case "requirementsNotMetDescription": return this.requirementsNotMetDescription.text;
        }
    }

    getViewField(field: PuzzleField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): "Puzzle" {
        return "Puzzle";
    }
}
