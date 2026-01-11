import PlayerCommand from "../../Classes/PlayerCommand.js";
import { usage, execute, config } from '../../Commands/wake_player.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('wake_player command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const wake_player = new PlayerCommand(config, usage, execute);
        
    test('', async () => {});
});