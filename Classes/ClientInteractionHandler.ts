// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Action from "../Data/Action.ts";
import InspectAction from "../Data/Actions/InspectAction.ts";
import QueueMoveAction from "../Data/Actions/QueueMoveAction.ts";
import FollowAction from "../Data/Actions/FollowAction.ts";
import LeadAction from "../Data/Actions/LeadAction.ts";
import DismissAction from "../Data/Actions/DismissAction.ts";
import DisbandPartyAction from "../Data/Actions/DisbandPartyAction.ts";
import ViewPartyAction from "../Data/Actions/ViewPartyAction.ts";
import StopAction from "../Data/Actions/StopAction.ts";
import TakeAction from "../Data/Actions/TakeAction.ts";
import DropAction from "../Data/Actions/DropAction.ts";
import StashAction from "../Data/Actions/StashAction.ts";
import UnstashAction from "../Data/Actions/UnstashAction.ts";
import EquipAction from "../Data/Actions/EquipAction.ts";
import UnequipAction from "../Data/Actions/UnequipAction.ts";
import CraftAction from "../Data/Actions/CraftAction.ts";
import UncraftAction from "../Data/Actions/UncraftAction.ts";
import UseAction from "../Data/Actions/UseAction.ts";
import InventoryAction from "../Data/Actions/InventoryAction.ts";
import ActivateAction from "../Data/Actions/ActivateAction.ts";
import DeactivateAction from "../Data/Actions/DeactivateAction.ts";
import AttemptAction from "../Data/Actions/AttemptAction.ts";
import InstantiateInventoryItemAction from "../Data/Actions/InstantiateInventoryItemAction.ts";
import InstantiateRoomItemAction from "../Data/Actions/InstantiateRoomItemAction.ts";
import DestroyInventoryItemAction from "../Data/Actions/DestroyInventoryItemAction.ts";
import DestroyRoomItemAction from "../Data/Actions/DestroyRoomItemAction.ts";
import FindAction from "../Data/Actions/FindAction.ts";
import ViewAction from "../Data/Actions/ViewAction.ts";
import ActionDirectiveInteractable from "./Interactables/ActionDirectiveInteractable.ts";
import type Game from "../Data/Game.ts";
import type Interactable from "./Interactables/Interactable.ts";
import Moderator from "../Data/Moderator.ts";
import type Puzzle from "../Data/Puzzle.ts";
import PaginationInteractable from "./Interactables/PaginationInteractable.ts";
import { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
import type { Interaction, InteractionCallbackResponse } from "discord.js";
import HideAction from "../Data/Actions/HideAction.ts";
import EmergeAction from "../Data/Actions/EmergeAction.ts";

/**
 * A set of functions for handling Interactions.
 */
export default class ClientInteractionHandler {
    /**
     * The game this belongs to.
     */
    readonly #game: Game;

    /**
     * @param game - The game this belongs to.
     */
    constructor(game: Game) {
        this.#game = game;
    }

    /**
     * Gets an interactable from the cache by the customId. If it doesn't exist, returns undefined.
     * @param customId
     */
    getInteractable(customId: string): Interactable {
        return this.#game.clientContext.interactableManager.getInteractableByCustomId(customId);
    }

    /**
     * Intercepts an interaction event and directs it to the correct function.
     * @param interaction - The interaction that was created.
     */
    interceptInteraction(interaction: Interaction): void {
        const user = this.#game.entityFinder.getModeratorById(interaction.user.id) ?? this.#game.entityFinder.getLivingPlayerById(interaction.user.id);
        if (!user) return;
        if (interaction instanceof ButtonInteraction)
            this.processButtonInteraction(interaction, user);
        if (interaction instanceof StringSelectMenuInteraction)
            this.processStringSelectMenuInteraction(interaction, user);
        if (interaction instanceof ModalSubmitInteraction)
            this.processModalSubmitInteraction(interaction, user);
        return;
    }

    /**
     * Processes a button interaction.
     * @param interaction - The interaction being executed.
     * @param user - The user who triggered the interaction.
     */
    processButtonInteraction(interaction: ButtonInteraction, user: User): void {
        const customId = interaction.customId;
        this.#processInteraction(customId, interaction, user);
        return;
    }

    /**
     * Processes a string select interaction.
     * @param interaction - The interaction being executed.
     * @param user - The user who triggered the interaction.
     */
    processStringSelectMenuInteraction(interaction: StringSelectMenuInteraction, user: User): void {
        const selectedValue = interaction.values[0];
        const customId = selectedValue;
        this.#processInteraction(customId, interaction, user);
        return;
    }

    /**
     * Processes a modal submit interaction.
     * @param interaction - The interaction being executed.
     * @param user - The user who triggered the interaction.
     */
    processModalSubmitInteraction(interaction: ModalSubmitInteraction, user: User): void {
        const customId = interaction.customId;
        this.#processInteraction(customId, interaction, user);
        return;
    }

    /**
     * Processes an interaction and calls the correct function.
     * @param customId - The custom ID of the component that was interacted with.
     * @param interaction - The interaction being executed.
     * @param user - The user who triggered the interaction.
     */
    async #processInteraction(customId: string, interaction: BotInteraction, user: User): Promise<void> {
        let reply: InteractionCallbackResponse<boolean>;
        const interactable = this.getInteractable(customId);
        let successfullyProcessedInteractable = false;
        let errorMessage = `Interaction failed.`;
        if (interactable) {
            if (interactable instanceof ActionDirectiveInteractable && !interactable.respondWithModal) reply = await interaction.deferReply({ withResponse: true });
            try {
                if (interactable instanceof ActionDirectiveInteractable)
                    successfullyProcessedInteractable = await this.#processActionDirectiveInteractable(interactable, user, interaction, reply);
                else
                    successfullyProcessedInteractable = await this.#processStandardInteractable(interactable, user, interaction, reply);
            }
            catch (error) {
                successfullyProcessedInteractable = false;
                errorMessage = error.message;
            }
        }
        if (!successfullyProcessedInteractable) this.#replyToInteraction(errorMessage, interaction);
        return;
    }

    /**
     * Process an interactable and calls the correct function.
     * @param interactable - The interactable to process.
     * @param user - The user who triggered the interaction.
     * @param interaction - The interaction being executed.
     * @param reply - The reply that was sent.
     * @returns Whether the interactable successfully performed an action or not.
     */
    async #processActionDirectiveInteractable(interactable: ActionDirectiveInteractable, user: User, interaction: BotInteraction, reply?: InteractionCallbackResponse<boolean>): Promise<boolean> {
        const timestamp = new Date();
        const playerName = interactable.actionDirective.getPlayerName();
        const player = this.#game.entityFinder.getLivingPlayer(playerName);
        if (playerName && !player) throw new Error(`Invalid player.`);
        const author = user instanceof Moderator ? player ? `${player.name} (${user.member.user.username})` : user.member.user.username : player.name
        const forced = user instanceof Moderator;
        const action = interactable.actionDirective.createAction(this.#game, undefined, player, player?.location, forced, undefined, user);
        if (this.#game.editMode && !forced)
            return false;
        if (action instanceof QueueMoveAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 2) {
                    await action.performQueueMove(validatedArgs[0], validatedArgs[1]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("QueueMoveAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof FollowAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 1) {
                    await action.performFollow(validatedArgs[0]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("FollowAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof LeadAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 1) {
                    await action.performLead(validatedArgs[0]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("LeadAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof DismissAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 1) {
                    await action.performDismissAction(validatedArgs[0]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("DismissAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof DisbandPartyAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 0) {
                    await action.performDisbandParty();
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("DisbandPartyAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof ViewPartyAction) {
            if (player.canUseCommand("party") || action.forced) {
                action.performViewParty();
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("ViewPartyAction", author, timestamp, []);
                return true;
            }
        }
        if (action instanceof StopAction) {
            if (player && (player.isMoving || player.followedPlayer)) {
                await action.performStop();
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("StopAction", author, timestamp, []);
                return true;
            }
        }
        if (action instanceof InspectAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 1) {
                    action.performInspect(validatedArgs[0]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("InspectAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof HideAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 1) {
                    await action.performHide(validatedArgs[0]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("HideAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof EmergeAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 1) {
                    await action.performEmerge(validatedArgs[0]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("EmergeAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof TakeAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 4) {
                    action.performTake(validatedArgs[0], validatedArgs[1], validatedArgs[2], validatedArgs[3]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("TakeAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof DropAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 4) {
                    action.performDrop(validatedArgs[0], validatedArgs[1], validatedArgs[2], validatedArgs[3]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("DropAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof StashAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            const validatedArgs = action.validateInteractionArgs(parsedArgs);
            if (validatedArgs.length === 4) {
                action.performStash(validatedArgs[0], validatedArgs[1], validatedArgs[2], validatedArgs[3]);
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("StashAction", author, timestamp, validatedArgs);
                return true;
            }
        }
        if (action instanceof UnstashAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            const validatedArgs = action.validateInteractionArgs(parsedArgs);
            if (validatedArgs.length === 4) {
                action.performUnstash(validatedArgs[0], validatedArgs[1], validatedArgs[2], validatedArgs[3]);
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("UnstashAction", author, timestamp, validatedArgs);
                return true;
            }
        }
        if (action instanceof EquipAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            const validatedArgs = action.validateInteractionArgs(parsedArgs);
            if (validatedArgs.length === 3) {
                action.performEquip(validatedArgs[0], validatedArgs[1], validatedArgs[2]);
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("EquipAction", author, timestamp, validatedArgs);
                return true;
            }
        }
        if (action instanceof UnequipAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            const validatedArgs = action.validateInteractionArgs(parsedArgs);
            if (validatedArgs.length === 3) {
                action.performUnequip(validatedArgs[0], validatedArgs[1], validatedArgs[2]);
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("UnequipAction", author, timestamp, validatedArgs);
                return true;
            }
        }
        if (action instanceof CraftAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            const validatedArgs = action.validateInteractionArgs(parsedArgs);
            if (validatedArgs.length === 3) {
                action.performCraft(validatedArgs[0], validatedArgs[1], validatedArgs[2]);
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("CraftAction", author, timestamp, validatedArgs);
                return true;
            }
        }
        if (action instanceof UncraftAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            const validatedArgs = action.validateInteractionArgs(parsedArgs);
            if (validatedArgs.length === 2) {
                action.performUncraft(validatedArgs[0], validatedArgs[1]);
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("UncraftAction", author, timestamp, validatedArgs);
                return true;
            }
        }
        if (action instanceof UseAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            const validatedArgs = action.validateInteractionArgs(parsedArgs);
            if (validatedArgs.length === 2) {
                await action.performUse(validatedArgs[0], validatedArgs[1]);
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("UseAction", author, timestamp, validatedArgs);
                return true;
            }
        }
        if (action instanceof InventoryAction) {
            if (player.canUseCommand("inventory") || action.forced) {
                action.performInventory();
                this.#replyOrDeleteActionResponse(action, interaction, reply);
                this.#logInteraction("InventoryAction", author, timestamp, []);
                return true;
            }
        }
        if (action instanceof ActivateAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 2) {
                    action.performActivate(validatedArgs[0], validatedArgs[1]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("ActivateAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof DeactivateAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 2) {
                    action.performDeactivate(validatedArgs[0], validatedArgs[1]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("DeactivateAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof AttemptAction) {
            const args = interactable.actionDirective.getArgs();
            let solution: string;
            if (interaction instanceof ModalSubmitInteraction)
                solution = interaction.fields.getTextInputValue("Attempt Solution");
            else if (interactable.respondWithModal) {
                if (args.length === 11) {
                    const modal = this.#game.clientContext.interactableManager.createAttemptActionModalInteractable(
                        args as ReturnType<typeof Puzzle.prototype.getAttemptActionDirectiveArgs>,
                        interactable,
                        player,
                        user
                    );
                    await interaction.showModal(modal.component);
                    return true;
                }
                return false;
            }
            const parsedArgs = action.parseInteractionArgs(args);
            // If we got a solution from a modal submission, put it in place of the old password, which should have just been a placeholder.
            if (solution) parsedArgs.splice(2, 1, solution);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                if (validatedArgs.length === 6) {
                    action.performAttempt(validatedArgs[0], validatedArgs[1], validatedArgs[2], validatedArgs[3], validatedArgs[4], validatedArgs[5]);
                    this.#replyOrDeleteActionResponse(action, interaction, reply);
                    this.#logInteraction("AttemptAction", author, timestamp, validatedArgs);
                    return true;
                }
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof InstantiateInventoryItemAction) {
            if (interaction instanceof ModalSubmitInteraction) {
                const prefabId = interaction.fields.getTextInputValue("Instantiate Inventory Item Prefab ID");
                let quantity: string;
                if (interaction.fields.fields.has("Instantiate Inventory Item Quantity"))
                    quantity = interaction.fields.getTextInputValue("Instantiate Inventory Item Quantity");
                const uses = interaction.fields.getTextInputValue("Instantiate Inventory Item Uses");
                const proceduralSelections = interaction.fields.getTextInputValue("Instantiate Inventory Item Procedural Selections");
                const args = interactable.actionDirective.getArgs();
                const parsedArgs = action.parseInteractionArgs(args, prefabId, quantity, uses, proceduralSelections);
                try {
                    const validatedArgs = action.validateInteractionArgs(parsedArgs);
                    action.performInstantiateInventoryItem(validatedArgs[0], validatedArgs[1], validatedArgs[2], validatedArgs[3], validatedArgs[4], validatedArgs[5], validatedArgs[6]);
                    this.#replyToInteraction(action.successMessage, interaction);
                    this.#logInteraction("InstantiateInventoryItemAction", author, timestamp, validatedArgs);
                    return true;
                }
                catch (error) { throw new Error(error.message); }
            }
            else {
                const args = interactable.actionDirective.getArgs();
                if (args.length === 5 && args[0] === "II") {
                    const modal = this.#game.clientContext.interactableManager.createInstantiateInventoryItemActionModalInteractable(args as [string, string, string, string], player, user);
                    await interaction.showModal(modal.component);
                    return true;
                }
            }
        }
        if (action instanceof InstantiateRoomItemAction) {
            if (interaction instanceof ModalSubmitInteraction) {
                const prefabId = interaction.fields.getTextInputValue("Instantiate Room Item Prefab ID");
                let quantity: string;
                if (interaction.fields.fields.has("Instantiate Room Item Quantity"))
                    quantity = interaction.fields.getTextInputValue("Instantiate Room Item Quantity");
                const uses = interaction.fields.getTextInputValue("Instantiate Room Item Uses");
                const proceduralSelections = interaction.fields.getTextInputValue("Instantiate Room Item Procedural Selections");
                const args = interactable.actionDirective.getArgs();
                const parsedArgs = action.parseInteractionArgs(args, prefabId, quantity, uses, proceduralSelections);
                try {
                    const validatedArgs = action.validateInteractionArgs(parsedArgs);
                    action.performInstantiateRoomItem(validatedArgs[0], validatedArgs[1], validatedArgs[2], validatedArgs[3], validatedArgs[4], validatedArgs[5]);
                    this.#replyToInteraction(action.successMessage, interaction);
                    this.#logInteraction("InstantiateRoomItemAction", author, timestamp, validatedArgs);
                    return true;
                }
                catch (error) { throw new Error(error.message); }
            }
            else {
                const args = interactable.actionDirective.getArgs();
                if (args.length >= 4 && (args[0] === "F" || args[0] === "RI" || args[0] === "PZ")) {
                    const modal = this.#game.clientContext.interactableManager.createInstantiateRoomItemActionModalInteractable(args, user);
                    await interaction.showModal(modal.component);
                    return true;
                }
            }
        }
        if (action instanceof DestroyInventoryItemAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                action.performDestroyInventoryItem(validatedArgs[0], validatedArgs[1], validatedArgs[2]);
                this.#replyToInteraction(action.successMessage, interaction);
                this.#logInteraction("DestroyInventoryItemAction", author, timestamp, validatedArgs);
                return true;
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof DestroyRoomItemAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                if (args[0] === "ALL") {
                    for (const item of parsedArgs) {
                        const validatedArgs = action.validateInteractionArgs([item]);
                        const destroyAction = new DestroyRoomItemAction(action.getGame(), action.message, action.player, action.location, action.forced, action.whisper, action.user);
                        destroyAction.performDestroyRoomItem(validatedArgs[0], validatedArgs[1], validatedArgs[2]);
                        this.#logInteraction("DestroyRoomItemAction", author, timestamp, validatedArgs);
                    }
                    this.#replyToInteraction(`Successfully destroyed ${parsedArgs.length} room item${parsedArgs.length !== 1 ? `s` : ``}.`, interaction);
                }
                else {
                    const validatedArgs = action.validateInteractionArgs([parsedArgs[0]]);
                    action.performDestroyRoomItem(validatedArgs[0], validatedArgs[1], validatedArgs[2]);
                    this.#replyToInteraction(action.successMessage, interaction);
                    this.#logInteraction("DestroyRoomItemAction", author, timestamp, validatedArgs);
                }
                return true;
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof FindAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                action.performFind(validatedArgs);
                if (reply) reply.resource.message.delete();
                return true;
            }
            catch (error) { throw new Error(error.message); }
        }
        if (action instanceof ViewAction) {
            const args = interactable.actionDirective.getArgs();
            const parsedArgs = action.parseInteractionArgs(args);
            try {
                const validatedArgs = action.validateInteractionArgs(parsedArgs);
                action.performView(validatedArgs[0], validatedArgs[1]);
                if (reply) reply.resource.message.delete();
                return true;
            }
            catch (error) { throw new Error(error.message); }
        }
        return false;
    }

    /**
     * Processes a standard interactable, i.e. an interactable that doesn't contain an action directive.
     * @param interactable - The interactable to process.
     * @param user - The user who triggered the interaction.
     * @param interaction - The interaction being executed.
     * @param reply - The reply that was sent.
     * @returns Whether the interactable successfully performed an action or not.
     */
    async #processStandardInteractable(interactable: Interactable, user: User, interaction: BotInteraction, reply?: InteractionCallbackResponse<boolean>): Promise<boolean> {
        if (!interaction.message) return false;
        if (interactable instanceof PaginationInteractable) {
            interactable.callback(interaction);
            if (reply) reply.resource.message.delete();
        }
        return true;
    }

    /**
     * Replies to the interaction if it was initiated by a moderator. Otherwise, deletes the deferred response.
     * @param action - The action that was performed.
     * @param interaction - The interaction being executed.
     * @param reply - The reply that was sent.
     */
    #replyOrDeleteActionResponse(action: Action, interaction: BotInteraction, reply?: InteractionCallbackResponse<boolean>) {
        if (action.forced && action.successMessage) this.#replyToInteraction(action.successMessage, interaction);
        else if (reply) reply.resource.message.delete();
    }

    /**
     * Replies to an interaction.
     * @param response - The response to send.
     * @param interaction - The interaction to reply to.
     */
    #replyToInteraction(response: string, interaction: BotInteraction): void {
        if (interaction.replied || interaction.deferred) interaction.editReply({ content: response });
        else interaction.reply({ content: response });
    }

    /**
     * Logs the occurrence of an interaction.
     * @param type - The action type of the corresponding interaction.
     * @param author - The author of the interaction.
     * @param timestamp - The timestamp of the interaction.
     * @param args - The array of validated arguments for the interaction.
     */
    #logInteraction(type: string, author: string, timestamp: Date, args: any[]): void {
        this.#game.clientContext.logCommand(author, `${type} Interactable: ${args.map((value) => this.#game.clientContext.prettyPrinter.miniString(value)).join(",")}`, timestamp);
    }
}
