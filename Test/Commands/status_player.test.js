import PlayerCommand from "../../Classes/PlayerCommand.js";
import { usage, execute, config } from '../../Commands/status_player.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('status_player command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const status_player = new PlayerCommand(config, usage, execute);
        
    test('', async () => {});
});