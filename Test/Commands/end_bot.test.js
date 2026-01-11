import BotCommand from "../../Classes/BotCommand.js";
import { usage, execute, config } from '../../Commands/end_bot.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('end_bot command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const end_bot = new BotCommand(config, usage, execute);
        
    test('', async () => {});
});