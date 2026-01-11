import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

/**
 * @import Player from "../../../Data/Player.js"
 */

/** @type {import("discord.js").Collection} */
let webhooks;

export function createPermissionOverwritesManager() {
	const { Collection } = require('discord.js');
	const permissionOverwritesManager = {
		cache: new Collection(),
		create: vi.fn((id, options) => permissionOverwritesManager.cache.set(id, options)),
		delete: vi.fn(id => permissionOverwritesManager.cache.delete(id)),
		resolve: vi.fn(id => permissionOverwritesManager.cache.get(id))
	};
	return permissionOverwritesManager;
}

export function createMockGuildChannelManager() {
	const { Collection } = require('discord.js');
	const channelManager = {
		cache: new Collection(),
		resolve: vi.fn((id) => channelManager.cache.get(id)),
		create: vi.fn(async ({ name, type, parentId, parent }) => createMockChannel(generateSnowflake(), name, type, parentId, parent ? parent : channelManager.resolve(parentId))),
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
		send: vi.fn(async ({ content, username, avatarURL, embeds, files }) => {
			const message = createMockMessage({
				content: content,
				member: null,
				author: createMockUser(generateSnowflake(), username, avatarURL),
				channel: webhook.channel,
				webhookId: webhook.id,
				client: owner
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
			const message = createMockMessage({ content: content, channel: channel });
			channel.messages.cache.set(message.id, message);
		}),
		edit: vi.fn(({ name, lockPermissions }) => { channel.name = name; if (lockPermissions) for (const key of channel.permissionOverwrites.cache.keys()) channel.permissionOverwrites.delete(key) }),
		fetchWebhooks: vi.fn(async () => webhooks.filter(webhook => webhook.channel.id === channel.id)),
		createWebhook: vi.fn(async ({ name }) => createMockWebhook(name, channel, channel.client)),
		permissionOverwrites: createPermissionOverwritesManager(),
		lockPermissions: vi.fn(() => {}),
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
		send: vi.fn(async ({}) => createMockMessage({ content: '', channel: user.dmChannel })),
		avatarURL: vi.fn(() => avatarURL),
		setPresence: vi.fn(() => {})
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
		add: vi.fn((role) => {roleManager.cache.set(role.id, role)}),
		remove: vi.fn((role) => {roleManager.cache.delete(role.id)}),
	};
	return roleManager;
}

export function createMockMember(id = generateSnowflake(), displayName = '') {
	const permissionsInHasMock = vi.fn((permission) => true);
	const mockUser = createMockUser(id, displayName);
	const member = {
		id: id,
		displayName: displayName,
		displayAvatarURL: vi.fn(() => ''),
		avatarURL: vi.fn(() => ''),
		user: createMockUser(id, displayName),
		dmChannel: mockUser.dmChannel,
		roles: createMockRoleManager(),
		permissionsIn: vi.fn((channel) => {
			has: permissionsInHasMock
		}),
		_permissionsInHasMock: permissionsInHasMock,
		send: vi.fn(async ({}) => Promise.resolve(createMockMessage({ content: '', channel: member.user.dmChannel })))
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
export function createMockGuild(channels = [], roles = [], members = []) {
	const guild = {
		iconURL: vi.fn(() => ''),
		channels: createMockGuildChannelManager(),
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
export function createMockMessage({ content = '', member = createMockMember(), author = createMockUser(), channel = null, webhookId, client } = {}) {
	const { Collection } = require('discord.js');
	const messageChannel = channel || createMockChannel();
	if (messageChannel && messageChannel.parent) messageChannel.parentId = messageChannel.parent.id;
	return {
		id: generateSnowflake(),
		content: content,
		cleanContent: content,
		client: client,
		member,
		author,
		channel: messageChannel,
		reply: vi.fn(async (text) => createMockMessage({ content: text, channel: messageChannel })),
		// @ts-ignore
		react: vi.fn(async () => ({})),
		webhookId: webhookId,
		attachments: new Collection(),
		embeds: [],
		// @ts-ignore
		mentions: {
			members: new Collection(),
			channels: new Collection()
		},
		// @ts-ignore
		delete: vi.fn(async () => ({})),
	};
}

/** 
 * Creates a mocked message by the given player.
 * @param {Player} player
 * @param {string} content
 */
export function createPlayerMessage(player, content) {
	return createMockMessage({
		content: content,
		member: player.member,
		author: player.member.user,
		channel: player.location.channel
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
