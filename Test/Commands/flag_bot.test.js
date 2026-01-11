import BotCommand from "../../Classes/BotCommand.js";
import { usage, execute, config } from '../../Commands/flag_bot.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('flag_bot command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const flag_bot = new BotCommand(config, usage, execute);

    test('', async () => {});
});
