// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { capitalizeFirstLetter, generateListString, makeCopyable } from "../Modules/helpers.ts";
import type Fixture from "../Data/Fixture.ts";
import type Game from "../Data/Game.ts";
import type GameSettings from "./GameSettings.ts";
import InventoryItem from "../Data/InventoryItem.ts";
import type InventorySlot from "../Data/InventorySlot.ts";
import type ItemInstance from "../Data/ItemInstance.ts";
import type Player from "../Data/Player.ts";
import Prefab from "../Data/Prefab.ts";
import type Status from "../Data/Status.ts";

type UserContext = "Player"|"Moderator"|"Bot"|"Eligible";

/**
 * A set of functions to generate error messages to send to users.
 */
export default class GameErrorMessageGenerator {
    /**
     * The game this belongs to.
     */
    readonly #game: Game;
    private youCannotString = `You cannot do that because you are`;

    /**
     * @param game - The game this belongs to.
     */
    constructor(game: Game) {
        this.#game = game;
    }

    /**
     * Generates a string containing the name of a command in a copyable string with the command prefix character.
     * @param commandName - The name of the command.
     */
    private getCommandString(commandName: string) {
        return makeCopyable(`${this.#game.settings.commandPrefix}${commandName}`);
    }

    /**
     * If the player's pronouns are plural, returns "are". If the player's pronouns are singular, returns "is".
     * @param player - The player whose pronouns determine the verb.
     * @param context - The context in which the command is being issued. If the context is "Moderator" or "Bot", the player's original pronouns will be used.
     */
    private isOrAre(player: Player, context: UserContext) {
        const pronouns = context === "Moderator" || context === "Bot" ? player.originalPronouns : player.pronouns;
        return pronouns?.plural ? "are" : "is";
    }

    /**
     * Generates an error message indicating an insufficient number of arguments was provided.
     */
    generateInsufficientArgumentsError() {
        return `Insufficient arguments.`;
    }

    /**
     * Generates an error message indicating that the provided game entity was invalid.
     * @param entity - The type of entity that was invalid.
     */
    generateInvalidEntityError(entity: PersistentGameEntityName | "ItemContainer") {
        return `Invalid ${entity}.`;
    }

    /**
     * Generates an error message indicating that the user needs to specify the given requirements.
     * Also includes the usage for the command.
     * @param requiredSpecification - A string indicating what the user needs to specify.
     */
    generateSpecifyError(requiredSpecification: string) {
        return `You need to specify ${requiredSpecification}.`;
    }

    /**
     * Generates an error message indicating that the user needs to specify the given requirements.
     * Also outputs the usage for a command.
     * @param requiredSpecification - A string indicating what the user needs to specify.
     * @param usageFunction - A function to generate the usage string.
     */
    generateSpecifyErrorWithUsage(requiredSpecification: string, usageFunction: (settings: GameSettings) => string) {
        return this.generateSpecifyError(requiredSpecification) + ` Usage:\n${usageFunction(this.#game.settings)}`;
    }

    /**
     * Generates an error message indicating a command is disabled by a status effect.
     * @param status - The status effect the command is disabled by.
     */
    generateCommandDisabledError(status: Status) {
        return `${this.youCannotString} **${status.id}**.`;
    }

    /**
     * Generates an error message indicating that an entity couldn't be found.
     * @param entityType - The type of entity that couldn't be found.
     * @param entityName - The name of the entity that couldn't be found.
     */
    generateEntityNotFoundError(entityType: string, entityName: string) {
        return `Couldn't find ${entityType} "${entityName}".`;
    }

    /**
     * Generates an error message indicating that the listed players couldn't be found.
     * @param playerNames - A list of player names.
     */
    generatePlayersNotFoundError(playerNames: string[]) {
        return `Couldn't find player${playerNames.length !== 1 ? `s` : ``}: ${playerNames.join(", ")}.`;
    }

    /**
     * Generates an error message indicating that the player couldn't be found in the room.
     * @param playerName - The name of a player.
     */
    generatePlayerNotFoundInRoomError(playerName: string) {
        return `Couldn't find player "${playerName}" in the room with you. Make sure you spelled it right.`;
    }

    /**
     * Generates an error message indicating that the given property cannot be displayed for more than one player at a time.
     * @param property - The property that cannot be displayed.
     */
    generateCannotDisplayMoreThanOnePlayerPropertyError(property: string) {
        return `Cannot display ${property} of more than one player at a time.`;
    }

    /**
     * Generates an error message indicating that the player cannot select themself.
     * @param player - The player who cannot select themself.
     * @param context - The context in which the command is being issued.
     * @param verb - The verb to use. Defaults to "select".
     */
    generateCannotSelectSelfError(player: Player, context: UserContext, verb: string = "select") {
        switch (context) {
            case "Player":
                return `You cannot ${verb} yourself.`;
            default:
                return `${player.name} cannot ${verb} ${player.originalPronouns.ref}.`;
        }
    }

    /**
     * Generates an error message indicating that the players are not in the same room.
     * @param players - A list of players.
     */
    generatePlayersNotInSameRoomError(players: Player[]) {
        const playerNames = players.map(player => player.name);
        return `${generateListString(playerNames)} are not in the same room.`;
    }

    /**
     * Generates an error message indicating that the player is not hidden.
     */
    generateNotHiddenError() {
        return `You are not currently hidden.`;
    }

    /**
     * Generates an error message indicating that the player is not synchronized with their party.
     */
    generatePartyNotSynchronizedError() {
        return `You cannot do that because your party is not ready.`;
    }

    /**
     * Generates an error message indicating that the fixture is locked.
     */
    generateFixtureLockedError(fixture: Fixture) {
        return `You cannot do that because ${fixture.getContainingPhrase()} is locked.`;
    }

    /**
     * Generates an error message indicating that the fixture is not a hiding spot.
     */
    generateFixtureNotHidingSpotError(fixture: Fixture) {
        return `You cannot do that because ${fixture.getContainingPhrase()} is not a hiding spot.`;
    }

    /**
     * Generates an error message indicating that the player cannot perform an action because their hiding spot has changed.
     */
    generatePlayerHidingSpotMismatchError() {
        return `${this.youCannotString} no longer in that hiding spot.`;
    }

    /**
     * Generates an error message indicating that the player is not the party leader.
     * @param player - The player who is not the party leader.
     * @param context - The context in which the command is being issued.
     * @param includeLeavePartyDirections - Whether or not to give the player directions on how to leave the party. Only works if context is "Player".
     */
    generateAlreadyHiddenError() {
        return `${this.youCannotString} already hidden. If you want to emerge from your hiding spot, use ${this.getCommandString(`emerge`)}.`;
    }

    /**
     * Generates an error message indicating that the player cannot move because their speed is 0.
     * @param player - The player being addressed.
     * @param context - The context in which the command is being issued.
     */
    generateCannotMoveWithNoSpeedError(player: Player, context: UserContext) {
        switch(context) {
            case "Player":
                return `You cannot do that because your speed is 0.`;
            default:
                return `${player.name} cannot do that because ${player.originalPronouns.dpos} speed is 0.`;
        }
    }

    /**
     * Generates an error message indicating that the player cannot move because they are already moving.
     */
    generateAlreadyMovingError() {
        return `${this.youCannotString} already moving.`;
    }

    /**
     * Generates an error message indicating that the player cannot move because they are currently following someone.
     * @param player - The player being addressed.
     */
    generateCannotMoveAlreadyFollowingPlayerError(player: Player) {
        return `${this.youCannotString} following ${player.followedPlayerDisplayName}. `
            + `If you want to move of your own accord again, use ${this.getCommandString(`stop`)} first.`;
    }

    /**
     * Generates an error message indicating that the player cannot perform an action because their location has changed.
     */
    generatePlayerLocationMismatchError() {
        return `${this.youCannotString} no longer in that room.`;
    }

    /**
     * Generates an error message indicating that the player's party cannot move because they have immovable party members, and lists those members.
     * @param player - The player being addressed.
     * @param isRunning - Whether or not the player is trying to run. This affects the wording of the message.
     * @param context - The context in which the command is being issued.
     */
    generatePartyCannotMoveError(player: Player, isRunning: boolean, context: UserContext) {
        const moveVerb = isRunning ? "run" : "move";
        const immovablePlayers = player.party ? player.party.getImmovablePlayers(isRunning) : [];
        let immovablePlayerNames: string[] = [];
        let preventedString: string;
        if (context === "Player") {
            immovablePlayerNames = immovablePlayers.filter(immovablePlayer => immovablePlayer.name !== player.name)
                .map(immovablePlayer => player.party ? player.party.getMemberDisplayName(immovablePlayer) : immovablePlayer.displayName);
            if (immovablePlayers.includes(player)) immovablePlayerNames.push("you");
            preventedString = `${this.youCannotString}`;
        }
        else {
            immovablePlayerNames = immovablePlayers.map(immovablePlayer => immovablePlayer.name);
            preventedString = `${player.name} cannot do that because ${player.originalPronouns.sbj} ${this.isOrAre(player, context)}`;
        }
        const immovablePlayersString = generateListString(immovablePlayerNames);
        return `${preventedString} in a party and ${immovablePlayersString} ${immovablePlayerNames.length === 1 ? "is" : "are"} unable to ${moveVerb}.`;
    }

    /**
     * Generates an error message indicating that an exit name cannot be used if listed players are not in the same room.
     */
    generateCannotUseExitOnPlayersInDifferentRoomsError() {
        return "All listed players must be in the same room to use an exit name.";
    }

    /**
     * Generates an error message indicating that the player cannot follow because they are already following someone.
     * @param player - The player who cannot follow.
     * @param context - The context in which the command is being issued.
     */
    generateCannotFollowWhenAlreadyFollowingError(player: Player, context: UserContext) {
        switch (context) {
            case "Player":
                return `${this.youCannotString} already following ${player.followedPlayerDisplayName}. `
                    + `If you want to follow someone else, use ${this.getCommandString(`stop`)} first.`;
            default:
                return `${player.name} is already following ${player.followedPlayer?.name}.`;
        }
    }

    /**
     * Generates an error message indicating that the player is already following the player they want to follow.
     * @param player - The player who cannot follow.
     * @param context - The context in which the command is being issued.
     */
    generateAlreadyFollowingPlayerError(player: Player, context: UserContext) {
        switch (context) {
            case "Player":
                return `You are already following ${player.followedPlayerDisplayName}.`;
            default:
                return `${player.name} is already following ${player.followedPlayer?.name}.`;
        }
    }

    /**
     * Generates an error message indicating that the player cannot follow a player who is already following them.
     * @param player - The player who cannot follow.
     * @param context - The context in which the command is being issued.
     * @param followedPlayer - The player who cannot be followed. Defaults to the player's followed player.
     */
    generateCannotFollowFollowerError(player: Player, context: UserContext, followedPlayer = player.followedPlayer) {
        switch (context) {
            case "Player":
                return `You cannot follow ${followedPlayer?.displayName} because ${followedPlayer?.pronouns?.sbj} ${this.isOrAre(followedPlayer, context)} already following you.`;
            default:
                return `${player.name} cannot follow ${followedPlayer?.name} because ${followedPlayer?.originalPronouns.sbj} ${this.isOrAre(followedPlayer, context)} already following ${player.originalPronouns.obj}.`;
        }
    }

    /**
     * Generates an error message indicating that the player cannot follow a player because doing so would create an infinite loop.
     * @param player - The player who cannot follow.
     * @param context - The context in which the command is being issued.
     * @param followedPlayer - The player who cannot be followed. Defaults to the player's followed player.
     */
    generateFollowingWouldCauseInfiniteLoopError(player: Player, context: UserContext, followedPlayer = player.followedPlayer) {
        switch (context) {
            case "Player":
                return `You cannot follow ${followedPlayer?.displayName} because doing so would create an infinite loop.`;
            default:
                return `${player.name} cannot follow ${followedPlayer?.name} because doing so would create an infinite loop.`;
        }
    }

    /**
     * Generates an error message indicating that the player cannot lead because they are currently following someone.
     * @param player - The player who cannot lead.
     * @param context - The context in which the command is being issued.
     */
    generateCannotLeadWhileFollowingError(player: Player, context: UserContext) {
        switch (context) {
            case "Player":
                return `${this.youCannotString} following ${player.followedPlayerDisplayName}. `
                    + `If you want to lead someone, use ${this.getCommandString(`stop`)} first.`;
            default:
                return `${player.name} cannot lead because ${player.originalPronouns.sbj} ${this.isOrAre(player, context)} following ${player.followedPlayer?.name}.`;
        }
    }

    /**
     * Generates an error message indicating that the player cannot lead a player who is not their follower.
     * @param player - The player who cannot lead.
     * @param follower - The player who cannot be led.
     * @param context - The context in which the command is being issued.
     * @param verb - The verb to use. Defaults to "select".
     */
    generateCannotSelectNonFollowerError(player: Player, follower: Player, context: UserContext, verb: string) {
        switch (context) {
            case "Player":
                return `You cannot ${verb} ${follower?.displayName} because ${follower?.pronouns?.sbj} ${this.isOrAre(follower, context)} not following you.`;
            default:
                return `${player.name} cannot ${verb} ${follower?.name} because ${follower?.originalPronouns?.sbj} ${this.isOrAre(follower, context)} not following ${player.originalPronouns.obj}.`;
        }
    }

    /**
     * Generates an error message indicating that the player cannot lead a player who is already leading others.
     * @param player - The player who cannot lead.
     * @param follower - The player who cannot be led.
     * @param context - The context in which the command is being issued.
     */
    generateCannotLeadLeaderError(player: Player, follower: Player, context: UserContext) {
        switch (context) {
            case "Player":
                return `You cannot lead ${follower?.displayName} because ${follower?.pronouns?.sbj} ${this.isOrAre(follower, context)} leading other player${follower?.ledPlayers.length !== 1 ? `s` : ``}.`;
            default:
                return `${player.name} cannot lead ${follower?.name} because ${follower?.originalPronouns?.sbj} ${this.isOrAre(follower, context)} leading other player${follower?.ledPlayers.length !== 1 ? `s` : ``}.`;
        }
    }

    /**
     * Generates an error message indicating that the player cannot lead any of the listed players because they are already leading all of them.
     * @param player - The player who cannot lead.
     * @param context - The context in which the command is being issued.
     */
    generateNoNewLedPlayersError(player: Player, context: UserContext) {
        switch (context) {
            case "Player":
                return `You are already leading all of those players.`;
            default:
                return `${player.name} is already leading all of those players.`;
        }
    }

    /**
     * Generates an error message indicating that the player is not in a party.
     * @param player - The player who is not in a party.
     * @param context - The context in which the command is being issued.
     */
    generateNotInPartyError(player: Player, context: UserContext) {
        switch (context) {
            case "Player":
                return `${this.youCannotString} not in a party.`;
            default:
                return `${player.name} is not in a party.`;
        }
    }

    /**
     * Generates an error message indicating that the player is not the party leader.
     * @param player - The player who is not the party leader.
     * @param context - The context in which the command is being issued.
     * @param includeLeavePartyDirections - Whether or not to give the player directions on how to leave the party. Only works if context is "Player".
     */
    generateNotPartyLeaderError(player: Player, context: UserContext, includeLeavePartyDirections: boolean) {
        switch (context) {
            case "Player":
                return `${this.youCannotString} not the party leader.${includeLeavePartyDirections ? ` If you want to leave the party, use ${this.getCommandString(`stop`)}.`: ``}`;
            default:
                return `${player.name} is not the party leader.`;
        }
    }

    /**
     * Generates an error message indicating that the player is not moving or following another player.
     * @param player - The player who is not moving or following anyone.
     * @param context - The context in which the command is being issued.
     */
    generatePlayerNotMovingOrFollowingError(player: Player, context: UserContext) {
        switch (context) {
            case "Player":
                return `${this.youCannotString} not moving or following another player.`;
            default:
                return `${player.name} is not moving or following another player.`;
        }
    }

    /**
     * Generates an error message indicating that the fixture is not activatable, or that it has no recipe tag.
     * @param fixture - The fixture that is not activatable.
     * @param context - The context in which the command is being issued.
     */
    generateFixtureNotActivatableError(fixture: Fixture, context: UserContext) {
        const verb = `${fixture.activated ? 'de' : ''}activate`;
        switch (context) {
            case "Player":
                return `You cannot ${verb} ${fixture.getContainingPhrase()}.`;
            default:
                return `${fixture.name} cannot be ${verb}d because it has no recipe tag.`;
        }
    }

    /**
     * Generates an error message indicating that the fixture cannot be activated/deactivated because it is already in that activation state.
     * @param fixture - The fixture that cannot be activated/deactivated.
     * @param context - The context in which the command is being issued.
     */
    generateFixtureAlreadyInActivationStateError(fixture: Fixture, context: UserContext) {
        const verb = `${fixture.activated ? '' : 'de'}activate`;
        switch (context) {
            case "Player":
                return `You cannot ${verb} ${fixture.getContainingPhrase()} because it is already ${verb}d.`;
            default:
                return `${fixture.name} is already ${verb}d.`;
        }
    }

    /**
     * Generates an error message indicating that the player does not have a free hand.
     * @param player - The player who does not have a free hand.
     * @param verb - The verb to describe what they cannot do without a free hand.
     * @param context - The context in which the command is being issued.
     * @param includeDirections - Whether or not to give the player directions on how to free up a hand. Only works if context is "Player".
     */
    generateNoFreeHandError(player: Player, verb: string, context: UserContext, includeDirections: boolean) {
        switch (context) {
            case "Player":
                return `You do not have a free hand to ${verb} an item.`
                    + includeDirections ? ` To free up a hand, either ${this.getCommandString(`drop`)} an item you're currently holding or `
                        + `${this.getCommandString(`stash`)} it in one of your equipped items.`
                    : ``;
            default:
                return `${player.name} does not have a free hand to ${verb} an item.`;
        }
    }

    /**
     * Generates an error message indicating that the player does not have any such item in either of their hands.
     * @param player - The player who does not have an item with the given name.
     * @param itemName - The name of the item the player doesn't have.
     * @param context - The context in which the command is being issued.
     * @param includeDirections - Whether or not to give the player directions on how to move an inventory item to their hand. Only works if context is "Player".
     * @param verb - The verb to describe what they can do with an item after moving it to their hand. Only needed if includeDirections is true.
     */
    generateNoHeldItemError(player: Player, itemName: string, context: UserContext, includeDirections: boolean, verb?: string) {
        switch (context) {
            case "Player":
                return `Couldn't find item "${itemName}" in either of your hands.`
                    + includeDirections ? ` If this item is elsewhere in your inventory, please ${this.getCommandString(`unequip`)} or `
                        + `${this.getCommandString(`unstash`)} it before trying to ${verb} it.`
                    : ``;
            default:
                return `Couldn't find inventory item "${itemName}" in either of ${player.name}'s hands.`;
        }
    }

    /**
     * Generates a vague error message indicating that an item container cannot contain an item right now.
     * @param container - The item container which cannot contain an item.
     * @param context - The context in which the command is being issued.
     */
    generateCannotPutItemsInContainerError(container: RoomItemContainer | InventoryItem | Prefab, context: UserContext) {
        switch (context) {
            case "Player":
                return `${capitalizeFirstLetter(container instanceof Prefab ? container.toSingleOrPluralContainingPhrase(1) : container.getContainingPhrase())} cannot hold items. Contact a moderator if you believe this is a mistake.`;
            default:
                return `${capitalizeFirstLetter(container.getEntityID())} cannot hold items.`;
        }
    }

    /**
     * Generates an error message indicating that an item container has more than one inventory slot.
     * @param container - The item container which has multiple inventory slots.
     * @param context - The context in which the command is being issued.
     */
    generateContainerHasMultipleInventorySlotsError(container: RoomItemContainer | InventoryItem | Prefab, context: UserContext) {
        switch (context) {
            case "Player":
                return `${capitalizeFirstLetter(container instanceof Prefab ? container.toSingleOrPluralContainingPhrase(1) : container.getContainingPhrase())} has more than one inventory slot.`;
            default:
                return `${capitalizeFirstLetter(container.getEntityID())} has more than one inventory slot.`;
        }
    }

    /**
     * Generates an error message indicating that items cannot be taken from/dropped in a fixture while it is activated.
     * @param fixture - The fixture that is activated.
     * @param command - The command being issued. Either "take" or "drop".
     * @param context - The context in which the command is being issued.
     */
    generateCannotChangeItemsInActivatedFixtureError(fixture: Fixture, command: "take" | "drop", context: UserContext) {
        let predicate: string;
        switch (context) {
            case "Player":
                predicate = command === "take" ? `take items from` : `put items ${fixture.getPreposition()}`;
                return `You cannot ${predicate} ${fixture.getContainingPhrase()} while it is turned on.`;
            default:
                predicate = command === "take" ? `taken from` : `put ${fixture.getPreposition()}`;
                return `Items cannot be ${predicate} ${fixture.getContainingPhrase()} while it is turned on.`;
        }
    }

    /**
     * Generates an error message indicating that an item cannot be placed in an inventory slot because it will not fit.
     * @param item - The item which will not fit.
     * @param container - The container the inventory slot belongs to.
     * @param slot - The inventory slot the item will not fit in.
     * @param context - The context in which the command is being issued.
     */
    generateItemWillNotFitInInventorySlotError(item: ItemInstance | Prefab, container: ItemInstance, slot: InventorySlot<any>, context: UserContext) {
        const slotPhrase = container.inventory.size > 1 ? `${slot.id} of ` : ``;
        const tooLarge = slot.capacityIsSmallerThan(item);
        const reason = tooLarge ? `it is too large` : `there isn't enough space left`;
        switch (context) {
            case "Player":
                return `${item.name} will not fit ${container.getPreposition()} ${slotPhrase}${container.name} because ${reason}.`;
            default:
                const possessive = container instanceof InventoryItem ? `${container.player.name}'s ` : ``;
                return `${item.getIdentifier()} will not fit ${container.getPreposition()} ${slotPhrase}${possessive}${container.getIdentifier()} because ${reason}.`;
        }
    }

    /**
     * Generates an error message indicating that the given items cannot be placed in an inventory slot because they will not fit.
     * @param items - The items which will not fit.
     * @param container - The container the inventory slot belongs to.
     * @param slot - The inventory slot the items will not fit in.
     * @param context - The context in which the command is being issued.
     */
    generateItemsWillNotFitInInventorySlotError(items: ItemInstance[] | Prefab[], container: ItemInstance | Prefab, slot: InventorySlot<any>, context: UserContext) {
        const itemList = generateListString(items.map((item: ItemInstance | Prefab) => context === "Moderator" ? item.getIdentifier() : item.name));
        const containerPrefab = container instanceof Prefab ? container : container.prefab;
        const slotPhrase = containerPrefab.inventory.size > 1 ? `${slot.id} of ` : ``;
        switch (context) {
            case "Player":
                return `${itemList} will not fit ${containerPrefab.preposition} ${slotPhrase}${container.name}.`;
            default:
                const possessive = container instanceof InventoryItem ? `${container.player.name}'s ` : ``;
                return `${itemList} will not fit ${containerPrefab.preposition} ${slotPhrase}${possessive}${container.getIdentifier()}.`;
        }
    }

    /**
     * Generates an error message indicating that the given prefab does not have a procedural with the given name.
     * @param prefab - The prefab which does not have the procedural.
     * @param proceduralName - The name of the procedural which does not exist on the prefab.
     */
    generateProceduralNotFoundError(prefab: Prefab, proceduralName: string) {
        return `${prefab.id} does not have procedural "${proceduralName}".`;
    }

    /**
     * Generates an error message indicating that the given prefab's procedural does not have a possibility with the given name.
     * @param prefab - The prefab with the procedural.
     * @param proceduralName - The name of the procedural which does not have the given possibility.
     * @param possibilityName - The name of the possibility which does not exist on the prefab's procedural.
     */
    generatePossibilityNotFoundError(prefab: Prefab, proceduralName: string, possibilityName: string) {
        return `${prefab.id}'s procedural "${proceduralName}" does not have possibility "${possibilityName}".`;
    }

    /**
     * Generates an error message indicating that the given prefab cannot be instantiated with the given quantity.
     * @param prefab - The prefab which cannot be instantiated.
     * @param quantity - The quantity with which the prefab cannot be instantiated.
     */
    generateCannotInstantiateWithInvalidQuantityError(prefab: Prefab, quantity: number) {
        return `Cannot instantiate ${prefab.id} with a quantity of ${quantity}. The quantity must be greater than or equal to 1.`;
    }
}
