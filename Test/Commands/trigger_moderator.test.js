import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from '../../Commands/trigger_moderator.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('trigger_moderator command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const trigger_moderator = new ModeratorCommand(config, usage, execute);
        
    test('', async () => {});
});