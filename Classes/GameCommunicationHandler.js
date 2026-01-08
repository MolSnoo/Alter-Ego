import Action from "../Data/Action.js";
import Room from "../Data/Room.js";
import * as messageHandler from "../Modules/messageHandler.js";
import { parseDescription } from "../Modules/parser.js";
import { Attachment, Collection } from "discord.js";

/** @typedef {import("../Data/Dialog.js").default} Dialog */
/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("../Data/GameEntity.js").default} GameEntity */
/** @typedef {import("../Data/Narration.js").default} Narration */
/** @typedef {import("../Data/Player.js").default} Player */
/** @typedef {import("../Data/Whisper.js").default} Whisper */
/** @typedef {import("discord.js").Snowflake} Snowflake */

/**
 * @class GameCommunicationHandler
 * @classdesc An interface for the message handler. Contains a number of functions that ensure actions won't be communicated multiple times in the same channel.
 */
export default class GameCommunicationHandler {
	/**
	 * The game this belongs to.
	 * @readonly
	 * @type {Game}
	 */
	#game;
	/**
	 * A cache of recently-performed actions. This is used to ensure that actions are communicated only once in any given channel.
	 * @type {Collection<string, Action>}
	 */
	#actionCache;
	/**
	 * The maximum size of the actionCache.
	 * @readonly
	 */
	#actionCacheSizeLimit = 20;
	/** 
	 * A collection of mirrored dialog messages to allow edits to dialog messages to be reflected in spectate channels.
	 * The key is the ID of the original message that's being mirrored.
	 * @type {Collection<string, DialogSpectateMirror[]>}
	 */
	#dialogSpectateMirrorCache;
	/**
	 * The maximum size of the dialogSpectateMirrorCache.
	 * @readonly
	 */
	#dialogSpectateMirrorCacheSizeLimit = 50;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 */
	constructor(game) {
		this.#game = game;
		this.#actionCache = new Collection();
		this.#dialogSpectateMirrorCache = new Collection();
	}

	/**
	 * Returns the actionCache.
	 */
	getActionCache() {
		return this.#actionCache;
	}

	/**
	 * Adds an action to the cache. If the cache is at maximum capacity, removes the oldest one.
	 * @param {Action} action - The action to cache. 
	 */
	#addActionToCache(action) {
		if (this.#actionCache.size >= this.#actionCacheSizeLimit)
			this.#actionCache.delete(this.#actionCache.firstKey());
		this.#actionCache.set(action.id, action);
	}

	/**
	 * Caches a channel for a given action.
	 * @param {Action} action - The action to cache a channel for. 
	 * @param {string} channelId - The channel to cache.
	 */
	#cacheChannelFor(action, channelId) {
		if (this.#actionCache.has(action.id))
			this.#actionCache.get(action.id).addToMirrors(channelId);
		else {
			action.addToMirrors(channelId);
			this.#addActionToCache(action);
		}
	}

	/**
	 * Returns true if the action has already been communicated in the given channel.
	 * Also returns true if the channel does not exist (e.g. for a player with no spectate channel).
	 * @param {Messageable} channel - The channel to check for.
	 * @param {Action} action - The action to check for.
	 */
	#actionHasBeenCommunicatedInChannel(channel, action) {
		if (!channel) return true;
		return action.hasBeenCommunicatedIn(channel.id);
	}

	/**
	 * Adds the message to the dialog cache.
	 * @param {UserMessage} message - The message that initiated the dialog. 
	 */
	cacheDialog(message) {
		if (this.#dialogSpectateMirrorCache.size >= this.#dialogSpectateMirrorCacheSizeLimit)
			this.#dialogSpectateMirrorCache.delete(this.#dialogSpectateMirrorCache.firstKey());
		this.#dialogSpectateMirrorCache.set(message.id, []);
	}

	/**
	 * Adds a spectate mirror to the dialog cache for the given message.
	 * @param {UserMessage} message - The message being mirrored.
	 * @param {Snowflake} mirrorMessageId - The message ID of the spectate mirror.
	 * @param {Snowflake} mirrorWebhookId - The ID of the webhook that sent the spectate mirror.
	 */
	cacheSpectateMirrorForDialog(message, mirrorMessageId, mirrorWebhookId) {
		const spectateMirrors = this.getDialogSpectateMirrors(message);
		if (spectateMirrors) spectateMirrors.push({ messageId: mirrorMessageId, webhookId: mirrorWebhookId });
	}

	/**
	 * Returns the list of spectate mirrors for the given dialog message.
	 * If the given dialog message isn't cached, returns undefined.
	 * @param {UserMessage|import('discord.js').PartialMessage} message - The message that was mirrored.
	 */
	getDialogSpectateMirrors(message) {
		return this.#dialogSpectateMirrorCache.get(message.id);
	}

	/**
	 * Replies to a message. This is usually done when a user has sent a message with an error.
	 * @param {UserMessage} message - The message to reply to.
	 * @param {string} messageText - The text of the message to send in response.
	 */
	reply(message, messageText) {
		messageHandler.addReply(this.#game, message, messageText);
	}

	/**
	 * Sends a message to the command channel.
	 * @param {string} messageText - The text of the message to send.
	 */
	sendToCommandChannel(messageText) {
		messageHandler.addGameMechanicMessage(this.#game, this.#game.guildContext.commandChannel, messageText);
	}

	/**
	 * Sends a message to a player without any checks.
	 * @param {Player} player - The player to send the message to.
	 * @param {string} messageText - The text of the message to send.
	 * @param {boolean} [mirrorInSpectateChannel] - Whether or not to mirror the notification in their spectate channel. Defaults to true.
	 */
	sendMessageToPlayer(player, messageText, mirrorInSpectateChannel = true) {
		messageHandler.addDirectNarration(player, messageText, mirrorInSpectateChannel);
	}

	/**
	 * Sends a description to a player without any checks.
	 * @param {Player} player - The player to send the notification to.
	 * @param {string} description - The description to parse and send.
	 * @param {GameEntity} container - The game entity the description belongs to.
	 * @param {boolean} [mirrorInSpectateChannel] - Whether or not to mirror the room description in their spectate channel. Defaults to true.
	 */
	sendDescriptionToPlayer(player, description, container, mirrorInSpectateChannel = true) {
		if (container instanceof Room) {
			let defaultDropFixtureString = "";
			const defaultDropFixture = this.#game.entityFinder.getFixture(this.#game.settings.defaultDropFixture, container.id);
			if (defaultDropFixture)
				defaultDropFixtureString = parseDescription(defaultDropFixture.description, defaultDropFixture, player);
			messageHandler.addRoomDescription(player, container, parseDescription(description, container, player), defaultDropFixtureString, mirrorInSpectateChannel);
		}
		else
			this.sendMessageToPlayer(player, parseDescription(description, container, player), mirrorInSpectateChannel);
	}

	/**
	 * Sends a notification to a player.
	 * @param {Player} player - The player to send the notification to.
	 * @param {Action} action - The action that triggered the notification.
	 * @param {string} notification - The text of the notification to send.
	 * @param {boolean} [mirrorInSpectateChannel] - Whether or not to mirror the notification in their spectate channel. Defaults to true.
	 */
	notifyPlayer(player, action, notification, mirrorInSpectateChannel = true) {
		if (!this.#actionHasBeenCommunicatedInChannel(player.member.dmChannel, action)) {
			this.#cacheChannelFor(action, player.member.dmChannel.id);
			player.notify(notification, mirrorInSpectateChannel);
		}
	}

	/**
	 * Sends a notification to a player with attachments.
	 * @param {Player} player - The player to send the notification to.
	 * @param {Action} action - The action that triggered the notification.
	 * @param {string} notification - The text of the notification to send.
	 * @param {Collection<string, Attachment>} attachments - The attachments to send.
	 * @param {boolean} [mirrorInSpectateChannel] - Whether or not to mirror the notification in their spectate channel. Defaults to true.
	 */
	notifyPlayerWithAttachments(player, action, notification, attachments, mirrorInSpectateChannel = true) {
		if (!this.#actionHasBeenCommunicatedInChannel(player.member.dmChannel, action)) {
			this.#cacheChannelFor(action, player.member.dmChannel.id);
			messageHandler.addDirectNarrationWithAttachments(player, notification, attachments, mirrorInSpectateChannel);
		}
	}

	/**
	 * Mirrors dialog in a player's spectate channel.
	 * @param {Player} player - The player whose spectate channel this dialog will be mirrored in.
	 * @param {Action} action - The action associated with the dialog.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 * @param {string} [webhookUsername] - A custom username to use for the webhook that will send the spectate message. Optional.
	 * @param {string} [notification] - A custom notification that will be sent to the player afterwards. Optional. This notification will not be mirrored in the spectate channel.
	 */
	mirrorDialogInSpectateChannel(player, action, dialog, webhookUsername, notification) {
		if (!this.#actionHasBeenCommunicatedInChannel(player.spectateChannel, action)) {
			this.#cacheChannelFor(action, player.spectateChannel.id);
			messageHandler.sendDialogSpectateMessage(player, dialog, webhookUsername);
			if (notification) this.notifyPlayer(player, action, notification, false);
		}
	}

	/**
	 * Sends a narration to a room channel and mirrors it in the spectate channels of all of the room's occupants.
	 * @param {Narration} narration - The narration to send.
	 */
	narrateInRoom(narration) {
		if (!narration.action || !this.#actionHasBeenCommunicatedInChannel(narration.location.channel, narration.action)) {
			if (narration.action) this.#cacheChannelFor(narration.action, narration.location.channel.id);
			messageHandler.addNarration(narration.location, narration.message, true, narration.player);
		}
	}

	/**
	 * Sends a narration to a whisper channel and mirrors it in the spectate channels of all the whisper's players.
	 * @param {Whisper} whisper - The whisper to send the narration to.
	 * @param {Action} action - The action that initiated this narration.
	 * @param {string} narrationText - The text of the narration to send.
	 */
	narrateInWhisper(whisper, action, narrationText) {
		if (!this.#actionHasBeenCommunicatedInChannel(whisper.channel, action)) {
			this.#cacheChannelFor(action, whisper.channel.id);
			messageHandler.addNarrationToWhisper(whisper, narrationText);
		}
	}

	/**
	 * Sends the help menu for a command.
	 * @param {UserMessage} message - The message that sent the help command.
	 * @param {Command} command - The command to send the help menu for.
	 */
	sendCommandHelp(message, command) {
		const channel = command.config.usableBy === "Moderator" ? this.#game.guildContext.commandChannel : message.author.dmChannel;
		messageHandler.addCommandHelp(this.#game, channel, command);
	}

	/**
	 * Sends a message to the log channel.
	 * @param {string} logText - The message of the text to send.
	 */
	sendLogMessage(logText) {
		messageHandler.addLogMessage(this.#game, logText);
	}
}