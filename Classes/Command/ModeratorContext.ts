// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import EquipmentSlot from "../../Data/EquipmentSlot.ts";
import Event from "../../Data/Event.ts";
import Exit from "../../Data/Exit.ts";
import Fixture from "../../Data/Fixture.ts";
import Flag from "../../Data/Flag.ts";
import type Game from "../../Data/Game.ts";
import type GameEntity from "../../Data/GameEntity.ts";
import Gesture from "../../Data/Gesture.ts";
import InventoryItem from "../../Data/InventoryItem.ts";
import type Moderator from "../../Data/Moderator.ts";
import Player from "../../Data/Player.ts";
import Prefab from "../../Data/Prefab.ts";
import Puzzle from "../../Data/Puzzle.ts";
import Room from "../../Data/Room.ts";
import RoomItem from "../../Data/RoomItem.ts";
import Status from "../../Data/Status.ts";
import type { CommandConfig } from "./Command.ts";
import Context from "./Context.ts";
import type { Pattern } from "./Pattern.ts";
import { ConstantToken, EntityToken, ItemContainerToken, PocketToken, PrepositionToken, type Token } from "./Token.ts";

/**
 * Represents the command context of a new-generation moderator command.
 */
export default class ModeratorContext extends Context {
    /**
     * Alias the command was invoked with.
     */
    readonly invokedAlias: string;

    /**
     * Message that invoked the command.
     */
    readonly message: UserMessage;

    /**
     * Moderator that invoked the command.
     */
    readonly moderator: Moderator;

    /**
     * @param game - The game containing all objects of this context.
     * @param invoked - The alias the command was invoked with.
     * @param message - The message that invoked the command.
     * @param moderator - The moderator that invoked the command.
     */
    constructor(game: Game, invoked: string, message: UserMessage, moderator: Moderator) {
        super(game);
        this.invokedAlias = invoked;
        this.message = message;
        this.moderator = moderator;
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

        if (types.has(Player) || types.has(EquipmentSlot)) {
            for (const player of this.game.players.values()) {
                if (types.has(Player)) {
                    if (!config?.playerNameStyle || config?.playerNameStyle === 2) {
                        tokens.push(new EntityToken(player.name, player));
                        if (config?.possessivePlayer) {
                            tokens.push(new EntityToken(`${player.name}s`, player));
                        }
                    }
                    if (config?.playerNameStyle === 1 || config?.playerNameStyle === 2) {
                        tokens.push(new EntityToken(player.displayName, player));
                        if (config?.possessivePlayer) {
                            tokens.push(new EntityToken(`${player.displayName}s`, player));
                        }
                    }
                }
                if (types.has(EquipmentSlot))
                    for (const slot of player.inventory.values())
                        tokens.push(new EntityToken(slot.id, slot));
            }
        }

        if (types.has(InventoryItem)) {
            for (const item of this.game.inventoryItems) {
                if (item.prefab !== null && item.quantity > 0) {
                    tokens.push(new ItemContainerToken(item.prefabId, item));
                    if (item.getIdentifier() !== item.prefabId)
                        tokens.push(new ItemContainerToken(item.getIdentifier(), item));
                    for (const [key, val] of item.inventory)
                        tokens.push(new PocketToken(key, val, item));
                    if (!prepositions.has(item.getPreposition())) {
                        const preposition = item.getPreposition();
                        prepositions.add(preposition);
                        tokens.push(new PrepositionToken(preposition));
                    }
                }
            }
        }

        if (types.has(RoomItem)) {
            for (const item of this.game.roomItems) {
                if (item.prefab !== null && item.quantity > 0) {
                    tokens.push(new ItemContainerToken(item.getIdentifier(), item));
                    for (const [key, val] of item.inventory)
                        tokens.push(new PocketToken(key, val, item));
                    if (!prepositions.has(item.getPreposition())) {
                        const preposition = item.getPreposition();
                        prepositions.add(preposition);
                        tokens.push(new PrepositionToken(preposition));
                    }
                }
            }
        }

        if (types.has(Fixture)) {
            for (const fixture of this.game.fixtures) {
                tokens.push(new ItemContainerToken(fixture.name, fixture));
                if (!prepositions.has(fixture.getPreposition())) {
                    const preposition = fixture.getPreposition();
                    prepositions.add(preposition);
                    tokens.push(new PrepositionToken(preposition));
                }
            }
        }

        if (types.has(Puzzle)) {
            for (const puzzle of this.game.puzzles) {
                const preposition = puzzle.getPreposition();
                tokens.push(new ItemContainerToken(puzzle.name, puzzle));
                if (!prepositions.has(preposition) && preposition !== "") {
                    prepositions.add(preposition);
                    tokens.push(new PrepositionToken(preposition));
                }
            }
        }

        if (types.has(Room) || types.has(Exit)) {
            for (const room of this.game.rooms.values()) {
                if (types.has(Room)) {
                    const spacedName = room.id.replace(/-/g, " ");
                    tokens.push(new EntityToken(room.id, room));
                    if (room.id !== spacedName)
                        tokens.push(new EntityToken(room.id.replace(/-/g, " "), room));
                }
                if (types.has(Exit))
                    for (const exit of room.exits.values())
                        tokens.push(new EntityToken(exit.name, exit));
            }
        }

        if (types.has(Event))
            for (const event of this.game.events.values())
                tokens.push(new EntityToken(event.id, event));

        if (types.has(Flag))
            for (const flag of this.game.flags.values())
                tokens.push(new EntityToken(flag.id, flag));

        if (types.has(Prefab))
            for (const prefab of this.game.prefabs.values())
                tokens.push(new EntityToken(prefab.id, prefab));

        if (types.has(Status))
            for (const status of this.game.statusEffects.values())
                tokens.push(new EntityToken(status.id, status));

        if (types.has(Gesture))
            for (const gesture of this.game.gestures.values())
                tokens.push(new EntityToken(gesture.id, gesture));

        return tokens;
    }
}
