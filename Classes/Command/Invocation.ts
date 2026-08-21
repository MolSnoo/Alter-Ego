// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "discord.js";
import type Room from "../../Data/Room.ts";
import type Exit from "../../Data/Exit.ts";
import type Fixture from "../../Data/Fixture.ts";
import type Prefab from "../../Data/Prefab.ts";
import type InventorySlot from "../../Data/InventorySlot.ts";
import type Recipe from "../../Data/Recipe.ts";
import type RoomItem from "../../Data/RoomItem.ts";
import type Puzzle from "../../Data/Puzzle.ts";
import type Event from "../../Data/Event.ts";
import type Status from "../../Data/Status.ts";
import type Player from "../../Data/Player.ts";
import type InventoryItem from "../../Data/InventoryItem.ts";
import type EquipmentSlot from "../../Data/EquipmentSlot.ts";
import type Gesture from "../../Data/Gesture.ts";
import type Flag from "../../Data/Flag.ts";
import DefaultMap from "../DefaultMap.ts";

/** Interface for ResolvedInvocation constructor args. */
interface ResolvedInvocationArgs {
    /** The key-value pairs of slot names to Game Entities. Multiple Game Entities allowed per key. */
    args?: Collection<string, ArrayNonEmpty<InstantiatedGameEntity>>;

    /** The key-value pairs of options to option maps. Each key on the map corresponds to another map, which is keyed for option names to booleans that are true if the option was specified, and false otherwise. */
    opts?: DefaultMap<string, DefaultMap<string, boolean>>;

    /** Any globbed data caught by the pattern matching. */
    glob?: string[];
}

/** Abstract class representing all Invocations. */
abstract class BaseInvocation<M extends boolean, V extends boolean> {
    private readonly _matched: M;

    private readonly _validated: V;

    /**
     * @param matched - Whether this Invocation is a Matched invocation.
     * @param validated - Whether this Invocation is a Validated invocation.
     */
    protected constructor(matched: M, validated: V) {
        this._matched = matched;
        this._validated = validated;
    }

    /** Whether this Invocation is Matched. */
    public get matched(): M {
        return this._matched;
    }

    /** Whether this Invocation is Validated. */
    public get validated(): V {
        return this._validated;
    }
}

/** Abstract class representing all Invocations that contain Args, Opts, and Glob. */
abstract class ResolvedInvocation<V extends boolean> extends BaseInvocation<true, V> {
    /** The key-value pairs of slot names to Game Entities. Multiple Game Entities allowed per key. */
    args: Collection<string, ArrayNonEmpty<InstantiatedGameEntity>>;

    /** The key-value pairs of options to option maps. Each key on the map corresponds to another map, which is keyed for option names to booleans that are true if the option was specified, and false otherwise. */
    opts: DefaultMap<string, DefaultMap<string, boolean>>;

    /** Any globbed data caught by the pattern matching. */
    glob: string[];

    /**
     * @param validated - Whether this Invocation is a Validated invocation.
     * @param args - The arguments, options, and glob array of the Invocation.
     */
    constructor(validated: V, args: ResolvedInvocationArgs) {
        super(true, validated);
        this.args = args.args ?? new Collection();
        this.opts = args.opts ?? new DefaultMap(() => new DefaultMap(() => false));
        this.glob = args.glob ?? [];
    }

    /**
     * Look up the value of an Option.
     * @param slot - The slot to look up.
     * @param option - The option to look up.
     * @returns A boolean corresponding to the presence of the Option in user input. Will always be false if not matched.
     */
    getOpt(slot: string, option: string): boolean {
        return this.opts.get(slot).get(option);
    }

    /**
     * Look up the values of an Option.
     * @param slot - The slot to look up.
     * @param option - The options to look up.
     * @returns A boolean corresponding to the presence of any of the Options in user input. Will always be false if not matched.
     */
    getOpts(slot: string, option: string[]): boolean {
        for (const opt of option)
            if (this.opts.get(slot).get(opt)) return true;
        return false;
    }

    /**
     * Look up a slot name and return the corresponding arguments.
     * @param patternSlot - The pattern slot to look up.
     * @returns The game entity corresponding to the name of the given pattern slot. Will be undefined if that pattern slot was not matched.
     */
    getArgs(patternSlot: string): ArrayNonEmpty<InstantiatedGameEntity> | undefined {
        return this.args.get(patternSlot);
    }

    getRooms(patternSlot: string): ArrayNonEmpty<Room> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Room");
        return output.length > 0 ? output as ArrayNonEmpty<Room> : undefined;
    }

    getExits(patternSlot: string): ArrayNonEmpty<Exit> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Exit");
        return output.length > 0 ? output as ArrayNonEmpty<Exit> : undefined;
    }

    getFixtures(patternSlot: string): ArrayNonEmpty<Fixture> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Fixture");
        return output.length > 0 ? output as ArrayNonEmpty<Fixture> : undefined;
    }

    getPrefabs(patternSlot: string): ArrayNonEmpty<Prefab> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Prefab");
        return output.length > 0 ? output as ArrayNonEmpty<Prefab> : undefined;
    }

    getInventorySlots(patternSlot: string): ArrayNonEmpty<InventorySlot<RoomItem> | InventorySlot<InventoryItem>> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "InventorySlot");
        return output.length > 0 ? output as ArrayNonEmpty<InventorySlot<RoomItem> | InventorySlot<InventoryItem>> : undefined;
    }

    getRecipes(patternSlot: string): ArrayNonEmpty<Recipe> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Recipe");
        return output.length > 0 ? output as ArrayNonEmpty<Recipe> : undefined;
    }

    getRoomItems(patternSlot: string): ArrayNonEmpty<RoomItem> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "RoomItem");
        return output.length > 0 ? output as ArrayNonEmpty<RoomItem> : undefined;
    }

    getPuzzles(patternSlot: string): ArrayNonEmpty<Puzzle> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Puzzle");
        return output.length > 0 ? output as ArrayNonEmpty<Puzzle> : undefined;
    }

    getEvents(patternSlot: string): ArrayNonEmpty<Event> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Event");
        return output.length > 0 ? output as ArrayNonEmpty<Event> : undefined;
    }

    getStatuses(patternSlot: string): ArrayNonEmpty<Status> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Status");
        return output.length > 0 ? output as ArrayNonEmpty<Status> : undefined;
    }

    getPlayers(patternSlot: string): ArrayNonEmpty<Player> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Player");
        return output.length > 0 ? output as ArrayNonEmpty<Player> : undefined;
    }

    getInventoryItems(patternSlot: string): ArrayNonEmpty<InventoryItem> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "InventoryItem");
        return output.length > 0 ? output as ArrayNonEmpty<InventoryItem> : undefined;
    }

    getEquipmentSlots(patternSlot: string): ArrayNonEmpty<EquipmentSlot> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "EquipmentSlot");
        return output.length > 0 ? output as ArrayNonEmpty<EquipmentSlot> : undefined;
    }

    getGestures(patternSlot: string): ArrayNonEmpty<Gesture> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Gesture");
        return output.length > 0 ? output as ArrayNonEmpty<Gesture> : undefined;
    }

    getFlags(patternSlot: string): ArrayNonEmpty<Flag> | undefined {
        const lookup = this.getArgs(patternSlot);
        if (!lookup)
            return undefined;
        const output = lookup.filter(entity => entity.getEntityType() === "Flag");
        return output.length > 0 ? output as ArrayNonEmpty<Flag> : undefined;
    }
}

/** Invocation whose arguments have been validated. */
export class ValidatedInvocation extends ResolvedInvocation<true> {
    /**
     * @param args - The arguments object for the ValidatedInvocation constructor.
     */
    constructor(args: ResolvedInvocationArgs = {}) {
        super(true, args);
    }

    getRoom(patternSlot: string): Room | undefined {
        const lookup = this.getRooms(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getExit(patternSlot: string): Exit | undefined {
        const lookup = this.getExits(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getPrefab(patternSlot: string): Prefab | undefined {
        const lookup = this.getPrefabs(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getInventorySlot(patternSlot: string): InventorySlot<RoomItem> | InventorySlot<InventoryItem> | undefined {
        const lookup = this.getInventorySlots(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getRecipe(patternSlot: string): Recipe | undefined {
        const lookup = this.getRecipes(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getRoomItem(patternSlot: string): RoomItem | undefined {
        const lookup = this.getRoomItems(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getPuzzle(patternSlot: string): Puzzle | undefined {
        const lookup = this.getPuzzles(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getEvent(patternSlot: string): Event | undefined {
        const lookup = this.getEvents(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getStatus(patternSlot: string): Status | undefined {
        const lookup = this.getStatuses(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getPlayer(patternSlot: string): Player | undefined {
        const lookup = this.getPlayers(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getInventoryItem(patternSlot: string): InventoryItem | undefined {
        const lookup = this.getInventoryItems(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getEquipmentSlot(patternSlot: string): EquipmentSlot | undefined {
        const lookup = this.getEquipmentSlots(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getGesture(patternSlot: string): Gesture | undefined {
        const lookup = this.getGestures(patternSlot);
        return lookup ? lookup[0] : undefined;
    }

    getFlag(patternSlot: string): Flag | undefined {
        const lookup = this.getFlags(patternSlot);
        return lookup ? lookup[0] : undefined;
    }
}

/** Invocation whose arguments have been matched. */
export class MatchedInvocation extends ResolvedInvocation<false> {
    /**
     * @param args - The arguments object for the MatchedInvocation constructor.
     */
    constructor(args: ResolvedInvocationArgs = {}) {
        super(false, args);
    }
}

/** Invocation whose arguments have been invalidated. */
export class InvalidInvocation extends BaseInvocation<false, false> {
    /** The list of errors in the Invocation. */
    errors: ArrayNonEmpty<string>;

    /**
     * @param errors - The list of errors in the Invocation.
     */
    constructor(errors: ArrayNonEmpty<string>) {
        super(false, false);
        this.errors = errors;
    }
}

export type MatchResult = MatchedInvocation | InvalidInvocation;
export type ValidationResult = ValidatedInvocation | InvalidInvocation;
export type Invocation = ValidatedInvocation | MatchedInvocation | InvalidInvocation;
