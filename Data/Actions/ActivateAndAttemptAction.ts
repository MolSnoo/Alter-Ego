// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import ActivateAction from "./ActivateAction.ts";
import AttemptAction from "./AttemptAction.ts";
import type Fixture from "../Fixture.ts";
import type Game from "../Game.ts";
import type ItemInstance from "../ItemInstance.ts";
import type Player from "../Player.ts";
import type Puzzle from "../Puzzle.ts";
import type Room from "../Room.ts";
import type Whisper from "../Whisper.ts";

/**
 * Represents an activate and attempt action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#activate-and-attempt-action
 */
export default class ActivateAndAttemptAction extends Action {
    private readonly activateAction: ActivateAction;
    private readonly attemptAction: AttemptAction;

    /**
     * @param game - The game this belongs to.
     * @param message - The message that initiated the action.
     * @param player - The player performing the action.
     * @param location - The location where this action is being performed.
     * @param forced - Whether or not the action was performed by someone other than the player themselves.
     * @param whisper - The whisper where this action is being performed, if applicable.
     * @param user - The user who created the action, if applicable.
     */
    constructor(game: Game, message: UserMessage, player: Player, location: Room, forced: boolean, whisper?: Whisper, user?: User) {
        super(game, message, player, location, forced, whisper, user);
        this.activateAction = new ActivateAction(game, message, player, location, forced, whisper, user);
        this.attemptAction = new AttemptAction(game, message, player, location, forced, whisper, user);
    }

    /**
     * Performs an activate and attempt action.
     *
     * @param fixture - The fixture to activate.
     * @param puzzle - The puzzle to attempt.
     * @param item - The item instance required to attempt the puzzle.
     * @param password - The password the player entered to attempt the puzzle.
     * @param command - The command alias that was used to attempt the puzzle.
     * @param input - The combined arguments of the command.
     * @param targetPlayer - The player who will be treated as the initiating player in subsequent bot command executions called by the puzzle's solved commands, if applicable.
     */
    performActivateAndAttempt(fixture: Fixture, puzzle: Puzzle, item: ItemInstance, password: string, command: string, input: string, targetPlayer?: Player): void {
        if (this.performed) return;
        super.perform();
        this.activateAction.performActivate(fixture, false);
        this.attemptAction.performAttempt(puzzle, item, password, command, input, targetPlayer);
        this.successMessage = `Successfully activated ${fixture.name} and attempted ${puzzle.name} for ${this.player?.name}.`;
    }

    /**
     * Finds the required fixture to call performActivateAndAttempt.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [Fixture, boolean, Puzzle, ItemInstance, string, string, string, string, Player] {
        const fixtureArgs = args.slice(0, 3);
        const puzzleArgs = args.slice(3);
        const [fixture, narrate] = this.activateAction.parseInteractionArgs(fixtureArgs);
        const [puzzle, item, password, command, input, targetPlayerDisplayName, targetPlayer] = this.attemptAction.parseInteractionArgs(puzzleArgs);
        return [fixture, narrate, puzzle, item, password, command, input, targetPlayerDisplayName, targetPlayer];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performActivateAndAttempt.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: ReturnType<typeof this.parseInteractionArgs>): [Fixture, Puzzle, ItemInstance, string, string, string, Player] {
        const fixtureArgs = args.slice(0, 2) as [Fixture, boolean];
        const puzzleArgs = args.slice(2) as [Puzzle, ItemInstance, string, string, string, string, Player];
        const [fixture] = this.activateAction.validateInteractionArgs(fixtureArgs);
        const [puzzle, item, password, command, input, targetPlayer] = this.attemptAction.validateInteractionArgs(puzzleArgs);
        return [fixture, puzzle, item, password, command, input, targetPlayer];
    }
}
