// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";
import type Player from "../Player.ts";
import QueueMoveAction from "./QueueMoveAction.ts";
import StopFollowingAction from "./StopFollowingAction.ts";

/**
 * Represents a follow action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#follow-action
 */
export default class FollowAction extends Action {
    /**
     * Performs a follow action.
     *
     * @param player - The player to follow.
     */
    async performFollow(player: Player): Promise<void> {
        if (this.performed) return;
        super.perform();
        this.player.stopMoving();
        if (this.player.followedPlayer) {
            const stopFollowingAction = new StopFollowingAction(this.getGame(), this.message, this.player, this.location, this.forced, this.whisper, this.user);
            await stopFollowingAction.performStopFollowing(false);
        }
        this.player.startFollowing(player);
        const followerInteractables = this.#getFollowerInteractables();
        const leaderInteractables = this.#getLeaderInteractables(player);
        this.getGame().narrationHandler.narrateFollow(this, this.player, player, followerInteractables, leaderInteractables);
        this.getGame().logHandler.logFollow(this.player, player, this.forced);
        if (player.isMoving) {
            this.player.moveQueue = [player.moveQueue[0]];
            const queueMoveAction = new QueueMoveAction(this.getGame(), undefined, this.player, this.player.location, this.forced);
            await queueMoveAction.performQueueMove(player.isRunning, this.player.moveQueue[0], this.player.getFollowingSpeed());
        }
        this.successMessage = `Successfully made ${this.player.name} begin following ${player.name}.`;
    }

    /**
     * Gets an array of interactables to send to the player performing the action.
     */
    #getFollowerInteractables(): Interactable[] {
        let interactables = this.getGame().clientContext.interactableManager.getViewPartyInteractables(this.player);
        return interactables;
    }

    /**
     * Gets an array of interactables to send to the given player.
     * @param leader - The player to send the interactables to.
     */
    #getLeaderInteractables(leader: Player): Interactable[] {
        let interactables = this.getGame().clientContext.interactableManager.getLeadInteractables(this.player, leader);
        interactables = interactables.concat(this.getGame().clientContext.interactableManager.getViewPartyInteractables(leader));
        return interactables;
    }

    /**
     * Finds the required player to call performFollow.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [Player] {
        const player = this.getGame().entityFinder.getLivingPlayer(args[0]);
        return [player];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performFollow.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [Player]): [Player] {
        const errorMessageGenerator = this.getGame().errorMessageGenerator;
        if (args.length !== 1) throw new Error(errorMessageGenerator.generateInsufficientArgumentsError());
        if (!args[0] || args[0].getEntityType() !== "Player") throw new Error(errorMessageGenerator.generateInvalidEntityError("Player"));
        const leader = args[0];
        if (leader.location?.id !== this.player.location.id) throw new Error(errorMessageGenerator.generatePlayerLocationMismatchError());
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("follow");
        if (disabledStatusEffects.length > 0)
            throw new Error(errorMessageGenerator.generateCommandDisabledError(disabledStatusEffects[0]));
        const hiddenStatusEffects = this.player.getBehaviorAttributeStatusEffects("hidden");
        if (hiddenStatusEffects.length > 0 && !this.player.isHiddenWith(leader))
            throw new Error(errorMessageGenerator.generateCommandDisabledError(hiddenStatusEffects[0]));
        const context = this.forced ? "Moderator" : "Player";
        if (this.player.speed <= 0) throw new Error(errorMessageGenerator.generateCannotMoveWithNoSpeedError(this.player, context));
        if (this.player.isMoving) throw new Error(errorMessageGenerator.generateAlreadyMovingError());
        if (this.player.isFollowing(leader)) throw new Error(errorMessageGenerator.generateAlreadyFollowingPlayerError(this.player, context));
        if (this.player.followedPlayer) throw new Error(errorMessageGenerator.generateCannotFollowWhenAlreadyFollowingError(this.player, context));
        if (leader?.name === this.player.name) throw new Error(errorMessageGenerator.generateCannotSelectSelfError(this.player, context, "follow"));
        if (leader.isFollowing(this.player)) throw new Error(errorMessageGenerator.generateCannotFollowFollowerError(this.player, context, leader));
        if (this.player.wouldCreateFollowingLoop(leader)) throw new Error(errorMessageGenerator.generateFollowingWouldCauseInfiniteLoopError(this.player, context, leader));
        return [leader];
    }
}
