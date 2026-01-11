import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from '../../Commands/clean_moderator.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('clean_moderator command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const clean_moderator = new ModeratorCommand(config, usage, execute);
        
    test('', async () => {});
});