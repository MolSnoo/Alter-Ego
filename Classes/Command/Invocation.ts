// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "discord.js";
import type GameEntity from "../../Data/GameEntity.ts";
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

/** Interface for ValidatedInvocation constructor args. */
interface ValidatedInvocationArgs {
    /** The key-value pairs of slot names to Game Entities. Multiple Game Entities allowed per key. */
    args?: Collection<string, ArrayNonEmpty<GameEntity>>;

    /** The key-value pairs of options to option maps. Each key on the map corresponds to another map, which is keyed for option names to booleans that are true if the option was specified, and false otherwise. */
    opts?: DefaultMap<string, DefaultMap<string, boolean>>;

    /** Any globbed data caught by the pattern matching. */
    glob?: string[];
}

/** Interface for MatchedInvocation constructor args. */
interface MatchedInvocationArgs {
    /** The key-value pairs of slot names to Game Entities. Multiple Game Entities allowed per key. */
    args?: Collection<string, ArrayNonEmpty<GameEntity>>;

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

/** Invocation whose arguments have been validated. */
export class ValidatedInvocation extends BaseInvocation<true, true> {
    /** The key-value pairs of slot names to Game Entities. Multiple Game Entities allowed per key. */
    args: Collection<string, ArrayNonEmpty<GameEntity>>;

    /** The key-value pairs of options to option maps. Each key on the map corresponds to another map, which is keyed for option names to booleans that are true if the option was specified, and false otherwise. */
    opts: DefaultMap<string, DefaultMap<string, boolean>>;

    /** Any globbed data caught by the pattern matching. */
    glob: string[];

    /**
     * @param args - The arguments object for the ValidatedInvocation constructor.
     */
    constructor(args: ValidatedInvocationArgs = {}) {
        super(true, true);
        this.args = args.args ?? new Collection();
        this.opts = args.opts ?? new DefaultMap(() => new DefaultMap(() => false));
        this.glob = args.glob ?? [];
    }

    getOpt(slot: string, option: string): boolean {
        return this.opts.get(slot).get(option);
    }

    getOpts(slot: string, option: string[]): boolean {
        for (const opt of option)
            if (this.opts.get(slot).get(opt)) return true;
        return false;
    }

    getRooms(patternSlot: string): ArrayNonEmpty<Room> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Room>;
    }

    getRoom(patternSlot: string): Room {
        return this.args.get(patternSlot)[0] as Room;
    }

    getExits(patternSlot: string): ArrayNonEmpty<Exit> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Exit>;
    }

    getExit(patternSlot: string): Exit {
        return this.args.get(patternSlot)[0] as Exit;
    }

    getFixtures(patternSlot: string): ArrayNonEmpty<Fixture> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Fixture>;
    }

    getFixture(patternSlot: string): Fixture {
        return this.args.get(patternSlot)[0] as Fixture;
    }

    getPrefabs(patternSlot: string): ArrayNonEmpty<Prefab> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Prefab>;
    }

    getPrefab(patternSlot: string): Prefab {
        return this.args.get(patternSlot)[0] as Prefab;
    }

    getInventorySlots(patternSlot: string): InventorySlot<any>[] {
        return this.args.get(patternSlot) as ArrayNonEmpty<InventorySlot<any>>;
    }

    getInventorySlot(patternSlot: string): InventorySlot<any> {
        return this.args.get(patternSlot)[0] as InventorySlot<any>;
    }

    getRecipes(patternSlot: string): ArrayNonEmpty<Recipe> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Recipe>;
    }

    getRecipe(patternSlot: string): Recipe {
        return this.args.get(patternSlot)[0] as Recipe;
    }

    getRoomItems(patternSlot: string): ArrayNonEmpty<RoomItem> {
        return this.args.get(patternSlot) as ArrayNonEmpty<RoomItem>;
    }

    getRoomItem(patternSlot: string): RoomItem {
        return this.args.get(patternSlot)[0] as RoomItem;
    }

    getPuzzles(patternSlot: string): ArrayNonEmpty<Puzzle> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Puzzle>;
    }

    getPuzzle(patternSlot: string): Puzzle {
        return this.args.get(patternSlot)[0] as Puzzle;
    }

    getEvents(patternSlot: string): ArrayNonEmpty<Event> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Event>;
    }

    getEvent(patternSlot: string): Event {
        return this.args.get(patternSlot)[0] as Event;
    }

    getStatuses(patternSlot: string): ArrayNonEmpty<Status> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Status>;
    }

    getStatus(patternSlot: string): Status {
        return this.args.get(patternSlot)[0] as Status;
    }

    getPlayers(patternSlot: string): ArrayNonEmpty<Player> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Player>;
    }

    getPlayer(patternSlot: string): Player {
        return this.args.get(patternSlot)[0] as Player;
    }

    getInventoryItems(patternSlot: string): ArrayNonEmpty<InventoryItem> {
        return this.args.get(patternSlot) as ArrayNonEmpty<InventoryItem>;
    }

    getInventoryItem(patternSlot: string): InventoryItem {
        return this.args.get(patternSlot)[0] as InventoryItem;
    }

    getEquipmentSlots(patternSlot: string): ArrayNonEmpty<EquipmentSlot> {
        return this.args.get(patternSlot) as ArrayNonEmpty<EquipmentSlot>;
    }

    getEquipmentSlot(patternSlot: string): EquipmentSlot {
        return this.args.get(patternSlot)[0] as EquipmentSlot;
    }

    getGestures(patternSlot: string): ArrayNonEmpty<Gesture> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Gesture>;
    }

    getGesture(patternSlot: string): Gesture {
        return this.args.get(patternSlot)[0] as Gesture;
    }

    getFlags(patternSlot: string): ArrayNonEmpty<Flag> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Flag>;
    }

    getFlag(patternSlot: string): Flag {
        return this.args.get(patternSlot)[0] as Flag;
    }
}

/** Invocation whose arguments have been matched. */
export class MatchedInvocation extends BaseInvocation<true, false> {
    /** The key-value pairs of slot names to Game Entities. Multiple Game Entities allowed per key. */
    args: Collection<string, ArrayNonEmpty<GameEntity>>;

    /** The key-value pairs of options to option maps. Each key on the map corresponds to another map, which is keyed for option names to booleans that are true if the option was specified, and false otherwise. */
    opts: DefaultMap<string, DefaultMap<string, boolean>>;

    /** Any globbed data caught by the pattern matching. */
    glob: string[];

    /**
     * @param args - The arguments object for the MatchedInvocation constructor.
     */
    constructor(args: MatchedInvocationArgs = {}) {
        super(true, false);
        this.args = args.args ?? new Collection();
        this.opts = args.opts ?? new DefaultMap(() => new DefaultMap(() => false));
        this.glob = args.glob ?? [];
    }

    getOpt(slot: string, option: string): boolean {
        return this.opts.get(slot).get(option);
    }

    getOpts(slot: string, option: string[]): boolean {
        for (const opt of option)
            if (this.opts.get(slot).get(opt)) return true;
        return false;
    }

    getRooms(patternSlot: string): ArrayNonEmpty<Room> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Room>;
    }

    getExits(patternSlot: string): ArrayNonEmpty<Exit> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Exit>;
    }

    getFixtures(patternSlot: string): ArrayNonEmpty<Fixture> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Fixture>;
    }

    getPrefabs(patternSlot: string): ArrayNonEmpty<Prefab> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Prefab>;
    }

    getInventorySlots(patternSlot: string): ArrayNonEmpty<InventorySlot<any>> {
        return this.args.get(patternSlot) as ArrayNonEmpty<InventorySlot<any>>;
    }

    getRecipes(patternSlot: string): ArrayNonEmpty<Recipe> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Recipe>;
    }

    getRoomItems(patternSlot: string): ArrayNonEmpty<RoomItem> {
        return this.args.get(patternSlot) as ArrayNonEmpty<RoomItem>;
    }

    getPuzzles(patternSlot: string): ArrayNonEmpty<Puzzle> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Puzzle>;
    }

    getEvents(patternSlot: string): ArrayNonEmpty<Event> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Event>;
    }

    getStatuses(patternSlot: string): ArrayNonEmpty<Status> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Status>;
    }

    getPlayers(patternSlot: string): ArrayNonEmpty<Player> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Player>;
    }

    getInventoryItems(patternSlot: string): ArrayNonEmpty<InventoryItem> {
        return this.args.get(patternSlot) as ArrayNonEmpty<InventoryItem>;
    }

    getEquipmentSlots(patternSlot: string): ArrayNonEmpty<EquipmentSlot> {
        return this.args.get(patternSlot) as ArrayNonEmpty<EquipmentSlot>;
    }

    getGestures(patternSlot: string): ArrayNonEmpty<Gesture> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Gesture>;
    }

    getFlags(patternSlot: string): ArrayNonEmpty<Flag> {
        return this.args.get(patternSlot) as ArrayNonEmpty<Flag>;
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
