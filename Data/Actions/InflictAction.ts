// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Duration } from "luxon";
import { MessageDisplayType } from "../../Modules/enums.ts";
import Action from "../Action.ts";
import type InventoryItem from "../InventoryItem.ts";
import type Status from "../Status.ts";
import CureAction from "./CureAction.ts";
import DisbandPartyAction from "./DisbandPartyAction.ts";
import StopAction from "./StopAction.ts";
import StopFollowingAction from "./StopFollowingAction.ts";

/**
 * Represents an inflict action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#inflict-action
 */
export default class InflictAction extends Action {
    /**
     * Performs an inflict action.
     *
     * @param status - The status to inflict.
     * @param notify - Whether or not to send the player the status's inflictedDescription. Defaults to true.
     * @param doCures - Whether or not the status's cures should actually be cured. Defaults to true.
     * @param narrate - Whether or not to send any narrations caused by the status being inflicted. Defaults to true.
     * @param item - The inventory item that caused the status to be inflicted, if applicable.
     * @param duration - A custom duration that overrides the status's default duration.
     * @param inflictedByLoading - Whether or not the status is being inflicted by loading players. If this is true, no log message will be sent, and players will not be removed from hiding spot whispers. Defaults to false.
     */
    async performInflict(status: Status, notify: boolean = true, doCures: boolean = true, narrate: boolean = true, item?: InventoryItem, duration: Duration<true> = null, inflictedByLoading: boolean = false): Promise<void> {
        if (this.performed) return;
        super.perform();
        const playerStatusIds = this.player.status.map(statusEffect => statusEffect.id);
        for (const overrider of status.overriders) {
            if (playerStatusIds.includes(overrider.id)) {
                if (this.message) this.successMessage = `Couldn't inflict status effect "${status.id}" because ${this.player.name} is already ${overrider.id}.`;
                return;
            }
        }
        if (playerStatusIds.includes(status.id)) {
            if (status.duplicatedStatus !== null) {
                const cureAction = new CureAction(this.getGame(), undefined, this.player, this.player.location, true);
                cureAction.performCure(status, false, false, false);
                const duplicatedStatusAction = new InflictAction(this.getGame(), undefined, this.player, this.player.location, true);
                await duplicatedStatusAction.performInflict(status.duplicatedStatus, true, true, true);
                if (this.message) this.successMessage = `Status was duplicated, so inflicted ${this.player.name} with ${status.duplicatedStatus.id} instead.`;
                return;
            }
            else {
                if (this.message)
                    this.getGame().communicationHandler.reply(this.message, `${this.player.name} already has status effect ${status.id}.`);
                return;
            }
        }
        if (status.cures.length > 0 && doCures) {
            for (const cure of status.cures) {
                const cureAction = new CureAction(this.getGame(), undefined, this.player, this.player.location, true);
                cureAction.performCure(cure, false, false, false);
            }
        }

        // Apply the effects of behavior attributes.
        let removeFromWhisperNarration: string;
        if (status.id === "heated")
            this.getGame().heated = true;
        if (status.behaviorAttributes.has("no channel")) {
            this.location.leaveChannel(this.player);
            const stayInHidingSpot = status.id === "hidden" && inflictedByLoading && !!this.player.hidingSpot;
            if (status.behaviorAttributes.has("hidden") && !this.player.party && !stayInHidingSpot)
                removeFromWhisperNarration = this.getGame().notificationGenerator.generateNoChannelLeaveWhisperNotification(this.player, status.id);
        }
        if (status.behaviorAttributes.has("no hearing")) {
            removeFromWhisperNarration = this.getGame().notificationGenerator.generateNoHearingLeaveWhisperNotification(this.player.displayName);
        }
        if (status.behaviorAttributes.has("concealed")) {
            const maskName = item ? item.singleContainingPhrase : "a MASK";
            this.player.displayName = `an individual wearing ${maskName}`;
            this.player.displayIcon = this.getGame().settings.defaultConcealedIconURL;
            this.player.setPronouns(this.player.pronouns, "neutral");
            this.location.setOccupantsString();
        }
        if (this.player.isMoving && (status.behaviorAttributes.has("disable all") || status.behaviorAttributes.has("disable move") || status.behaviorAttributes.has("disable run"))) {
            this.player.stopMoving();
            // If the player is in a party, stop all other members from moving as well, but keep them in a party together.
            // Only do this if the positions are synchronized, as the party is not fully formed until this occurs.
            if (this.player.party && this.player.party.positionsSynchronized) {
                const partyMembers = this.player.party.getMemberSet(this.player);
                const [firstMember] = partyMembers;
                const stopAction = new StopAction(this.getGame(), undefined, firstMember, firstMember.location, true);
                await stopAction.performStop(false, undefined, false, partyMembers);
            }
            else if (!this.player.party) {
                this.player.stopFollowing();
                await this.getGame().movementHandler.stopFollowers(this.player, false, true);
            }
        }
        if (this.player.followedPlayer &&
            (status.behaviorAttributes.has("disable follow") || status.behaviorAttributes.has("disable all") && !status.behaviorAttributes.has("enable follow"))) {
            const stopFollowingAction = new StopFollowingAction(this.getGame(), undefined, this.player, this.player.location, true);
            await stopFollowingAction.performStopFollowing(true);
        }
        if (this.player.party && this.player.party.hasLeader(this.player) &&
            (status.behaviorAttributes.has("disable lead") || status.behaviorAttributes.has("disable all") && !status.behaviorAttributes.has("enable lead"))) {
            const disbandNotification = this.getGame().notificationGenerator.generatePartyDisbandedByStatusNotification(this.player, `**${status.id}**`, true);
            const disbandAction = new DisbandPartyAction(this.getGame(), undefined, this.player, this.player.location, true);
            await disbandAction.performDisbandParty(true, "", "", disbandNotification);
        }

        this.player.inflict(status, duration);
        if (notify) {
            const inflictedDescription = status.inflictedDescription.parseFor(this.player, status);
            this.player.sendDescription(inflictedDescription, status, status.inflictedDescription.messageDisplayType ?? MessageDisplayType.STANDARD);
        }
        if (narrate) this.getGame().narrationHandler.narrateInflict(this, status, this.player);
        if (removeFromWhisperNarration) await this.player.removeFromWhispers(removeFromWhisperNarration, this);
        if (!inflictedByLoading) this.getGame().logHandler.logInflict(status, this.player);
        this.successMessage = `Successfully added status effect ${status.id} to ${this.player?.name}.`;
    }
}
