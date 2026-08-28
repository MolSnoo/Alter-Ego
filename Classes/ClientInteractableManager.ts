// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ButtonStyle, Collection } from "discord.js";
import ButtonInteractable from "./Interactables/ButtonInteractable.ts";
import PageNextInteractable from "./Interactables/PageNextInteractable.ts";
import PagePrevInteractable from "./Interactables/PagePrevInteractable.ts";
import StringSelectMenuInteractable from "./Interactables/StringSelectMenuInteractable.ts";
import StringSelectMenuOptionInteractable from "./Interactables/StringSelectMenuOptionInteractable.ts";
import TextInputInteractable from "./Interactables/TextInputInteractable.ts";
import ModalInteractable from "./Interactables/ModalInteractable.ts";
import type Action from "../Data/Action.ts";
import type EquipmentSlot from "../Data/EquipmentSlot.ts";
import Fixture from "../Data/Fixture.ts";
import type Game from "../Data/Game.ts";
import type Interactable from "./Interactables/Interactable.ts";
import InventoryItem from "../Data/InventoryItem.ts";
import ItemInstance from "../Data/ItemInstance.ts";
import type Exit from "../Data/Exit.ts";
import Moderator from "../Data/Moderator.ts";
import Player from "../Data/Player.ts";
import Puzzle from "../Data/Puzzle.ts";
import Recipe from "../Data/Recipe.ts";
import RoomItem from "../Data/RoomItem.ts";
import ActionDirective from "./ActionDirective.ts";
import QueueMoveAction from "../Data/Actions/QueueMoveAction.ts";
import FollowAction from "../Data/Actions/FollowAction.ts";
import LeadAction from "../Data/Actions/LeadAction.ts";
import DismissAction from "../Data/Actions/DismissAction.ts";
import DisbandPartyAction from "../Data/Actions/DisbandPartyAction.ts";
import ViewPartyAction from "../Data/Actions/ViewPartyAction.ts";
import StopAction from "../Data/Actions/StopAction.ts";
import InspectAction from "../Data/Actions/InspectAction.ts";
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
import ActivateAndAttemptAction from "../Data/Actions/ActivateAndAttemptAction.ts";
import DeactivateAndAttemptAction from "../Data/Actions/DeactivateAndAttemptAction.ts";
import InstantiateInventoryItemAction from "../Data/Actions/InstantiateInventoryItemAction.ts";
import InstantiateRoomItemAction from "../Data/Actions/InstantiateRoomItemAction.ts";
import DestroyInventoryItemAction from "../Data/Actions/DestroyInventoryItemAction.ts";
import DestroyRoomItemAction from "../Data/Actions/DestroyRoomItemAction.ts";
import FindAction from "../Data/Actions/FindAction.ts";
import ViewAction, { type EntityField } from "../Data/Actions/ViewAction.ts";
import { removeInteractablesFromMessage } from "../Modules/messageHandler.ts";
import { ActionPriority } from "../Modules/enums.ts";
import { capitalizeFirstLetter, getSortedItems } from "../Modules/helpers.ts";
import HideAction from "../Data/Actions/HideAction.ts";
import EmergeAction from "../Data/Actions/EmergeAction.ts";

class InteractableOptions<T extends Action> {
    actionDirective: ActionDirective<T>;
    stringSelectLabel?: string;
    buttonLabel?: string;
    description?: string;
    respondWithModal: boolean;
    constructor(actionDirective: ActionDirective<T>, buttonLabel?: string, stringSelectLabel?: string, description?: string, respondWithModal: boolean = false) {
        this.actionDirective = actionDirective;
        this.buttonLabel = buttonLabel;
        this.stringSelectLabel = stringSelectLabel;
        this.description = description;
        this.respondWithModal = respondWithModal;
    }
}

type ButtonOrStringSelectMenuInteractable = ButtonInteractable | StringSelectMenuInteractable;

/**
 * A set of functions for creating and managing Interactables.
 */
export default class ClientInteractableManager {
    /**
     * The game this belongs to.
     */
    readonly #game: Game;
    /**
     * A cache of recently-created Interactables, indexed by their custom IDs.
     * This is used to look up Interactables when an interaction is received.
     */
    readonly #interactableCache: Collection<string, Interactable>;
    /**
     * The maximum number of Interactables to keep in the cache at once. If the cache exceeds this size, the oldest Interactable will be removed.
     */
    readonly #interactableCacheSizeLimit = 500;
    /**
     * A cache of messages with Interactables, indexed by message ID. This is used to keep track of which messages have interactables on them, so that we can disable those interactables when they're no longer valid.
     */
    readonly #interactableMessageCache: Collection<SentMessage, string[]>;
    /**
     * The maximum number of Interactable messages to keep in the cache at once. If the cache exceeds this size, the oldest message will be removed.
     */
    readonly #interactableMessageCacheSizeLimit = 50;
    /**
     * The maximum amount of time that interactables are valid for.
     */
    readonly #interactableValidTime = 5 * 60 * 1000;

    /**
     * @param game - The game this belongs to.
     */
    constructor(game: Game) {
        this.#game = game;
        this.#interactableCache = new Collection();
        this.#interactableMessageCache = new Collection();
    }

    /**
     * Gets an interactable from the cache by its custom ID.
     * @param customId
     */
    getInteractableByCustomId(customId: string) {
        return this.#interactableCache.get(customId);
    }

    /**
     * Adds an interactable to the cache, removing the oldest one if the cache size limit is exceeded.
     * Interactables are valid for 5 minutes after being added. They are automatically removed from the cache after this time.
     * @param interactable
     */
    #addInteractable(interactable: Interactable) {
        if (this.#interactableCache.size >= this.#interactableCacheSizeLimit)
            this.#disableInteractable(this.#interactableCache.firstKey()!);
        if (this.#interactableCache.has(interactable.customId))
            this.#disableInteractable(interactable.customId);
        this.#interactableCache.set(interactable.customId, interactable);
    }

    /**
     * Disables an interactable and removes it from the cache by its custom ID.
     * @param customId
     */
    #disableInteractable(customId: string) {
        const interactable = this.#interactableCache.get(customId);
        if (interactable) {
            this.#interactableCache.delete(customId);
        }
    }

    /**
     * Adds an interactable message to the cache, removing the oldest one if the cache size limit is exceeded.
     * @param channelId - The ID of the channel the message is in.
     * @param messageId - The ID of the message with interactables on it.
     * @param interactableCustomIds - The custom IDs of the interactables on the message.
     */
    addInteractableMessage(channelId: string, messageId: string, interactableCustomIds: string[]) {
        const key = { channelId: channelId, messageId: messageId };
        if (this.#interactableMessageCache.size >= this.#interactableMessageCacheSizeLimit)
            this.#disableInteractableMessage(this.#interactableMessageCache.firstKey()!);
        this.#interactableMessageCache.set(key, interactableCustomIds);
        setTimeout(() => this.#disableInteractableMessage(key), this.#interactableValidTime);
    }

    /**
     * Disables all interactables associated with a message and removes the message from the cache.
     * @param interactableMessage - The message with interactables on it to disable.
     */
    async #disableInteractableMessage(interactableMessage: SentMessage) {
        const message = await this.#game.clientContext.getSentMessage(interactableMessage);
        if (message) removeInteractablesFromMessage(this.#game, message);
        const interactableCustomIds = this.#interactableMessageCache.get(interactableMessage);
        if (interactableCustomIds) {
            for (const customId of interactableCustomIds) {
                this.#disableInteractable(customId);
            }
            this.#interactableMessageCache.delete(interactableMessage);
        }
    }

    /**
     * Creates an action directive for the given action class and arguments, and generates a custom ID for it based on the player it's being created for.
     * @param actionClass - The action class to create an action directive for.
     * @param args - The arguments to create the action directive with. These will be passed to the action when it's performed.
     * @param user - The user this action directive is being created for. This is used to generate a unique custom ID for the directive, preventing conflicts with directives created for other users with the same action and arguments.
     * @param player - The player this action directive is being created for. Optional.
     */
    #createActionDirective<T extends Action>(actionClass: Constructor<T>, args: any[], user: User, player?: Player): ActionDirective<T> {
        return new ActionDirective(actionClass.prototype, args, user, player);
    }

    /**
     * Creates a new button interactable and adds it to the cache.
     * @param buttonOptions - The options to create the interactable with.
     * @param style - The style to apply to the button.
     * @param priority - The priority level of the interactable. This determines how high up it will appear in a list of interactable components.
     */
    #createButtonInteractable<T extends Action>(buttonOptions: InteractableOptions<T>, style: ButtonStyle, priority: number): ButtonInteractable {
        const button = new ButtonInteractable(buttonOptions.actionDirective, buttonOptions.buttonLabel!, style, priority, buttonOptions.respondWithModal);
        this.#addInteractable(button);
        return button;
    }

    /**
     * Creates an array of button interactables and adds them to the cache.
     * @param buttonOptions - An array of interactable options to create the buttons with.
     * @param style - The style to apply to the buttons.
     * @param priority - The priority level of the interactable. This determines how high up it will appear in a list of interactable components.
     */
    #createButtonInteractables<T extends Action>(buttonOptions: InteractableOptions<T>[], style: ButtonStyle, priority: number): ButtonInteractable[] {
        const buttons: ButtonInteractable[] = [];
        for (const buttonOption of buttonOptions)
            buttons.push(this.#createButtonInteractable(buttonOption, style, priority));
        return buttons;
    }

    /**
     * Creates a new string select menu interactable with the given options and adds it to the cache.
     * @param actionDirective - The action directive to apply to the menu itself.
     * @param selectMenuOptions - The options to add to the menu.
     * @param placeholder - The placeholder text to display for the menu.
     * @param priority - The priority level of the interactable. This determines how high up it will appear in a list of interactable components.
     */
    #createStringSelectMenuInteractable<T extends Action>(actionDirective: ActionDirective<T>, selectMenuOptions: InteractableOptions<T>[], placeholder: string, priority: number): StringSelectMenuInteractable[] {
        const menuOptions: Collection<string, StringSelectMenuOptionInteractable> = new Collection();
        for (const selectMenuOption of selectMenuOptions) {
            if (menuOptions.size >= 25) break;
            const actionDirective = selectMenuOption.actionDirective;
            if (menuOptions.has(actionDirective.customId)) continue;
            const option = new StringSelectMenuOptionInteractable(actionDirective, selectMenuOption.stringSelectLabel!, actionDirective.customId, selectMenuOption.description, 0, selectMenuOption.respondWithModal);
            this.#addInteractable(option);
            menuOptions.set(actionDirective.customId, option);
        }
        if (menuOptions.size === 0) return [];
        const menu = new StringSelectMenuInteractable(actionDirective, menuOptions.map(menuOption => menuOption), placeholder, priority);
        this.#addInteractable(menu);
        return [menu];
    }

    /**
     * Creates Pagination interactables for a given action.
     * @param action - The action these interactables are associated with.
     * @param prevPageCallback - The function to execute when the prev button is pressed.
     * @param nextPageCallback - The function to execute when the next button is pressed.
     */
    createPaginationInteractables(action: Action, prevPageCallback: (interaction: BotInteraction) => void, nextPageCallback: (interaction: BotInteraction) => void): [PagePrevInteractable, PageNextInteractable] {
        const pagePrevButton = new PagePrevInteractable(`${action.id} Prev Page`, prevPageCallback);
        this.#addInteractable(pagePrevButton);
        const pageNextButton = new PageNextInteractable(`${action.id} Next Page`, nextPageCallback);
        this.#addInteractable(pageNextButton);
        return [pagePrevButton, pageNextButton];
    }

    /**
     * Creates QueueMoveAction interactables for a list of exits and adds them to the cache.
     * @param exits - A list of exits to create interactables for.
     * @param player - The player these interactables are being created for. This is used to determine which exits the player can use.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    createQueueMoveActionInteractables(exits: Exit[], player: Player, user: User = player): ButtonInteractable[] {
        const moveButtons: ButtonInteractable[] = [];
        const runButtons: ButtonInteractable[] = [];
        for (const exit of exits) {
            if (player.canUseCommand("move")) {
                const actionDirective = this.#createActionDirective(QueueMoveAction, exit.getQueueMoveActionDirectiveArgs(player.location, false), user, player);
                const buttonOptions = new InteractableOptions(actionDirective, `Move ${exit.name}`);
                moveButtons.push(this.#createButtonInteractable(buttonOptions, ButtonStyle.Primary, ActionPriority.QUEUE_MOVE));
            }
            if (player.canUseCommand("run")) {
                const actionDirective = this.#createActionDirective(QueueMoveAction, exit.getQueueMoveActionDirectiveArgs(player.location, true), user, player);
                const buttonOptions = new InteractableOptions(actionDirective, `Run ${exit.name}`);
                runButtons.push(this.#createButtonInteractable(buttonOptions, ButtonStyle.Danger, ActionPriority.QUEUE_RUN));
            }
        }
        return moveButtons.concat(runButtons);
    }

    /**
     * Creates a FollowAction interactable and adds it to the cache.
     * @param leader - The player to follow.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createFollowActionInteractable(leader: Player, player: Player, user: User = player): ButtonInteractable[] {
        if (!player.canUseCommand("follow") || player.followedPlayer) return [];
        if (player.isMoving || player.speed <= 0) return [];
        if (player.isHidden() && !player.isHiddenWith(leader)) return [];
        if (player.isFollowing(leader)) return [];
        if (leader.isFollowing(player) || player.wouldCreateFollowingLoop(leader)) return [];
        const actionDirective = this.#createActionDirective(FollowAction, leader.getGeneralActionDirectiveArgs(), user, player);
        const interactableOptions = new InteractableOptions(actionDirective, `Follow ${leader.displayName}`);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Primary, ActionPriority.FOLLOW)];
    }

    /**
     * Creates a LeadAction interactable and adds it to the cache.
     * @param follower - The player to lead.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createLeadActionInteractable(follower: Player, player: Player, user: User = player): ButtonInteractable[] {
        if (!player.canUseCommand("lead") || player.followedPlayer) return [];
        if (player.isHidden() && !player.isHiddenWith(follower)) return [];
        if (!follower.isFollowing(player) || follower.ledPlayers.length !== 0) return [];
        if (player.isLeading(follower)) return [];
        const actionDirective = this.#createActionDirective(LeadAction, follower.getGeneralActionDirectiveArgs(), user, player);
        const interactableOptions = new InteractableOptions(actionDirective, `Lead ${follower.displayName}`);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Success, ActionPriority.LEAD)];
    }

    /**
     * Creates Interactables for a list of dismissable players and adds them to the cache.
     * @param followers - A collection of followers that can be dismissed.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createDismissActionInteractables(followers: Collection<string, Player>, player: Player, user: User = player): StringSelectMenuInteractable[] {
        if (!player.canUseCommand("dismiss")) return [];
        const interactableOptions: InteractableOptions<DismissAction>[] = [];
        for (const follower of followers.values()) {
            const actionDirective = this.#createActionDirective(DismissAction, follower.getGeneralActionDirectiveArgs(), user, player);
            const userIsModerator = !(user instanceof Player);
            const displayName = userIsModerator ? player.party?.getMemberDisplayName(follower) ?? follower.displayName : follower.name;
            const label = `Dismiss ${displayName}`;
            interactableOptions.push(new InteractableOptions(actionDirective, label, label));
        }
        const actionDirective = this.#createActionDirective(DismissAction, ["DismissAction Menu"], user, player);
        return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Dismiss", ActionPriority.DISMISS);
    }

    /**
     * Creates a DisbandPartyAction interactable and adds it to the cache.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createDisbandPartyActionInteractables(player: Player, user: User = player): ButtonInteractable[] {
        if (!player.canUseCommand("disband")) return [];
        if (!player.party) return [];
        const actionDirective = this.#createActionDirective(DisbandPartyAction, [], user, player);
        const interactableOptions = new InteractableOptions(actionDirective, `Disband Party`);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Danger, ActionPriority.DISBAND)];
    }

    /**
     * Creates a ViewPartyAction interactable and adds it to the cache.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createViewPartyActionInteractable(player: Player, user: User = player): ButtonInteractable[] {
        if (!player.canUseCommand("party")) return [];
        if (!player.party && !player.followedPlayer) return [];
        const actionDirective = this.#createActionDirective(ViewPartyAction, [], user, player);
        const interactableOptions = new InteractableOptions(actionDirective, `View Party`);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Secondary, ActionPriority.VIEW_PARTY)];
    }

    /**
     * Creates a StopAction interactable and adds it to the cache.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     * @param label - The label to display in the interactable. Defaults to "Stop".
     */
    createStopActionInteractable(player: Player, user: User = player, label: string = "Stop"): ButtonInteractable[] {
        if (!player.canUseCommand("stop")) return [];
        const actionDirective = this.#createActionDirective(StopAction, [], user, player);
        const interactableOptions = new InteractableOptions(actionDirective, label);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Danger, ActionPriority.STOP)];
    }

    /**
     * Creates a HideAction interactable and adds it to the cache.
     * @param fixture - The fixture these interactables are being created for.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     * @param label - The label to display in the interactable. Defaults to "Hide".
     */
    createHideActionInteractable(fixture: Fixture, player: Player, user: User = player): ButtonInteractable[] {
        if (!player.canUseCommand("hide")) return [];
        if (fixture.hidingSpotCapacity === 0 || !fixture.hidingSpot) return [];
        if (player.isHidden()) return [];
        const actionDirective = this.#createActionDirective(HideAction, fixture.getGeneralActionDirectiveArgs(), user, player);
        const interactableOptions = new InteractableOptions(actionDirective, "Hide");
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Secondary, ActionPriority.HIDE)];
    }

    /**
     * Creates an EmergeAction interactable and adds it to the cache.
     * @param fixture - The fixture these interactables are being created for.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     * @param label - The label to display in the interactable. Defaults to "Emerge".
     */
    createEmergeActionInteractable(fixture: Fixture, player: Player, user: User = player): ButtonInteractable[] {
        if (!player.canUseCommand("hide")) return [];
        if (fixture.hidingSpotCapacity === 0 || !fixture.hidingSpot) return [];
        if (!player.isHidden() || player.hidingSpot !== fixture.name) return [];
        const actionDirective = this.#createActionDirective(EmergeAction, fixture.getGeneralActionDirectiveArgs(), user, player);
        const interactableOptions = new InteractableOptions(actionDirective, "Emerge");
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Secondary, ActionPriority.EMERGE)];
    }

    /**
     * Creates StringSelectMenuInteractable for a list of inspectable game entities and adds it to the cache.
     * @param entities - A list of inspectable game entities to create StringSelectMenuOptionInteractables for.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    createInspectActionInteractable(entities: Inspectable[], player: Player, user: User = player): StringSelectMenuInteractable[] {
        if (!player.canUseCommand("inspect")) return [];
        const interactableOptions: InteractableOptions<InspectAction>[] = [];
        for (const entity of entities) {
            const actionDirective = this.#createActionDirective(InspectAction, entity.getInspectActionDirectiveArgs(), user, player);
            const label = entity instanceof Player
                ? player.party && player.party.hasMember(entity)
                    ? player.party.getMemberDisplayName(entity)
                    : player.isFollowing(entity)
                        ? player.followedPlayerDisplayName
                        : entity.displayName
                : entity.name;
            const containerString = entity instanceof ItemInstance && entity.container
                ? entity.container instanceof ItemInstance && entity.container.inventory.size > 1
                    ? ` ${entity.container.getPreposition()} ${entity.slot} of ${entity.container.name}`
                    : ` ${entity.container.getPreposition()} ${entity.container.name}`
                : "";
            const description = `Inspect ${label}${containerString}`;
            interactableOptions.push(new InteractableOptions(actionDirective, label, label, description));
        }
        const actionDirective = this.#createActionDirective(InspectAction, ["InspectAction Menu"], user, player);
        return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Inspect", ActionPriority.INSPECT);
    }

    /**
     * Creates Interactables for a list of takeable room items and adds them to the cache.
     * @param entities - A list of takeable room items to create StringSelectMenuOptionInteractables for.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createTakeActionInteractable(entities: RoomItem[], player: Player, user: User = player): ButtonOrStringSelectMenuInteractable[] {
        if (!player.canUseCommand("take")) return [];
        const interactableOptions: InteractableOptions<TakeAction>[] = [];
        for (const entity of entities) {
            const actionDirective = this.#createActionDirective(TakeAction, entity.getTakeActionDirectiveArgs(), user, player);
            const containerString = entity.container instanceof RoomItem && entity.container.inventory.size > 1 ?
                ` from ${entity.slot} of ${entity.container.name}`
                : ` from ${entity.container.name}`;
            const buttonLabel = `Take ${entity.name}`;
            const stringSelectLabel = entity.name;
            const description = `Take ${entity.name}${containerString}`;
            interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
        }
        if (interactableOptions.length > 2) {
            const actionDirective = this.#createActionDirective(TakeAction, ["TakeAction Menu"], user, player);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Take", ActionPriority.TAKE);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Primary, ActionPriority.TAKE);
    }

    /**
     * Creates Interactables for a list of droppable inventory items and adds them to the cache.
     * @param entities - A list of takeable room items to create Interactables for.
     * @param player - The player these interactables are being created for.
     * @param container - The fixture or room item the player is dropping the items into.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createDropActionInteractables(entities: InventoryItem[], player: Player, container: RoomItemContainer, user: User = player): ButtonOrStringSelectMenuInteractable[] {
        if (!player.canUseCommand("drop")) return [];
        const interactableOptions: InteractableOptions<DropAction>[] = [];
        for (const entity of entities) {
            const containerType = container instanceof RoomItem ? 'RoomItem' : container instanceof Fixture ? 'Fixture' : 'Puzzle';
            const buttonLabel = `Drop ${entity.name}`;
            if (container instanceof RoomItem && container.inventory.size > 1) {
                for (const inventorySlot of container.inventory.values()) {
                    if (inventorySlot.willBeOverFilledBy(entity)) continue;
                    const actionDirective = this.#createActionDirective(DropAction, entity.getDropActionDirectiveArgs(containerType, container, inventorySlot), user, player);
                    const stringSelectLabel = `${entity.name} ${container.getPreposition()} ${inventorySlot.id}`;
                    const description = `Drop ${entity.name} ${container.getPreposition()} ${inventorySlot.id} of ${container.name}`;
                    interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
                }
            }
            else {
                const inventorySlot = container instanceof RoomItem ? container.inventory.first() : undefined;
                if (inventorySlot && inventorySlot.willBeOverFilledBy(entity)) continue;
                const actionDirective = this.#createActionDirective(DropAction, entity.getDropActionDirectiveArgs(containerType, container, inventorySlot), user, player);
                const stringSelectLabel = `${entity.name} ${container.getPreposition()} ${container.name}`;
                const description = `Drop ${entity.name} ${container.getPreposition()} ${container.name}`;
                interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
            }
        }
        if (interactableOptions.length > 2) {
            const actionDirective = this.#createActionDirective(DropAction, ["DropAction Menu"], user, player);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Drop", ActionPriority.DROP);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Primary, ActionPriority.DROP);
    }

    /**
     * Creates Interactables for a list of stashable inventory items and adds them to the cache.
     * @param entities - A list of stashable inventory items to create Interactables for.
     * @param player - The player these interactables are being created for.
     * @param viableContainers - A map of viable stash containers to the inventory slots the item can be stashed into. This is used to determine which stash options to create for each item.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createStashActionInteractables(entities: InventoryItem[], player: Player, viableContainers: Map<InventoryItem, string[]>, user: User = player): ButtonOrStringSelectMenuInteractable[] {
        if (!player.canUseCommand("stash")) return [];
        const interactableOptions: InteractableOptions<StashAction>[] = [];
        for (const entity of entities) {
            for (const [container, inventorySlots] of viableContainers.entries()) {
                if (container.identifier === entity.identifier) continue;
                for (const inventorySlotId of inventorySlots) {
                    const inventorySlot = container.inventory.get(inventorySlotId);
                    if (!inventorySlot || inventorySlot.willBeOverFilledBy(entity)) continue;
                    const actionDirective = this.#createActionDirective(StashAction, entity.getStashActionDirectiveArgs(container, inventorySlot), user, player);
                    const containerName = container.inventory.size > 1 ? `${inventorySlot.id} of ${container.name}` : container.name;
                    const stringSelectLabel = `${entity.name} ${container.getPreposition()} ${containerName}`;
                    const buttonLabel = `Stash ${stringSelectLabel}`;
                    const description = `Stash ${entity.name} ${container.getPreposition()} ${inventorySlot.id} of ${container.name}`;
                    interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
                }
            }
        }
        if (viableContainers.values().reduce((sum, inventorySlots) => sum + inventorySlots.length, 0) > 2) {
            const actionDirective = this.#createActionDirective(StashAction, ["StashAction Menu"], user, player);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Stash", ActionPriority.STASH);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Primary, ActionPriority.STASH);
    }

    /**
     * Creates Interactables for a list of unstashable inventory items and adds them to the cache.
     * @param entities - A list of unstashable inventory items to create Interactables for.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createUnstashActionInteractables(entities: InventoryItem[], player: Player, user: User = player): ButtonOrStringSelectMenuInteractable[] {
        if (!player.canUseCommand("unstash")) return [];
        const interactableOptions: InteractableOptions<UnstashAction>[] = [];
        for (const entity of entities) {
            const actionDirective = this.#createActionDirective(UnstashAction, entity.getUnstashActionDirectiveArgs(), user, player);
            const stringSelectLabel = `${entity.name}`;
            const buttonLabel = `Unstash ${stringSelectLabel}`;
            const containerString = entity.container !== null && entity.container.inventory.size > 1 ?
                ` from ${entity.slot} of ${entity.container.name}`
                : ` from ${entity.container.name}`;
            const description = `Unstash ${entity.name}${containerString}`;
            interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
        }
        const uniqueEntityNames = new Set(entities.map(entity => entity.name));
        if (entities.length > 4 || uniqueEntityNames.size !== entities.length) {
            const actionDirective = this.#createActionDirective(UnstashAction, ["UnstashAction Menu"], user, player);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Unstash", ActionPriority.UNSTASH);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Primary, ActionPriority.UNSTASH);
    }

    /**
     * Creates Interactables for a list of equippable inventory items and adds them to the cache.
     * @param equippableItems - A map of equippable items and the IDs of equipment slots they can be equipped to.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createEquipActionInteractables(equippableItems: Map<InventoryItem, string[]>, player: Player, user: User = player): ButtonOrStringSelectMenuInteractable[] {
        if (!player.canUseCommand("equip")) return [];
        const interactableOptions: InteractableOptions<EquipAction>[] = [];
        for (const [heldItem, equipmentSlots] of equippableItems.entries()) {
            for (const equipmentSlotId of equipmentSlots) {
                const equipmentSlot = player.inventory.get(equipmentSlotId);
                if (!equipmentSlot || equipmentSlot.equippedItem !== null) continue;
                const actionDirective = this.#createActionDirective(EquipAction, heldItem.getEquipActionDirectiveArgs(equipmentSlot), user, player);
                const stringSelectLabel = `${heldItem.name} to ${equipmentSlot.id}`;
                const buttonLabel = `Equip ${heldItem.name}`;
                const description = `Equip ${heldItem.name} to ${equipmentSlot.id}`;
                interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
            }
        }
        if (equippableItems.values().reduce((sum, equipmentSlots) => sum + equipmentSlots.length, 0) > 1) {
            const actionDirective = this.#createActionDirective(EquipAction, ["EquipAction Menu"], user, player);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Equip", ActionPriority.EQUIP);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Secondary, ActionPriority.EQUIP);
    }

    /**
     * Creates StringSelectMenuInteractable for a list of unequippable inventory items and adds it to the cache.
     * @param unequippableItems - A list of unequippable inventory items to create StringSelectMenuOptionInteractables for.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createUnequipActionInteractables(unequippableItems: InventoryItem[], player: Player, user: User = player): StringSelectMenuInteractable[] {
        if (!player.canUseCommand("unequip")) return [];
        const interactableOptions: InteractableOptions<UnequipAction>[] = [];
        for (const item of unequippableItems) {
            const actionDirective = this.#createActionDirective(UnequipAction, item.getUnequipActionDirectiveArgs(), user, player);
            interactableOptions.push(new InteractableOptions(actionDirective, `Unequip ${item.name}`, `${item.name}`, `Unequip ${item.name} from ${item.equipmentSlot}`));
        }
        const actionDirective = this.#createActionDirective(UnequipAction, ["UnequipAction Menu"], user, player);
        return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Unequip", ActionPriority.UNEQUIP);
    }

    /**
     * Creates Interactables for a crafting recipe and adds them to the cache.
     * @param recipe - The recipe that can be crafted.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createCraftActionInteractables(recipe: Recipe, player: Player, user: User = player): ButtonInteractable[] {
        if (!player.canUseCommand("craft")) return [];
        const heldItems = getSortedItems(this.#game.entityFinder.getPlayerHands(player).filter(hand => hand.equippedItem !== null).map(hand => hand.equippedItem));
        const actionDirective = this.#createActionDirective(CraftAction, player.getCraftActionDirectiveArgs(heldItems[0], heldItems[1], recipe), user, player);
        const interactableOptions = new InteractableOptions(actionDirective, `Craft ${heldItems[0].name} and ${heldItems[1].name}`);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Success, ActionPriority.CRAFT)];
    }

    /**
     * Creates Interactables for an uncraftable recipe and adds them to the cache.
     * @param recipe - The recipe that can be uncrafted.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createUncraftActionInteractables(recipe: Recipe, player: Player, user: User = player): ButtonInteractable[] {
        if (!player.canUseCommand("uncraft")) return [];
        const heldItems = getSortedItems(this.#game.entityFinder.getPlayerHands(player).filter(hand => hand.equippedItem !== null).map(hand => hand.equippedItem));
        const actionDirective = this.#createActionDirective(UncraftAction, player.getUncraftActionDirectiveArgs(heldItems[0], recipe), user, player);
        const interactableOptions = new InteractableOptions(actionDirective, `Uncraft ${heldItems[0].name}`);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Secondary, ActionPriority.UNCRAFT)];
    }

    /**
     * Creates Interactables for a list of usable inventory items and adds them to the cache.
     * @param usableItems - An array of usable inventory items in the player's hands.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createUseActionInteractables(usableItems: InventoryItem[], player: Player, user: User = player): StringSelectMenuInteractable[] {
        if (!player.canUseCommand("use")) return [];
        const interactableOptions: InteractableOptions<UseAction>[] = [];
        for (const item of usableItems) {
            const actionDirective = this.#createActionDirective(UseAction, item.getUseActionDirectiveArgs(player), user, player);
            const verb = item.prefab.secondPersonVerb ? capitalizeFirstLetter(item.prefab.secondPersonVerb) : "Use";
            const stringSelectLabel = `${item.name}`;
            const description = `${verb} ${stringSelectLabel}`;
            interactableOptions.push(new InteractableOptions(actionDirective, description, stringSelectLabel, description));
        }
        const actionDirective = this.#createActionDirective(UseAction, ["UseAction Menu"], user, player);
        return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Use", ActionPriority.USE);
    }

    /**
     * Creates an InventoryAction interactable and adds it to the cache.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createInventoryActionInteractable(player: Player, user: User = player): ButtonInteractable[] {
        if (!player.canUseCommand("inventory")) return [];
        const actionDirective = this.#createActionDirective(InventoryAction, [], user, player);
        const interactableOptions = new InteractableOptions(actionDirective, `View Inventory`);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Secondary, ActionPriority.VIEW_INVENTORY)];
    }

    /**
     * Creates Interactables for an activatable fixture and adds them to the cache.
     * @param fixture - The fixture that can be activated.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createActivateActionInteractables(fixture: Fixture, player: Player, user: User = player): ButtonInteractable[] {
        if (player && !player.canUseCommand("use")) return [];
        const actionDirective = this.#createActionDirective(ActivateAction, fixture.getActivateOrDeactivateActionDirectiveArgs(true), user, player);
        const interactableOptions = new InteractableOptions(actionDirective, `Activate ${fixture.name}`);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Secondary, ActionPriority.ACTIVATE)];
    }

    /**
     * Creates Interactables for a deactivatable fixture and adds them to the cache.
     * @param fixture - The fixture that can be deactivated.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    private createDeactivateActionInteractables(fixture: Fixture, player: Player, user: User = player): ButtonInteractable[] {
        if (player && !player.canUseCommand("use")) return [];
        const actionDirective = this.#createActionDirective(DeactivateAction, fixture.getActivateOrDeactivateActionDirectiveArgs(true), user, player);
        const interactableOptions = new InteractableOptions(actionDirective, `Deactivate ${fixture.name}`);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Secondary, ActionPriority.DEACTIVATE)];
    }

    /**
     * Creates an appropriate attempt action directive based on the presence and activation state of the fixture, if one exists.
     * @param puzzleArgs - The puzzle args to create the action directive with.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for.
     * @param fixture - The matching fixture that can be activated or deactivated. Optional.
     * @param fixtureArgs - The fixture args to create the action directive with. Defaults to an empty array.
     */
    private getAttemptActionDirective(
        puzzleArgs: ReturnType<typeof Puzzle.prototype.getAttemptActionDirectiveArgs>,
        player: Player,
        user: User,
        fixture?: Fixture,
        fixtureArgs: string[] = [],
    ): ActionDirective<AttemptAction | ActivateAndAttemptAction | DeactivateAndAttemptAction> {
        if (fixture && fixture.activated)
            return this.#createActionDirective(DeactivateAndAttemptAction, fixtureArgs.concat(puzzleArgs), user, player);
        else if (fixture)
            return this.#createActionDirective(ActivateAndAttemptAction, fixtureArgs.concat(puzzleArgs), user, player);
        else
            return this.#createActionDirective(AttemptAction, puzzleArgs, user, player);
    }

    /**
     * Creates Button Interactables for an attemptable puzzle and adds them to the cache.
     * @param puzzle - The puzzle that can be attempted.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     * @param fixture - The matching fixture that can be activated or deactivated. Optional.
     * @param respondWithModal - Whether or not to respond to the input with a modal to gather additional input. Optional. Defaults to false.
     * @param solved - Whether or not to consider the puzzle solved or not. Optional. If not provided, the puzzle's actual solved state will be used.
     */
    private createSimpleAttemptActionInteractables(puzzle: Puzzle, player: Player, user: User = player, fixture?: Fixture, respondWithModal: boolean = false, solved?: boolean): ButtonInteractable[] {
        if (!player.canUseCommand("use")) return [];
        const fixtureArgs: string[] = fixture ? fixture.getActivateOrDeactivateActionDirectiveArgs(false) : [];
        const puzzleArgs = puzzle.getAttemptActionDirectiveArgs(solved);
        const actionDirective = this.getAttemptActionDirective(puzzleArgs, player, user, fixture, fixtureArgs);
        const suffix = respondWithModal ? `…` : ``;
        const label = `${capitalizeFirstLetter(puzzle.getAttemptVerb(solved))} ${puzzle.getDisplayName()}${suffix}`;
        const interactableOptions = new InteractableOptions(actionDirective, label, undefined, undefined, respondWithModal);
        return [this.#createButtonInteractable(interactableOptions, ButtonStyle.Primary, ActionPriority.ATTEMPT)];
    }

    /**
     * Creates String Select Menu Interactables for a puzzle attemptable with an item and adds them to the cache.
     * @param puzzle - The puzzle that can be attempted.
     * @param items - The inventory items the puzzle can be attempted with.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     * @param fixture - The matching fixture that can be activated or deactivated. Optional.
     * @param respondWithModal - Whether or not to respond to the input with a modal to gather additional input. Optional. Defaults to false.
     * @param solved - Whether or not to consider the puzzle solved or not. Optional. If not provided, the puzzle's actual solved state will be used.
     */
    private createAttemptActionWithItemInteractables(puzzle: Puzzle, items: InventoryItem[], player: Player, user: User = player, fixture?: Fixture, respondWithModal: boolean = false, solved?: boolean): StringSelectMenuInteractable[] {
        if (!player.canUseCommand("use")) return [];
        const interactableOptions: InteractableOptions<AttemptAction | ActivateAndAttemptAction | DeactivateAndAttemptAction>[] = [];
        const puzzleName = puzzle.getDisplayName();
        const verb = `${capitalizeFirstLetter(puzzle.getAttemptVerb(solved))}`;
        const preposition = `${puzzle.getAttemptWithItemPreposition(solved)}`;
        const fixtureArgs: string[] = fixture ? fixture.getActivateOrDeactivateActionDirectiveArgs(false) : [];
        for (const item of items) {
            const puzzleArgs = puzzle.getAttemptActionDirectiveArgs(solved, item);
            const actionDirective = this.getAttemptActionDirective(puzzleArgs, player, user, fixture, fixtureArgs);
            const suffix = respondWithModal ? `…` : ``;
            const label = `${item.name}${suffix}`;
            let description: string;
            if (preposition === "with")
                description = `${verb} ${puzzleName} ${preposition} ${item.name}${suffix}`;
            else description = `${verb} ${item.name} ${preposition} ${puzzleName}${suffix}`;
            interactableOptions.push(new InteractableOptions(actionDirective, description, label, description, respondWithModal));
        }
        const actionDirective = this.#createActionDirective(AttemptAction, ["AttemptAction Menu"], user, player);
        return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, verb, ActionPriority.ATTEMPT);
    }

    /**
     * Creates String Select Menu Interactables for a puzzle with a small, set number of possible solutions, all of which are known to the player.
     * @param puzzle - The puzzle that can be attempted.
     * @param solutions - The solutions the player can choose from.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     * @param fixture - The matching fixture that can be activated or deactivated. Optional.
     * @param solved - Whether or not to consider the puzzle solved or not. Optional. If not provided, the puzzle's actual solved state will be used.
     */
    private createStringSelectAttemptActionInteractables(puzzle: Puzzle, solutions: string[], player: Player, user: User = player, fixture?: Fixture, solved?: boolean): StringSelectMenuInteractable[] {
        if (!player.canUseCommand("use")) return [];
        const interactableOptions: InteractableOptions<AttemptAction | ActivateAndAttemptAction | DeactivateAndAttemptAction>[] = [];
        const puzzleName = puzzle.getDisplayName();
        const verb = `${capitalizeFirstLetter(puzzle.getAttemptVerb(solved))}`;
        const preposition = `${puzzle.getAttemptWithItemPreposition(solved)}`;
        const fixtureArgs: string[] = fixture ? fixture.getActivateOrDeactivateActionDirectiveArgs(false) : [];
        for (const solution of solutions) {
            const targetPlayer = this.#game.entityFinder.getLivingPlayer(solution);
            const puzzleArgs = puzzle.getAttemptActionDirectiveArgs(solved, undefined, solution, targetPlayer?.displayName);
            const actionDirective = this.getAttemptActionDirective(puzzleArgs, player, user, fixture, fixtureArgs);
            const label = `${targetPlayer ? targetPlayer.displayName : solution}`;
            const description = `${verb} ${puzzleName} ${preposition} ${label}`;
            interactableOptions.push(new InteractableOptions(actionDirective, description, label, description));
        }
        const actionDirective = this.#createActionDirective(AttemptAction, ["AttemptAction Menu"], user, player);
        return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, verb, ActionPriority.ATTEMPT);
    }

    /**
     * Creates a modal interactable for a list of args and adds it to the cache.
     * This should only be called as a followup to one of the createAttemptActionInteractables methods to get the remaining required information.
     * This should just be the solution to attempt the Puzzle with.
     * @param args - An array of attempt action directive args. [name, location, type, item identifier, item containerName, item equipmentSlot, item proceduralSelectionsString, password, getAttemptVerb() (command), name (input), targetPlayer displayName]
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for.
     */
    createAttemptActionModalInteractable(args: string[], interactable: Interactable, player: Player, user: User, action: Constructor<Action | ActivateAndAttemptAction | DeactivateAndAttemptAction>): ModalInteractable {
        const attemptAndActivate = args.length > 11;
        const offset = attemptAndActivate ? 3 : 0;
        const puzzle = this.#game.entityFinder.getPuzzle(args[0 + offset], args[1 + offset], args[2 + offset]);
        const puzzleName = puzzle?.getDisplayName() ?? args[0 + offset];
        let title = interactable instanceof StringSelectMenuOptionInteractable && interactable.description
            ? interactable.description
            : interactable instanceof ButtonInteractable
                ? interactable.label
                : `${capitalizeFirstLetter(args[8 + offset])} ${puzzleName}`;
        if (title.endsWith(`…`)) title = title.substring(0, title.lastIndexOf(`…`));
        const inputs: TextInputInteractable[] = [new TextInputInteractable("Attempt Solution", title)];
        const modalActionDirective = this.#createActionDirective(action, args.concat(["Modal"]), user, player);
        const modal = new ModalInteractable(modalActionDirective, title, inputs, ActionPriority.ATTEMPT);
        this.#addInteractable(modal);
        return modal;
    }

    /**
     * Creates Interactables for a list of equipment slots and player inventory slots that can be instantiated to and adds them to the cache.
     * @param freeEquipmentSlots - An array of equipment slots with nothing equipped.
     * @param viableContainers - A map of viable inventory items with inventory slots an item can be instantiated into.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for.
     */
    createInstantiateInventoryItemActionInteractables(freeEquipmentSlots: EquipmentSlot[], viableContainers: Map<InventoryItem, string[]>, player: Player, user: User): ButtonOrStringSelectMenuInteractable[] {
        const interactableOptions: InteractableOptions<InstantiateInventoryItemAction>[] = [];
        for (const equipmentSlot of freeEquipmentSlots) {
            if (equipmentSlot.equippedItem !== null) continue;
            const actionDirective = this.#createActionDirective(InstantiateInventoryItemAction, equipmentSlot.getPartialInstantiateActionDirectiveArgs(), user, player);
            const stringSelectLabel = `${equipmentSlot.id}`;
            const buttonLabel = `Instantiate to ${stringSelectLabel}`;
            const description = `Instantiate to ${equipmentSlot.id}`;
            interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description, true));
        }
        for (const [container, inventorySlots] of viableContainers.entries()) {
            for (const inventorySlotId of inventorySlots) {
                const inventorySlot = container.inventory.get(inventorySlotId);
                if (!inventorySlot || inventorySlot.takenSpace >= inventorySlot.capacity) continue;
                const actionDirective = this.#createActionDirective(InstantiateInventoryItemAction, container.getPartialInstantiateActionDirectiveArgs(inventorySlot), user, player ?? container.player);
                const containerName = container.inventory.size > 1 ? `${inventorySlot.id} of ${container.getIdentifier()}` : container.getIdentifier();
                const stringSelectLabel = `${containerName}`;
                const buttonLabel = `Instantiate ${container.getPreposition()} ${stringSelectLabel}`;
                const description = `Instantiate ${container.getPreposition()} ${inventorySlot.id} of ${container.getIdentifier()}`;
                interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description, true));
            }
        }
        const uniqueButtonLabels = new Set(interactableOptions.map(option => `${option.buttonLabel}`));
        if (interactableOptions.length > 2 || uniqueButtonLabels.size !== interactableOptions.length) {
            const actionDirective = this.#createActionDirective(InstantiateInventoryItemAction, ["InstantiateInventoryItemAction Menu"], user, player);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Instantiate", ActionPriority.INSTANTIATE);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Success, ActionPriority.INSTANTIATE);
    }

    /**
     * Creates a modal interactable for a list of args and adds it to the cache.
     * This should only be called as a followup to createInstantiateInventoryItemActionInteractables to get the remaining required information.
     * @param args - An array of partial instantiate inventory item action directive args. ["II", equipmentSlotId, containerIdentifier, inventorySlotId]
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for.
     */
    createInstantiateInventoryItemActionModalInteractable(args: [string, string, string, string], player: Player, user: User): ModalInteractable {
        const equipmentSlotId = args[1];
        const containerIdentifier = args[2];
        const inventorySlotId = args[3];
        const inputs: TextInputInteractable[] = [];
        const destination = containerIdentifier ? `to ${inventorySlotId} of ${player.name}'s ${containerIdentifier}` : `to ${player.name}'s ${equipmentSlotId}`;
        inputs.push(new TextInputInteractable("Instantiate Inventory Item Prefab ID", "Prefab ID", `Prefab to instantiate ${destination}`));
        if (containerIdentifier)
            inputs.push(new TextInputInteractable("Instantiate Inventory Item Quantity", "Quantity", "Number.", true, "1"));
        inputs.push(new TextInputInteractable("Instantiate Inventory Item Uses", "Uses", "Number. If not provided, item will be instantiated with its default uses.", false));
        inputs.push(new TextInputInteractable("Instantiate Inventory Item Procedural Selections", "Procedural Selections", "Example: (color=metal + character=upa)", false, undefined, undefined, 5));
        inputs.push(new TextInputInteractable("Instantiate Inventory Item Contained Items", "Contained Items", "Prefabs to instantiate inside of it. Example: FOLDER (color=yellow) + 2 PEN (type=quill+ink=blue)", false));
        const modalActionDirective = this.#createActionDirective(InstantiateInventoryItemAction, args.concat(["Modal"]), user, player);
        const modal = new ModalInteractable(modalActionDirective, "Instantiate Inventory Item", inputs, ActionPriority.INSTANTIATE);
        this.#addInteractable(modal);
        return modal;
    }

    /**
     * Creates Interactables for a list of room item containers that can be instantiated to and adds them to the cache.
     * @param viableContainers - A map of viable room item containers and (optionally) inventory slots an item can be instantiated into.
     * @param user - The user these interactables are being created for.
     */
    createInstantiateRoomItemActionInteractables(viableContainers: Map<RoomItemContainer, string[]>, user: User): ButtonOrStringSelectMenuInteractable[] {
        const interactableOptions: InteractableOptions<InstantiateRoomItemAction>[] = [];
        for (const [container, inventorySlots] of viableContainers.entries()) {
            if (container instanceof RoomItem) {
                for (const inventorySlotId of inventorySlots) {
                    const inventorySlot = container.inventory.get(inventorySlotId);
                    if (!inventorySlot || inventorySlot.takenSpace >= inventorySlot.capacity) continue;
                    const actionDirective = this.#createActionDirective(InstantiateRoomItemAction, container.getPartialInstantiateActionDirectiveArgs(inventorySlot), user);
                    const containerName = container.inventory.size > 1 ? `${inventorySlot.id} of ${container.getIdentifier()}` : container.getIdentifier();
                    const stringSelectLabel = `${containerName}`;
                    const buttonLabel = `Instantiate ${container.getPreposition()} ${stringSelectLabel}`;
                    const description = `Instantiate ${container.getPreposition()} ${inventorySlot.id} of ${container.getIdentifier()} at ${container.getLocation().displayName}`;
                    interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description, true));
                }
            }
            else {
                if (!container.canCurrentlyContainItems(true, true)) continue;
                const actionDirective = this.#createActionDirective(InstantiateRoomItemAction, container.getPartialInstantiateActionDirectiveArgs(), user);
                const containerName = container.getContainerIdentifier();
                const stringSelectLabel = `${containerName}`;
                const buttonLabel = `Instantiate ${container.getPreposition()} ${stringSelectLabel}`;
                const description = `Instantiate ${container.getPreposition()} ${containerName} at ${container.getLocation().displayName}`;
                interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description, true));
            }
        }
        const uniqueButtonLabels = new Set(interactableOptions.map(option => `${option.buttonLabel}`));
        if (interactableOptions.length > 2 || uniqueButtonLabels.size !== interactableOptions.length) {
            const actionDirective = this.#createActionDirective(InstantiateRoomItemAction, ["InstantiateRoomItemAction Menu"], user);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Instantiate", ActionPriority.INSTANTIATE);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Success, ActionPriority.INSTANTIATE);
    }

    /**
     * Creates a modal interactable for a list of args and adds it to the cache.
     * This should only be called as a followup to createInstantiateRoomItemActionInteractables to get the remaining required information.
     * @param args - An array of partial instantiate room item action directive args. ["??", identifier, location, preposition, .?, .?, destinationInventorySlot]
     * @param user - The user these interactables are being created for.
     */
    createInstantiateRoomItemActionModalInteractable(args: string[], user: User): ModalInteractable {
        const containerIdentifier = args[1];
        const locationDisplayName = args[2];
        const preposition = args[3];
        const inventorySlotId = args.length === 7 && args[0] === "RI" ? args[6] : undefined;
        const containerPhrase = inventorySlotId ? `${inventorySlotId} of ${containerIdentifier}` : containerIdentifier;
        const inputs: TextInputInteractable[] = [];
        inputs.push(new TextInputInteractable("Instantiate Room Item Prefab ID", "Prefab ID", `Prefab to instantiate ${preposition} ${containerPhrase} at ${locationDisplayName}.`));
        inputs.push(new TextInputInteractable("Instantiate Room Item Quantity", "Quantity", "Number.", true, "1"));
        inputs.push(new TextInputInteractable("Instantiate Room Item Uses", "Uses", "Number. If not provided, item will be instantiated with its default uses.", false));
        inputs.push(new TextInputInteractable("Instantiate Room Item Procedural Selections", "Procedural Selections", "Example: (color=metal + character=upa)", false, undefined, undefined, 5));
        inputs.push(new TextInputInteractable("Instantiate Room Item Contained Items", "Contained Items", "Prefabs to instantiate inside of it. Example: FOLDER (color=yellow) + 2 PEN (type=quill+ink=blue)", false));
        const modalActionDirective = this.#createActionDirective(InstantiateRoomItemAction, args.concat(["Modal"]), user);
        const modal = new ModalInteractable(modalActionDirective, "Instantiate Room Item", inputs, ActionPriority.INSTANTIATE);
        this.#addInteractable(modal);
        return modal;
    }

    /**
     * Creates Interactables for a list of destroyable inventory items and adds them to the cache.
     * @param destroyableItems - A list of destroyable inventory items to create Interactables for.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for.
     */
    createDestroyInventoryItemActionInteractables(destroyableItems: InventoryItem[], player: Player, user: User): ButtonOrStringSelectMenuInteractable[] {
        const interactableOptions: InteractableOptions<DestroyInventoryItemAction>[] = [];
        for (const item of destroyableItems) {
            const actionDirective = this.#createActionDirective(DestroyInventoryItemAction, item.getDestroyActionDirectiveArgs(), user, player ?? item.player);
            let containerString: string;
            if (item.container !== null) {
                containerString = `${item.container.getPreposition()} `;
                if (item.container.inventory.size > 1) containerString += `${item.slot} of `;
                containerString += `${item.container.getIdentifier()}`;
            }
            else containerString = `equipped to ${item.equipmentSlot}`;
            const stringSelectLabel = `${item.getIdentifier()}`;
            const buttonLabel = `Destroy ${stringSelectLabel}`;
            const description = `${buttonLabel} ${containerString}`;
            interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
        }
        const uniqueButtonLabels = new Set(interactableOptions.map(option => option.buttonLabel));
        if (interactableOptions.length > 2 || uniqueButtonLabels.size !== interactableOptions.length) {
            const actionDirective = this.#createActionDirective(DestroyInventoryItemAction, ["DestroyInventoryItemAction Menu"], user, player);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Destroy", ActionPriority.DESTROY);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Danger, ActionPriority.DESTROY);
    }

    /**
     * Creates Interactables for a list of destroyable room items and adds them to the cache.
     * @param itemContainers - A list of item containers to create Interactables for.
     * @param user - The user these interactables are being created for.
     */
    createDestroyRoomItemActionInteractables(itemContainers: RoomItemContainer[], user: User): ButtonOrStringSelectMenuInteractable[] {
        const interactableOptions: InteractableOptions<DestroyRoomItemAction>[] = [];
        for (const container of itemContainers) {
            if (container instanceof RoomItem) {
                const actionDirective = this.#createActionDirective(DestroyRoomItemAction, container.getDestroyRoomItemActionDirectiveArgs(), user);
                let containerString = `${container.container.getPreposition()} `;
                if (container.container instanceof RoomItem) {
                    if (container.container.inventory.size > 1) containerString += `${container.slot} of `;
                    containerString += `${container.container.getIdentifier()}`;
                }
                else containerString += `${container.container.getContainerIdentifier()}`
                containerString += ` at ${container.getLocation().displayName}`;
                const stringSelectLabel = `${container.getIdentifier()}`;
                const buttonLabel = `Destroy ${stringSelectLabel}`;
                const description = `${buttonLabel} ${containerString}`;
                interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
            }
            if (container.isItemContainer() && container.canCurrentlyContainItems(false, true) && !container.containsNoItems()) {
                const actionDirective = this.#createActionDirective(DestroyRoomItemAction, container.getDestroyAllRoomItemActionDirectiveArgs(), user);
                const containerString = `${container.getPreposition()} ${container.getContainerIdentifier()}`;
                const stringSelectLabel = `All ${containerString}`;
                const buttonLabel = `Destroy all ${containerString}`;
                const description = `${buttonLabel} at ${container.getLocation().displayName}`;
                interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
            }
        }
        const uniqueButtonLabels = new Set(interactableOptions.map(option => option.buttonLabel));
        if (interactableOptions.length > 2 || uniqueButtonLabels.size !== interactableOptions.length) {
            const actionDirective = this.#createActionDirective(DestroyRoomItemAction, ["DestroyRoomItemAction Menu"], user);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Destroy", ActionPriority.DESTROY);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Danger, ActionPriority.DESTROY);
    }

    /**
     * Creates Interactables to find entities using the given args generator function and adds them to the cache.
     * @param argsSets - Sets of args to be passed into performFind as search queries.
     * @param user - The user these interactables are being created for.
     */
    createFindActionInteractables(argsSets: [string][], user: User): StringSelectMenuInteractable[] {
        const interactableOptions: InteractableOptions<FindAction>[] = [];
        for (const args of argsSets) {
            const actionDirective = this.#createActionDirective(FindAction, args, user);
            const stringSelectLabel = `${args[0]}`;
            const buttonLabel = `Find ${stringSelectLabel}`;
            interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, buttonLabel));
        }
        const actionDirective = this.#createActionDirective(FindAction, ["FindAction Menu"], user);
        return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Find", ActionPriority.FIND);
    }

    /**
     * Creates Interactables for an item container's list of items and adds them to the cache.
     * @param container - The container to search in.
     * @param user - The user these interactables are being created for.
     */
    private createFindContainedItemsActionInteractables(container: RoomItemContainer | InventoryItem, user: User): ButtonOrStringSelectMenuInteractable[] {
        const interactableOptions: InteractableOptions<FindAction>[] = [];
        let inventorySlotIDs: string[] = [undefined];
        if ((container instanceof RoomItem || container instanceof InventoryItem) && container.inventory.size > 1) {
            for (const inventorySlot of container.inventory.values()) {
                if (!inventorySlot.containsNoItems()) inventorySlotIDs.push(inventorySlot.id);
            }
        }
        for (const inventorySlotID of inventorySlotIDs) {
            const actionDirective = this.#createActionDirective(FindAction, container.getFindChildItemsActionDirectiveArgs(inventorySlotID), user);
            let containerString = `${container.getPreposition()} `;
            const slotPhrase = inventorySlotID ? `${inventorySlotID} of ` : ``;
            const stringSelectLabel = `${slotPhrase}${container.getContainerIdentifier()}`;
            containerString += `${stringSelectLabel}`;
            const buttonLabel = `Find Contained Items`;
            const description = `Find items ${containerString}`;
            interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
        }
        if (interactableOptions.length > 1) {
            const actionDirective = this.#createActionDirective(FindAction, ["FindContainedItemsAction Menu"], user);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "Find Contained Items", ActionPriority.FIND);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Secondary, ActionPriority.FIND);
    }

    /**
     * Creates Interactables for a list of fields of the given game entity and adds them to the cache.
     * @param entity - The entity to view.
     * @param fields - The fields of the given entity to create view interactables for.
     * @param user - The user these interactables are being created for.
     * @returns An array of button interactables, if the number of fields is less than or equal to 5. Otherwise, returns an array containing one string select menu interactable.
     */
    private createViewFieldActionInteractables<T extends PersistentGameEntity<any>>(entity: T, fields: EntityField<T>[], user: User): ButtonOrStringSelectMenuInteractable[] {
        const interactableOptions: InteractableOptions<ViewAction>[] = [];
        for (const field of fields) {
            const actionDirective = this.#createActionDirective(ViewAction, [entity.getEntityType(), entity.row, field], user);
            const stringSelectLabel = entity.getLabel(field);
            const buttonLabel = `View ${stringSelectLabel}`;
            interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, buttonLabel));
        }
        if (fields.length > 5) {
            const actionDirective = this.#createActionDirective(ViewAction, ["ViewFieldAction Menu"], user);
            return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, `View Field of ${entity.getEntityID()}`, ActionPriority.VIEW_FIELD);
        }
        else return this.#createButtonInteractables(interactableOptions, ButtonStyle.Primary, ActionPriority.VIEW_FIELD);
    }

    /**
     * Creates Interactables for a list of persistent game entities and adds them to the cache.
     * @param entities - A list of entities to view.
     * @param user - The user these interactables are being created for.
     */
    private createViewActionInteractables(entities: PersistentGameEntity<any>[], user: User): StringSelectMenuInteractable[] {
        const interactableOptions: InteractableOptions<ViewAction>[] = [];
        for (const entity of entities) {
            const actionDirective = this.#createActionDirective(ViewAction, [entity.getEntityType(), entity.row], user);
            const stringSelectLabel = `${entity.getEntityID()}`;
            const buttonLabel = `View ${stringSelectLabel}`;
            let description: string;
            if (entity instanceof Recipe) description = `View ${entity.getEntityType()} on row ${entity.row}`;
            else description = `View ${entity.getEntityType()} ${entity.getEntityID()} on row ${entity.row}`;
            interactableOptions.push(new InteractableOptions(actionDirective, buttonLabel, stringSelectLabel, description));
        }
        const actionDirective = this.#createActionDirective(ViewAction, ["ViewAction Menu"], user);
        return this.#createStringSelectMenuInteractable(actionDirective, interactableOptions, "View Entity", ActionPriority.VIEW);
    }

    /**
     * Generates an array of inspect interactables based on the party members or followed players the player is currently able to inspect.
     * This will only produce one string select menu interactable.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getInspectPartyMembersInteractables(player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        const players = player.party
            ? player.party.members.filter(member => member.name !== player.name).map(player => player)
            : player.followedPlayer
                ? [player.followedPlayer]
                : [];
        const filteredMembers = players.filter(player => player.location.id === player.location.id && (!player.isHidden() || player.isHiddenWith(player)));
        if (filteredMembers.length > 0)
            interactables = interactables.concat(this.createInspectActionInteractable(filteredMembers, player, user));
        return interactables;
    }

    /**
     * Generates an array of follow interactables based on who the player is currently able to follow. This will only produce one follow interactable.
     * @param leader - The player to follow.
     * @param player - The player these interactables are being created for.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getFollowInteractables(leader: Player, player: Player, user: User = player): Interactable[] {
        return this.createFollowActionInteractable(leader, player, user);
    }

    /**
     * Generates an array of lead interactables based on who the player is currently able to lead. This will only produce one lead interactable.
     * @param follower - The player to lead.
     * @param player - The player who can perform a lead action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getLeadInteractables(follower: Player, player: Player, user: User = player): Interactable[] {
        return this.createLeadActionInteractable(follower, player, user);
    }

    /**
     * Generates an array of dismiss interactables based on the followers the player is currently able to dismiss.
     * These will only generate if the player's party has more than one follower.
     * @param player - The player who can perform a dismiss action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getDismissInteractables(player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        if (player.party && player.party.hasLeader(player) && player.party.followers.size > 1)
            interactables = interactables.concat(this.createDismissActionInteractables(player.party.followers, player, user));
        return interactables;
    }

    /**
     * Generates an array of disband party interactables if the player is the leader of a party.
     * @param player - The player who can perform a disband party action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getDisbandPartyInteractables(player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        if (player.party && player.party.hasLeader(player))
            interactables = interactables.concat(this.createDisbandPartyActionInteractables(player, user));
        return interactables;
    }

    /**
     * Generates an array of view party interactables for the given player. This will only produce one view party interactable.
     * @param player - The player who can perform a view party action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getViewPartyInteractables(player: Player, user: User = player): Interactable[] {
        return this.createViewPartyActionInteractable(player, user);
    }

    /**
     * Generates an array of stop interactables for the given player. This will only produce one stop interactable.
     * @param player - The player who can perform a stop action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getStopFollowingInteractables(player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        if (player.followedPlayer) {
            const userIsModerator = !(user instanceof Player);
            const displayName = userIsModerator ? player.followedPlayer.name : player.followedPlayerDisplayName;
            const label = `Stop Following ${displayName}`;
            interactables = interactables.concat(this.createStopActionInteractable(player, user, label));
        }
        return interactables;
    }

    /**
     * Generates an array of take interactables based on what the player is currently able to take.
     * @param container - The container the player can take items from.
     * @param containedItems - The items in the container that the player is able to take.
     * @param player - The player who can perform a take action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getTakeInteractables(container: RoomItemContainer, containedItems: RoomItem[], player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        const playerFreeHand = this.#game.entityFinder.getPlayerFreeHand(player);
        let dropContainer = container;
        if (dropContainer instanceof Fixture && dropContainer.childPuzzle !== null && dropContainer.childPuzzle.isItemContainer()) dropContainer = container;
        if (playerFreeHand && dropContainer.canCurrentlyContainItems(false, user instanceof Moderator))
            interactables = interactables.concat(this.createTakeActionInteractable(containedItems, player, user));
        return interactables;
    }

    /**
     * Generates an array of drop interactables based on what the player is currently able to drop.
     * @param container - The container the player can drop items into.
     * @param player - The player who can perform a drop action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getDropInteractables(container: RoomItemContainer, player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        let dropContainer = container;
        if (dropContainer instanceof Fixture && dropContainer.childPuzzle !== null && dropContainer.childPuzzle.isItemContainer())
            dropContainer = dropContainer.childPuzzle;
        if (dropContainer.canCurrentlyContainItems(true, user instanceof Moderator)) {
            if (dropContainer.isItemContainer()) {
                const droppableEntities = this.#game.entityFinder.getPlayerHands(player).filter(equipmentSlot => equipmentSlot.equippedItem !== null).map(equipmentSlot => equipmentSlot.equippedItem);
                if (droppableEntities.length !== 0) interactables = interactables.concat(this.createDropActionInteractables(droppableEntities, player, dropContainer, user));
            }
        }
        return interactables;
    }

    /**
     * Generates an array of stash interactables based on what the player is currently able to stash.
     * @param player - The player who can perform a stash action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getStashInteractables(player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        const playerItems = this.#game.entityFinder.getInventoryItems(undefined, player.name);
        const heldItems = this.#game.entityFinder.getPlayerHands(player).filter(hand => hand.equippedItem !== null).map(hand => hand.equippedItem);
        const playerContainerItems = playerItems.filter(item => item.inventory.size > 0);
        if (heldItems.length > 0 && playerContainerItems.length > 0) {
            const viableStashDestinations = new Map<InventoryItem, string[]>();
            // Get stash interactables.
            for (const heldItem of heldItems) {
                for (const containerItem of playerContainerItems) {
                    // Ensure an inventory item can't be stashed inside an inventory item that it contains.
                    let container = containerItem.container;
                    let causesLoop = false;
                    while (container !== null) {
                        if (container.row === heldItem.row) {
                            causesLoop = true;
                            break;
                        }
                        container = container.container;
                    }
                    if (causesLoop) continue;
                    const viableInventorySlots: string[] = [];
                    for (const inventorySlot of containerItem.inventory.values()) {
                        if (inventorySlot.willBeOverFilledBy(heldItem)) continue;
                        viableInventorySlots.push(inventorySlot.id);
                    }
                    if (viableInventorySlots.length > 0) viableStashDestinations.set(containerItem, viableInventorySlots);
                }
            }
            interactables = interactables.concat(this.createStashActionInteractables(heldItems, player, viableStashDestinations, user));
        }
        return interactables;
    }

    /**
     * Generates an array of unstash interactables based on what the player is currently able to unstash.
     * @param player - The player who can perform an unstash action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     * @param freeHand - The player's free hand which can unstash an inventory item. Defaults to their first free hand, if they have one.
     */
    getUnstashInteractables(player: Player, user: User = player, freeHand: EquipmentSlot = this.#game.entityFinder.getPlayerFreeHand(player)): Interactable[] {
        let interactables: Interactable[] = [];
        const playerItems = this.#game.entityFinder.getInventoryItems(undefined, player.name);
        const playerContainerItems = playerItems.filter(item => item.inventory.size > 0);
        if (freeHand && playerContainerItems.length > 0) {
            const stashedItems = playerItems.filter(item => item.container !== null);
            if (stashedItems.length > 0) {
                interactables = interactables.concat(this.createUnstashActionInteractables(stashedItems, player, user));
            }
        }
        return interactables;
    }

    /**
     * Generates an array of equip interactables based on what the player is currently able to equip.
     * @param player - The player who can perform an equip action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getEquipInteractables(player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        const hands = this.#game.entityFinder.getPlayerHands(player);
        const heldItems = hands.filter(hand => hand.equippedItem !== null).map(hand => hand.equippedItem);
        const handSlotIDs = hands.map(hand => hand.id);
        const freeEquipmentSlots = player.inventory.filter(equipmentSlot => !handSlotIDs.includes(equipmentSlot.id) && equipmentSlot.equippedItem === null);
        if (heldItems.length > 0 && freeEquipmentSlots.size > 0) {
            const equippableItems = new Map<InventoryItem, string[]>();
            for (const heldItem of heldItems) {
                if (!heldItem.prefab.equippable) continue;
                const viableEquipmentSlots: string[] = [];
                for (const equipmentSlotId of heldItem.prefab.equipmentSlots) {
                    if (freeEquipmentSlots.has(equipmentSlotId)) {
                        viableEquipmentSlots.push(equipmentSlotId);
                    }
                }
                if (viableEquipmentSlots.length > 0) equippableItems.set(heldItem, viableEquipmentSlots);
            }
            interactables = interactables.concat(this.createEquipActionInteractables(equippableItems, player, user));
        }
        return interactables;
    }

    /**
     * Generates an array of unequip interactables based on what the player is currently able to unequip.
     * @param player - The player who can perform an unequip action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     * @param freeHand - The player's free hand which can unequip an inventory item. Defaults to their first free hand, if they have one.
     */
    getUnequipInteractables(player: Player, user: User = player, freeHand: EquipmentSlot = this.#game.entityFinder.getPlayerFreeHand(player)): Interactable[] {
        let interactables: Interactable[] = [];
        const handSlotIDs = this.#game.entityFinder.getPlayerHands(player).map(hand => hand.id);
        let unequippableItems = player.inventory.filter(equipmentSlot => !handSlotIDs.includes(equipmentSlot.id) && equipmentSlot.equippedItem !== null).map(equipmentSlot => equipmentSlot.equippedItem!);
        unequippableItems = unequippableItems.filter(item => item.prefab.equippable);
        if (freeHand && unequippableItems.length > 0) {
            interactables = interactables.concat(this.createUnequipActionInteractables(unequippableItems, player, user));
        }
        return interactables;
    }

    /**
     * Generates an array of craft interactables based on what the player is currently able to craft. Usually this is just one craft interactable.
     * @param player - The player who can perform a craft action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getCraftInteractables(player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        const heldItems = this.#game.entityFinder.getPlayerHands(player).filter(hand => hand.equippedItem !== null).map(hand => hand.equippedItem);
        if (heldItems.length >= 2) {
            const items = getSortedItems(heldItems);
            const recipes = this.#game.entityFinder.getRecipes("crafting", undefined, items.map(item => item.prefab.id).join(", "));
            if (recipes.length === 0) return [];
            for (const recipe of recipes) {
                if (player.canCraft(recipe, [items[0], items[1]])) {
                    interactables = interactables.concat(this.createCraftActionInteractables(recipe, player, user));
                    break;
                }
            }
        }
        return interactables;
    }

    /**
     * Generates an array of uncraft interactables based on what the player is currently able to uncraft. This is always just one uncraft interactable.
     * @param player - The player who can perform an uncraft action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getUncraftInteractables(player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        const heldItems = this.#game.entityFinder.getPlayerHands(player).filter(hand => hand.equippedItem !== null).map(hand => hand.equippedItem);
        const playerFreeHand = this.#game.entityFinder.getPlayerFreeHand(player);
        if (heldItems.length === 1 && playerFreeHand) {
            const item = heldItems[0];
            const recipe = this.#game.entityFinder.getRecipes("uncraftable", undefined, undefined, item.prefab.id)[0];
            if (recipe)
                interactables = interactables.concat(this.createUncraftActionInteractables(recipe, player, user));
        }
        return interactables;
    }

    /**
     * Generates an array of use interactables based on what the player is currently able to use.
     * @param player - The player who can perform a use action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getUseInteractables(player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        const heldItems = this.#game.entityFinder.getPlayerHands(player).filter(hand => hand.equippedItem !== null).map(hand => hand.equippedItem);
        const usableItems = heldItems.filter(item => item.uses !== 0 && item.prefab.usable && item.usableOn(player));
        if (usableItems.length > 0) {
            interactables = interactables.concat(this.createUseActionInteractables(usableItems, player, user));
        }
        return interactables;
    }

    /**
     * Generates an array of inventory interactables for the given player. This will only produce one inventory interactable.
     * @param player - The player who can perform an inventory action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getInventoryInteractables(player: Player, user: User = player): Interactable[] {
        return this.createInventoryActionInteractable(player, user);
    }

    /**
     * Generates an array of activate or deactivate interactables for a given fixture. Usually this is just one interactable.
     * @param fixture - The fixture the player can activate or deactivate.
     * @param player - The player who can perform an activate or deactivate action.
     * @param activated - Whether or not the fixture is activated. Defaults to the fixture's current activation state.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getActivateOrDeactivateInteractables(fixture: Fixture, player: Player, activated = fixture.activated, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        // If there is a puzzle in the room with an identical name, we can't simply activate or deactivate it.
        const matchingPuzzle = fixture.childPuzzle || this.#game.entityFinder.getPuzzle(fixture.name, fixture.location.id);
        if (fixture.recipeTag !== "" && !matchingPuzzle && (fixture.activatable || user instanceof Moderator)) {
            if (activated)
                interactables = interactables.concat(this.createDeactivateActionInteractables(fixture, player, user));
            else
                interactables = interactables.concat(this.createActivateActionInteractables(fixture, player, user));
        }
        return interactables;
    }

    /**
     * Generates an array of attempt interactables for a given list of puzzles. What kind of interactables are returned depends on each Puzzle's type.
     * @param puzzles - An array of puzzles the player can attempt.
     * @param player - The player who can perform an attempt action.
     * @param user - The user these interactables are being created for. Defaults to the given player.
     */
    getAttemptInteractables(puzzles: Puzzle[], player: Player, user: User = player): Interactable[] {
        let interactables: Interactable[] = [];
        const playerHandIDs = new Set(this.#game.entityFinder.getPlayerHands(player).map(hand => hand.id));
        // The player's held items and stashed items.
        const inventoryItems = player.getContainedItems().filter(item => item.container !== null || playerHandIDs.has(item.equipmentSlot));
        // We should only create one string select menu. If more than one is created, we need to get rid of all of them.
        let deleteStringSelectMenus = false;
        for (const puzzle of puzzles) {
            if (puzzle.requiresMod) continue;
            let fixture: Fixture;
            const matchingFixture = puzzle.parentFixture || this.#game.entityFinder.getFixture(puzzle.name, puzzle.location.id);
            if (matchingFixture && matchingFixture.recipeTag !== "") fixture = matchingFixture;
            // Check if we can make the player select a single item from their inventory to attempt the puzzle with.
            const itemSolutions = puzzle.solutions.filter(solution => solution.startsWith("Item:") || solution.startsWith("InventoryItem:") || solution.startsWith("Prefab:"));
            const noMultiItemSolutions = itemSolutions.every(solution => !solution.includes("+"));
            const puzzleRequiresOneItem = puzzle.requirementsStrings.filter(requirement => requirement.type === "Prefab").length === 1 || itemSolutions.length > 0 && noMultiItemSolutions;
            const playerCanSelectItem = puzzleRequiresOneItem && inventoryItems.length > 0;
            if (Puzzle.SimpleInteractTypes.has(puzzle.type) || puzzle.type.endsWith("probability")) {
                if (playerCanSelectItem)
                    interactables = interactables.concat(this.createAttemptActionWithItemInteractables(puzzle, inventoryItems, player, user, fixture));
                else interactables = interactables.concat(this.createSimpleAttemptActionInteractables(puzzle, player, user, fixture));
            }
            else if (Puzzle.SelectInteractTypes.has(puzzle.type)) {
                let solutions: string[] = [];
                if (puzzle.type === "room player")
                    solutions = this.#game.entityFinder.getLivingPlayers(undefined, undefined, player.location.id, player.hidingSpot).map(player => player.name);
                else
                    solutions = puzzle.solutions.filter(solution => !solution.startsWith("Item:") && !solution.startsWith("InventoryItem:") && !solution.startsWith("Prefab:"));
                if (!puzzle.solved || puzzle.type === "switch") {
                    if (solutions.length <= StringSelectMenuInteractable.OPTION_LIMIT)
                        interactables = interactables.concat(this.createStringSelectAttemptActionInteractables(puzzle, solutions, player, user, fixture));
                    else interactables = interactables.concat(this.createSimpleAttemptActionInteractables(puzzle, player, user, fixture, true));
                }
            }
            else if (Puzzle.TextInputInteractTypes.has(puzzle.type)) {
                if (!puzzle.solved && playerCanSelectItem)
                    interactables = interactables.concat(this.createAttemptActionWithItemInteractables(puzzle, inventoryItems, player, user, fixture, true));
                else if (!puzzle.solved || puzzle.type === "password")
                    interactables = interactables.concat(this.createSimpleAttemptActionInteractables(puzzle, player, user, fixture, true));
                else interactables = interactables.concat(this.createSimpleAttemptActionInteractables(puzzle, player, user, fixture));
            }
            else if (Puzzle.MixedInteractTypes.has(puzzle.type)) {
                if (playerCanSelectItem && !puzzle.solved && (puzzle.type === "key lock" || puzzle.type === "media"))
                    interactables = interactables.concat(this.createAttemptActionWithItemInteractables(puzzle, inventoryItems, player, user, fixture));
                if (puzzle.type === "channels" || puzzle.type === "option") {
                    if (playerCanSelectItem)
                        interactables = interactables.concat(this.createAttemptActionWithItemInteractables(puzzle, inventoryItems, player, user, fixture, true, false));
                    else interactables = interactables.concat(this.createSimpleAttemptActionInteractables(puzzle, player, user, fixture, true, false));
                }
                // All of these puzzle types can be attempted plainly if they're solved, regardless of solved state. Provide a button to do so.
                if (puzzle.solved)
                    interactables = interactables.concat(this.createSimpleAttemptActionInteractables(puzzle, player, user, fixture));
            }
            // Before we move onto the next puzzle, check if there's more than one string select menu.
            if (!deleteStringSelectMenus)
                deleteStringSelectMenus = interactables.filter(interactable => interactable instanceof StringSelectMenuInteractable).length > 1;
        }
        if (deleteStringSelectMenus) {
            interactables = interactables.filter(interactable => {
                const interactableIsStringSelectMenu = interactable instanceof StringSelectMenuInteractable;
                if (interactableIsStringSelectMenu) this.#disableInteractable(interactable.customId);
                return !interactableIsStringSelectMenu;
            });
        }
        return interactables;
    }

    /**
     * Generates an array of instantiate inventory item interactables based on the player's current inventory.
     * @param player - The player to instantiate an inventory item to.
     * @param user - The user these interactables are being created for.
     * @param freeEquipmentSlots - An array of equipment slots with nothing equipped. Optional.
     * @param containerItems - An array of inventory items that can contain items. Optional.
     */
    getInstantiateInventoryItemInteractables(player: Player, user: User, freeEquipmentSlots?: EquipmentSlot[], containerItems?: InventoryItem[]): Interactable[] {
        let interactables: Interactable[] = [];
        if (freeEquipmentSlots === undefined) freeEquipmentSlots = player.inventory.filter(equipmentSlot => equipmentSlot.equippedItem === null).map(equipmentSlot => equipmentSlot);
        if (containerItems === undefined) containerItems = this.#game.entityFinder.getInventoryItems(undefined, player.name).filter(item => item.inventory.size > 0);
        if (freeEquipmentSlots.length > 0 || containerItems.length > 0) {
            const viableStashDestinations = new Map<InventoryItem, string[]>();
            for (const containerItem of containerItems) {
                const viableInventorySlots: string[] = [];
                for (const inventorySlot of containerItem.inventory.values()) {
                    if (inventorySlot.takenSpace >= inventorySlot.capacity) continue;
                    viableInventorySlots.push(inventorySlot.id);
                }
                if (viableInventorySlots.length > 0) viableStashDestinations.set(containerItem, viableInventorySlots);
            }
            interactables = interactables.concat(this.createInstantiateInventoryItemActionInteractables(freeEquipmentSlots, viableStashDestinations, player, user));
        }
        return interactables;
    }

    /**
     * Generates an array of instantiate room item interactables based on the given item containers.
     * @param itemContainers - An array of room item containers that can potentially be instantiated into.
     * @param user - The user these interactables are being created for.
     */
    getInstantiateRoomItemInteractables(itemContainers: RoomItemContainer[], user: User): Interactable[] {
        let interactables: Interactable[] = [];
        if (itemContainers.length > 0) {
            const viableInstantiateDestinations = new Map<RoomItemContainer, string[]>();
            for (const itemContainer of itemContainers) {
                if (itemContainer instanceof RoomItem) {
                    const viableInventorySlots: string[] = [];
                    for (const inventorySlot of itemContainer.inventory.values()) {
                        if (inventorySlot.takenSpace >= inventorySlot.capacity) continue;
                        viableInventorySlots.push(inventorySlot.id);
                    }
                    if (viableInventorySlots.length > 0) viableInstantiateDestinations.set(itemContainer, viableInventorySlots);
                }
                else if (itemContainer.isItemContainer() && itemContainer.canCurrentlyContainItems(true, true))
                    viableInstantiateDestinations.set(itemContainer, []);
            }
            interactables = interactables.concat(this.createInstantiateRoomItemActionInteractables(viableInstantiateDestinations, user));
        }
        return interactables;
    }

    /**
     * Generates an array of destroy inventory item interactables based on the player's current inventory.
     * @param player - The player to destroy inventory items for.
     * @param user - The user these interactables are being created for.
     * @param equippedItems - An array of inventory items the player has equipped. Optional.
     * @param stashedItems - An array of inventory items the player has stashed. Optional.
     */
    getDestroyInventoryItemInteractables(player: Player, user: User, equippedItems?: InventoryItem[], stashedItems?: InventoryItem[]): Interactable[] {
        let interactables: Interactable[] = [];
        if (equippedItems === undefined) equippedItems = player.inventory.filter(equipmentSlot => equipmentSlot.equippedItem !== null).map(equipmentSlot => equipmentSlot.equippedItem);
        if (stashedItems === undefined) stashedItems = this.#game.entityFinder.getInventoryItems(undefined, player.name).filter(item => item.container !== null);
        if (equippedItems.length > 0 || stashedItems.length > 0) {
            interactables = interactables.concat(this.createDestroyInventoryItemActionInteractables(equippedItems.concat(stashedItems), player, user));
        }
        return interactables;
    }

    /**
     * Generates an array of destroy room item interactables based on the given item containers.
     * @param itemContainers - The item containers to destroy inventory items for.
     * @param user - The user these interactables are being created for.
     */
    getDestroyRoomItemInteractables(itemContainers: RoomItemContainer[], user: User): Interactable[] {
        let interactables: Interactable[] = [];
        if (itemContainers.length > 0) {
            interactables = interactables.concat(this.createDestroyRoomItemActionInteractables(itemContainers, user));
        }
        return interactables;
    }

    /**
     * Generates an array of find interactables that find all of the items contained inside the given container.
     * @param container - The container to search in.
     * @param user - The user these interactables are being created for.
     */
    getFindContainedItemsInteractables(container: RoomItemContainer | InventoryItem, user: User): Interactable[] {
        let interactables: Interactable[] = [];
        if (container && !container.containsNoItems())
            interactables = interactables.concat(this.createFindContainedItemsActionInteractables(container, user));
        return interactables;
    }

    /**
     * Generates an array of view interactables based on the given entity, fields, and related entities.
     * @param entity - The entity to view.
     * @param fields - The fields of the given entity to create view interactables for. These will usually result in the creation of button interactables.
     * @param relatedEntities - Related entities to view. These will always be collated into a string select menu interactable.
     * @param user - The user these interactables are being created for.
     */
    getViewInteractables<T extends PersistentGameEntity<any>>(entity: T, fields: EntityField<T>[], relatedEntities: PersistentGameEntity<any>[], user: User): Interactable[] {
        let interactables: Interactable[] = [];
        if (entity && fields.length > 0)
            interactables = interactables.concat(this.createViewFieldActionInteractables(entity, fields, user));
        if (relatedEntities.length > 0)
            interactables = interactables.concat(this.createViewActionInteractables(relatedEntities, user));
        return interactables;
    }
}
