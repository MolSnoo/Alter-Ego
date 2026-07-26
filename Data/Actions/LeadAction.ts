// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import Game from "../Game.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";
import type Player from "../Player.ts";
import type Party from "../Party.ts";
import StopAction from "./StopAction.ts";
import { generateListString } from "../../Modules/helpers.ts";

/**
 * Represents a lead action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#lead-action
 */
export default class LeadAction extends Action {
    /**
     * Performs a lead action.
     *
     * @param followers - The players to lead.
     */
    async performLead(followers: Player[]): Promise<void> {
        if (this.performed) return;
        super.perform();

        // If the leader is already in a party, get their party.
        let party: Party;
        let partyAlreadyExists = false;
        if (this.player.party) {
            party = this.player.party;
            partyAlreadyExists = true;
        }
        // Otherwise, form a new party.
        else party = await this.getGame().entityLoader.createParty(this.player, followers);

        if (this.player.isMoving) {
            const stopAction = new StopAction(this.getGame(), undefined, this.player, this.player.location, this.forced);
            await stopAction.performStop(false, undefined, false);
        }

        const newFollowers: Player[] = [];
        for (const follower of followers) {
            this.player.startLeading(follower);
            if (partyAlreadyExists && !party.hasFollower(follower)) newFollowers.push(follower);
        }
        // If the party already exists, add only the followers who weren't already in it.
        if (partyAlreadyExists && newFollowers.length > 0)
            await party.addFollowers(newFollowers);
        if (!partyAlreadyExists || newFollowers.length === 0) newFollowers.push(...followers);

        // Parties need to have perfectly synchronized positions.
        // If any followers' positions differ from the leader's, start moving them toward the leader.
        let misalignedFollowers = party.getMisalignedFollowers();
        let considerPartySynchronized = misalignedFollowers.length === 0;
        // A map of move times for misaligned followers, where the key is the follower's name.
        // We use this to store the calculated time so we can start moving them after sending the narration.
        const playerMoveTimes: Map<string, number> = new Map();
        // Keep track of the longest travel time.
        let maxTime = 0;
        if (!considerPartySynchronized) {
            // This will prevent the party from moving until all positions are synchronized.
            party.positionsSynchronized = false;

            for (const follower of misalignedFollowers) {
                const rate = follower.calculateMoveRate(false);
                const time = this.getGame().movementHandler.calculateMoveTime(rate, follower, this.player);
                if (time > maxTime) maxTime = time;
                playerMoveTimes.set(follower.name, time);
            }
            // If it only takes a second or less for the party to synchronize, consider it already synchronized for the narration.
            if (maxTime <= 1000) considerPartySynchronized = true;
        }

        // Send the narration before moving any players.
        const leaderInteractables = this.#getLeaderInteractables();
        const followerInteractables = this.#getFollowerInteractables(newFollowers);
        this.getGame().narrationHandler.narrateLead(this, this.player, newFollowers, considerPartySynchronized, leaderInteractables, followerInteractables);

        if (misalignedFollowers.length !== 0) {
            // Create a dummy action to narrate the alignment of all players.
            const dummyAction = new LeadAction(this.getGame(), undefined, this.player, this.location, this.forced);
            for (const follower of misalignedFollowers) {
                const time = playerMoveTimes.get(follower.name);
                this.getGame().movementHandler.movePlayers(new Set([follower]), false, this.player, time, dummyAction);
            }
            // This is a fallback in case any members of the party didn't make it to the leader
            // for some reason other than being inflicted with the weary status.
            // Mark all positions as synchronized after all followers have reached the leader.
            this.player.doAfterDelay(maxTime + Game.tick, async () => {
                misalignedFollowers = party.getMisalignedFollowers();
                if (misalignedFollowers.length > 0) {
                    const misalignedFollowersString = generateListString(misalignedFollowers.map(follower => party.getMemberDisplayName(follower) ?? follower.displayName));
                    const removalMessage = this.getGame().notificationGenerator.generateLedPlayerCouldNotSynchronizeNotification(
                        misalignedFollowersString,
                        party.getMemberDisplayName(party.leader)
                    );
                    await this.player.party.removeFollowers(misalignedFollowers, this, removalMessage);
                }
                this.player.party.positionsSynchronized = true;
                if (!considerPartySynchronized)
                    this.getGame().narrationHandler.narratePartyReady(dummyAction, this.player);
            });
        }

        const followerList = generateListString(followers.map(player => player.name));
        this.getGame().logHandler.logLead(this.player, followerList, this.forced);

        this.successMessage = `Successfully made ${this.player.name} begin leading ${followerList}.`;
    }

    /**
     * Gets an array of interactables to send to the player performing the action.
     */
    #getLeaderInteractables(): Interactable[] {
        let interactables = this.getGame().clientContext.interactableManager.getViewPartyInteractables(this.player);
        return interactables;
    }

    /**
     * Gets an array of interactables to send to each follower.
     * @param followers - The followers to send interactables to.
     * @returns A map of arrays of interactables, where the key for each entry is the name of the player to send them to.
     */
    #getFollowerInteractables(followers: Player[]): Map<string, Interactable[]> {
        let interactables: Map<string, Interactable[]> = new Map();
        for (const follower of followers) {
            let followerInteractables = this.getGame().clientContext.interactableManager.getViewPartyInteractables(follower);
            interactables.set(follower.name, followerInteractables);
        }
        return interactables;
    }

    /**
     * Finds the required player to call performLead.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [Player] {
        const player = this.getGame().entityFinder.getLivingPlayer(args[0]);
        return [player];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performLead.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [Player]): [Player[]] {
        const errorMessageGenerator = this.getGame().errorMessageGenerator;
        if (args.length !== 1) throw new Error(errorMessageGenerator.generateInsufficientArgumentsError());
        if (!args[0] || args[0].getEntityType() !== "Player") throw new Error(errorMessageGenerator.generateInvalidEntityError("Player"));
        const follower = args[0];
        if (follower.location?.id !== this.player.location.id) throw new Error(errorMessageGenerator.generatePlayerLocationMismatchError());
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("lead");
        if (disabledStatusEffects.length > 0)
            throw new Error(errorMessageGenerator.generateCommandDisabledError(disabledStatusEffects[0]));
        const hiddenStatusEffects = this.player.getBehaviorAttributeStatusEffects("hidden");
        if (hiddenStatusEffects.length > 0 && !this.player.isHiddenWith(follower))
            throw new Error(errorMessageGenerator.generateCommandDisabledError(hiddenStatusEffects[0]));
        const context = this.forced ? "Moderator" : "Player";
        if (this.player.followedPlayer) throw new Error(errorMessageGenerator.generateCannotLeadWhileFollowingError(this.player, context));
        if (follower?.name === this.player.name) throw new Error(errorMessageGenerator.generateCannotSelectSelfError(this.player, context, "lead"));
        if (!follower.isFollowing(this.player)) throw new Error(errorMessageGenerator.generateCannotSelectNonFollowerError(this.player, follower, context, "lead"));
        if (follower.ledPlayers.length !== 0) throw new Error(errorMessageGenerator.generateCannotLeadLeaderError(this.player, follower, context));
        if (this.player.isLeading(follower)) throw new Error(errorMessageGenerator.generateNoNewLedPlayersError(this.player, context));
        return [[follower]];
    }
}
