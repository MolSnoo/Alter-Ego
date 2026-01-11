import PlayerCommand from "../../Classes/PlayerCommand.js";
import { usage, execute, config } from '../../Commands/move_player.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('move_player command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const move_player = new PlayerCommand(config, usage, execute);
        
    test('', async () => {});
});