// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Interactable from "./Interactables/Interactable.ts";
import type Action from "../Data/Action.ts";
import type Command from "./Command.ts";
import type Dialog from "../Data/Dialog.ts";
import type Game from "../Data/Game.ts";
import type GameEntity from "../Data/GameEntity.ts";
import type Narration from "../Data/Narration.ts";
import type Notification from "../Data/Notification.ts";
import type Player from "../Data/Player.ts";
import type Room from "../Data/Room.ts";
import { MessageDisplayType } from "../Modules/enums.ts";
import * as messageHandler from "../Modules/messageHandler.ts";
import { asyncReplace, capitalizeFirstLetter } from "../Modules/helpers.ts";
import { ChannelType, Collection, SnowflakeUtil } from "discord.js";
import type { ApplicationEmoji, Attachment, Embed, EmbedBuilder, Message, Snowflake, TextChannel } from "discord.js";
import crypto from 'crypto';
import sharp from "sharp";

/**
 * A dialog message that has been mirrored in a spectate channel.
 */
interface DialogSpectateMirror {
    /** The ID of the mirrored dialog message. */
    messageId: Snowflake;
    /** The ID of the webhook used to send the mirrored message to the spectate channel. */
    webhookId: Snowflake;
}

/**
 * An interface for the message handler. Contains a number of functions that ensure actions won't be communicated multiple times in the same channel.
 */
export default class GameCommunicationHandler {
    /**
     * The game this belongs to.
     */
    readonly #game: Game;
    /**
     * A cache of recently-performed actions. This is used to ensure that actions are communicated only once in any given channel.
     */
    readonly #actionCache: Collection<string, Action>;
    /**
     * The maximum size of the actionCache.
     */
    readonly #actionCacheSizeLimit = 20;
    /**
     * A collection of mirrored dialog messages to allow edits to dialog messages to be reflected in spectate channels.
     * The key is the ID of the original message that's being mirrored.
     */
    readonly #dialogSpectateMirrorCache: Collection<string, DialogSpectateMirror[]>;
    /**
     * The maximum size of the dialogSpectateMirrorCache.
     */
    readonly #dialogSpectateMirrorCacheSizeLimit = 50;

    /**
     * The regex used when matching emojis.
     */
    private static readonly emojiRegex = /<(a?):([a-zA-Z0-9_]+):([0-9]+)>/g;

    /**
     * @param game - The game this belongs to.
     */
    constructor(game: Game) {
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
     * @param action - The action to cache.
     */
    #addActionToCache(action: Action) {
        if (this.#actionCache.size >= this.#actionCacheSizeLimit)
            this.#actionCache.delete(this.#actionCache.firstKey());
        this.#actionCache.set(action.id, action);
    }

    /**
     * Caches a channel for a given action.
     * @param action - The action to cache a channel for.
     * @param channelId - The channel to cache.
     */
    #cacheChannelFor(action: Action, channelId: string) {
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
     * @param channel - The channel to check for.
     * @param action - The action to check for.
     */
    #actionHasBeenCommunicatedInChannel(channel: Messageable, action: Action) {
        if (!channel) return true;
        return action.hasBeenCommunicatedIn(channel.id);
    }

    /**
     * Adds the message to the dialog cache.
     * @param message - The message that initiated the dialog.
     */
    cacheDialog(message: UserMessage) {
        if (this.#dialogSpectateMirrorCache.size >= this.#dialogSpectateMirrorCacheSizeLimit)
            this.#dialogSpectateMirrorCache.delete(this.#dialogSpectateMirrorCache.firstKey());
        this.#dialogSpectateMirrorCache.set(message.id, []);
    }

    /**
     * Hash an emoji given the name, snowflake, and whether or not it is animated.
     * Mostly for keeping code DRY.
     * @param name - The name of the emoji.
     * @param snowflake - The snowflake of the emoji.
     * @param animated - Whether the emoji is animated.
     * @returns The hash of the emoji.
     */
    private hashEmoji(name: string, snowflake: string, animated: boolean): string {
        return crypto.createHash('md5').update(`${name}:${snowflake}:${animated}`).digest('hex');
    }

    /**
     * Generate an emoji name given the name and hash of the original emoji.
     * Mostly for keeping code DRY.
     * @param name - The name of the emoji.
     * @param hash - The hash of the original emoji, computed by `GameCommunicationHandler.hashEmoji`.
     * @returns The name of the new emoji.
     */
    private generateEmojiName(name: string, hash: string): string {
        return name.slice(0, 23) + "_" + hash.slice(0, 8);
    }

    /**
     * Cache a single emoji.
     * @param cached - Set of MD5 hashes that are already cached.
     * @param data - Data object of the emoji to cache.
     */
    private async cacheEmoji(cached: Set<string>, data: { animated: boolean, name: string, snowflake: string, hash: string }): Promise<void> {
        const selfName = this.generateEmojiName(data.name, data.hash);
        if (cached.has(selfName))
            return;

        const url = `https://cdn.discordapp.com/emojis/${data.snowflake}${data.animated ? `.webp?size=64&animated=true&name=${data.name}&lossless=true` : `.webp?size=64&name=${data.name}&lossless=true`}`;
        const emoji = await fetch(url);
        const emojiData = data.animated ?
            await sharp(await emoji.bytes(), { animated: true }).gif().toBuffer() :
            await sharp(await emoji.bytes()).png().toBuffer();
        const emojiBase64 = emojiData.toString("base64");
        await this.#game.clientContext.client.application.emojis.create({ attachment: `data:image/${ data.animated ? "gif" : "png" };base64,${emojiBase64}`, name: selfName });
    }

    /**
     * Adds the emojis in the given message to the emoji cache.
     * @param message - The message that initiated the cache.
     */
    async cacheEmojis(message: UserMessage) {
        const application = this.#game.clientContext.client.application;
        const emojiData: { animated: boolean, name: string, snowflake: string, hash: string }[] = [];
        const guildEmojis = this.#game.guildContext.guild.emojis.cache;

        for (const match of message.content.matchAll(GameCommunicationHandler.emojiRegex)) {
            const animated = match[1] === "a";
            const name = match[2];
            const snowflake = match[3];
            const hash = this.hashEmoji(name, snowflake, animated);
            emojiData.push({ animated: animated, name: name, snowflake: snowflake, hash: hash });
        }

        emojiData.filter(emoji => !guildEmojis.has(emoji.snowflake));

        if (emojiData.length === 0)
            return;

        if (application.emojis.cache.size >= 1975)
            await this.deleteNumberOfOldestEmoji(emojiData.length);

        const appEmojis = new Set(application.emojis.cache.map(emoji => emoji.name));

        const promises: Promise<void>[] = [];
        for (const data of emojiData)
            promises.push(this.cacheEmoji(appEmojis, data));
        await Promise.all(promises);
    }

    /**
     * Delete a given number of the oldest emoji.
     * @param x - The number of emoji to delete.
     */
    private async deleteNumberOfOldestEmoji(x: number): Promise<void> {
        const emojis = this.#game.clientContext.client.application.emojis.cache.map(emoji => emoji);

        emojis.sort((a, b) => {
            const aSnow = SnowflakeUtil.deconstruct(a.id);
            const bSnow = SnowflakeUtil.deconstruct(b.id);

            if (aSnow.epoch < bSnow.epoch) return 1;
            if (aSnow.epoch > bSnow.epoch) return -1;
            return 0;
        });

        const promises: Promise<void>[] = [];
        for (let i = 0; i < x; i++)
            promises.push(this.#game.clientContext.client.application.emojis.delete(emojis.pop()));
        await Promise.all(promises);
    }

    /**
     * Fetches the application emoji version of the given emoji
     * @param emoji - The message that initiated the cache.
     */
    fetchCachedEmoji(emoji: {animated: boolean, name: string, snowflake: string}): ApplicationEmoji | undefined {
        const application = this.#game.clientContext.client.application;
        const guildEmojis = this.#game.guildContext.guild.emojis.cache;
        if (guildEmojis.has(emoji.snowflake))
            return undefined;

        const hash = this.hashEmoji(emoji.name, emoji.snowflake, emoji.animated);
        const name = this.generateEmojiName(emoji.name, hash);

        return application.emojis.cache.find(emoji => emoji.name === name);
    }

    /**
     * asyncReplace replacer for emojis, swapping user emojis with application emojis.
     * @param match - The matched text.
     * @param _offset - Unused.
     * @param _input - Unused.
     * @param captures - The array of captured strings.
     * @returns Text with user emojis swapped with application emojis.
     */
    private async emojiReplacer(match: string, _offset: number, _input: string, ...captures: string[]) {
        const animated = captures[0] === "a";
        const name = captures[1];
        const snowflake = captures[2];
        const emoji = this.fetchCachedEmoji({ animated: animated, name: name, snowflake: snowflake });
        if (emoji)
            return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
        else
            return match;
    }

    /**
     * Replaces custom emojis in the input with application cached emojis
     * @param text - The body of text to replace emojis in.
     */
    async replaceEmoji(text: string): Promise<string> {
        return await asyncReplace(text, GameCommunicationHandler.emojiRegex, this.emojiReplacer, this);
    }

    /**
     * Adds a spectate mirror to the dialog cache for the given message.
     * @param message - The message being mirrored.
     * @param mirrorMessageId - The message ID of the spectate mirror.
     * @param mirrorWebhookId - The ID of the webhook that sent the spectate mirror.
     */
    cacheSpectateMirrorForDialog(message: UserMessage, mirrorMessageId: Snowflake, mirrorWebhookId: Snowflake) {
        const spectateMirrors = this.getDialogSpectateMirrors(message);
        if (spectateMirrors) spectateMirrors.push({ messageId: mirrorMessageId, webhookId: mirrorWebhookId });
    }

    /**
     * Returns the list of spectate mirrors for the given dialog message.
     * If the given dialog message isn't cached, returns undefined.
     * @param message - The message that was mirrored.
     */
    getDialogSpectateMirrors(message: UserMessage | import('discord.js').PartialMessage) {
        return this.#dialogSpectateMirrorCache.get(message.id);
    }

    /**
     * Returns true if the given message was sent in a room channel.
     * @param message
     */
    wasSentInRoomChannel(message: UserMessage) {
        if (message.channel.type !== ChannelType.GuildText) return false;
        return this.#game.guildContext.roomCategories.includes(message.channel.parentId);
    }

    /**
     * Returns true if the given message was sent in a room channel.
     * @param message
     */
    wasSentInWhisperChannel(message: UserMessage) {
        if (message.channel.type !== ChannelType.GuildText) return false;
        return message.channel.parentId === this.#game.guildContext.whisperCategoryId;
    }

    /**
     * Returns true if the given message was sent in a room channel.
     * @param message
     */
    wasSentInAnnouncementChannel(message: UserMessage) {
        if (message.channel.type !== ChannelType.GuildText) return false;
        return message.channel.id === this.#game.guildContext.announcementChannel.id;
    }

    /**
     * Replies to a message. This is usually done when a user has sent a message with an error.
     * @param message - The message to reply to.
     * @param messageText - The text of the message to send in response.
     * @param deleteMessage - Whether or not to delete the original message after sending the reply. Defaults to false.
     */
    reply(message: UserMessage, messageText: string, deleteMessage: boolean = false) {
        let member = this.#game.guildContext.guild.members.resolve(message.author.id);
        if (member && member.roles.cache.has(this.#game.guildContext.moderatorRole.id) && message.channel.id !== this.#game.guildContext.commandChannel.id && message.channel.type !== ChannelType.DM) {
            messageHandler.sendGameMechanicMessage(this.#game, this.#game.guildContext.commandChannel, `<@${message.author.id}>, ${messageText}`);
            if (deleteMessage) this.deleteMessage(message);
        }
        else {
            messageHandler.sendReply(this.#game, message, messageText, deleteMessage);
        }
    }

    /**
     * Sends a message to the command channel.
     * @param messageText - The text of the message to send.
     * @param interactables - An array of interactables.
     */
    sendToCommandChannel(messageText: string, interactables: Interactable[] = []) {
        messageHandler.sendGameMechanicMessage(this.#game, this.#game.guildContext.commandChannel, messageText, interactables);
    }

    /**
     * Sends a message to a player without any checks.
     * @param player - The player to send the message to.
     * @param messageText - The text of the message to send.
     * @param mirrorInSpectateChannel - Whether or not to mirror the notification in their spectate channel. Defaults to true.
     * @param messageType - The type of message to send. Defaults to PLAIN_TEXT.
     * @param attachments - The attachments to send. Optional.
     * @param interactables - An array of interactables.
     */
    sendMessageToPlayer(player: Player, messageText: string, mirrorInSpectateChannel: boolean = true, messageType: MessageDisplayType = MessageDisplayType.PLAIN_TEXT, attachments?: Collection<string, Attachment>, interactables: Interactable[] = []) {
        if (messageText !== "")
            messageHandler.sendNotification(player, messageText, messageType, mirrorInSpectateChannel, attachments, interactables)
    }

    /**
     * Sends a description to a player without any checks.
     * @param player - The player to send the notification to.
     * @param descriptionString - The already parsed description.
     * @param container - The game entity the description belongs to.
     * @param messageDisplayType - The display type of the message to send. Defaults to PLAIN_TEXT. Does nothing when sending a room description.
     * @param mirrorInSpectateChannel - Whether or not to mirror the room description in their spectate channel. Defaults to true.
     * @param interactables[] - An array of interactables to send with the message.
     */
    sendDescriptionToPlayer(player: Player, descriptionString: string, container: GameEntity, messageDisplayType: MessageDisplayType = MessageDisplayType.PLAIN_TEXT, mirrorInSpectateChannel: boolean = true, interactables: Interactable[] = []) {
        this.sendMessageToPlayer(player, descriptionString, mirrorInSpectateChannel, messageDisplayType, new Collection(), interactables);
    }

    /**
     * Sends an already-parsed room description to the player.
     * @param player - The player to send the description to.
     * @param room - The room the description belongs to.
     * @param roomDescriptionString - The already parsed room description.
     * @param occupantsString - A list of occupants in the room.
     * @param defaultDropFixtureString - A string to describe the default drop fixture in this room.
     * @param interactables - An array of interactables to send with the message.
     */
    sendRoomDescriptionToPlayer(player: Player, room: Room, roomDescriptionString: string, occupantsString: string, defaultDropFixtureString: string, interactables: Interactable[] = []) {
        messageHandler.sendRoomDescription(player, room, roomDescriptionString, occupantsString, defaultDropFixtureString, true, interactables);
    }

    /**
     * Sends a move progress indicator to the given players.
     * @param players - The players to send the move progress indicator to.
     * @param progressIndicator - The content of the move progress indicator.
     * @param messageDisplayType - The display type of the message to send. Defaults to STANDARD.
     */
    sendMoveProgressIndicatorToPlayers(players: Set<Player>, progressIndicator: string, messageDisplayType: MessageDisplayType = MessageDisplayType.STANDARD) {
        if (progressIndicator === "") return;
        for (const player of players)
            messageHandler.sendMoveProgressIndicatorMessage(player, progressIndicator, messageDisplayType);
    }

    /**
     * Sends a notification to a player.
     * @param notification - The text of the notification to send.
     */
    notifyPlayer(notification: Notification) {
        if (!this.#actionHasBeenCommunicatedInChannel(notification.player.notificationChannel, notification.action)) {
            this.#cacheChannelFor(notification.action, notification.player.notificationChannel.id);
            this.sendMessageToPlayer(notification.player, notification.content, false, notification.messageDisplayType, notification.attachments, notification.interactables);
            if (notification.mirrorInSpectateChannel)
                this.mirrorNarrationInSpectateChannel(notification.player, notification.action, notification.messageDisplayType, notification.content, notification.attachments.map(attachment => attachment.url));
        }
    }

    /**
     * Mirrors dialog in a player's spectate channel.
     * @param player - The player whose spectate channel this dialog will be mirrored in.
     * @param action - The action associated with the dialog.
     * @param dialog - The dialog that was spoken.
     * @param webhookUsername - The username to use for the mirrored webhook message. Defaults to the dialog speaker's display name.
     * @param webhookAvatarURL - The avatar URL to use for the mirrored webhook message. Defaults to the dialog speaker's display icon.
     * @param messageText - The text of the message to send. Defaults to the content of the dialog.
     * @param notification - A custom notification that will be sent to the player afterwards. Optional. This notification will not be mirrored in the spectate channel.
     */
    mirrorDialogInSpectateChannel(player: Player, action: Action, dialog: Dialog, webhookUsername: string = capitalizeFirstLetter(dialog.speakerDisplayName), webhookAvatarURL: string = dialog.speakerDisplayIcon, messageText: string = dialog.content, notification?: string) {
        if (!this.#actionHasBeenCommunicatedInChannel(player.spectateChannel, action)) {
            this.#cacheChannelFor(action, player.spectateChannel.id);
            if (!dialog.isOOCMessage) messageHandler.sendWebhookSpectateMessage(player, messageText, webhookUsername, webhookAvatarURL, dialog.embeds, dialog.attachments.map(attachment => attachment.url), dialog.message);
            if (notification) this.#game.narrationHandler.sendNotification(player, action, notification, MessageDisplayType.PLAIN_TEXT, false);
        }
    }

    /**
     * Mirrors a message in a player's spectate channel.
     * @param player - The player whose spectate channel this message is being sent to.
     * @param action - The action associated with the message.
     * @param webhookUsername - The username to use for the mirrored webhook message.
     * @param webhookAvatarURL - The avatar URL to use for the mirrored webhook message.
     * @param messageText - The text of the message to send.
     * @param messageDisplayType - The type of message to send.
     * @param embeds - An array of embeds to send in the message. Optional.
     * @param files - An array of URLs to send as attachments. Optional.
     * @param message - The message being mirrored. Optional.
     */
    mirrorWebhookMessageInSpectateChannel(player: Player, action: Action, webhookUsername: string, webhookAvatarURL: string, messageText: string, messageDisplayType: MessageDisplayType, embeds?: Embed[], files?: string[], message?: UserMessage) {
        if (!this.#actionHasBeenCommunicatedInChannel(player.spectateChannel, action)) {
            this.#cacheChannelFor(action, player.spectateChannel.id);
            messageHandler.sendWebhookSpectateMessage(player, messageText, webhookUsername, webhookAvatarURL, embeds, files, message, messageDisplayType);
        }
    }

    /**
     * Mirrors a narration in a player's spectate channel.
     * @param player - The player whose spectate channel this narration will be mirrored in.
     * @param action - The action associated with the narration.
     * @param messageDisplayType - The display type of the message to send.
     * @param narrationText - The text of the narration to send.
     * @param files - An array of URLs to send as attachments. Optional.
     */
    mirrorNarrationInSpectateChannel(player: Player, action: Action, messageDisplayType: MessageDisplayType, narrationText: string, files?: string[]) {
        if (!this.#actionHasBeenCommunicatedInChannel(player.spectateChannel, action)) {
            this.#cacheChannelFor(action, player.spectateChannel.id);
            messageHandler.sendNarrationSpectateMessage(player, narrationText, messageDisplayType, files);
        }
    }

    /**
     * Mirrors a narration in a player's spectate channel as a webhook message.
     * @param player - The player whose spectate channel this narration will be mirrored in.
     * @param action - The action associated with the narration.
     * @param narration - The narration that was written.
     * @param webhookUsername - A custom username to use for the webhook that will send the spectate message.
     * @param webhookAvatarURL - A custom avatar URL to use for the webhook that will send the spectate message.
     * @param narrationText - The custom text of the narration to send. Optional.
     */
    mirrorWebhookNarrationInSpectateChannel(player: Player, action: Action, narration: Narration, webhookUsername: string, webhookAvatarURL: string, narrationText: string = narration.content) {
        if (narration.isOOCMessage) return;
        this.mirrorWebhookMessageInSpectateChannel(player, action, webhookUsername, webhookAvatarURL, narrationText, narration.messageDisplayType, narration.embeds, narration.attachments.map(attachment => attachment.url), narration.message);
    }

    /**
     * Sends a narration to a room channel and mirrors it in the spectate channels of all of the room's occupants.
     * @param narration - The narration to send.
     * @param narrationText - The custom text of the narration to send. Optional.
     * @param mirrorInSpectateChannel - Whether or not to mirror the notification in spectate channels. Defaults to true.
     * @param room - The room to send the narration to. Defaults to the location of the narration.
     * @param webhookUsername - The username to use for the narrated webhook message, if applicable.
     */
    narrateInRoom(narration: Narration, narrationText: string = narration.content, mirrorInSpectateChannel: boolean = true, room: Room = narration.location, webhookUsername?: string) {
        if (!narration.action || !this.#actionHasBeenCommunicatedInChannel(room.channel, narration.action)) {
            if (narration.action) this.#cacheChannelFor(narration.action, room.channel.id);
            messageHandler.sendNarrationToRoom(room, narration, narrationText, narration.messageDisplayType, mirrorInSpectateChannel, narration.player, webhookUsername);
        }
    }

    /**
     * Sends a narration to a whisper channel and mirrors it in the spectate channels of all the whisper's players.
     * @param narration - The narration to send.
     * @param narrationText - The custom text of the narration to send. Optional.
     * @param mirrorInSpectateChannel - Whether or not to mirror the notification in spectate channels. Defaults to true.
     */
    narrateInWhisper(narration: Narration, narrationText: string = narration.content, mirrorInSpectateChannel: boolean = true) {
        if (!narration.action || !this.#actionHasBeenCommunicatedInChannel(narration.whisper.channel, narration.action)) {
            if (narration.action) this.#cacheChannelFor(narration.action, narration.whisper.channel.id);
            messageHandler.sendNarrationToWhisper(narration.whisper, narration, narrationText, narration.getWhisperPrefixString(), narration.messageDisplayType, mirrorInSpectateChannel);
        }
    }

    /**
     * Sends the help menu for a command.
     * @param channel - The channel to send the help menu to.
     * @param command - The command to send the help menu for.
     */
    sendCommandHelp(channel: Messageable, command: Command) {
        messageHandler.sendCommandHelp(this.#game, channel, command);
    }

    /**
     * Sends the view of a game entity as an array of Discord components.
     * @param entityType - The type of entity this view is for.
     * @param entityRow - The row number of this entity.
     * @param fields - An array of view fields to convert into components.
     * @param interactables - An array of interactables.
     */
    sendEntityView(entityType: PersistentGameEntityName, entityRow: number, fields: ViewField[], interactables: Interactable[] = []) {
        messageHandler.sendEntityView(this.#game, this.#game.guildContext.commandChannel, entityType, entityRow, fields, interactables);
    }

    /**
     * Sends a message to the given channel as a game mechanic message.
     * @param channel - The channel to send the message to.
     * @param messageText - The text of the message to send.
     * @param embeds - The embeds to send.
     * @param interactables - An array of interactables.
     */
    sendToChannel(channel: Messageable, messageText: string = "", embeds: (Embed | EmbedBuilder)[] = [], interactables: Interactable[] = []) {
        messageHandler.sendGameMechanicMessage(this.#game, channel, messageText, interactables, embeds);
    }

    /**
     * Sends a message to the log channel.
     * @param logText - The message of the text to send.
     */
    sendLogMessage(logText: string) {
        messageHandler.sendLogMessage(this.#game, logText);
    }

    /**
     * Sends dialog as a webhook message to the specified channel.
     * @param dialog - The dialog to send.
     * @param channel - The channel to send the webhook message to.
     * @param webhookUsername - A custom username to use for the webhook that will send the spectate message. Optional.
     * @param webhookAvatarURL - A custom avatar URL to use for the webhook that will send the spectate message. Optional.
     * @param isDialogMirror - Whether the sent webhook message is mirroring the given dialog message. Defaults to false.
     * @returns The created webhook message.
     */
    async sendDialogAsWebhook(channel: TextChannel, dialog: Dialog, webhookUsername: string = dialog.speakerDisplayName, webhookAvatarURL: string = dialog.speakerDisplayIcon, isDialogMirror = false) {
        const webhook = await messageHandler.getOrCreateWebhook(channel);
        const webhookMessage = await messageHandler.sendWebhookMessage(
            webhook,
            dialog.content,
            webhookUsername,
            webhookAvatarURL,
            dialog.embeds,
            dialog.attachments.map(attachment => attachment.url),
            dialog.getGame(),
            MessageDisplayType.PLAIN_TEXT,
            dialog.speaker
        );
        if (isDialogMirror && dialog.message) this.cacheSpectateMirrorForDialog(dialog.message, webhookMessage.id, webhook.id);
        return webhookMessage;
    }

    /**
     * Edits a message sent by the client user.
     * @param message - The message to edit.
     * @param messageText - The new text of the message.
     * @param messageDisplayType - The display type of the message to send. Defaults to STANDARD.
     */
    editMessage(message: Message, messageText: string, messageDisplayType: MessageDisplayType = MessageDisplayType.STANDARD) {
        if (!message || !message.editable || messageText === "") return;
        messageHandler.editMessage(this.#game, message, messageText, messageDisplayType);
    }

    /**
     * Deletes a message. If the message cannot be deleted, does nothing.
     * @param message - The message to delete.
     */
    async deleteMessage(message: Message) {
        if (!message || !message.deletable) return;
        await message.delete().catch();
    }
}
