import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export function createPermissionOverwritesManager() {
	const permissionOverwritesManager = {
		create: (permissionOverwrites) => {}
	};
	return permissionOverwritesManager;
}

export function createMockGuildChannelManager() {
	const { Collection } = require('discord.js');
	const channelManager = {
		cache: new Collection(),
		resolve: (id) => channelManager.cache.get(id),
		create: ({ name, type, parentId }) => createMockChannel(generateSnowflake(), name, type, parentId, channelManager.resolve(parentId)),
		fetch: async (id) => channelManager.cache.get(id)
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
		bulkDelete: (messages, filterOld) => {},
		send: async () => createMockMessage({ content: '', channel: channel }),
		edit: ({ name }) => channel.name = name,
		fetchWebhooks: () => [],
		createWebhook: ({}) => {},
		permissionOverwrites: createPermissionOverwritesManager(),
		lockPermissions: () => {},
		delete: () => {}
	};
	return channel;
}

export function createMockUser(id = generateSnowflake(), username = '') {
	const user = {
		id: id,
		username: username,
		defaultAvatarURL: '',
		dmChannel: createMockChannel(id, username),
		send: async ({}) => createMockMessage({ content: '', channel: user.dmChannel }),
		avatarURL: () => '',
		setPresence: () => {}
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
		resolve: (id) => roleManager.cache.get(id),
		fetch: async (id) => roleManager.get(id),
		add: () => {},
		remove: () => {},
	};
	return roleManager;
}

export function createMockMember(id = generateSnowflake(), displayName = '') {
	const member = {
		id: id,
		displayName: displayName,
		displayAvatarURL: () => '',
		avatarURL: () => '',
		user: createMockUser(id, displayName),
		roles: createMockRoleManager(),
		permissionsIn: (channel) => {
			has: (permission) => true
		},
		send: async ({}) => Promise.resolve(createMockMessage({ content: '', channel: member.user.dmChannel }))
	};
	return member;
}

export function createMockGuildMemberManager() {
	const { Collection } = require('discord.js');
	const memberManager = {
		cache: new Collection(),
		resolve: (id) => memberManager.cache.get(id),
		fetch: async (id) => memberManager.cache.get(id),
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
		iconURL: () => '',
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

export function createMockMessage({ content = '', member = createMockMember(), author = createMockUser(), channel = null } = {}) {
	const { Collection } = require('discord.js');
	const messageChannel = channel || createMockChannel();
	return {
		id: generateSnowflake(),
		content,
		member,
		author,
		channel: messageChannel,
		reply: async (text) => createMockMessage({ content: text, channel: messageChannel }),
		react: async () => ({}),
		webhookId: null,
		attachments: new Collection(),
		embeds: [],
		mentions: {
			members: new Collection(),
			channels: new Collection()
		},
		delete: async () => ({}),
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
};
