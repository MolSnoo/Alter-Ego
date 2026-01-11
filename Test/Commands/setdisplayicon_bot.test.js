import BotCommand from "../../Classes/BotCommand.js";
import { usage, execute, config } from '../../Commands/setdisplayicon_bot.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('setdisplayicon_bot command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const setdisplayicon_bot = new BotCommand(config, usage, execute);
        
    test('', async () => {});
});