// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import EligibleCommand from '../../Classes/EligibleCommand.ts';
import { usage, execute, config } from '../../Commands/play_eligible.js'
import { clearQueue } from '../../Modules/messageHandler.js';

describe('play_eligible command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const play_eligible = new EligibleCommand(config, usage, execute);
        
    test('', async () => {});
});