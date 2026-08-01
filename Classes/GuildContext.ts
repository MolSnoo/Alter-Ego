// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
    type CategoryChannelResolvable,
    ChannelType,
    type Guild,
    type GuildMember,
    type PartialMessage,
    type Role,
    type TextChannel
} from "discord.js";
import type Player from "../Data/Player.ts";

/**
 * Represents the guild in which a Game is occurring and all of the parts of a Guild needed by the bot.
 */
export default class GuildContext {
    /**
     * The guild in which the game is taking place.
     */
    readonly guild: Guild;
    /**
     * The channel where the bot will accept commands from a moderator.
     */
    readonly commandChannel: TextChannel;
    /**
     * The channel where the bot logs all notable occurrences in the game.
     */
    readonly logChannel: TextChannel;
    /**
     * The channel where announcements from the player with the freeMovementRole will be mirrored in all players' spectate channels.
     */
    readonly announcementChannel: TextChannel;
    /**
     * The channel where startgame and endgame announcements are posted when debug mode is enabled.
     */
    readonly testingChannel: TextChannel;
    /**
     * The channel where startgame and endgame announcements are posted when debug mode is disabled.
     */
    readonly generalChannel: TextChannel;
    /**
     * An array of IDs for room channel parent categories.
     */
    readonly roomCategories: string[];
    /**
     * The ID of the category channel that houses whisper channels.
     */
    readonly whisperCategoryId: string;
    /**
     * The ID of the category channel that houses spectate channels.
     */
    readonly spectateCategoryId: string;
    /**
     * The tester role. Members with this role can use eligible commands when debug mode is enabled.
     */
    readonly testerRole: Role;
    /**
     * The eligible role. Members with this role can use eligible commands when debug mode is disabled.
     */
    readonly eligibleRole: Role;
    /**
     * The player role. Members with this role can use player commands.
     */
    readonly playerRole: Role;
    /**
     * A role that can be added to someone with the player role to allow them to move to any room, regardless of if it's adjacent to their current room.
     * @deprecated Use the {@link https://msvblank.github.io/Alter-Ego/reference/data_structures/status.html#can-move-freely | `can move freely` behavior attribute} instead.
     */
    readonly freeMovementRole: Role;
    /**
     * The moderator role. Members with this role can use moderator commands.
     */
    readonly moderatorRole: Role;
    /**
     * The dead role. This is given to dead players after a moderator uses the reveal command on them.
     */
    readonly deadRole: Role;
    /**
     * The spectator role. This is given to all players when the endgame command is used.
     */
    readonly spectatorRole: Role;

    /**
     * @param guild - The guild in which the game is taking place.
     * @param commandChannel - The channel where the bot logs all notable occurrences in the game.
     * @param logChannel - The channel where announcements from the player with the freeMovementRole will be mirrored in all players' spectate channels.
     * @param announcementChannel - The channel where announcements from the player with the freeMovementRole will be mirrored in all players' spectate channels.
     * @param testingChannel - The channel where startgame and endgame announcements are posted when debug mode is enabled.
     * @param generalChannel - The channel where startgame and endgame announcements are posted when debug mode is disabled.
     * @param roomCategories - An array of IDs for room channel parent categories.
     * @param whisperCategoryId - The ID of the category channel that houses whisper channels.
     * @param spectateCategoryId - The ID of the category channel that houses spectate channels.
     * @param testerRole - The tester role. Members with this role can use eligible commands when debug mode is enabled.
     * @param eligibleRole - The eligible role. Members with this role can use eligible commands when debug mode is disabled.
     * @param playerRole - The player role. Members with this role can use player commands.
     * @param freeMovementRole - A role that can be added to someone with the player role to allow them to move to any room, regardless of if it's adjacent to their current room.
     * @param moderatorRole - The moderator role. Members with this role can use moderator commands.
     * @param deadRole - The dead role. This is given to dead players after a moderator uses the reveal command on them.
     * @param spectatorRole - The spectator role. This is given to all players when the endgame command is used.
     */
    constructor(
        guild: Guild,
        commandChannel: TextChannel,
        logChannel: TextChannel,
        announcementChannel: TextChannel,
        testingChannel: TextChannel,
        generalChannel: TextChannel,
        roomCategories: string[],
        whisperCategoryId: string,
        spectateCategoryId: string,
        testerRole: Role,
        eligibleRole: Role,
        playerRole: Role,
        freeMovementRole: Role,
        moderatorRole: Role,
        deadRole: Role,
        spectatorRole: Role
    ) {
        this.guild = guild;
        this.commandChannel = commandChannel;
        this.logChannel = logChannel;
        this.announcementChannel = announcementChannel;
        this.testingChannel = testingChannel;
        this.generalChannel = generalChannel;

        for (let i = 0; i < roomCategories.length; i++)
            roomCategories[i] = roomCategories[i].trim();
        this.roomCategories = roomCategories;
        this.whisperCategoryId = whisperCategoryId;
        this.spectateCategoryId = spectateCategoryId;

        this.testerRole = testerRole;
        this.eligibleRole = eligibleRole;
        this.playerRole = playerRole;
        this.freeMovementRole = freeMovementRole;
        this.moderatorRole = moderatorRole;
        this.deadRole = deadRole;
        this.spectatorRole = spectatorRole;
    }

    /**
     * Gets a member of the guild by their user ID. If no such member exists, returns undefined.
     * @param userId
     */
    getMember(userId: string): GuildMember {
        return this.guild.members.resolve(userId);
    }

    /**
     * Returns true if the given guild member has the given role.
     * @param member - The guild member to check.
     * @param role - The role to check for.
     */
    hasRole(member: GuildMember, role: Role): boolean {
        if (!member || !role) return false;
        return member.roles.cache.has(role.id);
    }

    /**
     * Returns true if the given guild member has the tester role.
     * @param member
     */
    hasTesterRole(member: GuildMember): boolean {
        return this.hasRole(member, this.testerRole);
    }

    /**
     * Returns true if the given guild member has the eligible role.
     * @param member
     */
    hasEligibleRole(member: GuildMember): boolean {
        return this.hasRole(member, this.eligibleRole);
    }

    /**
     * Returns true if the given guild member has the player role.
     * @param member
     */
    hasPlayerRole(member: GuildMember): boolean {
        return this.hasRole(member, this.playerRole);
    }

    /**
     * Returns true if the given guild member has the free movement role.
     * @deprecated Use {@link Player.canMoveFreely()} instead.
     * @param member
     */
    hasFreeMovementRole(member: GuildMember): boolean {
        return this.hasRole(member, this.freeMovementRole);
    }

    /**
     * Returns true if the given guild member has the moderator role.
     * @param member
     */
    hasModeratorRole(member: GuildMember): boolean {
        return this.hasRole(member, this.moderatorRole);
    }

    /**
     * Returns true if the given guild member has the dead role.
     * @param member
     */
    hasDeadRole(member: GuildMember): boolean {
        return this.hasRole(member, this.deadRole);
    }

    /**
     * Returns true if the given guild member has the spectator role.
     * @param member
     */
    hasSpectatorRole(member: GuildMember): boolean {
        return this.hasRole(member, this.spectatorRole);
    }

    /**
     * Returns true if the given message was sent in a DM channel.
     * @param message
     */
    sentInDMChannel(message: UserMessage | PartialMessage) {
        return message.channel.type === ChannelType.DM;
    }

    /**
     * Returns true if the given message was sent in the moderator command channel.
     * @param message
     */
    sentInCommandChannel(message: UserMessage | PartialMessage) {
        return message.channel.id === this.commandChannel.id;
    }

    /**
     * Returns true if the given message was sent in a room channel.
     * @param message
     */
    sentInRoomChannel(message: UserMessage | PartialMessage) {
        return message.channel.type === ChannelType.GuildText && this.roomCategories.includes(message.channel.parentId);
    }

    /**
     * Returns true if the given message was sent in a whisper channel.
     * @param message
     */
    sentInWhisperChannel(message: UserMessage | PartialMessage) {
        return message.channel.type === ChannelType.GuildText && message.channel.parentId === this.whisperCategoryId;
    }

    /**
     * Returns true if the given message was sent in the announcement channel.
     * @param message
     */
    sentInAnnouncementChannel(message: UserMessage | PartialMessage) {
        return message.channel.type === ChannelType.GuildText && message.channel.id === this.announcementChannel.id;
    }

    /**
     * Returns true if the given message was sent in the testing channel.
     * @param message
     */
    sentInTestingChannel(message: UserMessage | PartialMessage) {
        return message.channel.id === this.testingChannel.id;
    }

    /**
     * Returns true if the given message was sent in the general channel.
     * @param message
     */
    sentInGeneralChannel(message: UserMessage | PartialMessage) {
        return message.channel.id === this.generalChannel.id;
    }

    /**
     * Returns true if the given message was sent in a channel where dialog messages can be sent.
     * @param message
     */
    sentInDialogChannel(message: UserMessage | PartialMessage) {
        return this.sentInRoomChannel(message) || this.sentInWhisperChannel(message) || this.sentInAnnouncementChannel(message);
    }

    /**
     * Finds the channel in the guild. Returns undefined if no such channel exists.
     * @param name - The name of the channel to find.
     * @param parentId - The parent ID the channel must have. Optional.
     */
    findChannel(name: string, parentId?: string) {
        if (parentId)
            return this.guild.channels.cache.find(channel => channel.parent && channel.parentId === parentId && channel.name === name);
        else return this.guild.channels.cache.find(channel => channel.name === name);
    }

    /**
     * Gets the guild channel with the given ID.
     * @param id - The ID of the channel to get.
     */
    getChannelWithId(id: string) {
        return this.guild.channels.resolve(id);
    }

    /**
     * Counts how many channels are in a given category.
     * @param categoryId - The ID of the category channel whose channels are to be counted.
     */
    countChannelsInCategory(categoryId: string): number {
        return this.guild.channels.cache.filter(channel => channel.parent && channel.parentId === categoryId).size;
    }

    /**
     * Creates a text channel in the guild.
     * @param name - The name to give to the new channel.
     * @param parent - The parent category to assign to the channel. Optional.
     */
    async createChannel(name: string, parent?: CategoryChannelResolvable): Promise<TextChannel> {
        const channel = await this.guild.channels.create({
            name: name,
            parent: parent,
            type: ChannelType.GuildText
        }).catch(error => {
            let parentPhrase = "";
            if (parent) {
                const parentId = typeof parent === "string" ? parent : parent?.id ?? "";
                const parentChannelName = this.getChannelWithId(parentId)?.name ?? parentId;
                const category = parentId === this.whisperCategoryId
                    ? "whisper category"
                    : parentId === this.spectateCategoryId
                        ? "spectate category"
                        : this.roomCategories.includes(parentId)
                            ? `room category "${parentChannelName}"`
                            : `category "${parentChannelName}"`;
                parentPhrase = ` in ${category}`;
            }
            console.error(`Couldn't create channel${parentPhrase} with name "${name}".`, error);
        });
        if (channel) return channel;
    }
}
