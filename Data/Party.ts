// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Action from "./Action.ts";
import type Game from "./Game.ts";
import GameConstruct from "./GameConstruct.ts";
import type Player from "./Player.ts";
import Whisper from "./Whisper.ts";
import { WhisperType } from "../Modules/enums.ts";
import { generateListString } from "../Modules/helpers.ts";
import { Collection } from "discord.js";

/**
 * Represents a group of players who are traveling together.
 * The party has a leader, who is responsible for moving the party to new rooms, and followers,
 * who will automatically follow the leader when they move to a new room.
 * The party also has a whisper that the members can use to communicate with each other.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/party.html
 */
export default class Party extends GameConstruct {
    /**
     * The prefix for the ID of the party. This is used to generate the party's ID.
     * By default, this is set to `party`.
     */
    private idPrefix: string;
    /**
     * The unique ID of the party. This will always match the ID of the party's associated whisper.
     */
    id: string;
    /**
     * A collection of players in the party. The key for each entry is the player's name.
     */
    members: Collection<string, Player>;
    /**
     * The leader of the party. This is the player who is responsible for moving the party.
     */
    leader: Player;
    /**
     * The followers of the party. These are the players who will follow the leader when they move to a new room. This is a subset of the members collection.
     * The key for each entry is the player's name.
     */
    followers: Collection<string, Player>;
    /**
     * A collection of display names for the members of the party.
     * The key for each entry is the player's name, and the value is the display name they had at the time of joining.
     */
    #memberDisplayNames: Collection<string, string>;
    /**
     * The whisper associated with the party. This is the whisper that the party members are using to communicate with each other.
     */
    whisper: Whisper;
    /**
     * Whether or not the positions of all party members are synchronized.
     * During party formation, this is usually false, unless all members happen to be at the same position.
     * Once the leader starts leading, the rest of the party will start moving toward their position.
     * When all followers have reached the leader's position, this is true.
     */
    positionsSynchronized: boolean;

    /**
     * @param game - The game this party belongs to.
     * @param leader - The leader of the party. This is the player who is responsible for moving the party.
     * @param followers - The followers of the party. These are the players who will follow the leader when they move to a new room.
     * @param idPrefix - The prefix for the ID of the party. This is used to generate the party's ID. Optional. By default, this is set to `party`.
     */
    constructor(game: Game, leader: Player, followers: Player[], idPrefix: string = "party") {
        super(game);
        this.idPrefix = idPrefix;
        this.leader = leader;
        this.leader.joinParty(this);
        this.followers = new Collection();
        this.members = new Collection();
        this.#memberDisplayNames = new Collection();
        this.members.set(leader.name, leader);
        this.#memberDisplayNames.set(leader.name, leader.displayName);
        for (const follower of followers) {
            this.followers.set(follower.name, follower);
            this.members.set(follower.name, follower);
            this.#memberDisplayNames.set(follower.name, follower.displayName);
            follower.joinParty(this);
        }
        this.positionsSynchronized = this.getMisalignedFollowers().length === 0;
    }

    /**
     * Forcibly reassigns the party to all of its members.
     * This should only be called after reloading player data.
     * This makes all followers start following the leader, and makes the leader lead all of the party's followers.
     * It also sets the positions of all followers to that of the leader, and marks the party as having synchronized positions.
     */
    forciblyAssignToMembers(): void {
        for (const member of this.members.values())
            member.joinParty(this);
        for (const follower of this.followers.values()) {
            follower.startFollowing(this.leader);
            this.leader.startLeading(follower);
            follower.setPos(this.leader.pos);
        }
        this.positionsSynchronized = true;
    }

    /**
     * Returns true if the party has the given player as a member.
     * @param player - The player to check for membership in the party.
     */
    hasMember(player: Player): boolean {
        return this.members.has(player.name);
    }

    /**
     * Returns true if the party has the given player as the leader.
     * @param player - The player to check for being the leader of the party.
     */
    hasLeader(player: Player): boolean {
        return this.leader.name === player.name;
    }

    /**
     * Returns true if the party has the given player as a follower.
     * @param player - The player to check for being a follower in the party.
     */
    hasFollower(player: Player): boolean {
        return this.followers.has(player.name);
    }

    /**
     * Returns the display name of the member they had at the time of joining.
     * @param player - The player to get the display name for.
     */
    getMemberDisplayName(player: Player): string {
        return this.#memberDisplayNames.get(player.name);
    }

    /**
     * Adds one or more players to the party as followers.
     * @param players - The players to add to the party.
     */
    async addFollowers(players: Player[]): Promise<void> {
        let deleteWhisper = false;
        for (const player of players) {
            if (player.canSee()) deleteWhisper = true; // TODO: Will this cause the whisper to be created without being deleted first if all of the new players are blind?
            this.followers.set(player.name, player);
            this.members.set(player.name, player);
            this.#memberDisplayNames.set(player.name, player.displayName);
            player.joinParty(this);
        }
        if (deleteWhisper) await this.deleteWhisper();
        this.whisper = await this.getGame().entityLoader.createWhisper(this.members, this.idPrefix, WhisperType.PARTY);
        this.getGame().entityLoader.updatePartyId(this, this.whisper.id);
    }

    /**
     * Removes one or more followers from the party.
     * @param players - The followers to remove from the party.
     * @param action - The action that caused the player to be removed.
     * @param leaveNarration - The narration to send to the party whisper channel when the player leaves. Optional.
     */
    async removeFollowers(players: Set<Player> | Player[] | Player, action?: Action, leaveNarration: string = ""): Promise<void> {
        if (!(players instanceof Set) && !(players instanceof Array)) players = new Set([players]);
        if (!(players instanceof Set)) players = new Set(players);
        for (const player of players) {
            player.leaveParty();
            this.followers.delete(player.name);
            this.members.delete(player.name);
            this.#memberDisplayNames.delete(player.name);
        }
        const whisperNarration = action ? leaveNarration : "";
        await this.whisper.removePlayers(players, whisperNarration, action);
        this.getGame().entityLoader.updatePartyId(this, this.whisper.id);
        if (this.followers.size === 0) {
            await this.disband();
        }
    }

    /**
     * Removes all members from the whisper and sets it to null.
     */
    async deleteWhisper(): Promise<void> {
        await this.whisper.removePlayers(this.getMemberSet());
        this.whisper = null;
    }

    /**
     * Disbands the party, removing all members and deleting the party's whisper.
     */
    async disband(): Promise<void> {
        for (const member of this.members.values())
            member.leaveParty();
        await this.getGame().entityLoader.deleteParty(this);
    }

    /**
     * Returns true if the party can move. If any player in the party is unable to move, the party cannot move.
     * This can be used to prevent the party from moving if, for example, one of the members is paralyzed or restrained.
     * The party cannot move if all members' positions are not synchronized.
     * Also returns false if the party's movement speed is less than or equal to 0.
     * @param isRunning - Whether or not the party is trying to run.
     */
    canMove(isRunning: boolean): boolean {
        const command = isRunning ? "run" : "move";
        for (const member of this.members.values()) {
            if (!member.canUseCommand(command)) return false;
        }
        if (this.getMisalignedFollowers().length > 0) return false;
        if (this.speed <= 0) return false;
        return true;
    }

    /**
     * Gets a list of players in the party who are unable to move, sorted by display name.
     * @param isRunning - Whether or not the party is trying to run.
     */
    getImmovablePlayers(isRunning: boolean): Player[] {
        const command = isRunning ? "run" : "move";
        const immovablePlayers = this.members.filter(player => !player.canUseCommand(command) || !player.positionMatches(this.leader) || player.speed <= 0);
        return Array.from(immovablePlayers.values()).toSorted((a, b) => this.getMemberDisplayName(a).localeCompare(this.getMemberDisplayName(b)));
    }

    /**
     * Gets all followers whose positions are out of sync with the leader's.
     */
    getMisalignedFollowers(): Player[] {
        return this.followers.filter(follower => !follower.positionMatches(this.leader)).map(player => player);
    }

    /**
     * The speed at which the party moves when the leader moves to a new room.
     * This will be the speed of the slowest member of the party.
     */
    get speed(): number {
        return Math.min(...Array.from(this.members.values()).map(member => member.speed));
    }

    /**
     * Gets the lowest move rate of all players in the party.
     * @param running - Whether the players are running.
     * @param speed - The speed at which to move the players. Optional. Defaults to the party's speed.
     */
    calculateMoveRate(running: boolean, speed: number = this.speed): number {
        return Math.min(...Array.from(this.members.values()).map(member => member.calculateMoveRate(running, speed)));
    }

    /**
     * Gets all of the members of the party as a set. The leader will always be the first player in the set, unless they are excluded.
     * @param excludedPlayer - A player to exclude from the set.
     */
    getMemberSet(excludedPlayer?: Player): Set<Player> {
        const set: Set<Player> = new Set();
        set.add(this.leader);
        const sortedFollowers = this.followers.sorted((a, b) => this.getMemberDisplayName(a).localeCompare(this.getMemberDisplayName(b)));
        for (const follower of sortedFollowers.values())
            set.add(follower);
        if (excludedPlayer && set.has(excludedPlayer)) set.delete(excludedPlayer);
        return set;
    }

    /**
     * Generates a grammatically correct list using the member display names of the given players.
     * @param players - The players to list. They should be members of the party.
     */
    generatePlayerListString(players: Collection<string, Player> | Player[]): string {
        const playerNames: string[] = players.values().toArray().map(player => this.getMemberDisplayName(player) ?? player.displayName).toSorted();
        return generateListString(playerNames);
    }

    /**
     * Gets the phrase that should be used to refer to the party's associated entity.
     * If there is no associated entity, returns the `idPrefix` preceded by "a".
     */
    getContainingPhrase(): string {
        return `a ${this.idPrefix}`;
    }

    /**
     * Gets the preposition that should be used to refer to the party's associated entity.
     */
    getPreposition(): string {
        return "in";
    }
}
