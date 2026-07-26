// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import type HidingSpot from "../HidingSpot.ts";
import CureAction from "./CureAction.ts";
import { generateListString } from "../../Modules/helpers.ts";
import type Fixture from "../Fixture.ts";

/**
 * Represents an emerge action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#emerge-action
 */
export default class EmergeAction extends Action {
    /**
     * Performs an emerge action.
     *
     * @param hidingSpot - The hiding spot to emerge from. If one is not specified, it will be searched for.
     */
    async performEmerge(hidingSpot?: HidingSpot): Promise<void> {
        if (this.performed) return;
        super.perform();

        const party = this.player.party;
        const players = party ? party.getMemberSet() : new Set([this.player]);

        if (!hidingSpot) {
            const hidingSpotFixture = this.getGame().entityFinder.getFixture(this.player.hidingSpot, this.player.location.id);
            if (hidingSpotFixture && players.values().every(player => player.hidingSpot === hidingSpotFixture.name))
                hidingSpot = hidingSpotFixture.hidingSpot;
        }

        this.getGame().narrationHandler.narrateEmerge(this, hidingSpot, this.player, players);
        if (hidingSpot)
            await hidingSpot.removePlayers(players, this);
        else {
            for (const player of players) {
                const whisperNarration = this.getGame().notificationGenerator.generateEmergeNotification(player, new Set([player]), false, "hiding");
                await player.removeFromWhispers(whisperNarration, this, false);
                player.hidingSpot = "";
            }
        }
        const hiddenStatus = this.getGame().entityFinder.getStatusEffect("hidden");
        for (const player of players) {
            const cureAction = new CureAction(this.getGame(), undefined, player, player.location, true);
            cureAction.performCure(hiddenStatus, true, false, true);
        }
        this.location?.setOccupantsString();

        const emergingPlayerList = generateListString(Array.from(players).map(player => player.name));
        this.getGame().logHandler.logEmerge(hidingSpot, this.player, emergingPlayerList, this.forced);
        this.successMessage = `Successfully brought ${emergingPlayerList} out of hiding.`;
    }

    /**
     * Finds the required Fixture to call performEmerge.
     * 
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [Fixture] {
        return [this.getGame().entityFinder.getFixture(args[0], args[1])];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performEmerge.
     * 
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [Fixture]): [HidingSpot] {
        const errorMessageGenerator = this.getGame().errorMessageGenerator;
        if (!this.player.isHidden())
            throw new Error(errorMessageGenerator.generateNotHiddenError());
        if (args.length !== 1)
            throw new Error(errorMessageGenerator.generateInsufficientArgumentsError());
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("hide");
        if (disabledStatusEffects.length > 0)
            throw new Error(errorMessageGenerator.generateCommandDisabledError(disabledStatusEffects[0]));
        if (this.player.party && !this.player.party.positionsSynchronized)
            throw new Error(errorMessageGenerator.generatePartyNotSynchronizedError());
        if (!args[0] || args[0].getEntityType() !== "Fixture")
            throw new Error(errorMessageGenerator.generateInvalidEntityError("Fixture"));
        if ((args[0].childPuzzle !== null && args[0].childPuzzle.type.endsWith("lock") && !args[0].childPuzzle.solved) || !args[0].accessible)
            throw new Error(errorMessageGenerator.generateFixtureLockedError(args[0]));
        if (args[0].getLocation().id !== this.player.location.id)
            throw new Error(errorMessageGenerator.generatePlayerLocationMismatchError());
        if (this.player.hidingSpot !== args[0].name)
            throw new Error(errorMessageGenerator.generatePlayerHidingSpotMismatchError());
        if (!args[0].hidingSpot)
            throw new Error(errorMessageGenerator.generateFixtureNotHidingSpotError(args[0]));
        return [args[0].hidingSpot];
    }
}
