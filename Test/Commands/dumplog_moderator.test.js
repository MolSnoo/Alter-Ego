// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from "../../Classes/ModeratorCommand.ts";
import { usage, execute, config } from "../../Commands/dumplog_moderator.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";
import { createMockModerator } from "../__mocks__/utility.ts";

describe("dumplog_moderator command", () => {
    beforeAll(() => {
        // @ts-expect-error
        moderator = createMockModerator();
    })

    const dumplog_moderator = new ModeratorCommand(config, usage, execute);

    /** @type {typeof import('../../Data/Moderator.ts')} */
    let moderator;

    test('execute', async () => {
        const mockMessage = createMockMessage();
        // @ts-ignore
        await dumplog_moderator.execute(game, mockMessage, "dumplog", [], moderator)
        expect(game.messageQueue.size()).toStrictEqual(0);
        expect(game.guildContext.commandChannel.send).toHaveBeenCalledOnce()
        // @ts-ignore
        expect(game.guildContext.commandChannel.send.mock.lastCall[0].content).toBe("Successfully generated log files.")
        // @ts-ignore
        expect(game.guildContext.commandChannel.send.mock.lastCall[0].files.length).toBe(2)
    });
});
