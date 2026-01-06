import Action from "../Data/Action.js";
import { sendDialogSpectateMessage } from "../Modules/messageHandler.js";

import { Collection } from "discord.js";

/** @typedef {import("../Data/Dialog.js").default} Dialog */
/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("../Data/Player.js").default} Player */
/** @typedef {import("discord.js").Snowflake} Snowflake */
/** @typedef {import("discord.js").TextChannel} TextChannel */

/**
 * @class GameCommunicationHandler
 * @classdesc A set of functions to handle communicating actions to players and spectators.
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
	 * @param {TextChannel} channel - The channel to check for.
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
	 * Sends a notification to a player.
	 * @param {Player} player - The player to send the notification to.
	 * @param {Action} action - The action that triggered the notification.
	 * @param {string} notification - The text of the notification to send.
	 * @param {boolean} [mirrorInSpectateChannel] - Whether or not to mirror the notification in their spectate channel. Defaults to true.
	 */
	notifyPlayer(player, action, notification, mirrorInSpectateChannel = true) {
		if (!this.#actionHasBeenCommunicatedInChannel(player.spectateChannel, action)) {
			this.#cacheChannelFor(action, player.spectateChannel.id);
			player.notify(notification, mirrorInSpectateChannel);
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
			sendDialogSpectateMessage(player, dialog, webhookUsername);
			if (notification) this.notifyPlayer(player, action, notification, false);
		}
	}
}