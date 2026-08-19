// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import AttemptAction from "./AttemptAction.ts";
import DeactivateAction from "./DeactivateAction.ts";
import type Fixture from "../Fixture.ts";
import type ItemInstance from "../ItemInstance.ts";
import Player from "../Player.ts";
import type Puzzle from "../Puzzle.ts";

/**
 * Represents a deactivate and attempt action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#deactivate-and-attempt-action
 */
export default class DeactivateAndAttemptAction extends Action {
    /**
     * Performs a deactivate and attempt action.
     *
     * @param fixture - The fixture to deactivate.
     * @param puzzle - The puzzle to attempt.
     * @param item - The item instance required to attempt the puzzle.
     * @param password - The password the player entered to attempt the puzzle.
     * @param command - The command alias that was used to attempt the puzzle.
     * @param input - The combined arguments of the command.
     * @param targetPlayer - The player who will be treated as the initiating player in subsequent bot command executions called by the puzzle's solved commands, if applicable.
     */
    performDeactivateAndAttempt(fixture: Fixture, puzzle: Puzzle, item: ItemInstance, password: string, command: string, input: string, targetPlayer?: Player): void {
        if (this.performed) return;
        super.perform();
        const deactivateAction = new DeactivateAction(this.getGame(), this.message, this.player, this.player.location, this.forced, this.whisper, this.user);
        deactivateAction.performDeactivate(fixture, false);
        const attemptAction = new AttemptAction(this.getGame(), this.message, this.player, this.player.location, this.forced, this.whisper, this.user);
        attemptAction.performAttempt(puzzle, item, password, command, input, targetPlayer);
        this.successMessage = `Successfully deactivated ${fixture.name} and attempted ${puzzle.name} for ${this.player?.name}.`;
    }
}
