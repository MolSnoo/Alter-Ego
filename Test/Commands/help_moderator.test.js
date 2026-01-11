import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from '../../Commands/help_moderator.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('help_moderator command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const help_moderator = new ModeratorCommand(config, usage, execute);
        
    test('', async () => {});
});