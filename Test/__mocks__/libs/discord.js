import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export function createPermissionOverwritesManager() {
	const permissionOverwritesManager = {
		create: vi.fn((permissionOverwrites) => {})
	};
	return permissionOverwritesManager;
}

export function createMockGuildChannelManager() {
	const { Collection } = require('discord.js');
	const channelManager = {
		cache: new Collection(),
		resolve: vi.fn((id) => channelManager.cache.get(id)),
		create: vi.fn(({ name, type, parentId }) => createMockChannel(generateSnowflake(), name, type, parentId, channelManager.resolve(parentId))),
		fetch: vi.fn(async (id) => channelManager.cache.get(id))
	};
	return channelManager;
}

export function createMockChannel(id, name, type, parentId, parent) {
	const { Collection } = require('discord.js');
	const channel = {
		id: id,
		name: name,
		type: type,
		parentId: parentId,
		parent: parent,
		messages: new Collection(),
		bulkDelete: vi.fn((messages, filterOld) => {}),
		send: vi.fn(async (content) => createMockMessage({ content: content, channel: channel })),
		edit: vi.fn(({ name }) => channel.name = name),
		fetchWebhooks: vi.fn(() => []),
		createWebhook: vi.fn(({}) => {}),
		permissionOverwrites: createPermissionOverwritesManager(),
		lockPermissions: vi.fn(() => {}),
		delete: vi.fn(() => {})
	};
	return channel;
}

export function createMockUser(id = generateSnowflake(), username = '') {
	const user = {
		id: id,
		username: username,
		defaultAvatarURL: '',
		dmChannel: createMockChannel(id, username),
		send: vi.fn(async ({}) => createMockMessage({ content: '', channel: user.dmChannel })),
		avatarURL: vi.fn(() => ''),
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
	const member = {
		id: id,
		displayName: displayName,
		displayAvatarURL: vi.fn(() => ''),
		avatarURL: vi.fn(() => ''),
		user: createMockUser(id, displayName),
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
	const client = {
		user: createMockUser()
	};
	return client;
}

/**
 * @param {*} param0 
 * @returns {UserMessage}
 */
export function createMockMessage({ content = '', member = createMockMember(), author = createMockUser(), channel = null } = {}) {
	const { Collection } = require('discord.js');
	const messageChannel = channel || createMockChannel();
	return {
		id: generateSnowflake(),
		content: content,
		cleanContent: content,
		member,
		author,
		channel: messageChannel,
		reply: vi.fn(async (text) => createMockMessage({ content: text, channel: messageChannel })),
		// @ts-ignore
		react: vi.fn(async () => ({})),
		webhookId: null,
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

export function generateSnowflake() {
	return String(Math.floor(Math.random() * 999999999));
}

export default {
	createMockChannel,
	createMockGuild,
	createMockClient,
	createMockMessage,
	createMockMember
};
