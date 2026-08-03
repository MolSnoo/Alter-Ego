// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { createMockMessage } from "../__mocks__/libs/discord.js";
import AnnounceAction from "../../Data/Actions/AnnounceAction.ts";
import Dialog from '../../Data/Dialog.ts';
import * as messageHandler from '../../Modules/messageHandler.js';
import type Player from "../../Data/Player.ts";

describe('GameCommunicationHandler test', () => {
    let message: UserMessage;
    let player: Player;
    let spectateChannelIds: string[] = [];
	beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        player = game.entityFinder.getLivingPlayer("Kyra");
        message = createMockMessage({
            content: 'Hello.',
            member: player.member,
            author: player.member.user,
            channel: player.location.channel
        });
        spectateChannelIds = game.livingPlayers.filter(player => player.spectateChannel !== null).map(player => player.spectateChannel.id);
    });

	test('cached actions contain mirrored channels after mirrorAnnouncement', () => {
        const sendWebhookSpectateMessageSpy = vi.spyOn(messageHandler, 'sendWebhookSpectateMessage').mockImplementation(async (player, dialog, webHookUsername) => {});
		const dialog = new Dialog(game, message, player, player.location, undefined, true);
		const action = new AnnounceAction(game, message, player, player.location, false);
		for (const livingPlayer of game.livingPlayers.values())
			game.communicationHandler.mirrorDialogInSpectateChannel(livingPlayer, action, dialog);
		expect(sendWebhookSpectateMessageSpy).toHaveBeenCalledTimes(spectateChannelIds.length);
        for (const spectateChannelId of spectateChannelIds) {
            expect(action.hasBeenCommunicatedIn(spectateChannelId)).toBe(true);
        }
        sendWebhookSpectateMessageSpy.mockRestore();
	});

	test('does not exceed action cache limit and evicts oldest actions', () => {
        const sendWebhookSpectateMessageSpy = vi.spyOn(messageHandler, 'sendWebhookSpectateMessage').mockImplementation(async (player, dialog, webHookUsername) => {});
		const actionCacheLimit = 20;
		const actions: AnnounceAction[] = [];
		for (let i = 0; i < actionCacheLimit; i++) {
			actions.push(new AnnounceAction(game, message, player, player.location, false));
			const dialog = new Dialog(game, message, player, player.location, undefined, true);
			for (const livingPlayer of game.livingPlayers.values())
				game.communicationHandler.mirrorDialogInSpectateChannel(livingPlayer, actions[i], dialog);
		}

		// We should have sent messages for each initial action.
		expect(sendWebhookSpectateMessageSpy).toHaveBeenCalledTimes(actionCacheLimit * spectateChannelIds.length);

		// Re-announcing the first action should NOT trigger another message (still in cache).
		let dialog = new Dialog(game, message, player, player.location, undefined, true);
		for (const livingPlayer of game.livingPlayers.values())
			game.communicationHandler.mirrorDialogInSpectateChannel(livingPlayer, actions[0], dialog);
		expect(sendWebhookSpectateMessageSpy).toHaveBeenCalledTimes(actionCacheLimit * spectateChannelIds.length);

		// Add more actions to overflow the cache.
		for (let i = actionCacheLimit; i < actionCacheLimit + 5; i++) {
			actions.push(new AnnounceAction(game, message, player, player.location, false));
			const dialog = new Dialog(game, message, player, player.location, undefined, true);
			for (const livingPlayer of game.livingPlayers.values())
				game.communicationHandler.mirrorDialogInSpectateChannel(livingPlayer, actions[i], dialog);
		}
        expect(game.communicationHandler.getActionCache().size).toBe(actionCacheLimit);

		// Each new action should have produced a message.
		expect(sendWebhookSpectateMessageSpy).toHaveBeenCalledTimes((actionCacheLimit + 5) * spectateChannelIds.length);

		// The oldest action (actions[0]) should have been removed from the cache, but the action has already been mirrored, so it shouldn't be mirrored again.
		dialog = new Dialog(game, message, player, player.location, undefined, true);
		for (const livingPlayer of game.livingPlayers.values())
			game.communicationHandler.mirrorDialogInSpectateChannel(livingPlayer, actions[0], dialog);
		expect(sendWebhookSpectateMessageSpy).toHaveBeenCalledTimes((actionCacheLimit + 5) * spectateChannelIds.length);
        expect(game.communicationHandler.getActionCache().size).toBe(actionCacheLimit);
        sendWebhookSpectateMessageSpy.mockRestore();
	});
});
