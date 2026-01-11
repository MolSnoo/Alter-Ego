import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from '../../Commands/set_moderator.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('set_moderator command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const set_moderator = new ModeratorCommand(config, usage, execute);
        
    test('', async () => {});
});