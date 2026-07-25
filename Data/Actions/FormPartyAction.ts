// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import FollowAction from "./FollowAction.ts";
import LeadAction from "./LeadAction.ts";
import type Player from "../Player.ts";
import { generateListString } from "../../Modules/helpers.ts";

/**
 * Represents a form party action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#form-party-action
 */
export default class FormPartyAction extends Action {
    /**
     * Performs a form party action.
     *
     * @param followers - The followers in the party.
     * @param leader - The leader of the party. Optional. By default, this is the player performing the action.
     */
    async performFormParty(followers: Set<Player>, leader: Player = this.player): Promise<void> {
        if (this.performed) return;
        super.perform();
        for (const follower of followers) {
            if (!follower.isFollowing(leader)) {
                const followAction = new FollowAction(this.getGame(), undefined, follower, follower.location, this.forced, this.whisper, this.user);
                await followAction.performFollow(leader);
            }
            follower.setPos(leader.pos);
        }
        const followerArray = Array.from(followers);
        const leadAction = new LeadAction(this.getGame(), undefined, leader, leader.location, this.forced, this.whisper, this.user);
        await leadAction.performLead(followerArray);

        const allFollowers = leader.party?.followers.map(follower => follower) ?? followerArray;
        const followerString = `follower${allFollowers.length !== 1 ? 's' : ''} ${generateListString(allFollowers.map(player => player.name))}`;
        this.successMessage = `Successfully formed a party with leader ${leader.name} and ${followerString}.`;
    }
}
