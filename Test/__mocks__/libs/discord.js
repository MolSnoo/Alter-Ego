// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Warning: This code is awful, somewhat out of necessity.
// At time of writing, there isn't a good library for mocking the Discord API,
// so this is a quick-and-dirty effort at creating one.
// Attempting to convert this to TypeScript, or really improve upon it in any way,
// is an exercise in futility. You have been warned.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

/**
 * @import Player from "../../../Data/Player.ts"
 */

/** @type {import("discord.js").Collection} */
let webhooks;

export function createPermissionOverwritesManager() {
    const { Collection } = require('discord.js');
    const permissionOverwritesManager = {
        cache: new Collection(),
        create: vi.fn(async (id, options) => permissionOverwritesManager.cache.set(id, options)),
        delete: vi.fn(id => permissionOverwritesManager.cache.delete(id)),
        resolve: vi.fn(id => permissionOverwritesManager.cache.get(id))
    };
    return permissionOverwritesManager;
}

export function createMockGuildChannelManager(client) {
    const { Collection } = require('discord.js');
    const channelManager = {
        cache: new Collection(),
        resolve: vi.fn((id) => channelManager.cache.get(id)),
        create: vi.fn(async ({ name, type, parent }) => {
            const parentId = typeof parent === 'string' ? parent : parent.id;
            const parentChannel = typeof parent === 'string' ? channelManager.resolve(parent) : parent;
            return createMockChannel(generateSnowflake(), name, type, parentId, parentChannel, client)
        }),
        fetch: vi.fn(async (id) => channelManager.cache.get(id))
    };
    return channelManager;
}

export function createMockGuildMessageManager() {
    const { Collection } = require('discord.js');
    const messageManager = {
        cache: new Collection(),
        resolve: vi.fn((id) => messageManager.cache.get(id)),
        fetch: vi.fn(async (id) => messageManager.cache.get(id)),
        delete: vi.fn(async (id) => messageManager.cache.delete(id))
    };
    return messageManager;
}

export function createMockWebhook(name, channel, owner) {
    const { Collection } = require('discord.js');
    const webhook = {
        id: generateSnowflake(),
        name: name,
        channel: channel,
        client: channel.client,
        owner: owner,
        messages: new Collection(),
        editMessage: vi.fn(async (id, { content }) => webhook.messages.get(id).edit(content)),
        fetchMessage: vi.fn(async (id) => webhook.messages.get(id)),
        send: vi.fn(async (messagePayload) => {
            const message = createMockMessage({
                content: messagePayload.content,
                member: null,
                author: createMockUser(generateSnowflake(), messagePayload.username, messagePayload.avatarURL),
                channel: webhook.channel,
                webhookId: webhook.id,
                client: owner,
                components: messagePayload.components
            });
            webhook.messages.set(message.id, message);
            webhook.channel.messages.cache.set(message.id, message);
            return message;
        })
    };
    webhooks.set(webhook.id, webhook);
    return webhook;
}

export function createMockChannel(id, name, type, parentId, parent, client) {
    const messageManager = createMockGuildMessageManager();
    const permissionOverwritesManager = createPermissionOverwritesManager();
    let channel = {
        client: client,
        id: id,
        name: name,
        type: type,
        parentId: parentId,
        parent: parent,
        messages: messageManager,
        bulkDelete: vi.fn((messages, filterOld) => messageManager.cache.clear()),
        send: vi.fn(async (content) => {
            const messagePayload = typeof content === 'string' ? { content: content, channel: channel } : { content: content.content, channel: channel, components: content.components };
            const message = createMockMessage(messagePayload);
            channel.messages.cache.set(message.id, message);
        }),
        edit: vi.fn(({ name, lockPermissions }) => { channel.name = name; if (lockPermissions) for (const key of channel.permissionOverwrites.cache.keys()) channel.permissionOverwrites.delete(key) }),
        fetchWebhooks: vi.fn(async () => webhooks.filter(webhook => webhook.channel.id === channel.id)),
        createWebhook: vi.fn(async ({ name }) => createMockWebhook(name, channel, channel.client)),
        permissionOverwrites: permissionOverwritesManager,
        lockPermissions: vi.fn(() => { }),
        delete: vi.fn(async () => channel = undefined)
    };
    return channel;
}

export function createMockUser(id = generateSnowflake(), username = '', avatarURL = '') {
    const user = {
        id: id,
        username: username,
        defaultAvatarURL: avatarURL,
        dmChannel: createMockChannel(id, username),
        send: vi.fn(async (content) => {
            const message = createMockMessage({ content: content, channel: user.dmChannel });
            user.dmChannel.messages.cache.set(message.id, message);
        }),
        avatarURL: vi.fn(() => avatarURL),
        setPresence: vi.fn(() => { })
    };
    return user;
}

export function createMockRole(id = generateSnowflake(), name = '') {
    const role = {
        id: id,
        name: name
    };
    return role;
}

export function createMockRoleManager() {
    const { Collection } = require('discord.js');
    const roleManager = {
        cache: new Collection(),
        resolve: vi.fn((id) => roleManager.cache.get(id)),
        fetch: vi.fn(async (id) => roleManager.get(id)),
        add: vi.fn((role) => { roleManager.cache.set(role.id, role) }),
        remove: vi.fn((role) => { roleManager.cache.delete(role.id) }),
    };
    return roleManager;
}

function createPermissionsBitField(channel) {
    return {
        has: vi.fn(permission => true)
    };
}

/**
 * @param {number} [flags]
 */
function createMessageFlagsBitField(flags = 0) {
    let bitField = flags;
    return {
        bitfield: bitField,
        has: vi.fn(flag => { return bitField === flag })
    };
}

export function createMockMember(id = generateSnowflake(), displayName = '') {
    const mockUser = createMockUser(id, displayName);
    const member = {
        id: id,
        displayName: displayName,
        displayAvatarURL: vi.fn(() => ''),
        avatarURL: vi.fn(() => ''),
        user: createMockUser(id, displayName),
        dmChannel: mockUser.dmChannel,
        createDM: vi.fn(async (force) => member.user.dmChannel),
        roles: createMockRoleManager(),
        permissionsIn: vi.fn((channel) => createPermissionsBitField(channel)),
        send: vi.fn(async ({ }) => Promise.resolve(createMockMessage({ content: '', channel: member.user.dmChannel })))
    };
    return member;
}

export function createMockGuildMemberManager() {
    const { Collection } = require('discord.js');
    const memberManager = {
        cache: new Collection(),
        resolve: vi.fn((id) => memberManager.cache.get(id)),
        fetch: vi.fn(async (id) => memberManager.cache.get(id)),
        me: createMockUser()
    };
    return memberManager;
}

/**
 * @param {*} channels
 * @param {*} roles
 * @param {*} members
 * @returns
 */
export function createMockGuild(channels = [], roles = [], members = [], client) {
    const guild = {
        iconURL: vi.fn(() => ''),
        channels: createMockGuildChannelManager(client),
        members: createMockGuildMemberManager(),
        roles: createMockRoleManager()
    };
    for (const channel of channels)
        guild.channels.cache.set(channel.id, channel);
    for (const role of roles)
        guild.roles.cache.set(role.id, role);
    for (const member of members)
        guild.members.cache.set(member.id, member);
    return guild;
}

export function createMockClient() {
    const { Collection } = require('discord.js');
    webhooks = new Collection();
    const client = {
        user: createMockUser(),
        fetchWebhook: vi.fn(async (id) => webhooks.get(id))
    };
    return client;
}

/**
 * @param {*} param0
 * @returns {UserMessage}
 */
export function createMockMessage({ content = '', member = createMockMember(), author = createMockUser(), channel = null, webhookId, client, components = [], flags = 0 } = {}) {
    const { Collection } = require('discord.js');
    const messageChannel = channel || createMockChannel();
    if (messageChannel && messageChannel.parent) messageChannel.parentId = messageChannel.parent.id;
    const messageContent = components.length > 0 && components[0].components
        ? components[0]?.components[0]?.data?.content
        : components.length > 0
            ? components[0]?.data?.content
            : content;
    return {
        id: generateSnowflake(),
        content: messageContent,
        cleanContent: messageContent,
        client: client,
        member,
        author,
        channel: messageChannel,
        reply: vi.fn(async (text) => createMockMessage({ content: text, channel: messageChannel })),
        // @ts-ignore
        react: vi.fn(async () => ({})),
        // @ts-ignore
        flags: createMessageFlagsBitField(flags),
        webhookId: webhookId,
        attachments: new Collection(),
        embeds: [],
        // @ts-ignore
        mentions: {
            members: new Collection(),
            channels: new Collection()
        },
        deletable: true,
        // @ts-ignore
        delete: vi.fn(async () => ({})),
    };
}

/**
 * Creates a mocked message by the given player.
 * @param {Player} player
 * @param {string} content
 * @param {import("discord.js").TextChannel} [channel]
 * @param {number} [flags]
 */
export function createPlayerMessage(player, content, channel = player.location.channel, flags = 0) {
    return createMockMessage({
        content: content,
        member: player.member,
        author: player.member?.user,
        channel: channel,
        flags: flags
    });
}

export function generateSnowflake() {
    return String(Math.floor(Math.random() * 999999999));
}

export default {
    createMockChannel,
    createMockGuild,
    createMockClient,
    createMockMessage,
    createMockMember,
    createPlayerMessage
};
