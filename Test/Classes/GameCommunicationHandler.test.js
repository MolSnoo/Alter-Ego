import { createMockMessage } from "../__mocks__/libs/discord.js";
import AnnounceAction from "../../Data/Actions/AnnounceAction.js";
import Dialog from '../../Data/Dialog.js';
import * as messageHandler from '../../Modules/messageHandler.js';

describe('GameCommunicationHandler test', () => {
    let message;
    let player;
    let spectateChannelIds = [];
	beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        player = game.entityFinder.getLivingPlayer("Kyra");
        message = createMockMessage({
            content: 'Hello.',
            member: player.member,
            author: player.member.user,
            channel: player.location.channel
        });
        spectateChannelIds = game.livingPlayersCollection.filter(player => player.spectateChannel !== null).map(player => player.spectateChannel.id);
    });

	test('cached actions contain mirrored channels after mirrorAnnouncement', () => {
        const sendDialogSpectateMessageSpy = vi.spyOn(messageHandler, 'sendDialogSpectateMessage').mockImplementation(async (player, dialog, webHookUsername) => {});
		const dialog = new Dialog(game, message, player, player.location, true);
		const action = new AnnounceAction(game, message, player, player.location, false);
		game.communicationHandler.mirrorAnnouncement(action, dialog);
		expect(sendDialogSpectateMessageSpy).toHaveBeenCalledTimes(spectateChannelIds.length);
        for (const spectateChannelId of spectateChannelIds) {
            expect(action.hasBeenCommunicatedIn(spectateChannelId)).toBe(true);
        }
        sendDialogSpectateMessageSpy.mockRestore();
	});

	test('does not exceed action cache limit and evicts oldest actions', () => {
        const sendDialogSpectateMessageSpy = vi.spyOn(messageHandler, 'sendDialogSpectateMessage').mockImplementation(async (player, dialog, webHookUsername) => {});
		const actionCacheLimit = 20;
		/** @type {AnnounceAction[]} */
		const actions = [];
		for (let i = 0; i < actionCacheLimit; i++) {
			actions.push(new AnnounceAction(game, message, player, player.location, false));
			game.communicationHandler.mirrorAnnouncement(actions[i], new Dialog(game, message, player, player.location, true));
		}

		// We should have sent messages for each initial action.
		expect(sendDialogSpectateMessageSpy).toHaveBeenCalledTimes(actionCacheLimit * spectateChannelIds.length);

		// Re-announcing the first action should NOT trigger another message (still in cache).
		game.communicationHandler.mirrorAnnouncement(actions[0], new Dialog(game, message, player, player.location, true));
		expect(sendDialogSpectateMessageSpy).toHaveBeenCalledTimes(actionCacheLimit * spectateChannelIds.length);

		// Add more actions to overflow the cache.
		for (let i = actionCacheLimit; i < actionCacheLimit + 5; i++) {
			actions.push(new AnnounceAction(game, message, player, player.location, false));
			game.communicationHandler.mirrorAnnouncement(actions[i], new Dialog(game, message, player, player.location, true));
		}
        expect(game.communicationHandler.getActionCache().size).toBe(actionCacheLimit);

		// Each new action should have produced a message.
		expect(sendDialogSpectateMessageSpy).toHaveBeenCalledTimes((actionCacheLimit + 5) * spectateChannelIds.length);

		// The oldest action (actions[0]) should have been removed from the cache, but the action has already been mirrored, so it shouldn't be mirrored again.
		game.communicationHandler.mirrorAnnouncement(actions[0], new Dialog(game, message, player, player.location, true));
		expect(sendDialogSpectateMessageSpy).toHaveBeenCalledTimes((actionCacheLimit + 5) * spectateChannelIds.length);
        expect(game.communicationHandler.getActionCache().size).toBe(actionCacheLimit);
        sendDialogSpectateMessageSpy.mockRestore();
	});
});