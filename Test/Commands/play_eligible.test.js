import EligibleCommand from '../../Classes/EligibleCommand.js';
import { usage, execute, config } from '../../Commands/play_eligible.js'
import { clearQueue } from '../../Modules/messageHandler.js';

describe('play_eligible command', () => {
    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const play_eligible = new EligibleCommand(config, usage, execute);
        
    test('', async () => {});
});