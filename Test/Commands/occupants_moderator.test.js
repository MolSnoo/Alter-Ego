import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from '../../Commands/occupants_moderator.js'
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe('occupants_moderator command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const occupants_moderator = new ModeratorCommand(config, usage, execute);
        
    test('', async () => {});
});