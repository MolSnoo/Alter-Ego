import BotCommand from "../../Classes/BotCommand.js";
import { usage, execute, config } from '../../Commands/setpos_bot.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('setpos_bot command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const setpos_bot = new BotCommand(config, usage, execute);
        
    test('', async () => {});
});