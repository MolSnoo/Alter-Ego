// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from "../../Classes/ModeratorCommand.ts";
import { usage, execute, config } from "../../Commands/living_moderator.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";
import { sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockModerator } from "../__mocks__/utility.ts";

describe("living_moderator command", () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        // @ts-expect-error
        moderator = createMockModerator();
    });

    const living_moderator = new ModeratorCommand(config, usage, execute);

    /** @type {typeof import('../../Data/Moderator.ts')} */
    let moderator;

    test("living_moderator execution", async () => {
        // @ts-ignore
        await living_moderator.execute(game, createMockMessage(), "living", [], moderator);
        sendQueuedMessages(game);
        /** @type {import('vitest').Mock} */
        // @ts-ignore
        const sendMock = game.guildContext.commandChannel.send;
        expect(sendMock).toHaveBeenCalledExactlyOnceWith("Living players:\nKyra Vivian Astrid Nero Asuka Luna Kiara Amadeus ???");
    });
});
