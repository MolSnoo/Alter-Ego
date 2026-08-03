// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import PlayerCommand from "../../Classes/PlayerCommand.ts";
import { usage, execute, config } from '../../Commands/stop_player.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('stop_player command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const stop_player = new PlayerCommand(config, usage, execute);
        
    test('', async () => {});
});