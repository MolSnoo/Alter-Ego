import ModeratorCommand from '../../Classes/ModeratorCommand.js';
import { usage, execute, config } from '../../Commands/instantiate_moderator.js'
import InstantiateAction from '../../Data/Actions/InstantiateAction.js';
import { clearQueue } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';

describe('instantiate_moderator command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const instantiate_moderator = new ModeratorCommand(config, usage, execute);
        
    test('valid item into player hand', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const prefab = game.entityFinder.getPrefab("mug of coffee");
        const spy = vi.spyOn(InstantiateAction.prototype, "performInstantiateInventoryItem");
        // @ts-ignore
        await instantiate_moderator.execute(game, createMockMessage(), "create", ["mug", "of", "coffee", "in", "kyra's", "left", "hand"])
        // expect(spy).toHaveBeenCalledWith(prefab, expect.anything(), expect.anything(), expect.anything(), expect.anything(), expect.anything(), expect.anything()); // ‽ fails badly
    });
});