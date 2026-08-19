// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import ActivateAction from "./ActivateAction.ts";
import AttemptAction from "./AttemptAction.ts";
import type Fixture from "../Fixture.ts";
import type ItemInstance from "../ItemInstance.ts";
import Player from "../Player.ts";
import type Puzzle from "../Puzzle.ts";

/**
 * Represents an activate and attempt action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#activate-and-attempt-action
 */
export default class ActivateAndAttemptAction extends Action {
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
        const activateAction = new ActivateAction(this.getGame(), this.message, this.player, this.player.location, this.forced, this.whisper, this.user);
        activateAction.performActivate(fixture, false);
        const attemptAction = new AttemptAction(this.getGame(), this.message, this.player, this.player.location, this.forced, this.whisper, this.user);
        attemptAction.performAttempt(puzzle, item, password, command, input, targetPlayer);
        this.successMessage = `Successfully activated ${fixture.name} and attempted ${puzzle.name} for ${this.player?.name}.`;
    }
}
