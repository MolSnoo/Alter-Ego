import BotCommand from "../../Classes/BotCommand.js";
import { usage, execute, config } from '../../Commands/setdisplayname_bot.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('setdisplayname_bot command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const setdisplayname_bot = new BotCommand(config, usage, execute);
        
    test('', async () => {});
});