import Action from "../Data/Action.js";
import { sendDialogSpectateMessage } from "../Modules/messageHandler.js";

import { Collection } from "discord.js";

/** @typedef {import("../Data/Dialog.js").default} Dialog */
/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("discord.js").TextChannel} TextChannel */

/**
 * @class GameDialogHandler
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
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 */
	constructor(game) {
		this.#game = game;
		this.#actionCache = new Collection();
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
		const actionCacheLimit = 20;
		if (this.#actionCache.size >= actionCacheLimit)
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
	 * Mirrors an announcement in spectate channels.
	 * @param {Action} action - The action associated with the announcement. 
	 * @param {Dialog} dialog - The dialog of the announcement. 
	 */
	mirrorAnnouncement(action, dialog) {
		this.#game.livingPlayersCollection.forEach(livingPlayer => {
			if (!this.#actionHasBeenCommunicatedInChannel(livingPlayer.spectateChannel, action)) {
				this.#cacheChannelFor(action, livingPlayer.spectateChannel.id);
				sendDialogSpectateMessage(livingPlayer, dialog);
			}
		});
	}
}