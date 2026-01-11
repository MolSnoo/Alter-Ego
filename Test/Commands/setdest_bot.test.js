import BotCommand from "../../Classes/BotCommand.js";
import { usage, execute, config } from '../../Commands/setdest_bot.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('setdest_bot command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const setdest_bot = new BotCommand(config, usage, execute);
        
    test('', async () => {});
});