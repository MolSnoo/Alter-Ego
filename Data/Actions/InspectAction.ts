// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import Description from "../Description.ts";
import Fixture from "../Fixture.ts";
import InventoryItem from "../InventoryItem.ts";
import Player from "../Player.ts";
import RoomItem from "../RoomItem.ts";

/**
 * Represents an inspect action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#inspect-action
 */
export default class InspectAction extends Action {
    /**
     * Performs an inspect action.
     *
     * @param target - The entity to inspect.
     */
    performInspect(target: Inspectable): void {
        if (this.performed) return;
        super.perform();
        this.getGame().narrationHandler.narrateInspect(this, target, this.player);
        let description = target.description;
        // If the player is inspecting an inventory item that belongs to another player, remove the contents of all il tags before parsing it.
        if (target instanceof InventoryItem && target.player.name !== this.player.name)
            description = new Description(description.text.replace(/(<(il)(\s[^>]+?)*>)[\s\S]+?(<\/\2>)/g, "$1$4"), target, this.getGame());

        description.parseAndSendTo(this.player);
        this.getGame().logHandler.logInspect(target, this.player, this.forced);
        if (target instanceof RoomItem || target instanceof InventoryItem && target.container) {
            const slotPhrase = target.container instanceof RoomItem || target.container instanceof InventoryItem ? `${target.slot} of ` : ``;
            const ownerPhrase = target instanceof InventoryItem ? `${target.player.name}'s ` : ``;
            this.successMessage = `Successfully inspected ${ownerPhrase}${target.getEntityID()} ${target.container.getPreposition()} ${slotPhrase}${target.getContainer().getEntityID()} for ${this.player.name}.`;
        }
        else if (target instanceof InventoryItem)
            this.successMessage = `Successfully inspected ${target.player.name}'s ${target.getIdentifier()} for ${this.player.name}.`
        else
            this.successMessage = `Successfully inspected ${target.getEntityID()} for ${this.player.name}.`;
    }

    /**
     * Finds the required room item to call performInspect.
     *
     * @param args - The args as strings.
     */
    parseInteractionArgs(args: string[]): [string, Inspectable] {
        let target: Inspectable;
        switch (args[0]) {
            case 'F':
                target = this.getGame().entityFinder.getFixture(args[1], args[2]);
                break;
            case 'II':
                target = this.getGame().entityFinder.getInventoryItem(args[1], args[2], args[3], args[4], args[5]);
                break;
            case 'P':
                target = this.getGame().entityFinder.getLivingPlayer(args[1]);
                break;
            case 'R':
                target = this.getGame().entityFinder.getRoom(args[1]);
                break;
            case 'RI':
                target = this.getGame().entityFinder.getRoomItem(args[1], args[2], args[3], args[4], args[5]);
                break;
        }
        return [args[0], target];
    }

    /**
     * Validates the parsed args. The results can be passed directly into performInspect.
     *
     * @param args - The args after being parsed.
     */
    validateInteractionArgs(args: [string, Inspectable]): [Inspectable] {
        const errorMessageGenerator = this.getGame().errorMessageGenerator;
        if (args.length !== 2) throw new Error(errorMessageGenerator.generateInsufficientArgumentsError());
        const disabledStatusEffects = this.player.getStatusEffectsDisablingCommand("inspect");
        if (disabledStatusEffects.length > 0)
            throw new Error(errorMessageGenerator.generateCommandDisabledError(disabledStatusEffects[0]));
        const entityType = args[0] === 'F'
            ? "Fixture"
            : args[0] === 'II'
                ? "InventoryItem"
                : args[0] === 'P'
                    ? "Player"
                    : args[0] === 'RI'
                        ? "RoomItem"
                        : "Room";
        if (!args[1])
            throw new Error(errorMessageGenerator.generateInvalidEntityError(entityType));
        if (args[0] === 'F' && args[1] instanceof Fixture && !args[1]?.accessible)
            throw new Error(errorMessageGenerator.generateEntityNotFoundError("fixture", args[1].name));
        if (args[0] === 'RI' && args[1] instanceof RoomItem && (!args[1]?.accessible || args[1].quantity === 0))
            throw new Error(errorMessageGenerator.generateEntityNotFoundError("room item", args[1].name));
        if (!args[1].getLocation() || args[1].getLocation().id !== this.player.location.id)
            throw new Error(errorMessageGenerator.generatePlayerLocationMismatchError());
        const target = args[1];
        const hiddenStatusEffects = this.player.getBehaviorAttributeStatusEffects("hidden");
        if (hiddenStatusEffects.length > 0) {
            if (target instanceof Fixture && this.player.hidingSpot !== target.name)
                throw new Error(errorMessageGenerator.generateCommandDisabledError(hiddenStatusEffects[0]));
            if (target instanceof RoomItem) {
                let topContainer = target.getTopContainer();
                if (!(topContainer instanceof Fixture))
                    topContainer = topContainer.parentFixture;
                if (this.player.hidingSpot !== topContainer.name)
                    throw new Error(errorMessageGenerator.generateCommandDisabledError(hiddenStatusEffects[0]));
            }
            if (target instanceof Player && !this.player.isHiddenWith(target))
                throw new Error(errorMessageGenerator.generateCommandDisabledError(hiddenStatusEffects[0]));
        }
        return [target];
    }
}
