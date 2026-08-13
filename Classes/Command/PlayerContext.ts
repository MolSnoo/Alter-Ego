// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getChildItems } from "../../Modules/itemManager.ts";
import { Collection } from "discord.js";
import Exit from "../../Data/Exit.ts";
import Fixture from "../../Data/Fixture.ts";
import InventoryItem from "../../Data/InventoryItem.ts";
import Player from "../../Data/Player.ts";
import Room from "../../Data/Room.ts";
import RoomItem from "../../Data/RoomItem.ts";
import type Game from "../../Data/Game.ts";
import EquipmentSlot from "../../Data/EquipmentSlot.ts";
import Context from "./Context.ts";
import { ConstantToken, EntityToken, ItemContainerToken, PocketToken, PrepositionToken, type Token } from "./Token.ts";
import Puzzle from "../../Data/Puzzle.ts";
import Gesture from "../../Data/Gesture.ts";
import type HidingSpot from "../../Data/HidingSpot.ts";
import type { Pattern } from "./Pattern.ts";
import type GameEntity from "../../Data/GameEntity.ts";
import type { CommandConfig } from "./Command.ts";

/**
 * Represents the in-game context of a new-generation player command.
 */
export default class PlayerContext extends Context {
    /**
     * The alias the command was invoked with.
     */
    readonly invokedAlias: string;

    /**
     * The message that invoked the command.
     */
    readonly message: UserMessage;

    /**
     * The player responsible for executing the command.
     */
    readonly player: Player;

    /**
     * The equipment slots of the player.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #equipmentSlots: Collection<string, EquipmentSlot> | undefined;

    /**
     * The inventory items held, equipped, or stashed by the player.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #inventoryItems: Set<InventoryItem> | undefined;

    /**
     * The hands of the player.
     * May be undefined. Consumers should use the corresponding private get method.
     */
    #hands: Collection<string, EquipmentSlot> | undefined;

    /**
     * Equipment slots of the player that are not their hands.
     * May be undefined. Consumers should use the corresponding private get method.
     */
    #notHands: Collection<string, EquipmentSlot> | undefined;

    /**
     * The inventory items held by the player.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #heldItems: Set<InventoryItem> | undefined;

    /**
     * The inventory items equipped by the player.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #equippedItems: Set<InventoryItem> | undefined;

    /**
     * The inventory items stashed by the player.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #stashedItems: Set<InventoryItem> | undefined;

    /**
     * The room the player occupies.
     */
    room: Room;

    /**
     * The fixture the player is currently hidden in, if applicable.
     * If the player is not hidden in a hiding spot, this is `null`.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #hidingSpot: HidingSpot | null | undefined;

    /**
     * The other players in the same room as the player.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #roomOccupants: Set<Player> | undefined;

    /**
     * The other players in the same hiding spot as the player.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #spotOccupants: Set<Player> | undefined;

    /**
     * The exits within the room.
     */
    exits: Collection<string, Exit>;

    /**
     * The rooms adjacent to the player's location.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #adjacentRooms: Set<Room> | undefined;

    /**
     * The fixtures within the room.
     * If the player is in a hiding spot, this will only be the fixture associated with the hiding spot.
     * May be undefined. Consumers should use the corresponding get method.
     */
    #fixtures: Set<Fixture> | undefined;

    /**
     * The puzzles within the room.
     * May be undefined. Consumers should use the corresponding get method.
     * @privateRemarks
     * If the player is in a hiding spot, this should only be the child puzzle of the fixture associated with the hiding spot.
     * I think, anyway. It might also be possible for it to be a puzzle with an identical name.
     * - VM
     * Update: It is not possible for it to be a puzzle with an identical name. The puzzle will only be considered accessible
     * to a hidden player if that puzzle is a child puzzle of the fixture they're hiding in.
     * - MS
     */
    #puzzles: Set<Puzzle> | undefined;

    /**
     * The room items within the room.
     * May be undefined. Consumers should use the corresponding get method.
     * @privateRemarks
     * If the player is in a hiding spot, this will only be the room items that are contained in the hiding spot, its child puzzle,
     * or any room items contained in those recursively. It might be useful to create a `getTopContainer` method for room items.
     * - VM
     */
    #roomItems: Set<RoomItem> | undefined;

    /**
     * The gestures of the game.
     */
    gestures: Collection<string, Gesture>;

    /**
     * @param game - The game to construct the context within.
     * @param player - The player to construct the context for.
     * @param invokedAlias - The alias the command was invoked with.
     * @param message - The message that invoked the command.
     */
    constructor(game: Game, player: Player, invokedAlias: string, message: UserMessage) {
        super(game);
        this.invokedAlias = invokedAlias;
        this.message = message;
        this.player = player;
        this.room = this.player.location;
        this.exits = this.room.exits;
        /**
         * @privateRemarks
         * It is actually intentional that players can attempt Puzzles that are not currently accessible.
         * Puzzle accessibility is evaluated dynamically based on its requirements, so they should not be filtered out.
         *
         * Fixtures should be filtered out if they are inaccessible, but according to the use_player command, they can
         * be activated or deactivated even if they are inaccessible, even if they cannot be inspected. This may or may
         * not be a bug. It makes little sense to allow players to (de)activate fixtures that they can't inspect, but
         * this may prevent a different bug from occurring when a Fixture that shares a name with a
         * Puzzle (a shower, for example) is used. When this occurs, if the accessibility of the Fixture and the Puzzle
         * contradict, and they are supposed to be in a synchronized state (activated when solved and deactivated when
         * unsolved), they may end up not being synchronized. We will likely need a solution for this conundrum.
         *
         * Filtering inaccessible roomItems out is fine, but now I wonder if it might be nice to simply determine that
         * dynamically, if their top-level container is a Puzzle. We could potentially use a get function for this, so
         * that their accessibility can be evaluated dynamically without moderators needing to issue a bot command every
         * time a puzzle is solved. This would be a good time to make such a change.
         * - DM
         */
        this.gestures = this.game.gestures;
    }

    /**
     * The equipment slots of the player.
     */
    get equipmentSlots(): Collection<string, EquipmentSlot> {
        if (!this.#equipmentSlots)
            this.#equipmentSlots = this.player.inventory;
        return this.#equipmentSlots;
    }

    /**
     * The inventory items held, equipped, or stashed by the player.
     */
    get inventoryItems(): Set<InventoryItem> {
        if (!this.#inventoryItems)
            this.#inventoryItems = new Set(this.player.getContainedItems().filter((item) => item !== null));
        return this.#inventoryItems;
    }

    /**
     * The hands of the player.
     */
    private get hands(): Collection<string, EquipmentSlot> {
        if (!this.#hands) {
            this.#hands = new Collection<string, EquipmentSlot>();
            this.game.entityFinder.getPlayerHands(this.player).forEach(hand => this.#hands.set(hand.id, hand));
        }
        return this.#hands;
    }

    /**
     * Equipment slots of the player that are not their hands.
     */
    private get notHands(): Collection<string, EquipmentSlot> {
        if (!this.#notHands)
            this.#notHands = this.player.inventory.filter((slot) => !this.hands.has(slot.id));
        return this.#notHands;
    }

    /**
     * The inventory items held by the player.
     */
    get heldItems(): Set<InventoryItem> {
        if (!this.#heldItems)
            this.#heldItems = new Set(this.hands.map(slot => slot.equippedItem).filter(item => item !== null));
        return this.#heldItems;
    }

    /**
     * The inventory items equipped by the player.
     */
    get equippedItems(): Set<InventoryItem> {
        if (!this.#equippedItems)
            this.#equippedItems = new Set(this.notHands.map(slot => slot.equippedItem).filter(item => item !== null));
        return this.#equippedItems;
    }

    /**
     * The inventory items stashed by the player.
     */
    get stashedItems(): Set<InventoryItem> {
        if (!this.#stashedItems) {
            const intermediateArray: InventoryItem[] = [];
            this.inventoryItems.forEach(item => getChildItems(intermediateArray, item));
            this.#stashedItems = new Set(intermediateArray);
        }
        return this.#stashedItems;
    }

    /**
     * The fixture the player is currently hidden in, if applicable.
     * If the player is not hidden in a hiding spot, this is `null`.
     */
    get hidingSpot(): HidingSpot | null {
        if (this.#hidingSpot === undefined)
            this.#hidingSpot = this.game.entityFinder.getFixture(this.player.hidingSpot, this.room.id)?.hidingSpot ?? null;
        return this.#hidingSpot;
    }

    /**
     * The other players in the same room as the player.
     */
    get roomOccupants(): Set<Player> {
        if (!this.#roomOccupants)
            this.#roomOccupants = new Set(this.room.occupants.filter(roomPlayer => roomPlayer !== this.player));
        return this.#roomOccupants;
    }

    /**
     * The other players in the same hiding spot as the player.
     * Will be empty if the player is in a hiding spot alone, or not in a hiding spot.
     */
    get spotOccupants(): Set<Player> {
        if (!this.#spotOccupants) {
            if (!this.hidingSpot)
                this.#spotOccupants = new Set();
            else
                this.#spotOccupants = new Set(this.room.occupants.filter(roomPlayer => roomPlayer.isHiddenWith(this.player) && roomPlayer !== this.player));
        }
        return this.#spotOccupants;
    }

    /**
     * The rooms adjacent to the player's location.
     */
    get adjacentRooms(): Set<Room> {
        if (!this.#adjacentRooms)
            this.#adjacentRooms = new Set(this.exits.map(exit => exit.dest).filter(room => room.id !== this.room.id));
        return this.#adjacentRooms;
    }

    /**
     * The fixtures within the room.
     * If the player is in a hiding spot, this will only be the fixture associated with the hiding spot.
     */
    get fixtures(): Set<Fixture> {
        if (!this.#fixtures) {
            this.#fixtures = new Set();
            if (this.hidingSpot)
                this.#fixtures.add(this.hidingSpot.getFixture());
            else
                this.game.entityFinder.getFixtures(undefined, this.room.id, true).forEach(fixture => this.#fixtures.add(fixture));
        }
        return this.#fixtures;
    }

    /**
     * The puzzles within the room.
     */
    get puzzles(): Set<Puzzle> {
        // TODO: "I think, anyway"...?
        // investigate what she meant by this, and implement puzzle lookup accordingly...
        if (!this.#puzzles)
            this.#puzzles = new Set(this.game.entityFinder.getPuzzles(undefined, this.room.id));
        return this.#puzzles;
    }

    /**
     * The room items within the room.
     */
    get roomItems(): Set<RoomItem> {
        // TODO: this is subject to similar uncertainty as puzzles...
        if (!this.#roomItems)
            this.#roomItems = new Set(this.room.getContainedItems().filter(item => item.accessible));
        return this.#roomItems;
    }

    getLexicon(patterns: Pattern[], config: CommandConfig<Set<string>>): Token[] {
        const prepositions: Set<string> = new Set();
        const constants: Set<string> = new Set();
        const tokens: Token[] = [];
        const types = patterns.reduce((acc, pattern) => acc.union(pattern.types), new Set<Constructor<GameEntity>>());

        for (const pattern of patterns) {
            for (const constant of pattern.constants) {
                if (!constants.has(constant)) {
                    tokens.push(new ConstantToken(constant));
                    constants.add(constant);
                }
            }
        }

        if (types.has(Player)) {
            for (const player of this.game.players.values()) {
                if (!config?.playerNameStyle || config?.playerNameStyle === 2) {
                    tokens.push(new EntityToken(player.displayName, player));
                    if (config?.possessivePlayer) {
                        tokens.push(new EntityToken(`${player.displayName}'s`, player));
                        tokens.push(new EntityToken(`${player.displayName}s`, player));
                    }
                }
                if (config?.playerNameStyle === 1 || config?.playerNameStyle === 2) {
                    tokens.push(new EntityToken(player.name, player));
                    if (config?.possessivePlayer) {
                        tokens.push(new EntityToken(`${player.name}'s`, player));
                        tokens.push(new EntityToken(`${player.name}s`, player));
                    }
                }
            }
        }

        if (types.has(EquipmentSlot))
            for (const slot of this.player.inventory.values())
                tokens.push(new EntityToken(slot.id, slot));

        if (types.has(InventoryItem)) {
            for (const item of this.inventoryItems) {
                if (item.prefab !== null && item.quantity > 0) {
                    const preposition = item.getPreposition();
                    tokens.push(new ItemContainerToken(item.name, item));
                    for (const [key, val] of item.inventory)
                        tokens.push(new PocketToken(key, val, item));
                    if (item.pluralName !== "")
                        tokens.push(new ItemContainerToken(item.pluralName, item));
                    if (!prepositions.has(preposition) && preposition !== "") {
                        prepositions.add(preposition);
                        tokens.push(new PrepositionToken(preposition));
                    }
                }
            }
        }

        if (types.has(RoomItem)) {
            for (const item of this.roomItems) {
                if (item.prefab !== null && item.quantity > 0) {
                    const preposition = item.getPreposition();
                    tokens.push(new ItemContainerToken(item.name, item));
                    for (const [key, val] of item.inventory)
                        tokens.push(new PocketToken(key, val, item));
                    if (item.pluralName !== "")
                        tokens.push(new ItemContainerToken(item.pluralName, item));
                    if (!prepositions.has(preposition) && preposition !== "") {
                        prepositions.add(preposition);
                        tokens.push(new PrepositionToken(preposition));
                    }
                }
            }
        }

        if (types.has(Fixture)) {
            for (const fixture of this.fixtures) {
                const preposition = fixture.getPreposition();
                tokens.push(new ItemContainerToken(fixture.name, fixture));
                if (!prepositions.has(preposition) && preposition !== "") {
                    prepositions.add(preposition);
                    tokens.push(new PrepositionToken(preposition));
                }
            }
        }

        if (types.has(Puzzle)) {
            for (const puzzle of this.puzzles) {
                const preposition = puzzle.getPreposition();
                tokens.push(new ItemContainerToken(puzzle.name, puzzle));
                if (!prepositions.has(preposition) && preposition !== "") {
                    prepositions.add(preposition);
                    tokens.push(new PrepositionToken(preposition));
                }
            }
        }

        if (types.has(Room))
            for (const room of this.adjacentRooms)
                tokens.push(new EntityToken(room.id, room));

        if (types.has(Exit))
            for (const exit of this.exits.values())
                tokens.push(new EntityToken(exit.name, exit));

        if (types.has(Gesture))
            for (const gesture of this.gestures.values())
                tokens.push(new EntityToken(gesture.id, gesture));

        return tokens;
    }
}
