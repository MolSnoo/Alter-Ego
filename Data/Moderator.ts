import GameConstruct from "./GameConstruct.ts";
import type { GuildMember } from "discord.js";
import type Game from "./Game.ts";
import type Player from "./Player.ts";

/**
 * Represents a moderator of the game.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/moderator.html
 */
export default class Moderator extends GameConstruct implements User {
    /**
     * The Discord ID of the moderator.
     */
    readonly id: string;
    /**
     * The Discord member object of the moderator.
     */
    readonly member: GuildMember;
    /**
     * The name of the NPC the moderator is currently latched onto. If none is set, this is `null`.
     */
    #latchedNPCName: string | null;

    constructor(id: string, member: GuildMember, game: Game) {
        super(game);
        this.id = id;
        this.member = member;
        this.#latchedNPCName = null;
    }

    /**
     * Gets the moderator's current member display name.
     */
    public get displayName() {
        return this.member.displayName;
    }

    /**
     * Gets the moderator's current member display avatar URL.
     */
    public get displayIcon() {
        return this.member.displayAvatarURL();
    }

    /**
     * Gets the NPC this moderator is currently latched to.
     */
    public getLatch(): Player {
        return this.getGame().entityFinder.getPlayer(this.#latchedNPCName) ?? null;
    }

    /**
     * Returns true if the name of the moderator's latched NPC matches the given name.
     * If `'s` appears in the given name, it will be stripped out for comparison.
     * @param name - The name to check.
     */
    public latchedPlayerHasName(name: string): boolean {
        return this.#latchedNPCName !== null && this.#latchedNPCName === name?.toLocaleLowerCase().replace(/'s/g, "");
    }

    /**
     * Latches the moderator onto an NPC.
     * @param npc - The NPC to latch onto.
     */
    public setLatch(npc: Player): void {
        this.#latchedNPCName = npc?.name?.toLocaleLowerCase() ?? null;
    }

    /**
     * Clears the moderator's latch.
     */
    public clearLatch(): void {
        this.#latchedNPCName = null;
    }

    /**
     * Returns true if the given message was sent in a room or whisper channel that their current latched NPC is in.
     * @param message
     */
    public sentMessageInLatchChannel(message: UserMessage) {
        if (this.getLatch() === null) return false;
        if (this.getGame().guildContext.sentInRoomChannel(message) && message.channel.id === this.getLatch().location.channel.id) return true;
        if (this.getGame().guildContext.sentInWhisperChannel(message)) {
            for (const whisper of this.getGame().whispers.values()) {
                if (whisper.players.has(this.getLatch().name) && whisper.channel.id === message.channel.id) return true;
            }
        }
        return false;
    }
}
