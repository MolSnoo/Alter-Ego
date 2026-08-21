// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Room from "../Data/Room.ts";
import Whisper from "../Data/Whisper.ts";
import Moderator from "../Data/Moderator.ts";
import type Event from "../Data/Event.ts";
import type Fixture from "../Data/Fixture.ts";
import type Flag from "../Data/Flag.ts";
import type Game from "../Data/Game.ts";
import Party from "../Data/Party.ts";
import type Player from "../Data/Player.ts";
import type Prefab from "../Data/Prefab.ts";
import type Puzzle from "../Data/Puzzle.ts";
import type Status from "../Data/Status.ts";
import type { Collection, GuildMember, TextChannel } from "discord.js";
import { WhisperType } from "../Modules/enums.ts";

/**
 * A set of functions to manage game entities.
 */
export default abstract class GameEntityManager {
    /**
     * The game this belongs to.
     */
    readonly game: Game;

    /**
     * @param game - The game this belongs to.
     */
    protected constructor(game: Game) {
        this.game = game;
    }

    /**
     * Clears all game data from memory.
     */
    protected async clearGame(): Promise<void> {
        this.clearRooms();
        await this.clearFixtures();
        this.clearPrefabs();
        this.clearRecipes();
        this.clearRoomItems();
        this.clearPuzzles();
        this.clearEvents();
        this.clearStatusEffects();
        this.clearPlayers();
        this.clearInventoryItems();
        this.clearGestures();
        this.clearFlags();
    }

    /**
     * Clears all room data from memory.
     */
    protected clearRooms(): void {
        this.game.rooms.clear();
    }

    /**
     * Clears all fixture data from memory.
     */
    protected async clearFixtures(): Promise<void> {
        for (const fixture of this.game.fixtures) {
            if (fixture.recipeInterval !== null)
                fixture.recipeInterval.stop();
            if (fixture.process.timer !== null)
                fixture.process.timer.stop();
            if (fixture.hidingSpot !== null) {
                await fixture.hidingSpot.deleteWhisper();
                fixture.hidingSpot.occupants.clear();
            }
        }
        this.game.fixtures.length = 0;
    }

    /**
     * Clears all prefab data from memory.
     */
    protected clearPrefabs(): void {
        this.game.prefabs.clear();
    }

    /**
     * Clears all recipe data from memory.
     */
    protected clearRecipes(): void {
        this.game.recipes.length = 0;
    }

    /**
     * Clears all room item data from memory.
     */
    protected clearRoomItems(): void {
        this.game.roomItems.length = 0;
    }

    /**
     * Clears all puzzle data from memory.
     */
    protected clearPuzzles(): void {
        this.game.puzzles.length = 0;
    }

    /**
     * Clears all event data from memory.
     */
    protected clearEvents(): void {
        this.game.events.forEach(event => {
            if (event.timer !== null)
                event.timer.stop();
            if (event.effectsTimer !== null)
                event.effectsTimer.stop();
        });
        this.game.events.clear();
    }

    /**
     * Clears all status effect data from memory.
     */
    protected clearStatusEffects(): void {
        this.game.statusEffects.clear();
    }

    /**
     * Clears all player data from memory.
     */
    protected clearPlayers(): void {
        this.game.players.forEach(player => {
            player.status.values().forEach(status => {
                if (status.timer !== null)
                    status.timer.stop();
            });
            player.stopMoving();
            player.stopFollowing();
            player.setOffline();
        });
        this.game.rooms.forEach(room => {
            room.occupants.length = 0;
        });
        this.game.players.clear();
        this.game.livingPlayers.clear();
        this.game.deadPlayers.clear();
    }

    /**
     * Clears all inventory item data from memory.
     */
    protected clearInventoryItems(): void {
        this.game.inventoryItems.length = 0;
    }

    /**
     * Clears all gesture data from memory.
     */
    protected clearGestures(): void {
        this.game.gestures.clear();
    }

    /**
     * Clears all flag data from memory.
     */
    protected clearFlags(): void {
        this.game.flags.clear();
    }

    /**
     * Updates references to a given room throughout the game.
     * @param room - The room to reference.
     */
    protected updateRoomReferences(room: Room): void {
        this.game.livingPlayers.forEach(player => {
            if (Room.generateValidId(player.locationDisplayName) === room.id)
                room.addPlayer(player);
        });
        this.game.fixtures.forEach(fixture => {
            if (Room.generateValidId(fixture.locationDisplayName) === room.id)
                fixture.setLocation(room);
        });
        this.game.roomItems.forEach(roomItem => {
            if (Room.generateValidId(roomItem.locationDisplayName) === room.id)
                roomItem.setLocation(room);
        });
        this.game.puzzles.forEach(puzzle => {
            if (Room.generateValidId(puzzle.locationDisplayName) === room.id)
                puzzle.setLocation(room);
        });
        this.game.whispers.forEach(whisper => {
            if (whisper.locationId === room.id)
                whisper.setLocation(room);
        });
    }

    /**
     * Updates references to a given fixture throughout the game.
     * @param fixture - The fixture to reference.
     */
    protected async updateFixtureReferences(fixture: Fixture): Promise<void> {
        this.game.roomItems.forEach(roomItem => {
            if (roomItem.location?.id === fixture.location?.id && roomItem.containerType === "Fixture" && roomItem.containerName === fixture.name)
                roomItem.setContainer(fixture);
        });
        this.game.puzzles.forEach(puzzle => {
            if (puzzle.location?.id === fixture.location?.id && puzzle.parentFixtureName !== "" && puzzle.parentFixtureName === fixture.name)
                puzzle.setParentFixture(fixture);
        });
        if (fixture.hidingSpot) {
            const hidingSpot = fixture.hidingSpot;
            this.game.livingPlayers.forEach(player => {
                if (player.location?.id === fixture.location?.id && player.hidingSpot === hidingSpot.name)
                    hidingSpot.occupants.set(player.name, player);
            });
            if (hidingSpot.occupants.size > 0)
                await hidingSpot.createWhisper();
        }
    }

    /**
     * Updates references to a given prefab throughout the game.
     * @param prefab - The prefab to reference.
     */
    protected updatePrefabReferences(prefab: Prefab): void {
        this.game.roomItems.forEach(roomItem => {
            if (roomItem.prefabId === prefab.id) {
                roomItem.setPrefab(prefab);
                roomItem.setNames();
            }
        });
        this.game.inventoryItems.forEach(inventoryItem => {
            if (inventoryItem.prefabId !== "" && inventoryItem.prefabId === prefab.id) {
                inventoryItem.setPrefab(prefab);
                inventoryItem.setNames();
            }
        });
        this.game.puzzles.forEach(puzzle => {
            puzzle.requirementsStrings.forEach((requirementsString, i) => {
                if (requirementsString.type === "Prefab" && requirementsString.entityId === prefab.id)
                    puzzle.requirements[i] = prefab;
            });
        });
    }

    /**
     * Updates references to a given puzzle throughout the game.
     * @param puzzle - The puzzle to reference.
     */
    protected updatePuzzleReferences(puzzle: Puzzle): void {
        this.game.fixtures.forEach(fixture => {
            if (fixture.location?.id === puzzle.location?.id && fixture.childPuzzleName !== "" && fixture.childPuzzleName === puzzle.name)
                fixture.setChildPuzzle(puzzle);
        });
        this.game.roomItems.forEach(roomItem => {
            if (roomItem.location?.id === puzzle.location?.id && roomItem.containerType === "Puzzle" && roomItem.containerName === puzzle.name)
                roomItem.setContainer(puzzle);
        });
    }

    /**
     * Updates references to a given event throughout the game.
     * @param event
     */
    protected updateEventReferences(event: Event): void {
        this.game.puzzles.forEach(puzzle => {
            puzzle.requirementsStrings.forEach((requirementsString, i) => {
                if (requirementsString.type === "Event" && requirementsString.entityId === event.id)
                    puzzle.requirements[i] = event;
            });
        });
    }

    /**
     * Updates references to a given status effect throughout the game.
     * @param status
     */
    protected updateStatusEffectReferences(status: Status): void {
        this.game.prefabs.forEach(prefab => {
            prefab.effectsStrings.forEach((effectsString, i) => {
                if (effectsString === status.id)
                    prefab.effects[i] = status;
            });
            prefab.curesStrings.forEach((curesString, i) => {
                if (curesString === status.id)
                    prefab.cures[i] = status;
            });
        });
        this.game.events.forEach(event => {
            event.effectsStrings.forEach((effectsString, i) => {
                if (effectsString === status.id)
                    event.effects[i] = status;
            });
            event.refreshesStrings.forEach((refreshesString, i) => {
                if (refreshesString === status.id)
                    event.refreshes[i] = status;
            });
        });
        this.game.gestures.forEach(gesture => {
            gesture.disabledStatusesStrings.forEach((disabledStatusString, i) => {
                if (disabledStatusString === status.id)
                    gesture.disabledStatuses[i] = status;
            });
        });
    }

    /**
     * Updates references to a given player throughout the game.
     * @param player
     */
    protected updatePlayerReferences(player: Player): void {
        this.game.rooms.forEach(room => {
            room.occupants.forEach((occupant, i) => {
                if (occupant?.name === player.name)
                    room.occupants[i] = player;
            });
        });
        this.game.whispers.forEach(whisper => {
            if (whisper.players.has(player.name))
                whisper.players.set(player.name, player);
        });
        this.game.fixtures.forEach(fixture => {
            if (fixture.hidingSpot && fixture.hidingSpot.occupants.has(player.name))
                fixture.hidingSpot.occupants.set(player.name, player);
        });
        this.game.parties.forEach(party => {
            if (party.leader?.name === player.name)
                party.leader = player;
            if (party.followers.has(player.name))
                party.followers.set(player.name, player);
            if (party.members.has(player.name))
                party.members.set(player.name, player);
        });
    }

    /**
     * Updates references to a given flag throughout the game.
     * @param flag
     */
    protected updateFlagReferences(flag: Flag): void {
        this.game.puzzles.forEach(puzzle => {
            puzzle.requirementsStrings.forEach((requirementsString, i) => {
                if (requirementsString.type === "Flag" && requirementsString.entityId === flag.id)
                    puzzle.requirements[i] = flag;
            });
        });
    }

    /**
     * Creates a new whisper and adds it to the game's collection of whispers.
     * @param players - The players to add to the whisper.
     * @param hidingSpotName - The name of the hiding spot the whisper belongs to. Optional.
     * @param type - The type of the whisper, based on the entity it belongs to. Defaults to `STANDALONE`, which is for whispers that don't belong to any entity.
     * @returns The created whisper.
     */
    async createWhisper(players: Collection<string, Player> | Player[], hidingSpotName?: string, type: WhisperType = WhisperType.STANDALONE): Promise<Whisper> {
        const whisper = new Whisper(this.game, type, players, hidingSpotName);
        whisper.channel = await this.#createWhisperChannel(whisper);
        this.game.whispers.set(whisper.id, whisper);
        return whisper;
    }

    /**
     * Updates a whisper's key in the game's collection of whispers and edits its channel name.
     * @param whisper - The whisper to edit.
     * @param newId - The whisper's new ID.
     */
    updateWhisperId(whisper: Whisper, newId: string): void {
        const oldId = whisper.id;
        whisper.id = newId;
        this.game.whispers.set(whisper.id, whisper);
        this.game.whispers.delete(oldId);
        whisper.channelName = whisper.id.substring(0, 100);
        if (whisper.channel) whisper.channel.edit({ name: whisper.channelName })?.catch();
    }

    /**
     * Deletes a whisper from the game.
     * @param whisper - The whisper to delete.
     */
    async deleteWhisper(whisper: Whisper): Promise<void> {
        if (this.game.settings.autoDeleteWhisperChannels) {
            if (!whisper.deleted) await whisper.channel?.delete().catch();
        }
        else {
            const archivedIdentifier = whisper.type === WhisperType.HIDING_SPOT ? `${whisper.locationId}-${whisper.associatedEntityName}`
                : whisper.type === WhisperType.PARTY ? whisper.associatedEntity
                    : whisper.locationId;
            await whisper.channel.edit({ name: Room.generateValidId(`archived-${archivedIdentifier}`), lockPermissions: true });
        }
        whisper.players.clear();
        this.game.whispers.delete(whisper.id);
    }

    /**
     * Creates a channel for a whisper.
     * @param whisper
     * @returns The created channel.
     */
    async #createWhisperChannel(whisper: Whisper): Promise<TextChannel> {
        return new Promise(async resolve => {
            let channel: TextChannel | undefined;
            // If the whisper is associated with an entity and it already has a channel, we don't need to create a new one.
            // We look for a channel name that matches the whisper's full ID, because the channel name may have been truncated and we don't want to make assumptions.
            if (whisper.type !== WhisperType.STANDALONE)
                channel = this.game.guildContext.findChannel(whisper.id, this.game.guildContext.whisperCategoryId) as TextChannel;
            if (!channel)
                channel = await this.game.guildContext.createChannel(whisper.channelName, this.game.guildContext.whisperCategoryId);
            if (channel) {
                for (const player of whisper.players.values()) {
                    const noChannel = player.isNPC
                        || player.isHidden() && player.getBehaviorAttributeStatusEffects("no channel").length > 1
                        || !player.isHidden() && player.hasBehaviorAttribute("no channel")
                        || !player.canHear();
                    if (!noChannel) {
                        await channel.permissionOverwrites.create(player.id, {
                            ViewChannel: true,
                            ReadMessageHistory: true
                        });
                    }
                }
                resolve(channel);
            }
        });
    }

    /**
     * Creates a new party and adds it to the game's collection of parties.
     * Also creates a whisper for the party and adds it to the game's collection of whispers.
     * @param leader - The leader of the party. This is the player who is responsible for moving the party.
     * @param followers - The followers of the party. These are the players who will follow the leader when they move to a new room.
     * @param idPrefix - The prefix for the ID of the party. This is used to generate the party's ID. Optional. By default, this is set to `party`.
     */
    async createParty(leader: Player, followers: Player[], idPrefix: string = "party"): Promise<Party> {
        const party = new Party(this.game, leader, followers, idPrefix);
        const whisper = await this.createWhisper(party.members, idPrefix, WhisperType.PARTY);
        party.whisper = whisper;
        party.id = whisper.id;
        this.game.parties.set(party.id, party);
        return party;
    }

    /**
     * Updates a party's key in the game's collection of parties and sets its ID.
     * @param party - The party to edit.
     * @param newId - The party's new ID.
     */
    updatePartyId(party: Party, newId: string): void {
        const oldId = party.id;
        party.id = newId;
        this.game.parties.set(party.id, party);
        this.game.parties.delete(oldId);
    }

    /**
     * Deletes a party from the game.
     * @param party - The party to delete.
     */
    async deleteParty(party: Party): Promise<void> {
        await this.deleteWhisper(party.whisper);
        party.leader = null;
        party.followers.clear();
        party.members.clear();
        this.game.parties.delete(party.id);
    }

    /**
     * Gets the moderator associated with the given member, or creates one if it doesn't already exist.
     * @param member
     */
    getOrCreateModerator(member: GuildMember): Moderator {
        if (this.game.moderators.has(member.id)) return this.game.moderators.get(member.id);
        const moderator = new Moderator(member.id, member, this.game);
        this.game.moderators.set(moderator.id, moderator);
        return moderator;
    }
}
