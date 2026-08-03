// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from '../../Classes/ModeratorCommand.ts';
import { usage, execute, config } from '../../Commands/knock_moderator.js'
import KnockAction from '../../Data/Actions/KnockAction.ts';
import { clearQueue, sendQueuedMessages } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';
import { createMockModerator } from '../__mocks__/utility.ts';

describe('knock_moderator command', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        // @ts-expect-error
        moderator = createMockModerator();
    });

    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const knock_moderator = new ModeratorCommand(config, usage, execute);

    /** @type {typeof import('../../Data/Moderator.ts')} */
    let moderator;

    test('with valid exit', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const room = game.entityFinder.getRoom("suite-9");
        const exit = game.entityFinder.getExit(room, "DOOR");
        /** @type {KnockAction} */
        let context;
        const original = KnockAction.prototype.performKnock;
        const spy = vi.spyOn(KnockAction.prototype, "performKnock");
        spy.mockImplementation(function (...args) {
            context = this;
            return original.apply(this, args);
        });
        // @ts-ignore
        await knock_moderator.execute(game, createMockMessage(), "knock", ["kyra", "door"], moderator);
        expect(context.player.name).toBe(player.name);
        expect(spy).toBeInvokedWith(exit);
    });
    test('with invalid exit', async () => {
        /** @type {KnockAction} */
        let context;
        const original = KnockAction.prototype.performKnock;
        const spy = vi.spyOn(KnockAction.prototype, "performKnock");
        spy.mockImplementation(function (...args) {
            context = this;
            return original.apply(this, args);
        });
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await knock_moderator.execute(game, message, "knock", ["kyra", "invalid"], moderator);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(context).toBeUndefined();
        expect(author.send).toBeInvokedWith(`Couldn't find exit "INVALID" in the room.`);
    });
});
