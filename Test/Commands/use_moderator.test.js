// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModeratorCommand from "../../Classes/ModeratorCommand.ts";
import { usage, execute, config } from '../../Commands/use_moderator.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('use_moderator command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const use_moderator = new ModeratorCommand(config, usage, execute);
        
    test('', async () => {});
});