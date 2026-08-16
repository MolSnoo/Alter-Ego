// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import type Fixture from "../Fixture.ts";
import type Interactable from "../../Classes/Interactables/Interactable.ts";

/**
 * Represents a deactivate action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#deactivate-action
 */
export default class DeactivateAction extends Action {
    /**
     * Performs a deactivate action.
     *
     * @param fixture - The fixture to deactivate.
     * @param narrate - Whether or not to narrate the fixture's deactivation.
     * @param customNarration - The custom text of the narration. Optional.
     */
    performDeactivate(fixture: Fixture, narrate: boolean, customNarration?: string): void {
        if (this.performed) return;
        super.perform();
        const player = this.player && this.player.location.id === fixture.location.id && this.player.isConscious() && !this.player.isHidden() ? this.player : undefined;
        const interactables = player ? this.#getInteractables(fixture) : [];
        if (narrate)
            this.getGame().narrationHandler.narrateDeactivate(this, fixture, player, customNarration, interactables);
        this.getGame().logHandler.logDeactivate(fixture, player, this.forced);
        fixture.deactivate();
        this.successMessage = `Successfully deactivated ${fixture.name} at ${fixture.location.getEntityID()}${this.player ? ` for ${this.player.name}` : ``}.`;
    }

    #getInteractables(fixture: Fixture): Interactable[] {
        let interactables: Interactable[] = [];
        const interactableManager = this.getGame().clientContext.interactableManager;
        if (this.player) interactables = interactables.concat(interactableManager.createInspectActionInteractable([fixture], this.player, this.user));
        interactables = interactables.concat(interactableManager.getActivateOrDeactivateInteractables(fixture, this.player, false, this.user));
        return interactables;
    }

    /**
     * Finds the required fixture to call performDeactivate.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [Fixture, boolean] {
        const fixture = this.getGame().entityFinder.getFixture(args[0], args[1]);
        const narrate = args[2].toLowerCase() === 'true';
        return [fixture, narrate];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performDeactivate.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [Fixture, boolean]): [Fixture, boolean] {
        const errorMessageGenerator = this.getGame().errorMessageGenerator;
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("use");
        if (disabledStatusEffects.length > 0)
            throw new Error(errorMessageGenerator.generateCommandDisabledError(disabledStatusEffects[0]));
        if (args.length !== 2) throw new Error(errorMessageGenerator.generateInsufficientArgumentsError());
        if (!args[0] || !args[0]?.accessible) throw new Error(errorMessageGenerator.generateInvalidEntityError("Fixture"));
        if (args[0].location.id !== this.player.location.id) throw new Error(errorMessageGenerator.generatePlayerLocationMismatchError());
        if (this.player.isHidden() && this.player.hidingSpot !== args[0].name)
            throw new Error(errorMessageGenerator.generateCommandDisabledError(this.player.getBehaviorAttributeStatusEffects("hidden")[0]));
        const context = this.forced ? "Moderator" : "Player";
        if (args[0].recipeTag === "" || !this.forced && !args[0].activatable)
            throw new Error(errorMessageGenerator.generateFixtureNotActivatableError(args[0], context));
        if (!args[0].activated) throw new Error(errorMessageGenerator.generateFixtureAlreadyInActivationStateError(args[0], context));
        return [args[0], args[1]];
    }
}
