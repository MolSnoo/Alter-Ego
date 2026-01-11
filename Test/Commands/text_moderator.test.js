import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from '../../Commands/text_moderator.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('text_moderator command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const text_moderator = new ModeratorCommand(config, usage, execute);
        
    test('', async () => {});
});