import PlayerCommand from '../../Classes/PlayerCommand.js';
import { usage, execute, config } from '../../Commands/unequip_player.js'
import UnequipAction from '../../Data/Actions/UnequipAction.js';
import { clearQueue } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';

describe('unequip_player command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const unequip_player = new PlayerCommand(config, usage, execute);
        
    test('given valid item', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const item = game.entityFinder.getInventoryItem("kyras glasses", "Kyra");
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        // @ts-ignore
        await unequip_player.execute(game, createMockMessage(), "unequip", ["glasses"], player);
        expect(spy).toHaveBeenCalled();
    });
});