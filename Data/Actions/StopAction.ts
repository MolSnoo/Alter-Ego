// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { generateListString } from "../../Modules/helpers.ts";
import Action from "../Action.ts";
import type Exit from "../Exit.js";
import type Player from "../Player.ts";
import StopFollowingAction from "./StopFollowingAction.ts";

/**
 * Represents a stop action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#stop-action
 */
export default class StopAction extends Action {
    /**
     * Performs a stop action.
     *
     * @param exitLocked - Whether or not the action was initiated because the destination exit was locked. Defaults to false.
     * @param exit - The exit the player tried to move to, if applicable.
     * @param stopFollowing - Whether or not to stop following, if the player is following someone. Defaults to true.
     * @param players - A set of players to stop simultaneously. Defaults to a set containing only the player the action was created with.
     */
    async performStop(exitLocked: boolean = false, exit?: Exit, stopFollowing = true, players: Set<Player> = new Set([this.player])): Promise<void> {
        if (this.performed) return;
        super.perform();
        this.getGame().movementHandler.stopMoving(players);
        this.getGame().narrationHandler.narrateStop(this, this.player, players, exitLocked, exit, stopFollowing);
        const anyoneIsAFollower = players.values().some(player => !!player.followedPlayer);
        if (stopFollowing && anyoneIsAFollower) {
            const stopFollowingAction = new StopFollowingAction(this.getGame(), undefined, this.player, this.player.location, this.forced);
            await stopFollowingAction.performStopFollowing(false, players);
        }

        // If anyone is following this player, they need to stop moving.
        await this.getGame().movementHandler.stopFollowers(this.player, false, this.forced);

        const playerList = generateListString(Array.from(players).map(player => player.name));
        const addendum = stopFollowing && anyoneIsAFollower ? ` moving and following` : ``;
        this.successMessage = `Successfully made ${playerList} stop${addendum}.`;
    }
}
