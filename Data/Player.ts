// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection, GuildMember, type TextChannel } from "discord.js";
import type { Duration } from "luxon";
import type Interactable from "../Classes/Interactables/Interactable.ts";
import Timer from "../Classes/Timer.ts";
import { MessageDisplayType, WhisperType } from "../Modules/enums.ts";
import * as itemManager from "../Modules/itemManager.ts";
import { itemIdentifierMatches } from "../Modules/matchers.ts";
import { capitalizeFirstLetter, generateListString, makeCopyable, round } from "../Modules/helpers.ts";
import type Action from "./Action.ts";
import CureAction from "./Actions/CureAction.ts";
import DieAction from "./Actions/DieAction.ts";
import InflictAction from "./Actions/InflictAction.ts";
import InstantiateInventoryItemAction from "./Actions/InstantiateInventoryItemAction.ts";
import StopAction from "./Actions/StopAction.ts";
import CollatedItem from "./CollatedItem.ts";
import type EquipmentSlot from "./EquipmentSlot.ts";
import type Exit from "./Exit.ts";
import Fixture from "./Fixture.ts";
import Game from "./Game.ts";
import type GameEntity from "./GameEntity.ts";
import type InventoryItem from "./InventoryItem.ts";
import type InventorySlot from "./InventorySlot.ts";
import type ItemInstance from "./ItemInstance.ts";
import Notification from "./Notification.ts";
import type Party from "./Party.ts";
import type Prefab from "./Prefab.ts";
import Puzzle from "./Puzzle.ts";
import type Recipe from "./Recipe.ts";
import RecipeProcessor, { type Process } from "./RecipeProcessor.ts";
import Room from "./Room.ts";
import RoomItem from "./RoomItem.ts";
import Status from "./Status.ts";
import type { Positionable } from "../Classes/GameMovementHandler.ts";

export type PlayerField =
    "id" |
    "name" |
    "title" |
    "pronounString" |
    "originalVoiceString" |
    "defaultStrength" |
    "defaultPerception" |
    "defaultDexterity" |
    "defaultSpeed" |
    "defaultStamina" |
    "alive" |
    "location" |
    "hidingSpot" |
    "status" |
    "description";

/**
 * A player's third-person pronouns.
 */
interface Pronouns {
    /** The subjective pronoun. */
    sbj?: string;
    /** The subjective pronoun with first letter capitalized. */
    Sbj?: string;
    /** The objective pronoun. */
    obj?: string;
    /** The objective pronoun with first letter capitalized. */
    Obj?: string;
    /** The dependent possessive pronoun. */
    dpos?: string;
    /** The dependent possessive pronoun with first letter capitalized. */
    Dpos?: string;
    /** The independent possessive pronoun. */
    ipos?: string;
    /** The independent possessive pronoun with first letter capitalized. */
    Ipos?: string;
    /** The reflexive pronoun. */
    ref?: string;
    /** The reflexive pronoun with first letter capitalized. */
    Ref?: string;
    /** Whether this set of pronouns turns verbs into their plural form. */
    plural?: boolean;
}

/**
 * Represents a player in the game.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/player.html
 */
export default class Player extends RecipeProcessor implements PersistentGameEntity<PlayerField>, User {
    /**
     * The Discord ID of the player, or the avatar URL for an NPC.
     */
    id: string;
    /**
     * member - The Discord member object of the player.
     */
    readonly member: GuildMember | null;
    /**
     * The name of the player.
     */
    name: string;
    /**
     * The name that will be displayed in most public gameplay narrations in lieu of the player's actual name.
     */
    displayName: string;
    /**
     * An image URL that will be used as an avatar when the player's dialog is sent through a webhook. If this is not set, the member's displayAvatar will be used instead.
     */
    displayIcon: string;
    /**
     * A title that can be used in descriptions. If this is set to "NPC", the player will be marked as an NPC.
     */
    readonly title: string;
    /**
     * A title that can be used in descriptions. If this is set to "NPC", the player will be marked as an NPC. Will eventually be removed.
     *
     * @deprecated Use title instead.
     */
    readonly talent: string;
    /**
     * Whether or not the player is an NPC.
     */
    readonly isNPC: boolean;
    /**
     * The player's third person personal pronouns.
     *
     * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/player.html#pronoun-string
     */
    pronounString: string;
    /**
     * The player's default pronouns.
     */
    originalPronouns: Pronouns;
    /**
     * The player's current pronouns. If the player is inflicted with a status effect that has the `concealed`
     * behavior attribute, this is automatically changed to they/them.
     */
    pronouns: Pronouns;
    /**
     * A phrase that will be used to describe the player's voice to other players when their identity is obscured in some way.
     * This should begin with "a" or "an" and end with "voice".
     */
    originalVoiceString: string;
    /**
     * The player's current voice string.
     * If this is the name of another player, the player's voice will be indistinguishable from theirs.
     */
    voiceString: string;
    /**
     * The player's default strength stat.
     */
    defaultStrength: number;
    /**
     * The player's current strength stat.
     */
    strength: number;
    /**
     * The player's default perception stat.
     */
    defaultPerception: number;
    /**
     * The player's current perception stat.
     */
    perception: number;
    /**
     * The player's default intelligence stat.
     *
     * @deprecated Use defaultPerception instead.
     */
    defaultIntelligence: number;
    /**
     * The player's current intelligence stat.
     *
     * @deprecated Use perception instead.
     */
    intelligence: number;
    /**
     * The player's default dexterity stat.
     */
    defaultDexterity: number;
    /**
     * The player's current dexterity stat.
     */
    dexterity: number;
    /**
     * The player's default speed stat.
     */
    defaultSpeed: number;
    /**
     * The player's current speed stat.
     */
    speed: number;
    /**
     * The player's default stamina stat.
     */
    defaultStamina: number;
    /**
     * The player's current maximum stamina stat.
     */
    maxStamina: number;
    /**
     * The amount of stamina the player currently has left.
     * When this reaches 0, the player will be inflicted with the `weary` status effect.
     */
    stamina: number;
    /**
     * Whether the player is alive or not.
     */
    alive: boolean;
    /**
     * The display name of the room the player was loaded into.
     */
    locationDisplayName: string;
    /**
     * The room the player is currently in.
     */
    location: Room;
    /**
     * The player's current position in 3D space.
     */
    pos: Pos;
    /**
     * The name of the fixture the player is currently hiding in. The fixture doesn't actually have to exist.
     */
    hidingSpot: string;
    /**
     * A list of the names of all status effects the player currently has, including those that aren't visible.
     * Also contains a string representation of the {@link Status.remaining|remaining time} of each status.
     */
    statusDisplays: StatusDisplay[];
    /**
     * A comma-separated list of the names of all status effects the player currently has, including those that aren't visible.
     * Also contains a string representation of the {@link Status.remaining|remaining time} of the status.
     *
     * @deprecated Use statusDisplays instead.
     */
    statusString: string;
    /**
     * All status effects the player currently has as a collection.
     * Every time a status is inflicted or cured, the player's stats are recalculated.
     */
    status: Collection<string, Status>;
    /**
     * All behavior attributes the player currently has as a collection.
     * The key is the name of the behavior attribute, and the value is an array of status effects inflicting it.
     * Every time a status is inflicted or cured, this collection is built from scratch.
     */
    #behaviorAttributes: Collection<string, Status[]>;
    /**
     * All of the player's {@link EquipmentSlot | equipment slots}. The key is the equipment slot's ID.
     */
    inventory: Collection<string, EquipmentSlot>;
    /**
     * The channel where notifications to the player will be sent. If the player is an NPC, this will be null.
     */
    notificationChannel: Messageable | null;
    /**
     * The spectate channel of the player.
     */
    spectateChannel: TextChannel | null;
    /**
     * The maximum weight of inventory items that the player can carry in kilograms.
     */
    maxCarryWeight: number;
    /**
     * The combined weight of all inventory items the player is currently carrying.
     */
    carryWeight: number;
    /**
     * Whether the player is currently moving or not.
     */
    isMoving: boolean;
    /**
     * Whether the player is currently running or not.
     */
    isRunning: boolean;
    /**
     * The speed at which the player is currently moving.
     */
    currentMovingSpeed: number;
    /**
     * How many milliseconds until the player is done moving to the exit they're currently moving to.
     */
    remainingTime: number;
    /**
     * A list of all movements the player wishes to make in sequential order.
     * When the player finishes moving to one destination, they will begin moving to the next one in the queue, if it exists.
     */
    moveQueue: string[];
    /**
     * The name of a player that this player is currently following. Used internally to avoid storing a reference to another player.
     */
    #followedPlayerName: string;
    /**
     * The display name of the player that this player is currently following.
     * This is set when the player begins following them, so that if it changes, their new identity won't be revealed.
     */
    followedPlayerDisplayName: string;
    /**
     * A list of the names of all players that this player is currently leading. Used internally to avoid storing references to other players.
     */
    #ledPlayerNames: Set<string>;
    /**
     * The party this player is currently in, if any.
     * If the player is not in a party, this is null.
     */
    party: Party | null;
    /**
     * Whether or not the player has depleted half of their stamina while moving.
     * When they do, they will be warned that they're starting to become tired.
     */
    reachedHalfStamina: boolean;
    /**
     * A timeout that regenerates the player's stamina every 30 seconds while they're not moving.
     */
    #staminaRegenerationInterval: NodeJS.Timeout;
    /**
     * The current recipe being processed, the ingredients being processed, and the products being instantiated for the recipe, if applicable.
     */
    process: Process<InventoryItem>;
    /**
     * Whether or not the player is considered online.
     * This is automatically set to `false` after 15 minutes of inactivity.
     */
    online: boolean;
    /**
     * A timeout that sets the player as offline after 15 minutes of inactivity.
     */
    #onlineInterval: NodeJS.Timeout;

    /**
     * @param id - The Discord ID of the player, or the avatar URL for an NPC.
     * @param member - The Discord member object of the player.
     * @param name - The name of the player.
     * @param title - The player's title.
     * @param pronounString - The player's third person personal pronouns. For formatting, see {@link https://msvblank.github.io/Alter-Ego/reference/data_structures/player.html#pronoun-string}
     * @param originalVoiceString - A phrase that will be used to describe the player's voice to other players when their identity is obscured in some way. This should begin with "a" or "an" and end with "voice".
     * @param stats - The stats of the player. For more details, see {@link https://msvblank.github.io/Alter-Ego/reference/data_structures/player.html#stats}
     * @param alive - Whether the player is alive or not.
     * @param locationDisplayName - The display name of the room the player was loaded into.
     * @param hidingSpot - The name of the fixture the player is currently hiding in. The fixture doesn't actually have to exist.
     * @param statusDisplays - A list of the names of all status effects the player currently has, including those that aren't visible. Also contains a string representation of the {@link Status.remaining|remaining time} of each status.
     * @param description - The description of the player. Can contain two item lists: hands and equipment.
     * @param inventory - All of the player's {@link EquipmentSlot | equipment slots}.
     * @param notificationChannel - The channel where notifications to the player will be sent.
     * @param spectateChannel - The spectate channel of the player.
     * @param row - The row of the player.
     * @param game - The game this belongs to.
     */
    constructor(
        id: string, member: GuildMember | null, name: string, title: string, pronounString: string,
        originalVoiceString: string, stats: Stats, alive: boolean, locationDisplayName: string, hidingSpot: string,
        statusDisplays: StatusDisplay[], description: string, inventory: Collection<string, EquipmentSlot>,
        notificationChannel: Messageable | null, spectateChannel: TextChannel | null, row: number, game: Game) {
        super(game, row, description);
        this.id = id;
        this.member = member;
        this.name = name;
        this.title = title;
        this.talent = title;
        this.isNPC = this.title === "NPC";
        this.displayName = this.name;
        this.displayIcon = this.isNPC ? this.id : null;
        this.pronounString = pronounString;
        this.originalPronouns = {
            sbj: null, Sbj: null,
            obj: null, Obj: null,
            dpos: null, Dpos: null,
            ipos: null, Ipos: null,
            ref: null, Ref: null,
            plural: null,
        };
        this.pronouns = {
            sbj: null, Sbj: null,
            obj: null, Obj: null,
            dpos: null, Dpos: null,
            ipos: null, Ipos: null,
            ref: null, Ref: null,
            plural: null,
        };
        this.originalVoiceString = originalVoiceString;
        this.voiceString = this.originalVoiceString;

        this.defaultStrength = stats.strength;
        this.strength = this.defaultStrength;
        this.defaultPerception = stats.perception;
        this.perception = this.defaultPerception;
        this.defaultIntelligence = this.defaultPerception;
        this.intelligence = this.perception;
        this.defaultDexterity = stats.dexterity;
        this.dexterity = this.defaultDexterity;
        this.defaultSpeed = stats.speed;
        this.speed = this.defaultSpeed;
        this.defaultStamina = stats.stamina;
        this.maxStamina = this.defaultStamina;
        this.stamina = this.defaultStamina;

        this.alive = alive;
        this.locationDisplayName = locationDisplayName;
        this.location = null;
        this.pos = { x: 0, y: 0, z: 0 };
        this.hidingSpot = hidingSpot;
        this.status = new Collection();
        this.#behaviorAttributes = new Collection();
        this.statusDisplays = statusDisplays;
        this.statusString = "";
        this.inventory = inventory;
        this.notificationChannel = notificationChannel;
        this.spectateChannel = spectateChannel;
        this.maxCarryWeight = this.getMaxCarryWeight();
        this.carryWeight = 0;

        this.isMoving = false;
        this.isRunning = false;
        this.currentMovingSpeed = 0;
        this.remainingTime = 0;
        this.moveQueue = [];
        this.#followedPlayerName = "";
        this.followedPlayerDisplayName = "";
        this.#ledPlayerNames = new Set();
        this.party = null;

        this.reachedHalfStamina = false;
        let player = this;
        this.#staminaRegenerationInterval = setInterval(function () {
            if (!player.isMoving) player.#regenerateStamina();
        }, 30000);

        this.process = { recipe: null, ingredients: [], products: [], satisfactoryProcessCount: 0, duration: null, timer: null };

        this.online = false;
        this.#onlineInterval = null;
    }

    /**
     * Sets the location.
     */
    setLocation(room: Room): void {
        this.location = room;
        this.locationDisplayName = room.displayName;
    }

    /**
     * Sets the inventory.
     */
    setInventory(inventory: Collection<string, EquipmentSlot>): void {
        this.inventory = inventory;
    }

    /**
     * Sets the pronouns of the player.
     * Modifies whichever pronoun set is passed into it.
     *
     * @param pronouns - A set of pronouns
     * @param pronounString - A string representation of a set of pronouns.
     */
    setPronouns(pronouns: Pronouns, pronounString: string): void {
        if (pronounString === "male") {
            pronouns.sbj = "he";
            pronouns.Sbj = "He";
            pronouns.obj = "him";
            pronouns.Obj = "Him";
            pronouns.dpos = "his";
            pronouns.Dpos = "His";
            pronouns.ipos = "his";
            pronouns.Ipos = "His";
            pronouns.ref = "himself";
            pronouns.Ref = "Himself";
            pronouns.plural = false;
        }
        else if (pronounString === "female") {
            pronouns.sbj = "she";
            pronouns.Sbj = "She";
            pronouns.obj = "her";
            pronouns.Obj = "Her";
            pronouns.dpos = "her";
            pronouns.Dpos = "Her";
            pronouns.ipos = "hers";
            pronouns.Ipos = "Hers";
            pronouns.ref = "herself";
            pronouns.Ref = "Herself";
            pronouns.plural = false;
        }
        else if (pronounString === "neutral") {
            pronouns.sbj = "they";
            pronouns.Sbj = "They";
            pronouns.obj = "them";
            pronouns.Obj = "Them";
            pronouns.dpos = "their";
            pronouns.Dpos = "Their";
            pronouns.ipos = "theirs";
            pronouns.Ipos = "Theirs";
            pronouns.ref = "themself";
            pronouns.Ref = "Themself";
            pronouns.plural = true;
        }
        // If none of the standard pronouns are given, let the user define their own.
        else {
            const pronounSet = pronounString.split("/");
            if (pronounSet.length === 6) {
                pronouns.sbj = pronounSet[0].trim();
                pronouns.Sbj = pronouns.sbj.charAt(0).toUpperCase() + pronouns.sbj.substring(1);
                pronouns.obj = pronounSet[1].trim();
                pronouns.Obj = pronouns.obj.charAt(0).toUpperCase() + pronouns.obj.substring(1);
                pronouns.dpos = pronounSet[2].trim();
                pronouns.Dpos = pronouns.dpos.charAt(0).toUpperCase() + pronouns.dpos.substring(1);
                pronouns.ipos = pronounSet[3].trim();
                pronouns.Ipos = pronouns.ipos.charAt(0).toUpperCase() + pronouns.ipos.substring(1);
                pronouns.ref = pronounSet[4].trim();
                pronouns.Ref = pronouns.ref.charAt(0).toUpperCase() + pronouns.ref.substring(1);
                const plural = pronounSet[5].trim().toLowerCase();
                pronouns.plural = plural === "true" ? true : plural === "false" ? false : null;
            }
        }
    }

    /** Gets the entity's location. */
    getLocation(): Room {
        return this.location;
    }

    /**
     * Returns the args for an ActionDirective that only needs to be able to look up this Player.
     * @returns [name]
     */
    getGeneralActionDirectiveArgs(): string[] {
        return [this.name];
    }

    /**
     * Returns the args for the Inspect ActionDirective for this Player.
     * @returns ["P", name]
     */
    getInspectActionDirectiveArgs(): string[] {
        return ["P", this.name];
    }

    /**
     * Returns the args for the Craft ActionDirective for the given crafting recipe.
     * @param item1 - The first item in the player's hands.
     * @param item2 - The second item in the player's hands.
     * @param recipe - The crafting recipe satisfied by these items.
     */
    getCraftActionDirectiveArgs(item1: InventoryItem, item2: InventoryItem, recipe: Recipe): string[] {
        return [
            item1.getIdentifier(),
            item2.getIdentifier(),
            "crafting",
            recipe.ingredientsFlat.map(ingredient => ingredient.prefab.id).join(","),
            recipe.productsFlat.map(product => product.prefab.id).join(","),
            item1.proceduralSelectionsString,
            item2.proceduralSelectionsString
        ];
    }

    /**
     * Returns the args for the Craft ActionDirective for the given uncraftable recipe.
     * @param item - The sole item in the player's hands.
     * @param recipe - The uncraftable recipe satisfied by this item.
     */
    getUncraftActionDirectiveArgs(item: InventoryItem, recipe: Recipe): string[] {
        return [
            item.getIdentifier(),
            "uncraftable",
            recipe.ingredientsFlat.map(ingredient => ingredient.prefab.id).join(","),
            recipe.productsFlat.map(product => product.prefab.id).join(","),
            item.proceduralSelectionsString
        ];
    }

    /**
     * A timeout that updates the player's position and stamina every 100 milliseconds while the player is moving.
     * If the player isn't moving, this is `null`.
     */
    get moveTimer(): NodeJS.Timeout | null {
        return this.getGame().movementHandler.getMoveTimer(this);
    }

    /**
     * Executes the given callback function after a set delay.
     * Overwrites the player's `moveTimer` and `remainingTime`.
     * @param delay - The amount of time to delay the callback function in milliseconds.
     * @param callback - The function to call when the delay is over.
     */
    doAfterDelay(delay: number, callback: (...args: any[]) => Promise<void>): void {
        this.getGame().movementHandler.doAfterDelay(new Set([this]), delay, callback);
    }

    /**
     * Calculates the player's movement rate in meters per second, irrespective of distance or slope.
     *
     * @param isRunning - Whether the player is running or not. Determines speed multiplier. Defaults to false.
     * @param speed - The speed at which the player is moving. Defaults to their current speed.
     */
    calculateMoveRate(isRunning: boolean = false, speed = this.speed): number {
        // The formula to calculate the rate is a quadratic function.
        // The equation is Rate = 0.0183x^2 + 0.005x + 0.916, where x is the player's speed stat multiplied by 2 or 1, depending on if the player is running or not.
        const speedMultiplier = isRunning ? 2 : 1;
        let rate = 0.0183 * Math.pow(speedMultiplier * speed, 2) + 0.005 * speedMultiplier * speed + 0.916;
        // Slow down the player relative to how much weight they're carrying.
        // The equation is Slowdown = 15/x, where x is the number of kilograms a player is carrying, and 1/4 <= Slowdown <= 1.
        const slowdown = Math.min(Math.max(15.0 / this.carryWeight, 0.25), 1.0);
        return rate * slowdown;
    }

    /**
     * Calculates the time it takes to move the player to the desired exit.
     *
     * @param exit - The exit to move toward.
     * @param isRunning - Whether the player is running or not. Determines speed multiplier. Defaults to false.
     * @param customSpeed - A custom speed at which to move. Optional. If not provided, the player's current speed will be used.
     * @returns The number of milliseconds it will take to move to the desired exit.
     */
    calculateMoveTime(exit: Exit, isRunning: boolean, customSpeed?: number): number {
        const rate = this.calculateMoveRate(isRunning, customSpeed);
        return this.getGame().movementHandler.calculateMoveTime(rate, this, exit);
    }

    /**
     * Returns true if the player's position is exactly the same as the given entity.
     * @param entity - Another player, or an exit.
     */
    positionMatches(entity: Positionable): boolean {
        return this.getGame().movementHandler.positionsEqual(this, entity);
    }

    /**
     * Sets the player's position in 3D space.
     * @param pos - The position to set.
     */
    setPos(pos: Pos): void {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.pos.z = pos.z;
    }

    /**
     * Resets the player's stamina to its maximum value.
     */
    #regenerateStamina(): void {
        if (this.stamina < this.maxStamina) {
            // Recover 1/20th of the player's max stamina per cycle, times the heatedSlowdownRate if applicable.
            let staminaAmount = this.maxStamina / 20;
            if (this.getGame().heated) staminaAmount *= this.getGame().settings.heatedSlowdownRate;
            const newStamina = this.stamina + staminaAmount;
            // Make sure not to exceed the max stamina for this player.
            if (newStamina >= this.maxStamina)
                this.restoreStamina();
            else
                this.stamina = newStamina;
        }
    }

    /**
     * Fully restores the player's stamina and resets their reachedHalfStamina flag.
     */
    restoreStamina(): void {
        this.stamina = this.maxStamina;
        this.reachedHalfStamina = false;
    }

    /**
     * Creates a string of non-discreet inventory items in the player's hands.
     * @param verb - The verb to use before listing the inventory items. Defaults to "carrying".
     */
    createMoveAppendString(verb: string = "carrying"): string {
        // Get the player's held items, sorted by size.
        const heldItems = this.getGame().entityFinder.getPlayerHands(this)
            .filter(hand => hand.equippedItem !== null && !hand.equippedItem.prefab.discreet)
            .map(hand => hand.equippedItem)
            .toSorted((a, b) => b.size - a.size);
        const collatedHeldItems = CollatedItem.collateForItemList(heldItems);

        let nonDiscreetItems: string[] = [];
        for (const heldItem of collatedHeldItems)
            nonDiscreetItems.push(heldItem.toSingleOrPluralContainingPhrase());

        let appendString = "";
        if (nonDiscreetItems.length > 0)
            appendString = ` ${verb} ${generateListString(nonDiscreetItems)}`;

        return appendString;
    }

    /**
     * Stops the player, if they're moving.
     */
    stopMoving(): void {
        if (this.moveTimer !== null) {
            this.getGame().movementHandler.stopMoveTimer(this);
        }
        this.isMoving = false;
        this.isRunning = false;
        this.currentMovingSpeed = 0;
        this.remainingTime = 0;
        this.moveQueue.length = 0;
    }

    /**
     * A player that this player is currently following. This player will follow every movement they make as long as
     * they can see them when they enter the room. If the player is not following anyone, this is null.
     */
    get followedPlayer(): Player | null {
        return this.getGame().entityFinder.getPlayer(this.#followedPlayerName) ?? null;
    }

    /**
     * Returns true if the player is following the given player.
     * @param player - The player to check.
     */
    isFollowing(player: Player): boolean {
        return this.#followedPlayerName !== "" && this.#followedPlayerName === player.name;
    }

    /**
     * Returns true if following the given player would create an endless loop of followers.
     * @param player - The first player in the chain.
     */
    wouldCreateFollowingLoop(player: Player): boolean {
        let nextFollowedPlayer = player.followedPlayer;
        while (nextFollowedPlayer) {
            if (nextFollowedPlayer.name === this.name) return true;
            nextFollowedPlayer = nextFollowedPlayer.followedPlayer;
        }
        return false;
    }

    /**
     * Returns true if the player this player is following is still visible in the room
     * and has the same display name as when this player first started following them.
     */
    followedPlayerIsInRoom(): boolean {
        return !!this.location.getOccupantsExcluding(this)
            .find(occupant => this.isFollowing(occupant) && occupant.displayName === this.followedPlayerDisplayName);
    }

    /**
     * Sets the player being followed, and their display name.
     * @param player - The player to follow.
     */
    startFollowing(player: Player): void {
        this.#followedPlayerName = player.name;
        this.followedPlayerDisplayName = player.displayName;
    }

    /**
     * Gets the speed at which to follow the followed player.
     */
    getFollowingSpeed(): number {
        if (this.party) return this.party.speed;
        else return Math.min(this.speed, this.followedPlayer.currentMovingSpeed);
    }

    /**
     * Stops following a player.
     */
    stopFollowing(): void {
        this.#followedPlayerName = "";
        this.followedPlayerDisplayName = "";
    }

    /**
     * A list of players that this player is currently leading. This player is being followed by all of them,
     * and will adjust their movement speed to not leave anyone behind.
     */
    get ledPlayers(): Player[] {
        let ledPlayers: Player[] = [];
        this.#ledPlayerNames.forEach(playerName => {
            const player = this.getGame().entityFinder.getPlayer(playerName);
            if (player && player.isFollowing(this)) ledPlayers.push(player);
        });
        return ledPlayers;
    }

    /**
     * Gets the player this player is leading with the given name, if they exist.
     * If the player doesn't exist or isn't being led by this player, this returns null.
     * @param playerName - The name of the player to get.
     */
    getLedPlayer(playerName: string): Player | null {
        return this.ledPlayers.find(player => player.name === playerName) ?? null;
    }

    /**
     * Returns true if the player is leading the given player.
     * @param player - The player to check.
     */
    isLeading(player: Player): boolean {
        return this.#ledPlayerNames.has(player.name);
    }

    /**
     * Adds the player to the list of players this player is leading.
     * The given player must be following this player.
     * @param player - The player to lead.
     */
    startLeading(player: Player): void {
        if (player.isFollowing(this))
            this.#ledPlayerNames.add(player.name);
    }

    /**
     * Removes the player from the list of players this player is leading.
     * @param player - The player to stop leading.
     */
    stopLeading(player: Player): void {
        this.#ledPlayerNames.delete(player.name);
    }

    /**
     * Sets the player's party.
     * @param party - The party to join.
     */
    joinParty(party: Party): void {
        this.party = party;
    }

    /**
     * Clears the player's party.
     */
    leaveParty(): void {
        this.party = null;
    }

    /**
     * Displays the player's party.
     *
     * @param moderatorView - Whether or not to use the names of players in the party. If this is false, the players' display names will be used instead.
     * @returns A string representation of the player's party.
     */
    viewParty(moderatorView: boolean): string {
        let partyString = moderatorView ? `${this.name} is` : `You are`;
        if (this.party) {
            if (this.party.hasLeader(this)) {
                partyString += ` the leader of a party.\n\n`;
                const followerList = this.party.followers.map(follower => moderatorView ? follower.name : this.party.getMemberDisplayName(follower)).toSorted();
                partyString += capitalizeFirstLetter(generateListString(followerList));
                partyString += `${followerList.length === 1 ? " is" : " are"} traveling together with `;
                partyString += moderatorView ? `${this.originalPronouns.obj}.` : `you.`;
            }
            else {
                partyString += ` in a party led by ${moderatorView ? this.party.leader.name : this.party.getMemberDisplayName(this.party.leader)}.`;
                const followerList = this.party.followers.filter(follower => follower !== this).map(follower => moderatorView ? follower.name : this.party.getMemberDisplayName(follower)).toSorted();
                if (followerList.length > 0) {
                    partyString += `\n\n${capitalizeFirstLetter(generateListString(followerList))}`;
                    partyString += `${followerList.length === 1 ? " is" : " are"} also traveling with ${moderatorView ? this.originalPronouns.obj : "you"}.`;
                }
            }
        }
        else if (this.followedPlayer) {
            partyString += ` not in a party. However, `;
            partyString += moderatorView ? `${this.originalPronouns.sbj} ${this.originalPronouns.plural ? "are" : "is"}` : `you are`;
            partyString += ` following ${moderatorView ? this.followedPlayer.name : this.followedPlayerDisplayName}.`;
        }
        else partyString += ` not in a party.`;
        return partyString;
    }

    /**
     * Inflicts the player with a status effect.
     *
     * @param status - The status to inflict.
     * @param duration - A custom duration that overrides the status's default duration.
     */
    inflict(status: Status, duration: Duration<true> = null): void {
        const statusInstance = new Status(status.id, status.durationString, status.duration, status.fatal, status.visible,
            status.overridersStrings, status.curesStrings, status.nextStageId, status.duplicatedStatusId,
            status.curedConditionId, status.statModifiers, status.behaviorAttributes, status.inflictedDescription.text,
            status.curedDescription.text, status.row, this.getGame());
        Status.postProcess(statusInstance);

        // Apply the duration, if applicable.
        if (statusInstance.duration) {
            if (duration !== null) statusInstance.remaining = duration;
            else statusInstance.remaining = statusInstance.duration;

            let player = this;
            statusInstance.timer = new Timer(1000, { start: true, loop: true }, function () {
                if (player.getGame().inProgress && !player.getGame().editMode) {
                    let subtractedTime = 1000;
                    if (player.getGame().heated) subtractedTime = player.getGame().settings.heatedSlowdownRate * subtractedTime;
                    statusInstance.remaining = statusInstance.remaining.minus(subtractedTime);
                    player.statusDisplays = player.#generateStatusDisplays(true, true);
                }

                if (statusInstance.remaining.as("milliseconds") <= 0) {
                    if (statusInstance.nextStage) {
                        const cureAction = new CureAction(player.getGame(), undefined, player, player.location, true);
                        const cureNextAction = new CureAction(player.getGame(), undefined, player, player.location, true);
                        cureNextAction.performCure(statusInstance.nextStage, false, false, true);
                        let inflictNextStage = true;
                        const playerStatusIds = player.status.map(statusEffect => statusEffect.id);
                        for (const overrider of statusInstance.nextStage.overriders) {
                            if (playerStatusIds.includes(overrider.id)) {
                                cureAction.performCure(statusInstance, true, false, true);
                                inflictNextStage = false;
                                break;
                            }
                        }
                        if (inflictNextStage) {
                            cureAction.performCure(statusInstance, false, false, false);
                            const nextStageAction = new InflictAction(player.getGame(), undefined, player, player.location, true);
                            nextStageAction.performInflict(statusInstance.nextStage, true, false, true);
                        }
                    }
                    else {
                        if (statusInstance.fatal) {
                            statusInstance.timer.stop();
                            const action = new DieAction(player.getGame(), undefined, player, player.location, true);
                            action.performDie();
                        }
                        else {
                            const cureAction = new CureAction(player.getGame(), undefined, player, player.location, true);
                            cureAction.performCure(statusInstance, true, true, true);
                        }
                    }
                }
            });
        }

        this.status.set(status.id, statusInstance);
        this.#recalculateStats();
        this.#setBehaviorAttributes();
        // If the player's new speed is less than or equal to 0, stop them from moving.
        if (this.speed <= 0 && (this.isMoving || this.followedPlayer)) {
            const stopAction = new StopAction(this.getGame(), undefined, this, this.location, true);
            stopAction.performStop(false, undefined, true);
        }
        this.statusDisplays = this.#generateStatusDisplays(true, true);
    }

    /**
     * Removes a status effect from the player.
     *
     * @param status - The status to cure.
     */
    cure(status: Status): void {
        let statusInstance: Status = this.status.get(status.id);
        // Stop the timer.
        if (statusInstance.timer)
            statusInstance.timer.stop();
        this.status.delete(status.id);
        this.#recalculateStats();
        this.#setBehaviorAttributes();
        this.statusDisplays = this.#generateStatusDisplays(true, true);
    }

    /**
     * Creates a list of the player's status effects.
     *
     * @param includeHidden - Whether or not to include status effects that aren't visible.
     * @param includeDurations - Whether or not to display the remaining time before the status effect expires.
     */
    #generateStatusDisplays(includeHidden: boolean, includeDurations: boolean): StatusDisplay[] {
        let statusDisplays: StatusDisplay[] = [];
        this.status.forEach(status => {
            if (status.visible || includeHidden) {
                const statusId = status.id;
                let timeString: string;
                if (includeDurations && status.remaining !== null) {
                    const format = Math.floor(status.remaining.as("days")) !== 0 ? "d hh:mm:ss" : "hh:mm:ss";
                    timeString = status.remaining.toFormat(format);
                }
                statusDisplays.push({ id: statusId, timeRemaining: timeString });
            }
        });
        return statusDisplays;
    }

    /**
     * Creates a list of the player's status effects.
     *
     * @param includeHidden - Whether or not to include status effects that aren't visible.
     * @param includeDurations - Whether or not to display the remaining time before the status effect expires.
     */
    getStatusList(includeHidden: boolean, includeDurations: boolean): string {
        const statusDisplays = this.#generateStatusDisplays(includeHidden, includeDurations);
        let statusStrings: string[] = [];
        statusDisplays.forEach(statusDisplay => {
            let statusString = statusDisplay.id;
            if (statusDisplay.timeRemaining) statusString += ` (${statusDisplay.timeRemaining})`;
            statusStrings.push(statusString);
        });
        return statusStrings.join(", ");
    }

    /**
     * Returns true if the player has a status with the specified ID.
     *
     * @param statusId - The ID of the status to look for.
     */
    hasStatus(statusId: string): boolean {
        return this.status.has(statusId);
    }

    /**
     * Sets the collection of the player's behavior attributes based on their current status effects.
     */
    #setBehaviorAttributes(): void {
        this.#behaviorAttributes.clear();
        for (const status of this.status.values()) {
            for (const behaviorAttribute of status.behaviorAttributes) {
                if (this.#behaviorAttributes.has(behaviorAttribute))
                    this.#behaviorAttributes.get(behaviorAttribute).push(status);
                else
                    this.#behaviorAttributes.set(behaviorAttribute, [status]);
            }
        }
    }

    /**
     * Returns true if the player has a status with the specified behavior attribute.
     * @param behaviorAttribute - The name of the behavior attribute.
     */
    hasBehaviorAttribute(behaviorAttribute: string): boolean {
        return this.#behaviorAttributes.has(behaviorAttribute);
    }

    /**
     * Returns true if the player has a status with the specified behavior attribute.
     *
     * @deprecated Use hasBehaviorAttribute instead.
     * @param attribute - The name of the behavior attribute.
     */
    hasAttribute(attribute: string): boolean {
        return this.hasBehaviorAttribute(attribute);
    }

    /**
     * Returns list of status effects the player has with the specified behavior attribute.
     * @param behaviorAttribute - The name of the behavior attribute.
     */
    getBehaviorAttributeStatusEffects(behaviorAttribute: string): Status[] {
        return this.#behaviorAttributes.get(behaviorAttribute) ?? [];
    }

    /**
     * Returns list of status effects the player has with the specified behavior attribute.
     * @deprecated Use getBehaviorAttributeStatusEffects instead.
     * @param attribute - The name of the behavior attribute.
     */
    getAttributeStatusEffects(attribute: string): Status[] {
        return this.getBehaviorAttributeStatusEffects(attribute);
    }

    /**
     * Returns true if the player can use the given command. Returns false if they have a status with the
     * `disable ${command}` behavior attribute. Also returns false they have the `disable all` behavior attribute,
     * but this can be overridden by a status with the `enable ${command}` behavior attribute, returning true.
     * @param command - The command to check.
     */
    canUseCommand(command: string): boolean {
        if (this.hasBehaviorAttribute(`disable ${command}`)) return false;
        if (this.hasBehaviorAttribute("disable all") && !this.hasBehaviorAttribute(`enable ${command}`)) return false;
        return true;
    }

    /**
     * Returns list of status effects the player has that disable the given command.
     * @param command - The command being disabled.
     */
    getStatusEffectsDisablingCommand(command: string): Status[] {
        if (this.hasBehaviorAttribute(`disable ${command}`))
            return this.getBehaviorAttributeStatusEffects(`disable ${command}`);
        if (this.hasBehaviorAttribute("disable all") && !this.hasBehaviorAttribute(`enable ${command}`))
            return this.getBehaviorAttributeStatusEffects("disable all");
        return [];
    }

    /**
     * Returns true if the player has the `can move freely` behavior attribute or the free movement role.
     */
    canMoveFreely(): boolean {
        return this.hasBehaviorAttribute("can move freely") || this.getGame().guildContext.hasFreeMovementRole(this.member);
    }

    /**
     * Returns true if the player doesn't have the `no sight` behavior attribute.
     */
    canSee(): boolean {
        return !this.hasBehaviorAttribute("no sight");
    }

    /**
     * Returns true if the player doesn't have the `no hearing` behavior attribute.
     */
    canHear(): boolean {
        return !this.hasBehaviorAttribute("no hearing");
    }

    /**
     * Returns true if the player has the `knows ${playerName}` behavior attribute.
     *
     * @param playerName - The name of a player.
     */
    knows(playerName: string): boolean {
        return this.hasBehaviorAttribute(`knows ${playerName}`);
    }

    /**
     * Returns true if the player doesn't have the `unconscious` behavior attribute.
     */
    isConscious(): boolean {
        return !this.hasBehaviorAttribute("unconscious");
    }

    /**
     * Returns true if the player has the `hidden` behavior attribute.
     */
    isHidden(): boolean {
        return this.hasBehaviorAttribute("hidden");
    }

    /**
     * Returns true if the player is in the same hiding spot as the given player.
     * @param player - The other player to check if they are hiding together.
     */
    isHiddenWith(player: Player): boolean {
        return this.isHidden() && player.isHidden() && this.hidingSpot === player.hidingSpot;
    }

    /**
     * Calculates the player's stats based on their current status effects.
     */
    #recalculateStats(): void {
        const strength = this.defaultStrength;
        const perception = this.defaultPerception;
        const dexterity = this.defaultDexterity;
        const speed = this.defaultSpeed;
        const stamina = this.defaultStamina;

        let strModifiers: StatModifier[] = [];
        let perModifiers: StatModifier[] = [];
        let dexModifiers: StatModifier[] = [];
        let spdModifiers: StatModifier[] = [];
        let staModifiers: StatModifier[] = [];

        for (const status of this.status.values()) {
            for (const modifier of status.statModifiers) {
                if (modifier.modifiesSelf) {
                    switch (modifier.stat) {
                        case "str":
                            strModifiers.push(modifier);
                            break;
                        case "per":
                            perModifiers.push(modifier);
                            break;
                        case "dex":
                            dexModifiers.push(modifier);
                            break;
                        case "spd":
                            spdModifiers.push(modifier);
                            break;
                        case "sta":
                            staModifiers.push(modifier);
                            break;
                    }
                }
            }
        }

        this.strength = this.#recalculateStat(strength, strModifiers);
        this.maxCarryWeight = this.getMaxCarryWeight();
        this.perception = this.#recalculateStat(perception, perModifiers);
        this.intelligence = this.perception;
        this.dexterity = this.#recalculateStat(dexterity, dexModifiers);
        this.speed = this.#recalculateStat(speed, spdModifiers);
        const staminaRatio = this.stamina / this.maxStamina;
        this.maxStamina = this.#recalculateStat(stamina, staModifiers);
        this.stamina = staminaRatio * this.maxStamina;
    }

    /**
     * Calculates stat after applying stat modifiers.
     *
     * @param stat - The current stat value.
     * @param modifiers - The modifiers to apply.
     */
    #recalculateStat(stat: number, modifiers: StatModifier[]): number {
        let assignModifiers = modifiers.filter(modifier => modifier.assignValue === true).sort((a, b) => a.value - b.value);
        if (assignModifiers.length !== 0) return assignModifiers[0].value;

        for (let i = 0; i < modifiers.length; i++)
            stat += modifiers[i].value;
        if (stat < 1) stat = 1;
        if (stat > 10) stat = 10;
        return stat;
    }

    /**
     * Calculates dice roll modifier based on the specified stat value.
     *
     * @param stat - The stat value.
     */
    getStatModifier(stat: number): number {
        const statMax = 10;
        return Math.floor(
            Math.floor((stat - statMax / 3) / 2) + (this.getGame().settings.diceMax - this.getGame().settings.diceMin) /
            this.getGame().settings.diceMax
        );
    }

    /**
     * Calculates the player's maximum carry weight in kilograms.
     */
    getMaxCarryWeight(): number {
        return round(1.783 * Math.pow(this.strength, 2) - 2 * this.strength + 22);
    }

    /**
     * Sets the player's current carry weight. Calls getContainedItemsWeight and sets the carry weight to that value.
     */
    updateCarryWeight(): void {
        this.carryWeight = this.getContainedItemsWeight();
    }

    /**
     * Gets all of the items this entity contains.
     */
    override getContainedItems(): InventoryItem[] {
        return this.getGame().entityFinder.getInventoryItems(undefined, this.name);
    }

    /**
     * Gets all of the items that should appear in the given item list.
     *
     * @param itemListName - The name of the item list. Either "equipment" or "hands".
     * @param player - The player the description is being sent to. Unused.
     */
    override getContainedItemsForItemList(itemListName?: "equipment" | "hands", player?: Player): InventoryItem[] {
        let equipmentSlots: EquipmentSlot[] = [];
        const playerHands = this.getGame().entityFinder.getPlayerHands(this);
        if (itemListName === "equipment") {
            const playerHandsIDs = playerHands.map(equipmentSlot => equipmentSlot.id);
            equipmentSlots = this.inventory.filter(equipmentSlot =>
                !playerHandsIDs.includes(equipmentSlot.id) && equipmentSlot.equippedItem !== null && !equipmentSlot.equippedItem.isCoveredByEquippedItem())
                .map(equipmentSlot => equipmentSlot);
        }
        else if (itemListName === "hands")
            equipmentSlots = playerHands.filter(equipmentSlot =>
                equipmentSlot.equippedItem !== null && !equipmentSlot.equippedItem.prefab.discreet
            );
        return equipmentSlots.map(equipmentSlot => equipmentSlot.equippedItem);
    }

    /**
     * Returns true if this entity contains an item with the given identifier or prefab ID.
     * @param identifier - The identifier or prefab ID to search for.
     */
    override containsItem(identifier: string): boolean {
        const containedItems = this.getContainedItems();
        for (const item of containedItems) {
            if (itemIdentifierMatches(item, identifier, true)) return true;
        }
        return false;
    }

    /**
     * Returns the item contained inside of this container with the given identifier or prefab ID.
     * If no such item exists, returns undefined.
     * @param identifier - The identifier or prefab ID to search for.
     */
    override getContainedItem(identifier: string): ItemInstance {
        return this.getGame().entityFinder.getInventoryItem(identifier, this.name);
    }

    override getContainedItemsWeight(): number {
        const containedItems = this.inventory.map(equipmentSlot => equipmentSlot.equippedItem).filter(item => item !== null);
        return round(containedItems.reduce((total, item) => total + (!isNaN(item.quantity) ? item.quantity * item.weight : 0), 0));
    }

    /**
     * Uses the player's inventory item.
     *
     * @param item - The inventory item to use.
     * @param target - The player the inventory item is to be used on. Defaults to the player using it.
     */
    async use(item: InventoryItem, target: Player = this): Promise<void> {
        for (let effect of item.prefab.effects) {
            const inflictAction = new InflictAction(this.getGame(), undefined, target, target.location, true);
            await inflictAction.performInflict(effect, true, true, true, item);
        }
        for (let cure of item.prefab.cures) {
            const cureAction = new CureAction(this.getGame(), undefined, target, target.location, true);
            cureAction.performCure(cure, true, true, true, item);
        }
        if (!isNaN(item.uses))
            item.decreaseUses();
    }

    /**
     * Takes an item and puts it in the player's inventory.
     *
     * @param item - The item to take.
     * @param handEquipmentSlot - The hand equipment slot to put the item in.
     * @param container - The item's current container.
     * @param inventorySlot - The {@link InventorySlot|inventory slot} the item is currently in.
     * @returns The inventory item that was put in the player's hand.
     */
    take(item: RoomItem, handEquipmentSlot: EquipmentSlot, container: RoomItemContainer, inventorySlot: InventorySlot<RoomItem>): InventoryItem {
        // Reduce quantity if the quantity is finite.
        if (!isNaN(item.quantity))
            item.quantity--;

        if (container instanceof RoomItem)
            container.removeItem(item, inventorySlot.id, 1);

        // Put the item in the player's hand.
        const createdItem = itemManager.putItemInHand(item, this, handEquipmentSlot);
        this.updateCarryWeight();
        return createdItem;
    }

    /**
     * Steals an inventory item from another player.
     *
     * @param item - The inventory item to steal.
     * @param handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param victim - The player to steal from.
     * @param container - An inventory item belonging to the victim that the player will attempt to steal from.
     * @param inventorySlot - The {@link InventorySlot|inventory slot} that the player will attempt to steal from.
     */
    steal(item: InventoryItem, handEquipmentSlot: EquipmentSlot, victim: Player, container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>): void {
        // Remove the item from its container.
        itemManager.removeStashedItem(item, container, inventorySlot, victim.inventory.get(item.equipmentSlot));
        // Put the item in the player's hand.
        itemManager.putItemInHand(item, this, handEquipmentSlot);
        victim.updateCarryWeight();
        this.updateCarryWeight();
    }

    /**
     * Drops an inventory item and puts it in the specified container in the room.
     *
     * @param item - The inventory item to drop.
     * @param handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param container - The container to put the item in.
     * @param inventorySlot - The {@link InventorySlot|inventory slot} to put the item in.
     */
    drop(item: InventoryItem, handEquipmentSlot: EquipmentSlot, container: Puzzle | Fixture | RoomItem, inventorySlot: InventorySlot<RoomItem>): void {
        // Unequip the item from the player's hand.
        handEquipmentSlot.unequipItem(item);

        // Convert the InventoryItem to a RoomItem.
        const inventorySlotId = inventorySlot ? inventorySlot.id : "";
        let createdItem = itemManager.convertInventoryItem(item, this, container, inventorySlotId, 1);
        createdItem.container = container;
        createdItem.slot = inventorySlotId;

        if (container instanceof RoomItem)
            container.insertItem(createdItem, inventorySlot.id);

        // Create a list of all the child items.
        let items: RoomItem[] = [];
        items.push(createdItem);
        itemManager.getChildItems(items, createdItem);
        // Now that the item has been converted, we can update the quantities of child items.
        itemManager.setChildItemQuantitiesZero(item);
        item.quantity = 0;
        // Insert the new items into the game's list of room items.
        itemManager.insertRoomItems(this.location, items);
        this.updateCarryWeight();
    }

    /**
     * Gives an inventory item to another player.
     *
     * @param item - The inventory item to give.
     * @param handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param recipient - The player to give the inventory item to.
     * @param recipientHandEquipmentSlot - The hand equipment slot of the recipient to put the item in.
     */
    give(item: InventoryItem, handEquipmentSlot: EquipmentSlot, recipient: Player, recipientHandEquipmentSlot: EquipmentSlot): void {
        // Unequip the item from the player's hand.
        handEquipmentSlot.unequipItem(item);

        // Put the item in the recipient's hand.
        const createdItem = itemManager.putItemInHand(item, recipient, recipientHandEquipmentSlot);
        this.updateCarryWeight();
        recipient.updateCarryWeight();
    }

    /**
     * Moves an inventory item from the player's hand into a container in their inventory.
     *
     * @param item - The inventory item to stash.
     * @param handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param container - The container to stash the inventory item in.
     * @param inventorySlot - The {@link InventorySlot|inventory slot} to stash the inventory item in.
     */
    stash(item: InventoryItem, handEquipmentSlot: EquipmentSlot, container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>): void {
        // Unequip the item from the player's hand.
        handEquipmentSlot.unequipItem(item);

        // Copy the inventory item to the given container.
        const equipmentSlot = this.inventory.get(container.equipmentSlot);
        let createdItem = itemManager.copyInventoryItem(item, this, equipmentSlot.id, 1);
        createdItem.containerName = `${container.identifier}/${inventorySlot.id}`;
        createdItem.container = container;
        createdItem.slot = inventorySlot.id;

        // Update container.
        container.insertItem(createdItem, inventorySlot.id);

        // Create a list of all the child items.
        let items: InventoryItem[] = [];
        items.push(createdItem);
        itemManager.getChildItems(items, createdItem);
        // Now that the item has been converted, we can update the quantities of child items.
        itemManager.setChildItemQuantitiesZero(item);
        // Insert the new inventory items into the game's list of inventory items.
        itemManager.insertInventoryItems(this, items, equipmentSlot);
    }

    /**
     * Moves an inventory item from a container in the player's inventory to the player's hand.
     *
     * @param item - The inventory item to unstash.
     * @param handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param container - The inventory item's current container.
     * @param inventorySlot - The {@link InventorySlot|inventory slot} the inventory item is currently in.
     */
    unstash(item: InventoryItem, handEquipmentSlot: EquipmentSlot, container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>): void {
        // Remove the inventory item from its container.
        itemManager.removeStashedItem(item, container, inventorySlot, this.inventory.get(item.equipmentSlot));
        // Put the item in the player's hand.
        itemManager.putItemInHand(item, this, handEquipmentSlot);
    }

    /**
     * Moves an inventory item from the player's hand to one of their {@link EquipmentSlot|equipment slots}.
     *
     * @param item - The inventory item to equip.
     * @param equipmentSlot - The equipment slot to equip the inventory item to.
     * @param handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     */
    equip(item: InventoryItem, equipmentSlot: EquipmentSlot, handEquipmentSlot: EquipmentSlot): void {
        // Unequip the item from the player's hand.
        handEquipmentSlot.unequipItem(item);

        // Copy the inventory item to the new equipment slot.
        let createdItem = itemManager.copyInventoryItem(item, this, equipmentSlot.id, 1);
        createdItem.setRow(equipmentSlot.row);

        // Equip the item to the player's equipment slot.
        equipmentSlot.equipItem(createdItem);
        // Create a list of all the child items.
        let items: InventoryItem[] = [];
        itemManager.getChildItems(items, createdItem);
        // Update the quantities of child items.
        itemManager.setChildItemQuantitiesZero(item);
        item.quantity = 0;
        // Insert the newly created item in the game's list of inventory items.
        itemManager.insertInventoryItems(this, items, equipmentSlot);
    }

    /**
     * Equips an inventory item to any of the player's {@link EquipmentSlot|equipment slots}.
     * This should only be used for newly created inventory items.
     *
     * @param item - The inventory item to equip.
     * @param equipmentSlot - The equipment slot to equip the inventory item to.
     */
    directEquip(item: InventoryItem, equipmentSlot: EquipmentSlot): void {
        item.setRow(equipmentSlot.row);
        equipmentSlot.equipItem(item);
        const handSlotIDs = this.getGame().entityFinder.getPlayerHands(this).map(equipmentSlot => equipmentSlot.id);
        if (!handSlotIDs.includes(equipmentSlot.id))
            item.executeEquippedCommands();
    }

    /**
     * Moves an inventory item from a player's {@link EquipmentSlot|equipment slot} to their hand.
     *
     * @param item - The inventory item to unequip.
     * @param equipmentSlot - The equipment slot the inventory item is currently equipped to.
     * @param handEquipmentSlot - The hand equipment slot to put the inventory item in.
     */
    unequip(item: InventoryItem, equipmentSlot: EquipmentSlot, handEquipmentSlot: EquipmentSlot): void {
        equipmentSlot.unequipItem(item);

        // Put the item in the player's hand.
        itemManager.putItemInHand(item, this, handEquipmentSlot);
        item.quantity = 0;
    }

    /**
     * Unequips an inventory item from a player's {@link EquipmentSlot|equipment slot} without moving it to their hand.
     * This should only be used for inventory items that are about to be destroyed.
     *
     * @param item - The inventory item to unequip.
     */
    directUnequip(item: InventoryItem): void {
        const equipmentSlot = this.inventory.get(item.equipmentSlot);
        equipmentSlot.unequipItem(item);
        const handSlotIDs = this.getGame().entityFinder.getPlayerHands(this).map(equipmentSlot => equipmentSlot.id);
        if (!handSlotIDs.includes(equipmentSlot.id))
            item.executeUnequippedCommands();
    }

    /**
     * Displays the player's inventory.
     *
     * @param moderatorView - Whether or not to use the identifier or prefab IDs of the player's inventory items. If this is false, the inventory item's name will be used instead.
     * @returns A string representation of the player's inventory.
     */
    viewInventory(moderatorView: boolean): string {
        const equipmentSlotOpener = `[`;
        const equipmentSlotCloser = `]`;
        const inventorySlotOpener = `(`;
        const inventorySlotCloser = `)`;
        const indent = "  ";

        const possessive = moderatorView ? `${this.name}'s` : `Your`;
        let itemString = `__${possessive} inventory:__\n`;
        this.inventory.forEach(equipmentSlot => {
            itemString += `- ${equipmentSlot.id}: `;
            const equippedItem = equipmentSlot.equippedItem;
            if (equippedItem === null) itemString += `${equipmentSlotOpener} ${equipmentSlotCloser}\n`;
            else {
                itemString += `${equipmentSlotOpener}${makeCopyable(moderatorView ? equippedItem.getIdentifier() : equippedItem.name)}${equipmentSlotCloser}\n`;
                let descendantsCount = 1;
                /**
                 * Generates a display of an inventory item's children.
                 *
                 * @param itemString - A string representation of the inventory item's name.
                 * @param item - The inventory item whose child items are being listed.
                 */
                let listChildItems = function (itemString: string, item: InventoryItem): string {
                    // If item is capable of holding other items, show what items it has inside.
                    item.inventory.forEach(inventorySlot => {
                        let parentItemIndexes: number[] = [];
                        for (let i = 0; i < descendantsCount; i++)
                            itemString += indent;
                        itemString += `- ${inventorySlot.id}: `;
                        if (inventorySlot.items.length === 0) itemString += `${inventorySlotOpener} ${inventorySlotCloser}`;
                        else {
                            itemString += inventorySlotOpener;
                            let inventorySlotItemNames: string[] = [];
                            inventorySlot.items.forEach((inventoryItem, i) => {
                                const childItem = inventoryItem;
                                const quantityString = childItem.quantity === 1 ? `` : `${childItem.quantity} `;
                                const childName = moderatorView ? childItem.getIdentifier()
                                    : childItem.quantity > 1 && childItem.pluralName ? childItem.pluralName
                                        : childItem.name;
                                inventorySlotItemNames.push(`${quantityString}${makeCopyable(childName)}`);
                                if (childItem.inventory.size !== 0) parentItemIndexes.push(i);
                            });
                            itemString += inventorySlotItemNames.join(") (");
                            itemString += inventorySlotCloser;
                            for (let i = 0; i < parentItemIndexes.length; i++) {
                                itemString += `\n`;
                                descendantsCount++;
                                itemString = listChildItems(itemString, inventorySlot.items[parentItemIndexes[i]]);
                                descendantsCount--;
                            }
                        }
                        if (itemString[itemString.length - 1] !== "\n") itemString += "\n";
                    });
                    return itemString;
                };
                itemString = listChildItems(itemString, equippedItem);
            }
        });
        return itemString.replace(/\n{2,}/g, "\n");
    }

    /**
     * Sets the player's process with the current recipe and ingredients.
     *
     * @param recipe - The recipe being processed.
     * @param ingredients - The collated ingredients being processed.
     * @param products - The products being processed. Unused, but included for use in descriptions.
     */
    #setProcess(recipe: Recipe, ingredients: CollatedItem<InventoryItem>[], products: InventoryItem[]): void {
        this.process.recipe = recipe;
        this.process.ingredients = ingredients;
        this.process.products = products;
    }

    /**
     * Sets the current process's recipe and duration to null, empties the process's lists of ingredients and products, and stops the process timer.
     */
    clearProcess(): void {
        this._clearProcess();
    }

    /**
     * Crafts held items according to a recipe.
     *
     * @param recipe - The recipe that describes how these ingredients are crafted.
     * @returns The resulting product(s).
     */
    craft(recipe: Recipe): CraftingResult {
        let heldItems = this.getGame().entityFinder.getPlayerHands(this).map(hand => hand.equippedItem).filter(item => item !== null);
        const ingredients = [...heldItems];
        const ingredientsFlat = this.#collateItems(ingredients);
        const satisfactoryProcessCount = recipe.getSatisfactoryProcessCount(ingredientsFlat);
        if (satisfactoryProcessCount < 1) return;
        const variableValues = recipe.getIngredientVariableValues(ingredientsFlat);
        const proceduralSelections = itemManager.combineProceduralSelections(ingredientsFlat);
        this.destroyIngredients(recipe, ingredientsFlat, satisfactoryProcessCount);
        const products = this.instantiateProducts<InventoryItem>(recipe, satisfactoryProcessCount, variableValues, proceduralSelections);
        this.#setProcess(recipe, ingredientsFlat, products);
        heldItems = this.getGame().entityFinder.getPlayerHands(this).map(hand => hand.equippedItem).filter(item => item !== null);
        this.updateCarryWeight();

        return { product1: heldItems.length > 0 ? heldItems[0] : null, product2: heldItems.length > 1 ? heldItems[1] : null };
    }

    /**
     * Reverses a crafting recipe to convert a single product into two ingredients.
     *
     * @param item - The product to uncraft.
     * @param recipe - The recipe that describes how this product is crafted.
     * @returns The resulting ingredients.
     */
    uncraft(item: InventoryItem, recipe: Recipe): UncraftingResult {
        // Make a copy of the original item for use later.
        const products = [itemManager.cloneInventoryItem(item)];
        // If only one ingredient is discreet, the first ingredient should be the discreet one.
        const oneDiscreet = !recipe.ingredients[0].prefab.discreet && recipe.ingredients[1].prefab.discreet ||
            recipe.ingredients[0].prefab.discreet && !recipe.ingredients[1].prefab.discreet;
        let ingredient1 = oneDiscreet && recipe.ingredients[0].prefab.discreet ? recipe.ingredients[0] : recipe.ingredients[1];
        let ingredient2 = oneDiscreet && recipe.ingredients[0].prefab.discreet ? recipe.ingredients[1] : recipe.ingredients[0];
        const proceduralSelections = item.proceduralSelections;

        const hands = this.getGame().entityFinder.getPlayerHands(this);
        const dominantHand = hands[0];
        /**
         * @privateRemarks
         * this may very well be undefined...
         * uncraft invocations should check for the existence of at least two hands
         */
        const auxiliaryHand = hands[1];
        const ingredient1Instance = itemManager.replaceInventoryItem(item, ingredient1.prefab);
        const instantiateAction = new InstantiateInventoryItemAction(this.getGame(), undefined, this, this.location, true);
        const ingredient2Instance = instantiateAction.performInstantiateInventoryItem(
            ingredient2.prefab,
            dominantHand.equippedItem === null ? dominantHand.id : auxiliaryHand.id,
            null,
            "",
            1,
            proceduralSelections,
            ingredient2.prefab.uses,
            false
        );
        let ingredients: InventoryItem[] = [];
        if (ingredient1Instance) ingredients.push(ingredient1Instance);
        if (ingredient2Instance) ingredients.push(ingredient2Instance[0]);
        const ingredientsFlat = this.#collateItems(ingredients);
        this.#setProcess(recipe, ingredientsFlat, products);
        this.updateCarryWeight();

        return { ingredient1: ingredient1Instance ? ingredient1Instance : null, ingredient2: ingredient2Instance ? ingredient2Instance[0] : null };
    }

    /**
     * Instantiates an inventory item in the player's inventory.
     *
     * @param prefab - The prefab to instantiate.
     * @param quantity - The quantity of the prefab to instantiate.
     * @param uses - The number of uses to instantiate the prefab with. Defaults to the prefab's number of uses.
     * @param proceduralSelections - The manually selected procedural possibilities.
     * @param container - The container to instantiate the prefab into. Defaults to null.
     * @param inventorySlotId - The ID of the {@link InventorySlot|inventory slot} to instantiate the item in.
     * @param player - The player to instantiate the item for. Defaults to the player calling the method.
     * @returns The instantiated inventory item.
     */
    protected override instantiate(prefab: Prefab, quantity: number, uses: number = prefab.uses, proceduralSelections: Map<string, string> = new Map(), container: InventoryItem = null, inventorySlotId: string = "", player = this): InventoryItem[] {
        const equipmentSlotId = container === null ? this.getGame().entityFinder.getPlayerFreeHand(player).id : container.equipmentSlot;
        const instantiateAction = new InstantiateInventoryItemAction(this.getGame(), undefined, player, player.location, true);
        return instantiateAction.performInstantiateInventoryItem(prefab, equipmentSlotId, container, inventorySlotId, quantity, proceduralSelections, uses, false) as InventoryItem[];
    }

    /**
     * Gets the actual ingredient item instance that was used as an ingredient in the currently processed recipe.
     * If no such item exists, returns the corresponding ingredient prefab of the currently processed recipe.
     * If no recipe is currently being processed, returns undefined.
     * @param prefabId - The prefab ID to search for.
     */
    public override getIngredientItem(prefabId: string): Prefab | InventoryItem {
        for (const ingredient of this.process.ingredients) {
            if (itemIdentifierMatches(ingredient.items[0], prefabId, true)) return ingredient.items[0];
        }
        return this.process.recipe?.ingredientsFlat.find(ingredient => ingredient.prefab.id === prefabId)?.prefab;
    }

    /**
     * Gets the actual product item instance that was instantiated in the currently processed recipe.
     * If no such item exists, returns the corresponding product prefab of the currently processed recipe.
     * If no recipe is currently being processed, returns undefined.
     * @param prefabId - The prefab ID to search for.
     */
    public override getProductItem(prefabId: string): Prefab | InventoryItem {
        for (const product of this.process.products) {
            if (itemIdentifierMatches(product, prefabId, true)) return product;
        }
        return this.process.recipe?.productsFlat.find(product => product.prefab.id === prefabId)?.prefab;
    }

    /**
     * Returns the player's inventory item whose prefab ID matches the given ID, if it exists.
     *
     * @param id - The prefab ID to search for.
     */
    findItem(id: string): InventoryItem {
        return this.getGame().inventoryItems.find(item =>
            item.player.name === this.name &&
            item.prefab !== null &&
            item.quantity > 0 &&
            item.prefab.id === id,
        );
    }

    /**
     * Returns true if the player has an inventory item with the given prefab ID.
     *
     * @param id - The prefab ID to search for.
     */
    hasItem(id: string): boolean {
        return !!this.findItem(id);
    }

    /**
     * Gets the equipment slot in the player's inventory with the given ID. If it doesn't exist, returns undefined.
     *
     * @param equipmentSlotId - The equipment slot ID to search for.
     */
    getEquipmentSlot(equipmentSlotId: string): EquipmentSlot {
        return this.inventory.get(equipmentSlotId);
    }

    /**
     * Returns true if the player has an item with the given identifier equipped to the given equipment slot.
     *
     * @param identifier - The item identifier to search for.
     * @param equipmentSlotId - The equipment slot ID it should be equipped to.
     */
    hasEquippedItem(identifier: string, equipmentSlotId: string): boolean {
        const equippedItem = this.getEquipmentSlot(equipmentSlotId)?.equippedItem;
        if (!equippedItem) return false;
        return itemIdentifierMatches(equippedItem, identifier, true);
    }

    /**
     * Returns an array of CollatedItems for the given items.
     */
    #collateItems(items: InventoryItem[]): CollatedItem<InventoryItem>[] {
        const childItems: InventoryItem[] = [];
        for (const item of items)
            itemManager.getChildItems(childItems, item);
        for (const childItem of childItems) {
            if (!items.includes(childItem))
                items.push(childItem);
        }
        return CollatedItem.collate(items);
    }

    /**
     * Returns true if the player can craft the given recipe.
     *
     * @param recipe - The recipe to check if the player can craft.
     * @param itemsInHands - The two items in the player's hands.
     */
    canCraft(recipe: Recipe, itemsInHands: [InventoryItem, InventoryItem]): boolean {
        return recipe.ingredientsMatch(this.#collateItems([...itemsInHands]));
    }

    /**
     * Kills the player.
     *
     * @param action - The action that caused the player to die.
     */
    async die(action: Action): Promise<void> {
        this.location.removePlayer(this);
        const whisperRemovalMessage = this.getGame().notificationGenerator.generateDieNotification(this, false);
        await this.removeFromWhispers(whisperRemovalMessage, action);
        const hidingSpot = this.getGame().entityFinder.getFixture(this.hidingSpot, this.location.id)?.hidingSpot ?? undefined;
        if (hidingSpot) await hidingSpot.removePlayers(this, action);
        // Update various data.
        this.alive = false;
        this.location = null;
        this.hidingSpot = "";
        this.statusDisplays.length = 0;
        this.stopMoving();
        this.stopFollowing();
        for (const status of this.status.values()) {
            if (status.timer !== null)
                status.timer.stop();
        }
        this.status.clear();
        // Move player to dead list.
        this.getGame().deadPlayers.set(Game.generateValidEntityName(this.name), this);
        // Then remove them from living list.
        this.getGame().livingPlayers.delete(Game.generateValidEntityName(this.name));
    }

    /**
     * Removes the player from all whispers they're in.
     *
     * @param narration - The text of the narration to send in the whisper channel when the player is removed.
     * @param action - The action that caused the player to be removed. If a narration is supplied, this is required.
     * @param removeFromParty - Whether or not to remove the player from party whispers. Defaults to true.
     */
    async removeFromWhispers(narration: string, action?: Action, removeFromParty: boolean = true): Promise<void> {
        for (const whisper of this.getGame().whispers.values()) {
            if (whisper.players.has(this.name) && (removeFromParty || whisper.type !== WhisperType.PARTY))
                await whisper.removePlayers(this, narration, action);
        }
    }

    /**
     * Sends a description to the player.
     *
     * @param descriptionString - The already-parsed description to send.
     * @param container - The game entity the description belongs to.
     * @param messageDisplayType - The display type of the message to send. Defaults to PLAIN_TEXT.
     * @param interactables - An array of interactables to send with the message.
     */
    sendDescription(descriptionString: string, container: GameEntity, messageDisplayType: typeof MessageDisplayType[keyof typeof MessageDisplayType] = MessageDisplayType.PLAIN_TEXT, interactables: Interactable[] = []): void {
        if (descriptionString && !this.isNPC && (this.isConscious() || container instanceof Status))
            this.getGame().communicationHandler.sendDescriptionToPlayer(this, descriptionString, container, messageDisplayType, true, interactables);
    }

    /**
     * Sends an already-parsed room description to the player.
     *
     * @param room - The room the description is for.
     * @param roomDescriptionString - The already-parsed room description.
     * @param occupantsString - A list of occupants in the room.
     * @param defaultDropFixtureString - A string to describe the default drop fixture in this room.
     * @param interactables - An array of interactables to send with the message.
     */
    sendRoomDescription(room: Room, roomDescriptionString: string, occupantsString: string, defaultDropFixtureString: string, interactables: Interactable[] = []): void {
        if (roomDescriptionString && !this.isNPC && this.isConscious())
            this.getGame().communicationHandler.sendRoomDescriptionToPlayer(this, room, roomDescriptionString, occupantsString, defaultDropFixtureString, interactables);
    }

    /**
     * Sends a direct message to the player. Sends nothing if the player is unconscious or an NPC.
     * @param notification - The notification to send.
     * @param force - If true, the message will be sent even if the player is unconscious. Defaults to false.
     */
    notify(notification: Notification, force = false): void {
        if (!this.isNPC && (force || this.isConscious()))
            this.getGame().communicationHandler.notifyPlayer(notification);
    }

    /**
     * Sets the player as online and initiates a timer that will mark them as offline after 15 minutes of inactivity.
     */
    setOnline(): void {
        if (this.isNPC) return;
        this.online = true;
        // Clear the existing timeout.
        if (this.#onlineInterval)
            clearTimeout(this.#onlineInterval);
        // Set the player as offline after 15 minutes of inactivity.
        let player = this;
        this.#onlineInterval = setTimeout(
            () => player.setOffline(),
            15 * 60000
        );
    }

    /**
     * Sets the player as offline.
     */
    setOffline(): void {
        if (this.isNPC) return;
        this.online = false;
        if (this.#onlineInterval)
            clearTimeout(this.#onlineInterval);
    }

    descriptionCell(): string {
        return this.getGame().constants.playerSheetDescriptionColumn + this.row;
    }

    getContainerIdentifier(): string {
        return this.getEntityID();
    }

    getContainerType(): string {
        return "Player";
    }

    getEntityID(): string {
        return this.name;
    }

    getLabel(field: PlayerField): string {
        switch (field) {
            case "id": return this.isNPC ? "Avatar URL" : "Discord ID";
            case "name": return "Name";
            case "title": return "Title";
            case "pronounString": return "Pronouns";
            case "originalVoiceString": return "Speaks With";
            case "defaultStrength": return "Strength";
            case "defaultPerception": return "Perception";
            case "defaultDexterity": return "Dexterity";
            case "defaultSpeed": return "Speed";
            case "defaultStamina": return "Stamina";
            case "alive": return "Alive?";
            case "location": return "Location";
            case "hidingSpot": return "Hiding Spot";
            case "status": return "Status Effects";
            case "description": return "Description";
        }
    }

    getValue(field: PlayerField): string {
        switch (field) {
            case "id": return this.id;
            case "name": return this.name;
            case "title": return this.title;
            case "pronounString": return this.pronounString;
            case "originalVoiceString": return this.originalVoiceString;
            case "defaultStrength": return String(this.defaultStrength);
            case "defaultPerception": return String(this.defaultPerception);
            case "defaultDexterity": return String(this.defaultDexterity);
            case "defaultSpeed": return String(this.defaultSpeed);
            case "defaultStamina": return String(this.defaultStamina);
            case "alive": return this.alive ? "TRUE" : "FALSE";
            case "location": return this.location?.displayName ?? "";
            case "hidingSpot": return this.hidingSpot;
            case "status": return this.getStatusList(true, true);
            case "description": return this.description.text;
        }
    }

    getViewField(field: PlayerField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): string {
        return "Player";
    }

    /**
     * Converts the name of a stat to its abbreviated form in all lowercase.
     */
    static abbreviateStatName(statName: string): string {
        statName = statName.toLowerCase().trim();
        if (statName === "strength")
            return "str";
        else if (statName === "perception" || statName === "intelligence" || statName === "int")
            return "per";
        else if (statName === "dexterity")
            return "dex";
        else if (statName === "speed")
            return "spd";
        else if (statName === "stamina")
            return "sta";
        else return statName;
    }
}
