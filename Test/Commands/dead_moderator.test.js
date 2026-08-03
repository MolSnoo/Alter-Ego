// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from "../../Classes/ModeratorCommand.ts";
import { usage, execute, config } from "../../Commands/dead_moderator.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";
import { sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockModerator } from "../__mocks__/utility.ts";

describe("dead_moderator command", () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        // @ts-expect-error
        moderator = createMockModerator();
    });

    const dead_moderator = new ModeratorCommand(config, usage, execute);

    /** @type {typeof import('../../Data/Moderator.ts')} */
    let moderator;

    test("with dead players", async () => {
        // @ts-ignore
        await dead_moderator.execute(game, createMockMessage(), "dead", [], moderator);
        sendQueuedMessages(game);
        /** @type {import('vitest').Mock} */
        // @ts-ignore
        const sendMock = game.guildContext.commandChannel.send;
        expect(sendMock).toHaveBeenCalledExactlyOnceWith("Dead players:\nEvad Wu");
    });
});
