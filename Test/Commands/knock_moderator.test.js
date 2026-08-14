// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from '../../Classes/ModeratorCommand.ts';
import { usage, execute, config } from '../../Commands/knock_moderator.js'
import KnockAction from '../../Data/Actions/KnockAction.ts';
import { clearQueue, sendQueuedMessages } from '../../Modules/messageHandler.ts';
import { createMockMessage } from '../__mocks__/libs/discord.js';
import { createMockModerator } from '../__mocks__/utility.ts';

describe('knock_moderator command', () => {
    beforeAll(async () => {
        if (!testGame.inProgress) await testGame.entityLoader.loadAll();
        // @ts-expect-error
        moderator = createMockModerator();
    });

    afterEach(async () => {
        clearQueue(testGame);
        vi.resetAllMocks();
    });

    const knock_moderator = new ModeratorCommand(config, usage, execute);

    /** @type {typeof import('../../Data/Moderator.ts')} */
    let moderator;

    test('with valid exit', async () => {
        const player = testGame.entityFinder.getPlayer("Kyra");
        const room = testGame.entityFinder.getRoom("suite-9");
        const exit = testGame.entityFinder.getExit(room, "DOOR");
        /** @type {KnockAction} */
        let context;
        const original = KnockAction.prototype.performKnock;
        const spy = vi.spyOn(KnockAction.prototype, "performKnock");
        spy.mockImplementation(function (...args) {
            // @ts-expect-error
            context = this;
            // @ts-expect-error
            return original.apply(this, args);
        });
        // @ts-ignore
        await knock_moderator.execute(testGame, createMockMessage(), "knock", ["kyra", "door"], moderator);
        expect(context.player.name).toBe(player.name);
        expect(spy).toBeInvokedWith(exit);
    });
    test('with invalid exit', async () => {
        /** @type {KnockAction} */
        let context;
        const original = KnockAction.prototype.performKnock;
        const spy = vi.spyOn(KnockAction.prototype, "performKnock");
        spy.mockImplementation(function (...args) {
            // @ts-expect-error
            context = this;
            // @ts-expect-error
            return original.apply(this, args);
        });
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await knock_moderator.execute(testGame, message, "knock", ["kyra", "invalid"], moderator);
        await sendQueuedMessages(testGame);
        expect(spy).not.toHaveBeenCalled();
        expect(context).toBeUndefined();
        expect(author.send).toBeInvokedWith(`Couldn't find exit "INVALID" in the room.`);
    });
});
