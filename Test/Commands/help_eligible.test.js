import EligibleCommand from '../../Classes/EligibleCommand.js';
import { usage, execute, config } from '../../Commands/help_eligible.js'
import { clearQueue } from '../../Modules/messageHandler.js';

describe('help_eligible command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const help_eligible = new EligibleCommand(config, usage, execute);
        
    test('', async () => {});
});