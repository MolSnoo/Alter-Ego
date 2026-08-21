// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { generatePlayerListString } from "../Modules/helpers.ts";
import { WhisperType } from "../Modules/enums.ts";
import type Action from "./Action.ts";
import type Fixture from "./Fixture.ts";
import type Game from "./Game.ts";
import GameEntity from "./GameEntity.ts";
import type Player from "./Player.ts";
import type Room from "./Room.ts";
import Whisper from "./Whisper.ts";
import { Collection } from "discord.js";

/**
 * Represents a fixture that players can hide in. A fixture can have one or no hiding spots.
 * Each hiding spot has a capacity that indicates how many players can hide in it at once.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/hiding_spot.html
 */
export default class HidingSpot extends GameEntity {
    /**
     * The name of the hiding spot.
     */
    name: string;
    /**
     * The fixture this belongs to.
     */
    readonly #fixture: Fixture;
    /**
     * Whole number indicating how many players can hide in this hiding spot.
     */
    capacity: number;
    /**
     * A collection of players currently hidden in this hiding spot.
     * The key for each entry is the player's name.
     */
    occupants: Collection<string, Player>;
    /**
     * The whisper currently associated with this hiding spot. If no one is hidden in this hiding spot, this is null.
     */
    whisper: Whisper;

    /**
     * @param fixture - The fixture this belongs to.
     * @param capacity - Whole number indicating how many players can hide in this hiding spot.
     * @param row - The row number of the fixture in the sheet.
     * @param game - The game this belongs to.
     */
    constructor(fixture: Fixture, capacity: number, row: number, game: Game) {
        super(game, row);
        this.#fixture = fixture;
        this.name = this.#fixture.name;
        this.capacity = capacity;
        this.occupants = new Collection();
        this.whisper = null;
    }

    /**
     * Returns true if the given players can fit in this hiding spot in addition to the current occupants.
     *
     * @param players - The players to check.
     */
    canFit(players: Set<Player> | Player[] | Player): boolean {
        if (!(players instanceof Set) && !(players instanceof Array)) players = new Set([players]);
        if (!(players instanceof Set)) players = new Set(players);
        return this.occupants.size + players.size <= this.capacity;
    }

    /**
     * Returns true if the given player is currently hidden in this hiding spot.
     *
     * @param player - The player to check.
     */
    hasOccupant(player: Player): boolean {
        return this.occupants.has(player.name);
    }

    /**
     * Adds a list of players to the hiding spot.
     *
     * @param players - The players to add to the hiding spot.
     */
    async addPlayers(players: Set<Player> | Player[] | Player): Promise<void> {
        if (!(players instanceof Set) && !(players instanceof Array)) players = new Set([players]);
        if (!(players instanceof Set)) players = new Set(players);
        await this.deleteWhisper();
        for (const player of players) {
            this.occupants.set(player.name, player);
            player.hidingSpot = this.name;
        }
        await this.createWhisper();
    }

    /**
     * Removes a list of players from the hiding spot.
     *
     * @param players - The players to remove from the hiding spot.
     * @param action - The action that caused the players to be removed.
     */
    async removePlayers(players: Set<Player> | Player[] | Player, action?: Action): Promise<void> {
        if (!(players instanceof Set) && !(players instanceof Array)) players = new Set([players]);
        if (!(players instanceof Set)) players = new Set(players);
        for (const player of players) {
            this.occupants.delete(player.name);
            const whisperNarration = action ? this.getGame().notificationGenerator.generateEmergeNotification(player, players, false, this.getContainingPhrase()) : "";
            await player.removeFromWhispers(whisperNarration, action, false);
            player.hidingSpot = "";
        }
        if (this.occupants.size === 0) await this.deleteWhisper();
    }

    /**
     * Creates a whisper for the hiding spot if one does not already exist.
     * The created whisper is automatically assigned to the hiding spot.
     */
    async createWhisper(): Promise<void> {
        if (this.whisper) return;
        this.whisper = await this.getGame().entityLoader.createWhisper(this.occupants, this.name, WhisperType.HIDING_SPOT);
    }

    /**
     * Removes all occupants from the whisper and sets it to null.
     */
    async deleteWhisper(): Promise<void> {
        for (const occupant of this.occupants.values())
            await occupant.removeFromWhispers("", undefined, false);
        this.whisper = null;
    }

    /**
     * Gets the fixture this belongs to.
     */
    getFixture(): Fixture {
        return this.#fixture;
    }

    /**
     * Gets the fixture's name preceded by "the".
     * It will not be preceded by "the" if its name ends in a number.
     */
    getContainingPhrase(): string {
        return this.#fixture.getContainingPhrase();
    }

    /**
     * Gets a preposition to use when referring to the hiding spot's fixture.
     */
    getPreposition(): string {
        return "in";
    }

    /**
     * Gets the room this hiding spot is in.
     */
    getLocation(): Room {
        return this.#fixture.location;
    }

    /**
     * Generates a string representing the occupants of the hiding spot.
     *
     * @param viewerHasNoSightBehaviorAttribute - Whether or not to return a vague list indicating the quantity of occupants. Defaults to `false`.
     */
    generateOccupantsString(viewerHasNoSightBehaviorAttribute: boolean = false): string {
        if (viewerHasNoSightBehaviorAttribute)
            return this.occupants.size > 1
                ? `${String(this.occupants.size)} people`
                : this.occupants.size === 1
                    ? `someone`
                    : ``;
        return generatePlayerListString(this.occupants.map(player => player));
    }

    override getEntityType(): "HidingSpot" {
        return "HidingSpot";
    }
}
