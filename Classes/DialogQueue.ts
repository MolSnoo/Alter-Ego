// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChannelType, MessageFlags } from 'discord.js';
import StackQueue from './StackQueue.ts';
import type Game from '../Data/Game.ts';
import Dialog from '../Data/Dialog.ts';
import AnnounceAction from '../Data/Actions/AnnounceAction.ts';
import SayAction from '../Data/Actions/SayAction.ts';
import NarrateAction from '../Data/Actions/NarrateAction.ts';
import { MessageDisplayType } from '../Modules/enums.ts';

/**
 * Dialog queue system for use by the message handler.
 */
export default class DialogQueue extends StackQueue<UserMessage> {
    /** The Game this DialogQueue is attached to. */
    private game: Game;
    /** Whether or not the DialogQueue is in manual mode, that is, whether or not `process()` must be explicitly called to process incoming messages. */
    manual: boolean;
    /** Whether or not the DialogQueue is already firing. */
    private processing: boolean;

    constructor(game: Game) {
        super();
        this.game = game;
        this.manual = false;
        this.processing = false;
    }

    /** Pushes an object into the queue. O(1) operation. */
    override enqueue(value: UserMessage) {
        super.enqueue(value);
        if (!this.manual)
            this.process();
    }

    /**
     * Fully dequeues and handles every entry in the DialogQueue.
     */
    async process(): Promise<void> {
        if (this.processing)
            return;
        else
            this.processing = true;

        while (this.size() > 0) {
            const message = this.dequeue();
            if (message.channel.type !== ChannelType.GuildText) continue;
            const isInWhisperChannel = message.channel.parentId === this.game.guildContext.whisperCategoryId;
            const isInAnnouncementChannel = message.channel.id === this.game.guildContext.announcementChannel.id;
            const isInRoomChannel = this.game.guildContext.roomCategories.includes(message.channel.parentId);
            if (!isInWhisperChannel && !isInAnnouncementChannel && !isInRoomChannel) continue;
        
            await this.game.communicationHandler.cacheEmojis(message);
            this.game.communicationHandler.cacheDialog(message);
        
            const isModerator = message.member && message.member.roles.cache.has(this.game.guildContext.moderatorRole.id);
            const room = this.game.entityFinder.getRoom(message.channel.name);
            const whisper = this.game.entityFinder.getWhisperByChannelId(message.channel.id);
            const player = this.game.entityFinder.getLivingPlayerById(message.author.id);
        
            // Forwarded messages should be deleted.
            if (message.flags.has(MessageFlags.HasSnapshot)) {
                const errorMessage = `You cannot forward messages to game channels.`;
                this.game.communicationHandler.reply(message, errorMessage, true);
                continue;
            }
        
            if (player) {
                player.setOnline();
                const playerNoSpeechStatusEffects = player.getBehaviorAttributeStatusEffects("no speech");
                if (playerNoSpeechStatusEffects.length > 0) {
                    this.game.communicationHandler.sendMessageToPlayer(player, this.game.notificationGenerator.generatePlayerNoSpeechNotification(playerNoSpeechStatusEffects[0].id), false, MessageDisplayType.ALERT);
                    this.game.communicationHandler.deleteMessage(message);
                    continue;
                }
                const location = isInAnnouncementChannel || isInWhisperChannel ? player.location : room;
                const dialog = new Dialog(this.game, message, player, location, message.content, isInAnnouncementChannel, whisper, message.cleanContent);
                if (dialog.isAnnouncement) {
                    const announceAction = new AnnounceAction(this.game, message, dialog.speaker, dialog.location, false, dialog.whisper);
                    announceAction.performAnnounce(dialog);
                }
                else {
                    const sayAction = new SayAction(this.game, message, dialog.speaker, dialog.location, false, dialog.whisper);
                    sayAction.performSay(dialog);
                }
            }
            else if (isModerator && (room || whisper)) {
                const moderator = this.game.entityLoader.getOrCreateModerator(message.member);
                if (moderator.sentMessageInLatchChannel(message) && !message.content.startsWith("(")) {
                    const npc = moderator.getLatch();
                    const dialog = new Dialog(this.game, message, npc, npc.location, message.content, false, whisper, message.cleanContent);
                    const channel = whisper ? whisper.channel : npc.location.channel;
                    this.game.communicationHandler.sendDialogAsWebhook(channel, dialog, dialog.getDisplayNameForWebhook(!!whisper), dialog.getDisplayIconForWebhook(!!whisper)).then(dialogMessage => {
                        dialog.setMessage(dialogMessage);
                        const sayAction = new SayAction(this.game, dialogMessage, npc, npc.location, true, whisper);
                        sayAction.performSay(dialog);
                        this.game.communicationHandler.deleteMessage(message);
                    });
                }
                else {
                    const location = whisper ? whisper.location : room;
                    const narrateAction = new NarrateAction(this.game, message, undefined, location, false, whisper);
                    this.game.narrationHandler.sendNarrateAction(MessageDisplayType.PLAIN_TEXT, narrateAction, message.content, moderator);
                }
            }
        }

        this.processing = false;
    }
}
