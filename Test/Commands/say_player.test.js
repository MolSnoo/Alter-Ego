import PlayerCommand from "../../Classes/PlayerCommand.js";
import { usage, execute, config } from '../../Commands/say_player.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('say_player command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const say_player = new PlayerCommand(config, usage, execute);
        
    test('', async () => {});
});